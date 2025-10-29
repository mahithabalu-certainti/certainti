import { Request, Response } from "express";
import {
  errorLog,
  handleCustomResponse,
  handleErrorResponse,
  handleSuccessResponse,
  logMessage,
  successLog,
  validateRequest,
} from "../utils/helpers";
import { HttpStatus } from "../utils/constants";
import { createCaseSchema, updateCaseSchema } from "../lib/joi/schemas/schema";
import configurations from "../config/config";

const services = configurations.getInstance().getServices();
const caseService = services.caseService;
/**
 * Handles the creation of a new case based on the incoming HTTP request.
 *
 * This async function validates the request body against a schema, extracts the user ID from headers,
 * and calls the case service to create a new case with the provided data.
 * It sends back appropriate success or error responses based on the service outcome.
 *
 * @param {Request} req - Express request object containing case data in the body and user ID in headers.
 * @param {Response} res - Express response object used to send back the operation result.
 *
 * @returns {Promise<void>} - Resolves after sending the response to the client.
 *
 * @throws {Error} - Throws if the request validation fails or the case service encounters an error.
 */
async function createCases(req: Request, res: Response): Promise<void> {
  const methodName = "Create case";
  try {
    logMessage(
      `[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${
        req.headers["x-user-id"]
      }`
    );
    const value = await validateRequest(req, createCaseSchema, res);
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const interaction = await caseService.createCase(value, userId);
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, interaction.data, interaction.message);
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
 * Handles the updating of an existing case based on the incoming HTTP request.
 *
 * This async function validates the request body against a schema, extracts the user ID from headers,
 * and calls the case service to update an existing case with the provided data.
 * It sends back appropriate success or error responses based on the service outcome.
 *
 * @param {Request} req - Express request object containing updated case data in the body and user ID in headers.
 * @param {Response} res - Express response object used to send back the operation result.
 *
 * @returns {Promise<void>} - Resolves after sending the response to the client.
 *
 * @throws {Error} - Throws if the request validation fails or the case service encounters an error.
 */
async function updateCases(req: Request, res: Response): Promise<void> {
  const methodName = "Update case";
  try {
    logMessage(
      `[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${
        req.headers["x-user-id"]
      }`
    );
    const value = await validateRequest(req, updateCaseSchema, res);
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const response = await caseService.updateCase(value, userId);
    if (response.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, response.data, response.message);
      return;
    } else {
      errorLog(methodName, response.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        response.errorMessage
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
 * Retrieves the list of available case filing types from the system.
 *
 * This controller method performs the following steps:
 * 1. Calls the `getCaseFilingType` method from the `caseService`, which fetches all defined case filing types.
 * 2. If the service responds with success, logs the success event and sends an HTTP 200 response with the filing type data.
 * 3. If the service responds with a failure status code, logs the error and returns a `BAD_REQUEST` response with the error message.
 * 4. Handles and logs any unexpected exceptions and returns a generic `BAD_REQUEST` response with the exception message.
 *
 * @param {Request} req - Express request object (not used directly in this function).
 * @param {Response} res - Express response object used to send the HTTP response with filing type data.
 *
 * @returns {Promise<void>} - A Promise that resolves after the HTTP response is sent.
 *
 * @description
 * - Used for populating dropdown options in the frontend for case filing type selection.
 * - Returns all available filing types that can be assigned to cases.
 * - Provides standardized error handling and logging for debugging purposes.
 */
async function getCaseFilingType(req: Request, res: Response): Promise<void> {
  const methodName = "Get Case Filing Type";
  try {
    const caseFilingType = await caseService.getCaseFilingType();
    if (caseFilingType.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, caseFilingType.data);
      return;
    } else {
      errorLog(methodName, caseFilingType.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        caseFilingType.errorMessage
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
 * Retrieves the list of available case statuses from the system.
 *
 * This controller method performs the following steps:
 * 1. Calls the `getCaseStatus` method from the `caseService`, which fetches all defined case statuses.
 * 2. If the service responds with success, logs the success event and sends an HTTP 200 response with the status data.
 * 3. If the service responds with a failure status code, logs the error and returns a `BAD_REQUEST` response with the error message.
 * 4. Handles and logs any unexpected exceptions and returns a generic `BAD_REQUEST` response with the exception message.
 *
 * @param {Request} req - Express request object (not used directly in this function).
 * @param {Response} res - Express response object used to send the HTTP response with case status data.
 *
 * @returns {Promise<void>} - A Promise that resolves after the HTTP response is sent.
 *
 * @description
 * - Used for populating dropdown options in the frontend for case status selection.
 * - Returns all available statuses that can be assigned to cases (e.g., In Progress, Completed, On Hold).
 * - Provides standardized error handling and logging for debugging purposes.
 * - Essential for case workflow management and status tracking.
 */
async function getCaseStatus(req: Request, res: Response): Promise<void> {
  const methodName = "Get Case Status";
  try {
    const caseStatus = await caseService.getCaseStatus();
    if (caseStatus.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, caseStatus.data);
      return;
    } else {
      errorLog(methodName, caseStatus.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        caseStatus.errorMessage
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
  createCases,
  updateCases,
  getCaseFilingType,
  getCaseStatus
};
