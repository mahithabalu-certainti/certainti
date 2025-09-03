import { Logger } from "winston";
import { Kafka, Producer } from "kafkajs";
import axios from "axios";
import { HttpStatus, rawQueries } from "../../utils/constants";
import { v4 as uuidv4 } from "uuid";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Sequelize } from "sequelize";
export class AIAssessmentService {
  private logger: Logger;
  private producer!: Producer;
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  
  constructor(logger: Logger) {
    this.logger = logger;
  }
  private async getMainDb() {
    if (!this.mainDbSequelize)
      this.mainDbSequelize = await initMainDbSequelize();
    return this.mainDbSequelize;
  }
  private async getOrgDb() {
    if (!this.orgDbSequelize) this.orgDbSequelize = await initOrgSequelize();
    return this.orgDbSequelize;
  }

  async initProducer(
    brokers: string[] = [process.env.KAFKA_BROKER || "kafka:9092"],
    clientId: string = "my-app"
  ) {
    if (!this.producer) {
      const kafka = new Kafka({ clientId, brokers });
      this.producer = kafka.producer();
      await this.producer.connect();
      this.logger.info("Kafka producer connected");
    }
  }

  async sendAIResponseToTopic(aiResponse: any): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: string;
  }> {
    try {
      const topic =
        process.env.KAFKA_AI_RESPONSE_TRIGGER_TOPIC || "ai_assessment_response";
      const message = {
        value: JSON.stringify(aiResponse),
      };
      if (!this.producer) {
        await this.initProducer();
      }
      await this.producer.send({
        topic,
        messages: [message],
      });
      this.logger.info("AI response sent to Kafka topic:", topic);
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: "",
      };
    } catch (error) {
      this.logger.error("Failed to send AI response to Kafka topic:", {
        error,
      });
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Failed to send AI response to Kafka topic",
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }
  async disconnectProducer() {
    if (this.producer) {
      await this.producer.disconnect();
      this.logger.info("Kafka producer disconnected");
    }
  }
  async createAuditLogEntry(
    transaction_id: string,
    company_id: string,
    project_id: string,
    input_text: string,
    account_number: string
  ) {
    // Implementation for creating an audit log entry
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    let fetchParentAccount: any = await mainDb.query(
      await rawQueries.fetchParentAccount(company_id, mainDb)
    );
    let schemaName = rawQueries.fetchSchemaName(
      fetchParentAccount[0][0].r_number
    );

    await orgDb?.transaction(async (transaction) => {
      await orgDb?.query(rawQueries.insertAuditLogEntry(schemaName), {
        replacements: [
          transaction_id,
          company_id,
          project_id,
          process.env.SYSTEM_USER_ID!,
        ],
        transaction,
      });
    });
  }
  async processKafkaMessage(message: any): Promise<void> {
    try {
      this.logger.info("Processing Kafka message...", message);

      const parsedMessage =
        typeof message === "string" ? JSON.parse(message) : message;

      const { company_id, project_id, input_text, account_number } =
        parsedMessage;

      if (!company_id && !project_id) {
        this.logger.error(
          "Kafka message missing required fields",
          parsedMessage
        );
        return;
      }
      let headers = {
        contentType: "application/json",
      };
      if (Array.isArray(project_id)) {
        for (const id of project_id) {
          const transaction_id = uuidv4();
         
          const payload = {
            company_id,
            project_id: id,
            input_text,
            transaction_id: transaction_id,
          };
          this.logger.info(`Trigger AI payload: ${JSON.stringify(payload)}`);
           let callTriggerAi = await axios.post(process.env.TRIGGER_AI_URL!, payload, {
                headers: headers
            });
           await this.createAuditLogEntry(
            transaction_id,
            company_id,
            id,
            input_text,
            account_number
          );
          this.logger.info(`Trigger AI Response: ${JSON.stringify(callTriggerAi)}`);
        }
      } else {
        const transaction_id = uuidv4();
        const payload = { company_id, project_id, input_text, transaction_id };
       
        this.logger.info(`Trigger AI payload: ${JSON.stringify(payload)}`);
          let callTriggerAi = await axios.post(process.env.TRIGGER_AI_URL!, payload, {
                headers: headers
          });
         await this.createAuditLogEntry(
          transaction_id,
          company_id,
          project_id,
          input_text,
          account_number
        );
         this.logger.info(`Trigger AI Response: ${JSON.stringify(callTriggerAi)}`);
      }
    } catch (err) {
      console.log(err);
      this.logger.error("Error processing Kafka message", err);
    }
  }
}
