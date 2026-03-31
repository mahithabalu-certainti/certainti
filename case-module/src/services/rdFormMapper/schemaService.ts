import { initMainDbSequelize } from "../../config/mainDataSource";
import { Sequelize, where } from "sequelize";
import { initOrgSequelize } from "../../config/orgDataSource";
import { MAIN_SCHEMA_NAME, rawQueries } from "../../utils/constants";
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
    errorMessage: string,
  ): Promise<void> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);
    await orgDb.query(rawQueries.updateFederalFormError(schemaName), {
      replacements: { caseRid, countryRid, errorMessage },
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
    errorMessage: string,
  ): Promise<void> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);
    await orgDb.query(rawQueries.updateStateFormError(schemaName), {
      replacements: { caseRid, countryRid, stateRid, errorMessage },
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
   * Fetch field value from a reference table dynamically.
   *
   * All WHERE conditions are built from `where_filters` on the
   * data_mapper_objects row — no table names are hardcoded here.
   *
   *  mapperMeta field  │ data_mapper_objects column │ purpose
   *  ──────────────────┼────────────────────────────┼────────────────────────────────────
   *  db_source         │ db_source        VARCHAR   │ "org" (default) | "main"
   *  schema_override   │ schema_override   VARCHAR   │ fixed schema override
   *  where_filters     │ where_filters     JSONB     │ [{ column, context_key }]
   *
   * where_filters drives the WHERE clause for every path (JSON / non-JSON /
   * fetchDynamicFieldValues), so where_column and is_state_table are not needed.
   *
   * Legacy hardcoded fallbacks remain for unmigrated rows (NULL mapperMeta).
   */
  async fetchFieldValueFromRefTable(
    refTable: string,
    fieldName: string,
    is_json: boolean,
    case_rid: string,
    schemaName: string,
    account_rid: string,
    stateRid?: string,
    mapperMeta?: {
      db_source?: "org" | "main" | null;
      where_filters?: Array<{ column: string; context_key: string }> | null;
    },
  ): Promise<any> {
    const orgDb  = await this.getOrgDb();
    const mainDb = await this.getMainDb();
    logMessage(`Fetching field: ${fieldName} from ${refTable} (JSON: ${is_json})`);

    // ── DB / schema resolution ────────────────────────────────────────────────
    const dbSource        = mapperMeta?.db_source ?? (refTable === "account" ? "main" : "org");
    const effectiveSchema = (mapperMeta?.db_source != null)
      ? (mapperMeta.db_source === "main" ? MAIN_SCHEMA_NAME : schemaName)
      : (refTable === "account" ? MAIN_SCHEMA_NAME : schemaName);

    const db = dbSource === "main" ? mainDb : orgDb;

    // ── context_key → runtime value ───────────────────────────────────────────
    const contextMap: Record<string, any> = {
      case_rid,
      account_rid,
      state_rid: stateRid,
      rid:       account_rid,
    };

    /**
     * Build { replacements, whereClause } from where_filters.
     *
     * Each filter element: { column: "t.case_rid", context_key: "case_rid" }
     * Only filters whose runtime value is non-empty are included.
     *
     * Falls back to legacy per-table bindings for unmigrated rows.
     */
    const buildWhereAndReplacements = (): {
      whereClause: string;
      replacements: Record<string, any>;
    } => {
      if (mapperMeta?.where_filters && mapperMeta.where_filters.length > 0) {
        const conditions: string[] = [];
        const replacements: Record<string, any> = {};

        for (const f of mapperMeta.where_filters) {
          const value = contextMap[f.context_key];
          if (value !== undefined && value !== null && value !== "") {
            // where_filters columns are stored with "t." prefix for fetchTableValues
            // (which aliases the table as "t"). Strip it here since this query
            // selects directly from the table with no alias.
            const col = f.column.replace(/^t\./, "");
            conditions.push(`${col} = :${f.context_key}`);
            replacements[f.context_key] = value;
          }
        }

        return {
          whereClause:  conditions.join(" AND "),
          replacements,
        };
      }

      // ── Legacy fallback (unmigrated rows) ─────────────────────────────────
      // if (refTable === "account") {
      //   return {
      //     whereClause:  "t.rid = :rid",
      //     replacements: { rid: account_rid },
      //   };
      // }
      // if (refTable === "rd_credit_country_calculations") {
      //   return {
      //     whereClause:  "t.case_rid = :case_rid",
      //     replacements: { case_rid },
      //   };
      // }
      // if (refTable === "rd_credit_state_calculations") {
      //   return {
      //     whereClause:  "t.case_rid = :case_rid AND t.state_rid = :state_rid",
      //     replacements: { case_rid, state_rid: stateRid },
      //   };
      // }
      // default
      return {
        whereClause:  "",
        replacements: {  },
      };
    };

    const { whereClause, replacements } = buildWhereAndReplacements();

    if (is_json) {
      let jsonPath = fieldName
        .replace(/^\$\.computed_fields\.computed_fields\./, "$.computed_fields.")
        .replace(/^\$\.computed_fields\./, "$.computed_fields.");

      // Determine JSON column (computed_fields vs config_json)
      const usesConfigJson  = jsonPath.startsWith("$.config_json");
      const jsonColumn      = usesConfigJson ? "config_json" : "computed_fields";
      const normalizedPath  = usesConfigJson
        ? `$.${jsonPath.replace(/^\$\.config_json\.?/, "")}`
        : jsonPath;

      const buildJsonQuery = (quotedPath: string) => `
        SELECT jsonb_path_query_first(${jsonColumn}, '${quotedPath}')::text AS field_value
        FROM ${effectiveSchema}.${refTable}
        WHERE ${whereClause}
        LIMIT 1`;

      // Direct attempt
      try {
        const quotedPath = this.quoteJsonPath(normalizedPath);
        const [directResults] = await db.query(
          buildJsonQuery(quotedPath),
          { replacements, raw: true },
        );
        const directResultsArray = directResults as any[];
        const directValue = directResultsArray.length > 0
          ? directResultsArray[0].field_value
          : null;

        if (directValue !== null && directValue !== "null" && directValue !== undefined) {
          logMessage(`Direct field retrieval successful for ${refTable}.${fieldName}: ${directValue}`);
          return directValue;
        }

        // Fallback: strip computed_fields prefix and retry
        if (directValue === null || directValue === "null") {
          const fallbackPath = normalizedPath.replace(/^\$\.computed_fields\./, "$.");
          if (fallbackPath !== normalizedPath) {
            const [fallbackResults] = await db.query(
              buildJsonQuery(this.quoteJsonPath(fallbackPath)),
              { replacements, raw: true },
            );
            const fallbackResultsArray = fallbackResults as any[];
            const fallbackValue = fallbackResultsArray.length > 0
              ? fallbackResultsArray[0].field_value
              : null;

            if (fallbackValue !== null && fallbackValue !== "null" && fallbackValue !== undefined) {
              logMessage(`Fallback field retrieval successful for ${refTable}.${fieldName}: ${fallbackValue}`);
              return fallbackValue;
            }
          }
          logMessage(`Field ${fieldName} has null value, returning empty string`);
          return "";
        }
      } catch (error) {
        logMessage(`Direct query failed for ${fieldName}: ${error}`);
      }

      // Final fallback query (re-used if try block above threw)
      const fallbackQuery = buildJsonQuery(this.quoteJsonPath(normalizedPath));
      try {
        const [results] = await db.query(fallbackQuery, { replacements, raw: true });
        const resultsArray = results as any[];
        logMessage(`Query results from ${refTable}.${fieldName}: ${JSON.stringify(resultsArray)}`);
        const fieldValue = resultsArray.length > 0 ? resultsArray[0].field_value : null;
        return fieldValue !== null && fieldValue !== undefined ? fieldValue : "";
      } catch (error) {
        console.error(`Error fetching from ${refTable}.${fieldName}:`, error);
        return "";
      }
    }

    // ── Non-JSON (regular column) ─────────────────────────────────────────────
    const query = `
      SELECT ${fieldName} AS field_value
      FROM ${effectiveSchema}.${refTable}
      WHERE ${whereClause}
      LIMIT 1`;

    try {
      const [results] = await db.query(query, { replacements, raw: true });
      const resultsArray = results as any[];
      logMessage(`Query results from ${refTable}.${fieldName}: ${JSON.stringify(resultsArray)}`);
      const fieldValue = resultsArray.length > 0 ? resultsArray[0].field_value : null;
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
   * Fetch all values from a table field as a list (used for Table-Item field types).
   *
   * WHERE / JOIN / fiscal-year behaviour is fully driven by four JSONB/VARCHAR
   * columns on the data_mapper_objects row — no table names are hardcoded here.
   *
   *  param               │ data_mapper_objects column  │ description
   *  ────────────────────┼─────────────────────────────┼──────────────────────────────────────────
   *  where_filters       │ where_filters     JSONB      │ [{ column, context_key }] — WHERE bindings
   *  joins               │ joins             JSONB      │ [{ join_table, join_condition, join_alias?, join_type? }]
   *  extra_filters       │ extra_filters     JSONB      │ ["raw SQL condition", ...] — appended with AND
   *  fiscal_year_column  │ fiscal_year_column VARCHAR   │ full col ref, e.g. "pf.fiscal_year"
   *  db_source           │ db_source         VARCHAR    │ "org" (default) | "main"
   *  schema_override     │ schema_override   VARCHAR    │ fixed schema override
   */
  async fetchTableValues(
    refTable: string,
    fieldName: string,
    is_json: boolean,
    data_order_by: string,
    account_rid: string,
    case_rid: string,
    schemaName: string,
    stateRid: string,
    fiscalYear?: string,
    where_filters?: Array<{ column: string; context_key: string }> | null,
    joins?: Array<{
      join_table: string;
      join_condition: string;
      join_alias?: string;
      join_type?: string;
    }> | null,
    extra_filters?: string[] | null,
    fiscal_year_column?: string | null,
    db_source?: "org" | "main" | null
  ): Promise<any[]> {
    const orgDb  = await this.getOrgDb();
    const mainDb = await this.getMainDb();
    logMessage(
      `Fetching table values for field: ${fieldName} from ${refTable} (JSON: ${is_json}, Fiscal Year: ${fiscalYear})`,
    );

    // ── DB and schema resolution (data-driven, legacy fallback retained) ──────
    const dbSource        = db_source        ?? (refTable === "account" ? "main" : "org");
    const effectiveSchema = (db_source != null)
      ? db_source === "main" ? MAIN_SCHEMA_NAME : schemaName
      : (refTable === "account" ? MAIN_SCHEMA_NAME : schemaName);
    const db = dbSource === "main" ? mainDb : orgDb;

    // ── Runtime context — maps context_key → actual value ─────────────────────
    const contextMap: Record<string, any> = {
      case_rid,
      account_rid,
      state_rid: stateRid,
      rid: account_rid,   // "rid" → account PK (account table)
    };

    // ── Build WHERE clause ────────────────────────────────────────────────────
    const buildWhereClause = (): { whereClause: string; replacements: Record<string, any> } => {
      const conditions: string[] = [];
      const replacements: Record<string, any> = {};

      // Context-bound filters from where_filters
      if (where_filters && where_filters.length > 0) {
        for (const f of where_filters) {
          const value = contextMap[f.context_key];
          if (value !== undefined && value !== null && value !== "") {
            conditions.push(`${f.column} = :${f.context_key}`);
            replacements[f.context_key] = value;
          }
        }
      }

      // Raw static conditions from extra_filters
      if (extra_filters && extra_filters.length > 0) {
        for (const raw of extra_filters) {
          conditions.push(raw);
        }
      }

      // Fiscal year filter — only applied when fiscal_year_column is explicitly
      // set on the data_mapper_objects row. Tables like case_history_submission
      // that filter by account_rid/state_rid must leave fiscal_year_column NULL
      // so this block is skipped entirely for them.
      if (fiscalYear && fiscal_year_column) {
        conditions.push(`${fiscal_year_column} = :fiscalYear`);
        replacements.fiscalYear = fiscalYear;
      }

      return {
        whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
        replacements,
      };
    };

    // ── Build FROM + JOIN clauses ──────────────────────────────────────────────
    const buildFromClause = (): string => {
      let from = `FROM ${effectiveSchema}.${refTable} t`;

      if (joins && joins.length > 0) {
        for (const j of joins) {
          const joinType  = j.join_type  ?? "INNER JOIN";
          const joinAlias = j.join_alias ?? j.join_table;
          from += `\n        ${joinType} ${effectiveSchema}.${j.join_table} ${joinAlias}`;
          from += `\n          ON ${j.join_condition}`;
        }
      }

      return from;
    };

    try {
      const { whereClause, replacements } = buildWhereClause();
      const fromClause   = buildFromClause();
      const orderByField = data_order_by || "created_datetime";

      let query: string;

      if (is_json) {
        const jsonPath       = fieldName.replace(/^\$\.computed_fields\./, "$.");
        const quotedJsonPath = this.quoteJsonPath(jsonPath);
        query = `
          SELECT
            jsonb_path_query(t.computed_fields, '${quotedJsonPath}')::text AS field_value,
            ROW_NUMBER() OVER (ORDER BY t.${orderByField} ASC) AS row_index
          ${fromClause}
          ${whereClause}
          ORDER BY t.${orderByField} ASC`;
      } else {
        query = `
          SELECT
            t.${fieldName} AS field_value,
            ROW_NUMBER() OVER (ORDER BY t.${orderByField} ASC) AS row_index
          ${fromClause}
          ${whereClause}
          ORDER BY t.${orderByField} ASC`;
      }

      logMessage(`Executing query: ${query}`);
      logMessage(`Replacements: ${JSON.stringify(replacements)}`);

      const [queryResults] = await db.query(query, { replacements, raw: true });

      // Special handling for industry_rid: resolve RID → human-readable name
      if (fieldName === "industry_rid") {
        const rawRows   = queryResults as any[];
        const uniqueRids = [
          ...new Set(
            rawRows
              .map((r: any) => r.field_value)
              .filter((v: any) => v !== null && v !== undefined && v !== ""),
          ),
        ] as string[];

        const ridToName: Record<string, string> = {};
        if (uniqueRids.length > 0) {
          try {
            const placeholders    = uniqueRids.map((_: string, i: number) => `:rid_${i}`).join(", ");
            const ridReplacements: Record<string, string> = {};
            uniqueRids.forEach((rid: string, i: number) => { ridReplacements[`rid_${i}`] = rid; });

            const industryQuery = `
              SELECT rid, industry_name
              FROM ${MAIN_SCHEMA_NAME}.industry
              WHERE rid IN (${placeholders})
            `;
            const [industryRows] = await mainDb.query(industryQuery, {
              replacements: ridReplacements,
              raw: true,
            });
            (industryRows as any[]).forEach((row: any) => {
              if (row.rid && row.industry_name) ridToName[row.rid] = row.industry_name;
            });
            logMessage(`Resolved ${Object.keys(ridToName).length} industry name(s) for industry_rid field`);
          } catch (err) {
            logMessage(`Error resolving industry names for industry_rid: ${err}`);
          }
        }

        const results = rawRows.map((row: any, index: number) => ({
          value:      ridToName[row.field_value] ?? row.field_value,
          index:      index + 1,
          row_number: index + 1,
        }));
        logMessage(`Retrieved ${results.length} table values for ${refTable}.${fieldName}`);
        return results;
      }

      const results = (queryResults as any[]).map((row: any, index: number) => ({
        value:      row.field_value,
        index:      index + 1,
        row_number: index + 1,
      }));
      logMessage(`Retrieved ${results.length} table values for ${refTable}.${fieldName}`);
      return results;
    } catch (error) {
      logMessage(`Error fetching table values from ${refTable}.${fieldName}: ${JSON.stringify(error)}`);
      return [];
    }
  }

// Extracted as a private method — was previously defined inline
private quoteJsonPath(path: string): string {
  const parts: string[] = [];
  let buffer = "";
  let bracketDepth = 0;
  let inQuotes = false;
  let quoteChar = "";

  const processPath = path.startsWith("$.") ? path.substring(2) : path;

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

  const quotedParts = parts
    .map((part) => {
      if (part.startsWith("[")) return part;
      if (
        (part.startsWith('"') && part.endsWith('"')) ||
        (part.startsWith("'") && part.endsWith("'"))
      )
        return part;
      if (/[^a-zA-Z0-9_]/.test(part)) return `"${part}"`;
      return part;
    })
    .filter((part) => part.length > 0);

  return "$." + quotedParts.join(".");
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