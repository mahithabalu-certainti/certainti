import { Logger } from "winston";
import { Kafka, Producer } from "kafkajs";
import axios from "axios";
import { HttpStatus, rawQueries } from "../../utils/constants";
import { v4 as uuidv4 } from "uuid";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Sequelize } from "sequelize";
import { errorLog, logMessage } from "../../utils/helpers";
import WebSocketManager from "../webSocketManager";
export class AIAssessmentService {
  private logger: Logger;
  private producer!: Producer;
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private wsManager: WebSocketManager;

  constructor(logger: Logger) {
    this.logger = logger;
    this.wsManager = WebSocketManager.getInstance();
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
      logMessage("Kafka producer connected");
    }
  }

  /**
   * Sends the AI response payload to a designated Kafka topic.
   *
   * This asynchronous function serializes the provided AI response object and sends it as a message
   * to a Kafka topic, specified by an environment variable or a default topic name.
   * It ensures that the Kafka producer is initialized before sending the message.
   * Logs information on successful send and captures errors, returning appropriate status codes and messages.
   *
   * @param {any} aiResponse - The AI response data to be sent to Kafka.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: string;
   * }>} - A promise resolving to an object indicating success or failure of the send operation,
   *          including error messages when applicable.
   *
   * @throws Will not throw errors but instead returns failure info in the response object.
   */
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

       const { company_id, project_id, transaction_id } = aiResponse.data || aiResponse;
       logMessage(`AI Response Type: ${aiResponse?.data?.type}`);
    
      // Check if message type is refine_summary and send via WebSocket
      if (aiResponse?.data?.type === "refine_summary") {
        logMessage(`Detected refine_summary message type, sending via WebSocket`);
        if (company_id && project_id) {
          // Send to specific assessment room
          this.wsManager.sendRefinementPrompt(transaction_id, aiResponse);
          logMessage(`AI response sent to WebSocket room: assessment_${company_id}_${project_id}`);
        } else {
          logMessage(`Missing company_id or project_id in refine_summary message: ${JSON.stringify(aiResponse)}`);
        }
        
        // Still return success for refine_summary type
        return {
          statusCode: HttpStatus.SUCCESS,
          message: "AI response sent via WebSocket",
          data: "",
        };
      }
      
      // For all other message types, continue with normal Kafka flow
      if (!this.producer) {
        await this.initProducer();
      }
      await this.producer.send({
        topic,
        messages: [message],
      });
      logMessage(`AI response sent to Kafka topic: ${topic}`);
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: "",
      };
    } catch (error) {
      logMessage(`Failed to send AI response to Kafka topic: ${error}`);
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
     logMessage("Kafka producer disconnected");
    }
  }

  async createAuditLogEntry(
    transaction_id: string,
    company_id: string,
    project_id: string,
    input_text: string,
    account_number: string,
    ai_assessment_api_status: string
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
    await orgDb?.query(rawQueries.insertAuditLogEntry(schemaName), {
      replacements: [
        transaction_id,
        company_id,
        project_id,
        process.env.SYSTEM_USER_ID!,
        ai_assessment_api_status,
      ],
    });
  }

  /**
   * Processes an incoming Kafka message by parsing it and triggering AI processing calls.
   *
   * This asynchronous function accepts a Kafka message payload, parses it if necessary,
   * validates required fields (`company_id` or `project_id`), and for each project ID (or single project),
   * sends a request to an external AI service endpoint to trigger AI processing.
   * Each AI call is logged and audit log entries are created with relevant details including transaction IDs.
   *
   * @param {any} message - The Kafka message payload, either as a JSON string or object.
   *
   * @returns {Promise<void>} - Resolves once all AI trigger requests and audit logging have completed.
   */
  async processKafkaMessage(message: any): Promise<void> {
    try {
      this.logger.info("Processing Kafka message...", JSON.stringify(message));
      const parsedMessage =
        typeof message === "string" ? JSON.parse(message) : message;

      const { company_id, project_id, input_text, account_number } =
        parsedMessage;

      if (!company_id && !project_id) {
        logMessage(
          `Kafka message missing required fields: ${JSON.stringify(parsedMessage)}`
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
          let callTriggerAi = await axios.post(
            process.env.TRIGGER_AI_URL!,
            payload,
            {
              headers: headers,
            }
          );
          this.logger.info(
            `Trigger AI Response: ${JSON.stringify(callTriggerAi.data)}`
          );
          await this.createAuditLogEntry(
            transaction_id,
            company_id,
            id,
            input_text,
            account_number,
            `${callTriggerAi?.data?.statusCode || ""} - ${
              callTriggerAi?.data?.statusMessage || ""
            }`
          );
        }
      } else {
        const transaction_id = uuidv4();
        const payload = { company_id, project_id, input_text, transaction_id };

        this.logger.info(`Trigger AI payload: ${JSON.stringify(payload)}`);
        let callTriggerAi = await axios.post(
          process.env.TRIGGER_AI_URL!,
          payload,
          {
            headers: headers,
          }
        );
        this.logger.info(
          `Trigger AI Response: ${JSON.stringify(callTriggerAi.data)}`
        );
        await this.createAuditLogEntry(
          transaction_id,
          company_id,
          project_id,
          input_text,
          account_number,
          `${callTriggerAi?.data?.statusCode || ""} - ${
            callTriggerAi?.data?.statusMessage || ""
          }`
        );
      }
    } catch (err) {
      logMessage(`Error processing Kafka message: ${JSON.stringify(err)}`);
    }
  }
}
