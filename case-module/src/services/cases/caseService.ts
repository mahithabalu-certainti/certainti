import { Op, QueryTypes, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Logger } from "winston";
import { CaseModelService } from "../caseModelsService";
import CaseSchemaService from "./schemaService";
import {
  AccountType,
  CaseOwnerType,
  CaseStatusType,
  CountryType,
  CurrencyType,
  FilingType,
  ICreateCases,
  ICreateCaseTeam,
} from "../../utils/types";
import { logMessage } from "../../utils/helpers";
import {
  caseStatuses,
  HttpStatus,
  STATUS_MESSAGE,
  rawQueries,
} from "../../utils/constants";
import { query } from "express";
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
        if (getAccountDetails)
          queryResult.account_rnumber = getAccountDetails.r_number;
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
    const mainDb = await this.getMainDb();
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
    userId: string
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
          accessibleIds
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

  async createCaseTeam(
    caseRequest: ICreateCaseTeam,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?:any
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

      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.caseTeamCreated,
        data: response.validationErrors
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
   */
  async listCaseTeamMembers(data: any, filters: Record<string, any>,userId:string,apiType:string): Promise<{
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
        accountNumber,data,userId,apiType);

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
}



