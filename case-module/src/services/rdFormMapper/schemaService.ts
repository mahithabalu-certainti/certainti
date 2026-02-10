import { initMainDbSequelize } from "../../config/mainDataSource";
import { Sequelize } from "sequelize";
import { initOrgSequelize } from "../../config/orgDataSource";
import { rawQueries } from "../../utils/constants";
import { logMessage } from "../../utils/helpers";

class RdFormMapperSchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;

  constructor() {}
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

  async getRdFormMapperConfigurations(formId: string): Promise<any> {
    const mainDb = await this.getMainDb();
    const query = rawQueries.fetchRdFormMapperConfigurations(formId);
    const [results] = await mainDb.query(query, {
      replacements: { formId },
      raw: true,
    });
    return results;
  }

  async saveFederalFilledFormUrl(
    caseRid: string,
    countryRid: string,
    filledFormUrl: string,
    orgDb: Sequelize,
    accountNumber: string,
  ): Promise<void> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);
    await orgDb.query(rawQueries.saveFederalFilledFormUrl(schemaName), {
      replacements: { filledFormUrl, caseRid, countryRid },
      raw: true,
    });
    logMessage(`Filled form URL saved for case RID: ${caseRid}`);
  }

  async updateFederalFormError(
    caseRid: string,
    countryRid: string,
    orgDb: Sequelize,
    accountNumber: string,
  ): Promise<void> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);
    await orgDb.query(rawQueries.updateFederalFormError(schemaName), {
      replacements: { caseRid, countryRid },
      raw: true,
    });
    logMessage(`Federal form error updated for case RID: ${caseRid}`);
  }

  async updateStateFormError(
    caseRid: string,
    countryRid: string,
    stateRid: string,
    orgDb: Sequelize,
    accountNumber: string,
  ): Promise<void> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);
    await orgDb.query(rawQueries.updateStateFormError(schemaName), {
      replacements: { caseRid, countryRid, stateRid },
      raw: true,
    });
    logMessage(`State form error updated for case RID: ${caseRid}`);
  }

  async getFederalFormUrl(
    caseRid: string,
    countryRid: string,
    orgDb: Sequelize,
    accountNumber: string,
  ): Promise<{
    filled_form_url: string | null;
    form_error_message: string | null;
  }> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);

    const [results]: any = await orgDb.query(
      rawQueries.fetchFederalFormUrl(schemaName),
      {
        replacements: { caseRid, countryRid },
        raw: true,
      },
    );
    if (Array.isArray(results) && results.length > 0) {
      return {
        filled_form_url: results[0].rd_form_url || null,
        form_error_message: results[0].form_error_message || null,
      };
    }
    return {
      filled_form_url: null,
      form_error_message: null,
    };
  }
  async getStateFormUrl(
    caseRid: string,
    stateRid: string,
    orgDb: Sequelize,
    accountNumber: string,
  ): Promise<{
    filled_form_url: string | null;
    form_error_message: string | null;
  } | null> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);
    const [results]: any = await orgDb.query(
      rawQueries.fetchStateFormUrl(schemaName),
      {
        replacements: { caseRid, stateRid },
        raw: true,
      },
    );
    if (Array.isArray(results) && results.length > 0) {
      return {
        filled_form_url: results[0].rd_form_url || null,
        form_error_message: results[0].form_error_message || null,
      };
    }
    return {
      filled_form_url: null,
      form_error_message: null,
    };
  }
  async saveStateFilledFormUrl(
    caseRid: string,
    stateRid: string,
    filledFormUrl: string,
    orgDb: Sequelize,
    accountNumber: string,
  ): Promise<void> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);
    await orgDb.query(rawQueries.saveStateFilledFormUrl(schemaName), {
      replacements: { filledFormUrl, caseRid, stateRid },
      raw: true,
    });
    logMessage(`Filled form URL saved for case RID: ${caseRid}`);
  }

  /**
   * Get data mapper objects with reference table and field information
   */
  async getDataMapperObjects(
    country_rid: string,
    form_rid?: string,
  ): Promise<any> {
    const mainDb = await this.getMainDb();
    const [results] = await mainDb.query(rawQueries.getDataMapperObjects(), {
      replacements: { country_rid, form_rid },
      raw: true,
    });
    return results;
  }

  /**
   * Get data mapper object by RID
   */
  async getDataMapperObjectByRid(rid: string): Promise<any> {
    const mainDb = await this.getMainDb();
    try {
      const [results] = await mainDb.query(
        rawQueries.getDatamapperObjectById(),
        {
          replacements: { rid },
          raw: true,
        },
      );
      if (results.length > 0) {
        return results[0];
      } else {
        logMessage(`No data mapper object found for RID: ${rid}`);
        return null;
      }
    } catch (error) {
      logMessage(`Error querying data_mapper_objects for RID ${rid}: ${error}`);
      return null;
    }
  }

  async fetchTop15ProjectQreSum(
    caseRid: string,
    schemaName: string,
  ): Promise<number> {
    const orgDb = await this.getOrgDb();
    const [results]: any = await orgDb.query(
      rawQueries.fetchTop15ProjectQreSum(schemaName, caseRid),
      { raw: true },
    );
    return Number(results?.[0]?.top_15_qre_sum ?? 0);
  }

  async fetchTop15ProjectSumByColumn(
    caseRid: string,
    schemaName: string,
    columnName: string,
  ): Promise<number> {
    const allowedColumns = new Set([
      "total_cost_fte_prj",
      "total_cost_subcon_prj",
      "total_cost_nonlabor_prj",
      "qre_final",
    ]);

    if (!allowedColumns.has(columnName)) {
      logMessage(`Rejected top-15 sum for unsupported column: ${columnName}`);
      return 0;
    }

    const orgDb = await this.getOrgDb();
    const [results]: any = await orgDb.query(
      rawQueries.fetchTop15ProjectSumByColumn(schemaName, caseRid, columnName),
      { raw: true },
    );
    return Number(results?.[0]?.top_15_sum ?? 0);
  }

  async fetchPriorYearQreFromHistory(
    accountRid: string,
    schemaName: string,
    yearIndex: number,
    effectiveStart?: string,
    stateRid?: string,
    countryRid?: string,
  ): Promise<number | null> {
    const orgDb = await this.getOrgDb();

    const normalizedIndex = Math.max(1, Math.min(4, yearIndex));
    let currentYear: number | null = null;

    if (effectiveStart) {
      const parsedYear = Number(String(effectiveStart).slice(0, 4));
      if (Number.isFinite(parsedYear)) {
        currentYear = parsedYear;
      } else {
        const parsedDate = new Date(effectiveStart);
        if (!Number.isNaN(parsedDate.getTime())) {
          currentYear = parsedDate.getFullYear();
        }
      }
    }

    if (!currentYear) {
      logMessage("Unable to resolve current fiscal year for prior-year QRE lookup");
      return null;
    }

    const targetYear = currentYear - normalizedIndex;
    const query = rawQueries.fetchPriorYearQreFromHistory(
      schemaName,
      stateRid,
      countryRid,
    );

    const [results]: any = await orgDb.query(query, {
      replacements: {
        account_rid: accountRid,
        state_rid: stateRid,
        country_rid: countryRid,
        target_year: targetYear,
      },
      raw: true,
    });

    const row = Array.isArray(results) && results.length > 0 ? results[0] : null;
    if (!row) {
      return null;
    }

    const qreValue = Number(row.total_qre ?? 0);
    return Number.isFinite(qreValue) ? qreValue : null;
  }

  /**
   * Fetch field value from reference table dynamically
   */
  async fetchFieldValueFromRefTable(
    refTable: string,
    fieldName: string,
    is_json: boolean,
    case_rid: string,
    schemaName: string,
    stateRid?: string,
  ): Promise<any> {
    const orgDb = await this.getOrgDb();
    logMessage(
      `Fetching field: ${fieldName} from ${refTable} (JSON: ${is_json})`,
    );

    let query: string;

    if (is_json) {
      // Normalize leading path segments
      let jsonPath = fieldName
        .replace(/^\$\.computed_fields\.computed_fields\./, "$.computed_fields.")
        .replace(/^\$\.computed_fields\./, "$.computed_fields.");

      // Quote only property names, leave filters/wildcards untouched
      function quoteJsonPath(path: string): string {
        const parts: string[] = [];
        let buffer = "";
        let bracketDepth = 0;
        let inQuotes = false;
        let quoteChar = "";

        // Remove leading $. if present
        let processPath = path.startsWith("$.") ? path.substring(2) : path;

        for (let i = 0; i < processPath.length; i++) {
          const ch = processPath[i];

          if ((ch === '"' || ch === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = ch;
            buffer += ch;
            continue;
          }

          if (ch === quoteChar && inQuotes) {
            inQuotes = false;
            quoteChar = "";
            buffer += ch;
            continue;
          }

          if (ch === "[") bracketDepth++;
          if (ch === "]") bracketDepth--;

          if (ch === "." && bracketDepth === 0 && !inQuotes) {
            if (buffer) {
              parts.push(buffer);
              buffer = "";
            }
          } else {
            buffer += ch;
          }
        }
        if (buffer) parts.push(buffer);

        const quotedParts = parts.map((part) => {
          // Leave filters/wildcards untouched
          if (part.startsWith("[")) return part;
          // Already quoted
          if (
            (part.startsWith('"') && part.endsWith('"')) ||
            (part.startsWith("'") && part.endsWith("'"))
          )
            return part;
          // Quote names with spaces/special chars
          if (/[^a-zA-Z0-9_]/.test(part)) return `"${part}"`;
          return part;
        });

        const filteredParts = quotedParts.filter((part) => part.length > 0);
        return "$." + filteredParts.join(".");
      }

      // First, try direct value retrieval
      const quotedJsonPath = quoteJsonPath(jsonPath);

      // Execute the direct query first
      try {
        const [directResults] = await orgDb.query(
          rawQueries.fetchDynamicFieldValues(
            schemaName,
            refTable,
            quotedJsonPath,
            stateRid,
          ),
          {
            replacements: { case_rid, state_rid: stateRid },
            raw: true,
          },
        );
        const directResultsArray = directResults as any[];
        const directValue =
          directResultsArray.length > 0
            ? directResultsArray[0].field_value
            : null;

        // If direct value found and not null, return it
        if (
          directValue !== null &&
          directValue !== "null" &&
          directValue !== undefined
        ) {
          logMessage(
            `Direct field retrieval successful for ${refTable}.${fieldName}: ${directValue}`,
          );
          return directValue;
        }

        // If direct value is null, attempt fallback without computed_fields prefix
        if (directValue === null || directValue === "null") {
          const fallbackPath = jsonPath.replace(/^\$\.computed_fields\./, "$." );
          if (fallbackPath !== jsonPath) {
            const quotedFallbackPath = quoteJsonPath(fallbackPath);
            const [fallbackResults] = await orgDb.query(
              rawQueries.fetchDynamicFieldValues(
                schemaName,
                refTable,
                quotedFallbackPath,
                stateRid,
              ),
              {
                replacements: { case_rid, state_rid: stateRid },
                raw: true,
              },
            );
            const fallbackResultsArray = fallbackResults as any[];
            const fallbackValue =
              fallbackResultsArray.length > 0
                ? fallbackResultsArray[0].field_value
                : null;

            if (
              fallbackValue !== null &&
              fallbackValue !== "null" &&
              fallbackValue !== undefined
            ) {
              logMessage(
                `Fallback field retrieval successful for ${refTable}.${fieldName}: ${fallbackValue}`,
              );
              return fallbackValue;
            }
          }

          logMessage(
            `Field ${fieldName} has null value, returning empty string`,
          );
          return "";
        }
      } catch (error) {
        logMessage(
          `Direct query failed for ${fieldName}: ${error}`,
        );
      }

      const quotedJsonPathFallback = quoteJsonPath(jsonPath);
      query = `
        SELECT jsonb_path_query_first(computed_fields, '${quotedJsonPathFallback}')::text AS field_value
        FROM ${schemaName}.${refTable}
        WHERE case_rid = :case_rid
        LIMIT 1`;
    } else {
      // Regular field
      const whereColumn =
        refTable === "rd_credit_country_calculations" ? "case_rid" : "rid";
      query = `
        SELECT ${fieldName} AS field_value
        FROM ${schemaName}.${refTable}
        WHERE ${whereColumn} = :case_rid
        LIMIT 1`;
    }

    try {
      const [results] = await orgDb.query(query, {
        replacements: { case_rid },
        raw: true,
      });
      const resultsArray = results as any[];
      logMessage(
        `Query results from ${refTable}.${fieldName}: ${JSON.stringify(resultsArray)}`,
      );
      const fieldValue =
        resultsArray.length > 0 ? resultsArray[0].field_value : null;
      return fieldValue !== null && fieldValue !== undefined ? fieldValue : "";
    } catch (error) {
      console.error(`Error fetching from ${refTable}.${fieldName}:`, error);
      return "";
    }
  }

  async findAvailableCountryAndState(
    accountNumber: string,
    orgDb: Sequelize,
    caseRid: string,
  ): Promise<{ hasFederal: boolean; hasState: boolean; states?: string[] }> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);
    const [results]: any = await orgDb.query(
      rawQueries.fetchConfiguration(schemaName, caseRid),
      { raw: true },
    );
    const result =
      Array.isArray(results) && results.length > 0 ? results[0] : {};
    return {
      hasFederal: result.is_federal_level || false,
      hasState: result.is_state_level || false,
      states: result.states || [],
    };
  }

  async getFederalForms(
    accountRid: string,
    countryRid: string,
    mainDb: Sequelize,
    effectiveStart: string,
    effectiveEnd: string,
  ) {
    try {
      logMessage(`Fetching Federal Forms for Country RID: ${countryRid}`);
      const [fetchFederalForms] = await mainDb.query(
        rawQueries.fetchFederalForms(countryRid, effectiveStart, effectiveEnd),
      );
      const results = fetchFederalForms as any[];
      return results.length > 0 && results[0] ? results[0] : [];
    } catch (error) {
      logMessage(`Error fetching Federal Forms : ${error}`);
      return [];
    }
  }

  async getStateForms(
    accountRid: string,
    countryRid: string,
    stateRid: string,
    mainDb: Sequelize,
    effectiveStart: string,
    effectiveEnd: string,
  ) {
    try {
      logMessage(`Fetching State Forms for Country RID: ${countryRid}`);
      const [fetchStateForms] = await mainDb.query(
        rawQueries.fetchStateForms(
          countryRid,
          stateRid,
          effectiveStart,
          effectiveEnd,
        ),
      );
      const results = fetchStateForms as any[];
      return results.length > 0 && results[0] ? results[0] : [];
    } catch (error) {
      logMessage(`Error fetching State Forms : ${error}`);
      return [];
    }
  }

  /**
   * Fetch all values from a table field as a list
   * For table field types, this method returns all rows of data for the specified column
   */
  async fetchTableValues(
    refTable: string,
    fieldName: string,
    is_json: boolean,
    data_order_by: string,
    account_rid: string,
    case_rid: string,
    schemaName: string,
    fiscalYear?: string,
  ): Promise<any[]> {
    const orgDb = await this.getOrgDb();
    logMessage(
      `Fetching table values for field: ${fieldName} from ${refTable} (JSON: ${is_json}, Fiscal Year: ${fiscalYear})`,
    );

    let query: string;
    let results: any[] = [];

    try {
      if (is_json) {
        // For JSON fields, extract all values from the specified JSON path
        let jsonPath = fieldName.replace(/^\$\.computed_fields\./, "$.");

        // Quote the JSON path properly
        function quoteJsonPath(path: string): string {
          const parts: string[] = [];
          let buffer = "";
          let bracketDepth = 0;
          let inQuotes = false;
          let quoteChar = "";

          // Remove leading $. if present
          let processPath = path.startsWith("$.") ? path.substring(2) : path;

          for (let i = 0; i < processPath.length; i++) {
            const ch = processPath[i];

            if ((ch === '"' || ch === "'") && !inQuotes) {
              inQuotes = true;
              quoteChar = ch;
              buffer += ch;
              continue;
            }

            if (ch === quoteChar && inQuotes) {
              inQuotes = false;
              quoteChar = "";
              buffer += ch;
              continue;
            }

            if (ch === "[") bracketDepth++;
            if (ch === "]") bracketDepth--;

            if (ch === "." && bracketDepth === 0 && !inQuotes) {
              if (buffer) {
                parts.push(buffer);
                buffer = "";
              }
            } else {
              buffer += ch;
            }
          }
          if (buffer) parts.push(buffer);

          const quotedParts = parts.map((part) => {
            // Leave filters/wildcards untouched
            if (part.startsWith("[")) return part;
            // Already quoted
            if (
              (part.startsWith('"') && part.endsWith('"')) ||
              (part.startsWith("'") && part.endsWith("'"))
            )
              return part;
            // Quote names with spaces/special chars
            if (/[^a-zA-Z0-9_]/.test(part)) return `"${part}"`;
            return part;
          });

          const filteredParts = quotedParts.filter((part) => part.length > 0);
          return "$." + filteredParts.join(".");
        }

        const quotedJsonPath = quoteJsonPath(jsonPath);

        // Query to get all values from the JSON field as an array
        let whereClause = "WHERE case_rid = :case_rid";
        let replacements: any = { case_rid };

        if (fiscalYear) {
          whereClause += " AND fiscal_year = :fiscalYear";
          replacements.fiscalYear = fiscalYear;
        }

        const orderByField = data_order_by || 'created_datetime';
        
        query = `
          SELECT 
            jsonb_path_query(computed_fields, '${quotedJsonPath}')::text as field_value,
            ROW_NUMBER() OVER (ORDER BY ${orderByField} ASC) as row_index
          FROM ${schemaName}.${refTable}
          ${whereClause}
          ORDER BY ${orderByField} ASC`;

        const [queryResults] = await orgDb.query(query, {
          replacements,
          raw: true,
        });

        results = (queryResults as any[]).map((row: any, index: number) => ({
          value: row.field_value,
          index: index + 1,
          row_number: index + 1,
        }));
      } else {
        // For regular fields, get all distinct values from the column
        let whereClause = `WHERE case_rid = :case_rid AND ${fieldName} IS NOT NULL`;
        let replacements: any = { case_rid };

        if (fiscalYear) {
          whereClause += " AND fiscal_year = :fiscalYear";
          replacements.fiscalYear = fiscalYear;
        }

        const orderByField = data_order_by || 'created_datetime';
        
        query = `
          SELECT 
            ${fieldName} AS field_value,
            ROW_NUMBER() OVER (ORDER BY ${orderByField} ASC) as row_index
          FROM ${schemaName}.${refTable}
          ${whereClause}
          ORDER BY ${orderByField} ASC`;

        const [queryResults] = await orgDb.query(query, {
          replacements,
          raw: true,
        });

        results = (queryResults as any[]).map((row: any, index: number) => ({
          value: row.field_value,
          index: index + 1,
          row_number: row.row_index,
        }));
      }

      logMessage(
        `Retrieved ${results.length} table values for ${refTable}.${fieldName}`,
      );
      return results;
    } catch (error) {
      console.error(
        `Error fetching table values from ${refTable}.${fieldName}:`,
        error,
      );
      logMessage(`Error details: ${JSON.stringify(error)}`);
      return [];
    }
  }

  /**
   * Get column ID list from data_mapper_table_mappings where rid matches the provided column ID
   */
  async getColumnIdListFromTableMappings(columnId: string): Promise<any> {
    const mainDb = await this.getMainDb();
    logMessage(
      `Fetching column ID list from data_mapper_table_mappings for column ID: ${columnId}`,
    );

    try {
      const [results] = await mainDb.query(rawQueries.getTableMappings(), {
        replacements: { columnId },
        raw: true,
      });

      const resultsArray = results as any[];

      if (resultsArray.length > 0 && resultsArray[0].column_id_list) {
        const columnIdListValue = resultsArray[0].column_id_list;
        return columnIdListValue;
      }

      logMessage(`No column ID list found for column ID: ${columnId}`);
      return null;
    } catch (error) {
      console.error(`Error fetching column ID list for ${columnId}:`, error);
      logMessage(`Error details: ${JSON.stringify(error)}`);
      return null;
    }
  }
}
export default RdFormMapperSchemaService;
