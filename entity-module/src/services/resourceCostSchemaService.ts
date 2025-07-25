import { Op, Sequelize } from "sequelize";
import { ResourceCost } from "../models/resourceCost";
import { ResourceCostTimeline } from "../models/resourceCostTimeline";
import { ResourceCostHistory } from "../models/resourceCostHistory";
import { Resources } from "../models/resource";
import { initOrgSequelize } from "../config/orgDataSource";
import { initMainDbSequelize } from "../config/mainDataSource";
import { HttpStatus, MAIN_SCHEMA_NAME } from "../utils/constants";
import { ResourceFiscal } from "../models/resourceFiscal";
import moment from "moment";
import currency from "currency.js";
import Decimal from "decimal.js";
import SchemaService from "./schemaService";

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
            case "project_resource_fiscal":
              await sequelize.models.ProjectResourceFiscal.sync({
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
    // Check if accountNumber already includes the trd365_ prefix
    const schemaName = accountNumber.startsWith("trd365_")
      ? accountNumber
      : `trd365_${accountNumber.replace(/\D/g, '')}`;

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
    if (tableName === "project_resource_fiscal") {
      // First create the resources table
      const resourcesTableCreated = await this.createTablesInSchema(
        schemaName,
        "project_resource_fiscal"
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
 * Processes country filter by querying the main database for matching country RIDs
 *
 * @param filters - The filters object containing country filter
 * @returns Promise with country RIDs or null
 */
async processCountryFilter(filters: Record<string, any>) {
  // Check if country filter exists and has valid operators
  if (!filters.country || typeof filters.country !== "object") {
    return null;
  }

  const countryFilter = filters.country;

  // Handle is_empty operator first
  if (countryFilter.is_empty !== undefined) {
    delete filters.country;
    if (countryFilter.is_empty) {
      // For is_empty: true, we want records where country_rid IS NULL or empty
      filters.country_rid = {
        is_empty: true,
      };
    } else {
      // For is_empty: false, we want records where country_rid IS NOT NULL and not empty
      filters.country_rid = {
        is_not_empty: true,
      };
    }
    return null;
  }

  // Handle equals operator for UUID
  if (countryFilter.equals) {
    delete filters.country;
    filters.country_rid = {
      equals: countryFilter.equals,
    };
  }

  // Handle not_equals operator for UUID
  else if (countryFilter.not_equals) {
    delete filters.country;
    filters.country_rid = {
      not_equals: countryFilter.not_equals,
    };
  }

  // Handle contains operator for UUID
  else if (countryFilter.contains) {
    delete filters.country;
    filters.country_rid = {
      contains: countryFilter.contains,
    };
  }

  // Handle in operator for array of UUIDs
  else if (countryFilter.in && Array.isArray(countryFilter.in)) {
    delete filters.country;
    filters.country_rid = {
      in: countryFilter.in,
    };
  }

  // Handle not_in operator for array of UUIDs
  else if (countryFilter.not_in && Array.isArray(countryFilter.not_in)) {
    delete filters.country;
    filters.country_rid = {
      not_in: countryFilter.not_in,
    };
  }

  return null;
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

// async exportresourceCostDetailsForFinancialHighlights(
//   schemaName: string,
//   filterConditions: string,
//   searchCondition: string,
//   sortBy: string,
//   sortOrder: string,
//   search: string,
//   userId: string,
//   account_rid?: string,
//   project_rid?: string
// ) {
//   try {
//     const sequelize = await this.getDbConnection(schemaName);

//     // Build account filter condition
//     const accountFilter = account_rid ? ` AND prf.account_rid = :account_rid` : '';
    
//     // Build project filter condition
//     const projectFilter = project_rid ? ` AND prf.project_rid = :project_rid` : '';

//     // Build the base query without sorting or pagination
//     let query = `
//       SELECT 
//         prf.total_cost_pro_res,
//         prf.rd_percent_final,
//         prf.qre_final,
//         prf.rd_credits_total,
//         prf.resource_rid,
//         prf.project_fiscal_rid,
//         prf.country_rid,
//         pf.project_code,
//         pf.r_number,
//         pf.project_name,
//         r.resource_code,
//         r.resource_name,
//         r.resource_type_rid
//       FROM "${schemaName}"."project_resource_fiscal" prf
//       INNER JOIN "${schemaName}"."project_fiscal" pf ON pf.rid = prf.project_fiscal_rid
//       INNER JOIN "${schemaName}"."resources" r ON r.rid = prf.resource_rid
//       WHERE 1=1 
//       ${accountFilter}
//       ${projectFilter}
//       ${filterConditions}
//       ${searchCondition}
//     `;

//     const replacements: any = {
//       searchTerm: search ? `%${search}%` : null,
//     };

//     // Add account_rid if present
//     if (account_rid) {
//       replacements.account_rid = account_rid;
//     }

//     // Add project_rid if present
//     if (project_rid) {
//       replacements.project_rid = project_rid;
//     }

//     // Execute main query without sorting
//     let results = await sequelize.query(query, {
//       replacements,
//       type: "SELECT",
//     });

//     const mainDbSequelize = await initMainDbSequelize();
    
//     // Fetch reference data maps
//     const fetchReferenceMap = async (table: string, idField: string, nameField: string) => {
//       const query = `SELECT ${idField}, ${nameField} FROM ${MAIN_SCHEMA_NAME}.${table}`;
//       const items = await mainDbSequelize.query(query, { type: "SELECT" });
//       return new Map(items.map((item: any) => [item[idField], item[nameField]]));
//     };

//     // Fetch all reference data in parallel
//     const [resourceTypeMap, countryMap] = await Promise.all([
//       fetchReferenceMap('resource_type', 'rid', 'resource_type_name'),
//       fetchReferenceMap('country', 'rid', 'country_code')
//     ]);

//     // Helper function to assign reference data
//     const assignReferenceData = (result: any) => {
//       // Assign resource type name
//       result.resource_type_name = result.resource_type_rid 
//         ? resourceTypeMap.get(result.resource_type_rid) || null 
//         : null;
      
//       // Assign country code
//       result.country_code = result.country_rid 
//         ? countryMap.get(result.country_rid) || null 
//         : null;
//     };

//     // Handle sorting by resource_type_name
//     if (sortBy === "resource_type_name") {
//       // Assign reference data first
//       results.forEach(assignReferenceData);
      
//       // Sort in memory, handling empty values to appear last
//       results.sort((a: any, b: any) => {
//         const aType = a.resource_type_name;
//         const bType = b.resource_type_name;
        
//         // Handle null/undefined values
//         if (!aType && !bType) return 0;
//         if (!aType) return sortOrder === "ASC" ? 1 : -1;
//         if (!bType) return sortOrder === "ASC" ? -1 : 1;
        
//         // Compare non-empty values
//         return sortOrder === "ASC" 
//           ? aType.localeCompare(bType)
//           : bType.localeCompare(aType);
//       });
//     }
//     // Handle sorting by country_code
//     else if (sortBy === "country_code") {
//       // Assign reference data first
//       results.forEach(assignReferenceData);
      
//       // Sort in memory
//       results.sort((a: any, b: any) => {
//         const aCode = a.country_code || "";
//         const bCode = b.country_code || "";
//         return sortOrder === "ASC"
//           ? aCode.localeCompare(bCode)
//           : bCode.localeCompare(aCode);
//       });
//     }
//     else {
//       // Handle database-level sorting
//       if (sortBy === "resource_code" || sortBy === "resource_name") {
//         query += ` ORDER BY r."${sortBy}" ${sortOrder}`;
//       }
//       else if (sortBy === "project_code" || sortBy === "r_number" || sortBy === "project_name") {
//         query += ` ORDER BY pf."${sortBy}" ${sortOrder}`;
//       }
//       else {
//         // Default to project_resource_fiscal table fields
//         query += ` ORDER BY prf."${sortBy}" ${sortOrder}`;
//       }
      
//       results = await sequelize.query(query, {
//         replacements,
//         type: "SELECT",
//       });

//       // Assign reference data for database-sorted results
//       results.forEach(assignReferenceData);
//     }

//     const projectResourceFiscal = results;

//     // Extract all unique resource_type_rid and country_id values for detailed info
//     const resourceTypeIds = [
//       ...new Set(projectResourceFiscal.map((prf: any) => prf.resource_type_rid)),
//     ].filter(Boolean);

//     const countryIds = [
//       ...new Set(projectResourceFiscal.map((prf: any) => prf.country_rid)),
//     ].filter(Boolean);

//     // Fetch detailed reference information if needed
//     const referencePromises = [];

//     if (resourceTypeIds.length > 0) {
//       const resourceTypeQuery = `
//         SELECT rid, resource_type_name
//         FROM ${MAIN_SCHEMA_NAME}.resource_type 
//         WHERE rid IN (:resourceTypeIds)
//       `;
//       referencePromises.push(
//         mainDbSequelize.query(resourceTypeQuery, {
//           replacements: { resourceTypeIds },
//           type: "SELECT",
//         })
//       );
//     } else {
//       referencePromises.push(Promise.resolve([]));
//     }

//     if (countryIds.length > 0) {
//       const countryQuery = `
//         SELECT rid, country_code, country_name 
//         FROM ${MAIN_SCHEMA_NAME}.country 
//         WHERE rid IN (:countryIds)
//       `;
//       referencePromises.push(
//         mainDbSequelize.query(countryQuery, {
//           replacements: { countryIds },
//           type: "SELECT",
//         })
//       );
//     } else {
//       referencePromises.push(Promise.resolve([]));
//     }

//     const [resourceTypes, countries] = await Promise.all(referencePromises);

//     // Create maps for quick lookup
//     const resourceTypeDetailMap: any = (resourceTypes as any[]).reduce((map: any, rt: any) => {
//       map[rt.rid] = rt;
//       return map;
//     }, {});

//     const countryDetailMap: any = (countries as any[]).reduce((map: any, country: any) => {
//       map[country.rid] = country;
//       return map;
//     }, {});

//     // Add detailed reference info to each project resource fiscal record
//     projectResourceFiscal.forEach((prf: any) => {
//       // Add detailed resource type info
//       if (prf.resource_type_rid && resourceTypeDetailMap[prf.resource_type_rid]) {
//         prf.resource_type_name = resourceTypeDetailMap[prf.resource_type_rid].resource_type_name;
//       } else {
//         prf.resource_type_name = null;
//       }

//       // Add detailed country info
//       if (prf.country_rid && countryDetailMap[prf.country_rid]) {
//         prf.country_code = countryDetailMap[prf.country_rid].country_code;
//         prf.country_name = countryDetailMap[prf.country_rid].country_name;
//       } else {
//         prf.country_code = null;
//         prf.country_name = null;
//       }
//     });

//     // Get allowed fields for export using SchemaService
//     const rawResult = projectResourceFiscal || [];
//     console.log("Raw",rawResult);
//     const schemaService = new SchemaService();
    
//     const [
//       accountFields,
//       resourceFields,
//       projectFields,
//       projectResourceFiscalFields
//     ] = await Promise.all([
//       schemaService.getAllowedExportFields(userId, "accounts_view_edit"),
//       schemaService.getAllowedExportFields(userId, "account_resources_view_edit"),
//       schemaService.getAllowedExportFields(userId, "projects_view_edit"), // Assuming this permission exists
//       schemaService.getAllowedExportFields(userId, "financial_highlights_view_edit") // Assuming this permission exists
//     ]);

//     const allowedFieldSet = new Set<string>();
    
//     // Add project resource fiscal fields
//     for (const field of projectResourceFiscalFields) {
//       if (field.read) {
//         allowedFieldSet.add(field.field_name);
//       }
//     }

//     // Add required account fields
//     const requiredAccountFields = new Set(["account_name"]);
//     for (const field of accountFields) {
//       if (field.read && requiredAccountFields.has(field.field_name)) {
//         allowedFieldSet.add(field.field_name);
//       }
//     }

//     // Add required resource fields
//     const requiredResourceFields = new Set([
//       "resource_code", 
//       "resource_name", 
//       "resource_type_rid"
//     ]);
//     for (const field of resourceFields) {
//       if (field.read && requiredResourceFields.has(field.field_name)) {
//         allowedFieldSet.add(field.field_name);
//       }
//     }

//     // Add required project fields
//     const requiredProjectFields = new Set([
//       "project_code", 
//       "project_name", 
//       "r_number"
//     ]);
//     for (const field of projectFields) {
//       if (field.read && requiredProjectFields.has(field.field_name)) {
//         allowedFieldSet.add(field.field_name);
//       }
//     }

//     console.log(allowedFieldSet);

//     // Label mapping for export headers
//     const labelMap: Record<string, string> = {
//       "project_code": "Project Code",
//       "r_number": "Project ID",
//       "project_name": "Project Name", 
//       "resource_code": "Resource Code",
//       "resource_name": "Resource Name",
//       "resource_type_rid": "Resource Type",
//       "country_rid": "Country",
//       "total_cost_pro_res": "Total Cost",
//       "rd_percent_final": "R&D Percentage",
//       "qre_final": "QRE Final",
//       "rd_credits_total": "R&D Credits Total"
//     };

//     // Format number for export (similar to original function)
//     const formatNumberForExport = (value: any): string => {
//       if (value == null || value === '') return '-';
    
//       try {
//         const decimalValue = new Decimal(value.toString());
//         if (!decimalValue.isFinite()) return '-';
    
//         // Format the number with commas and 2 decimal places
//         const [intPart, decPart] = decimalValue.toFixed(2).split('.');
//         const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
//         return `${formattedInt}.${decPart}`;
    
//       } catch (error) {
//         console.error('Error formatting number:', error);
//         return '-';
//       }
//     };

//     // Map data for export
//     let exportData = rawResult.map((item: any) => {
//       const exportData: Record<string, string> = {};
      
//       let resultMap = {
//         "project_code": item.project_code || "-",
//         "r_number": item.r_number || "-", 
//         "project_name": item.project_name || "-",
//         "resource_code": item.resource_code || "-",
//         "resource_name": item.resource_name || "-",
//         "resource_type_rid": item.resource_type_name || "-",
//         "country_rid": item.country_code || "-",
//         "total_cost_pro_res": formatNumberForExport(item.total_cost_pro_res) || "-",
//         "rd_percent_final": formatNumberForExport(item.rd_percent_final) || "-",
//         "qre_final": formatNumberForExport(item.qre_final) || "-",
//         "rd_credits_total": formatNumberForExport(item.rd_credits_total) || "-"
//       };

//       for (const [field, value] of Object.entries(resultMap)) {
//         if (allowedFieldSet.has(field)) {
//           exportData[labelMap[field]] = value;
//         }
//       }
//       return exportData;
//     });

//     return {
//       statusCode: HttpStatus.SUCCESS,
//       message: HttpStatus.SUCCESS_MESSAGE,
//       data: {
//         financialHighlights: exportData,
//       },
//     };
//   } catch (error) {
//     console.error("Error executing queries:", error);
//     return this.createErrorResponse("Error executing database queries");
//   }
// }

async exportresourceCostDetailsForFinancialHighlights(
  schemaName: string,
  filterConditions: string,
  searchCondition: string,
  sortBy: string,
  sortOrder: string,
  search: string,
  userId: string,
  account_rid?: string,
  project_rid?: string
) {
  try {
    const sequelize = await this.getDbConnection(schemaName);

    // Build account filter condition
    const accountFilter = account_rid ? ` AND prf.account_rid = :account_rid` : '';
    
    // Build project filter condition
    const projectFilter = project_rid ? ` AND prf.project_rid = :project_rid` : '';

    // Build the base query without sorting or pagination
    let query = `
      SELECT 
        prf.total_cost_pro_res,
        prf.rd_percent_final,
        prf.qre_final,
        prf.rd_credits_total,
        prf.resource_rid,
        prf.project_fiscal_rid,
        prf.country_rid,
        prf.fiscal_year,
        pf.project_code,
        pf.r_number,
        pf.project_name,
        r.resource_code,
        r.resource_name,
        r.resource_type_rid
      FROM "${schemaName}"."project_resource_fiscal" prf
      INNER JOIN "${schemaName}"."project_fiscal" pf ON pf.rid = prf.project_fiscal_rid
      INNER JOIN "${schemaName}"."resources" r ON r.rid = prf.resource_rid
      WHERE 1=1 
      ${accountFilter}
      ${projectFilter}
      ${filterConditions}
      ${searchCondition}
    `;

    const replacements: any = {
      searchTerm: search ? `%${search}%` : null,
    };

    // Add account_rid if present
    if (account_rid) {
      replacements.account_rid = account_rid;
    }

    // Add project_rid if present
    if (project_rid) {
      replacements.project_rid = project_rid;
    }

    // Execute main query without sorting
    let results = await sequelize.query(query, {
      replacements,
      type: "SELECT",
    });

    const mainDbSequelize = await initMainDbSequelize();
    
    // Fetch reference data maps
    const fetchReferenceMap = async (table: string, idField: string, nameField: string) => {
      const query = `SELECT ${idField}, ${nameField} FROM ${MAIN_SCHEMA_NAME}.${table}`;
      const items = await mainDbSequelize.query(query, { type: "SELECT" });
      return new Map(items.map((item: any) => [item[idField], item[nameField]]));
    };

    // Fetch all reference data in parallel
    const [resourceTypeMap, countryMap] = await Promise.all([
      fetchReferenceMap('resource_type', 'rid', 'resource_type_name'),
      fetchReferenceMap('country', 'rid', 'country_code')
    ]);

    // Helper function to assign reference data
    const assignReferenceData = (result: any) => {
      // Assign resource type name
      result.resource_type_name = result.resource_type_rid 
        ? resourceTypeMap.get(result.resource_type_rid) || null 
        : null;
      
      // Assign country code
      result.country_code = result.country_rid 
        ? countryMap.get(result.country_rid) || null 
        : null;
    };

    // Handle sorting by resource_type_name
    if (sortBy === "resource_type_name") {
      // Assign reference data first
      results.forEach(assignReferenceData);
      
      // Sort in memory, handling empty values to appear last
      results.sort((a: any, b: any) => {
        const aType = a.resource_type_name;
        const bType = b.resource_type_name;
        
        // Handle null/undefined values
        if (!aType && !bType) return 0;
        if (!aType) return sortOrder === "ASC" ? 1 : -1;
        if (!bType) return sortOrder === "ASC" ? -1 : 1;
        
        // Compare non-empty values
        return sortOrder === "ASC" 
          ? aType.localeCompare(bType)
          : bType.localeCompare(aType);
      });
    }
    // Handle sorting by country_code
    else if (sortBy === "country_code") {
      // Assign reference data first
      results.forEach(assignReferenceData);
      
      // Sort in memory
      results.sort((a: any, b: any) => {
        const aCode = a.country_code || "";
        const bCode = b.country_code || "";
        return sortOrder === "ASC"
          ? aCode.localeCompare(bCode)
          : bCode.localeCompare(aCode);
      });
    }
    else {
      // Handle database-level sorting
      if (sortBy === "resource_code" || sortBy === "resource_name") {
        query += ` ORDER BY r."${sortBy}" ${sortOrder}`;
      }
      else if (sortBy === "project_code" || sortBy === "r_number" || sortBy === "project_name") {
        query += ` ORDER BY pf."${sortBy}" ${sortOrder}`;
      }
      else {
        // Default to project_resource_fiscal table fields
        query += ` ORDER BY prf."${sortBy}" ${sortOrder}`;
      }
      
      results = await sequelize.query(query, {
        replacements,
        type: "SELECT",
      });

      // Assign reference data for database-sorted results
      results.forEach(assignReferenceData);
    }

    const projectResourceFiscal = results;

    // Extract all unique resource_type_rid and country_id values for detailed info
    const resourceTypeIds = [
      ...new Set(projectResourceFiscal.map((prf: any) => prf.resource_type_rid)),
    ].filter(Boolean);

    const countryIds = [
      ...new Set(projectResourceFiscal.map((prf: any) => prf.country_rid)),
    ].filter(Boolean);

    // Fetch detailed reference information if needed
    const referencePromises = [];

    if (resourceTypeIds.length > 0) {
      const resourceTypeQuery = `
        SELECT rid, resource_type_name
        FROM ${MAIN_SCHEMA_NAME}.resource_type 
        WHERE rid IN (:resourceTypeIds)
      `;
      referencePromises.push(
        mainDbSequelize.query(resourceTypeQuery, {
          replacements: { resourceTypeIds },
          type: "SELECT",
        })
      );
    } else {
      referencePromises.push(Promise.resolve([]));
    }

    if (countryIds.length > 0) {
      const countryQuery = `
        SELECT rid, country_code, country_name 
        FROM ${MAIN_SCHEMA_NAME}.country 
        WHERE rid IN (:countryIds)
      `;
      referencePromises.push(
        mainDbSequelize.query(countryQuery, {
          replacements: { countryIds },
          type: "SELECT",
        })
      );
    } else {
      referencePromises.push(Promise.resolve([]));
    }

    const [resourceTypes, countries] = await Promise.all(referencePromises);

    // Create maps for quick lookup
    const resourceTypeDetailMap: any = (resourceTypes as any[]).reduce((map: any, rt: any) => {
      map[rt.rid] = rt;
      return map;
    }, {});

    const countryDetailMap: any = (countries as any[]).reduce((map: any, country: any) => {
      map[country.rid] = country;
      return map;
    }, {});

    // Add detailed reference info to each project resource fiscal record
    projectResourceFiscal.forEach((prf: any) => {
      // Add detailed resource type info
      if (prf.resource_type_rid && resourceTypeDetailMap[prf.resource_type_rid]) {
        prf.resource_type_name = resourceTypeDetailMap[prf.resource_type_rid].resource_type_name;
      } else {
        prf.resource_type_name = null;
      }

      // Add detailed country info
      if (prf.country_rid && countryDetailMap[prf.country_rid]) {
        prf.country_code = countryDetailMap[prf.country_rid].country_code;
        prf.country_name = countryDetailMap[prf.country_rid].country_name;
      } else {
        prf.country_code = null;
        prf.country_name = null;
      }
    });

    // Label mapping for export headers
    const labelMap: Record<string, string> = {
      "project_code": "Project Ref Id",
      "r_number": "Project Number",
      "fiscal_year":"Fiscal Year",
      "project_name": "Project Name", 
      "resource_code": "Resource Ref Id",
      "resource_name": "Resource Name",
      "resource_type_name": "Resource Type",
      "country_code": "Country",
      "total_cost_pro_res": "Cost",
      "rd_percent_final": "RD %",
      "qre_final": "QRE",
      "rd_credits_total": "RD Credits",
    };

    const exportData = projectResourceFiscal.map((row: any) => {
      const mappedRow: Record<string, any> = {};
      Object.keys(labelMap).forEach((key) => {
        mappedRow[labelMap[key]] = row[key];
      });
      return mappedRow;
    });

    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: {
        financialHighlights: exportData,
      },
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      message: "An error occurred while fetching resource cost details.",
    };
  }
}
async executeQueriesForFinancialHighlights(
  schemaName: string,
  filterConditions: string,
  searchCondition: string,
  sortBy: string,
  sortOrder: string,
  limit: number,
  offset: number,
  search: string,
  account_rid?: string,
  project_rid?: string
) {
  try {
    const sequelize = await this.getDbConnection(schemaName);

    // Build account filter condition
    const accountFilter = account_rid ? ` AND prf.account_rid = :account_rid` : '';
    
    // Build project filter condition
    const projectFilter = project_rid ? ` AND prf.project_rid = :project_rid` : '';

    // Build the base query without sorting or pagination
    let query = `
      SELECT 
        prf.total_cost_pro_res,
        prf.rd_percent_final,
        prf.qre_final,
        prf.rd_credits_total,
        prf.resource_rid,
        prf.project_fiscal_rid,
        prf.fiscal_year,
        prf.country_rid,
        prf.region_rid,
        pf.project_code,
        pf.r_number,
        pf.project_name,
        r.resource_code,
        r.resource_name,
        r.resource_type_rid
      FROM "${schemaName}"."project_resource_fiscal" prf
      INNER JOIN "${schemaName}"."project_fiscal" pf ON pf.rid = prf.project_fiscal_rid
      INNER JOIN "${schemaName}"."resources" r ON r.rid = prf.resource_rid
      WHERE 1=1 
      ${accountFilter}
      ${projectFilter}
      ${filterConditions}
      ${searchCondition}
    `;

    // Count query to get total records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "${schemaName}"."project_resource_fiscal" prf
      INNER JOIN "${schemaName}"."project_fiscal" pf ON pf.rid = prf.project_fiscal_rid
      INNER JOIN "${schemaName}"."resources" r ON r.rid = prf.resource_rid
      WHERE 1=1
      ${accountFilter}
      ${projectFilter}
      ${filterConditions}
      ${searchCondition}
    `;

    const replacements: any = {
      limit,
      offset,
      searchTerm: search ? `%${search}%` : null,
    };

    // Add account_rid if present
    if (account_rid) {
      replacements.account_rid = account_rid;
    }

    // Add project_rid if present
    if (project_rid) {
      replacements.project_rid = project_rid;
    }

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
    
    // Fetch reference data maps
    const fetchReferenceMap = async (table: string, idField: string, nameField: string) => {
      const query = `SELECT ${idField}, ${nameField} FROM ${MAIN_SCHEMA_NAME}.${table}`;
      const items = await mainDbSequelize.query(query, { type: "SELECT" });
      return new Map(items.map((item: any) => [item[idField], item[nameField]]));
    };

    // Fetch all reference data in parallel
    const [resourceTypeMap, countryMap,regionMap] = await Promise.all([
      fetchReferenceMap('resource_type', 'rid', 'resource_type_name'),
      fetchReferenceMap('country', 'rid', 'country_code'),
      fetchReferenceMap('state', 'rid', 'state_name')
    ]);

    // Helper function to assign reference data
    const assignReferenceData = (result: any) => {
      // Assign resource type name
      result.resource_type_name = result.resource_type_rid 
        ? resourceTypeMap.get(result.resource_type_rid) || null 
        : null;
      
      // Assign country code
      result.country_code = result.country_rid 
        ? countryMap.get(result.country_rid) || null 
        : null;

      result.region_name = result.region_rid 
        ? regionMap.get(result.region_rid) || null 
        : null;
    };

    // Handle sorting by resource_type_name
    if (sortBy === "resource_type_name") {
      // Assign reference data first
      results.forEach(assignReferenceData);
      
      // Sort in memory, handling empty values to appear last
      results.sort((a: any, b: any) => {
        const aType = a.resource_type_name;
        const bType = b.resource_type_name;
        
        // Handle null/undefined values
        if (!aType && !bType) return 0;
        if (!aType) return sortOrder === "ASC" ? 1 : -1;
        if (!bType) return sortOrder === "ASC" ? -1 : 1;
        
        // Compare non-empty values
        return sortOrder === "ASC" 
          ? aType.localeCompare(bType)
          : bType.localeCompare(aType);
      });

      // Apply pagination
      results = results.slice(offset, offset + limit) as any;
    }
    // Handle sorting by country_code
    else if (sortBy === "country_code") {
      // Assign reference data first
      results.forEach(assignReferenceData);
      
      // Sort in memory
      results.sort((a: any, b: any) => {
        const aCode = a.country_code || "";
        const bCode = b.country_code || "";
        return sortOrder === "ASC"
          ? aCode.localeCompare(bCode)
          : bCode.localeCompare(aCode);
      });

      // Apply pagination
      results = results.slice(offset, offset + limit) as any;
    }
    else if (sortBy === "state_name") {
      // Assign reference data first
      results.forEach(assignReferenceData);
      
      // Sort in memory
      results.sort((a: any, b: any) => {
        const aCode = a.country_code || "";
        const bCode = b.country_code || "";
        return sortOrder === "ASC"
          ? aCode.localeCompare(bCode)
          : bCode.localeCompare(aCode);
      });

      // Apply pagination
      results = results.slice(offset, offset + limit) as any;
    }
    else {
      // Handle database-level sorting
      if (sortBy === "resource_code" || sortBy === "resource_name") {
        query += ` ORDER BY r."${sortBy}" ${sortOrder} LIMIT :limit OFFSET :offset`;
      }
      else if (sortBy === "project_code" || sortBy === "r_number" || sortBy === "project_name") {
        query += ` ORDER BY pf."${sortBy}" ${sortOrder} LIMIT :limit OFFSET :offset`;
      }
      else {
        // Default to project_resource_fiscal table fields
        query += ` ORDER BY prf."${sortBy}" ${sortOrder} LIMIT :limit OFFSET :offset`;
      }
      
      results = await sequelize.query(query, {
        replacements,
        type: "SELECT",
      });

      // Assign reference data for database-sorted results
      results.forEach(assignReferenceData);
    }

    const projectResourceFiscal = results;
    const totalCount = countResult ? (countResult as any).total : 0;

    // Extract all unique resource_type_rid and country_id values for detailed info
    const resourceTypeIds = [
      ...new Set(projectResourceFiscal.map((prf: any) => prf.resource_type_rid)),
    ].filter(Boolean);

    const countryIds = [
      ...new Set(projectResourceFiscal.map((prf: any) => prf.country_rid)),
    ].filter(Boolean);

    const regionIds = [
      ...new Set(projectResourceFiscal.map((prf: any) => prf.region_rid))
    ].filter(Boolean);

    // Fetch detailed reference information if needed
    const referencePromises = [];

    if (resourceTypeIds.length > 0) {
      const resourceTypeQuery = `
        SELECT rid, resource_type_name
        FROM ${MAIN_SCHEMA_NAME}.resource_type 
        WHERE rid IN (:resourceTypeIds)
      `;
      referencePromises.push(
        mainDbSequelize.query(resourceTypeQuery, {
          replacements: { resourceTypeIds },
          type: "SELECT",
        })
      );
    } else {
      referencePromises.push(Promise.resolve([]));
    }

    if (countryIds.length > 0) {
      const countryQuery = `
        SELECT rid, country_code, country_name 
        FROM ${MAIN_SCHEMA_NAME}.country 
        WHERE rid IN (:countryIds)
      `;
      referencePromises.push(
        mainDbSequelize.query(countryQuery, {
          replacements: { countryIds },
          type: "SELECT",
        })
      );
    } else {
      referencePromises.push(Promise.resolve([]));
    }

    if (regionIds.length > 0) {
      const regionQuery = `
        SELECT rid, state_name
        FROM ${MAIN_SCHEMA_NAME}.state
        WHERE rid IN (:regionIds)
      `;
      referencePromises.push(
        mainDbSequelize.query(regionQuery, {
          replacements: { regionIds },
          type: "SELECT",
        })
      );
    } else {
      referencePromises.push(Promise.resolve([]));
    }

    const [resourceTypes, countries,regions] = await Promise.all(referencePromises);

    // Create maps for quick lookup
    const resourceTypeDetailMap: any = (resourceTypes as any[]).reduce((map: any, rt: any) => {
      map[rt.rid] = rt;
      return map;
    }, {});

    const countryDetailMap: any = (countries as any[]).reduce((map: any, country: any) => {
      map[country.rid] = country;
      return map;
    }, {});

    const regionDetailMap: any = (regions as any[]).reduce((map: any, region: any) => {
      map[region.rid] = region;
      return map;
    }, {});

    // Add detailed reference info to each project resource fiscal record
    projectResourceFiscal.forEach((prf: any) => {
      // Add detailed resource type info
      if (prf.resource_type_rid && resourceTypeDetailMap[prf.resource_type_rid]) {
        // prf.resource_type_code = resourceTypeDetailMap[prf.resource_type_rid].resource_type_code;
        prf.resource_type_name = resourceTypeDetailMap[prf.resource_type_rid].resource_type_name;
      } else {
        // prf.resource_type_code = null;
        prf.resource_type_name = null;
      }

      // Add detailed country info
      if (prf.country_rid && countryDetailMap[prf.country_rid]) {
        prf.country_code = countryDetailMap[prf.country_rid].country_code;
        prf.country_name = countryDetailMap[prf.country_rid].country_name;
      } else {
        prf.country_code = null;
        prf.country_name = null;
      }

      if (prf.region_rid && regionDetailMap[prf.region_rid]) {
        prf.region_name = regionDetailMap[prf.region_rid].state_name;
      } else {
        prf.region_name = null;
      }
    });

    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: {
        projectResourceFiscal: projectResourceFiscal,
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
    account_rid: string,
    graphqlData : any
  ) {
    try {
      const sequelize = await this.getDbConnection(schemaName);
      let resource_cost_rid = ``
      if(graphqlData.is_graphQl) {
        resource_cost_rid = graphqlData.rid
        resource_cost_rid = ` AND rc.rid = '${resource_cost_rid}'`
      }

      //Build the base query without sorting or pagination
      let query = `
        SELECT rc.*,rc.r_number as r_number, r.resource_name, r.resource_orgname, r.resource_designation, r.resource_role, ad.account_name, ad.account_rid,
        TO_CHAR(rc.effective_from, 'YYYY-MM-DD') as effective_from,
        TO_CHAR(rc.end_date, 'YYYY-MM-DD') as end_date
        FROM "${schemaName}"."resource_cost" rc
        INNER JOIN "${schemaName}"."resources" r ON rc.resource_rid = r.rid
        INNER JOIN "${schemaName}"."account_details" ad ON r.account_rid = ad.account_rid
        WHERE 1=1 AND rc.account_rid = :account_rid AND rc.resource_rid = :resource_rid ${resource_cost_rid}
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
      const fetchReferenceMap = async (table: string, idField: string, nameField: string) => {
      const query = `SELECT ${idField}, ${nameField} FROM ${MAIN_SCHEMA_NAME}.${table}`;
      const items = await mainDbSequelize.query(query, { type: "SELECT" });
      return new Map(items.map((item: any) => [item[idField], item[nameField]]));
    };

    // Fetch all reference data in parallel
    const [statusMap, resourceTypeMap] = await Promise.all([
      fetchReferenceMap('resource_status', 'rid', 'resource_status_name'),
      fetchReferenceMap('resource_type', 'rid', 'resource_type_name')
    ]);
      // For each result where currency_rid is empty/null, fetch and assign currency_rid from account
      await Promise.all(results.map(result => 
        {this.assignCurrencyRid(result, mainDbSequelize);
          this.assignResourceStatusandType(result, statusMap,resourceTypeMap);
        }));
     
      // Handle sorting by status name
        if (sortBy === "status_name") {
            // Sort in memory, handling empty values to appear last
            results.sort((a: any, b: any) => {
                const aStatus = a.status_name;
                const bStatus = b.status_name;
                
                // Handle null/undefined values
                if (!aStatus && !bStatus) return 0;
                if (!aStatus) return sortOrder === "ASC" ? 1 : -1;
                if (!bStatus) return sortOrder === "ASC" ? -1 : 1;
                
                // Compare non-empty values
                return sortOrder === "ASC" 
                    ? aStatus.localeCompare(bStatus)
                    : bStatus.localeCompare(aStatus);
            });

            // Apply pagination
            results = results.slice(offset, offset + limit) as any;
        }
      // If sorting by currency_code, we need to fetch currency info first
      else if (sortBy === "currency") {
        // Get all currency RIDs from results
        const currencyIds = [
          ...new Set(results.map((rc: any) => rc.currency_rid)),
        ].filter(Boolean);

        if (currencyIds.length > 0) {
          // Fetch currency info from main database
          const currencies = await mainDbSequelize.query(
            `
            SELECT rid, currency_code 
            FROM ${MAIN_SCHEMA_NAME}.currency 
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
      } 
      else {
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
       await Promise.all(results.map(result => 
        {this.assignCurrencyRid(result, mainDbSequelize);
          this.assignResourceStatusandType(result, statusMap,resourceTypeMap);
        }));
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
            FROM ${MAIN_SCHEMA_NAME}.currency 
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
    account_rid: string,
    userId:string
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
      const fetchReferenceMap = async (table: string, idField: string, nameField: string) => {
        const query = `SELECT ${idField}, ${nameField} FROM ${MAIN_SCHEMA_NAME}.${table}`;
        const items = await mainDbSequelize.query(query, { type: "SELECT" });
        return new Map(items.map((item: any) => [item[idField], item[nameField]]));
      };

      // Fetch all reference data in parallel
      const [statusMap, resourceTypeMap] = await Promise.all([
        fetchReferenceMap('resource_status', 'rid', 'resource_status_name'),
        fetchReferenceMap('resource_type', 'rid', 'resource_type_name')
      ]);
      // For each result where currency_rid is empty/null, fetch and assign currency_rid from account
      await Promise.all(results.map(result => 
        {this.assignCurrencyRid(result, mainDbSequelize);
          this.assignResourceStatusandType(result, statusMap,resourceTypeMap);
        }));
     
      // Handle sorting by status name
        if (sortBy === "status_name") {
            // Sort in memory
            results.sort((a: any, b: any) => {
                const aStatus = a.status_name || "";
                const bStatus = b.status_name || "";

                // Handle null/undefined values
                if (!aStatus && !bStatus) return 0;
                if (!aStatus) return sortOrder === "ASC" ? 1 : -1;
                if (!bStatus) return sortOrder === "ASC" ? -1 : 1;

                return sortOrder === "ASC"
                    ? aStatus.localeCompare(bStatus)
                    : bStatus.localeCompare(aStatus);
            });    
        } 
        else if (sortBy === "resource_type_rid") {
            // Sort in memory
            results.sort((a: any, b: any) => {
                const aStatus = a.resource_type_name || "";
                const bStatus = b.resource_type_name || "";
                return sortOrder === "ASC"
                    ? aStatus.localeCompare(bStatus)
                    : bStatus.localeCompare(aStatus);
            });    
        } 
      // If sorting by currency_code, we need to fetch currency info first
      else if (sortBy === "currency") {
        // Get all currency RIDs from results
        const currencyIds = [
          ...new Set(results.map((rc: any) => rc.currency_rid)),
        ].filter(Boolean);

        if (currencyIds.length > 0) {
          // Fetch currency info from main database
          const currencies = await mainDbSequelize.query(
            `
            SELECT rid, currency_code 
            FROM ${MAIN_SCHEMA_NAME}.currency 
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

       await Promise.all(results.map(result => 
        {this.assignCurrencyRid(result, mainDbSequelize);
          this.assignResourceStatusandType(result, statusMap,resourceTypeMap);
        }));
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
            FROM ${MAIN_SCHEMA_NAME}.currency 
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
      
        try {
          const decimalValue = new Decimal(value.toString());
          if (!decimalValue.isFinite()) return '-';
      
          // Extract just the formatted currency pattern using a dummy value
          const pattern = currency(0, {
            symbol: currency_symbol || '$',
            precision: 2,
            pattern: '! #',
            separator: ',',
            decimal: '.',
          }).format(); // e.g., "$ 0.00"
      
          // Format actual value manually using Decimal
          const [intPart, decPart] = decimalValue.toFixed().split('.');
          const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      
          const formattedNumber = decPart ? `${formattedInt}.${decPart}` : formattedInt;
          // Replace "0.00" in pattern with our real number
          return pattern.replace('0.00', formattedNumber);
      
        } catch (error) {
          console.error('Error formatting number:', error);
          return '-';
        }
      };
      

      const rawResult = resourceCost || [];
       const schemaService = new SchemaService();
        const [
        accountFields,
        resourceFields,
        costFields
      ] = await Promise.all([
        schemaService.getAllowedExportFields(userId, "accounts_view_edit"),
        schemaService.getAllowedExportFields(userId, "account_resources_view_edit"),
        schemaService.getAllowedExportFields(userId, "account_resource_cost_edit_view")
      ]);
        const allowedFieldSet = new Set<string>();
        for (const field of costFields) {
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
      console.log(allowedFieldSet)
      const requiredResourceFields = new Set(["resource_orgname","resource_designation","resource_role","resource_type_rid","resource_code","resource_name"]); // Add more if needed
        for (const field of resourceFields) {
        if (field.read && requiredResourceFields.has(field.field_name)) {
          allowedFieldSet.add(field.field_name);
        }
      }
      const labelMap: Record<string, string> = {
        "account_name": "Account Name",                   // Account name is mapped as 'Name' in allowedFieldSet
        "resource_code": "Resource Code",
        "fiscal_year": "Fiscal Year",
        "resource_name": "Name",
        "resource_type_rid": "Resource Type",
        "effective_from": "Effective Date",
        "end_date": "End Date",
        "currency_rid": "Currency",
        "effort_in_hrs": "Effort In Hours",
        "salary": "Salary",
        "bonus": "Bonus",
        "insurance": "Insurance",
        "deductions": "Deductions",
        "resource_cost": "Resource Cost",                     // Assuming 'Cost' corresponds to 'Total Cost' in permissions
        "resource_orgname": "Org Name",
        "resource_designation": "Designation",
        "resource_role": "Role",
        "comments": "Comments",
        "status_rid": "Status",
        "r_number": "Cost ID",                 // Assuming 'Cost ID' is same as 'Resource ID'
      };

      let exportData = rawResult.map((resource: any) => {
         const exportData: Record<string, string> = {};   
        let resultMap = {
          "account_name": resource.account_name || "-",
          "resource_code": resource.resource_code || "-",
          "fiscal_year": resource.fiscal_year || "-",
          "resource_name": resource.resource_name || "-",
          "resource_type_rid": resource.resource_type_name || "-",
          "effective_from": resource.effective_from || "-",
          "end_date": resource.end_date || "-",
          "currency_rid": resource.currency_code || "USD",
          "effort_in_hrs": resource.effort_in_hrs || "-",
          "salary": formatNumberForExport(resource.salary , resource.currency_symbol) || "-",
          "bonus": formatNumberForExport(resource.bonus , resource.currency_symbol) || "-",
          "insurance": formatNumberForExport(resource.insurance , resource.currency_symbol) || "-",
          "deductions": formatNumberForExport(resource.deductions , resource.currency_symbol) || "-",
          "resource_cost": formatNumberForExport(resource.resource_cost , resource.currency_symbol) || "-",
          "resource_orgname": resource.resource_orgname || "-",
          "resource_designation": resource.resource_designation || "-",
          "resource_role": resource.resource_role || "-",
          "comments": resource.comments || "-",
          "status_rid": resource.status_name || "-",
          "r_number": resource.r_number || "-"
        };
        for (const [field, value] of Object.entries(resultMap)) {
          if (allowedFieldSet.has(field)) {
            exportData[labelMap[field]] = value;
          }
         }
         return exportData
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
  buildSearchConditionForFinancialHighlights(search: string): string {
    if (!search) return "";

    return `
      AND (
        rc.r_number ILIKE :searchTerm 
        OR r.resource_full_name ILIKE :searchTerm
      )
    `;
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
  buildFilterConditionsForFinancialHighlights(
    filters: Record<string, any>,
    fiscalYear: number
  ): string {
    let filterConditions = "";

    if (filters && Object.keys(filters).length > 0) {
      filterConditions = this.processFiltersForRawQueryForFinancialHighlights(filters);
    }

    if (fiscalYear === 0 || fiscalYear === undefined) {
      return filterConditions;
    }

    const fiscalYearCondition = `
      AND prf.fiscal_year = ${fiscalYear}`;

    // Add fiscal year condition to filter conditions
    filterConditions += fiscalYearCondition;

    return filterConditions;
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
  getSortParametersForFinancialHighlights( sortBy: string,sortOrder: string): [string, string] {
    const validSortColumns = [
      "project_code",
      "fiscal_year",
      "r_number",
      "project_name",
      "resource_code",
      "resource_name",
      "resource_type_name",
      "country_code",
      "total_cost_pro_res",
      "rd_percent_final",
      "qre_final",
      "rd_credits_total",
    ];
    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
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
      "resource_type_rid",
      "resource_code",
      "resource_orgname",
      "resource_role",
      "resource_designation",
      "status_name",
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
    const alphanumericFields = ["resource_code"];
    const multiValueFields = ["status_rid"]
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
         } else if (multiValueFields.includes(key)) {
          filterConditions += this.processDefaultFilter(key, value);
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

  // Include the rest of your filter processing methods here...
  processFiltersForRawQueryForFinancialHighlights(filters: Record<string, any>): string {
    // Your existing implementation
    let filterConditions = "";

    // Define field types for proper filter handling
    const alphanumericFields = [
      "project_code",
      "r_number",
      "project_name",
      "resource_code",
      "resource_name",
    ];
    const numericFields = [
      "fiscal_year",
      "total_cost_pro_res",
      "rd_percent_final",
      "qre_final",
      "rd_credits_total"
    ];

    // Process each filter
    Object.entries(filters).forEach(([key, value]) => {

      // Handle different filter types based on field type
      if (typeof value === "object") {
        if (alphanumericFields.includes(key)) {
          filterConditions += this.processAlphanumericFilterForFinancialHighlights(key, value);
        } else if (numericFields.includes(key)) {
          filterConditions += this.processNumericFilterForFinancialHighlights(key, value);
        } else {
          filterConditions += this.processDefaultFilterForFinancialHighlights(key, value);
        }
      } else if (value !== undefined && value !== null) {
        // Simple equality
        filterConditions += this.processSimpleEqualityFilter(key, value);
      }
    });

    return filterConditions;
  }

processAlphanumericFilterForFinancialHighlights(key: string, value: any): string {
  let condition = "";

  // Determine the correct table alias
  const table =
    ["resource_code", "resource_name"].includes(key)
      ? "r"
      : ["project_code", "r_number", "project_name"].includes(key)
      ? "pf"
      : "prf";

  if (value.equals) {
    condition += ` AND LOWER(${table}."${key}") = LOWER('${value.equals}')`;
  } else if (value.not_equals) {
    condition += ` AND (LOWER(${table}."${key}") != LOWER('${value.not_equals}') OR ${table}."${key}" IS NULL)`;
  } else if (value.contains) {
    condition += ` AND LOWER(${table}."${key}") LIKE LOWER('%${value.contains}%')`;
  } else if (value.not_contains) {
    condition += ` AND LOWER(${table}."${key}") NOT LIKE LOWER('%${value.not_contains}%')`;
  } else if (value.starts_with) {
    condition += ` AND LOWER(${table}."${key}") LIKE LOWER('${value.starts_with}%')`;
  } else if (value.ends_with) {
    condition += ` AND LOWER(${table}."${key}") LIKE LOWER('%${value.ends_with}')`;
  } else if (value.is_empty !== undefined) {
    if (value.is_empty) {
      condition += ` AND (${table}."${key}" IS NULL OR ${table}."${key}" = '')`;
    }
  } else if (value.is_not_empty !== undefined) {
    if (value.is_not_empty) {
      condition += ` AND ${table}."${key}" IS NOT NULL AND ${table}."${key}" != ''`;
    }
  } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
    const values = value.in
      .map((item: string) => `'${item.toLowerCase()}'`)
      .join(",");
    condition += ` AND LOWER(${table}."${key}") IN (${values})`;
  } else if (
    value.not_in &&
    Array.isArray(value.not_in) &&
    value.not_in.length > 0
  ) {
    const values = value.not_in
      .map((item: string) => `'${item.toLowerCase()}'`)
      .join(",");
    condition += ` AND LOWER(${table}."${key}") NOT IN (${values})`;
  }

  return condition;
}

  processAlphanumericFilter(key: string, value: any): string {
    let condition = "";

    if (value.equals) {
      condition += ` AND LOWER(rc."${key}") = LOWER('${value.equals}')`;
    } else if (value.not_equals) {
      condition += ` AND (LOWER(rc."${key}") != LOWER('${value.not_equals}') OR rc."${key}" IS NULL)`;
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

  processNumericFilterForFinancialHighlights(key: string, value: any): string {
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
      condition += ` AND prf."${key}" = ${value.equals}`;
    } else if (value.not_equals !== undefined) {
      condition += ` AND (prf."${key}" != ${value.not_equals} OR prf."${key}" IS NULL)`;
    } else if (value.greater_than !== undefined) {
      condition += ` AND prf."${key}" > ${value.greater_than}`;
    } else if (value.less_than !== undefined) {
      condition += ` AND prf."${key}" < ${value.less_than}`;
    } else if (
      value.between &&
      Array.isArray(value.between) &&
      value.between.length === 2
    ) {
      condition += ` AND prf."${key}" BETWEEN ${value.between[0]} AND ${value.between[1]}`;
    } else if (value.is_empty !== undefined) {
      if (value.is_empty) {
        condition += ` AND prf."${key}" IS NULL`;
      }
    } else if (value.is_not_empty !== undefined) {
      if (value.is_not_empty) {
        condition += ` AND prf."${key}" IS NOT NULL`;
      }
    } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
      const values = value.in.join(",");
      condition += ` AND prf."${key}" IN (${values})`;
    } else if (
      value.not_in &&
      Array.isArray(value.not_in) &&
      value.not_in.length > 0
    ) {
      const values = value.not_in.join(",");
      condition += ` AND prf."${key}" NOT IN (${values})`;
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
      condition += ` AND (rc."${key}" != ${value.not_equals} OR rc."${key}" IS NULL)`;
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
      condition += ` AND (rc."${key}"::date != '${value.not_equals}'::date OR rc."${key}" IS NULL)`;
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
  processDefaultFilterForFinancialHighlights(key: string, value: any): string {
    let tableAlias = "prf";
    
  // Set alias based on key
  const aliasMapR = ["resource_code","resource_name","resource_type_rid"];
  const aliasMapAD = ["project_name","project_code","r_number"];

  if (aliasMapR.includes(key)) {
    tableAlias = "r";
  } else if (aliasMapAD.includes(key)) {
    tableAlias = "pf";
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
          condition += ` AND (${tableAlias}."${key}" != '${value.not_equals}' OR ${tableAlias}."${key}" IS NULL)`;
        } else {
          condition += ` AND LOWER(${tableAlias}."${key}") != LOWER('${value.not_equals}') OR ${tableAlias}."${key}" IS NULL`;
        }
      } else {
        condition += ` AND (${tableAlias}."${key}" != ${value.not_equals} OR ${tableAlias}."${key}" IS NULL)`;
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
          condition += ` AND (${tableAlias}."${key}" != '${value.not_equals}' OR ${tableAlias}."${key}" IS NULL)`;
        } else {
          condition += ` AND LOWER(${tableAlias}."${key}") != LOWER('${value.not_equals}') OR ${tableAlias}."${key}" IS NULL`;
        }
      } else {
        condition += ` AND (${tableAlias}."${key}" != ${value.not_equals} OR ${tableAlias}."${key}" IS NULL)`;
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
        condition += ` AND (LOWER(rc."r_number") != LOWER('${resourceCostNumber.not_equals}') OR rc."r_number" IS NULL)`;
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
    const query = `SELECT a.currency_rid FROM ${MAIN_SCHEMA_NAME}.account a WHERE a.rid = :accountRid`;
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
async assignResourceStatusandType(
  result: any,
  statusMap: Map<string, string>,
  resourceTypeMap: Map<string, string>,
): Promise<void> {
  if (result.status_rid) {
    result.status_name = statusMap.get(result.status_rid) || "Unknown";
  }
  if (result.resource_type_rid) {
    result.resource_type_name = resourceTypeMap.get(result.resource_type_rid) || "Unknown";
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
            `SELECT c.rid FROM ${MAIN_SCHEMA_NAME}.currency c WHERE c.currency_code = 'USD'`,
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
