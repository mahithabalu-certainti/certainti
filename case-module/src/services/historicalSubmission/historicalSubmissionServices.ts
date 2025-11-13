import { Logger } from "winston";
import { Sequelize } from "sequelize";
import { CaseModelService } from "../caseModelsService";
import { HistoricalSubmissionSchemaService } from "./schemaService";
import { HttpStatus, STATUS_MESSAGE } from "../../utils/constants";
import { logMessage } from "../../utils/helpers";
import { ICreateHistoricalSubmission } from "../../utils/types";
import CaseSchemaService from "../cases/schemaService";

export class HistoricalSubmissionService {
  private historicalSubmissionSchemaService: HistoricalSubmissionSchemaService;
  private caseModelService: CaseModelService;
  private caseSchemaService: CaseSchemaService;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.historicalSubmissionSchemaService = new HistoricalSubmissionSchemaService();
    this.caseModelService = new CaseModelService();
    this.caseSchemaService = new CaseSchemaService();
  }

  /**
   * Formats an error response to be returned from service methods.
   *
   * @param {Error} err - The caught error object containing error details.
   *
   * @returns {{
   *   statusCode: number;
   *   message: string;
   *   errorMessage: string;
   * }} - Standardized error response object with consistent structure.
   *
   * @description
   * - Converts any caught error into a standardized service error format.
   * - Sets status code to FAILED (500) for consistent error handling.
   * - Preserves the original error message for debugging purposes.
   * - Used across all service methods to maintain consistent error response structure.
   * - Ensures all service errors follow the same format for frontend consumption.
   */
  throwServiceError(err: Error): {
    statusCode: number;
    message: string;
    errorMessage: string;
  } {
    return {
      statusCode: HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage: err.message,
    };
  }

  /**
   * Lists historical submissions for a specific case with advanced filtering, sorting, and pagination support.
   *
   * @param {any} data - Request data containing account_rid, case_rid, pagination parameters, and sorting options.
   * @param {Record<string, any>} filters - Filter criteria for submission search (fiscal year, project counts, financial metrics, etc.).
   * @param {string} userId - The ID of the user requesting the submission list for authorization.
   * @param {string} apiType - The type of API call ('list' for pagination, 'download' for export).
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { historicalSubmissions: any };
   * }>} - Result containing paginated submission data or error information.
   *
   * @description
   * - Validates account information and retrieves account details for multi-tenant support.
   * - Supports comprehensive filtering by fiscal year, project counts, financial metrics, and submission status.
   * - Provides pagination with configurable page size and offset for large submission datasets.
   * - Includes sorting capabilities by various submission attributes.
   * - Returns detailed submission information including financial data, project metrics, and fiscal year details.
   * - Handles both list and export operations based on apiType parameter.
   * - Essential for historical data management, financial tracking, and compliance reporting interfaces.
   * - Catches and logs errors with standardized service error handling.
   */
  async listHistoricalSubmission(
    data: any,
    filters: Record<string, any>,
    userId: string,
    apiType: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { historicalSubmissions: any };
  }> {
    try {
      const { accountNumber } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          data.account_rid
        );

      if (!accountNumber) {
        logMessage(`Invalid account ID ${data.account_rid}`);
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid account ID",
        };
      }
      const historicalSubmissions = await this.historicalSubmissionSchemaService.listHistoricalSubmission(
        accountNumber,
        data,
        userId,
        apiType
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          historicalSubmissions,
        },
      };
    } catch (err) {
      logMessage(`Error fetching historical submissions, ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }

  /**
   * Creates and manages historical submissions with comprehensive CRUD operations and timeline logging.
   *
   * @param {ICreateHistoricalSubmission} submissionRequest - The historical submission data containing financial metrics, project counts, fiscal years, and action types.
   * @param {string} userId - The ID of the user performing the submission operations.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: any;
   * }>} - Result of the submission management operations, including status code, message, optional error message, and validation results.
   *
   * @description
   * - Supports batch operations for adding, editing, and deleting historical submissions.
   * - Validates account information and retrieves account details for multi-tenant support.
   * - Performs fiscal year uniqueness validation to prevent duplicate submissions for the same case and year.
   * - Processes operations in ordered sequence: delete → edit → add for data consistency.
   * - Automatically logs all operations to case timeline with detailed descriptions including fiscal years and case names.
   * - Returns comprehensive validation results and operation summaries.
   * - Handles errors gracefully with detailed logging and standardized error responses.
   * - Essential for historical data management, financial compliance, and audit trail maintenance.
   */
  async createHistoricalSubmission(
    submissionRequest: ICreateHistoricalSubmission,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }> {
    try {
      submissionRequest.created_by = userId;
      const { accountNumber, parentAccountId } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          submissionRequest.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const response = await this.historicalSubmissionSchemaService.createHistoricalSubmission(
        accountNumber,
        submissionRequest,
        userId
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.historicalSubmissionCreated,
        data: response.validationErrors,
      };
    } catch (err) {
      logMessage(`Error creating historical submission, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.historicalSubmissionCreationFailed,
      };
    }
  }

}