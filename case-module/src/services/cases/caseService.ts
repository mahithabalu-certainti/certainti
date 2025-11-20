import { Op, QueryTypes, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Logger } from "winston";
import { CaseModelService } from "../caseModelsService";
import CaseSchemaService from "./schemaService";
import {
  AccountType,
  ActivityType,
  AddCommentsType,
  CaseOwnerType,
  CaseStatusType,
  caseTaskStatusTypes,
  CaseTaskWorkFlowCreate,
  CaseTaskWorkFlowDelete,
  ChecklistItems,
  checklistType,
  CommentsListType,
  CountryType,
  CreateCaseTaskType,
  CurrencyType,
  DeleteCommentsType,
  FilingType,
  ICreateCases,
  ICreateCaseTeam,
  ICreateChecklist,
  priorityTypes,
  TagsTypes,
  TaskCardDetailsType,
  TaskCardResponse,
  taskTags,
  TaskTypeResponse,
  taskWorkFlowConnector,
  UpdateCaseTaskType,
  UpdateCommentsType,
} from "../../utils/types";
import { generateExcelBase64, generateSasUrl, isValidTimezone, logMessage } from "../../utils/helpers";
import {
  caseStatuses,
  HttpStatus,
  STATUS_MESSAGE,
  rawQueries,
  MAIN_SCHEMA_NAME,
} from "../../utils/constants";
import { query } from "express";
import currency from "currency.js";
import moment from "moment";
import { CaseManagementSchemaService } from "../casesManagement/schemaService";
import { fetchTaskActivities, fetchTaskComments, listAllTaskStatus, taskCardDetails,taskCardDetailsActivityTask } from "../../utils/rawQueries";
export class CaseService {
  private caseSchemaService: CaseSchemaService;
  private caseModelService: CaseModelService; // Assuming this is defined somewhere in your code
  private caseManagementService : CaseManagementSchemaService
  private logger: Logger;
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;

  constructor(logger: Logger) {
    this.logger = logger;
    this.caseSchemaService = new CaseSchemaService();
    this.caseModelService = new CaseModelService(); // Initialize your model service here
    this.caseManagementService = new CaseManagementSchemaService()
  }

  private async getMainDb() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }

  private async getOrgDb() {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize();
    }
    return this.orgDbSequelize;
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
      
       const isUnique = await this.caseSchemaService.checkIsCaseNameUnique(caseRequest,accountNumber);
      if (!isUnique) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: `A case with the name "${caseRequest.case_name}" already exists. Please choose a different name.`,
        };
      }

      const { country_rid } =
        await this.caseSchemaService.fetchCountryByAccountId(
          caseRequest.account_rid
        );

      if (!country_rid) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: STATUS_MESSAGE.countryValidationFailed,
          data: {
            cases: null,
          },
        };
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
    if( caseRequest.case_name ){
    const isUnique = await this.caseSchemaService.checkisExistingCaseUnique(caseRequest,accountNumber);
    if (!isUnique) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: HttpStatus.BAD_REQUEST_MESSAGE,
        errorMessage: `A case with the name "${caseRequest.case_name}" and category already exists. Please choose a different name or category.`,
      };
    }
  }

      const response = await this.caseSchemaService.updateCases(
        accountNumber,
        userId,
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
        errorMessage: STATUS_MESSAGE.caseUpdateFailed,
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
   * Fetch Case Headers and Section List
   * -------------------------------------------------------
   * Description:
   *   This method retrieves detailed case header and section information
   *   for a given account and case. It performs multiple database lookups
   *   to enrich the case data with additional metadata like country, currency,
   *   owner, and status details.
   *
   * Flow:
   *   1. Connect to both main and organization databases.
   *   2. Fetch the parent account's `r_number` to determine the schema name.
   *   3. Query the case details (header + sections) using the organization DB.
   *   4. Enrich the case data with:
   *      - Account details (r_number, country, currency)
   *      - Filing type, owner, and status details
   *   5. Return a structured response with the case details or a not-found status.
   *
   * Parameters:
   *   @param accountRid - Unique identifier (RID) of the account.
   *   @param caseRid - Unique identifier (RID) of the case.
   *
   * Returns:
   *   An object containing:
   *     - statusCode: HTTP-like status indicator.
   *     - data: Case details object (if found) or empty object.
   */
  async fetchCaseHeadersSectionsList(accountRid: string, caseRid: string) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    const fetchParentAccountRnumber: any = await mainDb.query(
      await rawQueries.fetchParentAccount(accountRid, mainDb)
    );
    if (fetchParentAccountRnumber[0].length > 0) {
      let schemaName = rawQueries.fetchSchemaName(
        fetchParentAccountRnumber[0][0].r_number
      );
      const queryResult =
        await this.caseSchemaService.getCasesHeadersSectionList(
          caseRid,
          schemaName,
          orgDb
        );
      if (queryResult) {
        const ids = [
          queryResult.created_by,
          queryResult.case_owner_rid,
          queryResult.modified_by,
        ].filter((d: any) => d !== null);

        const uniqueIds = [...new Set(ids)];
        let userMap = new Map();

        let getCountryDetails: CountryType | undefined;
        let getCurrencyDetails: CurrencyType | undefined;
        const [getAccountDetails] = await mainDb.query<AccountType>(
          rawQueries.fetchAccountDetails(queryResult.account_rid),
          { type: QueryTypes.SELECT }
        );
        const [getCaseFilingType] = await mainDb.query<FilingType>(
          rawQueries.getCaseFilingTypeById(queryResult.filing_type_rid),
          { type: QueryTypes.SELECT }
        );
        if (getAccountDetails?.country_rid != null)
          [getCountryDetails] = await mainDb.query<CountryType>(
            rawQueries.getCountryDetails(getAccountDetails.country_rid),
            { type: QueryTypes.SELECT }
          );
        if (getAccountDetails?.currency_rid !== null)
          [getCurrencyDetails] = await mainDb.query<CurrencyType>(
            rawQueries.getCurrencyDetails(getAccountDetails!.currency_rid),
            { type: QueryTypes.SELECT }
          );
        if (uniqueIds.length > 0) {
          let getOwnerDetails = await mainDb.query<CaseOwnerType>(
            rawQueries.getOwnerDetails(uniqueIds),
            { type: QueryTypes.SELECT }
          );
          userMap = new Map(getOwnerDetails.map((d: any) => [d.rid, d.name]));
        }
        const [getCaseStatusDetails] = await mainDb.query<CaseStatusType>(
          rawQueries.getCaseStatusDetails(queryResult.status_rid),
          { type: QueryTypes.SELECT }
        );
        const [statusDetails] = await mainDb.query<CaseStatusType>(rawQueries.getStatusDetails(getAccountDetails!.status_rid), {type : QueryTypes.SELECT})
        if (getAccountDetails) {
          queryResult.account_rnumber = getAccountDetails.r_number;
          queryResult.account_status_rid = getAccountDetails.status_rid
          queryResult.account_status_name = statusDetails!.status_name
        }
        else queryResult.account_rnumber = null;
        if (getCaseFilingType)
          queryResult.filing_type_name = getCaseFilingType.filing_type_name;
        else queryResult.filing_type_name = null;
        if (getCountryDetails) {
          queryResult.country_name = getCountryDetails.country_name;
          queryResult.country_code = getCountryDetails.country_code;
          queryResult.country_rid = getAccountDetails!.country_rid;
        } else {
          queryResult.country_name = null;
          queryResult.currency_rid = null;
          queryResult.country_code = null;
        }
        queryResult.case_owner_name =
          userMap.get(queryResult.case_owner_rid) || null;
        queryResult.created_by_name =
          userMap.get(queryResult.created_by) || null;
        queryResult.modified_by_name =
          userMap.get(queryResult.modified_by) || null;

        if (getCaseStatusDetails)
          queryResult.status_name = getCaseStatusDetails.status_name;
        else queryResult.status_name = null;
        if (getCurrencyDetails) {
          queryResult.currency_code = getCurrencyDetails.currency_code;
          queryResult.currency_rid = getAccountDetails!.currency_rid;
        } else {
          queryResult.currency_code = null;
          queryResult.currency_rid = null;
        }
        return {
          statusCode: HttpStatus.SUCCESS,
          data: queryResult,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          data: {},
        };
      }
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

  async getChecklistStatus(): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { checklistStatus: any };
}> {
  try {
    const checklistStatus = await this.caseSchemaService.getChecklistStatus();
    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: {
        checklistStatus,
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
    apiType: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseInfo: any; count: number };
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
      const response = await this.caseSchemaService.listAllCasesAccount(
        accountNumber,
        filters,
        data,
        data.page,
        data.limit,
        data.sortBy,
        data.sortOrder,
        userId,
        apiType
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
  async listAllCasesSummary(
    data: any,
    filters: Record<string, any>,
    userId: string,
    apiType: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseInfo: any; count: number };
  }> {
    const userGroupType = await this.caseSchemaService.getUserGroupType(userId);
    const isCustomGlobal = userGroupType === "DEFAULT";
    const isDefaultParent = userGroupType === "AUTO_ASSIGNED_PARENT";

    let accessibleIds: string[] = [];
    if (!isCustomGlobal) {
      const accessibleAccountsInfo =
        await this.caseSchemaService.getAccessibleAccountInfo(userId);
      const accessibleAccountIds = accessibleAccountsInfo.map((acc) => acc.id);
      accessibleIds = accessibleAccountIds;
      if (accessibleAccountIds.length === 0) {
        return {
          statusCode: HttpStatus.SUCCESS,
          message: "No accessible accounts found",
          data: { caseInfo: [], count: 0 },
        };
      }
    }
    logMessage(`Filters applied: ${JSON.stringify(apiType)}`);
    logMessage(
      `Accessible Project Fiscal Ids: ${JSON.stringify(
        accessibleIds
      )} userId: ${userId}, isDefaultParent: ${isDefaultParent}, isCustomGlobal: ${isCustomGlobal}`
    );
    let result = await this.caseSchemaService.listAllCaseSummary(
      data.page,
      data.limit,
      data.parsedFilters,
      data.globalFilters,
      data.fiscal_year,
      data.sortBy,
      data.sortOrder,
      accessibleIds,
      data.search,
      apiType,
      data?.case_rid || null
    );

    if (result.cases_summary != null) {
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          caseInfo: result.cases_summary,
          count: result.cases_summary[0]?.total_records || 0,
        },
      };
    } else {
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.NOT_FOUND_MESSAGE,
        data: {
          caseInfo: null,
          count: 0,
        },
      };
    }
  }

  async fetchProjectsForAssign(
    data: any,
    assignedProject: boolean,
    userId: string,
    isExport : boolean
  ) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    const fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    if (fetchParent[0].length > 0) {
      let isSorting: boolean;
      if (
        data.sort === "project_classification_name" ||
        data.sort === "project_type_name"
      ) {
        isSorting = true;
      } else {
        isSorting = false;
      }

      const schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number);
      const projectPocId: any = await mainDb.query(
        rawQueries.getPointOfContactId()
      );
      const projectTechnicalPocId: any = await mainDb.query(
        rawQueries.getTechnicalPointOfContactId()
      );

      const userGroupType = await this.caseSchemaService.getUserGroupType(
        userId
      );
      const userProfileType = await this.caseSchemaService.getUserProfileType(
        userId
      );
      const isCustomGlobal = userGroupType === "DEFAULT";
      const isDefaultParent = userGroupType === "AUTO_ASSIGNED_PARENT";
      const isPOCProfile =
        userProfileType?.profileName === "Project Point of Contact";
      let accessibleIds: string[] = [];

      if (!isCustomGlobal) {
        accessibleIds = await this.getAccessibleProjectIds(
          userId,
          isDefaultParent,
          isPOCProfile,
          userProfileType?.email,
          isCustomGlobal
        );
        if (accessibleIds.length === 0) {
          return {
            statusCode: HttpStatus.NOT_FOUND,
            data: {
              page: data.page,
              limit: data.limit,
              total_result: 0,
              projects: [],
            },
          };
        }
      }

      if (isCustomGlobal && isPOCProfile) {
        accessibleIds = await this.getAccessibleProjectIds(
          userId,
          isDefaultParent,
          isPOCProfile,
          userProfileType?.email,
          isCustomGlobal
        );
        if (accessibleIds.length === 0) {
          return {
            statusCode: HttpStatus.NOT_FOUND,
            data: {
              page: data.page,
              limit: data.limit,
              total_result: 0,
              projects: [],
            },
          };
        }
      }

      const queryResult: any =
        await this.caseSchemaService.fetchProjectsForCasesResult(
          data,
          orgDb,
          schemaName,
          projectPocId[0][0].rid,
          projectTechnicalPocId[0][0].rid,
          isSorting,
          assignedProject,
          accessibleIds,
          isExport
        );

      if (queryResult.length > 0) {
        const classificationIds: any = [
          ...new Set(queryResult.map((d: any) => d.project_classification_rid)),
        ];
        const projectTypeIds: any = [
          ...new Set(queryResult.map((d: any) => d.project_type_rid)),
        ];

        const getClassifications: any = await mainDb.query(
          rawQueries.getProjectClassifications(classificationIds)
        );
        const getProjectTypes: any = await mainDb.query(
          rawQueries.getProjectTypes(projectTypeIds)
        );

        const classificationMappedValue = new Map(
          getClassifications[0].map((d: any) => [d.rid, d.classification_name])
        );
        const projectTypeMappedValue = new Map(
          getProjectTypes[0].map((d: any) => [d.rid, d.project_type_name])
        );

        let geoDataAddedResult = queryResult.map((d: any) => {
          return {
            ...d,
            project_classification_name:
              classificationMappedValue.get(d.project_classification_rid) ||
              null,
            project_type_name:
              projectTypeMappedValue.get(d.project_type_rid) || null,
          };
        });

        if (data.sort === "project_classification_name") {
          geoDataAddedResult = geoDataAddedResult.sort((a: any, b: any) => {
            if (data.sort_by === "DESC") {
              return (
                b.project_classification_name?.localeCompare(
                  a.project_classification_name || ""
                ) || 0
              );
            } else {
              return (
                a.project_classification_name?.localeCompare(
                  b.project_classification_name || ""
                ) || 0
              );
            }
          });
        }
        if (data.sort === "project_type_name") {
          geoDataAddedResult = geoDataAddedResult.sort((a: any, b: any) => {
            if (data.sort_by === "DESC") {
              return (
                b.project_type_name?.localeCompare(a.project_type_name || "") ||
                0
              );
            } else {
              return (
                a.project_type_name?.localeCompare(b.project_type_name || "") ||
                0
              );
            }
          });
        }
        const fetchAccountDetails: any =
          await this.caseSchemaService.getAccountDetails(data.account_rid);
        let fetchCurrencyDetails: any;
        if (fetchAccountDetails.currency_rid !== null) {
          fetchCurrencyDetails =
            await this.caseSchemaService.getCurrencyDetails(
              fetchAccountDetails.currency_rid
            );
        }

        const finalData = geoDataAddedResult.map((d: any) => {
          return {
            rid: d.rid,
            r_number: d.r_number,
            account_rid: d.account_rid,
            project_rid: d.project_rid,
            project_code: d.project_code,
            project_name: d.project_name,
            project_type_rid: d.project_type_rid,
            project_type_name: d.project_type_name,
            fiscal_year: d.fiscal_year,
            project_classification_rid: d.project_classification_rid,
            project_classification_name: d.project_classification_name,
            project_client_group: d.project_client_group,
            project_group: d.project_group,
            total_effort_prj: d.total_effort_prj,
            total_cost_prj: d.total_cost_prj,
            total_cost_fte_prj: d.total_cost_fte_prj,
            total_cost_subcon_prj: d.total_cost_subcon_prj,
            total_cost_nonlabor_prj: d.total_cost_nonlabor_prj,
            assessment_status: d.assessment_status,
            rd_percent_final: d.rd_percent_final,
            qre_final: d.qre_final,
            comments: d.comments,
            modified_datetime: d.modified_datetime,
            project_point_of_contact: d.project_point_of_contact,
            project_technical_point_of_contact:
              d.project_technical_point_of_contact,
            currency_rid: fetchCurrencyDetails.rid,
            currency_code: fetchCurrencyDetails.currency_code,
            currency_symbol: fetchCurrencyDetails.currency_symbol,
          };
        });
        return {
          statusCode: HttpStatus.SUCCESS,
          data: {
            page: data.page,
            limit: data.limit,
            total_result: parseInt(geoDataAddedResult[0].total_result),
            projects: finalData,
          },
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          data: {
            page: data.page,
            limit: data.limit,
            total_result: 0,
            projects: [],
          },
        };
      }
    }
  }
  async assignProjectToCases(data: any, userId: string) {
    const mainDb = await this.getMainDb();
    const fetchParentRnumber: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    data.created_by = userId;
    let schemaName = rawQueries.fetchSchemaName(
      fetchParentRnumber[0][0].r_number
    );
    const checkCaseExists = await this.caseSchemaService.isCaseExistsForAccount(
      data.account_rid,
      data.case_rid,
      fetchParentRnumber[0][0].r_number
    );
    if (checkCaseExists) {
      const isProjectMapped =
        await this.caseSchemaService.isProjectAlreadyAssigned(
          data,
          fetchParentRnumber[0][0].r_number
        );
      if (isProjectMapped != undefined) {
        if (isProjectMapped.statusCode === HttpStatus.BAD_REQUEST) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            statusMessage: isProjectMapped.statusMessage,
          };
        }
      }
      const result = await this.caseSchemaService.assignProjectToCase(
        data,
        fetchParentRnumber[0][0].r_number,
        schemaName
      );
      if (result.statusCode == HttpStatus.SUCCESS) {
        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: result.statusMessage,
        };
      } else {
        return {
          statusCode: HttpStatus.FAILED,
          statusMessage: result.statusMessage,
        };
      }
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
      };
    }
  }

  async deleteAssignedProjectFromCases(data: any, userId: string) {
    const mainDb = await this.getMainDb();
    const fetchParentRnumber: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    data.created_by = userId;
    let schemaName = rawQueries.fetchSchemaName(
      fetchParentRnumber[0][0].r_number
    );
    const checkCaseExists = await this.caseSchemaService.isCaseExistsForAccount(
      data.account_rid,
      data.case_rid,
      fetchParentRnumber[0][0].r_number
    );
    if (checkCaseExists) {
      const isProjectMapped =
        await this.caseSchemaService.isProjectAssignedInCase(
          data,
          fetchParentRnumber[0][0].r_number
        );
      if (isProjectMapped != undefined) {
        if (isProjectMapped.statusCode === HttpStatus.NOT_FOUND) {
          return {
            statusCode: HttpStatus.NOT_FOUND,
            statusMessage: isProjectMapped.statusMessage,
          };
        }
      }
      const result = await this.caseSchemaService.deletedAssignedProject(
        data,
        fetchParentRnumber[0][0].r_number,
        schemaName
      );
      if (result.statusCode == HttpStatus.SUCCESS) {
        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: result.statusMessage,
        };
      } else {
        return {
          statusCode: HttpStatus.FAILED,
          statusMessage: result.statusMessage,
        };
      }
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
      };
    }
  }

  async getAccessibleProjectIds(
    userId: string,
    isdefaultparent: boolean,
    isPOC: boolean = false,
    userEmail?: string,
    isCustomGlobal: boolean = false
  ): Promise<string[]> {
    const mainDbSequelize = await initMainDbSequelize();
    const MAIN_SCHEMA_NAME = "trd365";

    const replacements: any[] = [];

    let accessControlWhere = "WHERE 1=1";
    logMessage(
      `isCustomGlobal: ${isCustomGlobal}, isPOC: ${isPOC}, isdefaultparent: ${isdefaultparent}, userEmail: ${userEmail}, userId: ${userId}`
    );

    if (isCustomGlobal) {
      // If isPOC is also true, restrict to POC email
      if (isPOC && userEmail) {
        accessControlWhere += ` AND (ps.project_point_of_contact_email = ? OR pfs.project_point_of_contact_email = ?)`;
        replacements.push(userEmail, userEmail);
      }
      // Else allow all projects (no extra access checks)
    } else {
      // Non-global user – apply account/project access checks
      const accountAccessSubquery = rawQueries.GET_ACCOUNT_ACCESS;
      replacements.push(userId, userId, userId, userId);
      accessControlWhere += ` AND ${accountAccessSubquery}`;

      if (!isdefaultparent) {
        // Add project-level access checks if not a parent group
        accessControlWhere += rawQueries.GET_PROJECT_ACCESS;
        replacements.push(userId, userId, userId, userId);
      }

      // Only non-global users can be further filtered by POC
      if (isPOC && userEmail) {
        accessControlWhere += ` AND (ps.project_point_of_contact_email = ? OR pfs.project_point_of_contact_email = ?)`;
        replacements.push(userEmail, userEmail);
      }
    }

    const query = rawQueries.fetchProjectFiscalSummary(accessControlWhere);

    const results = await mainDbSequelize.query(query, {
      replacements,
      type: "SELECT",
    });

    return results.map((row: any) => row.project_fiscal_rid);
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

  /**
   * Creates and manages case team members with comprehensive CRUD operations and timeline logging.
   *
   * @param {ICreateCaseTeam} caseRequest - The case team data containing team member information, roles, effective dates, and action types.
   * @param {string} userId - The ID of the user performing the case team operations.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: any;
   * }>} - Result of the team management operations, including status code, message, optional error message, and validation results.
   *
   * @description
   * - Supports batch operations for adding, editing, and deleting team members.
   * - Validates account information and retrieves account details for multi-tenant support.
   * - Performs date range overlap validation to prevent conflicting team member assignments.
   * - Processes operations in ordered sequence: delete → edit → add for data consistency.
   * - Automatically logs all operations to case timeline with detailed descriptions including user and role names.
   * - Returns comprehensive validation results and operation summaries.
   * - Handles errors gracefully with detailed logging and standardized error responses.
   * - Essential for case team composition management and assignment tracking.
   */
  async createCaseTeam(
    caseRequest: ICreateCaseTeam,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }> {
    try {
      caseRequest.created_by = userId;
      const { accountNumber, parentAccountId } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          caseRequest.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const response = await this.caseSchemaService.createCaseTeam(
        accountNumber,
        caseRequest,
        userId
      );
     
      await this.caseSchemaService.assignCaseTeamToTasks(
        accountNumber,
         caseRequest,
        userId
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.caseTeamCreated,
        data: response.validationErrors,
      };
    } catch (err) {
      logMessage(`Error creating case, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.caseTeamCreationFailed,
      };
    }
  }

  /**
   * Retrieves all available case team roles from the database.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { caseTeamRoles: any };
   * }>} - Result containing all case team roles or error information.
   *
   * @description
   * - Fetches all case team roles from the database through the schema service.
   * - Returns success response with role data on successful retrieval.
   * - Catches and logs errors, throwing a standardized service error.
   * - Used for populating role dropdown options during team member assignment.
   * - Essential for role-based team management and assignment workflows.
   * - Supports roles like Lead Consultant, Tech Consultant, Reviewer, etc.
   */
  async getCaseTeamRoles(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseRoles: any };
  }> {
    try {
      const caseRoles = await this.caseSchemaService.getCaseTeamRoles();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          caseRoles,
        },
      };
    } catch (err) {
      logMessage(`Error fetching case roles, ${err}`);
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
  }

  /**
   * Lists case team members for a specific case with advanced filtering, sorting, and pagination support.
   *
   * @param {any} data - Request data containing account_rid, case_rid, pagination parameters, and sorting options.
   * @param {Record<string, any>} filters - Filter criteria for team member search (user name, role, effective dates, etc.).
   * @param {string} userId - The ID of the user requesting the team member list for authorization.
   * @param {string} apiType - The type of API call ('list' for pagination, 'download' for export).
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { caseTeamMembers: any };
   * }>} - Result containing paginated team member data or error information.
   *
   * @description
   * - Validates account information and retrieves account details for multi-tenant support.
   * - Supports comprehensive filtering by user name, role, effective date ranges, and team member status.
   * - Provides pagination with configurable page size and offset for large team datasets.
   * - Includes sorting capabilities by various team member attributes.
   * - Returns detailed team member information including user names, role descriptions, and effective date ranges.
   * - Handles both list and export operations based on apiType parameter.
   * - Essential for team management interfaces, assignment tracking, and team composition reports.
   * - Catches and logs errors with standardized service error handling.
   */
  async listCaseTeamMembers(
    data: any,
    filters: Record<string, any>,
    userId: string,
    apiType: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseTeamMembers: any };
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
      const caseTeamMembers = await this.caseSchemaService.listCaseTeamMembers(
        accountNumber,
        data,
        userId,
        apiType
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          caseTeamMembers,
        },
      };
    } catch (err) {
      logMessage(`Error fetching case roles, ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }

  /**
   * Retrieves all available users who can be assigned as case owners.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { caseOwners: any };
   * }>} Result containing all eligible case owners or error information.
   */
  async getCaseOwner(
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseOwners: any };
  }> {
    try {
      const caseOwners = await this.caseSchemaService.getCaseOwners();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          caseOwners,
        },
      };
    } catch (err) {
      logMessage(`Error fetching case roles, ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }

  async exportAssignedProjects (data : any) {
    const result = await this.fetchProjectsForAssign(data, true, data.userId, true);
    if(result?.statusCode === HttpStatus.SUCCESS) {
    const formatNumberForExport = (
      value: any,
      currency_symbol: string
    ): string => {
      if (value == null || value === "") return "-";
      const num = Number(value);
      if (isNaN(num)) return "-";
      return currency(num, {
        symbol: currency_symbol ? currency_symbol : "$",
        precision: 2,
        pattern: "! #",
        separator: ",",
        decimal: ".",
      }).format();
    };

    const allowedFieldsForExport = await this.getAllowedExportFields(
      data.userId,
      "projects_view_edit"
    );
    const allowedFieldSet = new Set<string>();
    for (const field of allowedFieldsForExport) {
      if (field.read) {
        allowedFieldSet.add(field.field_desc);
      }
    }
    const labelMap: Record<string, string> = {
      "Project Code": "Project Code",
      "Project Name": "Name",
      "Project Type": "Project Type",
      "Account Name": "Name",
      "Fiscal Year": "Fiscal Year",
      "Project Classification": "Classification",
      "Customer Group": "Client Group",
      "Project Group": "Project Group",
      "Project Effort (Hours)": "Total Effort In Hrs",
      "Project Cost": "Total Cost",
      "FTE Cost": "Total FTE Cost",
      "SubCon Cost": "Total Sub Con Cost",
      "Non-Labor Cost": "Total Non Labor Cost",
      "Assessment Status": "Assessment Status",
      "QRE Percent Final": "QRE Percent Final",
      "QRE Final": "QRE Final",
      "Project Point of Contact": "Key Contacts List",
      "Technical Point of Contact": "Key Contacts List",
      "Comments": "Comments",
      "Last Modified": "Updated On",
      "Project ID": "Project ID",
    };

    const fiscalData = result.data.projects || []

    let exportData = fiscalData.map((fiscal: any) => {
        let modifiedDateTime = fiscal.modified_datetime;
        const rawFiscalRow = {
          "Project Code": fiscal.project_code
            ? fiscal.project_code + " - FY" + fiscal.fiscal_year
            : "-",
          Name: fiscal.project_name || "-",
          "Project Type": fiscal.project_type_name || "-",
          "Fiscal Year": `FY-${fiscal.fiscal_year}` || "-",
          "Project Classification": fiscal.project_classification_name || "-",
          "Customer Group": fiscal.project_client_group || "-",
          "Project Group": fiscal?.project_group || "-",
          "Project Effort (Hours)": fiscal.total_effort_prj || "-",
          "Project Cost":
            formatNumberForExport(fiscal.total_cost_prj, fiscal.currency_symbol) ||
            "-",
          "FTE Cost":
            formatNumberForExport(
              fiscal.total_cost_fte_prj,
              fiscal.currency_symbol
            ) || "-",
          "SubCon Cost":
            formatNumberForExport(
              fiscal.total_cost_subcon_prj,
              fiscal.currency_symbol
            ) || "-",
          "Non-Labor Cost":
            formatNumberForExport(
              fiscal.total_cost_nonlabor_prj,
              fiscal.currency_symbol
            ) || "-",
          "Assessment Status": fiscal.assessment_status || "-",
          "QRE Percent Final": fiscal.rd_percent_final || "-", // Only base project has QRE %
          "QRE Final":
          fiscal.qre_final || // formatNumberForExport(fiscal.qre_final, project.currency_symbol)
            "-",
          "Project Point of Contact": fiscal.project_point_of_contact || "-",
          "Technical Point of Contact":
            fiscal.project_technical_point_of_contact || "-",
          Comments: fiscal.comments || "-",
          "Last Modified": modifiedDateTime
            ? data.timezone && isValidTimezone(data.timezone)
              ? moment
                  .tz(modifiedDateTime.toISOString(), data.timezone)
                  .add(5, 'hours').add(30, 'minutes')
                  .format("YYYY-MMM-DD, hh:mm:ss A")
              : moment(modifiedDateTime.toISOString()).add(5, 'hours').add(30, 'minutes').format(
                  "YYYY-MMM-DD, hh:mm:ss A"
                )
            : "-",
          "Project ID": fiscal.r_number || "-",
        };

        const filteredFiscalRow: Record<string, string> = {};
        for (const [label, value] of Object.entries(rawFiscalRow)) {
          const mappedLabel = labelMap[label] || label;
          if (allowedFieldSet.has(mappedLabel)) {
            filteredFiscalRow[label] = value; // keep original label for export
          }
        }

        return filteredFiscalRow;
      });
      return {
        statusCode : HttpStatus.SUCCESS,
        data : exportData
      };
    } else {
      return {
        statusCode : HttpStatus.NOT_FOUND,
        data : []
      };
    }
  }

  /**
   * Retrieves a list of users who are eligible to be assigned to case teams for a specific account.
   *
   * This service method performs the following operations:
   * 1. Delegates to the schema service to fetch users based on account-specific criteria.
   * 2. Applies account-level filtering to ensure users have appropriate permissions for the account.
   * 3. Returns user information suitable for case team assignment workflows.
   * 4. Handles errors gracefully with standardized error responses and logging.
   *
   * @param {string} accountRid - The unique identifier (RID) of the account for which to retrieve eligible users.
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   data?: { users: any };
   * }>} - A promise that resolves to an object containing:
   *   - statusCode: HTTP-like status code indicating success (200) or failure
   *   - message: Descriptive message about the operation result
   *   - data: Object containing the users array with user information
   *
   * @throws {Error} - Throws standardized service errors if the operation fails
   *
   * @description
   * - Filters users based on account-specific permissions and roles
   * - Ensures users have appropriate access levels for case team participation
   * 
   */
  async listUsersForCaseTeam(accountRid: string) {
    try {
      // Delegate to schema service to fetch account-specific eligible users
      const users = await this.caseSchemaService.listUsersForCaseTeam(
        accountRid
      );
      
      // Return successful response with user data
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,  
        data: {
          users,
        },
      };
    }
    catch (err) {
      // Log error for debugging and monitoring
      logMessage(`Error fetching users for case team, ${err}`);
      
      // Convert to standardized service error and re-throw
      throw this.throwServiceError(err as Error);
    }
  }

  /**
     * Creates a new admin checklist with associated checklist items within a database transaction.
     *
     * @param {ICreateChecklist} caseRequest - The checklist data including template information and checklist items to create
     * @param {string} userId - The ID of the user creating the checklist (will be set as created_by)
     *
     * @returns {Promise<{
     *   statusCode: number;
     *   message: string;
     *   errorMessage?: string;
     *   data?: { checklist: any };
     * }>} - Result of the creation process with status code, message, and checklist data if successful
     *
     * @description
     * This method performs the following operations within a database transaction:
     * - Initializes a database transaction for atomic operations
     * - Sets the created_by field to the provided userId
     * - Creates the admin checklist record using the schema service
     * - Creates associated checklist items linked to the new checklist
     * - Commits the transaction on success or rolls back on any error
     * - Returns success response with checklist data or error response with details
     * - Logs errors and ensures proper transaction cleanup
     */
  
    async createCheckList(
      caseRequest: ICreateChecklist,
      userId: string
    ): Promise<{
      statusCode: number;
      message: string;
      errorMessage?: string;
      data?: { checklist: any };
    }> {
      // Initialize database connection and start transaction for atomic operations
      const dbInit = await this.caseModelService.getSequelize();
      const transaction = await dbInit.transaction();
      try {
        // Set the user who is creating this checklist
        const { accountNumber } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          caseRequest.account_rid
        );

      if (!accountNumber) {
        logMessage(`Invalid account ID ${caseRequest.account_rid}`);
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid account ID",
        };
      }
        caseRequest.created_by = userId;
  
        // Create the main admin checklist record
        const response =
          await this.caseSchemaService.createCheckList(
            accountNumber,
            caseRequest,
            transaction
          );
  
        // If checklist creation was successful, manage associated checklist items (add/edit/delete)
        if (response) {
          await this.caseSchemaService.manageCheckListItems(
            accountNumber,
            caseRequest,
            response.rid,
            transaction
          );
        }
  
        // Commit the transaction after all operations succeed
        await transaction.commit();
  
        return {
          statusCode: HttpStatus.SUCCESS,
          message: STATUS_MESSAGE.adminChecklistCreated,
          data: {
            checklist: response,
          },
        };
      } catch (err) {
        logMessage(`Error creating checklist: ${err}`);
        await transaction.rollback();
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: STATUS_MESSAGE.adminChecklistFailed,
        };
      }
    }

    async updateCheckList(
        caseRequest: ICreateChecklist,
        userId: string
      ): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { checklist: any };
      }> {
        // Initialize database connection and start transaction for atomic operations
        const dbInit = await this.caseModelService.getSequelize();
        const transaction = await dbInit.transaction();
        try {
          // Set the user who is creating this checklist
          caseRequest.modified_by = userId;
          caseRequest.created_by = userId;
           const { accountNumber } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          caseRequest.account_rid
        );

        if (!accountNumber) {
          logMessage(`Invalid account ID ${caseRequest.account_rid}`);
          return {
            statusCode: HttpStatus.FAILED,
            message: HttpStatus.FAILED_MESSAGE,
            errorMessage: "Invalid account ID",
          };
        }
          // Create the main admin checklist record
          const response =
            await this.caseSchemaService.updateCheckList(
              accountNumber,caseRequest,transaction
            );

    
          // If checklist creation was successful, manage associated checklist items (add/edit/delete)
          if (response) {
            await this.caseSchemaService.manageCheckListItems(
              accountNumber,
              caseRequest,
              caseRequest.checklist_rid!,
              transaction
            );
          }
    
          // Commit the transaction after all operations succeed
          await transaction.commit();
    
          return {
            statusCode: HttpStatus.SUCCESS,
            message: STATUS_MESSAGE.adminChecklistCreated,
            data: {
              checklist: response,
            },
          };
        } catch (err) {
          logMessage(`Error updating checklist: ${err}`);
          await transaction.rollback();
          return {
            statusCode: HttpStatus.FAILED,
            message: HttpStatus.FAILED_MESSAGE,
            errorMessage: STATUS_MESSAGE.adminChecklistFailed,
          };
        }
      }
    async getCheckListDetailsById(checkListRid: string,caseRequest:any): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { checklistDetails: any };
  }> {
    try {
      const { accountNumber } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          caseRequest.account_rid
        );

        if (!accountNumber) {
          logMessage(`Invalid account ID ${caseRequest.account_rid}`);
          return {
            statusCode: HttpStatus.FAILED,
            message: HttpStatus.FAILED_MESSAGE,
            errorMessage: "Invalid account ID",
          };
        }
      const checklistDetails =
        await this.caseSchemaService.fetchChecklistDetailsById(
          checkListRid,accountNumber,caseRequest.account_rid
        );
  
      if (!checklistDetails) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid CheckList ID",
        };
      }
  
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          checklistDetails,
        },
      };
    } catch (err) {
      logMessage(`Error fetching checklist details, ${err}`);
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: STATUS_MESSAGE.checkListError,
        };
    }
  }

    async getAllChecklists(
      userId: string,
      attachmentLevel?: string,
      entityId?: string,
      accountRid?: string,
      page: number = 1,
      limit: number = 10,
      search?: string,
      filters: Record<string, any> = {},
      sortBy: string = 'created_datetime',
      sortOrder: string = 'DESC',
      fiscalYear: number = 0,
      apiType: string = 'list',
      graphqlData? : any
    ): Promise<{
      statusCode: number;
      message: string;
      errorMessage?: string;
      data?: { checklists: any[]; totalCount: number };
    }> {
      try {
        const { accountNumber } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          accountRid!
        );

        if (!accountNumber) {
          logMessage(`Invalid account ID ${accountRid!}`);
          return {
            statusCode: HttpStatus.FAILED,
            message: HttpStatus.FAILED_MESSAGE,
            errorMessage: "Invalid account ID",
          };
        }
         const checklistResponse:any =
        await this.caseSchemaService.fetchChecklists(
          accountNumber,
          fiscalYear,
          attachmentLevel,
          entityId,
          accountRid,
          page,
          limit,
          search,
          filters,
          sortBy,
          sortOrder,
          apiType,
          graphqlData
        );
  
         return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: { checklists: checklistResponse.checklists || [], totalCount: checklistResponse.totalCount || 0 }
        };
    
      } catch (error) {
        logMessage(`Error fetching checklists, ${error}`);
        return {
          statusCode: 500,
          message: 'Failed to fetch checklists',
          errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
          data: { checklists: [], totalCount: 0 }
        };
      }
    }

  async createUserLevelTask (data : CreateCaseTaskType) {
    const mainDb = await this.getMainDb();
    const dbInit = await this.caseModelService.getSequelize()
    const transaction = await dbInit.transaction()
    try {
      const fetchParentNumber : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
      if(fetchParentNumber[0].length > 0) {
      const getTaskType : any = await mainDb.query(rawQueries.getTaskTypeMilestone());  
      data.task_type_rid = getTaskType[0][0].rid 
      const isTaskNameExists = await this.caseSchemaService.checkTaskExistsForUserLevelTask(data, data.task_type_rid, fetchParentNumber[0][0].r_number);
      if(isTaskNameExists) {
        return {
          statusCode : HttpStatus.BAD_REQUEST,
          statusMessage : STATUS_MESSAGE.taskNameExistsAlready,
          data : null
        }
      } else {
        const isCaseExists = await this.caseSchemaService.isCaseExistsForAccount(data.account_rid, data.case_rid, fetchParentNumber[0][0].r_number);
        if(isCaseExists) {
        const [getTaskStatus] = await mainDb.query<TaskTypeResponse>(rawQueries.getSpecificTaskStatus(), {type : QueryTypes.SELECT})
        data.task_status_rid = getTaskStatus?.rid! || ''
        const getActiveStatusId : any = await mainDb.query(rawQueries.getActiveStatusId());   
        const result = await this.caseSchemaService.createUserLevelTask(data, fetchParentNumber[0][0].r_number, transaction, getActiveStatusId[0][0].rid, isCaseExists.fiscal_year)
        if(result.statusCode === HttpStatus.SUCCESS) {
          await transaction.commit()
          return {
            statusCode : HttpStatus.SUCCESS,
            statusMessage : STATUS_MESSAGE.userLevelTaskCreatedSuccess,
            data : result.data
          }
        } else if(result.statusCode === HttpStatus.BAD_REQUEST) {
          await transaction.rollback();
          return {
            statusCode : HttpStatus.BAD_REQUEST,
            statusMessage : result.statusMessage,
            data : null
          }
        } else {
          await transaction.rollback();
          return {
            statusCode : HttpStatus.FAILED,
            statusMessage : STATUS_MESSAGE.taskCreateFailed,
            data : null
          }
        }
        } 
        else {
          return {
            statusCode : HttpStatus.NOT_FOUND,
            statusMessage : STATUS_MESSAGE.dataNotAvailable,
            data : null
          }
        }
      }
    } else {
        return {
          statusCode : HttpStatus.NOT_FOUND,
          statusMessage : STATUS_MESSAGE.accountNotFound,
          data : null
        }   
    } 
  } 
  catch (error) {
    await transaction.rollback()
    return {
      statusCode : HttpStatus.FAILED,
      statusMessage : STATUS_MESSAGE.taskCreateFailed,
      data : null
    }  
  }
}
async updateUserLevelTask (data : UpdateCaseTaskType) {
    const mainDb = await this.getMainDb();
    const dbInit = await this.caseModelService.getSequelize()
    const transaction = await dbInit.transaction()
    try {
      const fetchParentNumber : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
      if(fetchParentNumber[0].length > 0) {
        const isTaskNameExists = await this.caseSchemaService.checkTaskNameExistsForUpdate(data, fetchParentNumber[0][0].r_number);
        if(isTaskNameExists) {
          return {
            statusCode : HttpStatus.BAD_REQUEST,
            statusMessage : STATUS_MESSAGE.taskNameExistsAlready
          }         
        }
        else {
          const getActiveStatusId : any = await mainDb.query(rawQueries.getActiveStatusId());
          const result = await this.caseSchemaService.updateUserLevelTask(data, fetchParentNumber[0][0].r_number, transaction, getActiveStatusId[0][0].rid);
          if(result.statusCode === HttpStatus.SUCCESS) {
            await transaction.commit()
          } else {
            await transaction.rollback()
          }
          return {
            statusCode : result.statusCode,
            statusMessage : result.statusMessage
          }
        }
      } else {
        return {
          statusCode : HttpStatus.FAILED,
          statusMessage : STATUS_MESSAGE.accountNotFound
        }
      }
    } catch (error) {
      await transaction.rollback()
      return {
        statusCode : HttpStatus.FAILED,
        statusMessage : STATUS_MESSAGE.taskUpdatedFailed
      }
    }  
}
    async getCheckListForTask(
      accountNumber: string,
      caseRid: string
    )
    {
      try { 
        const checklistDetails =
        await this.caseSchemaService.fetchCheckListForTask(
          accountNumber,
          caseRid
        );    
        return {
          checklist_name: checklistDetails.checklistData?.checklist_name,
          checklist_items: checklistDetails.checklistItems
        };
      } catch (err) {
        logMessage(`Error fetching checklist for task, ${err}`);
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: STATUS_MESSAGE.checkListError,
        };
      }
    }

    async taskListForCases (data : any, isExport : boolean) {
      const mainDb = await this.getMainDb();

      let fetchParentRnumber : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
      let schemaName = rawQueries.fetchSchemaName(fetchParentRnumber[0][0].r_number);
      let doSorting : boolean;
      if(data.sort === 'assigned_to' || data.sort === 'task_status_name') doSorting = false 
      else doSorting = true
      const result = await this.caseSchemaService.fetchTaskForCases(data.page, data.limit, data.search, data.sort, data.sort_by, data.filter, doSorting, data.case_rid, data.account_rid, schemaName, isExport);
      if(result.length > 0) {
        let allFilteredUsers;
        let allCaseTaskStatus;
        const userIds = [...new Set(result.map((d : any) => d.assigned_to))];
        const taskStatusIds = [...new Set(result.map((d : any) => d.task_status_rid))];
        let fetchStatusQuery = rawQueries.getAllTaskStatus(taskStatusIds)
        let fetchUserQuery = rawQueries.getAllUsers(userIds)
        if(fetchStatusQuery) 
          allCaseTaskStatus = await mainDb.query(fetchStatusQuery)
        if(fetchUserQuery)
          allFilteredUsers = await mainDb.query(fetchUserQuery)

        const userMap : Map<string, string> = new Map(allFilteredUsers?.[0].map((d : any) => [d.rid, d.name]));
        const taskStatusMap : Map<string, string> = new Map(allCaseTaskStatus?.[0].map((d : any) => [d.rid, d.task_status_name]));

        let mapResult = result.map((d : any) => {
          return {
            ...d,
            task_status_name : taskStatusMap.get(d.task_status_rid) || null,
            assigned_to_name : userMap.get(d.assigned_to) || null
          }
        });
        
        if(data.sort === 'task_status_name' && data.sort_by === 'DESC') {
          mapResult = mapResult.sort((b, a) => {
            const taskNameA = a.task_status_name || ""
            const taskNameB = b.task_status_name || ""
            return taskNameB.localeCompare(taskNameA)
          })
        } 
        else if(data.sort === 'task_status_name' && data.sort_by === 'ASC') {
          mapResult = mapResult.sort((a, b) => {
            const taskNameA = a.task_status_name || ""
            const taskNameB = b.task_status_name || ""
            return taskNameA.localeCompare(taskNameB)
          })
        }
        else if(data.sort === 'assigned_to_name' && data.sort_by === 'DESC') {
          mapResult = mapResult.sort((b, a) => {
            const taskNameA = a.assigned_to_name || ""
            const taskNameB = b.assigned_to_name || ""           
            return taskNameB.localeCompare(taskNameA)
          })
        }
        else if(data.sort === 'assigned_to_name' && data.sort_by === 'ASC') {
          mapResult = mapResult.sort((a, b) => {
            const taskNameA = a.assigned_to_name || ""
            const taskNameB = b.assigned_to_name || ""             
            return taskNameA.localeCompare(taskNameB)
          })
        }
        return {
          statusCode : HttpStatus.SUCCESS,
          data : mapResult
        }
      } else {
        return {
          statusCode : HttpStatus.NOT_FOUND,
          data : []
        }
      }
    }

    async createOrMapTags (data : any) {
      const mainDb = await this.getMainDb();
      const dbInit = await this.caseModelService.getSequelize();
      const fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
      const getActiveStatusId : any = await mainDb.query(rawQueries.getActiveStatusId());
      let iterationCount = 0
      let totalIteration = 0
      data.tags.length = totalIteration
      for(let d of data.tags) {
        iterationCount += 1
        await this.caseSchemaService.createOrUpdateTags(data.task_rid, data.account_rid,
        data?.case_rid, data.tag_rid, data.is_new_tag, fetchParent[0][0].r_number, data.userId, getActiveStatusId[0][0].rid),data.task_type
      }
      if(totalIteration === iterationCount) {
        return {
          statusCode : HttpStatus.SUCCESS,
          statusMessage : STATUS_MESSAGE.tagsCreatedSuccesfully
        }
      } else {
        return {
          statusCode : HttpStatus.FAILED,
          statusMessage : STATUS_MESSAGE.tagsCreationFailed
        }
      }
    }

    async fetchTagsForDropdown (data : any) {
      const mainDb = await this.getMainDb();
      let mappedTagsResult : any[] = []
      const fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
      if(data.action === "create") {
        mappedTagsResult = []
        const result = await this.caseSchemaService.fetchAllTags(mappedTagsResult);
        if(result.length > 0) {
          return {
            statusCode : HttpStatus.SUCCESS,
            data : result
          }
        } else {
          return {
            statusCode : HttpStatus.NOT_FOUND,
            data : []
          }
        }
      }
      else {
        mappedTagsResult = await this.caseSchemaService.fetchMappedTags(fetchParent[0][0].r_number, data.case_rid, data.account_rid, data.task_rid)
        const result = await this.caseSchemaService.fetchAllTags(mappedTagsResult);
        if(result.length > 0) {
          return {
            statusCode : HttpStatus.SUCCESS,
            data : result
          }
        } else {
          return {
            statusCode : HttpStatus.NOT_FOUND,
            data : []
          }
        }
      }
    }
    async addCommentsToTask (data : AddCommentsType, userId : string, files : Express.Multer.File[]) {
      const mainDb = await this.getMainDb();
      const fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
      data.created_by = userId
      const fetchTaskDetails = await this.caseSchemaService.findTaskById(data.task_rid, data.account_rid, data.case_rid, fetchParent[0][0].r_number,data.task_type);
      const result = await this.caseSchemaService.addComments(data, fetchParent[0][0].r_number, fetchTaskDetails?.r_number!, files);
      if(result.statusCode == HttpStatus.SUCCESS) {
        return result
      } else {
        return result
      }
    }
    async exportTask (data : any, userId : string) {
      const result = await this.taskListForCases(data, true);
      if(result.statusCode === HttpStatus.SUCCESS) {
        const fields = await this.getAllowedExportFields(userId,"admin_checklist_view_edit");
        const allowedFieldSet = new Set<string>();
        for (const field of fields) {
          if (field.read) {
            allowedFieldSet.add(field.field_name);
          }
        }
        const finalData = result.data.map((d : any) => {
          return {
            "Task Name" : d.task_name,
            "Assigned To" : d.assigned_to || "-",
            "Start Date" : d.effective_start_datetime || "-",
            "End Date": d.effective_end_datetime || "-",
            "Status": d.task_status_name || "-",
          }
        })
        const generateBase64Response = await generateExcelBase64(
              finalData,
              "Case Task"
            );
        return {
          statusCode : HttpStatus.SUCCESS,
          data : generateBase64Response
        };
      } 
      else {
        return {
          statusCode : HttpStatus.SUCCESS,
          data : null
        };;
      }
    }
    async updateComments (data : UpdateCommentsType, userId : string, files : Express.Multer.File[]) {
      const mainDb = await this.getMainDb();
      const fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
      data.modified_by = userId
      const fetchTaskDetails = await this.caseSchemaService.findTaskById(data.task_rid,data.account_rid, data.case_rid ,fetchParent[0][0].r_number);
      const result = await this.caseSchemaService.updateComments(data, fetchParent[0][0].r_number, fetchTaskDetails?.r_number!, files);
      if(result?.statusCode === HttpStatus.SUCCESS) {
        return {
          statusCode : result.statusCode,
          statusMessage : result.statusMessage
        }
      } else {
        return {
          statusCode : HttpStatus.FAILED,
          statusMessage : STATUS_MESSAGE.commentsFailedUpdate
        }
      }
    }
    async deleteComments (data : DeleteCommentsType, userId : string) {
      const mainDb = await this.getMainDb();
      const fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
      data.modified_by = userId
      const result = await this.caseSchemaService.deleteComments(data, fetchParent[0][0].r_number);
      if(result?.statusCode === HttpStatus.SUCCESS) {
        return {
          statusCode : result.statusCode,
          statusMessage : result.statusMessage
        }
      } else {
        return {
          statusCode : HttpStatus.FAILED,
          statusMessage : STATUS_MESSAGE.commentsFailedUpdate
        }
      }
    }
    async fetchTaskComment (data : CommentsListType) : Promise<any> {
      const mainDb = await this.getMainDb()
      const orgDb = await this.getOrgDb();

      const fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
      let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number);
      
      const result : any = await orgDb.query(fetchTaskComments(data.page, data.limit, data.task_rid, data.account_rid, data.case_rid, schemaName));
      if(result[0][0].comments !== null) {
        const total = result[0][0].comments[0].total_result
        const userIds = [...new Set(result[0][0].comments.map((d : any) => d.created_by))];
        const findUsers = await mainDb.query(rawQueries.getOwnerDetails(userIds));
        const userMap = new Map(findUsers[0].map((d : any) => [d.rid, d.name]));
        const structuredData = await Promise.all(
        (result[0][0].comments || []).map(async (d: any) => {
          delete d.total_result
            const updatedAttachments = await Promise.all(
              (d.comments_attachments || []).map(async (da: any) => ({
                ...da,
                browse_file: da.browse_file ? await generateSasUrl(da.browse_file) : null,
              }))
            );
            return {
              ...d,
              created_by_name : userMap.get(d.created_by) || null,
              comments_attachments: updatedAttachments,
            };
          })
        );
        const finalData = {
          page : data.page,
          limit : data.limit,
          total_result : total,
          data : structuredData
        }
        return {
          statusCode : HttpStatus.SUCCESS,
          data : finalData
        }
      } else {
        const finalData = {
          page : data.page,
          limit : data.limit,
          total_result : 0,
          data : []
        }
        return {
          statusCode : HttpStatus.NOT_FOUND,
          data : finalData
        }
      }
    }

    async addTaskLevelAttachment (data : any, userId : string, files : Express.Multer.File[]) {
      const mainDb = await this.getMainDb();
      const fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
      const result = await this.caseSchemaService.addAttachmentForTask(data, fetchParent[0][0].r_number, files, userId);
      return result;
    }

    async deleteTaskLevelAttachment (data : any, userId : string) {
      const mainDb = await this.getMainDb();
      const fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
      const result = await this.caseSchemaService.deleteAttachment(fetchParent[0][0].r_number,data, userId);
      return result;
    }

    async listTaskLevelAttachment (data : any) {
      const mainDb = await this.getMainDb();
      const fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
      const result = await this.caseSchemaService.listTaskLevelAttachments(fetchParent[0][0].r_number, data);
      return result;
    }

    async fetchAllTaskActivities (data : any) {
      const mainDb = await this.getMainDb();
      const orgDb = await this.getOrgDb();

      const fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
      let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number);

      const result = await orgDb.query<ActivityType>(fetchTaskActivities(data.page, data.limit, schemaName, data.case_rid, data.task_rid), {type : QueryTypes.SELECT});
      if(result.length > 0) {
        const userIds = [...new Set(result.map((d : any) => d.created_by))];
        const findUsers : any = await mainDb.query(rawQueries.getOwnerDetails(userIds));
        const mapUser : Map<string, string> = new Map(findUsers[0].map((d : any) => [d.rid, d.name]));
        const total = parseInt(result[0]!.total_result)
        const structuredResult = result.map((d : any) => {
          delete d.total_result
          return {
            ...d,
            created_by_name : mapUser.get(d.created_by) || null
          }
        })
        const finalData = {
          page : data.page,
          limit : data.limit,
          total_result : total,
          data : structuredResult
        }
        return {
          statusCode : HttpStatus.SUCCESS,
          data : finalData
        }
      } else {
        const finalData = {
          page : data.page,
          limit : data.limit,
          total_result : 0,
          data : []
        }
        return {
          statusCode : HttpStatus.NOT_FOUND,
          data : finalData
        }
      }

    }
    async fetchTaskCardDetailsList (data : any) {
      const mainDb = await this.getMainDb();
      const orgDb = await this.getOrgDb();

      const parentNumber : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
      let schemaName = rawQueries.fetchSchemaName(parentNumber[0][0].r_number);
      const fetchChecklistStatusRid : any = await mainDb.query(rawQueries.fetchChecklistStatus());
      let result = [];
      if(data.task_type === 'activity') {
        result = await orgDb.query<TaskCardResponse>(taskCardDetailsActivityTask(schemaName, data.task_rid, data.account_rid, fetchChecklistStatusRid[0][0].rid),{type : QueryTypes.SELECT});
      } else {
        result = await orgDb.query<TaskCardResponse>(taskCardDetails(schemaName, data.task_rid, data.account_rid, data.case_rid, fetchChecklistStatusRid[0][0].rid),{type : QueryTypes.SELECT});
      }
      if(result.length > 0) {
        const findRole : any = await mainDb.query(rawQueries.getCaseTeamRoleName(result[0]?.task_details.case_team_member_role_rid!));
        let userIds : Record<string, string> = {
          created_by : result[0]?.task_details.created_by!,
          assigned_to : result[0]?.task_details.assigned_to!,
          modified_by : result[0]?.task_details.modified_by!,
        }
        let priorityId = {
          priority_id : result[0]?.task_details.priority_rid!
        }
        let taskStatusID = {
          task_status_rid : result[0]?.task_details.task_status_rid
        } 
        let priority;
        let taskStatusType;
        const priorityIds : string[] = [];
        const taskStatusIds : string[] = [];
        let tagMap : Map<string, string> = new Map();
        let checklistItemsStatusIds : string[];
        let checkListData : any
        let taskNameMap : Map<string, string>;
        let relationshipConnectorMap : Map<string, string>;
        let sourceIds;
        let targetIds;
        let taskIds = []
        let relationshipConnectorIds;
        let taskNameResult;
        let workflowResult;
        if(result[0]?.task_details.workflow_connector !== null && data.task_type !== 'activity') {
          sourceIds = [...new Set(result[0]?.task_details.workflow_connector.map((d : taskWorkFlowConnector) => d.source_rid))]
          targetIds = [...new Set(result[0]?.task_details.workflow_connector.map((d : taskWorkFlowConnector) => d.target_rid))]
          relationshipConnectorIds = [...new Set(result[0]?.task_details.workflow_connector.map((d : taskWorkFlowConnector) => d.relationship_connector_rid))]
          taskIds.push(sourceIds.map((d : any) => d))
          taskIds.push(targetIds.map((d : any) => d))

          
          let query = rawQueries.getTaskNames(taskIds, schemaName);
          let relationshipQuery = rawQueries.getWorkflowConnectors(relationshipConnectorIds);
          if(query) {
            taskNameResult = await orgDb.query(query);
            taskNameMap = new Map(taskNameResult[0].map((d : any) => [d.rid, d.task_name]))
          }
          if(relationshipQuery) {
            workflowResult = await mainDb.query(relationshipQuery);
            relationshipConnectorMap = new Map(workflowResult[0].map((d : any) => [d.rid, d.relationship_type]));
          }
        }
        if(result[0]?.task_details.checklists.checklist_items !== null) {
          checklistItemsStatusIds = [...new Set(result[0]?.task_details.checklists.checklist_items.map((d : ChecklistItems) => d.status_rid))]
        } else {
          checklistItemsStatusIds = []
        }
        
        const uniqueUserIds = [...new Set(Object.values(userIds))];
        if(result[0]?.task_details.tags !== null) {
          let tagIds = [...new Set(result[0]?.task_details.tags.map((d : taskTags) => d.tag_rid))]
          if(tagIds.length > 0) {
            let query = rawQueries.getAllTagsName(tagIds)
            if(query) {
              const findTagNames = await mainDb.query<TagsTypes>(query, {type : QueryTypes.SELECT});
              if(findTagNames.length > 0) {
                tagMap = new Map(findTagNames.map((d : TagsTypes) => [d.rid, d.tag_name]));
              }
            }
          }
        }
        
        priorityIds.push(priorityId.priority_id)
        taskStatusIds.push(taskStatusID.task_status_rid!)
        const getUsers = await mainDb.query(rawQueries.getOwnerDetails(uniqueUserIds))
        const fetchPriorityQuery = rawQueries.getAllPriorityTypes(priorityIds)
        const checkListStatusName : any = await mainDb.query(rawQueries.fetchCheckListStatusNamesByRids(MAIN_SCHEMA_NAME, checklistItemsStatusIds))
        if(fetchPriorityQuery) {
          priority = await mainDb.query(fetchPriorityQuery)
        }
        let taskStatusQuery = rawQueries.getAllTaskStatus(taskStatusIds);
        if(taskStatusQuery) {
          taskStatusType = await mainDb.query(taskStatusQuery)
        }

        let taskStatusMap : Map<string, string> = new Map(taskStatusType?.[0]?.map((d : any) => [d.rid, d.task_status_name]));
        let priorityMap : Map<string, string> = new Map(priority?.[0]?.map((d : any) => [d.rid, d.priority_name]));
        let assignedToMap : Map<string, string> = new Map(getUsers?.[0]?.map((d : any) => [d.rid, d.name]));
        let checkListItemsMap : Map<string, string> = new Map(checkListStatusName?.[0]?.map((d : any) => [d.rid, d.status_name]));

        const resData = result[0]
        if(result[0]?.task_details.checklists.rid === null) checkListData = null
        else checkListData = {
            rid : resData?.task_details.checklists.rid,
            task_rid: resData?.task_details.checklists.task_rid,
            checklist_name : resData?.task_details.checklists.checklist_name,
            checklist_description : resData?.task_details.checklists.checklist_description,
            checklist_items_count : resData?.task_details.checklists.checklist_items_count,
            completed_items_count : resData?.task_details.checklists.completed_items_count,
            checklist_items : resData?.task_details.checklists.checklist_items !== null ? resData?.task_details.checklists.checklist_items.map((d : ChecklistItems) => {
              return {
                rid : d.rid,
                status_rid : d.status_rid,
                checklist_item_status_name : checkListItemsMap.get(d.status_rid) || null,
                checklist_item_name : d.checklist_item_name,
                checklist_item_description : d.checklist_item_description
              }

            }) : [],
          }
        let finalWorkflowData
        if(result[0]?.task_details.workflow_connector === null) {
          finalWorkflowData = []
        } else {
          finalWorkflowData = result[0]?.task_details?.workflow_connector?.filter((f : any) => f.rid !== null).map((d : any) => {
            return {
              ...d,
              source_task_name : taskNameMap.get(d.source_rid),
              target_task_name : taskNameMap.get(d.target_rid),
              relationship_name : relationshipConnectorMap.get(d.relationship_connector_rid)
            }
          }) || []
        }
        let finalStruture = {
          rid : resData?.task_details.rid,
          r_number : resData?.task_details.r_number,
          task_name : resData?.task_details.task_name,
          created_by : resData?.task_details.created_by,
          created_by_name : assignedToMap.get(resData?.task_details.created_by!) || null,
          assigned_to : resData?.task_details.assigned_to,
          assigned_to_name :  assignedToMap.get(resData?.task_details.assigned_to!) || null,
          modified_by : resData?.task_details.modified_by,
          modified_by_name : assignedToMap.get(resData?.task_details.modified_by!) || null,
          priority_rid : resData?.task_details.priority_rid,
          priority_name : priorityMap.get(resData?.task_details.priority_rid!) || null,
          task_status_rid : resData?.task_details.task_status_rid,
          task_status_name : taskStatusMap.get(resData?.task_details.task_status_rid!) || null,
          created_datetime : new Date(resData?.task_details.created_datetime!).toISOString(),
          task_description : resData?.task_details.task_description,
          effective_start_datetime : resData?.task_details.effective_start_datetime,
          effective_end_datetime : resData?.task_details.effective_end_datetime,
          checklist_rid : resData?.task_details.checklists.rid,
          checklist_name : resData?.task_details.checklists.checklist_name,
          case_team_member_role_rid : resData?.task_details.case_team_member_role_rid,
          case_team_member_role_name : findRole[0][0].role_name,
          checklists : checkListData,
          tags : resData?.task_details.tags.filter((f : taskTags) => f.tag_rid !== null).map((d : taskTags) => {
              return {
                tag_rid : d.tag_rid,
                tag_name : tagMap.get(d.tag_rid) || null
              }
            }) || [],
          workflow_connector : finalWorkflowData
        }
        return {
          statusCode : HttpStatus.SUCCESS,
          data : finalStruture
        }
      } else {
        return {
          statusCode : HttpStatus.NOT_FOUND,
          data : null
        }
      }
    }
    async getCasePriortyList () {
      const mainDb = await this.getMainDb();
      const result = await mainDb.query<priorityTypes>(rawQueries.getPriorityTypes(), {type : QueryTypes.SELECT});
      return result;
    }

    async getCaseTaskStatusList () {
      const mainDb = await this.getMainDb();
      const result = await mainDb.query<caseTaskStatusTypes>(listAllTaskStatus(), {type : QueryTypes.SELECT});
      return result;
    }

    async addCollaboratorToTask (data : any) {
      const mainDb = await this.getMainDb();
      const parentNumber : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
      const result = await this.caseSchemaService.addCollaborators(data, parentNumber[0][0].r_number);
      return result;
    }
    async getCollaboratorsList (data : any) {
      const mainDb = await this.getMainDb();
      const orgDb = await this.getOrgDb();
      const parentNumber : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb)); 
      let result = await this.caseSchemaService.fetchCollaboratorsList(parentNumber[0][0].r_number, data);
      if(result.length > 0) {
        let userLists;
        let userMap : Map<string, string>
        const uniqueIds = [...new Set(result.map((d : any) => d.assigned_to))];
        if(uniqueIds.length > 0) {
          userLists = await mainDb.query(rawQueries.getOwnerDetails(uniqueIds));
          userMap = new Map(userLists[0].map((d : any) => [d.rid, d.name]));
          result = result.map((d : any) => {
            return {
              ...d,
              assigned_to_name : userMap.get(d.assigned_to)
            }
          });
          return result;
        } else {
          return []
        }
      }
      else return []
    }

    async getReviewProjects(
    data: any,
    filters: Record<string, any>,
    userId: string,
    apiType: string,
    accountRid: string,
    caseRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { reviewProjects: any ,count: number };
  }> {
    try {
      const { accountNumber } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          accountRid
        );

      if (!accountNumber) {
        logMessage(`Invalid account ID ${accountRid}`);
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid account ID",
        };
      }
      const response :any= await this.caseSchemaService.listReviewProjectsInfo(
        accountNumber,
        caseRid,
        filters,
        data.fiscalYear,
        apiType,
        data.page,
        data.limit,
        data.sortBy,
        data.sortOrder,
        data.search
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          reviewProjects:response.data,
          count: response.count,
        },
      };
    } catch (err) {
      logMessage(`Error fetching review project info, ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }
  async linkTask (data : CaseTaskWorkFlowCreate) {
    const mainDb = await this.getMainDb();
    const dbInit = await this.caseModelService.getSequelize();
    const transaction = await dbInit.transaction();
    const accountNumber : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
    const result = await this.caseSchemaService.taskWorkflowConnector(accountNumber[0][0].r_number, data, transaction);
    return result;
  }
  async deleteLinkTask (data : CaseTaskWorkFlowDelete) {
    const mainDb = await this.getMainDb();
    const accountNumber : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
    const result = await this.caseSchemaService.deleteTaskWorkConnector(accountNumber[0][0].r_number, data);
    return result;
  }
  async taskListForDropdownAccountLevel (data : any) {
    const mainDb = await this.getMainDb();
    const accountNumber : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
    const result = await this.caseSchemaService.listTasksDropdownForAccountLevel(accountNumber[0][0].r_number, data);
    if(result.length > 0) return result
    else return []
  }
  async deleteTagsAccountLevel (data : any) {
    const mainDb = await this.getMainDb();
    const accountNumber : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
    const result = await this.caseSchemaService.deleteTags(accountNumber[0][0].r_number, data.case_rid, data.account_rid, data.task_rid, data.tag_rid);
    return result;
  }
  async deleteCollaborators (data : any) {
    const mainDb = await this.getMainDb();
    const accountNumber : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
    const result = await this.caseSchemaService.deleteCollaborators(accountNumber[0][0].r_number, data);
    return result;
  }
  async updateChecklistItemsStatus (data : any) {
    const mainDb = await this.getMainDb();
    const dbInit = await this.caseModelService.getSequelize();
    const transaction = await dbInit.transaction();
    const accountNumber : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
    const result = await this.caseSchemaService.updateChecklistItems(data, accountNumber[0][0].r_number, transaction);
    if(result === 1) {
      return {
        statusCode : HttpStatus.SUCCESS,
        statusMessage : STATUS_MESSAGE.checklistItemsStatusSuccess
      }
    } else {
      return {
        statusCode : HttpStatus.FAILED,
        statusMessage : STATUS_MESSAGE.failedToUpdate
      }
    }
  }
}
