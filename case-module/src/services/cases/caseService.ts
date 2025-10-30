import { Op, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Logger } from "winston";
import { CaseModelService } from "../caseModelsService";
import CaseSchemaService from "./schemaService";
import { ICreateCases } from "../../utils/types";
import { logMessage } from "../../utils/helpers";
import {
  caseStatuses,
  HttpStatus,
  STATUS_MESSAGE,
} from "../../utils/constants";
export class CaseService {
  private caseSchemaService: CaseSchemaService;
  private caseModelService: CaseModelService; // Assuming this is defined somewhere in your code
  private logger: Logger;
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;

  constructor(logger: Logger) {
    this.logger = logger;
    this.caseSchemaService = new CaseSchemaService();
    this.caseModelService = new CaseModelService(); // Initialize your model service here
  }

  /**
   * Creates a new case along with its associated data within a database transaction.
   *
   * @param {ICreateCases} caseRequest - The case data to create, including account information, case details, and metadata.
   * @param {string} userId - The ID of the user creating the case.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { cases: any };
   * }>} - Result of the creation process, including status code, message, optional error message, and case data if successful.
   *
   * @description
   * - Initializes database transaction for atomic operations.
   * - Sets the created_by field to the provided userId.
   * - Validates account information and retrieves account details.
   * - Sets default case status to 'IN PROGRESS' for new cases.
   * - Creates the case record in the database.
   * - Adds case summary information for reporting purposes.
   * - Commits transaction on success or rolls back on error.
   * - Returns success response with case data or error response accordingly.
   * - Catches and logs errors, returning a failed status with an error message.
   */ 

  async createCase(
    caseRequest: ICreateCases,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { cases: any };
  }> {
    const dbInit = await this.caseModelService.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      caseRequest.created_by = userId;
      const { accountNumber, parentAccountId } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          caseRequest.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const { statusRid } = await this.getCaseStatusForCreate();
      caseRequest.status_rid = statusRid || "";
      const response = await this.caseSchemaService.createCases(
        accountNumber,
        caseRequest,
        transaction
      );
      if (response) {
        logMessage(`Case created with RID: ${response.rid}`);
        await this.caseSchemaService.addCaseSummary(
          accountNumber,
          caseRequest,
          response.rid,
          response.get("r_number") || ""
        );
      }

      await transaction.commit();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.caseCreated,
        data: {
          cases: response,
        },
      };
    } catch (err) {
      logMessage(`Error creating case, ${err}`);
      await transaction.rollback();
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.caseCreationFailed,
      };
    }
  }

  /**
   * Updates an existing case with new data within a database transaction.
   *
   * @param {ICreateCases} caseRequest - The updated case data, including modifications and metadata.
   * @param {string} userId - The ID of the user performing the update operation.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { cases: any };
   * }>} - Result of the update process, including status code, message, optional error message, and updated case data.
   *
   * @description
   * - Initializes database transaction for atomic operations.
   * - Sets the created_by field to the provided userId (for audit purposes).
   * - Validates account information and retrieves account details.
   * - Updates the case record in the database with provided modifications.
   * - Commits transaction on success or rolls back on error.
   * - Returns success response with updated case data or error response accordingly.
   * - Catches and logs errors, returning a failed status with an error message.
   */
  async updateCase(
    caseRequest: ICreateCases,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { cases: any };
  }> {
    const dbInit = await this.caseModelService.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      caseRequest.created_by = userId;
      const { accountNumber, parentAccountId } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          caseRequest.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const response = await this.caseSchemaService.updateCases(
        accountNumber,
        caseRequest,
        transaction
      );

      await transaction.commit();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.caseUpdated,
        data: {
          cases: {},
        },
      };
    } catch (err) {
      logMessage(`Error updating case, ${err}`);
      await transaction.rollback();
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.caseCreationFailed,
      };
    }
  }

  /**
   * Retrieves all available case filing types from the database.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { caseFilingType: any };
   * }>} - Result containing all case filing types or error information.
   *
   * @description
   * - Fetches all case filing types from the database through the schema service.
   * - Returns success response with filing type data on successful retrieval.
   * - Catches and logs errors, throwing a standardized service error.
   * - Used for populating dropdown options or validation in the frontend.
   */
  async getCaseFilingType(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseFilingType: any };
  }> {
    try {
      const caseFilingType = await this.caseSchemaService.getCaseFilingType();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          caseFilingType,
        },
      };
    } catch (err) {
      logMessage(`Error fetching case filing type, ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }

  /**
   * Retrieves all available case statuses from the database.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { caseStatus: any };
   * }>} - Result containing all case statuses or error information.
   *
   * @description
   * - Fetches all case statuses from the database through the schema service.
   * - Returns success response with status data on successful retrieval.
   * - Catches and logs errors, throwing a standardized service error.
   * - Used for populating status dropdown options or validation in the frontend.
   */
  async getCaseStatus(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseStatus: any };
  }> {
    try {
      const caseStatus = await this.caseSchemaService.getCaseStatus();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          caseStatus,
        },
      };
    } catch (err) {
      logMessage(`Error fetching case status, ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }

  /**
   * Retrieves the default status RID for newly created cases.
   *
   * @returns {Promise<{ statusRid: string }>} - Object containing the status RID for 'IN PROGRESS' status.
   *
   * @description
   * - Fetches the status RID for the 'IN PROGRESS' status from the database.
   * - Used internally when creating new cases to set the default status.
   * - Returns the status RID that should be assigned to new cases by default.
   * - This ensures all new cases start with a consistent 'IN PROGRESS' status.
   */
  async getCaseStatusForCreate() {
    const statusRid = await this.caseSchemaService.getCaseStatusByType(
      caseStatuses.INPROGRESS
    );

    return { statusRid };
  }

  /**
   * Retrieves a filtered and paginated list of case records for a given account,
   * based on user access permissions, filtering criteria, and sorting preferences.
   *
   * This function:
   * - Validates the account ID and retrieves account information.
   * - Applies dynamic filtering by case name, status, owner, fiscal year, and other case attributes.
   * - Supports advanced search conditions (equals, contains, not equals, is empty).
   * - Handles pagination with configurable page size and offset.
   * - Applies sorting by various case fields (name, date, status, etc.).
   * - Maps related metadata (case owners, statuses, filing types, user information).
   * - Returns comprehensive case information including financial data and timestamps.
   * - Supports both list and export modes for different API consumption patterns.
   *
   * @param {any} data - Request parameters containing pagination (page, limit), sorting (sortBy, sortOrder), and account information.
   * @param {Record<string, any>} filters - Object containing filter criteria for case attributes with condition operators.
   * @param {string} userId - The ID of the user making the request for access control and audit purposes.
   * @param {string} apiType - Type of API call ('list' for paginated results, 'export' for all matching records).
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { caseInfo: any; count: number };
   * }>} An object containing status, metadata, filtered case data, and total count for pagination.
   *
   * @description
   * - Used by both list and export endpoints to retrieve case data with consistent filtering logic.
   * - Provides comprehensive case information including owner names, status descriptions, and financial totals.
   * - Supports complex filtering scenarios for advanced case search and reporting functionality.
   * - Ensures data security by validating account access and user permissions.
   */
  async listAllCasesAccount(
    data: any,
    filters: Record<string, any>,
    userId: string, 
    apiType: string,
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseInfo: any; count: number };
  }>  {
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
      const response = await this.caseSchemaService.listAllCasesAccount(
        accountNumber,
        filters,
        data,
        data.page,
        data.limit,
        data.sortBy,
        data.sortOrder,
        userId,
        apiType,
      );
      
      if (!response) {
        logMessage(`No cases  found for account ID ${data.account_rid}`);
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "No cases found",
        };
      }
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          caseInfo: response.caseInfo,
          count: response.count,
        },
      };
    } catch (error) {   
      logMessage(`Error listing cases for account: ${error}`);
      throw new Error("Error listing cases for account: " + error);
    }

  }
  /**
   * Retrieves the list of export fields that the specified user is permitted to access
   * based on a given permission name.
   *
   * @param {string} userId - The ID of the user requesting the allowed export fields.
   * @param {string} permission_name - The name of the permission to check against.
   *
   * @returns {Promise<any[]>} A promise that resolves to an array of allowed export fields for the user.
   */
  async getAllowedExportFields(
    userId: string,
    permission_name: string
  ): Promise<any[]> {
    return this.caseSchemaService.getAllowedExportFields(
      userId,
      permission_name
    );
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
}
