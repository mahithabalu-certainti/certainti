import { Sequelize } from "sequelize";
import { HttpStatus } from "../utils/constants";
import { initOrgSequelize } from "../config/orgDataSource";
import { Resources } from "../models/resource";
import { Skill } from "../models/skill";
import { ResourceSkill } from "../models/resourceSkill";
import { ResourceSkillTimeline } from "../models/resourceSkillTimeline";
import { ResourceSkillHistory } from "../models/resourceSkillHistory";
import { ResourceFiscal } from "../models/resourceFiscal";

class ResourceSkillSchemaService {
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
        ResourceFiscal.initialize(sequelize,schemaName);
        Skill.initialize(sequelize,schemaName);
        ResourceSkill.initialize(sequelize,schemaName);
        ResourceSkillTimeline.initialize(sequelize,schemaName);
        ResourceSkillHistory.initialize(sequelize,schemaName);

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
            case "skill":
              await sequelize.models.Skill.sync({
                force: false,
                schema: schemaName, // Explicitly set schema
              });
              break;
            case "resource_skill":
              await sequelize.models.ResourceSkill.sync({
                force: false,
                schema: schemaName, // Explicitly set schema
              });
              break;
            case "resource_skill_timeline":
              await sequelize.models.ResourceSkillTimeline.sync({
                force: false,
                schema: schemaName, // Explicitly set schema
              });
              break;
            case "resource_skill_history":
              await sequelize.models.ResourceSkillHistory.sync({
                force: false,
                schema: schemaName, // Explicitly set schema
              });
              break;
            case "resource_fiscal":  
              await sequelize.models.ResourceFiscal.sync({
                force: false,
                schema: schemaName, // Explicitly set schema
              });
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

    // If we're creating resource_skill, make sure resources table exists first
    if (tableName === "resource_skill") {
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

      // Then create the skill table
      const skillTableCreated = await this.createTablesInSchema(
        schemaName,
        "skill"
      );
      if (!skillTableCreated) {
        console.error(`Failed to create skill table in schema ${schemaName}`);
        return false;
      }
    }

    // Then create the requested table
    return await this.createTablesInSchema(schemaName, tableName);
  }

  /**
   * Executes the main and count queries and formats the response
   *
   * @param sequelize - The Sequelize instance
   * @param schemaName - The schema name
   * @param filterConditions - SQL filter conditions
   * @param searchCondition - SQL search condition
   * @param finalSortBy - Field to sort by
   * @param finalSortOrder - Sort order (ASC/DESC)
   * @param search - Search term
   * @returns Promise with query results
   */
  async exportResoucreSkill(
    schemaName: string,
    filterConditions: string,
    searchCondition: string,
    finalSortBy: string,
    finalSortOrder: string,
    resource_rid: string,
    search: string
  ) {
    const sequelize = await this.getDbConnection(schemaName);

    // Build the query to get data from the account-specific schema
    const query = `
      SELECT rs.*,
      TO_CHAR(rs.start_date, 'MM/DD/YYYY') as start_date,
       r.resource_fullname, s.skill_name, r.resource_role, r.resource_type, r.resource_status, r.fiscal_year
      FROM "${schemaName}"."resource_skill" rs
      INNER JOIN "${schemaName}"."resources" r ON rs.resource_rid = r.rid
      INNER JOIN "${schemaName}"."skill" s ON rs.skill_rid = s.rid
      WHERE 1=1 AND rs.resource_rid = :resource_rid
      ${filterConditions}
      ${searchCondition}
      ORDER BY ${finalSortBy === 'skill_name' ? 's' : 'rs'}."${finalSortBy}" ${finalSortOrder}
    `;

    const replacements = {
      searchTerm: search ? `%${search}%` : null,
      resource_rid,
    };

    // Execute the queries
    const results = await sequelize.query(query, {
      replacements,
      type: "SELECT",
    });
  
    const resourceSkill = results.map((resource: any) => {
      return {
        "Start Date":resource.start_date,
        "Skill Name":resource.skill_name,
        "Skill Level":resource.skill_level,
        "Years of Experience":resource.years_of_experience
      };
    });
    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: {
        resourceSkill: resourceSkill
      },
    };
  }

/**
   * Executes the main and count queries and formats the response
   *
   * @param sequelize - The Sequelize instance
   * @param schemaName - The schema name
   * @param filterConditions - SQL filter conditions
   * @param searchCondition - SQL search condition
   * @param finalSortBy - Field to sort by
   * @param finalSortOrder - Sort order (ASC/DESC)
   * @param limit - Number of records per page
   * @param offset - Offset for pagination
   * @param search - Search term
   * @returns Promise with query results
   */
async executeQueries(
  schemaName: string,
  filterConditions: string,
  searchCondition: string,
  finalSortBy: string,
  finalSortOrder: string,
  resource_rid: string,
  limit: number,
  offset: number,
  search: string
) {
  const sequelize = await this.getDbConnection(schemaName);

  // Build the query to get data from the account-specific schema
  const query = `
    SELECT rs.*,
    TO_CHAR(rs.start_date, 'MM/DD/YYYY') as start_date,
     r.resource_fullname, s.skill_name, r.resource_role, r.resource_type, r.resource_status, r.fiscal_year
    FROM "${schemaName}"."resource_skill" rs
    INNER JOIN "${schemaName}"."resources" r ON rs.resource_rid = r.rid
    INNER JOIN "${schemaName}"."skill" s ON rs.skill_rid = s.rid
    WHERE 1=1 AND rs.resource_rid = :resource_rid
    ${filterConditions}
    ${searchCondition}
    ORDER BY ${finalSortBy === 'skill_name' ? 's' : 'rs'}."${finalSortBy}" ${finalSortOrder}
    LIMIT :limit OFFSET :offset
  `;

  // Count query to get total records
  const countQuery = `
    SELECT COUNT(*) as total
    FROM "${schemaName}"."resource_skill" rs
    INNER JOIN "${schemaName}"."resources" r ON rs.resource_rid = r.rid
    INNER JOIN "${schemaName}"."skill" s ON rs.skill_rid = s.rid
    WHERE 1=1 AND rs.resource_rid = :resource_rid
    ${filterConditions}
    ${searchCondition}
  `;

  const replacements = {
    limit,
    offset,
    searchTerm: search ? `%${search}%` : null,
    resource_rid,
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

  const resourceSkill = results;
  const totalCount = countResult ? (countResult as any).total : 0;

  return {
    statusCode: HttpStatus.SUCCESS,
    message: HttpStatus.SUCCESS_MESSAGE,
    data: {
      resourceSkill: resourceSkill,
      count: parseInt(totalCount, 10),
    },
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
      "skill_name",
      "skill_level",
      "years_of_experience",
      "start_date",
    ];
    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  /**
   * Builds the search condition for the SQL query
   *
   * @param search - The search term
   * @returns SQL fragment for search condition
   */
  buildSearchCondition(search: string): string {
    if (!search) return "";

    return `
      AND (
        s.skill_name ILIKE :searchTerm 
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

    if (fiscalYear === 0 || fiscalYear === undefined){
      return filterConditions;
    }

    const fiscalYearCondition = `
      AND r.fiscal_year = ${fiscalYear}`;

    // Add fiscal year condition to filter conditions
    filterConditions += fiscalYearCondition;

    return filterConditions;
  }

  /**
   * Process filters for raw SQL query by converting filter object to SQL WHERE conditions.
   * Handles different types of filters (alphanumeric, numeric, date) with various operators.
   *
   * @param filters - The filters object from the request
   * @returns string - SQL WHERE clause fragment for filters
   */
  processFiltersForRawQuery(filters: Record<string, any>): string {
    let filterConditions = "";

    // Define field types for proper filter handling
    const alphanumericFields = ["skill_name"];
    const numericFields = ["years_of_experience"];
    const dateFields = ["start_date"];
    const enumFields = ["skill_level","status"];

    // Process each filter
    Object.entries(filters).forEach(([key, value]) => {
      // Handle different filter types based on field type
      if (typeof value === "object") {
        if (alphanumericFields.includes(key)) {
          filterConditions += this.processAlphanumericFilter(key, value);
        } else if (numericFields.includes(key)) {
          filterConditions += this.processNumericFilter(key, value);
        } else if (dateFields.includes(key)) {
          filterConditions += this.processDateFilter(key, value);
        } else if (enumFields.includes(key)) {
          filterConditions += this.processEnumFilter(key, value);
        } else {
          filterConditions += this.processDefaultFilter(key, value);
        }
      } else if (value !== undefined && value !== null) {
        // Simple equality
        filterConditions += this.processSimpleEqualityFilter(key, value);
      }
    });

    return filterConditions;
  }

  /**
   * Process alphanumeric field filters
   * @param key - The field name
   * @param value - The filter value object
   * @returns SQL condition string
   */
processAlphanumericFilter(key: string, value: any): string {
    let condition = "";

    if (value.equals) {
      condition += ` AND LOWER(s."${key}") = LOWER('${value.equals}')`;
    } else if (value.not_equals) {
      condition += ` AND LOWER(s."${key}") != LOWER('${value.not_equals}')`;
    } else if (value.contains) {
      condition += ` AND LOWER(s."${key}") LIKE LOWER('%${value.contains}%')`;
    } else if (value.not_contains) {
      condition += ` AND LOWER(s."${key}") NOT LIKE LOWER('%${value.not_contains}%')`;
    } else if (value.starts_with) {
      condition += ` AND LOWER(s."${key}") LIKE LOWER('${value.starts_with}%')`;
    } else if (value.ends_with) {
      condition += ` AND LOWER(s."${key}") LIKE LOWER('%${value.ends_with}')`;
    } else if (value.is_empty !== undefined) {
      if (value.is_empty) {
        condition += ` AND (s."${key}" IS NULL OR s."${key}" = '')`;
      }
    } else if (value.is_not_empty !== undefined) {
      if (value.is_not_empty) {
        condition += ` AND s."${key}" IS NOT NULL AND s."${key}" != ''`;
      }
    } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
      const values = value.in.map((item: string) => `'${item.toLowerCase()}'`).join(",");
      condition += ` AND LOWER(s."${key}") IN (${values})`;
    } else if (
      value.not_in &&
      Array.isArray(value.not_in) &&
      value.not_in.length > 0
    ) {
      const values = value.not_in.map((item: string) => `'${item.toLowerCase()}'`).join(",");
      condition += ` AND LOWER(s."${key}") NOT IN (${values})`;
    }

    return condition;
  }

  /**
   * Process numeric field filters
   * @param key - The field name
   * @param value - The filter value object
   * @returns SQL condition string
   */
  processNumericFilter(key: string, value: any): string {
    let condition = "";

    if (value.equals !== undefined) {
      condition += ` AND rs."${key}" = ${value.equals}`;
    } else if (value.not_equals !== undefined) {
      condition += ` AND rs."${key}" != ${value.not_equals}`;
    } else if (value.greater_than !== undefined) {
      condition += ` AND rs."${key}" > ${value.greater_than}`;
    } else if (value.less_than !== undefined) {
      condition += ` AND rs."${key}" < ${value.less_than}`;
    } else if (
      value.between &&
      Array.isArray(value.between) &&
      value.between.length === 2
    ) {
      condition += ` AND rs."${key}" BETWEEN ${value.between[0]} AND ${value.between[1]}`;
    } else if (value.is_empty !== undefined) {
      if (value.is_empty) {
        condition += ` AND rs."${key}" IS NULL`;
      }
    } else if (value.is_not_empty !== undefined) {
      if (value.is_not_empty) {
        condition += ` AND rs."${key}" IS NOT NULL`;
      }
    } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
      const values = value.in.join(",");
      condition += ` AND rs."${key}" IN (${values})`;
    } else if (
      value.not_in &&
      Array.isArray(value.not_in) &&
      value.not_in.length > 0
    ) {
      const values = value.not_in.join(",");
      condition += ` AND rs."${key}" NOT IN (${values})`;
    }

    return condition;
  }

  /**
   * Process date field filters
   * @param key - The field name
   * @param value - The filter value object
   * @returns SQL condition string
   */
  processDateFilter(key: string, value: any): string {
    let condition = "";

    if (value.equals) {
      condition += ` AND rs."${key}"::date = '${value.equals}'::date`;
    } else if (value.not_equals) {
      condition += ` AND rs."${key}"::date != '${value.not_equals}'::date`;
    } else if (value.before) {
      condition += ` AND rs."${key}" < '${value.before}'`;
    } else if (value.after) {
      condition += ` AND rs."${key}" > '${value.after}'`;
    } else if (
      value.between &&
      Array.isArray(value.between) &&
      value.between.length === 2
    ) {
      condition += ` AND rs."${key}" BETWEEN '${value.between[0]}' AND '${value.between[1]}'`;
    } else if (value.this_week) {
      condition += ` AND rs."${key}" BETWEEN 
        date_trunc('week', CURRENT_DATE) AND 
        (date_trunc('week', CURRENT_DATE) + interval '6 days')`;
    } else if (value.this_month) {
      condition += ` AND rs."${key}" BETWEEN 
        date_trunc('month', CURRENT_DATE) AND 
        (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')`;
    } else if (value.this_quarter) {
      condition += ` AND rs."${key}" BETWEEN 
        date_trunc('quarter', CURRENT_DATE) AND 
        (date_trunc('quarter', CURRENT_DATE) + interval '3 months - 1 day')`;
    } else if (value.last_7_days) {
      condition += ` AND rs."${key}" BETWEEN 
        (CURRENT_DATE - interval '7 days') AND CURRENT_DATE`;
    } else if (value.last_30_days) {
      condition += ` AND rs."${key}" BETWEEN 
        (CURRENT_DATE - interval '30 days') AND CURRENT_DATE`;
    } else if (value.is_empty !== undefined) {
      if (value.is_empty) {
        condition += ` AND rs."${key}" IS NULL`;
      }
    } else if (value.is_not_empty !== undefined) {
      if (value.is_not_empty) {
        condition += ` AND rs."${key}" IS NOT NULL`;
      }
    }

    return condition;
  }

  /**
   * Process enum field filters for raw SQL query
   * @param key - The field name
   * @param value - The filter value object
   * @returns SQL condition string
   */
processEnumFilter(key: string, value: any) {
  let condition = "";
  let tableAlias = "rs"; // Default to rs since we're only handling skill_level

  if (value.equals !== undefined) {
    condition += ` AND LOWER(${tableAlias}."${key}") = LOWER('${value.equals}')`;
  } else if (value.not_equals !== undefined) {
    condition += ` AND LOWER(${tableAlias}."${key}") != LOWER('${value.not_equals}')`;
  } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
    const values = value.in.map((item: string) => `'${item.toLowerCase()}'`).join(",");
    condition += ` AND LOWER(${tableAlias}."${key}") IN (${values})`;
  } else if (value.is_empty !== undefined) {
    if (value.is_empty) {
      condition += ` AND (${tableAlias}."${key}" IS NULL OR ${tableAlias}."${key}" = '')`;
    } else {
      condition += ` AND ${tableAlias}."${key}" IS NOT NULL AND ${tableAlias}."${key}" != ''`;
    }
  }
  return condition;
}


  /**
   * Process default field filters
   * @param key - The field name
   * @param value - The filter value object
   * @returns SQL condition string
   */
  processDefaultFilter(key: string, value: any): string {
    let condition = "";

    if (value.equals !== undefined) {
      if (typeof value.equals === "string") {
        condition += ` AND LOWER(rs."${key}") = LOWER('${value.equals}')`;
      } else {
        condition += ` AND rs."${key}" = ${value.equals}`;
      }
    }

    return condition;
  }

  /**
   * Process simple equality filter
   * @param key - The field name
   * @param value - The filter value
   * @returns SQL condition string
   */
  processSimpleEqualityFilter(key: string, value: any): string {
    if (typeof value === "string") {
      return ` AND LOWER(rs."${key}") = LOWER('${value}')`;
    } else {
      return ` AND rs."${key}" = ${value}`;
    }
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
}

const resourceSkillSchemaService = new ResourceSkillSchemaService();
export default resourceSkillSchemaService;
