import { Request, Response } from "express";
import {
  errorLog,
  generateExcelBase64,
  generateExcelBase64WithEmptyCheck,
  handleCustomResponse,
  handleErrorResponse,
  handleSuccessResponse,
  isValidTimezone,
  logMessage,
  successLog,
  validateRequest,
} from "../utils/helpers";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import {
  caseSubmissionDateSchema,
  checklistByIdSchema,
  checklistSchema,
  createCaseSchema,
  createCaseTeamSchema,
  createTaskSchema,
  exportCasesAccountSchema,
  exportCaseSummarySchema,
  exportCheckListSchema,
  exportReviewProjectSchema,
  getEmailTemplatePreviewSchema,
  listCasesAccountSchema,
  listCaseSummarySchema,
  listCaseTeamSchema,
  listCheckListSchema,
  listReviewProjectSchema,
  sentReviewProjectSchema,
  updateCaseSchema,
  updateChecklistSchema,
  updateTaskSchema,
} from "../lib/joi/schemas/schema";
import configurations from "../config/config";
import moment from "moment";
import {
  checklistsFieldMappings,
  reviewProjectsFieldMappings,
  casesFieldMappings,
  casesSummaryFieldMappings,
} from "../utils/excelExportMapping";

const services = configurations.getInstance().getServices();
const checklistService = services.checklistService;
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
async function createCheckList(req: Request, res: Response): Promise<void> {
  const methodName = "Create checklist";
  try {
    // Log the incoming request for audit and debugging purposes
    logMessage(
      `[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${
        req.headers["x-user-id"]
      }`
    );

    // Validate request body against the defined schema
    const value = await validateRequest(req, checklistSchema, res);

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
    const cases = await checklistService.createCheckList(value, userId);

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
 * Controller function to handle updating an existing admin checklist.
 *
 * This async function processes HTTP requests for updating checklists by:
 * - Validating the request body against the updateChecklistSchema
 * - Extracting and validating the user ID from request headers
 * - Delegating checklist update to the case management service
 * - Returning appropriate HTTP responses based on the operation outcome
 *
 * @param {Request} req - Express request object containing:
 *   - body: Updated checklist data including checklist ID and fields to update
 *   - headers: Must include 'x-user-id' for authentication and audit trail
 * @param {Response} res - Express response object used to send the operation result
 * @returns {Promise<void>} - Resolves after sending the HTTP response to the client
 * @throws {Error} - Catches and handles validation errors, missing user ID, and service errors
 *
 * @description
 * HTTP Response Codes:
 * - 200: Checklist updated successfully with updated checklist data
 * - 400: Bad request (validation failure, missing user ID, or service error)
 *
 * Request Validation:
 * - Uses updateChecklistSchema for input validation
 * - Requires 'x-user-id' header for user identification
 * - Logs all requests and responses for audit purposes
 */
async function updateCheckList(req: Request, res: Response): Promise<void> {
  const methodName = "Update admin checklist";
  try {
    // Log the incoming request for audit and debugging purposes
    logMessage(
      `[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${
        req.headers["x-user-id"]
      }`
    );

    // Validate request body against the defined schema
    const value = await validateRequest(req, updateChecklistSchema, res);

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
    const cases = await checklistService.updateCheckList(value, userId);

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
 * Retrieves detailed information for a specific checklist by its ID.
 *
 * This controller method performs the following steps:
 * 1. Validates the request parameters and user ID from headers.
 * 2. Calls the caseService to fetch checklist details using the provided checklist ID and validation schema.
 * 3. Returns a success response with checklist details if found, or an error response if not found or validation fails.
 *
 * @param {Request} req - Express request object containing:
 *   - params: Must include 'checkListRid' for the checklist ID
 *   - headers: Must include 'x-user-id' for authentication
 * @param {Response} res - Express response object used to send the operation result
 * @returns {Promise<void>} - Resolves after sending the HTTP response to the client
 * @throws {Error} - Handles validation errors, missing user ID, missing checklist ID, and service errors
 *
 * @description
 * - Used for viewing or editing checklist details in the frontend.
 * - Returns all relevant checklist fields, including items, creator, and timestamps.
 * - Provides standardized error handling and logging for debugging and audit purposes.
 * - Essential for checklist management workflows and detail views.
 */
async function getCheckListDetailsById(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get checklist  details";
  try {
    const { checkListRid } = req.params;
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, checklistByIdSchema, res, "GET");

    logMessage(
      `[${methodName}] Request received,  checkListRid: ${checkListRid} userId: ${userId}`
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
    checkListResponse = await checklistService.getCheckListDetailsById(
      checkListRid,
      value
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
 * Controller function to handle listing all checklists for an account.
 *
 * This async function processes HTTP requests for listing checklists by:
 * - Validating request query and filters
 * - Extracting and validating the user ID from request headers
 * - Delegating checklist listing to the case service
 * - Returning paginated/sorted checklist data or error responses
 *
 * @param {Request} req - Express request object containing filters, pagination, and user ID
 * @param {Response} res - Express response object used to send the operation result
 * @returns {Promise<void>} - Resolves after sending the HTTP response to the client
 * @throws {Error} - Catches and handles validation errors, missing user ID, and service errors
 */
async function getAllChecklists(req: Request, res: Response): Promise<void> {
  const methodName = "get all checklists";
  try {
    const value = await validateRequest(req, listCheckListSchema, res, "GET");
    if (!value) {
      return;
    }
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }

    // Before calling buildRawWhereClause
    if (typeof value.filters === "string") {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        console.error("Invalid filters JSON:", value.filters);
        value.filters = {};
      }
    }
    const attachments = await checklistService.getAllChecklists(
      userId,
      value.attachmentLevel,
      value.entityId,
      value.accountRid,
      value.page,
      value.limit,
      value.search,
      value.filters,
      value.sortBy,
      value.sortOrder,
      value.fiscalYear,
      "list",
      {}
    );

    if (attachments.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, attachments.data);
      return;
    } else {
      errorLog(methodName, attachments.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        attachments.errorMessage
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
 * Controller function to handle exporting all checklists for an account.
 *
 * This async function processes HTTP requests for exporting checklists by:
 * - Validating request query and filters
 * - Extracting and validating the user ID from request headers
 * - Delegating checklist export to the case service
 * - Returning downloadable file or error responses
 *
 * @param {Request} req - Express request object containing filters, export options, and user ID
 * @param {Response} res - Express response object used to send the operation result
 * @returns {Promise<void>} - Resolves after sending the HTTP response to the client
 * @throws {Error} - Catches and handles validation errors, missing user ID, and service errors
 */
async function exportAllChecklists(req: Request, res: Response): Promise<void> {
  const methodName = "export all checklists";
  try {
    const value = await validateRequest(req, exportCheckListSchema, res, "GET");
    if (!value) {
      return;
    }
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }

    // Before calling buildRawWhereClause
    if (typeof value.filters === "string") {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        console.error("Invalid filters JSON:", value.filters);
        value.filters = {};
      }
    }
    const checklists = await checklistService.getAllChecklists(
      userId,
      value.attachmentLevel,
      value.entityId,
      value.accountRid,
      value.page,
      value.limit,
      value.search,
      value.filters,
      value.sortBy,
      value.sortOrder,
      value.fiscalYear,
      "download",
      {}
    );
    const fields = await caseService.getAllowedExportFields(
      userId,
      "checklists_view_edit"
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
    if (checklists.statusCode === HttpStatus.SUCCESS) {
      const finalStructuredData =
        !checklists?.data?.checklists || checklists.data.checklists.length < 1
          ? []
          : checklists.data.checklists.map((d: any) => {
              let resultMap: { [key: string]: any } = {
                r_number: d.r_number,
                fiscal_year:
                  d?.fiscal_year == null ? "" : `FY-${d.fiscal_year}`,
                checklist_name: d.checklist_name,
                attachment_level: d.attachment_level,
                attach_to: d.attach_to,
                attached_to: d.attached_to,
                created_by_name: d.created_by_name,
                created_datetime: formatDate(d.created_datetime),
                modified_by_name: d.modified_by_name,
                modified_datetime:
                  d.modified_datetime == null
                    ? ""
                    : formatDate(d.modified_datetime),
              };

              // Build exportRecord using allowed fields and resultMap
              const exportRecord: Record<string, any> = {};
              checklistsFieldMappings.forEach((mapping) => {
                if (allowedFieldSet.has(mapping.permissionField)) {
                  exportRecord[mapping.exportField] =
                    resultMap[mapping.dataField];
                }
              });

              return exportRecord;
            });

      const generateBase64Response = await generateExcelBase64(
        finalStructuredData,
        "Checklists"
      );
      successLog(methodName);
      handleSuccessResponse(res, generateBase64Response);
      return;
    } else {
      errorLog(methodName, checklists.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        checklists.errorMessage
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
  getCheckListDetailsById,
  getAllChecklists,
  exportAllChecklists,
  createCheckList,
  updateCheckList,
};
