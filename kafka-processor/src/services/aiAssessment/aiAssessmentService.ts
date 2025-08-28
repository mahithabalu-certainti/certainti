import { Logger } from "winston";
import { Kafka, Producer } from "kafkajs";
import axios from "axios";
import { HttpStatus } from "../../utils/constants";
import { v4 as uuidv4 } from "uuid";
export class AIAssessmentService {
  private logger: Logger;
  private producer!: Producer;

  constructor(logger: Logger) {
    this.logger = logger;
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
    console.log("AI Response received in service:", aiResponse);
    try {
      const topic = process.env.KAFKA_AI_RESPONSE_TRIGGER_TOPIC || "ai_assessment_response";
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
      this.logger.info("AI response sent to Kafka topic:", {
        topic,
        aiResponse,
      });
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
    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: "",
    };
  }
  async disconnectProducer() {
    if (this.producer) {
      await this.producer.disconnect();
      this.logger.info("Kafka producer disconnected");
    }
  }
  async processKafkaMessage(message: any): Promise<void> {
    try {
      console.log("Processing Kafka message...", message);

      const parsedMessage =
        typeof message === "string" ? JSON.parse(message) : message;

      const { company_id, project_id, input_text } = parsedMessage;

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

          const payload = { company_id, project_id: id, input_text, transaction_id:transaction_id };
          for (const type of ["QRE", "QUESTION", "TECH_SUMMARY"]) {
            const payloadWithType = { ...payload, type };
            console.log("Payload to be sent:", payloadWithType);
             console.log("--------------if-------------------");
            // let callTriggerAi = await axios.post(process.env.TRIGGER_AI_URL!, payloadWithType, {
            //   headers: headers
            // });
          }
        }
      } else {
         const transaction_id = uuidv4();
        const payload = { company_id, project_id, input_text ,transaction_id};
         for (const type of ["QRE", "QUESTION", "TECH_SUMMARY"]) {
            const payloadWithType = { ...payload, type };
             console.log("Payload to be sent:", payloadWithType);
             console.log("---------------else------------------");
            // let callTriggerAi = await axios.post(process.env.TRIGGER_AI_URL!, payloadWithType, {
            //   headers: headers
            // });
          }
      }

      this.logger.info(
        `Processed Kafka message for interaction_rid: ${company_id}`
      );
    } catch (err) {
      this.logger.error("Error processing Kafka message", err);
    }
  }
}
