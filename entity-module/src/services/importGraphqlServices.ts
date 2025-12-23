import { QueryTypes, Sequelize } from "sequelize";
import { initOrgSequelize } from "../config/orgDataSource";
import { initMainDbSequelize } from "../config/mainDataSource";
import {
  HttpStatus,
  rawQueries,
  STATUS_MESSAGE,
} from "../utils/constants";
import {
  fetchImportListByRid,
  listAllImportedDatasQuery,
  listAllStageFailures,
  listAllLoadFailures,
  listAllWarning,
} from "../utils/rawQueries";
import { logMessage, setInlineForImports } from "../utils/helpers";
import { generateSasUrl } from "../utils/blob";
import { ProjectService } from "./projectService";
import { ResourceService } from "./resourceServices";
import { ProjectTaskService } from "./projectTaskService";
import { ProjectResourceService } from "./projectResource/projectResourceService";
import { ProjectResourceSchemaService } from "./projectResource/schemaService";
import SchemaService from "./schemaService";
import ProjectIngestionService from "./projectIngestionService";
import { Logger } from "winston";
import moment from "moment";

export default class ImportGraphqlServices {
  private orgSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private projectService: ProjectService;
  private resourceService: ResourceService;
  private projectTaskService: ProjectTaskService;
  private projectResourceService: ProjectResourceService;
  private projectResourceSchema: ProjectResourceSchemaService;
  private schemaService: SchemaService;
  private projectIngestion: ProjectIngestionService;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.projectService = new ProjectService(logger);
    this.resourceService = new ResourceService();
    this.projectTaskService = new ProjectTaskService(logger);
    this.schemaService = new SchemaService();
    this.projectIngestion = new ProjectIngestionService(logger);
    this.projectResourceService = new ProjectResourceService(logger);
    this.projectResourceSchema = new ProjectResourceSchemaService();
  }

  private async getOrgSequelize(): Promise<Sequelize> {
    if (!this.orgSequelize) {
      this.orgSequelize = await initOrgSequelize();
    }
    return this.orgSequelize;
  }

  private async getMainDbSequelize(): Promise<Sequelize> {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }

  /**
   * Retrieves a list of all imported data for a given account, optionally filtered, sorted, and paginated.
   *
   * @async
   * @function listAllImportedData
   * @param {number} page - The current page number for pagination.
   * @param {number} limit - The number of records per page.
   * @param {string} sort - The sort order (e.g., 'ASC' or 'DESC').
   * @param {string} sortBy - The field by which the results should be sorted.
   * @param {string} account_rid - The RID (record ID) of the account to fetch imported data for.
   * @param {Record<string, any>} filters - Filters to apply to the data query. If `imported_by` is present, pagination is disabled.
   * @param {number} fiscal_year - The fiscal year to filter data by.
   * @param {string} search - A search keyword to filter the data by.
   *
   * @returns {Promise<{ statusCode: number, data: any[] }>} Returns a promise that resolves to an object containing the status code and data array.
   *
   * @description
   * This function uses dynamic SQL queries to fetch imported data records for a given account.
   * It supports optional filters, pagination, sorting, and searching.
   * - Retrieves the parent account and corresponding schema name.
   * - If the `imported_by` filter is present, pagination is disabled.
   * - Executes a raw query to fetch the data.
   * Returns the data with appropriate HTTP-style status codes (`200` for success, `404` if no data found).
   */
  async listAllImportedData(
    page: number,
    limit: number,
    sort: string,
    sortBy: string,
    account_rid: string,
    filters: Record<string, any>,
    fiscal_year: number,
    search: string
  ) {
    const orgSequelize = await this.getOrgSequelize();
    const mainSequelize = await this.getMainDbSequelize();
    let disablePagination: boolean = false;

    const fetchParentRnumber: any = await mainSequelize.query(
      await rawQueries.fetchParentAccount(account_rid, mainSequelize)
    );
    let schemaName = rawQueries.fetchSchemaName(
      fetchParentRnumber[0][0].r_number
    );

    if (filters.imported_by) {
      disablePagination = true;
      delete filters.imported_by;
    }
    const result = await orgSequelize.query(
      listAllImportedDatasQuery(
        page,
        limit,
        sort,
        sortBy,
        account_rid,
        filters,
        schemaName,
        disablePagination,
        fiscal_year,
        search
      )
    );
    if (result[0].length > 0) {
      return {
        statusCode: HttpStatus.SUCCESS,
        data: result[0],
      };
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        data: [],
      };
    }
  }

  /**
   * Retrieves all stage failure records for a specific import operation within an account.
   *
   * @async
   * @function listAllStageFailures
   * @param {string} account_rid - The RID (record ID) of the account.
   * @param {string} import_rid - The RID of the import job to retrieve stage failures for.
   * @param {string} entity_type - The type of entity being imported (e.g., 'resource', 'project_task').
   *
   * @returns {Promise<{ statusCode: number, data: any[] }>} A promise that resolves to an object containing
   * a status code and the list of stage failure records.
   *
   * @description
   * This function:
   * - Resolves the parent account's schema name based on the given `account_rid`.
   * - Queries the organizational database for all failed records during a specific import process.
   * - Returns a success response (`200 OK`) with the data if found, or a `404 NOT FOUND` with an empty array.
   */
  async listAllStageFailures(
    account_rid: string,
    import_rid: string,
    entity_type: string
  ) {
    const orgSequelize = await this.getOrgSequelize();
    const mainSequelize = await this.getMainDbSequelize();

    const fetchParentRnumber: any = await mainSequelize.query(
      await rawQueries.fetchParentAccount(account_rid, mainSequelize)
    );
    let schemaName = rawQueries.fetchSchemaName(
      fetchParentRnumber[0][0].r_number
    );

    const result = await orgSequelize.query(
      listAllStageFailures(schemaName, import_rid, entity_type)
    );
    if (result[0].length > 0) {
      return {
        statusCode: HttpStatus.SUCCESS,
        data: result[0],
      };
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        data: [],
      };
    }
  }

  /**
   * Retrieves all load failure records for a specific import operation within an account.
   *
   * @async
   * @function listAllLoadFailures
   * @param {string} account_rid - The RID (record ID) of the account.
   * @param {string} import_rid - The RID of the import job to retrieve load failures for.
   * @param {string} entity_type - The type of entity being imported (e.g., 'resource', 'project_task').
   *
   * @returns {Promise<{ statusCode: number, data: any[] }>} A promise that resolves to an object containing
   * a status code and an array of load failure records.
   *
   * @description
   * This method:
   * - Determines the parent schema for the provided `account_rid`.
   * - Queries the organizational database using the schema to retrieve all failed load records
   *   associated with a specific import operation and entity type.
   * - Returns the failures with a success status (`200 OK`) if found, or a `404 NOT FOUND` with an empty array if not.
   */
  async listAllLoadFailures(
    account_rid: string,
    import_rid: string,
    entity_type: string
  ) {
    const orgSequelize = await this.getOrgSequelize();
    const mainSequelize = await this.getMainDbSequelize();

    const fetchParentRnumber: any = await mainSequelize.query(
      await rawQueries.fetchParentAccount(account_rid, mainSequelize)
    );
    let schemaName = rawQueries.fetchSchemaName(
      fetchParentRnumber[0][0].r_number
    );

    const result = await orgSequelize.query(
      listAllLoadFailures(schemaName, import_rid, entity_type)
    );
    if (result[0].length > 0) {
      return {
        statusCode: HttpStatus.SUCCESS,
        data: result[0],
      };
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        data: [],
      };
    }
  }

  async listAllWarnings(
    account_rid: string,
    import_rid: string,
    entity_type: string
  ) {
    const orgSequelize = await this.getOrgSequelize();
    const mainSequelize = await this.getMainDbSequelize();

    const fetchParentRnumber: any = await mainSequelize.query(
      await rawQueries.fetchParentAccount(account_rid, mainSequelize)
    );
    let schemaName = rawQueries.fetchSchemaName(
      fetchParentRnumber[0][0].r_number
    );

    const result = await orgSequelize.query(
      listAllWarning(schemaName, import_rid, entity_type)
    );
    if (result[0].length > 0) {
      return {
        statusCode: HttpStatus.SUCCESS,
        data: result[0],
      };
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        data: [],
      };
    }
  }

  /**
   * Fetches basic user details (RID, first name, and last name) for the given list of user RIDs.
   *
   * @async
   * @function fetchUserDetails
   * @param {string[]} userRids - An array of user record IDs (RIDs) to fetch details for.
   *
   * @returns {Promise<Array<{ rid: string, first_name: string, last_name: string }>>}
   * A promise that resolves to an array of user detail objects. Returns an empty array if no user RIDs are provided.
   *
   * @description
   * This method:
   * - Establishes a connection to the main database.
   * - If no user RIDs are provided, it immediately returns an empty array.
   * - Dynamically constructs a parameterized SQL query to fetch user details
   *   (RID, first name, last name) for the provided user RIDs.
   * - Executes the query using Sequelize's query method with replacements to avoid SQL injection.
   * - Returns the list of matched user records.
   */
  async fetchUserDetails(userRids: string[]) {
    const mainSequelize = await this.getMainDbSequelize();
    if (!userRids.length) return [];

    const placeholders = userRids.map(() => "?").join(",");
    const query = rawQueries.fetchUserDetails(placeholders);

    const [results] = await mainSequelize.query(query, {
      replacements: userRids,
    });

    return results;
  }

  /**
   * Fetches detailed import information by import RID for a given account.
   *
   * @async
   * @function fetchImportById
   * @param {string} account_rid - The RID (record ID) of the account requesting the import details.
   * @param {string} rid - The RID of the import record to be fetched.
   *
   * @returns {Promise<{ statusCode: number, data: any | null }>} A promise that resolves to an object containing:
   * - `statusCode`: HTTP status code indicating success or failure.
   * - `data`: The import details object if found; otherwise, `null`.
   *
   * @description
   * This method:
   * - Identifies the parent schema using the account RID.
   * - Queries the organization-specific schema for import data based on the provided import RID.
   * - Enriches the import data with:
   *   - SAS URL for the uploaded document.
   *   - ISO-formatted import date.
   *   - User details of the person who initiated the import.
   * - Returns the import data with a success (`200 OK`) status if found,
   *   or a `404 NOT FOUND` status with `null` if not found.
   */
  async fetchImportById(account_rid: string, rid: string) {
    let mainSequelize = await this.getMainDbSequelize();
    let orgSequelize = await this.getOrgSequelize();

    let fetchParentAccount: any = await mainSequelize.query(
      await rawQueries.fetchParentAccount(account_rid, mainSequelize)
    );
    let schemaName = rawQueries.fetchSchemaName(
      fetchParentAccount[0][0].r_number
    );

    const result: any = await orgSequelize.query(
      fetchImportListByRid(rid, schemaName)
    );
    if (result[0][0]) {
      const fetchUserDetails: any = await mainSequelize.query(
        rawQueries.fetchUserDetailsById(result[0][0].imports.imported_by)
      );
      delete result[0][0].imports.imported_by;
      result[0][0].imports.document_url = await generateSasUrl(
        result[0][0].imports.document_url
      );
      result[0][0].imports.imported_on = new Date(
        result[0][0].imports.imported_on
      ).toISOString();
      result[0][0].imports.imported_by = fetchUserDetails[0][0].imported_by;

      return {
        statusCode: HttpStatus.SUCCESS,
        data: result[0][0],
      };
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        data: null,
      };
    }
  }

  async inlineEditImportList(data: any) {
    const mainDb = await this.getMainDbSequelize();
    const orgDb = await this.getOrgSequelize();
    logMessage(`inlineEditImportList called with data: ${JSON.stringify(data)}`);
    const fetchAccountDetails: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    let schemaName = rawQueries.fetchSchemaName(
      fetchAccountDetails[0][0].r_number
    );

    const checkImportDataExists = await this.fetchImportById(
      data.account_rid,
      data.rid
    );
    let importDbData = checkImportDataExists.data;
    const setInlineDetails = setInlineForImports(importDbData, data);
    if (setInlineDetails == null) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: STATUS_MESSAGE.noDataToUpdate,
        data: null,
      };
    }
    const updateImportDetails = await orgDb.query(
      rawQueries.updateImport(schemaName, setInlineDetails, data.rid)
    );
    if (updateImportDetails.length > 0) {
      const latestUpdatedData = await this.fetchImportById(
        data.account_rid,
        data.rid
      );
      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.importUpdatedSuccess,
        data: latestUpdatedData.data,
      };
    }
  }

  /**
   * Fetches a paginated list of imported projects for a given account ID.
   *
   * @async
   * @function fetchAccountLevelImportedProjects
   *
   * @param {string} accountId - The RID of the account to fetch projects for.
   * @param {number} [fiscalYear=0] - The fiscal year to filter projects by. Defaults to 0 (no filter).
   * @param {number} [page=1] - The page number for pagination.
   * @param {number} [limit=10] - The number of records to fetch per page.
   * @param {string} search - A search keyword to filter project names or metadata.
   * @param {Record<string, any>} [filters={}] - Additional filters for querying projects.
   * @param {string} [sortBy="created_datetime"] - Field to sort the results by.
   * @param {string} [sortOrder="ASC"] - Sort order ("ASC" or "DESC").
   * @param {boolean} [bothParentAndChild=false] - Whether to include both parent and child projects.
   * @param {string} userId - The user ID making the request (used to check access permissions).
   * @param {string} documentRid - The document RID related to the imported project data.
   *
   * @returns {Promise<{
   *   statusCode: number,
   *   message: string,
   *   errorMessage?: string,
   *   data?: {
   *     projects: any,
   *     totalCount: number
   *   }
   * }>} A promise that resolves to an object containing the project list and total count.
   *
   * @throws {Error} If any internal error occurs during processing or data fetching.
   *
   * @description
   * This method performs the following steps:
   * - Retrieves Sequelize instances for the main and organization-specific databases.
   * - Validates the provided account ID and retrieves its schema name.
   * - Determines user group and profile types to fetch accessible project IDs (based on permissions).
   * - Constructs filtering and sorting clauses for the SQL query.
   * - Invokes the `fetchProjectList` method from `projectIngestion` to retrieve matching projects.
   * - Returns a response object with the list of projects and their total count.
   * - If the schema or table doesn't exist or the user has no access, returns an empty list.
   */
  async fetchAccountLevelImportedProjects(
    accountId: string,
    fiscalYear: number = 0,
    page: number = 1,
    limit: number = 10,
    search: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    bothParentAndChild: boolean = false,
    userId: string,
    documentRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; totalCount: number };
  }> {
    try {
      const mainDb = await this.getMainDbSequelize();
      const orgDb = await this.getOrgSequelize();

      const fetchAccountDetails: any = await mainDb.query(
        await rawQueries.fetchParentAccount(accountId, mainDb)
      );

      const fetchGivenAccountDetails: any = await mainDb.query(
        await rawQueries.fetchAccountDetailsByRid(accountId)
      );

      if (
        fetchGivenAccountDetails[0][0].parent_account_rid === null ||
        fetchGivenAccountDetails[0][0].parent_account_rid === ""
      ) {
        logMessage(`Invalid account ID: ${accountId}`);
        throw new Error("Invalid account ID");
      }
      const userGroupType = await this.schemaService.getUserGroupType(userId);
      const userProfileType = await this.schemaService.getUserProfileType(
        userId
      );
      const isCustomGlobal = userGroupType === "DEFAULT";
      const isDefaultParent = userGroupType === "AUTO_ASSIGNED_PARENT";
      const isPOCProfile =
        userProfileType?.profileName === "Project Point of Contact";
      let accessibleIds: string[] = [];

      if (!isCustomGlobal) {
        accessibleIds = await this.projectService.getAccessibleProjectIds(
          userId,
          isDefaultParent,
          isPOCProfile,
          userProfileType?.email,
          isCustomGlobal
        );
        if (accessibleIds.length === 0) {
          return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
              projects: [],
              totalCount: 0,
            },
          };
        }
      }

      if (isCustomGlobal && isPOCProfile) {
        accessibleIds = await this.projectService.getAccessibleProjectIds(
          userId,
          isDefaultParent,
          isPOCProfile,
          userProfileType?.email,
          isCustomGlobal
        );
        if (accessibleIds.length === 0) {
          return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
              projects: [],
              totalCount: 0,
            },
          };
        }
      }

      const isExists = await this.schemaService.checkIfSchemaAndTableExists(
        fetchAccountDetails[0][0].r_number
      );

      if (!isExists) {
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            projects: [],
            totalCount: 0,
          },
        };
      }

      const [finalSortBy, finalSortOrder] =
        this.projectService.getSortParameters(sortBy, sortOrder);
      const [finalMetaDataSortBy, finalMetaDataSortOrder] =
        this.projectService.getMetaDataSortParameters(sortBy, sortOrder);

      const { whereClause } = this.projectService.buildWhereClause(
        filters,
        search,
        false,
        bothParentAndChild
      );

      const offset = (page - 1) * limit;

      const order = [[finalSortBy, finalSortOrder]];

      const { projects, count } = await this.projectIngestion.fetchProjectList(
        fetchAccountDetails[0][0].r_number,
        fetchGivenAccountDetails[0][0],
        whereClause,
        fiscalYear,
        offset,
        limit,
        order,
        bothParentAndChild,
        filters,
        finalMetaDataSortBy,
        finalMetaDataSortOrder,
        {},
        accessibleIds,
        "timesheet",
        documentRid
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projects: projects,
          totalCount: count,
        },
      };
    } catch (err) {
      logMessage(`Error fetching imported projects: ${(err as Error).message}`);
      throw new Error(
        "Error fetching imported projects: " + (err as Error).message
      );
    }
  }

  /**
   * Exports a list of imported projects for a given account ID based on provided filters, sorting, and access permissions.
   *
   * @async
   * @function exportAccountLevelImportedProjects
   *
   * @param {string} accountId - The RID of the account to export projects for.
   * @param {number} [fiscalYear=0] - The fiscal year to filter the projects by. Defaults to 0 (no filter).
   * @param {string} search - Search keyword to filter project names or metadata.
   * @param {Record<string, any>} [filters={}] - Key-value pairs used to filter projects.
   * @param {string} [sortBy="created_datetime"] - The field to sort results by.
   * @param {string} [sortOrder="ASC"] - The order to sort results ("ASC" or "DESC").
   * @param {boolean} [bothParentAndChild=false] - If true, includes both parent and child project data.
   * @param {string} userId - The user ID of the requester, used for permission checks.
   * @param {string} timezone - The timezone to apply when formatting date/time fields for export.
   * @param {string} documentRid - The RID of the document associated with the import process.
   *
   * @returns {Promise<{
   *   statusCode: number,
   *   message: string,
   *   errorMessage?: string,
   *   data?: {
   *     projects: any,
   *     totalCount: number
   *   }
   * }>} A promise resolving to the exported project data and total count.
   *
   * @throws {Error} Throws an error if the account is invalid or any internal operation fails.
   *
   * @description
   * This method performs the following:
   * - Retrieves database connections for the main and organization databases.
   * - Verifies the given account's validity and retrieves schema info.
   * - Checks the user's group and profile types to determine access permissions.
   * - If the user lacks access to any project, returns an empty result.
   * - Validates schema and table existence for the target account.
   * - Constructs filters, sorting options, and where clauses based on inputs.
   * - Fetches exportable project data using `fetchProjectListExport`.
   * - Returns the list of exported projects and total count for external usage (e.g. Excel export).
   */
  async exportAccountLevelImportedProjects(
    accountId: string,
    fiscalYear: number = 0,
    search: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    bothParentAndChild: boolean = false,
    userId: string,
    timezone: string,
    documentRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; totalCount: number };
  }> {
    try {
      const mainDb = await this.getMainDbSequelize();
      const orgDb = await this.getOrgSequelize();

      const fetchAccountDetails: any = await mainDb.query(
        await rawQueries.fetchParentAccount(accountId, mainDb)
      );

      const fetchGivenAccountDetails: any = await mainDb.query(
        await rawQueries.fetchAccountDetailsByRid(accountId)
      );

      if (
        fetchGivenAccountDetails[0][0].parent_account_rid === null ||
        fetchGivenAccountDetails[0][0].parent_account_rid === ""
      ) {
        logMessage(`Invalid account ID: ${accountId}`);
        throw new Error("Invalid account ID");
      }
      const userGroupType = await this.schemaService.getUserGroupType(userId);
      const userProfileType = await this.schemaService.getUserProfileType(
        userId
      );
      const isCustomGlobal = userGroupType === "DEFAULT";
      const isDefaultParent = userGroupType === "AUTO_ASSIGNED_PARENT";
      const isPOCProfile =
        userProfileType?.profileName === "Project Point of Contact";
      let accessibleIds: string[] = [];

      if (!isCustomGlobal) {
        accessibleIds = await this.projectService.getAccessibleProjectIds(
          userId,
          isDefaultParent,
          isPOCProfile,
          userProfileType?.email,
          isCustomGlobal
        );
        if (accessibleIds.length === 0) {
          return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
              projects: [],
              totalCount: 0,
            },
          };
        }
      }

      if (isCustomGlobal && isPOCProfile) {
        accessibleIds = await this.projectService.getAccessibleProjectIds(
          userId,
          isDefaultParent,
          isPOCProfile,
          userProfileType?.email,
          isCustomGlobal
        );
        if (accessibleIds.length === 0) {
          return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
              projects: [],
              totalCount: 0,
            },
          };
        }
      }

      const isExists = await this.schemaService.checkIfSchemaAndTableExists(
        fetchAccountDetails[0][0].r_number
      );

      if (!isExists) {
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            projects: [],
            totalCount: 0,
          },
        };
      }

      const [finalSortBy, finalSortOrder] =
        this.projectService.getSortParameters(sortBy, sortOrder);
      const [finalMetaDataSortBy, finalMetaDataSortOrder] =
        this.projectService.getMetaDataSortParameters(sortBy, sortOrder);

      const { whereClause } = this.projectService.buildWhereClause(
        filters,
        search,
        false,
        bothParentAndChild
      );

      const order = [[finalSortBy, finalSortOrder]];

      const { exportData, count } =
        await this.projectIngestion.fetchProjectListExport(
          fetchAccountDetails[0][0].r_number,
          fetchGivenAccountDetails[0][0],
          whereClause,
          fiscalYear,
          order,
          bothParentAndChild,
          filters,
          finalMetaDataSortBy,
          finalMetaDataSortOrder,
          timezone,
          userId,
          accessibleIds,
          documentRid
        );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projects: exportData,
          totalCount: count,
        },
      };
    } catch (err) {
      logMessage(`Error exporting imported projects: ${(err as Error).message}`);
      throw new Error(
        "Error exporting imported projects: " + (err as Error).message
      );
    }
  }

  /**
   * Fetches a paginated list of imported resources for a given account, based on filters, search terms, and sorting options.
   *
   * @async
   * @function fetchAccountLevelImportedResources
   *
   * @param {string} accountId - The RID of the account to fetch resources for.
   * @param {number} [page=1] - The page number for pagination. Defaults to 1.
   * @param {number} [limit=10] - The number of records per page. Defaults to 10.
   * @param {string} search - A search string to filter resources by text or metadata.
   * @param {Record<string, string>} [filters={}] - Key-value filters to apply to the resource query.
   * @param {string} [sortBy="created_datetime"] - The field name to sort by. Defaults to `created_datetime`.
   * @param {string} [sortOrder="ASC"] - The sort order (`ASC` or `DESC`). Defaults to ascending.
   * @param {string} documentRid - The RID of the document associated with the import process.
   *
   * @returns {Promise<{
   *   statusCode: number,
   *   message: string,
   *   errorMessage?: string,
   *   data?: {
   *     resources: any,
   *     count: number
   *   }
   * }>} Returns a promise that resolves with the list of imported resources and total count.
   *
   * @throws {Error} Throws an error if the account does not exist or a database error occurs.
   *
   * @description
   * This method:
   * - Validates the account and checks if the related schema exists.
   * - Constructs pagination and sorting parameters.
   * - Builds a dynamic `whereClause` and `havingClause` based on filters and search input.
   * - Optionally applies geospatial sorting when applicable.
   * - Calls `schemaService.fetchResources` to retrieve resource data.
   * - Returns a response object containing the imported resources and their count.
   */
  async fetchAccountLevelImportedResources(
    accountId: string,
    page: number = 1,
    limit: number = 10,
    search: string,
    filters: Record<string, string> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    documentRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resources: any; count: number };
  }> {
    try {
      const mainDb = await this.getMainDbSequelize();
      const orgDb = await this.getOrgSequelize();

      const fetchAccountDetails: any = await mainDb.query(
        await rawQueries.fetchParentAccount(accountId, mainDb)
      );

      const isExists = await this.schemaService.checkIfSchemaExists(
        fetchAccountDetails[0][0].r_number
      );

      if (!isExists) {
        logMessage(`Invalid account number: ${accountId}`);
        throw new Error(
          "Invalid account number: The account number does not exist."
        );
      }

      const offset = (page - 1) * limit;

      const [finalSortBy, finalSortOrder] =
        this.resourceService.getSortParameters(sortBy, sortOrder);

      const { whereClause, havingClause } =
        this.resourceService.buildWhereClause(filters, search);
      const { geoDataSort } = this.resourceService.processGeoDataSort(
        sortBy,
        sortOrder
      );

      const resources = await this.schemaService.fetchResources(
        fetchAccountDetails[0][0].r_number,
        offset,
        limit,
        [[finalSortBy, finalSortOrder]],
        whereClause,
        havingClause,
        geoDataSort,
        accountId,
        documentRid
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resources: resources.resources,
          count: resources.totalCount,
        },
      };
    } catch (err) {
      logMessage(`Error fetching imported resources: ${(err as Error).message}`);
      throw new Error(
        "Error fetching imported resources: " + (err as Error).message
      );
    }
  }

  /**
   * Exports the list of imported resources for a given account, applying filters, search, and sorting,
   * and returns only the fields allowed for the requesting user.
   *
   * @async
   * @function exportAccountLevelImportedResources
   *
   * @param {string} accountId - The RID of the account to export resources for.
   * @param {string} search - A search string used to filter resource data based on text input.
   * @param {Record<string, string>} [filters={}] - Key-value filters to apply in the export query.
   * @param {string} [sortBy="created_datetime"] - Field to sort by. Defaults to `created_datetime`.
   * @param {string} [sortOrder="ASC"] - Sorting order, either `ASC` or `DESC`. Defaults to `ASC`.
   * @param {string} documentRid - The RID of the document associated with the import.
   * @param {string} userId - The ID of the user performing the export. Used to determine field-level access.
   *
   * @returns {Promise<{
   *   statusCode: number,
   *   message: string,
   *   errorMessage?: string,
   *   data?: {
   *     resources: any[],
   *     count: number
   *   }
   * }>} A promise that resolves with an object containing exportable resources and their total count.
   *
   * @throws {Error} Throws if:
   * - The account does not exist or its schema is invalid.
   * - An error occurs while fetching or formatting export data.
   *
   * @description
   * This function:
   * - Verifies account validity and schema existence.
   * - Builds query parameters like `whereClause`, `havingClause`, and sort options.
   * - Fetches raw resource data using `schemaService.fetchResourcesForExport`.
   * - Fetches allowed export fields for the user from the `accounts_view_edit` and `account_resources_view_edit` permissions.
   * - Applies a label and field name mapping (`labelMap`, `fieldValueMap`) to shape the output.
   * - Returns the filtered and labeled exportable data, excluding unauthorized fields.
   */
  async exportAccountLevelImportedResources(
    accountId: string,
    search: string,
    filters: Record<string, string> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    documentRid: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resources: any; count: number };
  }> {
    try {
      const mainDb = await this.getMainDbSequelize();
      const orgDb = await this.getOrgSequelize();

      const fetchAccountDetails: any = await mainDb.query(
        await rawQueries.fetchParentAccount(accountId, mainDb)
      );

      const isExists = await this.schemaService.checkIfSchemaExists(
        fetchAccountDetails[0][0].r_number
      );

      if (!isExists) {
        logMessage(`Invalid account number: ${accountId}`);
        throw new Error(
          "Invalid account number: The account number does not exist."
        );
      }

      const [finalSortBy, finalSortOrder] =
        this.resourceService.getSortParameters(sortBy, sortOrder);

      const { whereClause, havingClause } =
        this.resourceService.buildWhereClause(filters, search);
      const { geoDataSort } = this.resourceService.processGeoDataSort(
        sortBy,
        sortOrder
      );

      const resources = await this.schemaService.fetchResourcesForExport(
        fetchAccountDetails[0][0].r_number,
        [[finalSortBy, finalSortOrder]],
        whereClause,
        havingClause,
        geoDataSort,
        accountId,
        documentRid
      );

      const rawResult = resources.resources || [];
      const [accountFields, resourceFields] = await Promise.all([
        this.schemaService.getAllowedExportFields(userId, "accounts_view_edit"),
        this.schemaService.getAllowedExportFields(
          userId,
          "account_resources_view_edit"
        ),
      ]);
      // const allowedFieldsForExport = await this.schemaService.getAllowedExportFields(userId,"account_resources_view_edit");
      const allowedFieldSet = new Set<string>();
      for (const field of resourceFields) {
        if (field.read) {
          allowedFieldSet.add(field.field_name);
        }
      }
      const requiredAccountFields = new Set(["account_name"]); // Add more if needed
      for (const field of accountFields) {
        if (field.read && requiredAccountFields.has(field.field_name)) {
          allowedFieldSet.add(field.field_name);
        }
      }

      const labelMap: Record<string, string> = {
        account_name: "Account Name",
        resource_code: "Resource Code",
        resource_name: "Name",
        resource_type_rid: "Resource Type",
        resource_orgname: "Org Name",
        resource_designation: "Designation",
        resource_role: "Role",
        country_rid: "Country",
        region_rid: "Region",
        total_project_hours: "Total Project Hours",
        estimated_rd_hours: "Estimated R&D Hours",
        status_rid: "Status",
        comments: "Comments",
        r_number: "Resource ID",
      };
      const fieldValueMap: Record<string, string> = {
        resource_type_rid: "resource_type_name",
        region_rid: "region_name",
        country_rid: "country_name",
        status_rid: "status_name",
      };

      const exportData = rawResult.map((resource: any) => {
        const row: Record<string, string> = {};

        for (const [field, label] of Object.entries(labelMap)) {
          if (allowedFieldSet.has(field)) {
            const actualField = fieldValueMap[field] || field; // fallback to same field if not mapped
            row[label] = resource[actualField] ?? "-";
          }
        }

        return row;
      });

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resources: exportData,
          count: resources.totalCount,
        },
      };
    } catch (err) {
      logMessage(`Error fetching imported resources: ${(err as Error).message}`);
      throw new Error(
        "Error fetching imported resources: " + (err as Error).message
      );
    }
  }

  /**
   * Fetches a paginated, sorted, and optionally filtered list of imported project tasks
   * for a given account and document. Applies various joins and transforms data to match
   * expected output format.
   *
   * @async
   * @function fetchAccountLevelImportedProjectTasks
   *
   * @param {string} accountRid - The RID of the account whose project tasks are being fetched.
   * @param {string} documentRid - The RID of the document used to filter tasks via `ProjectTaskTimeline`.
   * @param {Record<string, any>} [filters={}] - Key-value filters to apply when querying project tasks. Supports dynamic keys.
   * @param {string} [search] - A search string for global filtering across fields (like project name, task name, etc.).
   * @param {number} [page=1] - The current page number for pagination.
   * @param {number} [limit=10] - The number of results to return per page.
   * @param {string} [sortBy="created_datetime"] - Field name to sort the results by. Defaults to `created_datetime`.
   * @param {string} [sortOrder="DESC"] - Sort order, either `ASC` or `DESC`. Defaults to `DESC`.
   *
   * @returns {Promise<{
   *   statusCode: number,
   *   message: string,
   *   errorMessage?: string,
   *   data?: {
   *     tasks: any[],
   *     totalCount: number
   *   }
   * }>} A promise resolving to an object containing the paginated task list and total count.
   *
   * @throws {Error} If:
   * - Schema resolution fails.
   * - Required models or joins are missing.
   * - The underlying database queries fail.
   *
   * @description
   * This method:
   * - Determines the schema for the given account RID.
   * - Initializes Sequelize models dynamically for the schema.
   * - Builds raw `WHERE` clauses based on search and filters.
   * - Joins with related models such as `AccountDetailsModel`, `ResourceModel`, `ProjectFiscalModel`,
   *   and `ProjectTaskTimelineModel` (for document-based filtering).
   * - Formats the data using mapping dictionaries (for currency, task type, status, etc.).
   * - Applies custom in-memory filters (e.g., `resource_name` text match).
   * - Sorts and paginates the final list before returning.
   */
  async fetchAccountLevelImportedProjectTasks(
    accountRid: string,
    documentRid: string,
    filters: Record<string, any> = {},
    search?: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = "created_datetime",
    sortOrder: string = "DESC"
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { tasks: any[]; totalCount: number };
  }> {
    try {
      const sequelize = await initOrgSequelize();
      const mainSequelize = await initMainDbSequelize();

      const schemaName = await this.projectTaskService.getSchemaInfo(
        accountRid
      );

      // ✅ Initialize all models first
      const { models } =
        await this.projectTaskService.initializeModelsAndAssociations(
          schemaName
        );

      let resourceFilter: Record<string, any> | undefined;
      if (filters.resource_name) {
        resourceFilter = filters.resource_name;
        delete filters.resource_name;
      }

      // ✅ Build where clause with project filter
      const { whereClause } = this.projectTaskService.buildRawWhereClause(
        filters,
        search
      );

      // ✅ Define includes with ProjectTaskTimeline join
      const includes = [
        {
          model: models.AccountDetailsModel,
          attributes: ["account_name"],
          required: false,
          as: "account",
        },
        {
          model: models.ProjectFiscalModel,
          attributes: ["project_name", "project_code", "currency_rid"],
          required: false,
          as: "project",
        },
        {
          model: models.ResourceModel,
          attributes: [
            "resource_code",
            "resource_name",
            "resource_type_rid",
            "resource_role",
            "resource_orgname",
          ],
          required: false,
          as: "resource",
        },
        // ✅ New: Join with ProjectTaskTimeline
        {
          model: models.ProjectTaskTimelineModel, // Ensure this model is initialized
          as: "ProjectTimeline",
          required: true, // INNER JOIN (only tasks with matching timeline entries)
          where: {
            document_rid: documentRid, // Filter by the provided documentRid
          },
          attributes: [], // No need to select timeline fields
        },
      ];

      // ✅ Get all tasks without pagination first to properly handle sorting of related data
      const allTasks = await models.ProjectTaskModel.findAll({
        where: whereClause,
        include: includes,
      });

      // ✅ Fetch and map related data
      const {
        resourceTypeMap,
        currencyMap,
        resourceStatusMap,
        taskTypeMap,
        taskClassificationsMap,
      } = await this.projectTaskService.fetchRelatedData(
        allTasks,
        mainSequelize
      );

      // ✅ Format all tasks
      let formattedTasks = allTasks.map((task) =>
        this.projectTaskService.formatTaskData(
          task,
          resourceTypeMap,
          currencyMap,
          resourceStatusMap,
          taskTypeMap,
          taskClassificationsMap
        )
      );

      if (resourceFilter) {
        formattedTasks = formattedTasks.filter((task) => {
          const resourcePass = resourceFilter
            ? this.projectTaskService.applyTextFilter(
                task.resource_name,
                resourceFilter
              )
            : true;

          return resourcePass;
        });
      }

      // ✅ Handle special sorting cases
      formattedTasks = this.projectTaskService.sortTasks(
        formattedTasks,
        sortBy,
        sortOrder
      );

      // ✅ Apply pagination after sorting
      const total = formattedTasks.length;
      formattedTasks = formattedTasks.slice((page - 1) * limit, page * limit);

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          tasks: formattedTasks,
          totalCount: total,
        },
      };
    } catch (err) {
      logMessage(`Error fetching imported project_tasks: ${(err as Error).message}`);
      throw new Error(
        "Error fetching imported project_tasks: " + (err as Error).message
      );
    }
  }

  /**
   * Exports a list of imported project tasks for a given account and document, applying
   * optional filters, search, sorting, and user-based field access control. Returns
   * tasks in a formatted structure suitable for CSV or Excel export.
   *
   * @async
   * @function exportAccountLevelImportedProjectTasks
   *
   * @param {string} accountRid - The RID of the account from which to export project tasks.
   * @param {string} documentRid - The RID of the document used to filter tasks (via timeline entries).
   * @param {string} userId - The ID of the user requesting the export; used to control access to export fields.
   * @param {Record<string, any>} [filters={}] - Optional filters to apply on the task data (e.g., task type, resource role).
   * @param {string} [search] - Optional global search string applied across key task fields.
   * @param {string} [sortBy="created_datetime"] - Field to sort by (e.g., `start_date`, `resource_name`).
   * @param {string} [sortOrder="DESC"] - Sort order: `ASC` or `DESC`. Defaults to `DESC`.
   *
   * @returns {Promise<{
   *   statusCode: number,
   *   message: string,
   *   errorMessage?: string,
   *   data?: {
   *     tasks: any[],
   *     totalCount: number
   *   }
   * }>} A promise resolving to the exported task data and total count, formatted for file generation.
   *
   * @throws {Error} If schema resolution fails, Sequelize query fails, or formatting errors occur.
   *
   * @description
   * This method:
   * - Determines the correct schema based on the `accountRid`.
   * - Initializes Sequelize models for the organization's schema.
   * - Applies filters and search on `ProjectTaskModel` and joins it with related models:
   *   `AccountDetailsModel`, `ProjectFiscalModel`, `ResourceModel`, and `ProjectTaskTimelineModel`.
   * - Filters only the tasks that are linked to the specified `documentRid`.
   * - Fetches related data such as currency, resource type, status, task type, etc., to format the task fields.
   * - Uses user permissions (`getAllowedExportFields`) to include only authorized fields in the exported data.
   * - Formats and returns a clean, label-based export-ready task object list.
   */
  async exportAccountLevelImportedProjectTasks(
    accountRid: string,
    documentRid: string,
    userId: string,
    filters: Record<string, any> = {},
    search?: string,
    sortBy: string = "created_datetime",
    sortOrder: string = "DESC"
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { tasks: any[]; totalCount: number };
  }> {
    try {
      const sequelize = await initOrgSequelize();
      const mainSequelize = await initMainDbSequelize();

      const schemaName = await this.projectTaskService.getSchemaInfo(
        accountRid
      );

      // ✅ Initialize all models first
      const { models } =
        await this.projectTaskService.initializeModelsAndAssociations(
          schemaName
        );

      let resourceFilter: Record<string, any> | undefined;
      if (filters.resource_name) {
        resourceFilter = filters.resource_name;
        delete filters.resource_name;
      }

      // ✅ Build where clause with project filter
      const { whereClause } = this.projectTaskService.buildRawWhereClause(
        filters,
        search
      );

      // ✅ Define includes with ProjectTaskTimeline join
      const includes = [
        {
          model: models.AccountDetailsModel,
          attributes: ["account_name"],
          required: false,
          as: "account",
        },
        {
          model: models.ProjectFiscalModel,
          attributes: ["project_name", "project_code", "currency_rid"],
          required: false,
          as: "project",
        },
        {
          model: models.ResourceModel,
          attributes: [
            "resource_code",
            "resource_name",
            "resource_type_rid",
            "resource_role",
            "resource_orgname",
          ],
          required: false,
          as: "resource",
        },
        // ✅ New: Join with ProjectTaskTimeline
        {
          model: models.ProjectTaskTimelineModel, // Ensure this model is initialized
          as: "ProjectTimeline",
          required: true, // INNER JOIN (only tasks with matching timeline entries)
          where: {
            document_rid: documentRid, // Filter by the provided documentRid
          },
          attributes: [], // No need to select timeline fields
        },
      ];

      // ✅ Get all tasks without pagination first to properly handle sorting of related data
      const allTasks = await models.ProjectTaskModel.findAll({
        where: whereClause,
        include: includes,
      });

      // ✅ Fetch and map related data
      const {
        resourceTypeMap,
        currencyMap,
        resourceStatusMap,
        taskTypeMap,
        taskClassificationsMap,
      } = await this.projectTaskService.fetchRelatedData(
        allTasks,
        mainSequelize
      );

      // ✅ Format all tasks
      let formattedTasks = allTasks.map((task) =>
        this.projectTaskService.formatTaskData(
          task,
          resourceTypeMap,
          currencyMap,
          resourceStatusMap,
          taskTypeMap,
          taskClassificationsMap
        )
      );

      if (resourceFilter) {
        formattedTasks = formattedTasks.filter((task) => {
          const resourcePass = resourceFilter
            ? this.projectTaskService.applyTextFilter(
                task.resource_name,
                resourceFilter
              )
            : true;

          return resourcePass;
        });
      }

      // ✅ Handle special sorting cases
      formattedTasks = this.projectTaskService.sortTasks(
        formattedTasks,
        sortBy,
        sortOrder
      );

      const total = formattedTasks.length;

      const [projectTaskFields] = await Promise.all([
        this.schemaService.getAllowedExportFields(
          userId,
          "projects_task_view_edit"
        ),
      ]);

      const allowedFieldSet = new Set<string>();
      for (const field of projectTaskFields) {
        if (field.read) {
          allowedFieldSet.add(field.field_name);
        }
      }

      const exportData = await Promise.all(
      formattedTasks.map(async (task: any) => {
        const exportRecord: Record<string, any> = {};
        
        // Only add fields that are in the allowedFieldSet
        if (allowedFieldSet.has('resource_code')) {
          exportRecord['Resource Code'] = task.resource_code || "-";
        }
        if (allowedFieldSet.has('resource_name')) {
          exportRecord['Resource Name'] = task.resource_name || "-";
        }
        if (allowedFieldSet.has('resource_type_name')) {
          exportRecord['Resource Type'] = task.resource_type_name || "-";
        }
        if (allowedFieldSet.has('resource_role')) {
          exportRecord['Role'] = task.resource_role || "-";
        }
        if (allowedFieldSet.has('start_date')) {
          exportRecord['Start Date'] = task.start_date ? moment(task.start_date).format("YYYY-MMM-DD") : "-";
        }
        if (allowedFieldSet.has('end_date')) {
          exportRecord['End Date'] = task.end_date ? moment(task.end_date).format("YYYY-MMM-DD") : "-";
        }
        if (allowedFieldSet.has('total_cost_pro_task')) {
          exportRecord['Cost'] = await this.projectTaskService.formatNumberForExport(
            task.total_cost_pro_task,
            task.currency_symbol
          ) || "-";
        }
        if (allowedFieldSet.has('total_hours_pro_task')) {
          exportRecord['Effort in Hrs'] = task.total_hours_pro_task || "-";
        }
        if (allowedFieldSet.has('comments')) {
          exportRecord['Comments'] = task.comments || "-";
        }
        if (allowedFieldSet.has('r_number')) {
          exportRecord['Project Task ID'] = task.r_number || "-";
        }
        
        return exportRecord;
      })
    );

      // Ensure we always return at least an empty object in the array if there are no tasks
      const finalExportData = exportData.length > 0 ? exportData : [{}];

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          tasks: finalExportData,
          totalCount: total,
        },
      };
    } catch (err) {
      logMessage(`Error fetching imported project_tasks: ${(err as Error).message}`);
      throw new Error(
        "Error fetching imported project_tasks: " + (err as Error).message
      );
    }
  }

  async getAllowedExportFields(
    userId: string,
    permission_name: string
  ): Promise<any[]> {
    const mainDbSequelize = await initMainDbSequelize();
    const [userInfo] = (await mainDbSequelize.query(
      rawQueries.fetchProfileFromUser(),
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    )) as [{ profile_rid: string }] | [];

    if (!userInfo?.profile_rid) {
      return [];
    }

    const [profileFields, userFields] = await Promise.all([
      mainDbSequelize.query(
        rawQueries.fetchExportPermission(),
        {
          replacements: {
            permissionName: permission_name,
            profileId: userInfo?.profile_rid,
          },
          type: "SELECT",
        }
      ),
      mainDbSequelize.query(
        rawQueries.fetchUserPermissinon(),
        {
          replacements: {
            permissionName: permission_name,
            userId,
          },
          type: QueryTypes.SELECT,
        }
      ),
    ]);

    // Merge: user overrides profile
    const userFieldMap = new Map<string, any>();
    for (const field of userFields as any[]) {
      userFieldMap.set(field.field_name, field);
    }

    const merged = (profileFields as any[]).map((pf) => {
      const userPerm = userFieldMap.get(pf.field_name);
      if (userPerm) {
        userFieldMap.delete(pf.field_name);
        return {
          field_desc: pf.field_desc,
          field_name: pf.field_name,
          read: pf.read ? true : userPerm?.read === true,
        };
      }
      return {
        field_desc: pf.field_desc,
        field_name: pf.field_name,
        read: pf.read,
      };
    });

    const userOnly = Array.from(userFieldMap.values()).map((uf) => ({
      field_desc: uf.field_desc,
      field_name: uf.field_name,
      read: uf.read,
    }));

    const exportableFields = [...merged, ...userOnly].filter((f) => f.read);
    return exportableFields;
  }
}
