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
  HttpStatus,

  STATUS_MESSAGE,
} from "../utils/constants";
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
import { checklistsFieldMappings, reviewProjectsFieldMappings,
    casesFieldMappings,
  casesSummaryFieldMappings,
 } from "../utils/excelExportMapping";

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
    const accessToken = req.headers["authorization"]?.split(' ')[1] as string;
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
    const cases = await caseService.createCase(value, userId,accessToken);
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
    const accessToken = req.headers["authorization"]?.split(' ')[1] as string;  
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
    const response = await caseService.updateCase(value, userId, accessToken);
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
    const value = await validateRequest(req, listCaseSummarySchema, res);
    if (!value) return;
    let parsedFilters: Record<string, any> = {};
    let parsedGlobalFilters: Record<string, string[]> = {};

   

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
      globalFilters: value.globalFilters,
      parsedFilters: value.filters,
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
      "POST"
    );
    if (!value) return;
    let parsedFilters: Record<string, any> = {};
    let parsedGlobalFilters: Record<string, string[]> = {};

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
      globalFilters: value.globalFilters,
      parsedFilters: value.filters,
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

async function sentReviewProjects(req: Request, res: Response): Promise<void> {
  const methodName = "Sent Review Projects";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, sentReviewProjectSchema, res);
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
      let fileArray: Express.Multer.File[] | [];
    if (Array.isArray(req.files)) {
      fileArray = req.files;
    } else {
      fileArray = [];
    }
    const reviewProjects = await caseService.sentReviewProjects(
      value,
      parsedFilters,
      userId,
      fileArray
    );
    if (reviewProjects.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, reviewProjects.data, reviewProjects.message);
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

async function getEmailTemplatePreview(req: Request, res: Response): Promise<void> {
  const methodName = "Get Email Template Preview";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, getEmailTemplatePreviewSchema, res, "GET");
    if (!value) return;
    const templateDetails = await caseService.getEmailTemplatePreview(
      value,
      userId
    );
    if (templateDetails.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, templateDetails.data, templateDetails.statusMessage);
      return;
    } else {
      errorLog(methodName, templateDetails.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        templateDetails.errorMessage
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
                project_name: d.project_name,
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
                total_cost_subcon_prj:d.total_cost_subcon_prj,
                total_nonlabor_prj: d.total_nonlabor_prj,
                total_resources_prj: d.total_resources_prj,
                total_effort_fte_prj  : d.total_effort_fte_prj,
                total_cost_nonlabor_prj : d.total_cost_nonlabor_prj,
                total_effort_subcon_prj : d.total_effort_subcon_prj,
                primary_point_of_contact: d.project_point_of_contact,
                primary_point_of_contact_email: d.project_point_of_contact_email,
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
    const accessToken = req.headers["authorization"] as string;
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
    const cases = await caseService.createCaseTeam(value, userId,accessToken);
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
      "list",
      value.is_dropdown_list
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
        "Case Assigned Projects"
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
    const userAccessScope = req.query.user_access_scope as string || 'account'
    
    // Call the service layer to fetch users eligible for case team assignment
    const result = await caseService.listUsersForCaseTeam(accountrid,userAccessScope);
    
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

async function getCaseSubmissionDate(req: Request, res: Response): Promise<void> {
  const methodName = "Get Case Submission Date";
  try {
     const value = await validateRequest(req, caseSubmissionDateSchema, res,"GET");
    const caseSubmissionDate = await caseService.getCaseSubmissionDate(value);
    if (caseSubmissionDate.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, caseSubmissionDate.data);
      return;
    } else {
      errorLog(methodName, caseSubmissionDate.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        caseSubmissionDate.errorMessage
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
 * Controller to sign off technical documentation for a project.
 *
 * This function handles HTTP requests to perform the sign-off action
 * on a project’s technical documentation. It validates required headers,
 * forwards the request payload to the service layer, and returns a
 * standardized API response based on the outcome.
 *
 * Key Responsibilities:
 * - Validates the presence of a valid `x-user-id` header
 * - Delegates the sign-off operation to `caseService.signOffTechnicalDocumentation()`
 * - Formats and returns success or error responses consistently
 *
 * Response Behavior:
 * - **SUCCESS** → Technical documentation sign-off completed successfully
 * - **BAD_REQUEST** → Triggered when required input is missing, invalid, or documentation is already signed off
 * - **NOT_FOUND** → Triggered when the specified project or documentation does not exist
 *
 * Error Handling:
 * - Missing `x-user-id` header → Responds with `BAD_REQUEST`
 * - Service-level validation failures → Responds with the respective status code
 * - Unexpected exceptions → Responds with `BAD_REQUEST` and error details
 *
 * @param {Request} req - Express request containing sign-off details in the request body and user ID in headers
 * @param {Response} res - Express response used to return the API result
 * @returns {Promise<void>} - Resolves after sending an HTTP response
 */
async function signoffTechnicalDocumentation (req : Request, res : Response) {
  const methodName = "signoffTechnicalDocumentation";
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
    const result = await caseService.signOffTechnicalDocumentation(data);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage
      }); 
    } else if(result.statusCode === HttpStatus.BAD_REQUEST) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        statusCodeValue: HttpStatus.BAD_REQUEST_MESSAGE,
        statusMessage: result.statusMessage
      });
    } else if(result.statusCode === HttpStatus.NOT_FOUND) {
      return res.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        statusCodeValue: HttpStatus.NOT_FOUND_MESSAGE,
        statusMessage: result.statusMessage
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
  fetchCaseKanbanBoard,
  getChecklistStatus,
  getReviewProjects,
  exportReviewProjects,
  sentReviewProjects,
  getEmailTemplatePreview,
  getCaseSubmissionDate,
  signoffTechnicalDocumentation
};
