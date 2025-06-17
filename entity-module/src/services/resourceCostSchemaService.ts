import { Op, Sequelize } from "sequelize";
import { ResourceCost } from "../models/resourceCost";
import { ResourceCostTimeline } from "../models/resourceCostTimeline";
import { ResourceCostHistory } from "../models/resourceCostHistory";
import { Resources } from "../models/resource";
import { initOrgSequelize } from "../config/orgDataSource";
import { initMainDbSequelize } from "../config/mainDataSource";
import { HttpStatus } from "../utils/constants";
import { ResourceFiscal } from "../models/resourceFiscal";
import moment from "moment";
import currency from "currency.js";

class ResourceCostSchemaService {
  private sequelizeInstance: Sequelize | null = null;

  /**
   * Initializes the database connection and models
   * @returns Promise with sequelize instance
   */
  async initializeDatabase(schemaName: string): Promise<Sequelize> {
    try {
      if (!this.sequelizeInstance) {
        const sequelize = await initOrgSequelize();
        if (!sequelize) {
          throw new Error("Failed to initialize database connection");
        }

        // Initialize models with the sequelize instance
        Resources.initialize(sequelize, schemaName);
        ResourceFiscal.initialize(sequelize, schemaName);
        ResourceCost.initialize(sequelize, schemaName);
        ResourceCostTimeline.initialize(sequelize, schemaName);
        ResourceCostHistory.initialize(sequelize, schemaName);

        this.sequelizeInstance = sequelize;
      }

      return this.sequelizeInstance;
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }

  /**
   * Gets the database connection, initializing if necessary
   * @returns Promise with sequelize instance
   */
  async getDbConnection(schemaName: string): Promise<Sequelize> {
    if (!this.sequelizeInstance) {
      return this.initializeDatabase(schemaName);
    }
    return this.sequelizeInstance;
  }

  /**
   * Checks if a schema exists in the database
   *
   * @param sequelize - The Sequelize instance
   * @param schemaName - The name of the schema to check
   * @returns Promise<boolean> - True if schema exists, false otherwise
   */
  async checkSchemaExists(
    sequelize: Sequelize,
    schemaName: string
  ): Promise<boolean> {
    try {
      const result = await sequelize.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.schemata 
          WHERE schema_name = :schemaName
        )`,
        {
          replacements: { schemaName },
          type: "SELECT",
          plain: true,
        }
      );

      return result ? (result as any).exists === true : false;
    } catch (error) {
      console.error("Error checking schema existence:", error);
      return false;
    }
  }

  /**
   * Checks if a table exists in the specified schema
   *
   * @param sequelize - The Sequelize instance
   * @param schemaName - The name of the schema
   * @param tableName - The name of the table to check
   * @returns Promise<boolean> - True if table exists, false otherwise
   */
  async checkTableExists(
    sequelize: Sequelize,
    schemaName: string,
    tableName: string
  ): Promise<boolean> {
    try {
      const result = await sequelize.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = :schemaName
          AND table_name = :tableName
        )`,
        {
          replacements: { schemaName, tableName },
          type: "SELECT",
          plain: true,
        }
      );

      return result ? (result as any).exists === true : false;
    } catch (error) {
      console.error("Error checking table existence:", error);
      return false;
    }
  }

  /**
   * Creates tables in the specified schema
   *
   * @param schemaName - The schema name
   * @param tableName - Optional specific table to create
   * @returns Promise<boolean> - True if successful, false otherwise
   */
  async createTablesInSchema(
    schemaName: string,
    tableName?: string
  ): Promise<boolean> {
    try {
      const sequelize = await this.getDbConnection(schemaName);

      // Check if schema exists, create if it doesn't
      const schemaExists = await this.checkSchemaExists(sequelize, schemaName);
      if (!schemaExists) {
        await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
        console.log(`Schema ${schemaName} created`);
      }

      // Set the schema for this connection
      await sequelize.query(`SET search_path TO "${schemaName}"`);

      if (tableName) {
        // Check if the specific table exists
        const tableExists = await this.checkTableExists(
          sequelize,
          schemaName,
          tableName
        );

        if (!tableExists) {
          // Create only the specified table
          switch (tableName) {
            case "resources":
              await sequelize.models.Resources.sync({
                force: false,
                schema: schemaName, // Explicitly set schema
              });
              break;
            case "resource_cost":
              await sequelize.models.ResourceCost.sync({
                force: false,
                schema: schemaName, // Explicitly set schema
              });
              break;
            case "resource_cost_audit_log":
              await sequelize.models.ResourceCostAuditLog.sync({
                force: false,
                schema: schemaName, // Explicitly set schema
              });
              break;
            case "resource_cost_timeline":
              await sequelize.models.ResourceCostTimeline.sync({
                force: false,
                schema: schemaName, // Explicitly set schema
              });
              break;
            case "resource_cost_history":
              await sequelize.models.ResourceCostHistory.sync({
                force: false,
                schema: schemaName, // Explicitly set schema
              });
              break;
            case "resource_fiscal":
              await sequelize.models.ResourceFiscal.sync({
                force: false,
                schema: schemaName, // Explicitly set schema
              });
              break;
            default:
              throw new Error(`Table model ${tableName} not found`);
          }
          console.log(`Table ${tableName} created in schema: ${schemaName}`);
        } else {
          console.log(
            `Table ${tableName} already exists in schema: ${schemaName}`
          );
        }
      } else {
        // Create all tables in the specified schema
        await sequelize.sync({
          force: false,
          schema: schemaName, // Explicitly set schema for all tables
        });
        console.log(`All tables created in schema: ${schemaName}`);
      }

      return true;
    } catch (err) {
      console.error(`Error creating tables in schema ${schemaName}:`, err);
      return false;
    }
  }

  /**
   * Validates and ensures the required schema and tables exist
   *
   * @param accountNumber - Account identifier for schema selection
   * @param tableName - Optional specific table to create
   * @returns Promise with validation result
   */
  async validateSchema(
    accountNumber: string,
    tableName?: string
  ): Promise<boolean> {
    // Check if accountNumber already includes the platform_v2_ prefix
    const schemaName = accountNumber.startsWith("platform_v2_")
      ? accountNumber
      : `platform_v2_${accountNumber}`;

    // If we're creating resource_cost, make sure resources table exists first
    if (tableName === "resource_cost") {
      // First create the resources table
      const resourcesTableCreated = await this.createTablesInSchema(
        schemaName,
        "resources"
      );
      if (!resourcesTableCreated) {
        console.error(
          `Failed to create resources table in schema ${schemaName}`
        );
        return false;
      }
    }

    // Then create the requested table
    return await this.createTablesInSchema(schemaName, tableName);
  }

  /**
   * Processes currency filter by querying the main database for matching currency RIDs
   *
   * @param filters - The filters object containing currency filter
   * @returns Promise with currency RIDs or null
   */
  async processCurrencyFilter(filters: Record<string, any>) {
    // Check if currency filter exists and has valid operators
    if (!filters.currency || typeof filters.currency !== "object") {
      return null;
    }

    const currencyFilter = filters.currency;

    // Handle is_empty operator first
    if (currencyFilter.is_empty !== undefined) {
      delete filters.currency;
      if (currencyFilter.is_empty) {
        // For is_empty: true, we want records where currency_rid IS NULL or empty
        filters.currency_rid = {
          is_empty: true,
        };
      } else {
        // For is_empty: false, we want records where currency_rid IS NOT NULL and not empty
        filters.currency_rid = {
          is_not_empty: true,
        };
      }
      return null;
    }

    // Handle equals operator for UUID
    if (currencyFilter.equals) {
      delete filters.currency;
      filters.currency_rid = {
        equals: currencyFilter.equals,
      };
    }

    // Handle not_equals operator for UUID
    else if (currencyFilter.not_equals) {
      delete filters.currency;
      filters.currency_rid = {
        not_equals: currencyFilter.not_equals,
      };
    }

    // Handle contains operator for UUID
    else if (currencyFilter.contains) {
      delete filters.currency;
      filters.currency_rid = {
        contains: currencyFilter.contains,
      };
    }

    // Handle in operator for array of UUIDs
    else if (currencyFilter.in && Array.isArray(currencyFilter.in)) {
      delete filters.currency;
      filters.currency_rid = {
        in: currencyFilter.in,
      };
    }

    // Handle not_in operator for array of UUIDs
    else if (currencyFilter.not_in && Array.isArray(currencyFilter.not_in)) {
      delete filters.currency;
      filters.currency_rid = {
        not_in: currencyFilter.not_in,
      };
    }

    return null;
  }

  /**
   * Executes the main and count queries and formats the response
   *
   * @param schemaName - The schema name
   * @param filterConditions - SQL filter conditions
   * @param searchCondition - SQL search condition
   * @param sortBy - Field to sort by
   * @param sortOrder - Sort order (ASC/DESC)
   * @param limit - Number of records per page
   * @param offset - Offset for pagination
   * @param search - Search term
   * @returns Promise with query results
   */
  async executeQueries(
    schemaName: string,
    filterConditions: string,
    searchCondition: string,
    sortBy: string,
    sortOrder: string,
    resource_rid: string,
    limit: number,
    offset: number,
    search: string,
    account_rid: string
  ) {
    try {
      const sequelize = await this.getDbConnection(schemaName);

      //Build the base query without sorting or pagination
      let query = `
        SELECT rc.*,rc.r_number as r_number, r.resource_name, r.resource_orgname, r.resource_designation, r.resource_role, ad.account_name, ad.account_rid,
        TO_CHAR(rc.effective_from, 'YYYY-MM-DD') as effective_from,
        TO_CHAR(rc.end_date, 'YYYY-MM-DD') as end_date
        FROM "${schemaName}"."resource_cost" rc
        INNER JOIN "${schemaName}"."resources" r ON rc.resource_rid = r.rid
        INNER JOIN "${schemaName}"."account_details" ad ON r.account_rid = ad.account_rid
        WHERE 1=1 AND rc.account_rid = :account_rid AND rc.resource_rid = :resource_rid
        ${filterConditions}
        ${searchCondition}
      `;

      // Count query to get total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM "${schemaName}"."resource_cost" rc
        INNER JOIN "${schemaName}"."resources" r ON rc.resource_rid = r.rid
        INNER JOIN "${schemaName}"."account_details" ad ON r.account_rid = ad.account_rid
        WHERE 1=1 AND rc.account_rid = :account_rid AND rc.resource_rid = :resource_rid
        ${filterConditions}
        ${searchCondition}
      `;

      const replacements = {
        limit,
        offset,
        searchTerm: search ? `%${search}%` : null,
        account_rid,
        resource_rid,
      };

      // Execute count query first
      const countResult = await sequelize.query(countQuery, {
        replacements,
        type: "SELECT",
        plain: true,
      });

      // Execute main query without sorting
      let results = await sequelize.query(query, {
        replacements,
        type: "SELECT",
      });

      const mainDbSequelize = await initMainDbSequelize();

      // For each result where currency_rid is empty/null, fetch and assign currency_rid from account
      await Promise.all(results.map(result => this.assignCurrencyRid(result, mainDbSequelize)));

      // If sorting by currency_code, we need to fetch currency info first
      if (sortBy === "currency") {
        // Get all currency RIDs from results
        const currencyIds = [
          ...new Set(results.map((rc: any) => rc.currency_rid)),
        ].filter(Boolean);

        if (currencyIds.length > 0) {
          // Fetch currency info from main database
          const currencies = await mainDbSequelize.query(
            `
            SELECT rid, currency_code 
            FROM public.currency 
            WHERE rid IN (:currencyIds)
          `,
            {
              replacements: { currencyIds },
              type: "SELECT",
            }
          );

          // Create currency map
          const currencyMap = currencies.reduce((map: any, curr: any) => {
            map[curr.rid] = curr.currency_code || "";
            return map;
          }, {});

          // Add currency_code to each resource cost
          results.forEach((rc: any) => {
            rc.currency_code = rc.currency_rid
              ? (currencyMap as any)[rc.currency_rid]
              : "";
          });

          // Sort in memory
          results.sort((a: any, b: any) => {
            const aCode = a.currency_code || "";
            const bCode = b.currency_code || "";
            return sortOrder === "ASC"
              ? aCode.localeCompare(bCode)
              : bCode.localeCompare(aCode);
          });
        }
      } else {
        if(sortBy === "account_name"){
          query += ` ORDER BY ad."${sortBy}" ${sortOrder} LIMIT :limit OFFSET :offset`;
        }
        else if(sortBy === "resource_name" || sortBy === "resource_orgname" || sortBy === "resource_designation" || sortBy === "resource_role"){
          query += ` ORDER BY r."${sortBy}" ${sortOrder} LIMIT :limit OFFSET :offset`;
        }
        else{
        query += ` ORDER BY rc."${sortBy}" ${sortOrder} LIMIT :limit OFFSET :offset`;
        }
        results = await sequelize.query(query, {
          replacements,
          type: "SELECT",
        });

        // For each result where currency_rid is empty/null, fetch and assign currency_rid from account
        await Promise.all(results.map(result => this.assignCurrencyRid(result, mainDbSequelize)));
      }

      // Apply pagination if sorting was done in memory
      if (sortBy === "currency") {
        results = results.slice(offset, offset + limit) as any;
      }

      const resourceCost = results;
      const totalCount = countResult ? (countResult as any).total : 0;

      // Extract all unique currency_rid values
      const currencyIds = [
        ...new Set(resourceCost.map((rc: any) => rc.currency_rid)),
      ].filter(Boolean);

      if (currencyIds.length > 0) {
        // Use raw query to fetch currency information
        const currencyQuery = `
            SELECT rid, currency_code, currency_name, currency_symbol 
            FROM public.currency 
            WHERE rid IN (:currencyIds)
          `;

        const currencies = await mainDbSequelize.query(currencyQuery, {
          replacements: { currencyIds },
          type: "SELECT",
        });

        // Create a map for quick lookup
        const currencyMap: any = currencies.reduce((map: any, curr: any) => {
          map[curr.rid] = curr;
          return map;
        }, {});

        // Add currency info to each resource cost
        resourceCost.forEach((rc: any) => {
          if (rc.currency_rid && currencyMap[rc.currency_rid]) {
            rc.currency_code = currencyMap[rc.currency_rid].currency_code;
            rc.currency_name = currencyMap[rc.currency_rid].currency_name;
            rc.currency_symbol = currencyMap[rc.currency_rid].currency_symbol;
          } else {
            rc.currency = null;
          }
        });
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceCost: resourceCost,
          count: parseInt(totalCount, 10),
        },
      };
    } catch (error) {
      console.error("Error executing queries:", error);
      return this.createErrorResponse("Error executing database queries");
    }
  }

  /**
   * Executes the main and count queries and formats the response
   *
   * @param schemaName - The schema name
   * @param filterConditions - SQL filter conditions
   * @param searchCondition - SQL search condition
   * @param sortBy - Field to sort by
   * @param sortOrder - Sort order (ASC/DESC)
   * @param search - Search term
   * @returns Promise with query results
   */
  async exportresourceCostDetails(
    schemaName: string,
    filterConditions: string,
    searchCondition: string,
    sortBy: string,
    sortOrder: string,
    resource_rid: string,
    search: string,
    account_rid: string
  ) {
    try {
      const sequelize = await this.getDbConnection(schemaName);

      //Build the base query without sorting or pagination
      let query = `
        SELECT rc.*,rc.r_number as r_number, r.resource_name, r.resource_orgname, r.resource_designation, r.resource_role, ad.account_name, ad.account_rid,
        TO_CHAR(rc.effective_date, 'YYYY-MM-DD') as effective_from,
        TO_CHAR(rc.end_date, 'YYYY-MM-DD') as end_date
        FROM "${schemaName}"."resource_cost" rc
        INNER JOIN "${schemaName}"."resources" r ON rc.resource_rid = r.rid
        INNER JOIN "${schemaName}"."account_details" ad ON r.account_rid = ad.account_rid
        WHERE 1=1 AND rc.account_rid = :account_rid AND rc.resource_rid = :resource_rid
        ${filterConditions}
        ${searchCondition}
      `;

      const replacements = {
        searchTerm: search ? `%${search}%` : null,
        account_rid,
        resource_rid,
      };

      // Execute main query without sorting
      let results = await sequelize.query(query, {
        replacements,
        type: "SELECT",
      });

      const mainDbSequelize = await initMainDbSequelize();

      await Promise.all(results.map(result => this.assignCurrencyRid(result, mainDbSequelize)));

      // If sorting by currency_code, we need to fetch currency info first
      if (sortBy === "currency") {
        // Get all currency RIDs from results
        const currencyIds = [
          ...new Set(results.map((rc: any) => rc.currency_rid)),
        ].filter(Boolean);

        if (currencyIds.length > 0) {
          // Fetch currency info from main database
          const currencies = await mainDbSequelize.query(
            `
            SELECT rid, currency_code 
            FROM public.currency 
            WHERE rid IN (:currencyIds)
          `,
            {
              replacements: { currencyIds },
              type: "SELECT",
            }
          );

          // Create currency map
          const currencyMap = currencies.reduce((map: any, curr: any) => {
            map[curr.rid] = curr.currency_code || "";
            return map;
          }, {});

          // Add currency_code to each resource cost
          results.forEach((rc: any) => {
            rc.currency_code = rc.currency_rid
              ? (currencyMap as any)[rc.currency_rid]
              : "";
          });

          // Sort in memory
          results.sort((a: any, b: any) => {
            const aCode = a.currency_code || "";
            const bCode = b.currency_code || "";
            return sortOrder === "ASC"
              ? aCode.localeCompare(bCode)
              : bCode.localeCompare(aCode);
          });
        }
      } else {
        if(sortBy === "account_name"){
          query += ` ORDER BY ad."${sortBy}" ${sortOrder}`;
        }
        else if(sortBy === "resource_name" || sortBy === "resource_orgname" || sortBy === "resource_designation" || sortBy === "resource_role"){
          query += ` ORDER BY r."${sortBy}" ${sortOrder}`;
        }
        else{
          query += ` ORDER BY rc."${sortBy}" ${sortOrder}`;
        }
        results = await sequelize.query(query, {
          replacements,
          type: "SELECT",
        });

        await Promise.all(results.map(result => this.assignCurrencyRid(result, mainDbSequelize)));
      }

      const resourceCost = results;

      // Extract all unique currency_rid values
      const currencyIds = [
        ...new Set(resourceCost.map((rc: any) => rc.currency_rid)),
      ].filter(Boolean);

      if (currencyIds.length > 0) {
        // Use raw query to fetch currency information
        const currencyQuery = `
            SELECT rid, currency_code, currency_name, currency_symbol 
            FROM public.currency 
            WHERE rid IN (:currencyIds)
          `;

        const currencies = await mainDbSequelize.query(currencyQuery, {
          replacements: { currencyIds },
          type: "SELECT",
        });

        // Create a map for quick lookup
        const currencyMap: any = currencies.reduce((map: any, curr: any) => {
          map[curr.rid] = curr;
          return map;
        }, {});

        // Add currency info to each resource cost
        resourceCost.forEach((rc: any) => {
          if (rc.currency_rid && currencyMap[rc.currency_rid]) {
            rc.currency_code = currencyMap[rc.currency_rid].currency_code;
            rc.currency_name = currencyMap[rc.currency_rid].currency_name;
            rc.currency_symbol = currencyMap[rc.currency_rid].currency_symbol;
          } else {
            rc.currency = null;
          }
        });
      }

      const formatNumberForExport = (value: any, currency_symbol: string): string => {
        if (value == null || value === '') return '-';
        const num = Number(value);
        if (isNaN(num)) return '-';
        // Use currency.js to format the number with the provided currency symbol
        return currency(num, {
          symbol: currency_symbol? currency_symbol : '$',
          precision: 2,
          pattern: '! #',
          separator: ',',
          decimal: '.'
        }).format();
      };
      const rawResult = resourceCost || [];
      let exportData = rawResult.map((resource: any) => {
        return {
          "Account Name": resource.account_name || "-",
          "Resource Code": resource.resource_code || "-",
          "Fiscal Year": resource.fiscal_year || "-",
          "Name": resource.resource_name || "-",
          "Resource Type": resource.resource_type || "-",
          "Effective From": resource.effective_date || "-",
          "End Date": resource.end_date || "-",
          "Currency": resource.currency_code || "USD",
          "Effort In Hours": resource.effort_in_hrs || "-",
          "Salary": formatNumberForExport(resource.salary , resource.currency_symbol) || "-",
          "Bonus": formatNumberForExport(resource.bonus , resource.currency_symbol) || "-",
          "Insurance": formatNumberForExport(resource.insurance , resource.currency_symbol) || "-",
          "Deductions": formatNumberForExport(resource.deductions , resource.currency_symbol) || "-",
          "Cost": formatNumberForExport(resource.resource_cost , resource.currency_symbol) || "-",
          "Org Name": resource.resource_orgname || "-",
          "Designation": resource.resource_designation || "-",
          "Role": resource.resource_role || "-",
          "Comments": resource.comments || "-",
          "Status": resource.status.toLowerCase() === "active" ? "Active" 
          : resource.status.toLowerCase() === "anomaly" ? "Anomaly" 
          : resource.status.toLowerCase() === "duplicate" ? "Duplicate" 
          : "Inactive" || "-",
          "Cost ID": resource.r_number || "-",
          // "Annual Compensation": formatNumberForExport(resource.annual_cost , resource.currency_symbol) || "-",
          // "Monthly Compensation": formatNumberForExport(resource.monthly_cost, resource.currency_symbol) || "-",
          // "Bi-Weekly Compensation": formatNumberForExport(resource.bi_weekly_cost, resource.currency_symbol) || "-",
          // "Weekly Compensation": formatNumberForExport(resource.weekly_cost, resource.currency_symbol) || "-",
          // "Daily Compensation": formatNumberForExport(resource.daily_cost, resource.currency_symbol) || "-",
          // "Hourly Compensation": formatNumberForExport(resource.hourly_cost, resource.currency_symbol) || "-",
          // "Semi Annual": resource.semi_annual_cost,
        };
      });

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceCost: exportData,
        },
      };
    } catch (error) {
      console.error("Error executing queries:", error);
      return this.createErrorResponse("Error executing database queries");
    }
  }

  /**
   * Builds SQL search condition for resource cost queries
   *
   * @param search - The search term
   * @returns SQL fragment for search condition
   */
  buildSearchCondition(search: string): string {
    if (!search) return "";

    return `
      AND (
        rc.r_number ILIKE :searchTerm 
        OR r.resource_full_name ILIKE :searchTerm
      )
    `;
  }

  /**
   * Builds filter conditions including fiscal year filter
   *
   * @param filters - The filters object
   * @param fiscalYear - The fiscal year to filter by
   * @returns SQL fragment for filter conditions
   */
  buildFilterConditions(
    filters: Record<string, any>,
    fiscalYear: number
  ): string {
    let filterConditions = "";

    if (filters && Object.keys(filters).length > 0) {
      filterConditions = this.processFiltersForRawQuery(filters);
    }

    if (fiscalYear === 0 || fiscalYear === undefined) {
      return filterConditions;
    }

    const fiscalYearCondition = `
      AND rc.fiscal_year = ${fiscalYear}`;

    // Add fiscal year condition to filter conditions
    filterConditions += fiscalYearCondition;

    return filterConditions;
  }

  /**
   * Creates an error response with the specified message
   *
   * @param errorMessage - The error message to include
   * @returns Error response object
   */
  createErrorResponse(errorMessage: string) {
    return {
      statusCode: HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage,
    };
  }

  /**
   * Determines the appropriate sort parameters for resource skill queries.
   * Validates the sort column and ensures the sort order is either ASC or DESC.
   * Falls back to default values if invalid parameters are provided.
   *
   * @param sortBy - Field to sort results by
   * @param sortOrder - Direction to sort (ASC or DESC)
   * @returns Tuple containing validated sort column and order
   */
  getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "resource_cost_number",
      "effective_from",
      "end_date",
      // "annual_cost",
      // "semi_annual_cost",
      // "monthly_cost",
      // "weekly_cost",
      // "bi_weekly_cost",
      // "daily_cost",
      // "hourly_cost",
      "salary",
      "deductions",
      "insurance",
      "bonus",
      "resource_cost",
      "net_resource_cost",
      "effort_in_hrs",
      "currency",
      "account_name",
      "resource_name",
      "fiscal_year",
      "resource_type",
      "resource_code",
      "resource_orgname",
      "resource_role",
      "resource_designation",
      "comments",
    ];
    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    if (sortBy === "resource_cost_number") {
      sortBy = "r_number";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  // Include the rest of your filter processing methods here...
  processFiltersForRawQuery(filters: Record<string, any>): string {
    // Your existing implementation
    let filterConditions = "";

    // Define field types for proper filter handling
    const alphanumericFields = ["status","resource_code"];
    const numericFields = [
      // "annual",
      // "monthly",
      // "weekly",
      // "daily",
      // "hourly",
      // "bi_weekly",
      "fiscal_year",
      "effort_in_hrs",
      "salary",
      "bonus",
      "insurance",
      "deductions",
      "resource_cost",
      "net_resource_cost"
      // "semi_annual",
    ];
    const dateFields = ["effective_from", "end_date"];
    const specialFields = ["resource_cost_number"];

    // Process each filter
    Object.entries(filters).forEach(([key, value]) => {
      // Skip special fields that have custom handling
      if (specialFields.includes(key)) {
        return;
      }

      // Handle different filter types based on field type
      if (typeof value === "object") {
        if (alphanumericFields.includes(key)) {
          filterConditions += this.processAlphanumericFilter(key, value);
        } else if (numericFields.includes(key)) {
          filterConditions += this.processNumericFilter(key, value);
        } else if (dateFields.includes(key)) {
          filterConditions += this.processDateFilter(key, value);
        } else {
          filterConditions += this.processDefaultFilter(key, value);
        }
      } else if (value !== undefined && value !== null) {
        // Simple equality
        filterConditions += this.processSimpleEqualityFilter(key, value);
      }
    });

    // Special handling for resource number which might be in the resources table
    if (filters.resource_cost_number) {
      filterConditions += this.processResourceCostNumberFilter(
        filters.resource_cost_number
      );
    }

    return filterConditions;
  }

  processAlphanumericFilter(key: string, value: any): string {
    let condition = "";

    if (value.equals) {
      condition += ` AND LOWER(rc."${key}") = LOWER('${value.equals}')`;
    } else if (value.not_equals) {
      condition += ` AND LOWER(rc."${key}") != LOWER('${value.not_equals}') OR rc."${key}" IS NULL`;
    } else if (value.contains) {
      condition += ` AND LOWER(rc."${key}") LIKE LOWER('%${value.contains}%')`;
    } else if (value.not_contains) {
      condition += ` AND LOWER(rc."${key}") NOT LIKE LOWER('%${value.not_contains}%')`;
    } else if (value.starts_with) {
      condition += ` AND LOWER(rc."${key}") LIKE LOWER('${value.starts_with}%')`;
    } else if (value.ends_with) {
      condition += ` AND LOWER(rc."${key}") LIKE LOWER('%${value.ends_with}')`;
    } else if (value.is_empty !== undefined) {
      if (value.is_empty) {
        condition += ` AND (rc."${key}" IS NULL OR rc."${key}" = '')`;
      }
    } else if (value.is_not_empty !== undefined) {
      if (value.is_not_empty) {
        condition += ` AND rc."${key}" IS NOT NULL AND rc."${key}" != ''`;
      }
    } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
      const values = value.in
        .map((item: string) => `'${item.toLowerCase()}'`)
        .join(",");
      condition += ` AND LOWER(rc."${key}") IN (${values})`;
    } else if (
      value.not_in &&
      Array.isArray(value.not_in) &&
      value.not_in.length > 0
    ) {
      const values = value.not_in
        .map((item: string) => `'${item.toLowerCase()}'`)
        .join(",");
      condition += ` AND LOWER(rc."${key}") NOT IN (${values})`;
    }

    return condition;
  }

  processNumericFilter(key: string, value: any): string {
    // Your existing implementation
    let condition = "";
    // if(key === "fiscal_year") {
    //   key = "fiscal_year";
    // }
    // else if(key === "effort_in_hrs") {
    //   key = "effort_in_hrs";
    // }
    // else if(key === "bonus") {
    //   key = "bonus";
    // }
    // else {
    //   key = `${key}_cost`;
    // }
    if (value.equals !== undefined) {
      condition += ` AND rc."${key}" = ${value.equals}`;
    } else if (value.not_equals !== undefined) {
      condition += ` AND rc."${key}" != ${value.not_equals} OR rc."${key}" IS NULL`;
    } else if (value.greater_than !== undefined) {
      condition += ` AND rc."${key}" > ${value.greater_than}`;
    } else if (value.less_than !== undefined) {
      condition += ` AND rc."${key}" < ${value.less_than}`;
    } else if (
      value.between &&
      Array.isArray(value.between) &&
      value.between.length === 2
    ) {
      condition += ` AND rc."${key}" BETWEEN ${value.between[0]} AND ${value.between[1]}`;
    } else if (value.is_empty !== undefined) {
      if (value.is_empty) {
        condition += ` AND rc."${key}" IS NULL`;
      }
    } else if (value.is_not_empty !== undefined) {
      if (value.is_not_empty) {
        condition += ` AND rc."${key}" IS NOT NULL`;
      }
    } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
      const values = value.in.join(",");
      condition += ` AND rc."${key}" IN (${values})`;
    } else if (
      value.not_in &&
      Array.isArray(value.not_in) &&
      value.not_in.length > 0
    ) {
      const values = value.not_in.join(",");
      condition += ` AND rc."${key}" NOT IN (${values})`;
    }

    return condition;
  }

  processDateFilter(key: string, value: any): string {
    // Your existing implementation
    let condition = "";

    if (value.equals) {
      condition += ` AND rc."${key}"::date = '${value.equals}'::date`;
    } else if (value.not_equals) {
      condition += ` AND rc."${key}"::date != '${value.not_equals}'::date OR rc."${key}" IS NULL`;
    } else if (value.before) {
      condition += ` AND rc."${key}" < '${value.before}'`;
    } else if (value.after) {
      condition += ` AND rc."${key}" > '${value.after}'`;
    } else if (
      value.between &&
      Array.isArray(value.between) &&
      value.between.length === 2
    ) {
      condition += ` AND rc."${key}" BETWEEN '${value.between[0]}' AND '${value.between[1]}'`;
    } else if (value.this_week) {
      condition += ` AND rc."${key}" BETWEEN 
        date_trunc('week', CURRENT_DATE) AND 
        (date_trunc('week', CURRENT_DATE) + interval '6 days')`;
    } else if (value.this_month) {
      condition += ` AND rc."${key}" BETWEEN 
        date_trunc('month', CURRENT_DATE) AND 
        (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')`;
    } else if (value.this_quarter) {
      condition += ` AND rc."${key}" BETWEEN 
        date_trunc('quarter', CURRENT_DATE) AND 
        (date_trunc('quarter', CURRENT_DATE) + interval '3 months - 1 day')`;
    } else if (value.last_7_days) {
      condition += ` AND rc."${key}" BETWEEN 
        (CURRENT_DATE - interval '7 days') AND CURRENT_DATE`;
    } else if (value.last_30_days) {
      condition += ` AND rc."${key}" BETWEEN 
        (CURRENT_DATE - interval '30 days') AND CURRENT_DATE`;
    } else if (value.is_empty !== undefined) {
      if (value.is_empty) {
        condition += ` AND rc."${key}" IS NULL`;
      }
    } else if (value.is_not_empty !== undefined) {
      if (value.is_not_empty) {
        condition += ` AND rc."${key}" IS NOT NULL`;
      }
    }

    return condition;
  }

  processDefaultFilter(key: string, value: any): string {
    let tableAlias = "rc";

  // Set alias based on key
  const aliasMapR = ["resource_name", "resource_orgname", "resource_designation", "resource_role"];
  const aliasMapAD = ["account_name"];

  if (aliasMapR.includes(key)) {
    tableAlias = "r";
  } else if (aliasMapAD.includes(key)) {
    tableAlias = "ad";
  }
    let condition = "";
    const isUuidField = key.toLowerCase().includes("rid");

    if (value.equals !== undefined) {
      if (typeof value.equals === "string") {
        if (isUuidField) {
          condition += ` AND ${tableAlias}."${key}" = '${value.equals}'`;
        } else {
          condition += ` AND LOWER(${tableAlias}."${key}") = LOWER('${value.equals}')`;
        }
      } else {
        condition += ` AND ${tableAlias}."${key}" = ${value.equals}`;
      }
    } else if (value.not_equals !== undefined) {
      if (typeof value.not_equals === "string") {
        if (isUuidField) {
          condition += ` AND ${tableAlias}."${key}" != '${value.not_equals}' OR ${tableAlias}."${key}" IS NULL`;
        } else {
          condition += ` AND LOWER(${tableAlias}."${key}") != LOWER('${value.not_equals}') OR ${tableAlias}."${key}" IS NULL`;
        }
      } else {
        condition += ` AND ${tableAlias}."${key}" != ${value.not_equals} OR ${tableAlias}."${key}" IS NULL`;
      }
    } else if (value.contains !== undefined) {
      condition += ` AND LOWER(${tableAlias}."${key}") LIKE LOWER('%${value.contains}%')`;
    } else if (value.not_contains !== undefined) {
      condition += ` AND LOWER(${tableAlias}."${key}") NOT LIKE LOWER('%${value.not_contains}%')`;
    } else if (value.is_empty !== undefined) {
      if (value.is_empty) {
        if (isUuidField) {
          condition += ` AND ${tableAlias}."${key}" IS NULL`;
        } else {
          condition += ` AND (${tableAlias}."${key}" IS NULL OR ${tableAlias}."${key}" = '')`;
        }
      }
    } else if (value.is_not_empty !== undefined) {
      if (value.is_not_empty) {
        if (isUuidField) {
          condition += ` AND ${tableAlias}."${key}" IS NOT NULL`;
        } else {
          condition += ` AND ${tableAlias}."${key}" IS NOT NULL AND ${tableAlias}."${key}" != ''`;
        }
      }
    } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
      if (typeof value.in[0] === "string") {
        if (isUuidField) {
          const values = value.in.map((item: string) => `'${item}'`).join(",");
          condition += ` AND ${tableAlias}."${key}" IN (${values})`;
        } else {
          const values = value.in
            .map((item: string) => `LOWER('${item}')`)
            .join(",");
          condition += ` AND LOWER(${tableAlias}."${key}") IN (${values})`;
        }
      } else {
        const values = value.in.join(",");
        condition += ` AND ${tableAlias}."${key}" IN (${values})`;
      }
    } else if (
      value.not_in &&
      Array.isArray(value.not_in) &&
      value.not_in.length > 0
    ) {
      if (typeof value.not_in[0] === "string") {
        if (isUuidField) {
          const values = value.not_in
            .map((item: string) => `'${item}'`)
            .join(",");
          condition += ` AND ${tableAlias}."${key}" NOT IN (${values})`;
        } else {
          const values = value.not_in
            .map((item: string) => `LOWER('${item}')`)
            .join(",");
          condition += ` AND LOWER(${tableAlias}."${key}") NOT IN (${values})`;
        }
      } else {
        const values = value.not_in.join(",");
        condition += ` AND ${tableAlias}."${key}" NOT IN (${values})`;
      }
    }

    return condition;
  }

  processSimpleEqualityFilter(key: string, value: any): string {
    // Your existing implementation
    if (typeof value === "string") {
      return ` AND LOWER(rc."${key}") = LOWER('${value}')`;
    } else {
      return ` AND rc."${key}" = ${value}`;
    }
  }

  processResourceCostNumberFilter(resourceCostNumber: any): string {
    let condition = "";

    if (typeof resourceCostNumber === "object") {
      if (resourceCostNumber.equals) {
        condition += ` AND LOWER(rc."r_number") = LOWER('${resourceCostNumber.equals}')`;
      } else if (resourceCostNumber.not_equals) {
        condition += ` AND LOWER(rc."r_number") != LOWER('${resourceCostNumber.not_equals}') OR rc."r_number" IS NULL`;
      } else if (resourceCostNumber.contains) {
        condition += ` AND LOWER(rc."r_number") LIKE LOWER('%${resourceCostNumber.contains}%')`;
      } else if (resourceCostNumber.not_contains) {
        condition += ` AND LOWER(rc."r_number") NOT LIKE LOWER('%${resourceCostNumber.not_contains}%')`;
      } else if (resourceCostNumber.starts_with) {
        condition += ` AND LOWER(rc."r_number") LIKE LOWER('${resourceCostNumber.starts_with}%')`;
      } else if (resourceCostNumber.ends_with) {
        condition += ` AND LOWER(rc."r_number") LIKE LOWER('%${resourceCostNumber.ends_with}')`;
      } else if (resourceCostNumber.is_empty !== undefined) {
        if (resourceCostNumber.is_empty) {
          condition += ` AND (rc."r_number" IS NULL OR rc."r_number" = '')`;
        }
      } else if (resourceCostNumber.is_not_empty !== undefined) {
        if (resourceCostNumber.is_not_empty) {
          condition += ` AND (rc."r_number" IS NOT NULL AND rc."r_number" != '')`;
        }
      } else if (
        resourceCostNumber.in &&
        Array.isArray(resourceCostNumber.in) &&
        resourceCostNumber.in.length > 0
      ) {
        const values = resourceCostNumber.in
          .map((item: string) => `'${item.toLowerCase()}'`)
          .join(",");
        condition += ` AND LOWER(rc."r_number") IN (${values})`;
      } else if (
        resourceCostNumber.not_in &&
        Array.isArray(resourceCostNumber.not_in) &&
        resourceCostNumber.not_in.length > 0
      ) {
        const values = resourceCostNumber.not_in
          .map((item: string) => `'${item.toLowerCase()}'`)
          .join(",");
        condition += ` AND LOWER(rc."r_number") NOT IN (${values})`;
      }
    } else if (resourceCostNumber) {
      condition += ` AND LOWER(rc."r_number") = LOWER('${resourceCostNumber}')`;
    }

    return condition;
  }

  async getCurrencyRidByAccountRidRaw(accountRid: string): Promise<string | null> {
    const query = `SELECT a.currency_rid FROM public.account a WHERE a.rid = :accountRid`;
    try {
      const mainDb = await initMainDbSequelize();
      const result = await mainDb.query(query, {
        replacements: { accountRid },
        type: 'SELECT'
      });
      return result?(result[0] as any).currency_rid : null;
    } catch (err) {
      console.error('Error getting currency symbol:', err);
      return null;
    }
  }

  async assignCurrencyRid(result: any, mainDbSequelize: any) {
    if (!result.currency_rid) {
      const currencyRid = await this.getCurrencyRidByAccountRidRaw(result.account_rid);
      if (currencyRid) {
        result.currency_rid = currencyRid;
      } else {
        try {
          const usdCurrencyId = await mainDbSequelize.query(
            `SELECT c.rid FROM public.currency c WHERE c.currency_code = 'USD'`,
            { type: 'SELECT' }
          );
          result.currency_rid = usdCurrencyId[0]?.rid;
        } catch (err) {
          console.error('Error getting USD currency rid:', err);
        }
      }
    }
  }
  
}

export default new ResourceCostSchemaService();
