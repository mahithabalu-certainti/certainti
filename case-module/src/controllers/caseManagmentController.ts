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
  STATUS_MESSAGE,
} from "../utils/constants";
import {
  adminChecklistSchema,
  createCaseSchema,
  createTaskTemplateSchema,
  updateTaskTemplateSchema,
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

/**
 * Controller function to handle the creation of a new task template.
 *
 * This async function processes HTTP requests for creating task templates by:
 * - Validating the request body against the `createTaskTemplateSchema`
 * - Extracting and validating the user ID from request headers (`x-user-id`)
 * - Delegating task template creation to the `caseManagementService`
 * - Returning structured HTTP responses based on the operation outcome
 *
 * @param {Request} req - Express request object containing:
 *   - body: Task template data including template name, milestone details, and related fields
 *   - headers: Must include 'x-user-id' for authentication and audit purposes
 * @param {Response} res - Express response object used to send the operation result
 *
 * @returns {Promise<void>} - Resolves after sending the HTTP response to the client
 *
 * @throws {Error} - Catches and handles validation errors, missing user ID, and unexpected service errors
 * 
 * @description
 * **HTTP Response Codes:**
 * - 200: Task template created successfully
 * - 400: Bad request (validation failure, missing user ID, or service-level error)
 * 
 * **Request Validation:**
 * - Uses `createTaskTemplateSchema` to validate the request body
 * - Requires `x-user-id` in request headers for tracking user actions
 * - Logs all incoming requests, responses, and errors for audit and debugging purposes
 */
async function createTaskTemplate (req : Request, res : Response) : Promise<any> {
  const methodName = "Create TaskTemplate"
  try {
    logMessage(
      `[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${
        req.headers["x-user-id"]
      }`
    );
    // Validate request body against the defined schema
    const value = await validateRequest(req, createTaskTemplateSchema, res);
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
    const cases = await caseManagementService.createTaskTemplate(value, userId);
    
    // Handle successful checklist creation
    if (cases.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : cases.statusMessage
      })
    } else {
      // Handle service-level errors (business logic failures)
      return res.status(HttpStatus.BAD_REQUEST).send({
        statusCode : HttpStatus.BAD_REQUEST_MESSAGE,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : cases.statusMessage
      })
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

async function getPriorityTypes (req : Request, res : Response) {
  const methodName = "Get Priority Types";
  try {
    const result = await caseManagementService.getAllPriority();
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.casePrioritySuccess,
        data : result.data
      })
    } else {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.dataNotAvailable,
        data : []
      })    
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

async function getMilestones (req : Request, res : Response) {
  const methodName = "Get Milestones Types";
  try {
    const result = await caseManagementService.getMilestones();
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.milestonesSuccess,
        data : result.data
      })
    } else {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.dataNotAvailable,
        data : []
      })    
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

async function getChecklist (req : Request, res : Response) {
  const methodName = "Get Checklist";
  try {
    const result = await caseManagementService.getChecklist();
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.checklistSuccess,
        data : result.data
      })
    } else {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.dataNotAvailable,
        data : []
      })    
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

/**
 * Controller function to handle the update of an existing task template.
 *
 * This async function processes HTTP requests for updating task templates by:
 * - Validating the request body against the `updateTaskTemplateSchema`
 * - Extracting and validating the user ID from request headers (`x-user-id`)
 * - Delegating update operations to the `caseManagementService`
 * - Returning appropriate HTTP responses based on the service outcome
 *
 * @param {Request} req - Express request object containing:
 *   - body: Updated task template data including identifiers and modified fields
 *   - headers: Must include 'x-user-id' for authentication and audit tracking
 * @param {Response} res - Express response object used to send the operation result
 *
 * @returns {Promise<void>} - Resolves after sending the HTTP response to the client
 *
 * @throws {Error} - Catches and handles validation errors, missing user ID, and unexpected service or system errors
 * 
 * @description
 * **HTTP Response Codes:**
 * - 200: Task template updated successfully
 * - 400: Bad request (validation failure, missing user ID, or business rule violation)
 * - 404: Task template not found
 * - 500: Internal server or processing error
 * 
 * **Request Validation:**
 * - Uses `updateTaskTemplateSchema` for request body validation
 * - Requires `x-user-id` header for tracking user operations
 * - Logs all request inputs, validation results, and responses for debugging and auditing
 */
async function updateTaskTemplate (req : Request, res : Response) : Promise<any> {
  const methodName = "Update TaskTemplate"
  try {
    logMessage(
      `[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${
        req.headers["x-user-id"]
      }`
    );
    // Validate request body against the defined schema
    const value = await validateRequest(req, updateTaskTemplateSchema, res);
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
    const cases = await caseManagementService.updateTaskTemplate(value, userId);
    // Handle successful checklist creation
    if (cases.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : cases.statusMessage
      })
    } else if(cases.statusCode === HttpStatus.NOT_FOUND) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : cases.statusMessage
      })    
    } else if(cases.statusCode === HttpStatus.BAD_REQUEST) {
      return res.status(HttpStatus.BAD_REQUEST).send({
        statusCode : HttpStatus.BAD_REQUEST,
        statusCodeValue : HttpStatus.BAD_REQUEST_MESSAGE,
        statusMessage : cases.statusMessage
      })    
    } else {
      return res.status(HttpStatus.FAILED).send({
        statusCode : HttpStatus.FAILED,
        statusCodeValue : HttpStatus.FAILED_MESSAGE,
        statusMessage : cases.statusMessage
      })    
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
  createAdminCheckList,
  createTaskTemplate,
  getPriorityTypes,
  getMilestones,
  getChecklist,
  updateTaskTemplate
};