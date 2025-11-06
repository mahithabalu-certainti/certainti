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
  casesFieldMappings,
  casesSummaryFieldMappings,
  HttpStatus,
  STATUS_MESSAGE,
} from "../utils/constants";
import {
  checklistSchema,
  createCaseSchema,
  createCaseTeamSchema,
  exportCasesAccountSchema,
  exportCaseSummarySchema,
  listCasesAccountSchema,
  listCaseSummarySchema,
  listCaseTeamSchema,
  updateCaseSchema,
} from "../lib/joi/schemas/schema";
import configurations from "../config/config";
import moment from "moment";

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
      const offsetMs = (5 * 60 + 30) * 60 * 1000;
      const convertedDate = new Date(date?.getTime() ?? "" + offsetMs);
      return date
        ? moment
            .utc(convertedDate)
            .tz(isValidTZ ? value.timezone : "UTC")
            .utcOffset("-012:30")
            .format("YYYY-MMM-DD, hh:mm:ss A")
        : null;
    };
    if (result.statusCode === HttpStatus.SUCCESS) {
      const finalStructuredData =
        result?.data?.caseInfo.length < 1
          ? []
          : result?.data?.caseInfo.map((d: any) => {
              let resultMap: { [key: string]: any } = {
                r_number: d.r_number,
                fiscal_year: d.fiscal_year,
                status_name: d.status_name,
                case_owner_name: d.case_owner_name,
                filing_type_name: d.filing_type_name,
                case_total_project_cost: d.case_total_project_cost,
                case_total_projects: d.case_total_projects,
                case_total_rd_cost: d.case_total_rd_cost,
                case_total_qre_cost: d.case_total_qre_cost,
                description: d.description,
                case_name:
                  d.account_name ||
                  "-" ||
                  d.country_code ||
                  "-" ||
                  d.fiscal_year ||
                  "-" ||
                  d.case_name,
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

      const offsetMs = (5 * 60 + 30) * 60 * 1000;
      const convertedDate = new Date(dateObj.getTime() + offsetMs);

      return moment
        .utc(convertedDate)
        .tz(isValidTZ ? value.timezone : "UTC")
        .utcOffset("-012:30")
        .format("YYYY-MMM-DD, hh:mm:ss A");
    };
    if (result.statusCode == HttpStatus.SUCCESS) {
      console.log("Export result data:", result.data);
      const finalStructuredData =
        result?.data?.caseInfo.length < 1
          ? []
          : result?.data?.caseInfo.map((d: any) => {
              let resultMap: { [key: string]: any } = {
                r_number: d.r_number,
                account_name: d.account_name,
                fiscal_year: d.fiscal_year,
                status_name: d.status_name,
                case_owner_name: d.case_owner_name,
                filing_type_name: d.filing_type_name,
                case_total_project_cost: d.case_total_project_cost,
                case_total_projects: d.case_total_projects,
                case_total_qualified_projects: d.case_total_qualified_projects,
                case_total_rd_cost: d.case_total_rd_cost,
                case_total_qre_cost: d.case_total_qre_cost,
                description: d.description,
                case_name:
                  d.account_name ||
                  "-" ||
                  d.country_code ||
                  "-" ||
                  d.fiscal_year ||
                  "-" ||
                  d.case_name,
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
    console.log("Error in exportAllCasesSummary:", error);
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
    console.log("Error in exportAllCasesSummary:", error);
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
  createCheckList
};
