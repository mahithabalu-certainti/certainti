import { Sequelize } from "sequelize";
import { ResourceCost } from "../models/resourceCost";
import { ResourceCostTimeline } from "../models/resourceCostTimeline";
import { ResourceCostHistory } from "../models/resourceCostHistory";
import { Resources } from "../models/resource";
import { initOrgSequelize } from "../config/orgDataSource";
import { initMainDbSequelize } from "../config/mainDataSource";
import { HttpStatus } from "../utils/constants";
import { ResourceFiscal } from "../models/resourceFiscal";

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
        ResourceCost.initialize(sequelize);
        ResourceCostTimeline.initialize(sequelize,schemaName);
        ResourceCostHistory.initialize(sequelize);

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
    // Initialize variables to hold different filter operations
    let currencyValue = null;
    let operation = "contains"; // Default operation
    let isEmpty = null;
    let isNotEmpty = null;

    // Extract filter values based on the filter structure
    if (typeof filters.currency === "object") {
      // Handle different operations
      if (filters.currency.equals !== undefined) {
        currencyValue = filters.currency.equals;
        operation = "equals";
      } else if (filters.currency.not_equals !== undefined) {
        currencyValue = filters.currency.not_equals;
        operation = "not_equals";
      } else if (filters.currency.contains !== undefined) {
        currencyValue = filters.currency.contains;
        operation = "contains";
      } else if (filters.currency.not_contains !== undefined) {
        currencyValue = filters.currency.not_contains;
        operation = "not_contains";
      } else if (filters.currency.starts_with !== undefined) {
        currencyValue = filters.currency.starts_with;
        operation = "starts_with";
      } else if (filters.currency.ends_with !== undefined) {
        currencyValue = filters.currency.ends_with;
        operation = "ends_with";
      } else if (filters.currency.is_empty !== undefined) {
        isEmpty = filters.currency.is_empty;
        operation = "is_empty";
      } else if (filters.currency.is_not_empty !== undefined) {
        isNotEmpty = filters.currency.is_not_empty;
        operation = "is_not_empty";
      }
    } else {
      // Simple string value - treat as 'contains'
      currencyValue = filters.currency;
    }

    // Handle isEmpty/isNotEmpty separately
    if (operation === "is_empty") {
      delete filters.currency;

      if (isEmpty) {
        // Is Empty
        filters.currency_rid = {
          is_empty: true,
        };
      } else if (isNotEmpty) {
        // Is Not Empty
        filters.currency_rid = {
          is_not_empty: true,
        };
      }
      return null;
    }

    // For other operations, we need to query the database
    if (currencyValue) {
      const mainDbSequelize = await initMainDbSequelize();
      if (!mainDbSequelize) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Main database connection not available",
        };
      }

      // Build the query based on the operation
      let currencyQuery = `SELECT rid FROM "public"."currency" WHERE `;

      switch (operation) {
        case "equals":
          currencyQuery += `LOWER(currency_code) = LOWER(:currencyValue) OR LOWER(currency_name) = LOWER(:currencyValue)`;
          break;
        case "not_equals":
          currencyQuery += `LOWER(currency_code) != LOWER(:currencyValue) OR LOWER(currency_name) != LOWER(:currencyValue)`;
          break;
        case "contains":
          currencyQuery += `LOWER(currency_code) LIKE LOWER(:likeValue) OR LOWER(currency_name) LIKE LOWER(:likeValue)`;
          break;
        case "not_contains":
          currencyQuery += `LOWER(currency_code) NOT LIKE LOWER(:likeValue) AND LOWER(currency_name) NOT LIKE LOWER(:likeValue)`;
          break;
        case "starts_with":
          currencyQuery += `LOWER(currency_code) LIKE LOWER(:startsWithValue) OR LOWER(currency_name) LIKE LOWER(:startsWithValue)`;
          break;
        case "ends_with":
          currencyQuery += `LOWER(currency_code) LIKE LOWER(:endsWithValue) OR LOWER(currency_name) LIKE LOWER(:endsWithValue)`;
          break;
      }

      // Prepare replacements based on the operation
      const replacements: any = {
        currencyValue: currencyValue,
      };

      if (operation === "contains" || operation === "not_contains") {
        replacements.likeValue = `%${currencyValue}%`;
      } else if (operation === "starts_with") {
        replacements.startsWithValue = `${currencyValue}%`;
      } else if (operation === "ends_with") {
        replacements.endsWithValue = `%${currencyValue}`;
      }

      // Execute the query
      const currencyResults = await mainDbSequelize.query(currencyQuery, {
        replacements: replacements,
        type: "SELECT",
      });

      // Extract the RIDs from the results
      const currencyRids = currencyResults.map((result: any) => result.rid);

      // If we found matching currencies, add them to the filters
      if (currencyRids.length > 0) {
        // Remove the original currency filter
        delete filters.currency;

        filters.currency_rid = {
          in: currencyRids,
        };

        return null;
      } else {
        // For 'not' operations, if no matches found, we should include all records
        if (operation === "not_equals" || operation === "not_contains") {
          delete filters.currency;
          return null;
        }

        // For other operations, if no matches found, return empty result
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            resourceCost: [],
            count: 0,
          },
        };
      }
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
    limit: number,
    offset: number,
    search: string
  ) {
    try {
      const sequelize = await this.getDbConnection(schemaName);

      // Build the query to get data from the account-specific schema
      const query = `
        SELECT rc.*,rc.r_number as r_number, r.r_number as resourceNumber, r.resource_fullname
        FROM "${schemaName}"."resource_cost" rc
        INNER JOIN "${schemaName}"."resources" r ON rc.resource_rid = r.rid
        WHERE 1=1
        ${filterConditions}
        ${searchCondition}
        ORDER BY rc."${sortBy}" ${sortOrder}
        LIMIT :limit OFFSET :offset
      `;

      // Count query to get total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM "${schemaName}"."resource_cost" rc
        INNER JOIN "${schemaName}"."resources" r ON rc.resource_rid = r.rid
        WHERE 1=1
        ${filterConditions}
        ${searchCondition}
      `;

      const replacements = {
        limit,
        offset,
        searchTerm: search ? `%${search}%` : null,
      };

      // Execute the queries
      const [results, countResult] = await Promise.all([
        sequelize.query(query, {
          replacements,
          type: "SELECT",
        }),
        sequelize.query(countQuery, {
          replacements,
          type: "SELECT",
          plain: true,
        }),
      ]);

      const resourceCost = results;
      const totalCount = countResult ? (countResult as any).total : 0;

            
        // Extract all unique currency_rid values
        const currencyIds = [...new Set(resourceCost.map((rc: any) => rc.currency_rid))].filter(Boolean);
        
        if (currencyIds.length > 0) {
          // Use raw query to fetch currency information
          const currencyQuery = `
            SELECT rid, currency_code, currency_name, currency_symbol 
            FROM public.currency 
            WHERE rid IN (:currencyIds)
          `;
          
          const mainDbSequelize = await initMainDbSequelize();
          const currencies = await mainDbSequelize.query(currencyQuery, {
            replacements: { currencyIds },
            type: "SELECT"
          });
          
          // Create a map for quick lookup
          const currencyMap:any = currencies.reduce((map: any, curr: any) => {
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

  // ... rest of the methods from your original ResourceCostSchemaService ...

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

    const fiscalYearCondition = `
      AND r.fiscal_year = ${fiscalYear}`;

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
   * Determines the sort parameters to use
   *
   * @param sortBy - Field to sort by
   * @param sortOrder - Sort order (ASC/DESC)
   * @returns Tuple with final sort parameters
   */
  getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    // Default sort parameters
    let finalSortBy = "created_at";
    let finalSortOrder = "DESC";

    // Use provided sort parameters if valid
    if (sortBy) {
      finalSortBy = sortBy;
    }

    if (
      sortOrder &&
      (sortOrder.toUpperCase() === "ASC" || sortOrder.toUpperCase() === "DESC")
    ) {
      finalSortOrder = sortOrder.toUpperCase();
    }

    return [finalSortBy, finalSortOrder];
  }

  // Include the rest of your filter processing methods here...
  processFiltersForRawQuery(filters: Record<string, any>): string {
    // Your existing implementation
    let filterConditions = "";

    // Define field types for proper filter handling
    const alphanumericFields = ["currency_rid"];
    const numericFields = [
      "annual_cost",
      "monthly_cost",
      "weekly_cost",
      "daily_cost",
      "hourly_cost",
      "bi_weekly_cost",
      "semi_annual_cost",
    ];
    const dateFields = ["effective_date", "end_date"];
    const specialFields = ["resourceNumber"];

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
    if (filters.resourceNumber) {
      filterConditions += this.processResourceNumberFilter(
        filters.resourceNumber
      );
    }

    return filterConditions;
  }

  // Include your other filter processing methods here...
  processAlphanumericFilter(key: string, value: any): string {
    // Your existing implementation
    let condition = "";

    if (value.equals) {
      condition += ` AND rc."${key}" = '${value.equals}'`;
    } else if (value.not_equals) {
      condition += ` AND rc."${key}" != '${value.not_equals}'`;
    } else if (value.contains) {
      condition += ` AND rc."${key}" ILIKE '%${value.contains}%'`;
    } else if (value.not_contains) {
      condition += ` AND rc."${key}" NOT ILIKE '%${value.not_contains}%'`;
    } else if (value.starts_with) {
      condition += ` AND rc."${key}" ILIKE '${value.starts_with}%'`;
    } else if (value.ends_with) {
      condition += ` AND rc."${key}" ILIKE '%${value.ends_with}'`;
    } else if (value.is_empty !== undefined) {
      if (value.is_empty) {
        condition += ` AND (rc."${key}" IS NULL OR rc."${key}" = '')`;
      }
    } else if (value.is_not_empty !== undefined) {
      if (value.is_not_empty) {
        condition += ` AND rc."${key}" IS NOT NULL AND rc."${key}" != ''`;
      }
    } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
      const values = value.in.map((item: string) => `'${item}'`).join(",");
      condition += ` AND rc."${key}" IN (${values})`;
    } else if (
      value.not_in &&
      Array.isArray(value.not_in) &&
      value.not_in.length > 0
    ) {
      const values = value.not_in.map((item: string) => `'${item}'`).join(",");
      condition += ` AND rc."${key}" NOT IN (${values})`;
    }

    return condition;
  }

  processNumericFilter(key: string, value: any): string {
    // Your existing implementation
    let condition = "";

    if (value.equals !== undefined) {
      condition += ` AND rc."${key}" = ${value.equals}`;
    } else if (value.not_equals !== undefined) {
      condition += ` AND rc."${key}" != ${value.not_equals}`;
    } else if (value.greater_than !== undefined) {
      condition += ` AND rc."${key}" > ${value.greater_than}`;
    } else if (value.less_Than !== undefined) {
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
      condition += ` AND rc."${key}"::date != '${value.not_equals}'::date`;
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
    // Your existing implementation
    let condition = "";

    if (value.equals !== undefined) {
      if (typeof value.equals === "string") {
        condition += ` AND rc."${key}" = '${value.equals}'`;
      } else {
        condition += ` AND rc."${key}" = ${value.equals}`;
      }
    } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
      if (typeof value.in[0] === "string") {
        const values = value.in.map((item: string) => `'${item}'`).join(",");
        condition += ` AND rc."${key}" IN (${values})`;
      } else {
        const values = value.in.join(",");
        condition += ` AND rc."${key}" IN (${values})`;
      }
    } else if (
      value.not_in &&
      Array.isArray(value.not_in) &&
      value.not_in.length > 0
    ) {
      if (typeof value.not_in[0] === "string") {
        const values = value.not_in
          .map((item: string) => `'${item}'`)
          .join(",");
        condition += ` AND rc."${key}" NOT IN (${values})`;
      } else {
        const values = value.not_in.join(",");
        condition += ` AND rc."${key}" NOT IN (${values})`;
      }
    }

    return condition;
  }

  processSimpleEqualityFilter(key: string, value: any): string {
    // Your existing implementation
    if (typeof value === "string") {
      return ` AND rc."${key}" = '${value}'`;
    } else {
      return ` AND rc."${key}" = ${value}`;
    }
  }

  processResourceNumberFilter(resourceNumber: any): string {
    // Your existing implementation
    let condition = "";

    if (typeof resourceNumber === "object") {
      if (resourceNumber.equals) {
        condition += ` AND r."r_number" = '${resourceNumber.equals}'`;
      } else if (resourceNumber.not_equals) {
        condition += ` AND r."r_number" != '${resourceNumber.not_equals}'`;
      } else if (resourceNumber.contains) {
        condition += ` AND r."r_number" ILIKE '%${resourceNumber.contains}%'`;
      } else if (resourceNumber.not_contains) {
        condition += ` AND r."r_number" NOT ILIKE '%${resourceNumber.not_contains}%'`;
      } else if (resourceNumber.starts_with) {
        condition += ` AND r."r_number" ILIKE '${resourceNumber.starts_with}%'`;
      } else if (resourceNumber.ends_with) {
        condition += ` AND r."r_number" ILIKE '%${resourceNumber.ends_with}'`;
      } else if (resourceNumber.is_empty !== undefined) {
        if (resourceNumber.is_empty) {
          condition += ` AND (r."r_number" IS NULL OR r."r_number" = '')`;
        }
      } else if (resourceNumber.is_not_empty !== undefined) {
        if (resourceNumber.is_not_empty) {
          condition += ` AND (r."r_number" IS NOT NULL OR r."r_number" != '')`;
        }
      } else if (
        resourceNumber.in &&
        Array.isArray(resourceNumber.in) &&
        resourceNumber.in.length > 0
      ) {
        const values = resourceNumber.in
          .map((item: string) => `'${item}'`)
          .join(",");
        condition += ` AND r."r_number" IN (${values})`;
      } else if (
        resourceNumber.not_in &&
        Array.isArray(resourceNumber.not_in) &&
        resourceNumber.not_in.length > 0
      ) {
        const values = resourceNumber.not_in
          .map((item: string) => `'${item}'`)
          .join(",");
        condition += ` AND r."r_number" NOT IN (${values})`;
      }
    } else if (resourceNumber) {
      condition += ` AND r."r_number" = '${resourceNumber}'`;
    }

    return condition;
  }
}

export default new ResourceCostSchemaService();
