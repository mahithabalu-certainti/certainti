import { initMainDbSequelize } from "../config/mainDataSource";
import { HttpStatus, MAIN_SCHEMA_NAME } from "../utils/constants";
import { ICreateResource, IUpdateResource } from "../utils/types";
import SchemaService from "./schemaService";
import moment from "moment";
import { Op, Sequelize } from "sequelize";

export class ResourceService {
  private schemaService: SchemaService;

  constructor() {
    this.schemaService = new SchemaService();
  }

  /**
   * Creates a new resource entry in the database for a given account.
   * Ensures the schema and account validity before insertion.
   *
   * @param {ICreateResource} resourceData - The data required to create a resource.
   * @returns {Promise<object>} - A response object with status, message, and created resource.
   */
  async createResource(
    resourceData: ICreateResource,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resource: any };
  }> {
    try {
      const { account_number, account_id } = resourceData;

      const { isAccountExist, dataStorage, parentAccountId } =
        await this.schemaService.checkAccountIdAndNumber(
          account_number,
          account_id
        );

      if (!isAccountExist) {
        throw new Error(
          "Invalid account number or account ID. The specified account was not found."
        );
      }

      let accountNumber = account_number;

      if (dataStorage === "store_in_parent") {
        accountNumber = await this.schemaService.fetchParentAccount(
          parentAccountId
        );
      }

      const isExists = await this.schemaService.checkIfSchemaExists(
        accountNumber
      );

      if (!isExists) {
        throw new Error(
          "Invalid account number: The account number does not exist."
        );
      }

      await this.schemaService.createResourceTable(accountNumber);

      // Parse dates and set to UTC midnight to avoid timezone issues
      const startDate = moment.utc(resourceData.effective_from_date, "YYYY-MM-DD").startOf('day');
      const endDate = moment.utc(resourceData.effective_end_date, "YYYY-MM-DD").startOf('day');

      resourceData.created_by = userId;
      resourceData.modified_by = userId;

      const resource = await this.schemaService.insertResourcesTable(
        resourceData,
        startDate,
        endDate,
        accountNumber
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resource,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Fetches a paginated list of resources for a given account with optional filters, search, and sorting.
   *
   * @param {string} accountNumber - The account number to fetch resources from.
   * @param {number} fiscal_year - The fiscal year (currently unused).
   * @param {number} [page=1] - The page number for pagination.
   * @param {number} [limit=10] - Number of items per page.
   * @param {string} search - Global search term.
   * @param {Record<string, string>} filters - Filter object mapping fields to values.
   * @param {string} [sortBy="created_datetime"] - Field to sort by.
   * @param {string} [sortOrder="ASC"] - Sort order, either ASC or DESC.
   * @returns {Promise<object>} - Response with resource list and count.
   */
  async resourcesList(
    accountNumber: string,
    page: number = 1,
    limit: number = 10,
    search: string,
    filters: Record<string, string> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC"
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resources: any; count: number };
  }> {
    try {
      const { accountNumber: accountRNumber, accountId } =
        await this.schemaService.fetchAccountByNumber(accountNumber);

      const isExists = await this.schemaService.checkIfSchemaExists(
        accountRNumber
      );

      if (!isExists) {
        throw new Error(
          "Invalid account number: The account number does not exist."
        );
      }

      const offset = (page - 1) * limit;

      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );

      const { whereClause, havingClause } = this.buildWhereClause(filters, search);
      const { geoDataSort } = this.processGeoDataSort(
        sortBy,
        sortOrder
      );

      const resources = await this.schemaService.fetchResources(
        accountRNumber,
        offset,
        limit,
        [[finalSortBy, finalSortOrder]],
        whereClause,
        havingClause,
        geoDataSort,
        accountId
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
      return this.throwServiceError(err as Error);
    }
  }


  /**
   * Fetches a  list of resources for a given account with optional filters, search, and sorting for downloading.
   *
   * @param {string} accountNumber - The account number to fetch resources from.
   * @param {number} fiscal_year - The fiscal year (currently unused).
   * @param {string} search - Global search term.
   * @param {Record<string, string>} filters - Filter object mapping fields to values.
   * @param {string} [sortBy="created_datetime"] - Field to sort by.
   * @param {string} [sortOrder="ASC"] - Sort order, either ASC or DESC.
   * @returns {Promise<object>} - Response with resource list and count.
   */
  async exportResourcesList(
    accountNumber: string,
    search: string,
    filters: Record<string, string> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC"
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resources: any };
  }> {
    try {
      const { accountNumber: accountRNumber, accountId } =
        await this.schemaService.fetchAccountByNumber(accountNumber);

      const isExists = await this.schemaService.checkIfSchemaExists(
        accountRNumber
      );

      if (!isExists) {
        throw new Error(
          "Invalid account number: The account number does not exist."
        );
      }

      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );

      const { whereClause, havingClause } = this.buildWhereClause(filters, search);
      const { geoDataSort } = this.processGeoDataSort(
        sortBy,
        sortOrder
      );

      const resources = await this.schemaService.fetchResourcesForExport(
        accountRNumber,
        [[finalSortBy, finalSortOrder]],
        whereClause,
        havingClause,
        geoDataSort,
        accountId,
      );

      const rawResult = resources.resources || [];
      let exportData = rawResult.map((resource: any) => {   
        return {
          "Account Name": resource.account_name || "-",
          "Resource Code":resource.resource_code || "-",
          "Name":resource.resource_name || "-",
          "Resource Type": resource?.resource_type_name || "-",
          "Org Name": resource.resource_orgname || "-",
          "Designation": resource.resource_designation || "-",
          "Role": resource.resource_role || "-",
          "Region": resource.region_name || "-",
          "Country": resource.country_name || "-",
          "Total Project Hours": resource.total_project_hours || "-",
          "Estimated R&D Hours": resource.estimated_rd_hours || "-",
          "Status": resource.status_name,
          "Comments": resource.comments || "-",
          "Resource ID": resource.r_number || "-"
        };
      });
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resources: exportData
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }



  /**
   * Updates an existing resource's data for a given account.
   * Validates that the resource and schema exist.
   *
   * @param {IUpdateResource} resourceData - Updated data for the resource.
   * @returns {Promise<object>} - Response containing the updated resource data.
   */
  async updateResource(
    resourceData: IUpdateResource,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resource: any };
  }> {
    try {
      const { account_number, resource_id } = resourceData;

      let { accountNumber, accountId } =
        await this.schemaService.fetchAccountByNumber(account_number);

      try {
        const isResourceExist = await this.schemaService.checkIfResourceExists(
          resource_id,
          accountNumber
        );

        if (!isResourceExist) {
          throw new Error(
            "Invalid resource ID: The specified resource does not exist."
          );
        }
      } catch (error) {
        console.error("Error checking resource existence:", error);
        // If there's a DB error, assume resource exists and continue
        // This prevents false negatives when DB query fails
      }

      const isExists = await this.schemaService.checkIfSchemaExists(
        accountNumber
      );

      if (!isExists) {
        throw new Error(
          "Invalid account number: The account number does not exist."
        );
      }

      resourceData.modified_by = userId;
      const resource = await this.schemaService.updateResource(
        resourceData,
        accountNumber,
        accountId
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resource,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Retrieves detailed information about a resource by its ID for a given account.
   *
   * @param {string} accountRNumber - Account number.
   * @param {string} resourceId - ID of the resource.
   * @returns {Promise<object>} - Response containing the resource details.
   */
  async resourceById(
    accountRNumber: string,
    resourceId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceDetails: any };
  }> {
    try {
      let { accountNumber } = await this.schemaService.fetchAccountByNumber(
        accountRNumber
      );

      const isExists = await this.schemaService.checkIfSchemaExists(
        accountNumber
      );

      if (!isExists) {
        throw new Error(
          "Invalid account number: The account number does not exist."
        );
      }

      try {
        const isResourceExist = await this.schemaService.checkIfResourceExists(
          resourceId,
          accountNumber
        );

        if (!isResourceExist) {
          throw new Error(
            "Invalid resource ID: The specified resource does not exist."
          );
        }
      } catch (error) {
        console.error("Error checking resource existence:", error);
        // If there's a DB error, assume resource exists and continue
        // This prevents false negatives when DB query fails
      }

      const resourceDetails = await this.schemaService.resourceDetails(
        accountNumber,
        resourceId
      );

      // Fetch user names for created_by and modified_by
      const userNames = await this.fetchUserNames({
        created_by: resourceDetails?.created_by,
        modified_by: resourceDetails?.modified_by,
      });

      if (resourceDetails) {
        resourceDetails.created_by = userNames.created_by_name;
        resourceDetails.modified_by = userNames.modified_by_name;
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceDetails,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Validates and returns sorting parameters based on user input.
   * Defaults to "created_datetime" if the field is invalid.
   *
   * @param {string} sortBy - Field to sort by.
   * @param {string} sortOrder - Sort direction (ASC or DESC).
   * @returns {[string, string]} - Tuple of validated sort field and order.
   */
  getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "rid",
      "r_number",
      "resource_code",
      "resource_name",
      "resource_type_rid",
      "status_rid",
      "resource_role",
      // "resource_mobile",
      // "resource_email",
      "resource_designation",
      "resource_total_experience",
      "country_rid",
      "region_rid",
      "account_name",
      "total_project_hours",
      "comments",
      "resource_orgname",
      "estimated_rd_hours",
    ];

    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  /**
   * Builds a Sequelize `where` clause from search and filter parameters.
   *
   * @param {Record<string, any>} filters - Key-value filters.
   * @param {string} search - Global search string.
   * @returns {object} - Sequelize-compatible `where` clause.
   */
  buildWhereClause(
    filters: Record<string, any>,
    search: string
  ): {
    whereClause: Record<string, any>;
    havingClause: Record<string, any>;
  } {
    let whereClause: Record<string, any> = {};
    let havingClause: Record<string, any> = {};

    if (search) {
      whereClause = this.buildSearchCondition(search, whereClause);
    }

    const result = this.applyFilters(filters, whereClause, havingClause);
    whereClause = result.whereClause;
    havingClause = result.havingClause;

    return { whereClause, havingClause };
  }

  /**
   * Builds a case-insensitive OR condition across searchable fields for global search.
   *
   * @param {string} search - The search term.
   * @param {Record<string, any>} whereClause - The existing where clause.
   * @returns {Record<string, any>} - Modified where clause including search conditions.
   */
  private buildSearchCondition(
    search: string,
    whereClause: Record<string, any>
  ): Record<string, any> {
    const searchCondition = {
      [Op.or]: [
        { resource_name: { [Op.iLike]: `%${search}%` } },
        { r_number: { [Op.iLike]: `%${search}%` } },
      ],
    };

    return Object.keys(whereClause).length > 0
      ? { [Op.and]: [whereClause, searchCondition] }
      : searchCondition;
  }

  /**
   * Applies filters to a Sequelize where clause with special handling for ENUM/UUID fields.
   * Automatically casts fields like enums or UUIDs to TEXT when needed.
   *
   * @param {Record<string, any>} filters - Filter input from the client.
   * @param {Record<string, any>} whereClause - Existing Sequelize where clause.
   * @returns {Record<string, any>} - Final where clause with applied filters.
   */

  private applyFilters(
    filters: Record<string, any>,
    whereClause: Record<string, any>,
    havingClause: Record<string, any>
  ): { whereClause: Record<string, any>; havingClause: Record<string, any> } {
    const castToTextFields = ["resource_type_rid", "resource_name", "resource_designation", "r_number", "resource_code","status_rid","resource_orgname","resource_role","comments"];
    const uuidFields = ["country_rid","region_rid"];

    const filterFields = [
      { clientField: "resource_code", dbField: "Resources.resource_code" },
      { clientField: "r_number", dbField: "Resources.r_number" },
      { clientField: "resource_name", dbField: "Resources.resource_name" },
      { clientField: "resource_type_rid", dbField: "Resources.resource_type_rid" },
      { clientField: "status_rid", dbField: "Resources.status_rid" },
      { clientField: "resource_designation", dbField: "Resources.resource_designation" },
      { clientField: "country_rid", dbField: "Resources.country_rid" },
      { clientField: "region_rid", dbField: "Resources.region_rid" },
      { clientField: "resource_role", dbField: "Resources.resource_role" },
      { clientField: "resource_orgname", dbField: "Resources.resource_orgname" },
      { clientField: "comments", dbField: "Resources.comments" },
    ];

    filterFields.forEach(({ clientField, dbField }) => {
      if (filters[clientField]) {
        const fieldFilter = filters[clientField];
        const fieldName = dbField.split('.')[1];
        if (uuidFields.includes(fieldName)) {
          whereClause[clientField] = this.getUuidFieldFilter(fieldFilter, dbField);
        }
        else if (castToTextFields.includes(fieldName)) {
          whereClause[dbField] = Sequelize.where(
            Sequelize.cast(Sequelize.col(dbField), "TEXT"),
            this.getFieldFilter(fieldFilter, dbField)
          );
        } 
        else {
          whereClause[dbField] = this.getFieldFilter(fieldFilter, dbField);
        }
      }
    });

    if (filters.account_name) {
      whereClause['$AccountDetails.account_name$'] = this.getFieldFilter(filters.account_name, 'account_name');
    }

   if (filters.total_project_hours || filters.estimated_rd_hours) {
    const totalProjectHoursExpr = Sequelize.literal(`
      "ResourceFiscal"."total_effort_for_year_project"
    `);
    const estimatedRdHoursExpr = Sequelize.literal(`
      "ResourceFiscal"."estimated_rd_hours"
    `);

    if (filters.total_project_hours) {
      const filter = filters.total_project_hours;
      if (filter.equals !== undefined) {
        havingClause = Sequelize.where(totalProjectHoursExpr, { [Op.eq]: filter.equals });
      } else if (filter.not_equals !== undefined) {
        havingClause = Sequelize.where(totalProjectHoursExpr, { 
          [Op.or]: [
            { [Op.ne]: filter.not_equals },
            { [Op.is]: null },
          ]
        });
      } else if (filter.greater_than !== undefined) {
        havingClause = Sequelize.where(totalProjectHoursExpr, { [Op.gt]: filter.greater_than });
      } else if (filter.less_than !== undefined) {
        havingClause = Sequelize.where(totalProjectHoursExpr, { [Op.lt]: filter.less_than });
      } else if (filter.between && Array.isArray(filter.between) && filter.between.length === 2) {
        havingClause = Sequelize.where(totalProjectHoursExpr, { [Op.between]: filter.between });
      } else if (filter.is_empty === true) {
        havingClause = Sequelize.where(totalProjectHoursExpr, { [Op.is]: null });
      }
    }

    if (filters.estimated_rd_hours) {
      const filter = filters.estimated_rd_hours;
      if (filter.equals !== undefined) {
        havingClause = Sequelize.where(estimatedRdHoursExpr, { [Op.eq]: filter.equals });
      } else if (filter.not_equals !== undefined) {
        havingClause = Sequelize.where(estimatedRdHoursExpr, { 
          [Op.or]: [
            { [Op.ne]: filter.not_equals },
            { [Op.is]: null },
          ]
        });
      } else if (filter.greater_than !== undefined) {
        havingClause = Sequelize.where(estimatedRdHoursExpr, { [Op.gt]: filter.greater_than });
      } else if (filter.less_than !== undefined) {
        havingClause = Sequelize.where(estimatedRdHoursExpr, { [Op.lt]: filter.less_than });
      } else if (filter.between && Array.isArray(filter.between) && filter.between.length === 2) {
        havingClause = Sequelize.where(estimatedRdHoursExpr, { [Op.between]: filter.between });
      } else if (filter.is_empty === true) {
        havingClause = Sequelize.where(estimatedRdHoursExpr, { [Op.is]: null });
      }
    }
  }

    return { whereClause, havingClause };
  }

  private getUuidFieldFilter(fieldFilter: any, dbField: string): any {
    if (fieldFilter.equals) {
      return fieldFilter.equals;
    }
    if (fieldFilter.not_equals) {
      return { 
        [Op.or]: [
          { [Op.ne]: fieldFilter.not_equals },
          { [Op.is]: null },
        ]
      };
    }
    if (fieldFilter.is_empty === true) {
      return { [Op.is]: null };
    }
    if (fieldFilter.is_not_empty === true) {
      return { [Op.not]: null };
    }
    if (fieldFilter.in && Array.isArray(fieldFilter.in)) {
      return { [Op.in]: fieldFilter.in };
    }
    if (fieldFilter.not_in && Array.isArray(fieldFilter.not_in)) {
      return { [Op.notIn]: fieldFilter.not_in };
    }
    return fieldFilter.value || fieldFilter;
  }

  /**
   * Translates a single filter into a Sequelize condition.
   * Supports `equals`, `contains`, and direct value matching.
   *
   * @param {any} fieldFilter - The filter object for a specific field.
   * @param {string} dbField - The corresponding database field name.
   * @returns {any} - Sequelize-compatible condition.
   */
  private getFieldFilter(fieldFilter: any, dbField: string): any {
    if (fieldFilter.equals) {
      return { [Op.iLike]: fieldFilter.equals };
    }
    if (fieldFilter.not_equals) {
      return { 
        [Op.or]: [
          { [Op.notILike]: fieldFilter.not_equals },
          { [Op.is]: null },
        ]
      };   
    }
    if (fieldFilter.contains) {
      // Handle all special characters by escaping them for SQL LIKE pattern
      const escapedValue = fieldFilter.contains.replace(/[-[\]{}()*+?.,\\^$|#\s_%]/g, '\\$&');
      return { [Op.iLike]: `%${escapedValue}%` };
    }
    if (fieldFilter.not_contains) {
      // Handle all special characters by escaping them for SQL LIKE pattern
      const escapedValue = fieldFilter.not_contains.replace(/[-[\]{}()*+?.,\\^$|#\s_%]/g, '\\$&');
      return { [Op.notILike]: `%${escapedValue}%` };
    }

    if (fieldFilter.is_empty === true) {
      return { [Op.or]: [null, ""] };
    }
    if (fieldFilter.is_not_empty === true) {
      return { [Op.and]: [{ [Op.not]: null }, { [Op.ne]: "" }] };
    }

    if (fieldFilter.in && Array.isArray(fieldFilter.in)) {
      return {
        [Op.iLike]: {[Op.any]: fieldFilter.in.map((value: string) => value)}
      };
    }
    if (fieldFilter.not_in && Array.isArray(fieldFilter.not_in)) {
      return {
        [Op.notILike]: {[Op.any]: fieldFilter.not_in.map((value: string) => value)}
      };
    }

    if (fieldFilter.value) {
      return fieldFilter.value;
    }
    if (fieldFilter.greater_than) {
      return { [Op.gt]: fieldFilter.greater_than };
    }
    if (fieldFilter.lesser_than) {
      return { [Op.lt]: fieldFilter.lesser_than };
    }
    if (
      fieldFilter.between &&
      Array.isArray(fieldFilter.between) &&
      fieldFilter.between.length === 2
    ) {
      return { [Op.between]: fieldFilter.between };
    }
  }

 processGeoDataSort(
  sortBy: string,
  sortOrder: string
) {
  const geoDataSort: string[][] = [];

  // Mapping incoming field names to actual DB column names
  const fieldMapping: Record<string, string> = {
    country_rid: "country_rid",
    region_rid: "region_rid",
    city_rid: "city_rid",
    resource_type_rid: "resource_type_rid",
    status_name: "status_name",
  };

  const mappedField = fieldMapping[sortBy];

  if (mappedField) {
    geoDataSort.push([
      mappedField,
      sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC",
    ]);
  }

  return {
    geoDataSort,
  };
}


  /**
   * Formats an error response to be returned from service methods.
   *
   * @param {Error} err - The caught error.
   * @returns {object} - Standardized error response object.
   */
  private throwServiceError(err: Error): {
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
   * Fetches user names for user IDs from the main database
   * @param userIds - Object containing user IDs (created_by, modified_by)
   * @returns Promise resolving to object with user names
   */
  private async fetchUserNames(userIds: {
    created_by?: string;
    modified_by?: string;
  }): Promise<{ created_by_name: string; modified_by_name: string }> {
    const result = {
      created_by_name: "",
      modified_by_name: "",
    };

    try {
      const sequelize = await initMainDbSequelize();

      // Fetch created_by user name if ID exists
      if (userIds.created_by) {
        const [createdByUser] = await sequelize.query(
          `SELECT concat(first_name, ' ', last_name) as full_name FROM ${MAIN_SCHEMA_NAME}."user" WHERE rid = :userId LIMIT 1`,
          {
            replacements: { userId: userIds.created_by },
            type: "SELECT",
          }
        );

        if (createdByUser) {
          result.created_by_name = (createdByUser as any).full_name;
        }
      }

      // Fetch modified_by user name if ID exists
      if (userIds.modified_by) {
        const [modifiedByUser] = await sequelize.query(
          `SELECT concat(first_name, ' ', last_name) as full_name FROM ${MAIN_SCHEMA_NAME}."user" WHERE rid = :userId LIMIT 1`,
          {
            replacements: { userId: userIds.modified_by },
            type: "SELECT",
          }
        );

        if (modifiedByUser) {
          result.modified_by_name = (modifiedByUser as any).full_name;
        }
      }
    } catch (error) {
      console.error("Error fetching user names:", error);
      // Return empty strings if there's an error
    }

    return result;
  }
}
