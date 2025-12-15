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
  assignProjectType,
  CaseOwnerType,
  CaseStatusType,
  CaseTaskDropdownType,
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
import { generateExcelBase64, generateExcelBase64WithEmptyCheck, generateSasUrl, isValidTimezone, logMessage } from "../../utils/helpers";
import {
  caseStatuses,
  HttpStatus,
  STATUS_MESSAGE,
  rawQueries,
  MAIN_SCHEMA_NAME,
  SCHEMANAME_PREFIX,
  emailCategorties,
  mainTableFiltersForCase,
} from "../../utils/constants";
import currency from "currency.js";
import moment from "moment";
import { CaseManagementSchemaService } from "../casesManagement/schemaService";
import { fetchCaseProjects, fetchTaskActivities, fetchTaskComments, listAllTaskStatus, taskCardDetails,taskCardDetailsActivityTask, updateCaseAggregatedValue } from "../../utils/rawQueries";
import { sendEmailWithAttachment } from "../emailService";
import ActivitySchemaService from "../activities/schemaService";
import { caseTaskMapping, reviewProjectsFieldMappings } from "../../utils/excelExportMapping";
export class CaseService {
  private caseSchemaService: CaseSchemaService;
  private activitySchemaService: ActivitySchemaService; // Assuming this is defined somewhere in your code
  private caseModelService: CaseModelService; // Assuming this is defined somewhere in your code
  private caseManagementService : CaseManagementSchemaService
  private logger: Logger;
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;

  constructor(logger: Logger) {
    this.logger = logger;
    this.caseSchemaService = new CaseSchemaService();
    this.activitySchemaService = new ActivitySchemaService();
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
      
       const validation = await this.caseSchemaService.checkIsCaseNameUnique(caseRequest,accountNumber);
       if (!validation.isCaseUnique) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: `A case is  already in progress for FY-${caseRequest.fiscal_year }. Please choose a different year.`,
        };
      }
       if (!validation.isunique) {
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

      if(response.statusCode === HttpStatus.BAD_REQUEST) {
        return {
          statusCode : HttpStatus.BAD_REQUEST,
          message : HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage : response.statusMessage
        }
      } else {
        await transaction.commit();
        return {
          statusCode: HttpStatus.SUCCESS,
          message: STATUS_MESSAGE.caseUpdated,
          data: {
            cases: {},
          },
        };
      }
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
      const getActiveStatusId : any = await mainDb.query(rawQueries.getActiveStatusId());
      const queryResult =
        await this.caseSchemaService.getCasesHeadersSectionList(
          caseRid,
          schemaName,
          orgDb,
          accountRid,
          getActiveStatusId[0][0].rid
        );
      if (queryResult) {
        let isSubscriptionCreated = false;
        const accountData = await this.caseSchemaService.fetchAccountById(accountRid);
        let accountRNumber = accountData.r_number;

      let childRNumber = await this.caseSchemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
        if (accountData.storage_type === "store_in_parent") {
          accountRNumber = childRNumber;
        }
        isSubscriptionCreated = (await this.caseSchemaService.getSubscriptionDetailsByProjectId(accountData.parent_account_rid, childRNumber,accountRid)) ?? false;
        queryResult.is_send_interaction = isSubscriptionCreated
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
          queryResult.currency_symbol = getCurrencyDetails.currency_symbol
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
          caseInfo: [],
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
        const aggregatedResult : any = await orgDb.query(fetchCaseProjects(data.case_rid, data.account_rid, schemaName));
        const totals = aggregatedResult[0].reduce((acc : any, curr : any) => {
          acc.total_cost_prj = acc.total_cost_prj + Number(curr.total_cost_prj || 0.00)
          acc.qre_final = acc.qre_final + Number(curr.qre_final || 0.00)
          return acc
        }, {
          total_cost_prj : 0.00,
          qre_final : 0.00
        })
        await orgDb.query(updateCaseAggregatedValue(totals.total_cost_prj, totals.qre_final, schemaName, data.case_rid, data.account_rid));
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
            currency_rid: fetchCurrencyDetails == null ? null : fetchCurrencyDetails.rid,
            currency_code: fetchCurrencyDetails == null ? null : fetchCurrencyDetails.currency_code,
            currency_symbol: fetchCurrencyDetails == null ? null : fetchCurrencyDetails.currency_symbol,
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
      
      data.fiscal_year = checkCaseExists.fiscal_year
      let caseSchemaServiceResult = await this.caseSchemaService.assignProjectToCase(
        data,
        fetchParentRnumber[0][0].r_number,
        schemaName
      );
      if (caseSchemaServiceResult.statusCode == HttpStatus.SUCCESS) {
        const result = await this.caseSchemaService.insertCaseTabels(
          caseSchemaServiceResult.data as assignProjectType,
          fetchParentRnumber[0][0].r_number,
          schemaName
        );
        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: result.statusMessage,
        };
      } else {
        return {
          statusCode: HttpStatus.FAILED,
          statusMessage: caseSchemaServiceResult.statusMessage,
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
      data.fiscal_year = checkCaseExists.fiscal_year
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
    apiType: string,
    isDropdownList? : boolean
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseTeamMembers: any };
  }> {
    try {
      const mainDb = await this.getMainDb()
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
      const activeStatusRid : any = await mainDb.query(rawQueries.getActiveStatusId());
      const caseTeamMembers = await this.caseSchemaService.listCaseTeamMembers(
        accountNumber,
        data,
        userId,
        apiType,
        isDropdownList,
        activeStatusRid[0][0].rid
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
  async listUsersForCaseTeam(accountRid: string,scope:string) {
    try {
      // Delegate to schema service to fetch account-specific eligible users
      const users = await this.caseSchemaService.listUsersForCaseTeam(
        accountRid,scope
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

      const isUnique = await this.caseSchemaService.checkIsChecklistNameUnique(caseRequest,accountNumber);
      if (!isUnique) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: `A checklist with the name "${caseRequest.checklist_name}" already exists for the fiscal year "${caseRequest.fiscal_year}". Please choose a different name.`,
        };
      }
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

         if( caseRequest.checklist_name ){
          const isUnique = await this.caseSchemaService.checkisExistingCheckilistUnique(caseRequest,accountNumber);
          if (!isUnique) {
            return {
              statusCode: HttpStatus.BAD_REQUEST,
              message: HttpStatus.BAD_REQUEST_MESSAGE,
              errorMessage: `A checklist with the name "${caseRequest.checklist_name}" for fiscal year "${caseRequest.fiscal_year}" already exists. Please choose a different name or fiscal year.`,
            };
          }
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
        if(!this.mainDbSequelize) {
          this.mainDbSequelize = await initMainDbSequelize();
        }

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
          checkListRid,accountNumber,caseRequest.account_rid, this.mainDbSequelize
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
            message: 'No accessible checklist found for the user.',
            statusCode: HttpStatus.NOT_FOUND,
            data: {
                totalCount: 0,
              checklists: [],
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
            message: 'No accessible checklist found for the user.',
            statusCode: HttpStatus.NOT_FOUND,
            data: {
            
              totalCount: 0,
              checklists: [],
            },
          };
        }
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
          accessibleIds,
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
        const findUserRoleId = await this.caseSchemaService.fetchAssignedToRole(data.assigned_to, data.case_rid, data.account_rid,fetchParentNumber[0][0].r_number);
        data.case_team_member_role_rid = findUserRoleId?.role_rid!
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
        const findTask : any = await this.caseSchemaService.findTaskById(data.rid, data.account_rid, data.case_rid, fetchParentNumber[0][0].r_number, "milestone");
        let eid;
        if(findTask) eid = findTask.eid
        else eid = null
        
        const isTaskNameExists = await this.caseSchemaService.checkTaskNameExistsForUpdate(data, fetchParentNumber[0][0].r_number, eid);
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
      let disablePagination : boolean;
      if(data.sort === 'assigned_to_name' || data.sort === 'task_status_name' || data.sort === 'role_name') {
        doSorting = false 
        disablePagination = true
      }
      else {
        doSorting = true
        disablePagination = false
      }
      const result = await this.caseSchemaService.fetchTaskForCases(data.page, data.limit, data.search, data.sort, data.sort_by, data.filter, doSorting, data.case_rid, data.account_rid, schemaName, isExport, disablePagination);
      if(result.length > 0) {
        let allFilteredUsers
        let allCaseTaskStatus;
        let allCaseTeamRoles;
        const userIds = [...new Set(result.map((d : any) => d.assigned_to))];
        const taskStatusIds = [...new Set(result.map((d : any) => d.task_status_rid))];
        const roleIds = [...new Set(result.map((d : any) => d.role_rid))];

        let fetchStatusQuery = rawQueries.getAllTaskStatus(taskStatusIds)
        let fetchUserQuery = rawQueries.getAllUsers(userIds)
        let fetchCaseTeamRolesQuery = rawQueries.getAllCaseTeamRoles(roleIds)

        if(fetchStatusQuery) 
          allCaseTaskStatus = await mainDb.query(fetchStatusQuery)
        if(fetchUserQuery)
          allFilteredUsers = await mainDb.query(fetchUserQuery)
        if(fetchCaseTeamRolesQuery)
          allCaseTeamRoles = await mainDb.query(fetchCaseTeamRolesQuery)

        const userMap : Map<string, string> = new Map(allFilteredUsers?.[0].map((d : any) => [d.rid, d.name]));
        const taskStatusMap : Map<string, string> = new Map(allCaseTaskStatus?.[0].map((d : any) => [d.rid, d.task_status_name]));
        const roleMap : Map<string, string> = new Map(allCaseTeamRoles?.[0].map((d : any) => [d.rid, d.role_name]));

        let mapResult = result.map((d : any) => {
          return {
            ...d,
            task_status_name : taskStatusMap.get(d.task_status_rid) || null,
            assigned_to_name : userMap.get(d.assigned_to) || null,
            role_name : roleMap.get(d.role_rid) || null
          }
        });

        if (
        mainTableFiltersForCase[data.sort] != undefined &&
        data.sort_by.toLowerCase() == "asc"
        ) {
          mapResult = mapResult.sort((a: any, b: any) => {
            const valA = a[data.sort];
            const valB = b[data.sort];

            // treat null, undefined, '' and ' ' as NULL
            const isNullA = valA === null || valA === undefined || valA.trim?.() === "";
            const isNullB = valB === null || valB === undefined || valB.trim?.() === "";

            // NULLS LAST
            if (isNullA && !isNullB) return 1;
            if (!isNullA && isNullB) return -1;
            if (isNullA && isNullB) return 0;

            // ASC
            return valA.localeCompare(valB);
          });
        } else if (
          mainTableFiltersForCase[data.sort] != undefined &&
          data.sort_by.toLowerCase() == "desc"
        ) {
          mapResult = mapResult.sort((a: any, b: any) => {
            const valA = a[data.sort];
            const valB = b[data.sort];

            const isNullA = valA === null || valA === undefined || valA.trim?.() === "";
            const isNullB = valB === null || valB === undefined || valB.trim?.() === "";

            // NULLS LAST
            if (isNullA && !isNullB) return 1;
            if (!isNullA && isNullB) return -1;
            if (isNullA && isNullB) return 0;

            // DESC
            return valB.localeCompare(valA);
          });
        }
        let finalData;
        if (isExport) {
          finalData = mapResult;
        } else {
          finalData = disablePagination
            ? mapResult.slice(
                (data.page - 1) * data.limit,
                data.page * data.limit
              )
            : mapResult;
        }
        return {
          statusCode : HttpStatus.SUCCESS,
          data : finalData
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
      data.created_by = userId;
      const [accountInfo]:any[] = await mainDb.query(rawQueries.fetchAccountInfo(data.account_rid));
      const fetchTaskDetails = await this.caseSchemaService.findTaskById(data.task_rid, data.account_rid, data.case_rid, fetchParent[0][0].r_number,data.task_type);
      const result = await this.caseSchemaService.addComments(data, fetchParent[0][0].r_number, fetchTaskDetails?.r_number!, files,accountInfo.r_number);
      if(result.statusCode == HttpStatus.SUCCESS) {
        return result
      } else {
        return result
      }
    }
    async exportTask (data : any, userId : string) {
      const result = await this.taskListForCases(data, true);
      if(result.statusCode === HttpStatus.SUCCESS) {
        const fields = await this.getAllowedExportFields(userId,"cases_workbreakdown_view_edit");
        const allowedFieldSet = new Set<string>();
        for (const field of fields) {
          if (field.read) {
            allowedFieldSet.add(field.field_name);
          }
        }
        const finalData = result.data.map((d : any) => {
          let resultMap : { [key: string]: any } = {
            "Task Name" : d.task_name,
            "Assigned To" : d.assigned_to_name || "-",
            "Start Date" : d.effective_start_datetime ? moment(d.effective_start_datetime).format("YYYY-MMM-DD") : "-",
            "Due Date": d.effective_end_datetime ? moment(d.effective_end_datetime).format("YYYY-MMM-DD") : "-",
            "Status": d.task_status_name || "-",
          }
          const exportRecord: Record<string, any> = {};
          caseTaskMapping.forEach((mapping) => {
            if (allowedFieldSet.has(mapping.permissionField)) {
              exportRecord[mapping.exportField] = resultMap[mapping.exportField];
            }
          });
          return exportRecord;
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
      const [accountInfo]:any[] = await mainDb.query(rawQueries.fetchAccountInfo(data.account_rid));
      const fetchTaskDetails = await this.caseSchemaService.findTaskById(data.task_rid,data.account_rid, data.case_rid ,fetchParent[0][0].r_number,data.task_type);
      const result = await this.caseSchemaService.updateComments(data, fetchParent[0][0].r_number, fetchTaskDetails?.r_number!, files,accountInfo.r_number);
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
        const {CaseHistory,ActivityHistory} = await this.caseModelService.getModels(fetchParent[0][0].r_number)
        if(data.task_type !== 'activity') {
          await CaseHistory.create({
          created_by : data.modified_by,
          created_datetime : new Date(),
          case_rid : data.case_rid,
          task_rid : data.task_rid,
          attribute_name : "Comments",
          old_value : "CREATE",
          new_value : 'deleted a comment'
        }) 
        }
        else{
          await ActivityHistory.create({
          created_by : data.modified_by,
          created_datetime : new Date(),
          activity_rid : data.task_rid,
          attribute_name : "Comments",
          old_value : "CREATE",
          new_value : 'deleted a comment'
        }) 

        }
         
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
      
      const result : any = await orgDb.query(fetchTaskComments(data.page, data.limit, data.task_rid, data.account_rid, data.case_rid, schemaName,data?.task_type || 'milestone'));
      if(result[0][0].comments !== null) {
        const total = result[0][0].comments[0].total_result
        const userIds = [...new Set(result[0][0].comments.map((d : any) => d.created_by))];
        const findUsers = await mainDb.query(rawQueries.getOwnerDetails(userIds));
        const userMap = new Map(findUsers[0].map((d : any) => [d.rid, {name : d.name, profile_url : d.profile_url}]));
        let createdByName;
        let profileUrl;
        const structuredData = await Promise.all(
        (result[0][0].comments || []).map(async (d: any) => {
          delete d.total_result
            const updatedAttachments = await Promise.all(
              (d.comments_attachments || []).map(async (da: any) => ({
                ...da,
                browse_file: da.browse_file ? await generateSasUrl(da.browse_file) : null,
              }))
            );
            if(userMap.get(d.created_by) !== undefined) {
              createdByName = userMap.get(d.created_by)?.name;
              if(userMap.get(d.created_by)?.profile_url !== null) {
                console.log("URL : ", userMap.get(d.created_by)?.profile_url)
                profileUrl = await generateSasUrl(userMap.get(d.created_by)?.profile_url)
              } else {
                profileUrl = null
              }
            } else {
              profileUrl = null
              createdByName = null
            }
            return {
              ...d,
              created_by_name : createdByName,
              profile_url : profileUrl,
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
      const accountInfo : any = await mainDb.query(rawQueries.fetchAccountInfo(data.account_rid));
      const result = await this.caseSchemaService.addAttachmentForTask(data, fetchParent[0][0].r_number, files, userId,accountInfo[0][0].r_number);
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

      const result = await orgDb.query<ActivityType>(fetchTaskActivities(data.page, data.limit, schemaName, data.case_rid, data.task_rid,data.task_type), {type : QueryTypes.SELECT});
      if(result.length > 0) {
        let createdByName;
        let profileUrl;
        const userIds = [...new Set(result.map((d : any) => d.created_by))];
        const findUsers : any = await mainDb.query(rawQueries.getOwnerDetails(userIds));
        const mapUser : Map<string, {name : string, profile_url : string}> = new Map(findUsers[0].map((d : any) => [d.rid, {name : d.name, profile_url : d.profile_url}]));
        const total = parseInt(result[0]!.total_result)
        const structuredResult = await Promise.all(result.map(async(d : any) => {
          delete d.total_result
          if(mapUser.get(d.created_by) !== undefined) {
            createdByName = mapUser.get(d.created_by)?.name
            if(mapUser.get(d.created_by)?.profile_url !== null) {
              profileUrl = await generateSasUrl(mapUser.get(d.created_by)?.profile_url!)
            } else {
              profileUrl = null
            }
          } else {
            profileUrl = null
            createdByName = null
          }
          return {
            ...d,
            old_value : d.old_value === null ? "-" : d.old_value,
            new_value : d.new_value === null ? "-" : d.new_value,
            created_by_name : createdByName,
            profile_url : profileUrl
          }
        }))
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
        const getActiveId : any = await mainDb.query(rawQueries.getActiveStatusId());
        result = await orgDb.query<TaskCardResponse>(taskCardDetails(schemaName, data.task_rid, data.account_rid, data.case_rid, fetchChecklistStatusRid[0][0].rid, getActiveId[0][0].rid),{type : QueryTypes.SELECT});
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
        let weightageValue;
        if(result[0]?.task_details?.weightage_rid !== null && data.task_type !== 'activity') {
          const weightageRes : any = await mainDb.query(rawQueries.getWeightageValue(result[0]?.task_details.weightage_rid!));
          weightageValue = weightageRes[0][0].weightage_value;
        } else {
          weightageValue = null;
        }
        let taskCategoryValue;
        if(result[0]?.task_details?.task_category_rid !== null  && data.task_type !== 'activity') {
          const taskCategoryQuery : any = await mainDb.query(rawQueries.getTaskCategoryByRid(result[0]?.task_details.task_category_rid!));
          taskCategoryValue = taskCategoryQuery[0][0].category_name
        } else {
          taskCategoryValue = null;
        }

          
        let priority;
        let taskStatusType;
        const priorityIds : string[] = [];
        const taskStatusIds : string[] = [];
        let tagMap : Map<string, string> = new Map();
        let checklistItemsStatusIds : string[];
        let checkListData : any
        let taskNameMap : Map<string, string> = new Map()
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
          taskIds.push(...sourceIds, ...targetIds)
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
        if( result[0]?.task_details.checklists && result[0]?.task_details?.checklists?.checklist_items !== null) {
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
          let taskStatusQuery;
          // let taskStatusMap : Map<string, string> = new Map(taskStatusType?.[0]?.map((d : any) => [d.rid, d.task_status_name]));
          if(data.task_type === 'activity') {
            taskStatusIds.push(taskStatusID.task_status_rid!);
            taskStatusQuery = rawQueries.fetchActivityStatus(taskStatusIds);
          } else {
            taskStatusQuery = rawQueries.getAllTaskStatus(taskStatusIds);
          }
          if(taskStatusQuery) {
            taskStatusType = await mainDb.query(taskStatusQuery);
          }
          let taskStatusMap: Map<string, string>;
          if(data.task_type === 'activity') {
            taskStatusMap = new Map(taskStatusType?.[0]?.map((d: any) => [d.rid, d.name]));
          } else {
            taskStatusMap = new Map(taskStatusType?.[0]?.map((d: any) => [d.rid, d.task_status_name]));
          }
      
        let priorityMap : Map<string, string> = new Map(priority?.[0]?.map((d : any) => [d.rid, d.priority_name]));
        let assignedToMap : Map<string, any> = new Map(getUsers?.[0]?.map((d : any) => [d.rid, {name : d.name, profile_url : d.profile_url}]));
        let checkListItemsMap : Map<string, string> = new Map(checkListStatusName?.[0]?.map((d : any) => [d.rid, d.status_name]));

        const resData = result[0];
        if(result[0]?.task_details.checklists ===null) checkListData = null
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
        if(data.task_type !== 'activity'){
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
      }
      let profileUrl;
      let createdByName;
      let modifiedByName;
      let assignedToName;
      if(assignedToMap.get(resData?.task_details.assigned_to!) !== undefined) {
        assignedToName = assignedToMap.get(resData?.task_details.assigned_to!).name
        if(assignedToMap.get(resData?.task_details.assigned_to!).profile_url !== null) {
          profileUrl = await generateSasUrl(assignedToMap.get(resData?.task_details.assigned_to!).profile_url)
        } else {
          profileUrl = assignedToMap.get(resData?.task_details.assigned_to!).profile_url
        }
      } else {
        profileUrl = null
        assignedToName = null
      }
      if(assignedToMap.get(resData?.task_details.created_by!) !== undefined) {
        createdByName = assignedToMap.get(resData?.task_details.created_by!).name
      } else {
        createdByName = null
      }
      if(modifiedByName = assignedToMap.get(resData?.task_details.modified_by!) !== undefined) {
        modifiedByName = modifiedByName = assignedToMap.get(resData?.task_details.modified_by!).name
      } else {
        modifiedByName = null
      }
        let finalStruture = {
          rid : resData?.task_details.rid,
          r_number : resData?.task_details.r_number,
          task_name : resData?.task_details.task_name,
          created_by : resData?.task_details.created_by,
          fiscal_year : resData?.task_details.fiscal_year || null,
          created_by_name : createdByName,
          profile_url : profileUrl,
          assigned_to : resData?.task_details.assigned_to,
          assigned_to_name : assignedToName,
          modified_by : resData?.task_details.modified_by,
          modified_by_name : modifiedByName,
          priority_rid : resData?.task_details.priority_rid,
          priority_name : priorityMap.get(resData?.task_details.priority_rid!) || null,
          task_status_rid : resData?.task_details.task_status_rid,
          task_status_name : taskStatusMap.get(resData?.task_details.task_status_rid!) || null,
          created_datetime : new Date(resData?.task_details.created_datetime!).toISOString(),
          task_description : data.task_type !== 'activity' ? resData?.task_details.task_description : resData?.task_details.description,
          effective_start_datetime : resData?.task_details.effective_start_datetime,
          effective_end_datetime : resData?.task_details.effective_end_datetime,
          checklist_rid : data.task_type === 'activity' ? resData?.task_details?.checklist_rid : resData?.task_details?.checklists?.rid,
          checklist_name : resData?.task_details?.checklists?.checklist_name,
          case_team_member_role_rid : resData?.task_details.case_team_member_role_rid,
          case_team_member_role_name : findRole[0][0] !== undefined ? findRole[0][0].role_name : null,
          weightage_rid : resData?.task_details?.weightage_rid,
          weightage_value : weightageValue,
          task_category_rid : resData?.task_details?.task_category_rid,
          task_category_name : taskCategoryValue,
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
        let userMap : Map<string, {name: string; profile_url: string;}>
        const uniqueIds = [...new Set(result.map((d : any) => d.assigned_to))];
        if(uniqueIds.length > 0) {
          userLists = await mainDb.query(rawQueries.getOwnerDetails(uniqueIds));
          let assignedToName;
          let profileUrl;
          userMap = new Map(userLists[0].map((d : any) => [d.rid, {name : d.name, profile_url : d.profile_url}]));
          result = await Promise.all(result.map(async (d : any) => {
            if(userMap.get(d.assigned_to) !== undefined) {
              assignedToName = userMap.get(d.assigned_to)?.name
              if(userMap.get(d.assigned_to)?.profile_url !== null) {
                profileUrl = await generateSasUrl(userMap.get(d.assigned_to)?.profile_url!)
              } else {
                profileUrl = null
              }
            } else {
              assignedToName = null
              profileUrl = null
            }
            return {
              ...d,
              assigned_to_name : assignedToName,
              profile_url : profileUrl
            }
          }));
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

    async sentReviewProjects(
    data: any,
    filters: Record<string, any>,
    userId: string,
    files: Express.Multer.File[]
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?:any;
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
        let projectArray: string[] = [];
    if (Array.isArray(data.project_id)) {
    projectArray = data.project_id;
  } else if (typeof data.project_id === 'string') {
    try {
      projectArray = JSON.parse(data.project_id);
    } catch {
      projectArray = [];
    }
  }
      data.project_id = projectArray;
      const response :any= await this.caseSchemaService.listReviewProjectsInfo(
        accountNumber,
        data.case_rid,
        filters,
        data.fiscalYear,
        "download",
        data.page,
        data.limit,
        data.sort_by,
        data.sort_order,
        data.search,
        data.project_id
      );

      const fields = await this.getAllowedExportFields(
            userId,
            "case_review_projects_view_edit"
          );
      const allowedFieldSet = new Set<string>();
          for (const field of fields) {
            if (field.read) {
              allowedFieldSet.add(field.field_name);
            }
          }
          if (response.data) {
              const finalStructuredData =
              !response?.data || response.data.length < 1
                ? []
                : response.data.map((d: any) => {
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
          const excelAttachment = {
        filename: `review_projects_${data.case_rid}.xlsx`,
        content: generateBase64Response,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
      const mainDb = await this.getMainDb();
      const orgDb = await this.getOrgDb();
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(
              /\D/g,
              ""
            )}`;
      const [accountInfo]: any[] = await mainDb.query(
            rawQueries.fetchAccountInfo(data.account_rid!),
            { type: "SELECT" }
          );
      const [caseInfo]: any[] = await orgDb.query(
            rawQueries.fetchCaseInfo(schemaName,data.case_rid!),
            { type: "SELECT" }
          );
        let parentAccountNumber = accountNumber;
      if(accountInfo.storage_type === 'separate_db') {
        const [parentAccountInfo]: any[] =
            await mainDb.query(
            rawQueries.fetchAccountInfo(accountInfo.parent_account_rid!),
            { type: "SELECT" }
          );
        parentAccountNumber = parentAccountInfo.r_number;
      }
      const senderEmailInfo = await this.caseSchemaService.fetchSenderEmailInfoByAccountId(
            parentAccountNumber,
            accountInfo.parent_account_rid
          );
      if (!senderEmailInfo) {
        logMessage(
          `Sender email information not found for account ID ${data.account_rid}`
        );
        return {
          statusCode: HttpStatus.FAILED,
          message: "Sender email information not found",
        };
      } 
       let toEmailsArray: string[] = [];
    let ccEmailsArray: string[] = [];
    if (Array.isArray(data.to_email)) {
    toEmailsArray = data.to_email;
  } else if (typeof data.to_email === 'string') {
    try {
      toEmailsArray = JSON.parse(data.to_email);
    } catch {
      toEmailsArray = [];
    }
  }
   if (Array.isArray(data.cc_email)) {
    ccEmailsArray = data.cc_email;
  } else if (typeof data.cc_email === 'string') {
    try {
      ccEmailsArray = JSON.parse(data.cc_email);
    } catch {
      ccEmailsArray = [];
    }
  }
    data.cc_email = ccEmailsArray;
    data.to_email = toEmailsArray;
      await this.sendEmailWithAttachment(
        data,
        excelAttachment,
        senderEmailInfo,
        caseInfo,
        files // Pass files to sendEmailWithAttachment
      );
       const [emailStatus]: any[] = await mainDb.query(
             rawQueries.fetchActivityStatusByName("Sent", "Email"),
             { type: "SELECT" }
           );
        const { Activities } = await this.caseModelService.getModels(accountNumber);
        const activityData = {
            activity_type: "Review Projects Sent",
            status_rid: emailStatus.rid,
            created_by: userId,
            modified_by: userId,
            case_rid: data.case_rid,
            to_email: data.to_email,
            cc_email: data.cc_email,
            subject: data.subject,
            body_html: data.body_html,
            attach_to:data.case_rid,
            attachment_level: "case",
            account_rid: data.account_rid,
            activity_rid: "",
          };
     const activityresponse = await Activities.create(activityData);
    activityData.activity_rid = activityresponse.rid;
    await this.activitySchemaService.uploadActivityFiles(files, activityData, accountNumber);
      await this.caseSchemaService.addCaseTimeline(
        accountNumber,
        data.case_rid,
        data.account_rid,
        "Sent Review Projects",
        userId,
        "success",
        "Review Projects sent via email from UI",
        "ui handler"
      );
      
           
          }
      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.emailSentSuccessfully,
        data:null,
      };
    } catch (err) {
      logMessage(`Error fetching review project info, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: STATUS_MESSAGE.emailSendingFailed,
        errorMessage: (err as Error).message,
      };
    }
  }
  async sendEmailWithAttachment(
     data: any,
     excelAttachment: { filename: string; content: string; contentType: string },
     senderEmailInfo: {
       email: string;
       clientId: string;
       tenantId: string;
       clientSecret: string;
     },
     caseInfo: any,
     files: Express.Multer.File[]
   ) {
     let emailResponse = false;
     try {
      const emailPreview = await this.generateEmailPreviewForReviewProjects(data,caseInfo);
       //fetch sender email info
       emailResponse = await sendEmailWithAttachment({
         message: emailPreview,
         attachments: [
           {
             "@odata.type": "#microsoft.graph.fileAttachment",
             name: excelAttachment.filename,
             contentBytes: excelAttachment.content,
             contentType: excelAttachment.contentType,
           },
           // Add additional files as attachments
           ...(files && files.length > 0
             ? files.map((file) => ({
                 "@odata.type": "#microsoft.graph.fileAttachment",
                 name: file.originalname || file.filename,
                 contentBytes: file.buffer ? file.buffer.toString("base64") : "",
                 contentType: file.mimetype || "application/octet-stream",
               }))
             : []),
         ],
         senderEmailInfo: senderEmailInfo,
       });
       return emailResponse;
     } catch (error) {
       logMessage(`Error sending email: ${error}`);
       return emailResponse;
     }
   }
  replacePlaceholders(
        template: string,
        dataObj: Record<string, any>,
        caseObj: Record<string, any>
      ): string {
        return template.replace(/{{(.*?)}}/g, (_: string, key: string) => {
          const raw = key.trim();
          // Normalize: lowercase, replace spaces with underscores
          const normalized = raw.toLowerCase().replace(/\s+/g, "_");
          // Also check underscore-removed
          const noUnderscore = normalized.replace(/_/g, "");
          // Check in dataObj
          if (dataObj) {
            if (raw in dataObj && dataObj[raw] != null) return dataObj[raw];
            if (normalized in dataObj && dataObj[normalized] != null) return dataObj[normalized];
            if (noUnderscore in dataObj && dataObj[noUnderscore] != null) return dataObj[noUnderscore];
          }
          // Check in caseObj
          if (caseObj) {
            if (raw in caseObj && caseObj[raw] != null) return caseObj[raw];
            if (normalized in caseObj && caseObj[normalized] != null) return caseObj[normalized];
            if (noUnderscore in caseObj && caseObj[noUnderscore] != null) return caseObj[noUnderscore];
          }
          return "";
        });
      }
  async generateEmailPreviewForReviewProjects(
    data: any,
    caseInfo: any
    )
    {
        data.recipient_name = data.recipient_name || "User";
     
      const emailMessage = {
        subject:  this.replacePlaceholders(data.subject, data, caseInfo),
        body: {
          contentType: "HTML",
          content: this.replacePlaceholders(data.body_html, data, caseInfo),
        },
        toRecipients: data.to_email && data.to_email.length > 0
          ? data.to_email.map((email: string) => ({ emailAddress: { address: email } }))
          : [],
        ccRecipients: data.cc_email && data.cc_email.length > 0
          ? data.cc_email.map((email: string) => ({ emailAddress: { address: email } }))
          : [],
      };
      return emailMessage;
    }
  async getEmailTemplatePreview(data: any, caseInfo: any):
  Promise<{
    statusCode: number;
    statusMessage: string;
    errorMessage?: string;
    data:{templatePreview: any};
  }> {
     try
      {
        const { accountNumber, parentAccountId } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          data.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
       let to_email =  [];
       let keyInfo ={};
        if(data.category_name == emailCategorties.review_projects) {
          const categoryInfo:any = await this.caseSchemaService.fetchEmailRecipientsForReviewProjects(data.case_rid,accountNumber);
          to_email = categoryInfo.emails || [];
          keyInfo = categoryInfo.caseInfo || {};
        }
        const emailPreview = await this.caseSchemaService.getTemplateDetailsByCategory(data.category_name);
        let emailInfo = {
          to_email,
          cc_email :[],
          subject:this.replacePlaceholders(emailPreview.subject, data, keyInfo),
          body_html : this.replacePlaceholders(emailPreview.body_html, data, keyInfo)
        }
        if(!emailPreview) {
           return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: STATUS_MESSAGE.dataNotAvailable,
          data: {templatePreview: null}
        };
        }
        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: STATUS_MESSAGE.emailTemplatePreviewSuccess,
          data: {templatePreview: emailInfo}
        };
      }
      catch (error) {
        logMessage(`Error generating email preview: ${error}`);
         return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: STATUS_MESSAGE.emailTemplatePreviewFailed,
          data: {templatePreview: null}
        };
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
  async deleteLinkTask (data : CaseTaskWorkFlowCreate) {
    const mainDb = await this.getMainDb();
    const accountNumber : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
    const result = await this.caseSchemaService.deleteTaskWorkConnector(accountNumber[0][0].r_number, data);
    return result;
  }
  async deleteTagsAccountLevel (data : any) {
    const mainDb = await this.getMainDb();
    const accountNumber : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
    const result = await this.caseSchemaService.deleteTags(accountNumber[0][0].r_number, data.case_rid, data.account_rid, data.task_rid, data.tag_rid, data.userId,data?.task_type || "case_task");
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
  async getTaskDropDownForDependencyMapping (data : any) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    const fetchParent : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
    let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number);
    const {Case} = await this.caseModelService.getModels(fetchParent[0][0].r_number);
    const checkCaseStatus = await Case.findOne({where : {rid : data.case_rid}, raw : true});
    let finalResult;
    if(checkCaseStatus) {
      const [fetchCaseStatus] = await mainDb.query<CaseStatusType>(rawQueries.getCaseStatusById(checkCaseStatus.status_rid), {type : QueryTypes.SELECT});
      const [fetchMilestoneReview] = await mainDb.query<TaskTypeResponse>(rawQueries.getMilestoneReview(), {type : QueryTypes.SELECT});
      if(fetchCaseStatus?.status_name === "Audit Review") {
        if(fetchMilestoneReview !== undefined) {
          finalResult = await orgDb.query<CaseTaskDropdownType>(rawQueries.getTaskDropdownForCaseLevel(schemaName, data.case_rid, data.account_rid, true, ''), {type : QueryTypes.SELECT});
          return finalResult
        } else return []
      } else {
        finalResult = await orgDb.query<CaseTaskDropdownType>(rawQueries.getTaskDropdownForCaseLevel(schemaName, data.case_rid, data.account_rid, false, fetchMilestoneReview!.rid), {type : QueryTypes.SELECT})
        return finalResult
      } 
    } else return []
  }
  async getCaseSubmissionDate(data: any): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseSubmissionDate: string };
  }> {
    try {
      const caseSubmissionDate = await this.caseSchemaService.getCaseSubmissionDate(data);

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          caseSubmissionDate,
        },
      };
    } catch (err) {
      logMessage(`Error fetching case submission date, ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }
}
