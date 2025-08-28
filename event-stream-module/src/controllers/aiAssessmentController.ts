import { Request, Response } from "express";
import configurations from "../config/config";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
} from "../utils/helpers";
const services = configurations.getInstance().getServices();
const aiAssessmentService = services.aiAssessmentService;
async function sendAIResponseToTopic(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Send AI response to topic";
  try {
    console.log(`[${methodName}] Request received`, JSON.stringify(req.body));
    const value = req.body;
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const interaction = await aiAssessmentService.sendAIResponseToTopic(value);
    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(interaction)
    );
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interaction.data);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interaction.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}
async function processKafkaMessages(data: any) {
  const methodName = "processKafkaMessages";
  try {
    console.log(`[${methodName}] Processing Kafka messages`);
    const result = await aiAssessmentService.processKafkaMessage(data);
    // Implement your Kafka message processing logic here
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    console.log(`[${methodName}] Exception:`, error);
  }
}
export default {
  sendAIResponseToTopic,
  processKafkaMessages,
};
