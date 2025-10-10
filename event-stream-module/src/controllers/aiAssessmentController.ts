import { Request, Response } from "express";
import configurations from "../config/config";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  logMessage,
  successLog,
} from "../utils/helpers";
const services = configurations.getInstance().getServices();
const aiAssessmentService = services.aiAssessmentService;

/**
 * Handles sending an AI-generated response to a specific topic.
 *
 * This Express route handler processes the incoming request containing AI response data,
 * invokes the AI assessment service to send the response to the topic, and returns
 * appropriate success or error responses based on the service outcome.
 *
 * @param {Request} req - The Express request object containing the AI response data in the body.
 * @param {Response} res - The Express response object used to send back the result of the operation.
 *
 * @returns {Promise<void>} - A promise that resolves once the response is sent.
 */
async function sendAIResponseToTopic(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Send AI response to topic";
  try {
    const value = req.body;
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    logMessage(`[${methodName}] Request received: ${JSON.stringify(value)} userId: ${value.userId}`);
    const interaction = await aiAssessmentService.sendAIResponseToTopic(value);
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

/**
 * Processes incoming Kafka messages by delegating to the AI assessment service.
 *
 * This asynchronous function receives Kafka message data, logs the start of processing,
 * and invokes the AI assessment service's method to handle the message payload.
 * Any errors encountered during processing are logged for debugging and monitoring purposes.
 *
 * @param {any} data - The Kafka message payload to be processed.
 *
 * @returns {Promise<void>} - A promise that resolves once the message has been processed or
 *                           an error has been logged.
 */
async function processKafkaMessages(data: any) {
  const methodName = "processKafkaMessages";
  try {
    logMessage(`[${methodName}] Processing Kafka messages data: ${JSON.stringify(data)}`);
    const result = await aiAssessmentService.processKafkaMessage(data);
    // Implement your Kafka message processing logic here
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
  }
}

export default {
  sendAIResponseToTopic,
  processKafkaMessages,
};
