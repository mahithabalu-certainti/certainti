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
import {
  casesFieldMappings,
  casesSummaryFieldMappings,
  checklistsFieldMappings,
  HttpStatus,
  reviewProjectsFieldMappings,
  STATUS_MESSAGE,
} from "../utils/constants";
import {
  checklistByIdSchema,
  checklistSchema,
  createCaseSchema,
  createCaseTeamSchema,
  createTaskSchema,
  exportCasesAccountSchema,
  exportCaseSummarySchema,
  exportCheckListSchema,
  exportReviewProjectSchema,
  listCasesAccountSchema,
  listCaseSummarySchema,
  listCaseTeamSchema,
  listCheckListSchema,
  listReviewProjectSchema,
  updateCaseSchema,
  updateChecklistSchema,
  updateTaskSchema,
} from "../lib/joi/schemas/schema";
import configurations from "../config/config";
import moment from "moment";

const services = configurations.getInstance().getServices();
const caseService = services.caseService;
const caseManagementService = services.caseManagementService;
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
    const cases = await caseService.createCase(value, userId);
    if (cases.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, cases.data, cases.message);
      return;
    } else {
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
 * Controller: getCaseheadersDetails
 * ------------------------------------------------------
 * Description:
 *   Fetches detailed header and section information for a specific case
 *   associated with an account. The user ID must be provided in the request headers.
 *
 * Flow:
 *   1. Validate that 'x-user-id' exists in headers.
 *   2. Extract 'accountRid' and 'caseRid' from request params.
 *   3. Call the service layer (caseService.fetchCaseHeadersSectionsList)
 *      to retrieve case header and section details.
 *   4. Return success response with the fetched data if available,
 *      otherwise send a "data not available" response.
 *   5. Catch and handle any errors that occur during processing.
 *
 * Parameters:
 *   @param req - Express Request object containing headers and params.
 *   @param res - Express Response object used to send the response.
 *
 * Returns:
 *   JSON response with status code, message, and case details (if available).
 */
async function getCaseHeadersDetails(req: Request, res: Response) {
  const methodName = "getCaseheadersDetails";
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
    const { accountRid, caseRid } = req.params;
    const result = await caseService.fetchCaseHeadersSectionsList(
      accountRid!,
      caseRid!
    );
    if (result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.caseDetailsFetchedSuccess,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data: result.data,
      });
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

/**
 * Retrieves the list of available checklist statuses from the system.
 *
 * This controller method performs the following steps:
 * 1. Calls the `getChecklistStatus` method from the `caseService`, which fetches all defined checklist statuses.
 * 2. If the service responds with success, logs the success event and sends an HTTP 200 response with the status data.
 * 3. If the service responds with a failure status code, logs the error and returns a `BAD_REQUEST` response with the error message.
 * 4. Handles and logs any unexpected exceptions and returns a generic `BAD_REQUEST` response with the exception message.
 *
 * @param {Request} req - Express request object (not used directly in this function).
 * @param {Response} res - Express response object used to send the HTTP response with checklist status data.
 *
 * @returns {Promise<void>} - A Promise that resolves after the HTTP response is sent.
 *
 * @description
 * - Used for populating dropdown options in the frontend for checklist status selection.
 * - Returns all available statuses that can be assigned to checklists (e.g., Pending, Completed, In Review).
 * - Provides standardized error handling and logging for debugging purposes.
 * - Essential for checklist workflow management and status tracking.
 */
async function getChecklistStatus(req: Request, res: Response): Promise<void> {
  const methodName = "Get Checklist Status";
  try {
    const checklistStatus = await caseService.getChecklistStatus();
    if (checklistStatus.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, checklistStatus.data);
      return;
    } else {
      errorLog(methodName, checklistStatus.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        checklistStatus.errorMessage
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
 * Lists all cases for a specific account with filtering, sorting, and pagination support.
 *
 * This controller method performs the following steps:
 * 1. Validates the incoming request parameters against the list cases schema.
 * 2. Extracts and parses filter parameters from the request query string.
 * 3. Extracts the user ID from the `x-user-id` request header for authentication.
 * 4. Calls the `listAllCasesAccount` method from the `caseService` to fetch paginated case data.
 * 5. Returns a success response with case data and pagination info, or an error response if failed.
 *
 * @param {Request} req - Express request object containing query parameters, filters, and user authentication headers.
 * @param {Response} res - Express response object used to send the HTTP response with case data.
 *
 * @returns {Promise<void>} - A Promise that resolves after sending the HTTP response.
 *
 * @description
 * - Supports advanced filtering by case name, status, owner, fiscal year, and other case attributes.
 * - Provides pagination with configurable page size and offset.
 * - Includes sorting capabilities by various case fields.
 * - Returns comprehensive case information including owner names, status descriptions, and filing types.
 * - Used by the frontend to display case lists with search and filter functionality.
 */
async function listAllCasesAccount(req: Request, res: Response) {
  try {
    const methodName = "List All Cases Account";

    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(
      req,
      listCasesAccountSchema,
      res,
      "GET"
    );
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
    const result = await caseService.listAllCasesAccount(
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
 * Exports all cases for a specific account to an Excel file with user permission-based field filtering.
 *
 * This controller method performs the following steps:
 * 1. Validates the incoming request parameters against the export cases schema.
 * 2. Extracts and parses filter parameters from the request query string.
 * 3. Extracts the user ID from the `x-user-id` request header for authentication.
 * 4. Calls the `listAllCasesAccount` method from the `caseService` with "download" mode to fetch all matching case data.
 * 5. Retrieves user's field-level permissions for the "cases_view_edit" permission.
 * 6. Filters the export data based on user's allowed fields and permissions.
 * 7. Formats datetime fields according to the specified timezone or defaults to UTC.
 * 8. Generates an Excel file in base64 format and returns it in the response.
 *
 * @param {Request} req - Express request object containing query parameters, filters, timezone, and user authentication headers.
 * @param {Response} res - Express response object used to send the HTTP response with the Excel file data.
 *
 * @returns {Promise<void>} - A Promise that resolves after sending the HTTP response with Excel file.
 *
 * @description
 * - Supports the same filtering capabilities as the list function but exports all matching records.
 * - Respects user-level and profile-level field permissions for data security.
 * - Handles timezone conversion for datetime fields based on user preferences.
 * - Generates Excel files with properly formatted case data including financial information.
 * - Maps internal field names to user-friendly export column headers.
 * - Used for generating case reports and data exports for external analysis.
 */
async function exportAllCasesAccount(req: Request, res: Response) {
  try {
    const methodName = "Export All Cases Account";
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(
      req,
      exportCasesAccountSchema,
      res,
      "GET"
    );
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
    const result = await caseService.listAllCasesAccount(
      value,
      parsedFilters,
      userId,
      "download"
    );
    const fields = await caseService.getAllowedExportFields(
      userId,
      "cases_view_edit"
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
        result?.data?.caseInfo.length < 1
          ? []
          : result?.data?.caseInfo.map((d: any) => {
              let resultMap: { [key: string]: any } = {
                r_number: d.r_number,
                fiscal_year: `FY-${d.fiscal_year}`,
                status_name: d.status_name,
                case_owner_name: d.case_owner_name,
                filing_type_name: d.filing_type_name,
                case_total_project_cost: d.case_total_project_cost,
                case_total_projects: d.case_total_projects,
                case_total_rd_cost: d.case_total_rd_cost,
                case_total_qre_cost: d.case_total_qre_cost,
                description: d.description,
                case_name: `${d.account_name}-${d.country_code}-${d.fiscal_year}-${d.case_name}`,
                created_by: d.created_user_name,
                created_datetime: formatDate(d.created_datetime),
                modified_by: d.modified_user_name,
                modified_datetime:
                  d.modified_datetime == null
                    ? ""
                    : formatDate(d.modified_datetime),
                submitted_datetime:
                  d.submitted_datetime == null
                    ? ""
                    : formatDate(d.submitted_datetime),
                approved_datetime:
                  d.approved_datetime == null
                    ? ""
                    : formatDate(d.approved_datetime),
              };

              // Build exportRecord using allowed fields and resultMap
              const exportRecord: Record<string, any> = {};
              casesFieldMappings.forEach((mapping) => {
                if (allowedFieldSet.has(mapping.permissionField)) {
                  exportRecord[mapping.exportField] =
                    resultMap[mapping.dataField];
                }
              });

              return exportRecord;
            });

      const generateBase64Response = await generateExcelBase64(
        finalStructuredData,
        "Cases"
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
      /* return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotFound,
        data: result.data,
      });
      */
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

async function fetchProjectForAssign(
  req: Request,
  res: Response
): Promise<any> {
  const methodName = "fetchProjectForAssign";
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
    const result = await caseService.fetchProjectsForAssign(
      data,
      false,
      userId,
      false
    );
    if (result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.projectsFetchedSuccess,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data: result.data,
      });
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
 * Lists all cases for a specific account with filtering, sorting, and pagination support.
 *
 * This controller method performs the following steps:
 * 1. Validates the incoming request parameters against the list cases schema.
 * 2. Extracts and parses filter parameters from the request query string.
 * 3. Extracts the user ID from the `x-user-id` request header for authentication.
 * 4. Calls the `listAllCasesAccount` method from the `caseService` to fetch paginated case data.
 * 5. Returns a success response with case data and pagination info, or an error response if failed.
 *
 * @param {Request} req - Express request object containing query parameters, filters, and user authentication headers.
 * @param {Response} res - Express response object used to send the HTTP response with case data.
 *
 * @returns {Promise<void>} - A Promise that resolves after sending the HTTP response.
 *
 * @description
 * - Supports advanced filtering by case name, status, owner, fiscal year, and other case attributes.
 * - Provides pagination with configurable page size and offset.
 * - Includes sorting capabilities by various case fields.
 * - Returns comprehensive case information including owner names, status descriptions, and filing types.
 * - Used by the frontend to display case lists with search and filter functionality.
 */
async function listAllCasesSummary(req: Request, res: Response) {
  try {
    const methodName = "List All Cases Summary";

    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, listCaseSummarySchema, res, "GET");
    if (!value) return;
    let parsedFilters: Record<string, any> = {};
    let parsedGlobalFilters: Record<string, string[]> = {};

    try {
      parsedFilters = JSON.parse(value.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    try {
      parsedGlobalFilters = JSON.parse(value.globalFilters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid globalFilters format. Must be a valid JSON object."
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

    // Create modified data object with parsed globalFilters
    const dataWithParsedGlobalFilters = {
      ...value,
      globalFilters: parsedGlobalFilters,
      parsedFilters: parsedFilters,
    };

    const result = await caseService.listAllCasesSummary(
      dataWithParsedGlobalFilters,
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
 * Lists all cases for a specific account with filtering, sorting, and pagination support.
 *
 * This controller method performs the following steps:
 * 1. Validates the incoming request parameters against the list cases schema.
 * 2. Extracts and parses filter parameters from the request query string.
 * 3. Extracts the user ID from the `x-user-id` request header for authentication.
 * 4. Calls the `listAllCasesAccount` method from the `caseService` to fetch paginated case data.
 * 5. Returns a success response with case data and pagination info, or an error response if failed.
 *
 * @param {Request} req - Express request object containing query parameters, filters, and user authentication headers.
 * @param {Response} res - Express response object used to send the HTTP response with case data.
 *
 * @returns {Promise<void>} - A Promise that resolves after sending the HTTP response.
 *
 * @description
 * - Supports advanced filtering by case name, status, owner, fiscal year, and other case attributes.
 * - Provides pagination with configurable page size and offset.
 * - Includes sorting capabilities by various case fields.
 * - Returns comprehensive case information including owner names, status descriptions, and filing types.
 * - Used by the frontend to display case lists with search and filter functionality.
 */
async function exportAllCasesSummary(req: Request, res: Response) {
  try {
    const methodName = "Export All Cases Summary";
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(
      req,
      exportCaseSummarySchema,
      res,
      "GET"
    );
    if (!value) return;
    let parsedFilters: Record<string, any> = {};
    let parsedGlobalFilters: Record<string, string[]> = {};

    try {
      parsedFilters = JSON.parse(value.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    try {
      parsedGlobalFilters = JSON.parse(value.globalFilters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid globalFilters format. Must be a valid JSON object."
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

    // Create modified data object with parsed globalFilters
    const dataWithParsedGlobalFilters = {
      ...value,
      globalFilters: parsedGlobalFilters,
      parsedFilters: parsedFilters,
    };

    const result = await caseService.listAllCasesSummary(
      dataWithParsedGlobalFilters,
      parsedFilters,
      userId,
      "download"
    );

    const fields = await caseService.getAllowedExportFields(
      userId,
      "cases_view_edit"
    );
    const [accountFields, caseFields] = await Promise.all([
      caseService.getAllowedExportFields(userId, "accounts_view_edit"),
      caseService.getAllowedExportFields(userId, "cases_view_edit"),
    ]);
    const allowedFieldSet = new Set<string>();
    for (const field of caseFields) {
      if (field.read) {
        allowedFieldSet.add(field.field_name);
      }
    }
    const requiredAccountFields = new Set(["account_name", "country_rid"]); // Add more if needed

    for (const field of accountFields) {
      if (field.read && requiredAccountFields.has(field.field_name)) {
        allowedFieldSet.add(field.field_name);
      }
    }
    const isValidTZ = value.timezone && isValidTimezone(value.timezone);
    const formatDate = (date?: Date | string | null) => {
      if (!date) return null;

      // Convert string to Date if needed
      const dateObj = date instanceof Date ? date : new Date(date);

      // Check if date is valid
      if (isNaN(dateObj.getTime())) return null;

      return moment(dateObj)
        .tz(isValidTZ ? value.timezone : "UTC")
        .format("YYYY-MMM-DD, hh:mm:ss A");
    };
    if (result.statusCode == HttpStatus.SUCCESS) {
      const finalStructuredData =
        result?.data?.caseInfo.length < 1
          ? []
          : result?.data?.caseInfo.map((d: any) => {
              let resultMap: { [key: string]: any } = {
                r_number: d.r_number,
                account_name: d.account_name,
                fiscal_year: `FY-${d.fiscal_year}`,
                status_name: d.status_name,
                case_owner_name: d.case_owner_name,
                filing_type_name: d.filing_type_name,
                case_total_project_cost: d.case_total_project_cost,
                case_total_projects: d.case_total_projects,
                case_total_qualified_projects: d.case_total_qualified_projects,
                case_total_rd_cost: d.case_total_rd_cost,
                case_total_qre_cost: d.case_total_qre_cost,
                description: d.description,
                case_name: `${d.account_name}-${d.country_code}-${d.fiscal_year}-${d.case_name}`,
                country_name: d.country_name,
                created_by: d.created_user_name,
                created_datetime: formatDate(d.created_datetime),
                modified_by: d.modified_user_name,
                modified_datetime:
                  d.modified_datetime == null
                    ? ""
                    : formatDate(d.modified_datetime),
                submitted_datetime:
                  d.submitted_datetime == null
                    ? ""
                    : formatDate(d.submitted_datetime),
                approved_datetime:
                  d.approved_datetime == null
                    ? ""
                    : formatDate(d.approved_datetime),
              };

              // Build exportRecord using allowed fields and resultMap
              const exportRecord: Record<string, any> = {};
              casesSummaryFieldMappings.forEach((mapping) => {
                if (allowedFieldSet.has(mapping.permissionField)) {
                  exportRecord[mapping.exportField] =
                    resultMap[mapping.dataField];
                }
              });

              return exportRecord;
            });

      const generateBase64Response = await generateExcelBase64(
        finalStructuredData,
        "Cases"
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

async function assignProjectToCase(req: Request, res: Response): Promise<any> {
  const methodName = "assignProjectToCase";
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
    const result = await caseService.assignProjectToCases(data, userId);
    if (result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } else if (result.statusCode === HttpStatus.BAD_REQUEST) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } else if (result.statusCode === HttpStatus.NOT_FOUND) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } else {
      return res.status(HttpStatus.FAILED).send({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result.statusMessage,
      });
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

async function fetchAssignedprojects(
  req: Request,
  res: Response
): Promise<any> {
  const methodName = "fetchAssignedprojects";
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
    const result = await caseService.fetchProjectsForAssign(data, true, userId, false);
    if (result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.projectsFetchedSuccess,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data: result.data,
      });
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

async function deleteProjectFromCase(
  req: Request,
  res: Response
): Promise<any> {
  const methodName = "deleteProjectFromCase";
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
    const result = await caseService.deleteAssignedProjectFromCases(
      data,
      userId
    );
    if (result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } else if (result.statusCode === HttpStatus.NOT_FOUND) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } else {
      return res.status(HttpStatus.FAILED).send({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result.statusMessage,
      });
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


async function getReviewProjects(req: Request, res: Response): Promise<void> {
  const methodName = "Get Review Projects";
  try {
    const userId = req.headers["x-user-id"] as string;
    const { accountRid, caseRid } = req.params;
    const value = await validateRequest(req, listReviewProjectSchema, res, "GET");
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
    const reviewProjects = await caseService.getReviewProjects(
      value,
      parsedFilters,
      userId,
      "list",
      accountRid!,
      caseRid!,
    );
    if (reviewProjects.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, reviewProjects.data);
      return;
    } else {
      errorLog(methodName, reviewProjects.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        reviewProjects.errorMessage
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

async function exportReviewProjects(req: Request, res: Response): Promise<void> {
  const methodName = "Export Review Projects";
  try {
    const userId = req.headers["x-user-id"] as string;
    const { accountRid, caseRid } = req.params;
    const value = await validateRequest(req, exportReviewProjectSchema, res, "GET");
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
    const reviewProjects = await caseService.getReviewProjects(
      value,
      parsedFilters,
      userId,
      "download",
      accountRid!,
      caseRid!,
    );
   const fields = await caseService.getAllowedExportFields(
      userId,
      "case_review_projects_view_edit"
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

    if (reviewProjects.statusCode === HttpStatus.SUCCESS) {
        const finalStructuredData =
        !reviewProjects?.data?.reviewProjects || reviewProjects.data.reviewProjects.length < 1
          ? []
          : reviewProjects.data.reviewProjects.map((d: any) => {
              let resultMap: { [key: string]: any } = {
                r_number: d.r_number,
                fiscal_year: `FY-${d.fiscal_year}`,
                program_name: d.project_name,
                project_code: d.project_code,
                industry_rid: d.industry_name,
                project_classification_rid: d.project_classification_name,
                project_type_rid: d.project_type_name,
                project_group: d.project_group,
                total_tasks: d.total_tasks,
                total_fte_prj: d.total_fte_prj,
                total_cost_prj: d.total_cost_prj,
                total_effort_prj: d.total_effort_prj,
                total_subcon_prj: d.total_subcon_prj,
                total_cost_fte_prj: d.total_cost_fte_prj,
                total_nonlabor_prj: d.total_nonlabor_prj,
                total_resources_prj: d.total_resources_prj,
                total_effort_fte_prj  : d.total_effort_fte_prj,
                total_cost_nonlabor_prj : d.total_cost_nonlabor_prj,
                total_effort_subcon_prj : d.total_effort_subcon_prj,
                project_point_of_contact: d.project_point_of_contact,
                project_point_of_contact_email: d.project_point_of_contact_email,
                total_technical_summaries: d.total_technical_summaries,


               
              };

              // Build exportRecord using allowed fields and resultMap
              const exportRecord: Record<string, any> = {};
              reviewProjectsFieldMappings.forEach((mapping) => {
                if (allowedFieldSet.has(mapping.permissionField)) {
                  exportRecord[mapping.exportField] =
                    resultMap[mapping.dataField];
                }
              });

              return exportRecord;
            });

      const generateBase64Response = await generateExcelBase64WithEmptyCheck(
        finalStructuredData,
        "Review Projects"
      );
      successLog(methodName);
      handleSuccessResponse(res, generateBase64Response);
      return;
    } else {
      errorLog(methodName, reviewProjects.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        reviewProjects.errorMessage
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
 * Handles the creation and management of case team members based on the incoming HTTP request.
 *
 * This async function validates the request body against a schema, extracts the user ID from headers,
 * and calls the case service to manage case team members with CRUD operations (add, edit, delete).
 * It supports batch operations and includes comprehensive timeline logging for audit purposes.
 * It sends back appropriate success or error responses based on the service outcome.
 *
 * @param {Request} req - Express request object containing case team data in the body and user ID in headers.
 * @param {Response} res - Express response object used to send back the operation result.
 *
 * @returns {Promise<void>} - Resolves after sending the response to the client.
 *
 * @throws {Error} - Throws if the request validation fails or the case service encounters an error.
 *
 * @description
 * - Supports adding, editing, and deleting team members with role assignments and effective date ranges.
 * - Validates date range overlaps to prevent conflicts in team member assignments.
 * - Automatically logs all operations to case timeline for comprehensive audit trail.
 * - Handles batch operations with ordered processing (delete → edit → add).
 * - Includes user and role name resolution for meaningful timeline descriptions.
 */
async function createCaseTeam(req: Request, res: Response): Promise<void> {
  const methodName = "Create case team";
  try {
    logMessage(
      `[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${
        req.headers["x-user-id"]
      }`
    );
    const value = await validateRequest(req, createCaseTeamSchema, res);
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
    const cases = await caseService.createCaseTeam(value, userId);
    if (cases.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, cases.data, cases.message);
      return;
    } else {
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
 * Retrieves the list of available case team roles from the system.
 *
 * This controller method performs the following steps:
 * 1. Calls the `getCaseTeamRoles` method from the `caseService`, which fetches all defined case team roles.
 * 2. If the service responds with success, logs the success event and sends an HTTP 200 response with the roles data.
 * 3. If the service responds with a failure status code, logs the error and returns a `BAD_REQUEST` response with the error message.
 * 4. Handles and logs any unexpected exceptions and returns a generic `BAD_REQUEST` response with the exception message.
 *
 * @param {Request} req - Express request object (not used directly in this function).
 * @param {Response} res - Express response object used to send the HTTP response with case team roles data.
 *
 * @returns {Promise<void>} - A Promise that resolves after the HTTP response is sent.
 *
 * @description
 * - Used for populating dropdown options in the frontend for case team role selection.
 * - Returns all available roles that can be assigned to team members (e.g., Lead Consultant, Tech Consultant, Reviewer).
 * - Provides standardized error handling and logging for debugging purposes.
 * - Essential for case team management and role-based assignment workflows.
 */
async function getCaseTeamRoles(req: Request, res: Response): Promise<void> {
  const methodName = "Get Case Team Roles";
  try {
    const caseTeamRoles = await caseService.getCaseTeamRoles();
    if (caseTeamRoles.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, caseTeamRoles.data);
      return;
    } else {
      errorLog(methodName, caseTeamRoles.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        caseTeamRoles.errorMessage
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
 * Lists all case team members for a specific case with filtering, sorting, and pagination support.
 *
 * This controller method performs the following steps:
 * 1. Validates the incoming request parameters against the list case team schema.
 * 2. Extracts and parses filter parameters from the request query string.
 * 3. Extracts the user ID from the `x-user-id` request header for authentication.
 * 4. Calls the `listCaseTeamMembers` method from the `caseService` to fetch paginated team member data.
 * 5. Returns a success response with team member data and pagination info, or an error response if failed.
 *
 * @param {Request} req - Express request object containing query parameters, filters, and user authentication headers.
 * @param {Response} res - Express response object used to send the HTTP response with case team member data.
 *
 * @returns {Promise<void>} - A Promise that resolves after sending the HTTP response.
 *
 * @description
 * - Supports advanced filtering by user name, role, effective dates, and other team member attributes.
 * - Provides pagination with configurable page size and offset.
 * - Includes sorting capabilities by various team member fields.
 * - Returns comprehensive team member information including user names, role descriptions, and effective date ranges.
 * - Used by the frontend to display case team member lists with search and filter functionality.
 * - Essential for case team management, assignment tracking, and team composition visibility.
 */
async function listCaseTeamMembers(req: Request, res: Response): Promise<void> {
  const methodName = "List Case Team Members";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, listCaseTeamSchema, res, "GET");
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
    const caseTeamMembers = await caseService.listCaseTeamMembers(
      value,
      parsedFilters,
      userId,
      "list"
    );
    if (caseTeamMembers.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, caseTeamMembers.data);
      return;
    } else {
      errorLog(methodName, caseTeamMembers.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        caseTeamMembers.errorMessage
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

async function exportAllAssignedProjects(req: Request, res: Response) {
  try {
    const methodName = "Export All Assigned Projects";
    const userId = req.headers["x-user-id"] as string;
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

    // Create modified data object with parsed globalFilters
    const data = req.body;
    data.userId = userId
    const result = await caseService.exportAssignedProjects(data);
    if (result.statusCode == HttpStatus.SUCCESS) {
      const generateBase64Response = await generateExcelBase64(
        result.data,
        "Cases"
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
 * Retrieves a list of users eligible to be assigned to case teams for a specific account.
 *
 * This controller method performs the following steps:
 * 1. Validates that the user ID is present in the request headers for authentication.
 * 2. Extracts the account RID from the request parameters to identify the target account.
 * 3. Calls the `listUsersForCaseTeam` method from the `caseService` to fetch available users.
 * 4. Returns a success response with user data if found, or an error response if the operation fails.
 *
 * @param {Request} req - Express request object containing:
 *   - headers: Must include 'x-user-id' for authentication
 *   - params: Must include 'accountRid' to specify the target account
 * @param {Response} res - Express response object used to send the HTTP response with user data
 *
 * @returns {Promise<void>} - A Promise that resolves after sending the HTTP response
 *
 * @throws {Error} - Handles validation errors, missing user ID, and service errors
 *
 * @description
 * HTTP Response Codes:
 * - 200: Users retrieved successfully with user data
 * - 400: Bad request (missing user ID or service error)
 * 
 * Use Cases:
 * - Populating user dropdown lists in case team assignment forms
 * - Filtering users based on account-specific permissions and roles
 * - Supporting case team member selection workflows
 * - Enabling dynamic user assignment based on account context
 * 
 * Security:
 * - Requires valid user authentication via 'x-user-id' header
 * - Account-based access control for user visibility
 * - Filters users based on account permissions and roles
 * 
 * Data Returned:
 * - User IDs, names, and relevant profile information
 * - Role information for team assignment context
 * - Account-specific user permissions and availability
 */
async function listUsersForCaseTeam(req: Request, res: Response): Promise<void> {
  const methodName = "List Users For Case Team";
  try {
    // Extract and validate user ID from request headers for authentication
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
    
    // Extract account RID from request parameters to identify target account
    const accountrid = req.params.accountRid as string;
    
    // Call the service layer to fetch users eligible for case team assignment
    const result = await caseService.listUsersForCaseTeam(accountrid);
    
    // Handle successful user retrieval
    if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, result.data);
      return;
    }
    else {
      // Handle service-level errors or cases where no users are found
      errorLog(methodName, result.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        result.errorMessage
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
 * Retrieves a list of users eligible to be assigned as case owners.
 * 
 * @param {Request} req - Express request object with user ID in headers
 * @param {Response} res - Express response object for sending user data
 * @returns {Promise<void>} Promise that resolves after sending HTTP response
 */
async function listUserForCaseOwner(req: Request, res: Response): Promise<void> {
  const methodName = "List User For Case Owner";
  try {
    // Extract and validate user ID from request headers for authentication
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
    
    
    // Call the service layer to fetch users eligible for case team assignment
    const result = await caseService.getCaseOwner();
    
    // Handle successful user retrieval
    if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, result.data);
      return;
    }
    else {
      // Handle service-level errors or cases where no users are found
      errorLog(methodName, result.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        result.errorMessage
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
    const cases = await caseService.createCheckList(value, userId);
    
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
    const cases = await caseService.updateCheckList(value, userId);
    
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

async function fetchCaseKanbanBoard (req : Request, res : Response) {
  const methodName = "fetchCaseKanbanBoard";
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
    const { accountRid, caseRid } = req.params;
    const result = await caseManagementService.fetchKanbanBoardForCase(accountRid!, caseRid!);
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.caseBreakdownSuccess,
        data: result.data,
      });      
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data: [],
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
    const value = await validateRequest(req, checklistByIdSchema, res,"GET");
    
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
        await caseService.getCheckListDetailsById(
          checkListRid,value
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
      return;    }
    const userId = req.headers['x-user-id'] as string;

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
    if (typeof value.filters === 'string') {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        console.error('Invalid filters JSON:', value.filters);
        value.filters = {};
      }
    }
    const attachments = await caseService.getAllChecklists(userId,value.attachmentLevel,value.entityId,value.accountRid,value.page,value.limit,value.search,value.filters,value.sortBy,value.sortOrder,value.fiscalYear,"download", {});

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
      return;    }
    const userId = req.headers['x-user-id'] as string;

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
    if (typeof value.filters === 'string') {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        console.error('Invalid filters JSON:', value.filters);
        value.filters = {};
      }
    }
    const checklists = await caseService.getAllChecklists(userId,value.attachmentLevel,value.entityId,value.accountRid,value.page,value.limit,value.search,value.filters,value.sortBy,value.sortOrder,value.fiscalYear,"list", {});
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
                fiscal_year: `FY-${d.fiscal_year}`,
                checklist_name: d.checklist_name,
                attachment_level: d.attachment_level,
                attach_to: d.attach_to,
                attached_to: d.attached_to,
                created_by: d.created_by_name,
                created_datetime: formatDate(d.created_datetime),
                modified_by: d.modified_by_name,
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
        "Cases"
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

/**
 * Controller function to handle the creation of a user-level task.
 *
 * This async function processes HTTP requests for creating a new task by:
 * - Validating the incoming request using the defined schema
 * - Ensuring that a valid user ID is present in the request headers
 * - Delegating the task creation logic to the `caseService.createUserLevelTask` method
 * - Returning appropriate HTTP responses based on the service result (success, bad request, or failure)
 *
 * Error handling:
 * - Logs and returns a `BAD_REQUEST` response if validation or internal errors occur
 *
 * @param {Request} req - Express request object containing the request body and headers
 * @param {Response} res - Express response object used to send the API response
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and handles any runtime or validation errors
 */
async function createTask (req : Request, res : Response) {
  const methodName = "Create Task";
  try {
  const value = await validateRequest(req, createTaskSchema, res, "POST");
    if (!value) {
      return;    }
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }
    const data = req.body;
    data.created_by = userId
    const result = await caseService.createUserLevelTask(data);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
        data: result.data,
      });       
    } else if(result.statusCode === HttpStatus.BAD_REQUEST) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
        data: result.data,
      }); 
    } else if(result.statusCode === HttpStatus.FAILED) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result.statusMessage,
        data: result.data,
      }); 
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
 * Controller function to handle updating an existing user-level task.
 *
 * This async function processes HTTP PUT requests for updating task details by:
 * - Validating the request body against the `updateTaskSchema`
 * - Ensuring a valid user ID is present in the request headers
 * - Adding the `modified_by` field based on the user ID
 * - Delegating update logic to the `caseService.updateUserLevelTask` method
 * - Returning appropriate responses based on the service execution result
 *
 * Error handling:
 * - Logs and returns a `BAD_REQUEST` response if validation fails or any runtime error occurs
 *
 * @param {Request} req - Express request object containing the updated task data and headers
 * @param {Response} res - Express response object used to send the API response
 * @returns {Promise<void>} - Resolves after sending the HTTP response to the client
 * @throws {Error} - Captures and handles any validation or service-related errors
 */
async function updateTask (req : Request, res : Response) {
  const methodName = "Create Task";
  try {
  const value = await validateRequest(req, updateTaskSchema, res, "PUT");
    if (!value) {
      return;    }
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }
    const data = req.body;
    data.modified_by = userId
    const result = await caseService.updateUserLevelTask(data);
    if(result!.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result!.statusMessage
      });       
    } else if(result!.statusCode === HttpStatus.BAD_REQUEST) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result!.statusMessage,
      }); 
    } else if(result!.statusCode === HttpStatus.FAILED) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result!.statusMessage,
      }); 
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
 * Controller function to fetch the list of tasks associated with a case.
 *
 * This async function processes HTTP requests to retrieve all tasks linked to one or more cases by:
 * - Validating that a valid user ID exists in the request headers
 * - Extracting request body parameters (like filters or case identifiers)
 * - Delegating task retrieval logic to the `caseService.taskListForCases` method
 * - Returning the list of tasks or an empty array if no data is found
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing
 * - Catches and handles any runtime or service-level errors with a `FAILED` response
 *
 * @param {Request} req - Express request object containing case filters or parameters in the body and user ID in headers
 * @param {Response} res - Express response object used to send the list of case tasks or an error message
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and handles service or validation errors gracefully
 */
async function fetchCaseTaskList (req : Request, res : Response) {
  const methodName = "fetchCaseTaskList";
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
    const result = await caseService.taskListForCases(data, false);
    if(result.statusCode == HttpStatus.SUCCESS) {
      let total = parseInt(result.data[0]?.total_result!);
      result.data.forEach((d : any) => {
        delete d.total_result
      })
      const finalData = {
        page : data.page,
        limit : data.limit,
        total_result : total,
        data : result.data
      }
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.userLevelTaskFetchSuccess,
        data: finalData,
      });      
    } else {
      const finalData = {
        page : data.page,
        limit : data.limit,
        total_result : 0,
        data : []
      }
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data: finalData,
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

/**
 * Controller function to handle the creation or mapping of tags to cases or entities.
 *
 * This async function processes HTTP requests to either create new tags or map existing ones by:
 * - Validating that a valid user ID exists in the request headers
 * - Extracting tag-related data from the request body
 * - Delegating the business logic to `caseService.createOrMapTags`
 * - Returning a success response with created/mapped tags or a fallback message if no data is available
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing
 * - Catches and handles runtime or service-level errors gracefully with a `FAILED` response
 *
 * @param {Request} req - Express request object containing tag creation/mapping data and user ID in headers
 * @param {Response} res - Express response object used to send the operation result back to the client
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and logs any validation or runtime errors
 */
async function createOrMapTags (req : Request, res : Response) {
  const methodName = "createOrMapTags"
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
    data.userId = userId  
    const result = await caseService.createOrMapTags(data);
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.tagsCreatedSuccesfully,
        data: result.data,
      });        
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.data,
        data: null
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

/**
 * Controller function to fetch all available tags for dropdown or selection purposes.
 *
 * This async function processes HTTP requests to retrieve the complete list of tags by:
 * - Validating that a valid user ID exists in the request headers
 * - Delegating the tag retrieval logic to `caseService.fetchTagsForDropdown`
 * - Returning the list of tags with a success message or an empty response if no data is found
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing in headers
 * - Catches and handles any runtime or service-level errors gracefully with a `FAILED` response
 *
 * @param {Request} req - Express request object containing user ID in headers
 * @param {Response} res - Express response object used to send the list of available tags or an error message
 * @returns {Promise<void>} - Resolves after sending the HTTP response to the client
 * @throws {Error} - Captures and logs any runtime or validation errors
 */
async function fetchAllTags(req : Request, res : Response) {
  const methodName = "fetchAllTags";
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
    const result = await caseService.fetchTagsForDropdown()
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.tagsListedSuccess,
        data: result.data,
      });   
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data: result.data,
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

/**
 * Controller function to add comments to a specific task.
 *
 * This async function processes HTTP requests for adding comments by:
 * - Validating that a valid user ID is present in the request headers
 * - Extracting comment details and task identifiers from the request body
 * - Delegating comment creation logic to `caseService.addCommentsToTask`
 * - Returning success or failure responses based on the service execution result
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing
 * - Catches and handles runtime or service-level errors gracefully with a `FAILED` response
 *
 * @param {Request} req - Express request object containing task and comment data in the body, and user ID in headers
 * @param {Response} res - Express response object used to send success or failure responses
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and logs any validation or runtime errors
 */
async function addCommentsToSpecificTask (req : Request, res : Response) {
  const methodName = "addCommentsToSpecificTask";
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
    let fileArray : Express.Multer.File[] | [];
    if(Array.isArray(req.files)) {
      fileArray = req.files
    } else {
      fileArray = []
    }
    const result = await caseService.addCommentsToTask(data, userId, fileArray);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.commentsAddedSuccess,
        data: result.data,
      }); 
    } else {
      return res.status(HttpStatus.FAILED).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: STATUS_MESSAGE.commentsFailed,
        data: result.data,
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

/**
 * Controller function to handle exporting case tasks.
 *
 * This async function processes HTTP requests for exporting case tasks by:
 * - Validating that a valid user ID is present in the request headers
 * - Extracting export filters and parameters from the request body
 * - Delegating export logic to the `caseService.exportTask` method
 * - Returning a success response with exported data (file/records) or a message if no data is found
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing
 * - Catches and handles any runtime or service-level errors gracefully with a `FAILED` response
 *
 * @param {Request} req - Express request object containing export parameters and user ID in headers
 * @param {Response} res - Express response object used to send the export result or error message
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and logs any validation or runtime errors
 */
async function exportCaseTask (req : Request, res : Response) {
  const methodName = "exportCaseTask";
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
    const result = await caseService.exportTask(data, userId);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.taskExportedSuccess,
        data: result.data,
      }); 
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data: result.data,
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

/**
 * Controller function to handle updating comments for a specific task.
 *
 * This async function processes HTTP requests to update an existing comment associated with a case task by:
 * - Validating that a valid user ID is provided in the request headers
 * - Extracting updated comment data and task identifiers from the request body
 * - Calling the `caseService.updateComments` method to perform the update in the database
 * - Returning a success response with an appropriate status message based on the operation result
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing
 * - Catches and handles runtime or service-level errors gracefully with a `FAILED` response
 *
 * @param {Request} req - Express request object containing updated comment data and user ID in headers
 * @param {Response} res - Express response object used to send the update result or error message
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and logs any validation or runtime errors
 */
async function updateTaskComments (req : Request, res : Response) {
  const methodName = "updateTaskComments";
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
    let fileArray : Express.Multer.File[] | [];
    if(Array.isArray(req.files)) {
      fileArray = req.files
    } else {
      fileArray = []
    }
    data.deleted_file_ids = JSON.parse(data.deleted_file_ids)
    const result = await caseService.updateComments(data, userId, fileArray);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      }); 
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
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

/**
 * Controller function to handle deleting comments from a specific task.
 *
 * This async function processes HTTP DELETE requests to remove a comment associated with a case task by:
 * - Validating that a valid user ID is provided in the request headers
 * - Extracting the comment ID and task information from the request body
 * - Invoking the `caseService.deleteComments` method to perform the deletion in the database
 * - Returning an appropriate success or failure response based on the operation outcome
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing
 * - Returns a `FAILED` response if the comment deletion fails
 * - Catches and handles runtime or service-level errors gracefully
 *
 * @param {Request} req - Express request object containing comment details and user ID in headers
 * @param {Response} res - Express response object used to send the deletion result or error message
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and logs any validation or runtime errors
 */
async function deleteTaskComments (req : Request, res : Response) {
  const methodName = "deleteTaskComments";
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
    const result = await caseService.deleteComments(data, userId);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      }); 
    } else if(result.statusCode === HttpStatus.FAILED){
      return res.status(HttpStatus.FAILED).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result.statusMessage,
      }); 
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
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

/**
 * Controller function to handle fetching comments for a specific task.
 *
 * This async function processes HTTP requests to retrieve all comments associated with a given task by:
 * - Validating that a valid user ID is present in the request headers
 * - Extracting task identifiers or filter parameters from the request body
 * - Delegating the comment retrieval logic to the `caseService.fetchTaskComment` method
 * - Returning a success response with the fetched comments or a message if no comments are found
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing
 * - Returns a `FAILED` response in case of runtime or service-level errors
 * - Logs all errors for debugging and traceability
 *
 * @param {Request} req - Express request object containing task identification details and user ID in headers
 * @param {Response} res - Express response object used to send the list of comments or an error message
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and handles validation or runtime exceptions
 */
async function fetchTaskCommentsList (req : Request, res : Response) {
  const methodName = "fetchTaskCommentsList";
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
    const result = await caseService.fetchTaskComment(data);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.commentsFetchedSuccess,
        data : result.data
      }); 
    } else {
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

/**
 * Controller function to handle adding attachments to a specific task.
 *
 * This async function processes HTTP requests that upload and associate one or more files with a case task by:
 * - Validating that a valid user ID is present in the request headers
 * - Extracting file(s) from the `req.files` object (handled via Multer middleware)
 * - Extracting task-related metadata from the request body
 * - Delegating the upload and association logic to the `caseService.addTaskLevelAttachment` method
 * - Returning a success or failure response based on the result of the service operation
 *
 * File handling:
 * - Supports multiple file uploads via `upload.array()` in the route definition
 * - Ensures a fallback to an empty array if no files are uploaded
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing
 * - Returns a `FAILED` response if attachment upload or mapping fails
 * - Catches and handles runtime or service-level errors gracefully
 *
 * @param {Request} req - Express request object containing task details, uploaded files, and user ID in headers
 * @param {Response} res - Express response object used to send the upload result or error message
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and logs any validation, upload, or runtime errors
 */
async function addTaskAttachments (req : Request, res : Response) {
  const methodName = "addTaskAttachments"
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
    let fileArray : Express.Multer.File[] | [];
    if(Array.isArray(req.files)) {
      fileArray = req.files
    } else {
      fileArray = []
    }
    const result = await caseService.addTaskLevelAttachment(data, userId, fileArray);
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } else {
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

/**
 * Controller function to handle deleting attachments from a specific task.
 *
 * This async function processes HTTP DELETE requests to remove one or more attachments linked to a case task by:
 * - Validating that a valid user ID is provided in the request headers
 * - Extracting task and attachment identifiers from the request body
 * - Delegating the deletion logic to the `caseService.deleteTaskLevelAttachment` method
 * - Returning an appropriate HTTP response based on whether the deletion succeeded, failed, or if the attachment was not found
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing
 * - Returns a `FAILED` response if the deletion operation encounters errors
 * - Gracefully handles `NOT_FOUND` scenarios where no attachments match the provided identifiers
 * - Catches and handles unexpected runtime or service-level errors
 *
 * @param {Request} req - Express request object containing attachment and task identifiers, and user ID in headers
 * @param {Response} res - Express response object used to send the deletion result or error message
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and logs any validation or runtime errors
 */
async function deleteTaskAttachments (req : Request, res : Response) {
  const methodName = "deleteTaskAttachments"
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
    const result = await caseService.deleteTaskLevelAttachment(data, userId);
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } 
    else if(result.statusCode === HttpStatus.NOT_FOUND) {
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

/**
 * Controller function to handle fetching the list of attachments for a specific task.
 *
 * This async function processes HTTP requests to retrieve all attachments linked to a particular case task by:
 * - Validating that a valid user ID is provided in the request headers
 * - Extracting the necessary identifiers from the request body
 * - Invoking the `caseService.listTaskLevelAttachment` method to fetch attachments from the database
 * - Returning the list of attachments with appropriate HTTP status and messages
 *
 * Response handling:
 * - Returns `SUCCESS` with the list of attachments when found
 * - Returns `SUCCESS` with an `attachmentNotFound` message when no attachments exist for the given task
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing in the headers
 * - Returns a `FAILED` response in case of service or runtime errors
 *
 * @param {Request} req - Express request object containing task identifiers in the body and user ID in headers
 * @param {Response} res - Express response object used to return the attachment list or error message
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and logs any runtime or validation errors
 */
async function listTaskAttachments (req : Request, res : Response) {
  const methodName = "listTaskAttachments"
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
    const result = await caseService.listTaskLevelAttachment(data);
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.attachementTaskListSuccess,
        data : result.data
      });
    } 
    else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.attachmentNotFound,
        data : result.data
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

/**
 * Controller function to fetch all activity logs related to a specific task.
 *
 * This asynchronous function handles incoming requests to retrieve the complete activity history
 * of a case task (e.g., updates, comments, attachments, and other events).  
 * It validates user authentication, delegates the data retrieval to the service layer, and 
 * returns an appropriate structured response.
 *
 * Workflow:
 * 1. Validates that `x-user-id` is present in the request headers.
 * 2. Extracts task-related identifiers or filters from the request body.
 * 3. Invokes `caseService.fetchAllTaskActivities` to fetch task activity details.
 * 4. Responds with:
 *    - `SUCCESS` and `activitiesFetchedSuccess` when data is found.
 *    - `SUCCESS` and `dataNotAvailable` when no activity data exists.
 *
 * Error handling:
 * - Returns `BAD_REQUEST` if the user ID header is missing.
 * - Returns `FAILED` if an exception occurs during processing.
 *
 * @param {Request} req - Express request object containing user ID in headers and task filter details in the body.
 * @param {Response} res - Express response object used to return task activity data or error messages.
 * @returns {Promise<void>} - Resolves when the response has been sent.
 * @throws {Error} - Logs and handles unexpected runtime or service-layer errors.
 */
async function fetchTaskActivity (req : Request, res : Response) {
  const methodName = "fetchTaskActivity"
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
    const result = await caseService.fetchAllTaskActivities(data);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.activitiesFetchedSuccess,
        data : result.data
      });
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data : result.data
      });
    }

  }
  catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller to fetch detailed information related to a specific task.
 *
 * This function retrieves task card details (such as metadata, assigned users,
 * priority, due dates, and related case/task attributes) via the service layer.
 * It ensures user authentication, processes request payload, and responds with
 * appropriate status messages and data.
 *
 * Workflow:
 * 1. Validates that `x-user-id` exists in the request headers.
 * 2. Extracts required task identifiers and filters from the request body.
 * 3. Calls `caseService.fetchTaskCardDetailsList` to fetch task-level details.
 * 4. Responds with:
 *    - `SUCCESS` and `activitiesFetchedSuccess` if data exists.
 *    - `SUCCESS` and `dataNotAvailable` if no matching task details are found.
 *
 * Error Handling:
 * - Returns `BAD_REQUEST` if missing user ID.
 * - Returns `FAILED` for any unexpected errors.
 *
 * @param {Request} req - Express request object containing headers and task detail input.
 * @param {Response} res - Express response object used to return result data or error messages.
 * @returns {Promise<void>} - Sends the API response and resolves.
 */
async function fetchTaskDetails (req : Request, res : Response) {
  const methodName = "fetchTaskDetails"
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
    const result = await caseService.fetchTaskCardDetailsList(data);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.activitiesFetchedSuccess,
        data : result.data
      });
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data : result.data
      });
    }

  }
  catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller to fetch the list of available case priority options.
 *
 * This endpoint retrieves predefined priority levels used for case/task
 * management (e.g., High, Medium, Low).  
 * It ensures authentication, fetches priority data through the service layer,
 * and returns an appropriate response based on data availability.
 *
 * Workflow:
 * 1. Validates that `x-user-id` is present in the request headers.
 * 2. Calls `caseService.getCasePriortyList()` to retrieve priority values.
 * 3. Responds with:
 *    - `SUCCESS` and `casePriorityListedSuccess` if priorities exist.
 *    - `SUCCESS` and `dataNotAvailable` with an empty list if no priorities exist.
 *
 * Error Handling:
 * - Returns `BAD_REQUEST` if user ID is missing.
 * - Returns `FAILED` for unexpected server or runtime errors.
 *
 * @param {Request} req - Express request object containing user headers.
 * @param {Response} res - Express response object for sending the result.
 * @returns {Promise<void>} - Sends JSON response and resolves.
 */
async function fetchCasePriority (req : Request, res : Response) {
  const methodName = "fetchCasePriority"
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
    const result = await caseService.getCasePriortyList();
    if(result.length > 0) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.casePriorityListedSuccess,
        data : result
      });
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data : []
      });
    }

  }
  catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller to fetch the list of task status values for cases.
 *
 * This endpoint retrieves the available task status options used in
 * the case/task workflow (e.g., Open, In Progress, Completed).
 * It ensures that the user is authenticated, calls the service layer
 * to fetch the task status list, and returns a consistent JSON response.
 *
 * Workflow:
 * 1. Confirms that the `x-user-id` header is provided.
 * 2. Invokes `caseService.getCaseTaskStatusList()` to fetch status metadata.
 * 3. Responds with:
 *    - `SUCCESS` and `caseTaskStatusListedSuccess` when data exists.
 *    - `SUCCESS` and `dataNotAvailable` with an empty list when no statuses are found.
 *
 * Error Handling:
 * - Returns `BAD_REQUEST` when the user ID is missing.
 * - Returns `FAILED` with a descriptive message in case of unexpected errors.
 *
 * @param {Request} req - Express request object containing user ID in headers
 * @param {Response} res - Express response object used to send the result
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 */
async function fetchCaseTaskStatus (req : Request, res : Response) {
  const methodName = "fetchCaseTaskStatus"
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
    const result = await caseService.getCaseTaskStatusList();
    if(result.length > 0) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.caseTaskStatusListedSuccess,
        data : result
      });
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data : []
      });
    }

  }
  catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller to add collaborators to a specific task.
 *
 * This function handles HTTP requests for assigning collaborators to a task.
 * It performs validation, enriches the request data with metadata, and then
 * delegates the core logic to `caseService.addCollaboratorToTask()`.
 *
 * Key Responsibilities:
 * - Validates the presence of a valid `x-user-id` header
 * - Injects `created_by` into the request body for auditing purposes
 * - Calls the service to add collaborators to the task
 * - Returns success, validation error, or failure responses accordingly
 *
 * Response Behavior:
 * - **SUCCESS** → Responds with a success message when collaborators are added
 * - **BAD_REQUEST** → Responds when required data is missing or invalid
 * - **FAILED** → Responds to unexpected service-level or internal errors
 *
 * Error Handling:
 * - Missing user ID → Returns `BAD_REQUEST`
 * - Any internal exception → Returns `FAILED` with the error message
 *
 * @param {Request} req - Express request containing collaborator data and user ID in headers
 * @param {Response} res - Express response used to send the outcome
 * @returns {Promise<void>} - Completes after responding to the client
 */
async function addCollaborators (req : Request, res : Response) {
  const methodName = "addCollaborators"
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
    const result = await caseService.addCollaboratorToTask(data);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.caseTaskStatusListedSuccess,
      });
    } else if (result.statusCode === HttpStatus.BAD_REQUEST) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        statusCodeValue: HttpStatus.BAD_REQUEST_MESSAGE,
        statusMessage: result.statusMessage
      });
    } else {
      return res.status(HttpStatus.FAILED).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result.statusMessage
      });
    }

  }
  catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller to list collaborators for a specific case or task.
 *
 * This function handles HTTP requests to fetch the list of collaborators
 * associated with the provided input criteria. It validates required headers,
 * forwards the request data to the service layer, and formats the response
 * consistently.
 *
 * Key Responsibilities:
 * - Validates the presence of a valid `x-user-id` header
 * - Delegates the retrieval logic to `caseService.getCollaboratorsList()`
 * - Returns collaborator list data if available, otherwise an empty array
 *
 * Response Behavior:
 * - **SUCCESS** → Returns the collaborators list or an empty array with a success message
 * - **BAD_REQUEST** → Triggered when the required header `x-user-id` is missing
 * - **FAILED** → Triggered for service-level or unexpected internal errors
 *
 * Error Handling:
 * - Missing `x-user-id` → Responds with `BAD_REQUEST`
 * - Exceptions thrown by the service → Responds with `FAILED` and error details
 *
 * @param {Request} req - Express request containing filtering data in body and user ID in headers
 * @param {Response} res - Express response used to return the API result
 * @returns {Promise<void>} - Resolves after sending an HTTP response
 */
async function listCollaborators (req : Request, res : Response) {
  const methodName = "listCollaborators"
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
    const result : any = await caseService.getCollaboratorsList(data);
    if(result?.length > 0) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.collaboratorsListedSuccess,
        data : result
      });
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data : []
      });
    }
  }
  catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}
export default {
  createCases,
  updateCases,
  getCaseFilingType,
  getCaseHeadersDetails,
  getCaseStatus,
  fetchProjectForAssign,
  assignProjectToCase,
  fetchAssignedprojects,
  listAllCasesAccount,
  exportAllCasesAccount,
  deleteProjectFromCase,
  listAllCasesSummary,
  exportAllCasesSummary,
  createCaseTeam,
  getCaseTeamRoles,
  listCaseTeamMembers,
  exportAllAssignedProjects,
  listUsersForCaseTeam,
  listUserForCaseOwner,
  createCheckList,
  updateCheckList,
  fetchCaseKanbanBoard,
  getCheckListDetailsById,
  getAllChecklists,
  exportAllChecklists,
  createTask,
  updateTask,
  getChecklistStatus,
  fetchCaseTaskList,
  createOrMapTags,
  fetchAllTags,
  addCommentsToSpecificTask,
  exportCaseTask,
  updateTaskComments,
  deleteTaskComments,
  fetchTaskCommentsList,
  addTaskAttachments,
  deleteTaskAttachments,
  listTaskAttachments,
  getReviewProjects,
  exportReviewProjects,
  fetchTaskActivity,
  fetchTaskDetails,
  fetchCaseTaskStatus,
  fetchCasePriority,
  addCollaborators,
  listCollaborators
};
