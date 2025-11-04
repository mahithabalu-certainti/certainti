// Import required dependencies for Express.js controller functionality
import { Request, Response } from "express";
import {
  errorLog,
  generateExcelBase64,
  handleCustomResponse,
  handleErrorResponse,
  handleSuccessResponse,
  isValidTimezone,
  logMessage,
  successLog,
  validateRequest,
} from "../utils/helpers";
import {
  HttpStatus,
} from "../utils/constants";
import {
  adminChecklistSchema,
  createCaseSchema,
} from "../lib/joi/schemas/schema";
import configurations from "../config/config";

// Initialize services from configuration for dependency injection
const services = configurations.getInstance().getServices();
const caseManagementService = services.caseManagementService;
/**
 * Controller function to handle the creation of a new admin checklist.
 *
 * This async function processes HTTP requests for creating admin checklists by:
 * - Validating the request body against the createCaseSchema
 * - Extracting and validating the user ID from request headers
 * - Delegating checklist creation to the case management service
 * - Returning appropriate HTTP responses based on the operation outcome
 *
 * @param {Request} req - Express request object containing:
 *   - body: Admin checklist data including template information and checklist items
 *   - headers: Must include 'x-user-id' for authentication and audit trail
 * @param {Response} res - Express response object used to send the operation result
 *
 * @returns {Promise<void>} - Resolves after sending the HTTP response to the client
 *
 * @throws {Error} - Catches and handles validation errors, missing user ID, and service errors
 * 
 * @description
 * HTTP Response Codes:
 * - 200: Checklist created successfully with checklist data
 * - 400: Bad request (validation failure, missing user ID, or service error)
 * 
 * Request Validation:
 * - Uses createCaseSchema for input validation
 * - Requires 'x-user-id' header for user identification
 * - Logs all requests and responses for audit purposes
 */
async function createAdminCheckList(req: Request, res: Response): Promise<void> {
  const methodName = "Create admin checklist";
  try {
    // Log the incoming request for audit and debugging purposes
    logMessage(
      `[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${
        req.headers["x-user-id"]
      }`
    );
    
    // Validate request body against the defined schema
    const value = await validateRequest(req, adminChecklistSchema, res);
    
    // Extract and validate user ID from request headers
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
    
    // Ensure request body validation passed
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    
    // Call the service layer to create the admin checklist
    const cases = await caseManagementService.createAdminCheckList(value, userId);
    
    // Handle successful checklist creation
    if (cases.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, cases.data, cases.message);
      return;
    } else {
      // Handle service-level errors (business logic failures)
      errorLog(methodName, cases.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        cases.errorMessage
      );
      return;
    }
  } catch (err) {
    // Handle unexpected errors (system failures, network issues, etc.)
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

// Export the controller functions for use in route definitions
export default {
  createAdminCheckList
};