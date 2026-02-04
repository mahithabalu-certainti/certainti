import { Sequelize, Op, QueryTypes } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { DataMapperForms, setupDataMapperFormsSequence } from "../../models/dataMapperForms";
import { uploadToAzureBlob, logMessage, errorLog, generateSasUrl, deleteFromAzureBlob } from "../../utils/helpers";
import { Kafka, Producer } from "kafkajs";
import { ENV } from "../../config/kafka";
import { MAIN_SCHEMA_NAME, HttpStatus, rawQueries } from "../../utils/constants";
import moment from "moment";
import { DataMapperFormMappings } from "../../models/dataMapperFormMappings";
import { DataMapperObjects } from "../../models/dataMapperObjects";
import { DataMapperTableMappings } from "../../models/dataMapperTableMappings";
import { DataMapperUploadStatus } from "../../models/dataMapperUploadStatus";
import { applyFilters } from "../../utils/helpers";
import { IDataMapperService } from "../interfaces/interface";
import { ColumnExtractor } from "./columnExtractorService";



export class DataMapperService implements IDataMapperService {
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
                brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
            });
            this.producer = kafka.producer();
            await this.producer.connect();
        }
        return this.producer;
    }

    async createDataMapper(data: any, file: Express.Multer.File, userId: string): Promise<{ statusCode: number; message: string; errorMessage?: string; data?: any }> {
        try {
            const sequelize = await this.getMainSequelize();

            // Initialize model
            const DataMapperModel = DataMapperForms.initialize(sequelize, MAIN_SCHEMA_NAME);
            await setupDataMapperFormsSequence(sequelize, MAIN_SCHEMA_NAME);

            const existingForm = await DataMapperModel.findOne({ where: { form_name: data.form_name } });
            if (existingForm) {
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: "Form name already exists",
                };
            }

            // Handle File Upload
            let fileUrl = "";
            let fileName = "";
            let fileSize = 0;
            let fileFormat = "";

            if (file) {
                const uploadResult = await uploadToAzureBlob(
                    file,
                    data.country_rid,
                    data.state_rid,
                    data.country_rid,
                    "data-mapper"
                );
                fileUrl = uploadResult.url;
                fileName = uploadResult.name;
                fileSize = uploadResult.size;
                fileFormat = uploadResult.extension.replace('.', '');
            } else {
                throw new Error("File is required");
            }

            const [statusResult]: any = await sequelize.query(rawQueries.getDataMapperInitiatedStatus);
            const statusRid = statusResult.length > 0 ? statusResult[0].rid : null;

            if (!statusRid) {
                throw new Error("Initiated status not found in database");
            }

            // Create DB Record
            const newRecord = await DataMapperModel.create({
                form_name: data.form_name,
                browse_file: fileUrl,
                document_name: fileName,
                effective_from_date: data.effective_from_date,
                effective_to_date: data.effective_to_date || null,
                country_rid: data.country_rid,
                state_rid: data.state_rid,
                format: fileFormat,
                size_in_mb: fileSize,
                status_rid: statusRid,
                is_active: true,
                created_by: userId,
                created_datetime: new Date()
            });

            const sasUrl = await generateSasUrl(fileUrl)

            // Send Kafka Message
            const payload = {
                data_mapper_rid: newRecord.rid,
                file_url: sasUrl,
                form_name: data.form_name,
                country_rid: data.country_rid,
                state_rid: data.state_rid,
                effective_from_date: data.effective_from_date,
                effective_to_date: data.effective_to_date,
                userId: userId
            };

            await this.sendKafkaMessage(payload);

            return {
                statusCode: 200,
                message: "Initiated successfully",
            };

        } catch (error) {
            errorLog("createDataMapper", (error as Error).message);
            throw error;
        }
    }

    async sendKafkaMessage(payload: any) {
        try {
            const topic = ENV.KAFKA_DATA_MAPPER_TOPIC;
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
            const [statusResult]: any = await sequelize.query(rawQueries.getDataMapperFailedStatus);
            const statusRid = statusResult.length > 0 ? statusResult[0].rid : null;

            if (!statusRid) {
                throw new Error("Failed status not found in database");
            }

            if (payload.data_mapper_rid) {
                await DataMapperModel.update(
                    {
                        status_rid: statusRid,
                        error_message: (error as Error).message
                    },
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

    async listDataMapperForms(
        userId: string,
        page: number = 1,
        limit: number = 10,
        search: string = '',
        filters: Record<string, any> = {},
        sortBy: string = 'created_datetime',
        sortOrder: string = 'DESC'
    ): Promise<{ statusCode: number; message: string; errorMessage?: string; data?: { items: any[]; totalCount: number } }> {
        try {
            const sequelize = await this.getMainSequelize();
            const DataMapperModel = DataMapperForms.initialize(sequelize, MAIN_SCHEMA_NAME);
            const offset = (page - 1) * limit;

            const whereClause: any = {
                [Op.and]: []
            };

            // Search
            if (search) {
                whereClause[Op.or] = [
                    { form_name: { [Op.iLike]: `%${search}%` } },
                    { r_number: { [Op.iLike]: `%${search}%` } },
                    { document_name: { [Op.iLike]: `%${search}%` } }
                ];
            }

            if (filters) {
                applyFilters(filters, whereClause);
            }

            const { count, rows } = await DataMapperModel.findAndCountAll({
                attributes: [
                    "rid",
                    "r_number",
                    "created_datetime",
                    "created_by",
                    "modified_datetime",
                    "modified_by",
                    "form_name",
                    "browse_file",
                    "document_name",
                    "effective_from_date",
                    "effective_to_date",
                    "country_rid",
                    "state_rid",
                    "format",
                    "size_in_mb",
                    "status_rid",
                    "is_active",
                    "error_message",
                    "form_type"
                ],
                where: whereClause,
                offset: 0,
                limit: Number.MAX_SAFE_INTEGER,
            });

            // Enrich with Names
            const countryRids = [...new Set(rows.map(r => r.country_rid).filter(Boolean))];
            const stateRids = [...new Set(rows.map(r => r.state_rid).filter(Boolean))];
            const statusRids = [...new Set(rows.map(r => r.status_rid).filter(Boolean))];
            const userIds = [...new Set(rows.map(r => r.created_by).filter(Boolean))];
            const modifiedByUserIds = [...new Set(rows.map(r => r.modified_by).filter(Boolean))];

            const allUserIds = [...new Set([...userIds, ...modifiedByUserIds])];

            const countryMap = new Map();
            if (countryRids.length > 0) {
                const countries: any[] = await sequelize.query(
                    rawQueries.GET_COUNTRIES,
                    { replacements: { countryRid: countryRids }, type: QueryTypes.SELECT }
                );
                countries.forEach(c => countryMap.set(c.rid, c.country_name));
            }

            const stateMap = new Map();
            if (stateRids.length > 0) {
                const states: any[] = await sequelize.query(
                    rawQueries.fetchStatesByIds(),
                    { replacements: { ids: stateRids }, type: QueryTypes.SELECT }
                );
                states.forEach(s => stateMap.set(s.rid, s.state_name));
            }

            const statusMap = new Map();
            if (statusRids.length > 0) {
                const statuses: any[] = await sequelize.query(
                    rawQueries.getDataMapperUploadStatuses,
                    { replacements: { rids: statusRids }, type: QueryTypes.SELECT }
                );
                statuses.forEach(s => statusMap.set(s.rid, s.status_name));
            }
            const userMap = new Map();
            if (allUserIds.length > 0) {
                const users: any[] = await sequelize.query(
                    rawQueries.GET_USERS,
                    { replacements: { userIds: allUserIds }, type: QueryTypes.SELECT }
                );
                users.forEach(u => userMap.set(u.rid, u.full_name));
            }

            let enrichedRows = await Promise.all(rows.map(async r => {
                const row = r.get({ plain: true });
                return {
                    ...row,
                    country_name: countryMap.get(r.country_rid) || null,
                    state_name: stateMap.get(r.state_rid) || null,
                    status_name: statusMap.get(r.status_rid) || null,
                    created_by_name: userMap.get(r.created_by) || null,
                    modified_by_name: userMap.get(r.modified_by) || null,
                    browse_file: await generateSasUrl(r.browse_file)
                };
            }));

            // Filter logic for name fields
            if (filters) {
                for (const [field, filter] of Object.entries(filters)) {
                    if (['created_by_name', 'modified_by_name'].includes(field)) {
                        if (filter && typeof filter === 'object') {
                            const operator = Object.keys(filter)[0];
                            if (!operator) continue;
                            let value = filter[operator as string];

                            enrichedRows = enrichedRows.filter((item: any) => {
                                const itemValue = item[field]?.toString().toLowerCase() || '';
                                let filterValue = (typeof value === 'string') ? value.toLowerCase() : value;

                                switch (operator.toLowerCase()) {
                                    case 'equals':
                                        return itemValue === filterValue;
                                    case 'not_equals':
                                        return itemValue !== filterValue;
                                    case 'contains':
                                        return itemValue.includes(filterValue);
                                    case 'is_empty':
                                        return !itemValue;
                                    case 'in':
                                        if (Array.isArray(value)) {
                                            return value.some((v: any) => v.toString().toLowerCase() === itemValue);
                                        }
                                        return false;
                                    default:
                                        return true;
                                }
                            });
                        }
                    }
                }
            }

            // Sorting logic
            const validSortFields = [
                'r_number', 'created_datetime', 'created_by_name', 'modified_datetime', 'modified_by_name',
                'form_name', 'browse_file', 'document_name', 'effective_from_date', 'effective_to_date',
                'country_name', 'state_name', 'format', 'size_in_mb', 'status_name', 'is_active', 'error_message'
            ];

            const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_datetime';
            const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

            enrichedRows.sort((a, b) => {
                // Handle date fields
                const dateFields = ['created_datetime', 'modified_datetime', 'effective_from_date', 'effective_to_date'];
                if (dateFields.includes(finalSortBy)) {
                    const aDate = new Date(a[finalSortBy as keyof typeof a]).getTime();
                    const bDate = new Date(b[finalSortBy as keyof typeof b]).getTime();
                    return finalSortOrder === 'ASC' ? aDate - bDate : bDate - aDate;
                }

                if (finalSortBy === 'size_in_mb') {
                    const aVal = Number(a.size_in_mb) || 0;
                    const bVal = Number(b.size_in_mb) || 0;
                    return finalSortOrder === 'ASC' ? aVal - bVal : bVal - aVal;
                }

                if (finalSortBy === 'is_active') {
                    const aVal = a.is_active ? 1 : 0;
                    const bVal = b.is_active ? 1 : 0;
                    return finalSortOrder === 'ASC' ? aVal - bVal : bVal - aVal;
                }

                // Default string sort
                const aAny = a as any;
                const bAny = b as any;
                let aVal: string = aAny[finalSortBy] !== undefined && aAny[finalSortBy] !== null ? String(aAny[finalSortBy]) : '';
                let bVal: string = bAny[finalSortBy] !== undefined && bAny[finalSortBy] !== null ? String(bAny[finalSortBy]) : '';

                aVal = aVal.trim().toLowerCase();
                bVal = bVal.trim().toLowerCase();

                const isAEmpty = !aVal;
                const isBEmpty = !bVal;

                // Ascending: empty values last
                if (finalSortOrder === 'ASC') {
                    if (isAEmpty && !isBEmpty) return 1;
                    if (!isAEmpty && isBEmpty) return -1;
                    return aVal.localeCompare(bVal);
                }

                // Descending: empty values first
                else {
                    if (isAEmpty && !isBEmpty) return -1;
                    if (!isAEmpty && isBEmpty) return 1;
                    return bVal.localeCompare(aVal);
                }
            });

            return {
                statusCode: 200,
                message: "Success",
                data: {
                    items: enrichedRows.slice(offset, offset + limit),
                    totalCount: enrichedRows.length
                }
            };

        } catch (error) {
            errorLog("listDataMapperForms", (error as Error).message);
            throw error;
        }
    }

    async getDataMapperFormsDetail(userId: string, rid: string): Promise<{ statusCode: number; message: string; errorMessage?: string; data?: any }> {
        try {
            const sequelize = await this.getMainSequelize();

            const [formDetail] = await sequelize.query<any>(
                rawQueries.getDataMapperFormsById(rid),
                { type: QueryTypes.SELECT }
            );

            if (!formDetail) {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: "Record not found",
                    data: null
                };
            }

            formDetail.browse_file = await generateSasUrl(formDetail.browse_file)

            return {
                statusCode: 200,
                message: "Success",
                data: formDetail
            };

        } catch (error) {
            errorLog("getDataMapperFormsDetail", (error as Error).message);
            throw error;
        }
    }

    async getDataMapperFormsMappingDetail(userId: string, rid: string): Promise<{ statusCode: number; message: string; errorMessage?: string; data?: any }> {
        try {
            const sequelize = await this.getMainSequelize();

            const DataMapperFormMappingsModel = DataMapperFormMappings.initialize(sequelize, MAIN_SCHEMA_NAME);

            const [formDetail] = await sequelize.query<any>(
                rawQueries.getDataMapperFormsById(rid),
                { type: QueryTypes.SELECT }
            );

            if (!formDetail) {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: "Record not found",
                    data: null
                };
            }

            let sasUrl = await generateSasUrl(formDetail.browse_file)

            // Convert file to base64
            let base64File = null;
            if (sasUrl) {
                try {
                    // Fetch the file from the SAS URL
                    const response = await fetch(sasUrl);
                    if (response.ok) {
                        const buffer = await response.arrayBuffer();

                        // Convert ArrayBuffer to base64
                        base64File = Buffer.from(buffer).toString('base64');
                    }

                } catch (fetchError) {
                    errorLog("getDataMapperFormsDetail - File fetch error", (fetchError as Error).message);
                }
            }

            const mappings = await DataMapperFormMappingsModel.findAll({
                where: {
                    form_rid: rid
                },
                order: [
                    ['extraction_order', 'ASC']
                ]
            });

            if (!mappings) {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: "Mapping not found",
                    data: null
                };
            }

            return {
                statusCode: 200,
                message: "Success",
                data: {
                    formDetail,
                    mappings,
                    base64File
                }
            };

        } catch (error) {
            errorLog("getDataMapperFormsDetail", (error as Error).message);
            throw error;
        }
    }

    async editDataMapper(data: any, file: Express.Multer.File | undefined, userId: string): Promise<{ statusCode: number; message: string; errorMessage?: string; data?: { rid: string } }> {
        try {
            const sequelize = await this.getMainSequelize();
            const DataMapperModel = DataMapperForms.initialize(sequelize, MAIN_SCHEMA_NAME);

            // Fetch existing record
            const record = await DataMapperModel.findOne({ where: { rid: data.rid } });

            if (!record) {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: "Record not found",
                };
            }

            if (data.form_name) {
                const existingForm = await DataMapperModel.findOne({
                    where: {
                        form_name: data.form_name,
                        rid: { [Op.ne]: data.rid }
                    }
                });

                if (existingForm) {
                    return {
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: "Form name already exists",
                    };
                }
            }

            const updatePayload: any = {
                modified_by: userId,
                modified_datetime: new Date()
            };

            // Update fields if provided
            if (data.form_name) updatePayload.form_name = data.form_name;
            if (data.effective_from_date) updatePayload.effective_from_date = data.effective_from_date;
            if (data.effective_to_date !== undefined) updatePayload.effective_to_date = data.effective_to_date || null;
            if (data.country_rid) updatePayload.country_rid = data.country_rid;
            if (data.state_rid !== undefined) updatePayload.state_rid = data.state_rid;
            if (data.is_active !== undefined) updatePayload.is_active = data.is_active;

            let shouldTriggerKafka = false;
            let fileSasUrl = "";

            if (file) {
                // Determine country and state for upload path (use new values or fallback to existing)
                const countryRid = data.country_rid || record.country_rid;
                const stateRid = data.state_rid || record.state_rid;

                const uploadResult = await uploadToAzureBlob(
                    file,
                    countryRid,
                    stateRid,
                    countryRid,
                    "data-mapper"
                );

                if (record.browse_file) {
                    await deleteFromAzureBlob(record.browse_file);
                }

                updatePayload.browse_file = uploadResult.url;
                updatePayload.document_name = uploadResult.name;
                updatePayload.size_in_mb = uploadResult.size;
                updatePayload.format = uploadResult.extension.replace('.', '');

                // Reset status to Initiated
                const [statusResult]: any = await sequelize.query(rawQueries.getDataMapperInitiatedStatus);
                const statusRid = statusResult.length > 0 ? statusResult[0].rid : null;

                if (statusRid) {
                    updatePayload.status_rid = statusRid;
                }

                // Prepare for Kafka
                shouldTriggerKafka = true;
                fileSasUrl = await generateSasUrl(uploadResult.url);
            }

            // Update Record
            await DataMapperModel.update(updatePayload, { where: { rid: data.rid } });

            // If file uploaded, send Kafka message
            if (shouldTriggerKafka) {
                const updatedRecord = await DataMapperModel.findOne({ where: { rid: data.rid } });
                const kafkaPayload = {
                    data_mapper_rid: data.rid,
                    file_url: fileSasUrl,
                    form_name: updatedRecord?.form_name,
                    country_rid: updatedRecord?.country_rid,
                    state_rid: updatedRecord?.state_rid,
                    effective_from_date: updatedRecord?.effective_from_date,
                    effective_to_date: updatedRecord?.effective_to_date,
                    userId: userId
                };

                await this.sendKafkaMessage(kafkaPayload);
            }

            return {
                statusCode: 200,
                message: shouldTriggerKafka ? "Initiated successfully" : "Record updated successfully",
                data: { rid: data.rid }
            };

        } catch (error) {
            errorLog("editDataMapper", (error as Error).message);
            throw error;
        }
    }

    async editDataMapperMapping(data: any, userId: string): Promise<{ statusCode: number; message: string; errorMessage?: string; data?: { rid: string } }> {
        try {
            const sequelize = await this.getMainSequelize();
            const DataMapperFormMappingsModel = DataMapperFormMappings.initialize(sequelize, MAIN_SCHEMA_NAME);
            const DataMapperTableMappingsModel = DataMapperTableMappings.initialize(sequelize, MAIN_SCHEMA_NAME);

            const [result] = await sequelize.query<any>(
                rawQueries.getFieldArrayByFormRid(data.rid),
                { type: QueryTypes.SELECT }
            );

            const fieldList = result ? result.field_array : [];

            if (data.mappings && data.mappings.length > 0) {

                await DataMapperTableMappingsModel.destroy({
                    where: {
                        form_rid: data.rid
                    }
                });

                for (const mapping of data.mappings) {

                    let columnRid = null;

                    if (mapping.field_type === "table") {
                        if (mapping.field_id) {
                            const columnFieldIds = ColumnExtractor.getColumnFieldIds(fieldList, mapping.field_id);

                            const columnFieldIdsData: any = {};
                            for (let idx = 1; idx < columnFieldIds.length + 1; idx++) {
                                columnFieldIdsData[idx] = columnFieldIds[idx - 1];
                            }

                            const newTableMap = await DataMapperTableMappingsModel.create({
                                form_rid: data.rid,
                                column_id_list: columnFieldIdsData,
                                created_by: userId,
                                created_datetime: new Date()
                            });
                            columnRid = newTableMap.rid;

                        }
                    }

                    await DataMapperFormMappingsModel.update({
                        modified_by: userId,
                        modified_datetime: new Date(),
                        field_id: mapping.field_id,
                        calculation_config: mapping.calculation_config,
                        column_id: columnRid
                    }, {
                        where: {
                            rid: mapping.rid
                        }
                    })
                }
            }

            return {
                statusCode: 200,
                message: "Record updated successfully",
                data: { rid: data.rid }
            };

        } catch (error) {
            errorLog("editDataMapperMapping", (error as Error).message);
            throw error;
        }
    }

    async updateInlineGraphqlDetailsForDataMapper(data: any): Promise<{ statusCode: number; statusMessage?: string; message?: string; errorMessage?: string; data?: any }> {
        try {
            const sequelize = await this.getMainSequelize();
            const DataMapperModel = DataMapperForms.initialize(sequelize, MAIN_SCHEMA_NAME);

            logMessage(`Updating inline GraphQL details for data mapper: ${JSON.stringify(data)}`);

            // Validate record exists
            const record = await DataMapperModel.findOne({ where: { rid: data.rid } });

            if (!record) {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    statusMessage: "Record not found",
                    data: null,
                };
            }

            if (data.form_name !== undefined) {
                const existingForm = await DataMapperModel.findOne({
                    where: {
                        form_name: data.form_name,
                        rid: { [Op.ne]: data.rid }
                    }
                });

                if (existingForm) {
                    return {
                        statusCode: HttpStatus.BAD_REQUEST,
                        statusMessage: "Form name already exists",
                        data: null,
                    };
                }
            }

            const updatePayload: any = {
                modified_by: data.userId,
                modified_datetime: new Date()
            };

            // Update fields if provided
            if (data.form_name !== undefined) updatePayload.form_name = data.form_name;
            if (data.effective_from_date !== undefined) updatePayload.effective_from_date = data.effective_from_date;
            if (data.effective_to_date !== undefined) updatePayload.effective_to_date = data.effective_to_date || null;
            if (data.country_rid !== undefined) updatePayload.country_rid = data.country_rid;
            if (data.state_rid !== undefined) updatePayload.state_rid = data.state_rid;
            if (data.is_active !== undefined) updatePayload.is_active = data.is_active;

            // Validate dates
            const newStartDate = data.effective_from_date ? new Date(data.effective_from_date) : (record.effective_from_date ? new Date(record.effective_from_date) : null);
            let newEndDate: Date | null = null;
            if (data.effective_to_date !== undefined) {
                const val = data.effective_to_date || null;
                newEndDate = val ? new Date(val) : null;
            } else {
                newEndDate = record.effective_to_date ? new Date(record.effective_to_date) : null;
            }

            if (newStartDate && newEndDate && newStartDate > newEndDate) {
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    statusMessage: "Effective From Date cannot be greater than Effective To Date",
                    data: null,
                };
            }

            // Update Record
            await DataMapperModel.update(updatePayload, { where: { rid: data.rid } });

            // Fetch updated record with enrichments
            const [formDetail] = await sequelize.query<any>(
                rawQueries.getDataMapperFormsById(data.rid),
                { type: QueryTypes.SELECT }
            );

            if (!formDetail) {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: "Record not found",
                    data: null
                };
            }

            formDetail.browse_file = await generateSasUrl(formDetail.browse_file)


            return {
                statusCode: HttpStatus.SUCCESS,
                statusMessage: "Data Mapper updated successfully",
                data: formDetail,
            };

        } catch (error: any) {
            logMessage(`Error updating data mapper inline: ${error.message}`);
            return {
                statusCode: HttpStatus.FAILED,
                statusMessage: "Failed to update data mapper",
                data: null,
            };
        }
    }

    async getObjectsList(data: any): Promise<{ statusCode: number; message: string; errorMessage?: string; data?: any }> {
        try {
            const sequelize = await this.getMainSequelize();

            const DataMapperObjectsModel = DataMapperObjects.initialize(sequelize, MAIN_SCHEMA_NAME);

            // Build the where conditions based on requirements
            const whereConditions = [];

            // ALWAYS include global objects (country_rid: null, state_rid: null)
            whereConditions.push({
                [Op.and]: [
                    { country_rid: null },
                    { state_rid: null }
                ]
            });

            if (data.country_rid && data.state_rid) {
                // Add state-specific objects
                whereConditions.push({
                    [Op.and]: [
                        { country_rid: data.country_rid },
                        { state_rid: data.state_rid }
                    ]
                });
            }
            // If country_rid is provided
            else if (data.country_rid) {
                // Add country-specific objects with state_rid: null
                whereConditions.push({
                    [Op.and]: [
                        { country_rid: data.country_rid },
                        { state_rid: null }
                    ]
                });
            }


            const objectsList = await DataMapperObjectsModel.findAll({
                where: {
                    [Op.or]: whereConditions
                }
            });

            if (!objectsList) {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: "Objects not found",
                    data: null
                };
            }

            return {
                statusCode: 200,
                message: "Success",
                data: objectsList
            };

        } catch (error) {
            errorLog("getDataMapperFormsDetail", (error as Error).message);
            throw error;
        }
    }

    async listDataMapperUploadStatus(): Promise<{ statusCode: number; message: string; errorMessage?: string; data?: any }> {
        try {
            const sequelize = await this.getMainSequelize();
            const DataMapperUploadStatusModel = DataMapperUploadStatus.initialize(sequelize, MAIN_SCHEMA_NAME);

            const statusList = await DataMapperUploadStatusModel.findAll();

            return {
                statusCode: 200,
                message: "Success",
                data: statusList
            };

        } catch (error) {
            errorLog("listDataMapperUploadStatus", (error as Error).message);
            throw error;
        }
    }
}



