import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  logMessage,
  successLog,
} from "../utils/helpers";
import configurations from "../config/config";

const services = configurations.getInstance().getServices();
const webhookService = services.webhookService;

/**
 * Handles incoming webhook requests, including validation token verification and processing the webhook payload.
 *
 * @param {Request} req - The Express request object containing headers, query parameters, and body data.
 * @param {Response} res - The Express response object used to send responses to the client.
 *
 * @returns {Promise<void>} - Resolves once the webhook has been processed and an appropriate response sent.
 *
 * @description
 * - Logs the incoming request body.
 * - If the request contains a `validationToken` in the query parameters, it immediately responds with that token for webhook verification.
 * - Otherwise, sends a generic success message response.
 * - Calls the webhook service handler to process the webhook payload asynchronously.
 * - Logs and handles the service response:
 *    - On success, logs a success message.
 *    - On failure, logs the error and sends a bad request response with an error message.
 * - Catches any exceptions thrown during processing, logs the error, and sends a bad request response.
 */
async function handleWehook(req: Request, res: Response): Promise<void> {
  const methodName = "Create interaction webhook";
  try {
    logMessage(`[${methodName}] Request received: ${JSON.stringify(req.body)} Query: ${JSON.stringify(req.query)} `);
    if (req.query && req.query.validationToken) {
      res.status(200).send(req.query.validationToken);
      return;
    }

    res.status(200).send({
      message: "Success"
    });

    const interaction = await webhookService.webhookHanlder(
      req.body,
    );
    logMessage(`[${methodName}] Service response: ${JSON.stringify(interaction)}`);

    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      // handleSuccessResponse(res, interaction.data);
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

export default {
  handleWehook,
};
