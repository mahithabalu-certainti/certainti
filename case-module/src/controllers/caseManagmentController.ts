// Import required dependencies for Express.js controller functionality
import { Request, Response } from "express";
import ExcelJS from "exceljs";
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
  adminCheckListMappings,
  emailTemplateMappings,
  HttpStatus,
  STATUS_MESSAGE,
  taskTemplateFieldMappings,
} from "../utils/constants";
import {
  adminChecklistSchema,
  createCaseSchema,
  createEmailTemplateSchema,
  createTaskTemplateSchema,
  exportAdminCheckListByIdSchema,
  exportEmailTemplateSchema,
  listAdminCheckListSchema,
  listEmailTemplateSchema,
  updateAdminChecklistSchema,
  updateEmailTemplateSchema,
  updateTaskTemplateSchema,
} from "../lib/joi/schemas/schema";
import configurations from "../config/config";
import moment from "moment";

// Initialize services from configuration for dependency injection
const services = configurations.getInstance().getServices();
const caseManagementService = services.caseManagementService;
const caseService = services.caseService;
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
 * Controller function to handle the update of an existing admin checklist.
 *
 * This async function processes HTTP requests for updating admin checklists by:
 * - Validating the request body against the updateAdminChecklistSchema
 * - Extracting and validating the user ID from request headers
 * - Delegating checklist update to the case management service
 * - Returning appropriate HTTP responses based on the operation outcome
 *
 * @param {Request} req - Express request object containing:
 *   - body: Admin checklist update data including checklist_rid, template information and checklist items
 *   - headers: Must include 'x-user-id' for authentication and audit trail
 * @param {Response} res - Express response object used to send the operation result
 *
 * @returns {Promise<void>} - Resolves after sending the HTTP response to the client
 *
 * @throws {Error} - Catches and handles validation errors, missing user ID, and service errors
 * 
 * @description
 * HTTP Response Codes:
 * - 200: Checklist updated successfully with updated checklist data
 * - 400: Bad request (validation failure, missing user ID, or service error)
 * 
 * Request Validation:
 * - Uses updateAdminChecklistSchema for input validation
 * - Requires 'x-user-id' header for user identification
 * - Logs all requests and responses for audit purposes
 */
async function updateAdminCheckList(req: Request, res: Response): Promise<void> {
  const methodName = "Update admin checklist";
  try {
    // Log the incoming request for audit and debugging purposes
    logMessage(
      `[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${
        req.headers["x-user-id"]
      }`
    );
    
    // Validate request body against the defined schema
    const value = await validateRequest(req, updateAdminChecklistSchema, res);
    
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
    const cases = await caseManagementService.updateAdminCheckList(value, userId);
    
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
 * Controller function to handle listing and retrieval of admin checklists with filtering, sorting, and pagination.
 *
 * This async function processes HTTP requests for fetching admin checklists by:
 * - Validating request parameters against the `listAdminCheckListSchema`
 * - Parsing and validating JSON-formatted filter parameters
 * - Extracting user identification from request headers for authorization
 * - Delegating data retrieval to the case management service with comprehensive query options
 * - Returning paginated checklist data with metadata for frontend consumption
 *
 * @param {Request} req - Express request object containing:
 *   - query: Parameters including page, limit, sort, sortBy, search, and filters (JSON string)
 *   - headers: Must include 'x-user-id' for user authentication and access control
 * @param {Response} res - Express response object used to send the operation result
 *
 * @returns {Promise<void>} - Resolves after sending the HTTP response to the client
 *
 * @throws {Error} - Catches and handles validation errors, JSON parsing failures, missing user ID, and service errors
 * 
 * @description
 * **HTTP Response Codes:**
 * - 200: Checklists retrieved successfully with data and pagination metadata
 * - 400: Bad request (validation failure, invalid filters JSON, missing user ID, or service error)
 * - 500: Internal server error for unexpected system failures
 * 
 * **Request Validation:**
 * - Uses `listAdminCheckListSchema` for query parameter validation
 * - Parses `filters` parameter as JSON object for advanced filtering capabilities
 * - Requires `x-user-id` header for user identification and authorization
 * - Logs all requests, filter parsing attempts, and responses for audit purposes
 * 
 */
async function listAdminCheckList(req: Request, res: Response) {
  try {
    const methodName = "List Admin Checklists";

    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, listAdminCheckListSchema, res, "GET");
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

    logMessage(
      `[${methodName}] Request received, ${JSON.stringify(
        req.body
      )} userId: ${userId}`
    );
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

    const result = await caseManagementService.listAdminCheckList(
      value,
      parsedFilters,
      userId,
      "list"
    );
    if (result.statusCode == HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, result.data);
      return;
    } else {
      errorLog(methodName, "No data found");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        result.errorMessage
      );
      return;
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller function to handle exporting admin checklists to Excel format with advanced filtering and field-level permissions.
 *
 * This async function processes HTTP requests for exporting admin checklist data by:
 * - Validating request parameters against the `listAdminCheckListSchema`
 * - Parsing JSON-formatted filter parameters for data selection
 * - Retrieving user-specific field permissions for data security compliance
 * - Formatting datetime fields according to user timezone preferences
 * - Generating Excel files in Base64 format for secure download delivery
 * - Applying field-level access controls based on user permissions
 *
 * @param {Request} req - Express request object containing:
 *   - query: Export parameters including filters (JSON string), timezone, and data selection criteria
 *   - headers: Must include 'x-user-id' for authentication and permission-based field filtering
 * @param {Response} res - Express response object used to send the Base64-encoded Excel file
 *
 * @returns {Promise<void>} - Resolves after sending the HTTP response with Excel data or error message
 *
 * @throws {Error} - Catches and handles validation errors, permission failures, timezone issues, and Excel generation errors
 * 
 * @description
 * **HTTP Response Codes:**
 * - 200: Excel file generated successfully with Base64-encoded data
 * - 400: Bad request (validation failure, invalid filters JSON, missing user ID, or permission error)
 * - 403: Forbidden when user lacks required export permissions
 * - 500: Internal server error for Excel generation failures or unexpected system errors
 * 
 * **Request Validation:**
 * - Uses `listAdminCheckListSchema` for query parameter validation
 * - Parses `filters` parameter as JSON object for advanced data filtering
 * - Validates timezone parameter against supported timezone list
 * - Requires `x-user-id` header for user authentication and field permission resolution
*/
async function exportAdminCheckList(req: Request, res: Response) {
  try {
    const methodName = "Export Admin Checklists";
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, listAdminCheckListSchema, res, "GET");
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

    logMessage(
      `[${methodName}] Request received, ${JSON.stringify(
        req.body
      )} userId: ${userId}`
    );
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

    const result = await caseManagementService.listAdminCheckList(
      value,
      parsedFilters,
      userId,
      "download"
    );
     const fields = await caseService.getAllowedExportFields(
         userId,
         "checklist_templates_view_edit"
       );
       const allowedFieldSet = new Set<string>();
       for (const field of fields) {
         if (field.read) {
           allowedFieldSet.add(field.field_name);
         }
       }
        const isValidTZ = value.timezone && isValidTimezone(value.timezone);
           const formatDate = (date?: Date) => {
             if (!date) return null;
             
             return moment(date)
               .tz(isValidTZ ? value.timezone : "UTC")
               .format("YYYY-MMM-DD, hh:mm:ss A");
           };
       if (result.statusCode === HttpStatus.SUCCESS) {
         const finalStructuredData =
           result?.data?.checklist.length < 1
             ? []
             : result?.data?.checklist.map((d: any) => {
                 let resultMap: { [key: string]: any } = {
                   r_number: d.r_number,
                   status_name: d.status_name,
                   checklist_name: d.checklist_name,
                   checklist_description: d.checklist_description,
                   created_by: d.created_user_name,
                   created_datetime: formatDate(d?.created_datetime),
                   modified_by: d.modified_user_name,
                   modified_datetime:
                     d?.modified_datetime == null
                       ? ""
                       : formatDate(d.modified_datetime) 
                 };
   
                 // Build exportRecord using allowed fields and resultMap
                 const exportRecord: Record<string, any> = {};
                 adminCheckListMappings.forEach((mapping) => {
                   if (allowedFieldSet.has(mapping.permissionField)) {
                     exportRecord[mapping.exportField] =
                       resultMap[mapping.dataField];
                   }
                 });
   
                 return exportRecord;
               });
   
         const generateBase64Response = await generateExcelBase64(
           finalStructuredData,
           "CheckList"
         );
         handleSuccessResponse(res, generateBase64Response);
       } else {
         errorLog(methodName, "No data found");
         handleErrorResponse(
           res,
           HttpStatus.BAD_REQUEST,
           HttpStatus.BAD_REQUEST_MESSAGE,
           result.errorMessage
         );
        }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller function to handle retrieval of detailed admin checklist template information by unique identifier.
 *
 * This async function processes HTTP requests for fetching comprehensive checklist template details by:
 * - Extracting and validating the checklist RID from URL path parameters
 * - Authenticating the request using user ID from request headers
 * - Delegating data retrieval to the case management service for detailed template information
 * - Returning structured checklist template data including associated items and metadata
 *
 * @param {Request} req - Express request object containing:
 *   - params.checkListRid: The unique identifier (RID) of the checklist template to retrieve
 *   - headers: Must include 'x-user-id' for user authentication and access control
 * @param {Response} res - Express response object used to send the detailed checklist template data
 *
 * @returns {Promise<void>} - Resolves after sending the HTTP response with template details or error message
 *
 * @throws {Error} - Catches and handles missing parameters, authentication failures, and service errors
 * 
 * @description
 * **HTTP Response Codes:**
 * - 200: Checklist template details retrieved successfully with complete data structure
 * - 400: Bad request (missing checkListRid parameter, missing user ID, or service-level error)
 * - 404: Checklist template not found for the provided RID
 * - 401: Unauthorized access when user ID is missing from headers
 * - 500: Internal server error for unexpected system failures
 * 
 * **Request Validation:**
 * - Validates presence of `checkListRid` parameter in URL path
 * - Requires `x-user-id` header for user authentication and audit trail
 * - Logs all requests including parameters and user identification for debugging
 * - No request body validation required as this is a GET operation with path parameters
 * 
 * **Response Structure:**
 * - Returns comprehensive checklist template details including:
 *   - Template metadata (name, description, dates, status)
 *   - Associated checklist items and their configurations
 *   - User information for created/modified tracking
 *   - Template configuration and settings
 */
async function getCheckListTemplateDetailsById(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get checklist template details";
  try {
    const { checkListRid } = req.params;
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received,  checkListRid: ${checkListRid} userId: ${userId}`);
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

    if (!checkListRid) {
      errorLog(methodName, "CheckList ID is required in params");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "CheckList ID is required in params"
      );
      return;
    }
    let checkListResponse;
   checkListResponse =
        await caseManagementService.getCheckListTemplateDetailsById(
          checkListRid
        );

    if (checkListResponse.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, checkListResponse.data);
      return;
    } else {
      errorLog(methodName, checkListResponse.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        checkListResponse.errorMessage
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
    const value = req.body
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
    const value = req.body;
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

/**
 * Controller function to handle fetching the list of admin task templates.
 *
 * This async function processes HTTP requests for retrieving paginated task template lists by:
 * - Validating the presence of the user ID in request headers (`x-user-id`)
 * - Delegating the data retrieval to the `caseManagementService.fetchTaskTemplate` method
 * - Formatting and returning paginated task template data with metadata
 *
 * @param {Request} req - Express request object containing:
 *   - body: Request parameters for pagination, filtering, and search criteria
 *   - headers: Must include 'x-user-id' for authentication and audit tracking
 * @param {Response} res - Express response object used to send the operation result
 *
 * @returns {Promise<void>} - Resolves after sending the formatted task template list response
 *
 * @throws {Error} - Catches and handles missing user ID, service errors, or unexpected exceptions
 * 
 * @description
 * **HTTP Response Codes:**
 * - 200: Successfully retrieved the task template list
 * - 400: Bad request (missing user ID, validation error, or unexpected failure)
 * 
 * **Response Structure:**
 * - `page`: Current page number
 * - `limit`: Number of records per page
 * - `total_result`: Total number of available records
 * - `task_templates`: Array of task template objects
 * 
 * **Request Requirements:**
 * - Requires `x-user-id` in headers for authorization and audit purposes
 * - Accepts pagination and optional filter criteria in the request body
 * - Logs all requests and responses for traceability and debugging
 */
async function fetchAdminTaskTemplateList (req : Request, res : Response) {
  const methodName = "fetch Admin TaskTemplate List"
  try {
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
    const data = req.body;
    let result = await caseManagementService.fetchTaskTemplate(data, false, false, null);
    if(result.statusCode == HttpStatus.SUCCESS) {
      let totalRecord = parseInt(result.data[0].total_result)
      result.data.forEach((d : any) => {
        delete d.total_result
      })
      const finalData = {
        page : data.page,
        limit : data.limit,
        total_result : totalRecord,
        task_templates : result.data
      }
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.taskTemplateSuccess,
        data : finalData
      })     
    } else {
      const finalData = {
        page : data.page,
        limit : data.limit,
        total_result : 0,
        task_templates : result.data
      }
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.dataNotAvailable,
        data : finalData
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

async function ExportAdminTaskTemplateList (req : Request, res : Response) {
  const methodName = "fetch Admin TaskTemplate List"
  try {
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
    const data = req.body;
    let result = await caseManagementService.fetchTaskTemplate(data, true, false, null);
    const fields = await caseService.getAllowedExportFields(
    userId,
    "task_templates_view_edit"
    );
    const allowedFieldSet = new Set<string>();
    for (const field of fields) {
      if (field.read) {
        allowedFieldSet.add(field.field_name);
      }
    }
     const isValidTZ = data.timezone && isValidTimezone(data.timezone);
        const formatDate = (date?: Date) => {
          if (!date) return null;
          
          return moment(date)
            .tz(isValidTZ ? data.timezone : "UTC")
            .format("YYYY-MMM-DD, hh:mm:ss A");
      };    
    if(result.statusCode == HttpStatus.SUCCESS) {
      const finalData = result.data.map((d : any) => {
        let resultMap : { [key: string]: any } =  {
          "Template ID" : d.r_number,
          "Task Name" : d.task_name,
          "Effort In Days": d.effort_in_days || "-",
          "Task Type": d.task_type_name || "-",
          "Milestone Name": d.milestone_name || "-",
          "Assign Role": d.role_name || "-",
          "Priority": d.priority_name || "-",
          "Checklist": d.checklist_name || "-",
          "Task Category" : d.category_name,
          "Task Weightage": d.weightage_value || "-",
          "Status": d.status_name,
          "Task Description": d.task_description || "-",
          "Created By" : d.created_by_name || "-",
          "Created On" : d.created_datetime
          ? data.timezone && isValidTimezone(data.timezone)
            ? moment.tz(d.created_datetime.toISOString(), data.timezone)
                .format("YYYY-MMM-DD, hh:mm:ss A")
            : moment(d.created_datetime.toISOString())
                .tz(data.timezone)
                .format("YYYY-MMM-DD, hh:mm:ss A")
          : "-",
          "Updated By": d.modified_by_name || "-",
          "Updated On": d.modified_datetime
          ? data.timezone && isValidTimezone(data.timezone)
            ? moment.tz(d.modified_datetime.toISOString(), data.timezone)
                .format("YYYY-MMM-DD, hh:mm:ss A")
            : moment(d.modified_datetime.toISOString())
                .tz(data.timezone)
                .format("YYYY-MMM-DD, hh:mm:ss A")
          : "-"
        }
        const exportRecord: Record<string, any> = {};
        taskTemplateFieldMappings.forEach((mapping) => {
          if (allowedFieldSet.has(mapping.permissionField)) {
            exportRecord[mapping.exportField] = resultMap[mapping.exportField];
          }
        });
        return exportRecord;
      })
      const generateBase64Response = await generateExcelBase64(
           finalData,
           "Task Template"
         );
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.taskTemplateExport,
        data : generateBase64Response
      })     
    } else {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.dataNotAvailable,
        data : {}
      })  
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


async function fetchAllTaskTypes (req : Request, res : Response) {
  const methodName = "fetchAllTaskTypes";
  try {
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
    const result = await caseManagementService.fetchTaskTypeForTemplate();
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.taskTypeFetchedSuccess,
        data : result.data
      })        
    } else {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.dataNotAvailable,
        data : result.data
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

async function exportCheckListTemplateById(req: Request, res: Response) {
  try {
    const methodName = "Export Checklist By Id";
     // Validate request body against the defined schema
    const data = await validateRequest(req, exportAdminCheckListByIdSchema, res,"GET");

    const userId = req.headers["x-user-id"] as string;
     logMessage(`[${methodName}] Request received, ${JSON.stringify(data)} userId: ${userId}`);
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
     const { checkListRid } = req.params;
    const result = await caseManagementService.getCheckListTemplateDetailsById(
      checkListRid!
    );
    const allowedFieldsForExport =
      await caseService.getAllowedExportFields(
        userId,
        "checklist_templates_view_edit"
      );
    const allowedFieldSet = new Set<string>();
    for (const field of allowedFieldsForExport) {
      if (field.read) {
        allowedFieldSet.add(field.field_name);
      }
    }
    const isValidTZ = data.timezone && isValidTimezone(data.timezone);
    const formatDate = (date?: Date) => {
             if (!date) return null;
             
             return moment(date)
               .tz(isValidTZ ? data.timezone : "UTC")
               .format("YYYY-MMM-DD, hh:mm:ss A");
           };
    const response = result.data?.checklistDetails;
    if (result.statusCode == HttpStatus.SUCCESS) {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("CheckList Details");

      // Define mapping of field keys to labels and their corresponding values from response
      const fieldMappings: Record<string, { label: string; value: any }> = {
        r_number: { label: "Checklist ID", value: response?.r_number },
        checklist_name: {
          label: "Checklist Name",
          value: response?.checklist_name,
        },
        checklist_description: {
          label: "Checklist Description",
          value: response?.checklist_description,
        },
        status_rid: { label: "Status", value: response?.status_name },
        created_by: {
          label: "Created By",
          value: response?.created_user_name || response?.created_by,
        },
        created_datetime: {
          label: "Created Date",
          value: formatDate(response?.created_datetime),
        },
      };

      // Dynamically build header rows based on allowedFieldSet and fieldMappings
      const headerRows: [string, string][] = [];
      Object.keys(fieldMappings).forEach((field) => {
        if (allowedFieldSet.has(field)) {
          const mapping = fieldMappings[field];
          if (mapping) {
            headerRows.push([mapping.label, String(mapping.value ?? "")]);
          }
        }
      });

      headerRows.forEach((row, idx) => {
        worksheet.addRow(row);
        worksheet.getRow(idx + 1).getCell(1).font = { bold: true };
      });
      if (allowedFieldSet.has("checklists")) {
        worksheet.addRow(["Item", "Description"]);
        worksheet.getRow(7).eachCell((cell) => {
          cell.font = { bold: true };
        });
        worksheet.columns = [
          { key: "checklist_item_name", width: 15 },
          { key: "description", width: 50 },
        ];
        response.checklist_items.forEach((item: any) => {
          const plain = item.get ? item.get({ plain: true }) : item;
          const row = worksheet.addRow({
            "checklist_item_name": plain.checklist_item_name,
            description: plain.description,
          });
        });
      }
      const excelBuffer = await workbook.xlsx.writeBuffer();
      handleSuccessResponse(res, Buffer.from(excelBuffer).toString("base64"));
      return;
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data: null,
      });
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function fetchTaskTemplateDetails (req : Request, res : Response) {
  const methodName = "fetchTaskTemplateDetails"
  try {
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
    const { rid } = req.params;
    const result = await caseManagementService.getTaskTemplateDetailsById(rid!);
    if(result) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
        data: result.data,
      });      
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data: null,
      });
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function createEmailTemplate(req: Request, res: Response): Promise<void> {
  const methodName = "Create email template";
  try {
    // Log the incoming request for audit and debugging purposes
    logMessage(
      `[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${
        req.headers["x-user-id"]
      }`
    );
    
    // Validate request body against the defined schema
    const value = await validateRequest(req, createEmailTemplateSchema, res);
    
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
    
    // Call the service layer to create the email template
    const cases = await caseManagementService.createEmailTemplate(value, userId);
    
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

async function updateEmailTemplate(req: Request, res: Response): Promise<void> {
  const methodName = "Update email template";
  try {
    // Log the incoming request for audit and debugging purposes
    logMessage(
      `[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${
        req.headers["x-user-id"]
      }`
    );
    
    // Validate request body against the defined schema
    const value = await validateRequest(req, updateEmailTemplateSchema, res);
    
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
    
    // Call the service layer to update the email template
    const cases = await caseManagementService.updateEmailTemplate(value, userId);
    
    // Handle successful email template update
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

async function getEmailPlaceHolders(req : Request, res : Response) {
  const methodName = "Get Email PlaceHolders";
  try {
    const result = await caseManagementService.getEmailPlaceHolders();
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.categoryPlaceHolderSuccess,
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

async function getEmailTemplateCategory(req : Request, res : Response) {
  const methodName = "Get Email PlaceHolders";
  try {
    const result = await caseManagementService.getEmailTemplateCategory();
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.categoryPlaceHolderSuccess,
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


async function listEmailTemplates(req: Request, res: Response) {
  try {
    const methodName = "List Email Templates";

    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, listEmailTemplateSchema, res, "GET");
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

    logMessage(
      `[${methodName}] Request received, ${JSON.stringify(
        req.body
      )} userId: ${userId}`
    );
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
    
    const result = await caseManagementService.listEmailTemplates(
      value,
      parsedFilters,
      userId,
      "list"
    );
    if (result.statusCode == HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, result.data);
      return;
    } else {
      errorLog(methodName, "No data found");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        result.errorMessage
      );
      return;
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function listAllEmailTemplatesByCategory(req: Request, res: Response) {
  try {
    const methodName = "List Email Templates By Category";

    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, listEmailTemplateSchema, res, "GET");
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

    logMessage(
      `[${methodName}] Request received, ${JSON.stringify(
        req.body
      )} userId: ${userId}`
    );
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
    
    const result = await caseManagementService.listEmailTemplatesByCategory(
      value,
      userId
    );
    if (result.statusCode == HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, result.data);
      return;
    } else {
      errorLog(methodName, "No data found");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        result.errorMessage
      );
      return;
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function exportEmailTemplates(req: Request, res: Response) {
  try {
    const methodName = "Export Email Templates";
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, exportEmailTemplateSchema, res, "GET");
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

    logMessage(
      `[${methodName}] Request received, ${JSON.stringify(
        req.body
      )} userId: ${userId}`
    );
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

    const result = await caseManagementService.listEmailTemplates(
      value,
      parsedFilters,
      userId,
      "download"
    );
     const fields = await caseService.getAllowedExportFields(
         userId,
         "email_templates_view_edit"
       );
       const allowedFieldSet = new Set<string>();
       for (const field of fields) {
         if (field.read) {
           allowedFieldSet.add(field.field_name);
         }
       }
       const isValidTZ = value.timezone && isValidTimezone(value.timezone);

       
       const formatDate = (date?: Date) => {
             if (!date) return null;
             
             return moment(date)
               .tz(isValidTZ ? value.timezone : "UTC")
               .format("YYYY-MMM-DD, hh:mm:ss A");
           };
       if (result.statusCode === HttpStatus.SUCCESS) {
         const finalStructuredData =
           result?.data?.emailTemplates.length < 1
             ? []
             : result?.data?.emailTemplates.map((d: any) => {
                 let resultMap: { [key: string]: any } = {
                   r_number: d.r_number,
                   status_name: d.status_name,
                   email_template_name: d.template_name,
                   description: d.description,
                   category_rid: d.category_name,
                   created_by: d.created_user_name,
                   created_datetime: formatDate(d?.created_datetime),
                   modified_by: d.modified_user_name,
                   modified_datetime:
                     d?.modified_datetime == null
                       ? ""
                       : formatDate(d.modified_datetime) 
                 };
   
                 // Build exportRecord using allowed fields and resultMap
                 const exportRecord: Record<string, any> = {};
                 emailTemplateMappings.forEach((mapping) => {
                   if (allowedFieldSet.has(mapping.permissionField)) {
                     exportRecord[mapping.exportField] =
                       resultMap[mapping.dataField];
                   }
                 });
   
                 return exportRecord;
               });
   
         const generateBase64Response = await generateExcelBase64(
           finalStructuredData,
           "EmailTemplates"
         );
         handleSuccessResponse(res, generateBase64Response);
       } else {
         errorLog(methodName, "No data found");
         handleErrorResponse(
           res,
           HttpStatus.BAD_REQUEST,
           HttpStatus.BAD_REQUEST_MESSAGE,
           result.errorMessage
         );
        }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function getEmailTemplateDetailsById(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get email template details";
  try {
    const { emailTemplateRid } = req.params;
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received,  emailTemplateRid: ${emailTemplateRid} userId: ${userId}`);
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

    if (!emailTemplateRid) {
      errorLog(methodName, "Email Template ID is required in params");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "Email Template ID is required in params"
      );
      return;
    }
    let emailTemplateResponse;
   emailTemplateResponse =
        await caseManagementService.getEmailTemplateDetailsById(
          emailTemplateRid
        );

    if (emailTemplateResponse.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, emailTemplateResponse.data);
      return;
    } else {
      errorLog(methodName, emailTemplateResponse.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        emailTemplateResponse.errorMessage
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

async function getEmailCategoryPlaceHolders(req : Request, res : Response) {
  const methodName = "Get Email Category PlaceHolders";
  try {
    const { categoryRid } = req.params;
    if (!categoryRid) {
      errorLog(methodName, "Category RID is required in params");
      handleErrorResponse(  
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "Category RID is required in params"
      );
      return;
    }
    const result = await caseManagementService.getEmailCategoryPlaceHolders(categoryRid);
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.categoryPlaceHolderSuccess,
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
async function getWorkFlowConnector (req : Request, res : Response) {
  const methodName = "getWorkFlowConnector"
  try {
    const userId = req.headers["x-user-id"] as string;    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const result = await caseManagementService.getWorkflowConnetorData();
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.workflowConnectorListSuccess,
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
  } catch (error) {
    
  }
}

async function linkAdminTask (req : Request, res : Response) {
  const methodName = "linkAdminTask";
  try {
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
    const data = req.body;
    data.created_by = userId
    const result = await caseManagementService.linkTask(data); 
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } 
    else if (result.statusCode === HttpStatus.NOT_FOUND) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    }
    else if (result.statusCode === HttpStatus.BAD_REQUEST) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        statusCodeValue: HttpStatus.BAD_REQUEST_MESSAGE,
        statusMessage: result.statusMessage,
      });
    }
    else {
      return res.status(HttpStatus.FAILED).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result.statusMessage,
      });
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function linkAdminDeleteTask (req : Request, res : Response) {
  const methodName = "linkAdminDeleteTask";
  try {
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
    const data = req.body;
    data.created_by = userId
    const result = await caseManagementService.deleteLinkTask(data); 
    if(result?.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } 
    else if (result?.statusCode === HttpStatus.NOT_FOUND) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    }
    else {
      return res.status(HttpStatus.FAILED).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result?.statusMessage,
      });
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function listAdminTaskDropdown (req : Request, res : Response) {
  const methodName = "listAdminTaskDropdown";
  try {
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
    const data = req.body;
    const result = await caseManagementService.adminTaskListForDropdown(data); 
    if(result.length > 0) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.taskTemplateSuccess,
        data : result
      });
    } 
    else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data : []
      });
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}
async function listAdminTaskWeightage (req : Request, res : Response) {
  const methodName = "listAdminTaskWeightage";
  try {
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
    const result = await caseManagementService.getWeightageList(); 
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.taskWeightageListSuccess,
        data : result
      });
    } 
    else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data : []
      });
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function getTaskCategoryForDropdown (req : Request, res : Response) {
  const methodName = "getTaskCategoryForDropdown";
  try {
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
    const result = await caseManagementService.getTaskCategoryList();
    if(result.length > 0) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.taskCategoryListedSuccess,
        data : result
      })
    } else {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.dataNotAvailable,
        data : result
      })
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}
// Export the controller functions for use in route definitions
export default {
  createAdminCheckList,
  listAdminCheckList,
  createTaskTemplate,
  getPriorityTypes,
  getMilestones,
  getChecklist,
  updateTaskTemplate,
  fetchAdminTaskTemplateList,
  exportAdminCheckList,
  ExportAdminTaskTemplateList,
  getCheckListTemplateDetailsById,
  exportCheckListTemplateById,
  fetchAllTaskTypes,
  updateAdminCheckList,
  fetchTaskTemplateDetails,
  createEmailTemplate,
  updateEmailTemplate,
  getEmailPlaceHolders,
  listEmailTemplates,
  listAllEmailTemplatesByCategory,
  getEmailTemplateDetailsById,
  exportEmailTemplates,
  getEmailCategoryPlaceHolders,
  getEmailTemplateCategory,
  getWorkFlowConnector,
  linkAdminDeleteTask,
  linkAdminTask,
  listAdminTaskDropdown,
  listAdminTaskWeightage,
  getTaskCategoryForDropdown
};