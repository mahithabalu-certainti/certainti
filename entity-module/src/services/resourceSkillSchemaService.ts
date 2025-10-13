import { Sequelize } from "sequelize";
import { HttpStatus, SCHEMANAME_PREFIX, rawQueries } from "../utils/constants";
import { initOrgSequelize } from "../config/orgDataSource";
import { Resources } from "../models/resource";
import { ResourceSkill } from "../models/resourceSkill";
import { ResourceSkillTimeline } from "../models/resourceSkillTimeline";
import { ResourceSkillHistory } from "../models/resourceSkillHistory";
import { ResourceFiscal } from "../models/resourceFiscal";
import { initMainDbSequelize } from "../config/mainDataSource";
import moment from "moment";
import SchemaService from "./schemaService";
import { errorLog, logMessage } from "../utils/helpers";

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
          logMessage("Failed to initialize database connection");
          throw new Error("Failed to initialize database connection");
        }

        // Initialize models with the sequelize instance
        Resources.initialize(sequelize, schemaName);
        ResourceFiscal.initialize(sequelize,schemaName);
        // Skill.initialize(sequelize,schemaName);
        ResourceSkill.initialize(sequelize,schemaName);
        ResourceSkillTimeline.initialize(sequelize,schemaName);
        ResourceSkillHistory.initialize(sequelize,schemaName);

        this.sequelizeInstance = sequelize;
      }

      return this.sequelizeInstance;
    } catch (error) {
      errorLog("Error initializing database:", (error as Error).message);
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
        rawQueries.checkIfSchemaExists(),
        {
          replacements: { schemaName },
          type: "SELECT",
          plain: true,
        }
      );

      return result ? (result as any).exists === true : false;
    } catch (error) {
      errorLog("Error checking schema existence:", (error as Error).message);
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
        rawQueries.checkSchemaAndTableExists(),
        {
          replacements: { schemaName, tableName },
          type: "SELECT",
          plain: true,
        }
      );

      return result ? (result as any).exists === true : false;
    } catch (error) {
      errorLog("Error checking table existence:", (error as Error).message);
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
        logMessage(`Schema ${schemaName} created`);
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
            // case "skill":
            //   await sequelize.models.Skill.sync({
            //     force: false,
            //     schema: schemaName, // Explicitly set schema
            //   });
            //   break;
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
          logMessage(`Table ${tableName} created in schema: ${schemaName}`);
        } else {
          logMessage(
            `Table ${tableName} already exists in schema: ${schemaName}`
          );
        }
      } else {
        // Create all tables in the specified schema
        await sequelize.sync({
          force: false,
          schema: schemaName, // Explicitly set schema for all tables
        });
        logMessage(`All tables created in schema: ${schemaName}`);
      }

      return true;
    } catch (err) {
      errorLog(`Error creating tables in schema ${schemaName}:`, (err as Error).message);
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
    // Check if accountNumber already includes the trd365_ prefix
    const schemaName = accountNumber.startsWith(`${SCHEMANAME_PREFIX}`)
      ? accountNumber
      : `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, '')}`;

    // If we're creating resource_skill, make sure resources table exists first
    if (tableName === "resource_skill") {
      // First create the resources table
      const resourcesTableCreated = await this.createTablesInSchema(
        schemaName,
        "resources"
      );
      if (!resourcesTableCreated) {
        errorLog(
          `Failed to create resources table in schema ${schemaName}`
        );
        return false;
      }

      // Then create the skill table
      // const skillTableCreated = await this.createTablesInSchema(
      //   schemaName,
      //   "skill"
      // );
      // if (!skillTableCreated) {
      //   console.error(`Failed to create skill table in schema ${schemaName}`);
      //   return false;
      // }
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
  search: string,
  account_rid: string,
  userId: string
) {
  const sequelize = await this.getDbConnection(schemaName);
  const mainDbSequelize = await initMainDbSequelize();

  // Build the query to get data from the account-specific schema
  const query = rawQueries.getResourceSkillQuery(
    schemaName,
    filterConditions,
    searchCondition,
    finalSortBy,
    finalSortOrder  
  );

  const replacements = {
    searchTerm: search ? `%${search}%` : null,
    account_rid,
    resource_rid,
  };

  // Execute the query
  let resourceSkill = await sequelize.query(query, {
    replacements,
    type: "SELECT",
  }) as any[];

  if (resourceSkill.length > 0) {
    const skillTypeRids = [...new Set(resourceSkill.map(r => r.skill_type_rid))];
    const skillSubtypeRids = [...new Set(resourceSkill.map(r => r.skill_subtype_rid))];
    const skillLevelRids = [...new Set(resourceSkill.map(r => r.skill_level_rid))];

    // Fetch skill type names
    const skillTypeQuery = rawQueries.getSkillTypeQuery();
    const skillTypes = await mainDbSequelize.query(skillTypeQuery, {
      replacements: { skillTypeRids },
      type: "SELECT"
    });

    // Fetch skill subtype names
    const skillSubtypeQuery = rawQueries.getSkillSubtypeQuery();
    const skillSubtypes = await mainDbSequelize.query(skillSubtypeQuery, {
      replacements: { skillSubtypeRids },
      type: "SELECT"
    });

     // Fetch skill level names
    const skillLevelQuery = rawQueries.getSkillLevelQuery();
    const skillLevels = await mainDbSequelize.query(skillLevelQuery, {
      replacements: { skillLevelRids },
      type: "SELECT"
    });

    // Create lookup maps
    const skillTypeMap = new Map(skillTypes.map((st: any) => [st.rid, st.skill_type_name]));
    const skillSubtypeMap = new Map(skillSubtypes.map((sst: any) => [sst.rid, sst.skill_subtype_name]));
    const skillLevelMap = new Map(skillLevels.map((st: any) => [st.rid, st.skill_level_name]));
    // Add names to resource skills
    resourceSkill = resourceSkill.map((rs: any) => ({
      ...rs,
      skill_type_name: skillTypeMap.get(rs.skill_type_rid) || '',
      skill_subtype_name: skillSubtypeMap.get(rs.skill_subtype_rid) || '',
      skill_level_name: skillLevelMap.get(rs.skill_level_rid) || '',
      
    }));
     const schemaService = new SchemaService();
     const [
        accountFields,
        resourceFields,
        skillFields
      ] = await Promise.all([
        schemaService.getAllowedExportFields(userId, "accounts_view_edit"),
        schemaService.getAllowedExportFields(userId, "account_resources_view_edit"),
        schemaService.getAllowedExportFields(userId, "account_resource_skill_view_edit")
      ]);
      const allowedFieldSet = new Set<string>();
        for (const field of skillFields) {
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
      const requiredResourceFields = new Set(["resource_name","resource_type_rid","resource_orgname","resource_designation","resource_role","resource_total_experience","resource_code"]); // Add more if needed
        for (const field of resourceFields) {
        if (field.read && requiredResourceFields.has(field.field_name)) {
          allowedFieldSet.add(field.field_name);
        }
      }
      const labelMap: Record<string, string> = {
      "account_name": "Account Name",
      "resource_code": "Resource Code",
      "resource_name": "Name",
      "resource_type_rid": "Resource Type",
      "start_date": "Effective Date",
      "skill_type_rid": "Skill Type",
      "skill_subtype_rid": "Skill SubType",
      "skill_level_rid": "Skill Level",
      "skill_details": "Skill Details",
      "resource_orgname": "Org Name",
      "resource_designation": "Designation",
      "resource_role": "Role",
      "resource_total_experience": "Years of Experience",
      "r_number": "Skill ID"
    };

    // Add names to resource skills and format for export
    resourceSkill = resourceSkill.map((rs: any) => {
      const resultMap = {
        "account_name": rs.account_name || "-",
        "resource_code": rs.resource_code || "-",
        "resource_name": rs.resource_name || "-",
        "resource_type_rid": rs.resource_type || "-",
        "start_date": rs.start_date ? moment(rs.start_date).format('YYYY-MMM-DD') : "-",
        "skill_type_rid": rs.skill_type_name || "-",
        "skill_subtype_rid": rs.skill_subtype_name || "-",
        "skill_level_rid": rs.skill_level_name || "-",
        "skill_details": rs.skill_details || "-",
        "resource_orgname": rs.resource_orgname || "-",
        "resource_designation": rs.resource_designation || "-",
        "resource_role": rs.resource_role || "-",
        "resource_total_experience": rs.years_of_experience || "-",
        "r_number": rs.r_number || "-"
      };

      const filteredRow: Record<string, string> = {};
      for (const [field, value] of Object.entries(resultMap)) {
          if (allowedFieldSet.has(field)) {
            filteredRow[labelMap[field]] = value;
          }
        }
      return filteredRow;
});


    // Apply sorting if needed
    if (finalSortBy === 'skill_type_name' || finalSortBy === 'skill_subtype_name' || finalSortBy === 'skill_level_name') {
      resourceSkill.sort((a: any, b: any) => {
        const aValue = (a[finalSortBy] || '').toLowerCase();
        const bValue = (b[finalSortBy] || '').toLowerCase();
        return finalSortOrder === 'ASC' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
    }
  }

  return {
    statusCode: HttpStatus.SUCCESS,
    message: HttpStatus.SUCCESS_MESSAGE,
    data: {
      resourceSkill
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
  search: string,
  account_rid: string,
  graphqlData : any
) {
  const sequelize = await this.getDbConnection(schemaName);
  let resource_skill_rid = ``
  if(graphqlData.is_graphQl) {
    resource_skill_rid = graphqlData.rid
    resource_skill_rid = ` AND rs.rid = '${resource_skill_rid}'`
  }

  // Build the query to get data from the account-specific schema
  const query = rawQueries.getPaginatedResourceSkillQuery(schemaName, resource_skill_rid, filterConditions,
    searchCondition, finalSortBy, finalSortOrder
  );

  logMessage(query)

  // Count query to get total records
  const countQuery = rawQueries.getResourceSkillCountQuery(schemaName, filterConditions, searchCondition);

  const replacements = {
    limit,
    offset,
    searchTerm: search ? `%${search}%` : null,
    account_rid,
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

  let resourceSkill = results as any[];
  const mainDbSequelize = await initMainDbSequelize();

  // Fetch skill type and subtype names from separate databases if needed
  if (resourceSkill.length > 0) {
    const skillTypeRids = [...new Set(resourceSkill.map((r: any) => r.skill_type_rid))];
    const skillSubtypeRids = [...new Set(resourceSkill.map((r: any) => r.skill_subtype_rid))];
    const skillLevelRids = [...new Set(resourceSkill.map((r: any) => r.skill_level_rid))];

    // Fetch skill type names
    const skillTypeQuery = rawQueries.getSkillTypeQuery();
    const skillTypes = await mainDbSequelize.query(skillTypeQuery, {
      replacements: { skillTypeRids },
      type: "SELECT"
    });

    // Fetch skill subtype names
    const skillSubtypeQuery = rawQueries.getSkillSubtypeQuery();
    const skillSubtypes = await mainDbSequelize.query(skillSubtypeQuery, {
      replacements: { skillSubtypeRids },
      type: "SELECT"
    });

    // Fetch skill level names
    const skillLevelQuery = rawQueries.getSkillLevelQuery();
    const skillLevels = await mainDbSequelize.query(skillLevelQuery, {
      replacements: { skillLevelRids },
      type: "SELECT"
    });

    // Create lookup maps
    const skillTypeMap = new Map(skillTypes.map((st: any) => [st.rid, st.skill_type_name]));
    const skillSubtypeMap = new Map(skillSubtypes.map((sst: any) => [sst.rid, sst.skill_subtype_name]));
    const skillLevelMap = new Map(skillLevels.map((sst: any) => [sst.rid, sst.skill_level_name]));

    // Add names to resource skills
    resourceSkill = resourceSkill.map((rs: any) => ({
      ...rs,
      skill_type_name: skillTypeMap.get(rs.skill_type_rid) || '',
      skill_subtype_name: skillSubtypeMap.get(rs.skill_subtype_rid) || '',
      skill_level_name: skillLevelMap.get(rs.skill_level_rid) || ''
    }));

    // Apply sorting if needed
    if (finalSortBy === 'skill_type_name' || finalSortBy === 'skill_subtype_name' || finalSortBy === 'skill_level_name') {
      resourceSkill.sort((a: any, b: any) => {
        const aValue = a[finalSortBy].toLowerCase();
        const bValue = b[finalSortBy].toLowerCase();
        return finalSortOrder === 'ASC' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
    }
  }

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
      "skill_type_name",
      "skill_subtype_name",
      "skill_level_name",
      "start_date",
      "skill_details",
      "account_name",
      "resource_code",
      "resource_total_experience",
      "resource_name",
      "resource_type",
      "resource_orgname",
      "resource_role",
      "resource_designation",
      "r_number"
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
        s.skill_type_name ILIKE :searchTerm 
        OR r.resource_fullname ILIKE :searchTerm
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
    const alphanumericFields = ["resource_code","r_number"];
    const numericFields = ["resource_total_experience"];
    const dateFields = ["start_date"];
    const enumFields = ["skill_level_rid","status","skill_type_rid","skill_subtype_rid"];

    // Process each filter
    Object.entries(filters).forEach(([key, value]) => {
      // Handle different filter types based on field type
      if (typeof value === "object") {
        if (alphanumericFields.includes(key)) {
          filterConditions += this.processAlphanumericFilter(key, value);
        } 
        else if (numericFields.includes(key)) {
          filterConditions += this.processNumericFilter(key, value);
        } 
        else if (dateFields.includes(key)) {
          filterConditions += this.processDateFilter(key, value);
        } 
        else if (enumFields.includes(key)) {
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
      condition += ` AND LOWER(rs."${key}") = LOWER('${value.equals}')`;
    } else if (value.not_equals) {
      condition += ` AND (LOWER(rs."${key}") != LOWER('${value.not_equals}') OR rs."${key}" IS NULL)`;
    } else if (value.contains) {
      condition += ` AND LOWER(rs."${key}") LIKE LOWER('%${value.contains}%')`;
    } else if (value.not_contains) {
      condition += ` AND LOWER(rs."${key}") NOT LIKE LOWER('%${value.not_contains}%')`;
    } else if (value.starts_with) {
      condition += ` AND LOWER(rs."${key}") LIKE LOWER('${value.starts_with}%')`;
    } else if (value.ends_with) {
      condition += ` AND LOWER(rs."${key}") LIKE LOWER('%${value.ends_with}')`;
    } else if (value.is_empty !== undefined) {
      if (value.is_empty) {
        condition += ` AND (rs."${key}" IS NULL OR rs."${key}" = '')`;
      }
    } else if (value.is_not_empty !== undefined) {
      if (value.is_not_empty) {
        condition += ` AND rs."${key}" IS NOT NULL AND rs."${key}" != ''`;
      }
    } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
      const values = value.in.map((item: string) => `'${item.toLowerCase()}'`).join(",");
      condition += ` AND LOWER(rs."${key}") IN (${values})`;
    } else if (
      value.not_in &&
      Array.isArray(value.not_in) &&
      value.not_in.length > 0
    ) {
      const values = value.not_in.map((item: string) => `'${item.toLowerCase()}'`).join(",");
      condition += ` AND LOWER(rs."${key}") NOT IN (${values})`;
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
    let tableAlias = "r";

    if (value.equals !== undefined) {
      condition += ` AND ${tableAlias}."${key}" = ${value.equals}`;
    } else if (value.not_equals !== undefined) {
      condition += ` AND (${tableAlias}."${key}" != ${value.not_equals} OR ${tableAlias}."${key}" IS NULL)`;
    } else if (value.greater_than !== undefined) {
      condition += ` AND ${tableAlias}."${key}" > ${value.greater_than}`;
    } else if (value.less_than !== undefined) {
      condition += ` AND ${tableAlias}."${key}" < ${value.less_than}`;
    } else if (
      value.between &&
      Array.isArray(value.between) &&
      value.between.length === 2
    ) {
      condition += ` AND ${tableAlias}."${key}" BETWEEN ${value.between[0]} AND ${value.between[1]}`;
    } else if (value.is_empty !== undefined) {
      if (value.is_empty) {
        condition += ` AND ${tableAlias}."${key}" IS NULL`;
      }
    } else if (value.is_not_empty !== undefined) {
      if (value.is_not_empty) {
        condition += ` AND ${tableAlias}."${key}" IS NOT NULL`;
      }
    } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
      const values = value.in.join(",");
      condition += ` AND ${tableAlias}."${key}" IN (${values})`;
    } else if (
      value.not_in &&
      Array.isArray(value.not_in) &&
      value.not_in.length > 0
    ) {
      const values = value.not_in.join(",");
      condition += ` AND ${tableAlias}."${key}" NOT IN (${values})`;
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
      condition += ` AND (rs."${key}"::date != '${value.not_equals}'::date OR rs."${key}" IS NULL)`;
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
  let tableAlias = "rs";

  // Check if the field is a UUID type
  const isUuidField = key.toLowerCase().includes('rid');
  if (value.equals !== undefined) {
    if (isUuidField) {
      condition += ` AND ${tableAlias}."${key}" = '${value.equals}'`;
    } else {
      condition += ` AND LOWER(${tableAlias}."${key}") = LOWER('${value.equals}')`;
    }
  } else if (value.not_equals !== undefined) {
    if (isUuidField) {
      condition += ` AND (${tableAlias}."${key}" != '${value.not_equals}' OR ${tableAlias}."${key}" IS NULL)`;
    } else {
      condition += ` AND (LOWER(${tableAlias}."${key}") != LOWER('${value.not_equals}') OR ${tableAlias}."${key}" IS NULL)`;
    }
  } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
    if (isUuidField) {
      const values = value.in.map((item: string) => `'${item}'`).join(",");
      condition += ` AND ${tableAlias}."${key}" IN (${values})`;
    } else {
      const values = value.in.map((item: string) => `'${item.toLowerCase()}'`).join(",");
      condition += ` AND LOWER(${tableAlias}."${key}") IN (${values})`;
    }
  } else if (value.is_empty !== undefined) {
    if (value.is_empty) {
      if(isUuidField) {
        condition += ` AND ${tableAlias}."${key}" IS NULL`;
      } else {
        condition += ` AND (${tableAlias}."${key}" IS NULL OR ${tableAlias}."${key}" = '')`;
      }
    } else {
      if(isUuidField) {
        condition += ` AND ${tableAlias}."${key}" IS NOT NULL`;
      } else {
        condition += ` AND ${tableAlias}."${key}" IS NOT NULL AND ${tableAlias}."${key}"!= ''`;
      }}
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
  
  // Determine table alias based on field name
  let tableAlias = 'rs';
  if (key === 'account_name') {
    tableAlias = 'ad';
  } else if (['resource_name', 'resource_orgname', 'resource_designation', 'resource_role'].includes(key)) {
    tableAlias = 'r';
  }

  // Handle equals operator
  if (value.equals !== undefined) {
    if (typeof value.equals === "string") {
      condition += ` AND LOWER(${tableAlias}."${key}") = LOWER('${value.equals}')`;
    } else {
      condition += ` AND ${tableAlias}."${key}" = ${value.equals}`;
    }
  }

  // Handle not equals operator
  if (value.not_equals !== undefined) {
    if (typeof value.not_equals === "string") {
      condition += ` AND (LOWER(${tableAlias}."${key}") != LOWER('${value.not_equals}') OR ${tableAlias}."${key}" IS NULL)`;
    } else {
      condition += ` AND (${tableAlias}."${key}" != ${value.not_equals} OR ${tableAlias}."${key}" IS NULL)`;
    }
  }

  // Handle is empty operator
  if (value.is_empty === true) {
    condition += ` AND (${tableAlias}."${key}" IS NULL OR ${tableAlias}."${key}" = '')`;
  }

  // Handle is not empty operator
  if (value.is_not_empty === true) {
    condition += ` AND ${tableAlias}."${key}" IS NOT NULL AND ${tableAlias}."${key}" != ''`;
  }

  // Handle contains operator
  if (value.contains !== undefined) {
    condition += ` AND LOWER(${tableAlias}."${key}") LIKE LOWER('%${value.contains}%')`;
  }

  // Handle not contains operator
  if (value.not_contains !== undefined) {
    condition += ` AND LOWER(${tableAlias}."${key}") NOT LIKE LOWER('%${value.not_contains}%')`;
  }

  // Handle in operator
  if (value.in !== undefined && Array.isArray(value.in)) {
    const inValues = value.in.map((v: any) => typeof v === "string" ? `'${v}'` : v).join(',');
    condition += ` AND ${tableAlias}."${key}" IN (${inValues})`;
  }

  // Handle not in operator
  if (value.not_in !== undefined && Array.isArray(value.not_in)) {
    const notInValues = value.not_in.map((v: any) => typeof v === "string" ? `'${v}'` : v).join(',');
    condition += ` AND ${tableAlias}."${key}" NOT IN (${notInValues})`;
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
