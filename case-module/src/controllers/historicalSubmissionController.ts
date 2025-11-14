import { Request, Response } from "express";
import {
  errorLog,
  handleCustomResponse,
  handleErrorResponse,
  logMessage,
  successLog,
  validateRequest,
  handleSuccessResponse
} from "../utils/helpers";
import { HttpStatus } from "../utils/constants";
import Configurations from "../config/config";
import { listHistoricalSubmissionSchema, createHistoricalSubmissionSchema } from "../lib/joi/schemas/schema";
// Load services from configuration
const Services = Configurations.getInstance().getServices();
const historicalSubmissionService = Services.historicalSubmissionService;


/**
 * Lists all historical submissions for a specific case with filtering, sorting, and pagination support.
 *
 * This controller method performs the following steps:
 * 1. Validates the incoming request parameters against the list historical submission schema.
 * 2. Extracts and parses filter parameters from the request query string.
 * 3. Extracts the user ID from the `x-user-id` request header for authentication.
 * 4. Calls the `listHistoricalSubmission` method from the `historicalSubmissionService` to fetch paginated submission data.
 * 5. Returns a success response with submission data and pagination info, or an error response if failed.
 *
 * @param {Request} req - Express request object containing query parameters, filters, and user authentication headers.
 * @param {Response} res - Express response object used to send the HTTP response with historical submission data.
 *
 * @returns {Promise<void>} - A Promise that resolves after sending the HTTP response.
 *
 * @description
 * - Supports advanced filtering by fiscal year, project counts, financial metrics, and other submission attributes.
 * - Provides pagination with configurable page size and offset.
 * - Includes sorting capabilities by various submission fields.
 * - Returns comprehensive submission information including financial data, project counts, and fiscal year details.
 * - Used by the frontend to display historical submission lists with search and filter functionality.
 * - Essential for historical data management, financial tracking, and compliance reporting.
 */
async function listHistoricalSubmission(req: Request, res: Response): Promise<void> {
  const methodName = "List Historical Submission";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, listHistoricalSubmissionSchema, res, "GET");
    if (!value) return;
    let parsedFilters: Record<string, any> = {};
    try {
      parsedFilters = JSON.parse(value.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }
    const historicalSubmissions = await historicalSubmissionService.listHistoricalSubmission(
      value,
      parsedFilters,
      userId,
      "list"
    );
    if (historicalSubmissions.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, historicalSubmissions.data);
      return;
    } else {
      errorLog(methodName, historicalSubmissions.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        historicalSubmissions.errorMessage
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
 * Handles the creation and management of historical submissions based on the incoming HTTP request.
 *
 * This async function validates the request body against a schema, extracts the user ID from headers,
 * and calls the historical submission service to manage submissions with CRUD operations (add, edit, delete).
 * It supports batch operations and includes comprehensive timeline logging for audit purposes.
 * It sends back appropriate success or error responses based on the service outcome.
 *
 * @param {Request} req - Express request object containing historical submission data in the body and user ID in headers.
 * @param {Response} res - Express response object used to send back the operation result.
 *
 * @returns {Promise<void>} - Resolves after sending the response to the client.
 *
 * @throws {Error} - Throws if the request validation fails or the historical submission service encounters an error.
 *
 * @description
 * - Supports adding, editing, and deleting historical submissions with financial data and project metrics.
 * - Validates fiscal year uniqueness to prevent duplicate submissions for the same case and year.
 * - Automatically logs all operations to case timeline for comprehensive audit trail.
 * - Handles batch operations with ordered processing (delete → edit → add).
 * - Includes financial data validation and business rule enforcement for submission integrity.
 */
async function createHistoricalSubmission(req: Request, res: Response): Promise<void> {
  const methodName = "Create Historical Submission";
  try {
    logMessage(
      `[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${req.headers["x-user-id"]
      }`
    );
    const value = await validateRequest(req, createHistoricalSubmissionSchema, res);
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
    const submissions = await historicalSubmissionService.createHistoricalSubmission(value, userId);
    if (submissions.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, submissions.data, submissions.message);
      return;
    } else {
      errorLog(methodName, submissions.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        submissions.errorMessage
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

// Export controller
export default {
  createHistoricalSubmission,
  listHistoricalSubmission
};