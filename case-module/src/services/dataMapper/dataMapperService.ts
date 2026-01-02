import { Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { DataMapperForms, setupDataMapperFormsSequence } from "../../models/dataMapperForms";
import { uploadToAzureBlob, logMessage, errorLog } from "../../utils/helpers";
import { Kafka, Producer } from "kafkajs";
import { MAIN_SCHEMA_NAME } from "../../utils/constants";
import moment from "moment";

export class DataMapperService {
    private producer!: Producer;
    private mainDbSequelize: Sequelize | null = null;

    async getMainSequelize(): Promise<Sequelize> {
        if (!this.mainDbSequelize) {
            this.mainDbSequelize = await initMainDbSequelize();
        }
        return this.mainDbSequelize;
    }

    private async getProducer(): Promise<Producer> {
        if (!this.producer) {
            const kafka = new Kafka({
                clientId: "case-module",
                brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
            });
            this.producer = kafka.producer();
            await this.producer.connect();
        }
        return this.producer;
    }

    async createDataMapper(data: any, file: Express.Multer.File, userId: string): Promise<any> {
        try {
            const sequelize = await this.getMainSequelize();

            // Initialize model
            const DataMapperModel = DataMapperForms.initialize(sequelize, MAIN_SCHEMA_NAME);
            await setupDataMapperFormsSequence(sequelize, MAIN_SCHEMA_NAME);

            // Handle File Upload
            let fileUrl = "";
            let fileName = "";
            let fileSize = 0;
            let fileFormat = "";

            if (file) {
                const uploadResult = await uploadToAzureBlob(
                    file,
                    "main",
                    "",
                    "data-mapper",
                    "data-mapper"
                );
                fileUrl = uploadResult.url;
                fileName = uploadResult.name;
                fileSize = uploadResult.size;
                fileFormat = uploadResult.extension.replace('.', '');
            } else {
                throw new Error("File is required");
            }

            const statusQuery = `SELECT rid FROM ${MAIN_SCHEMA_NAME}.data_mapper_upload_status WHERE status_name = 'Initiated' LIMIT 1`;
            const [statusResult]: any = await sequelize.query(statusQuery);
            const statusRid = statusResult.length > 0 ? statusResult[0].rid : null;

            if (!statusRid) {
                throw new Error("Initiated status not found in database");
            }

            // Create DB Record
            const newRecord = await DataMapperModel.create({
                form_name: data.form_name,
                browse_file: fileUrl,
                document_name: fileName,
                fiscal_year: data.fiscal_year,
                country_rid: data.country_rid,
                state_rid: data.state_rid,
                format: fileFormat,
                size_in_mb: fileSize,
                status_rid: statusRid,
                is_active: true,
                created_by: userId,
                created_datetime: new Date()
            });

            // Send Kafka Message
            const payload = {
                data_mapper_rid: newRecord.rid,
                file_url: fileUrl,
                form_name: data.form_name,
                country_rid: data.country_rid,
                fiscal_year: data.fiscal_year,
                userId: userId
            };

            await this.sendKafkaMessage(payload);

            return {
                statusCode: 200,
                message: "Process Initiated",
                data: newRecord
            };

        } catch (error) {
            errorLog("createDataMapper", (error as Error).message);
            throw error;
        }
    }

    async sendKafkaMessage(payload: any) {
        try {
            const topic = process.env.KAFKA_DATA_MAPPER_TOPIC || "data_mapper_request";
            const producer = await this.getProducer();

            logMessage(`Sending Kafka message to ${topic}: ${JSON.stringify(payload)}`);

            await producer.send({
                topic,
                messages: [{ value: JSON.stringify(payload) }],
            });

        } catch (error) {
            errorLog("sendKafkaMessage", (error as Error).message);

            const sequelize = await this.getMainSequelize();

            // Initialize model
            const DataMapperModel = DataMapperForms.initialize(sequelize, MAIN_SCHEMA_NAME);
            await setupDataMapperFormsSequence(sequelize, MAIN_SCHEMA_NAME);

            // Fetch status RID for 'Active'
            const statusQuery = `SELECT rid FROM ${MAIN_SCHEMA_NAME}.data_mapper_upload_status WHERE status_name = 'Failed' LIMIT 1`;
            const [statusResult]: any = await sequelize.query(statusQuery);
            const statusRid = statusResult.length > 0 ? statusResult[0].rid : null;

            if (!statusRid) {
                throw new Error("Failed status not found in database");
            }

            if (payload.data_mapper_rid) {
                await DataMapperModel.update(
                    { status_rid: statusRid },
                    {
                        where: { rid: payload.data_mapper_rid }
                    }
                );
                logMessage(`Updated Data Mapper record ${payload.data_mapper_rid} status to Failed`);
            } else {
                errorLog("sendKafkaMessage", "Cannot update status: data_mapper_rid missing in payload");
            }
        }
    }
}
