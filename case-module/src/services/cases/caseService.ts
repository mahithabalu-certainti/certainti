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
  ProjectFiscalType,
  StateType,
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
  ruleNames,
  ruleTemplateNames,
  entityNames,
  onlyFederals,
  eventTypes,
  entityTypes,
  eventNames,
} from "../../utils/constants";
import currency from "currency.js";
import moment from "moment";
import { CaseManagementSchemaService } from "../casesManagement/schemaService";
import { fetchCaseProjects, fetchTaskActivities, fetchTaskComments, listAllTaskStatus, signoffProjectTechSummary, taskCardDetails, taskCardDetailsActivityTask, updateCaseAggregatedValue } from "../../utils/rawQueries";
import { sendEmailWithAttachment } from "../emailService";
import ActivitySchemaService from "../activities/schemaService";
import { caseTaskMapping, reviewProjectsFieldMappings } from "../../utils/excelExportMapping";
import { HelperMethods } from "./helperMethods";
export class CaseService {
  protected caseSchemaService: CaseSchemaService;
  private activitySchemaService: ActivitySchemaService; // Assuming this is defined somewhere in your code
  protected caseModelService: CaseModelService; // Assuming this is defined somewhere in your code
  private caseManagementService: CaseManagementSchemaService
  protected logger: Logger;
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  protected helperMethod: HelperMethods

  constructor(logger: Logger) {
    this.logger = logger;
    this.caseSchemaService = new CaseSchemaService();
    this.activitySchemaService = new ActivitySchemaService();
    this.caseModelService = new CaseModelService(); // Initialize your model service here
    this.caseManagementService = new CaseManagementSchemaService()
    this.helperMethod = new HelperMethods(
      this.caseModelService
      // no ChecklistSchemaService needed here
    );
  }

  protected async getMainDb() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }

  protected async getOrgDb() {
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
    userId: string,
    accessToken: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { cases: any };
  }> {
    const dbInit = await this.caseModelService.getSequelize();
    const mainDb = await this.getMainDb();
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

      const validation = await this.caseSchemaService.checkIsCaseNameUnique(caseRequest, accountNumber);
      if (!validation.isCaseUnique) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: `A case is  already in progress for FY-${caseRequest.fiscal_year}. Please choose a different year.`,
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
      const [caseOwnerData]: any[] = await mainDb.query(
        rawQueries.fetchUserDetails(caseRequest.case_owner_rid),
        { type: QueryTypes.SELECT }
      );
      const [caseInfo]: any[] = await mainDb.query(
        rawQueries.fetchCasesInfo(response.rid),
        {
          replacements: { case_rid: response.rid },
          type: "SELECT"
        });
      let ruleEnginePayload = {
        entityName: caseRequest.case_name,
        entity: entityNames.case,
        eventName: ruleNames.caseCreated,
        userId: userId,
        accountRid: caseRequest.account_rid,
        targetUserID: caseRequest.case_owner_rid,
        targetEmail: caseOwnerData.email || "",
        entityRid: response.rid,
        ruleScope: ruleNames.caseCreated,
        caseName: caseInfo.case_name || "",
        case: "Assigned",
        triggerType: "validation",
        status: caseInfo.status_name || ""
      };
      await this.caseSchemaService.triggerRuleEngine(ruleEnginePayload, accessToken);

      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.caseCreated,
        data: {
          cases: response,
        },
      };
    } catch (error) {
      console.log(error)
      if (error instanceof Error) {
        logMessage(`Error creating case: ${error.message}\nStack: ${error.stack}`);
        return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.caseCreationFailed,
      };
      } else {
        logMessage(`Error creating case: ${error}`);
         return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.caseCreationFailed,
      };
      }
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
    userId: string,
    accessToken: string
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
      if (caseRequest.case_name) {
        const isUnique = await this.caseSchemaService.checkisExistingCaseUnique(caseRequest, accountNumber);
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
        transaction,
        accessToken
      );

      if (response.statusCode === HttpStatus.BAD_REQUEST) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: response.statusMessage
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
      const getActiveStatusId: any = await mainDb.query(rawQueries.getActiveStatusId());
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
        const accountData = await this.helperMethod.fetchAccountById(accountRid);
        let accountRNumber = accountData.r_number;

        let childRNumber = await this.caseSchemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
        if (accountData.storage_type === "store_in_parent") {
          accountRNumber = childRNumber;
        }
        isSubscriptionCreated = (await this.caseSchemaService.getSubscriptionDetailsByProjectId(accountData.parent_account_rid, childRNumber, accountRid)) ?? false;
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
        let getStateDetails : StateType | undefined;
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
        if (getAccountDetails?.country_rid != null)
          [getStateDetails] = await mainDb.query<StateType>(
            rawQueries.getCandaStateDetails(),
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
        const [statusDetails] = await mainDb.query<CaseStatusType>(rawQueries.getStatusDetails(getAccountDetails!.status_rid), { type: QueryTypes.SELECT })
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
        let isStateAvailable : boolean = false;
        if(onlyFederals.usa == queryResult.country_code) {
          isStateAvailable = true
        } else if (onlyFederals.canada === queryResult.country_code) {
          isStateAvailable = true
        } else {
          isStateAvailable = false;
        }
        queryResult.is_state_available = isStateAvailable
        if(queryResult.country_code === "CAN") {
          queryResult.state_rid = getStateDetails?.rid || null;
          queryResult.state_name = getStateDetails?.state_name || null;
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
      data.fiscalYear,
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
    isExport: boolean
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
        accessibleIds = await this.helperMethod.getAccessibleProjectIds(
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
        accessibleIds = await this.helperMethod.getAccessibleProjectIds(
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
        const aggregatedResult: any = await orgDb.query(fetchCaseProjects(data.case_rid, data.account_rid, schemaName));
        const totals = aggregatedResult[0].reduce((acc: any, curr: any) => {
          acc.total_cost_prj = acc.total_cost_prj + Number(curr.total_cost_prj || 0.00)
          acc.qre_final = acc.qre_final + Number(curr.qre_final || 0.00)
          return acc
        }, {
          total_cost_prj: 0.00,
          qre_final: 0.00
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
        let uniqueCurrencyIds: any = [...new Set(queryResult.map((c: any) => c.currency_rid))];
        let fetchCurrencies: any = await mainDb.query(rawQueries.fetchCurrencies(uniqueCurrencyIds));
        let mapCurrency: Map<string, { currency_name: string, currency_code: string, currency_symbol: string }> = new Map(fetchCurrencies[0].map((c: any) => [c.rid, { currency_name: c.currency_name, currency_code: c.currency_code, currency_symbol: c.currency_symbol }]))
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
            currency_rid: d.currency_rid || null,
            currency_code: mapCurrency.get(d.currency_rid)?.currency_code || null,
            currency_symbol: mapCurrency.get(d.currency_rid)?.currency_symbol || null,
            is_rd_claim_qualified : d.is_rd_claim_qualified,
            is_qualified : d.is_qualified
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
    userId: string,
    accessToken: string
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
        userId,
        accessToken
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
    isDropdownList?: boolean
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
      const activeStatusRid: any = await mainDb.query(rawQueries.getActiveStatusId());
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

  async exportAssignedProjects(data: any) {
    const result = await this.fetchProjectsForAssign(data, true, data.userId, true);
    if (result?.statusCode === HttpStatus.SUCCESS) {
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
        "Qualified Status" : "Qualified Status",
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
          "Qualified Status" : fiscal.is_qualified === true ? "Yes" : "No",
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
        statusCode: HttpStatus.SUCCESS,
        data: exportData
      };
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        data: []
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
  async listUsersForCaseTeam(accountRid: string, scope: string) {
    try {
      // Delegate to schema service to fetch account-specific eligible users
      const users = await this.caseSchemaService.listUsersForCaseTeam(
        accountRid, scope
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
    data?: { reviewProjects: any, count: number };
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
      const response: any = await this.caseSchemaService.listReviewProjectsInfo(
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
          reviewProjects: response.data,
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
    data?: any;
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
      const response: any = await this.caseSchemaService.listReviewProjectsInfo(
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
                total_cost_subcon_prj: d.total_cost_subcon_prj,
                total_nonlabor_prj: d.total_nonlabor_prj,
                total_resources_prj: d.total_resources_prj,
                total_effort_fte_prj: d.total_effort_fte_prj,
                total_cost_nonlabor_prj: d.total_cost_nonlabor_prj,
                total_effort_subcon_prj: d.total_effort_subcon_prj,
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
          rawQueries.fetchCaseInfo(schemaName, data.case_rid!),
          { type: "SELECT" }
        );
        let parentAccountNumber = accountNumber;
        if (accountInfo.storage_type === 'separate_db') {
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
          attach_to: data.case_rid,
          attachment_level: "case",
          account_rid: data.account_rid,
          activity_rid: "",
        };
        const activityresponse = await Activities.create(activityData);
        activityData.activity_rid = activityresponse.rid;
        await this.activitySchemaService.uploadActivityFiles(files, activityData, accountNumber);
        const userEventInfo:any = await this.helperMethod.fetchUserAndEventInfo({
                                                  userId: data.created_by!,
                                                  eventType: eventTypes.UI_HANDLER
                                                });
        await this.helperMethod.createAccountTimelineEntry(accountNumber!, {
                                            created_by: data.created_by!,
                                            account_rid: data.account_rid,
                                            entity_rid: data.case_rid!,
                                            entity_name: entityTypes.REVIEW_PROJECT_EMAIL,
                                            created_by_name: userEventInfo.full_name,
                                            event_type_rid: userEventInfo.event_type_rid,
                                            event_name: eventNames.SENT,
                                            descriptions:'for '+ caseInfo.case_number,
                                            case_rid: data.case_rid,
                                          },["case"]);
        // await this.caseSchemaService.addCaseTimeline(
        //   accountNumber,
        //   data.case_rid,
        //   data.account_rid,
        //   "Sent Review Projects",
        //   userId,
        //   "success",
        //   "Review Projects sent via email from UI",
        //   "ui handler"
        // );


      }
      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.emailSentSuccessfully,
        data: null,
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
      const emailPreview = await this.generateEmailPreviewForReviewProjects(data, caseInfo);
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
  ) {
    data.recipient_name = data.recipient_name || "User";

    const emailMessage = {
      subject: this.replacePlaceholders(data.subject, data, caseInfo),
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
      data: { templatePreview: any };
    }> {
    try {
      const { accountNumber, parentAccountId } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          data.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      let to_email = [];
      let keyInfo = {};
      if (data.category_name == emailCategorties.review_projects) {
        const categoryInfo: any = await this.caseSchemaService.fetchEmailRecipientsForReviewProjects(data.case_rid, accountNumber);
        to_email = categoryInfo.emails || [];
        keyInfo = categoryInfo.caseInfo || {};
      }
      const emailPreview = await this.caseSchemaService.getTemplateDetailsByCategory(data.category_name);
      let emailInfo = {
        to_email,
        cc_email: [],
        subject: this.replacePlaceholders(emailPreview.subject, data, keyInfo),
        body_html: this.replacePlaceholders(emailPreview.body_html, data, keyInfo)
      }
      if (!emailPreview) {
        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: STATUS_MESSAGE.dataNotAvailable,
          data: { templatePreview: null }
        };
      }
      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.emailTemplatePreviewSuccess,
        data: { templatePreview: emailInfo }
      };
    }
    catch (error) {
      logMessage(`Error generating email preview: ${error}`);
      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.emailTemplatePreviewFailed,
        data: { templatePreview: null }
      };
    }
  }

  async getCaseSubmissionDate(data: any): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { caseSubmissionDate: any };
  }> {
    try {
      const { accountNumber, parentAccountId } =
        await this.caseSchemaService.fetchValidAccountNumberById(
          data.account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const caseSubmissionDate = await this.caseSchemaService.getCaseSubmissionDate(data, accountNumber);
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
  async signOffTechnicalDocumentation(data: any) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    const fetchParent: any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
    if (fetchParent[0].length > 0) {
      const schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number);
      const { CaseHistory } = await this.caseModelService.getModels(fetchParent[0][0].r_number)
      const [isProjectExists] = await orgDb.query<ProjectFiscalType>(rawQueries.fetchProjectFiscalById(data.project_fiscal_rid, data.account_rid, schemaName), { type: QueryTypes.SELECT });
      if (isProjectExists) {
        if (isProjectExists.signoff && !data.signoff) {
          return {
            statusCode: HttpStatus.SUCCESS,
            statusMessage: STATUS_MESSAGE.signoffNotAllowed
          }
        } else if (isProjectExists.signoff === data.signoff) {
          return {
            statusCode: HttpStatus.SUCCESS,
            statusMessage: STATUS_MESSAGE.technicalDocsAlreadySignedOff
          }
        }
        else {
          await orgDb.query(signoffProjectTechSummary(schemaName, data.project_fiscal_rid, data.account_rid, data.signoff, data.userId));
          if (data.case_rid && (data.signoff !== isProjectExists.signoff)) {
            await CaseHistory.create({
              case_rid: data.case_rid,
              old_value: "CREATE",
              attribute_name: "Technical Documentation",
              created_by: data.userId,
              new_value: `signed off technical documentation for ${isProjectExists.project_code}`
            });
          }
          return {
            statusCode: HttpStatus.SUCCESS,
            statusMessage: STATUS_MESSAGE.technicalDocumentationSignedOff
          }
        }
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          statusMessage: STATUS_MESSAGE.dataNotAvailable
        }
      }
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: STATUS_MESSAGE.accountNoFound
      }
    }
  }
}
