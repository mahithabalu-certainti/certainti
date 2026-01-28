import { initMainDbSequelize } from "../../config/mainDataSource";
import {
  Sequelize
} from "sequelize";
import { CaseModelService } from "../caseModelsService";
import { initOrgSequelize } from "../../config/orgDataSource";
import { rawQueries } from "../../utils/constants";
import { logMessage } from "../../utils/helpers";
import { stat } from "fs";

class RdFormMapperSchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;


  constructor() {

   
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

    async getRdFormMapperConfigurations(formId: string): Promise<any> {
    const mainDb = await this.getMainDb();
    const query = `
      SELECT distinct dmfm.field_label,field_id,calculation_config
FROM trd365.data_mapper_form_mappings dmfm
WHERE dmfm.form_rid = :formId`;
    const [results] = await mainDb.query(query, { 
      replacements: { formId },
      raw: true 
    });
    return results;
  }

  async saveFederalFilledFormUrl(caseRid: string,countryRid: string, filledFormUrl: string, orgDb: Sequelize, accountNumber: string): Promise<void> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);
    const query = `
      UPDATE ${schemaName}.rd_credit_country_calculations
      SET rd_form_url = :filledFormUrl
      WHERE case_rid = :caseRid
      and country_rid  =:countryRid`;
    await orgDb.query(query, { 
      replacements: { filledFormUrl, caseRid, countryRid },
      raw: true 
    });
    logMessage(`Filled form URL saved for case RID: ${caseRid}`);
  }

  async updateFederalFormError(caseRid: string,countryRid: string, orgDb: Sequelize, accountNumber: string): Promise<void> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);
    const query = `
      UPDATE ${schemaName}.rd_credit_country_calculations
      SET form_error_message = 'Federal form file not found'
      WHERE case_rid = :caseRid
      and country_rid  =:countryRid`;
    await orgDb.query(query, {
      replacements: { caseRid, countryRid },
      raw: true
    });
    logMessage(`Federal form error updated for case RID: ${caseRid}`);
  }

  async updateStateFormError(caseRid: string,countryRid: string,stateRid: string, orgDb: Sequelize, accountNumber: string): Promise<void> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);
    const query = `
      UPDATE ${schemaName}.rd_credit_state_calculations
      SET form_error_message = 'State form file not found'
      WHERE case_rid = :caseRid
      and country_rid  =:countryRid
      and state_rid = :stateRid`;
    await orgDb.query(query, {
      replacements: { caseRid, countryRid, stateRid },
      raw: true
    });
    logMessage(`State form error updated for case RID: ${caseRid}`);
  }

  async getFederalFormUrl(caseRid: string,countryRid: string, orgDb: Sequelize, accountNumber: string): Promise<{filled_form_url: string | null, form_error_message: string | null}> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);
    const query = `
      SELECT rd_form_url,form_error_message FROM ${schemaName}.rd_credit_country_calculations
      WHERE case_rid = :caseRid
      and country_rid  =:countryRid
      LIMIT 1`;
    const [results]: any = await orgDb.query(query, {
      replacements: { caseRid, countryRid },
      raw: true
    });
    if (Array.isArray(results) && results.length > 0) {
      return {
        filled_form_url: results[0].rd_form_url || null,
        form_error_message: results[0].form_error_message || null
      }
    }
    return {
      filled_form_url: null,
      form_error_message: null
    };
  }
  async getStateFormUrl(caseRid: string,stateRid: string, orgDb: Sequelize, accountNumber: string): Promise<{filled_form_url: string | null, form_error_message: string | null} | null> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);
    const query = `
      SELECT rd_form_url,form_error_message FROM ${schemaName}.rd_credit_state_calculations
      WHERE case_rid = :caseRid
      and state_rid  =:stateRid
      LIMIT 1`;
    const [results]: any = await orgDb.query(query, {
      replacements: { caseRid, stateRid },
      raw: true
    });
    if (Array.isArray(results) && results.length > 0) {
      return {
        filled_form_url: results[0].rd_form_url || null,
        form_error_message: results[0].form_error_message || null
      };
    }
    return {
      filled_form_url: null,
      form_error_message: null
    };
  }
  async saveStateFilledFormUrl(caseRid: string,stateRid: string, filledFormUrl: string, orgDb: Sequelize, accountNumber: string): Promise<void> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);
    const query = `
      UPDATE ${schemaName}.rd_credit_state_calculations
      SET rd_form_url = :filledFormUrl
      WHERE case_rid = :caseRid
      and state_rid  =:stateRid`;
    await orgDb.query(query, { 
      replacements: { filledFormUrl, caseRid,stateRid },
      raw: true 
    });
    logMessage(`Filled form URL saved for case RID: ${caseRid}`);
  }


  /**
   * Get data mapper objects with reference table and field information
   */
  async getDataMapperObjects(country_rid: string, form_rid?: string): Promise<any> {
    const mainDb = await this.getMainDb();
    const query = `
      SELECT 
        dmo.id,
        dmo.field_label,
        dmo.field_id,
        dmo.ref_table,
        dmo.field_name,
        dmo.where_condition,
        dmo.default_value,
        creditASC as parentObject,
        dmo.is_json
      FROM trd365.data_mapper_objects dmo
      WHERE dmo.country_rid = :country_rid
      ${form_rid ? 'AND dmo.form_rid = :form_rid' : ''}
      ORDER BY dmo.field_label`;
    
    const [results] = await mainDb.query(query, { 
      replacements: { country_rid, form_rid },
      raw: true 
    });
    return results;
  }

  /**
   * Get data mapper object by RID
   */
  async getDataMapperObjectByRid(rid: string): Promise<any> {
    console.log(`getDataMapperObjectByRid called with RID: ${rid}`);
    const mainDb = await this.getMainDb();
    const query = `
      SELECT 
        dmo.rid,
        dmo.ref_table,
        dmo.field_name,
        dmo.is_json
      FROM trd365.data_mapper_objects dmo
      WHERE dmo.rid = :rid
      LIMIT 1`;
    
    console.log(`Executing query: ${query} with RID: ${rid}`);
    try {
      const [results] = await mainDb.query(query, { 
        replacements: { rid },
        raw: true 
      });
      
      console.log(`Query results for RID ${rid}:`, results);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error querying data_mapper_objects for RID ${rid}:`, error);
      // If table doesn't exist, let's try without schema prefix
      try {
        const fallbackQuery = `
          SELECT 
            dmo.rid,
            dmo.field_name,
            dmo.ref_table
          FROM trd365.data_mapper_objects dmo
          WHERE dmo.rid = :rid
          LIMIT 1`;
        
        console.log(`Trying fallback query without schema: ${fallbackQuery}`);
        const [fallbackResults] = await mainDb.query(fallbackQuery, { 
          replacements: { rid },
          raw: true 
        });
        
        console.log(`Fallback query results for RID ${rid}:`, fallbackResults);
        return fallbackResults.length > 0 ? fallbackResults[0] : null;
      } catch (fallbackError) {
        console.error(`Fallback query also failed:`, fallbackError);
        return null;
      }
    }
  }

  /**
   * Fetch field value from reference table dynamically
   */
  async fetchFieldValueFromRefTable(
    refTable: string,
    fieldName: string,
    is_json: boolean,
    account_rid: string,
    case_rid: string
  ): Promise<any> {
    const orgDb = await this.getOrgDb();
    console.log(`Fetching field value from ${refTable}.${fieldName}   is_json: ${is_json}`);

    const schemaName = 'trd365_00891';
    let query: string;

    if (is_json) {
      // Remove leading $.
      let jsonPath = fieldName.replace(/^\$\.computed_fields\./, '$.');

      // Quote only property names, leave filters/wildcards untouched
      function quoteJsonPath(path: string): string {
        const parts: string[] = [];
        let buffer = '';
        let bracketDepth = 0;

        // Remove leading $. if present
        let processPath = path.startsWith('$.') ? path.substring(2) : path;

        for (let i = 0; i < processPath.length; i++) {
          const ch = processPath[i];

          if (ch === '[') bracketDepth++;
          if (ch === ']') bracketDepth--;

          if (ch === '.' && bracketDepth === 0) {
            if (buffer) {
              parts.push(buffer);
              buffer = '';
            }
          } else {
            buffer += ch;
          }
        }
        if (buffer) parts.push(buffer);

        const quotedParts = parts
          .map(part => {
            // Leave filters/wildcards untouched
            if (part.startsWith('[')) return part;
            // Already quoted
            if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))) return part;
            // Quote names with spaces/special chars
            if (/[^a-zA-Z0-9_]/.test(part)) return `"${part}"`;
            return part;
          });

        return '$.' + quotedParts.join('.');
      }

      // First, try direct value retrieval
      const quotedJsonPath = quoteJsonPath(jsonPath);
      console.log(`Trying direct query first: ${quotedJsonPath}`);
      
      // Execute the direct query first
      try {
        const directQuery = `
          SELECT jsonb_path_query_first(computed_fields, '${quotedJsonPath}')::text AS field_value
          FROM ${schemaName}.${refTable}
          WHERE case_rid = :case_rid
          LIMIT 1`;
          
        const [directResults] = await orgDb.query(directQuery, {
          replacements: { case_rid },
          raw: true,
        });
        const directResultsArray = directResults as any[];
        const directValue = directResultsArray.length > 0 ? directResultsArray[0].field_value : null;
        
        console.log(`Direct query result: ${directValue}`);
        
        // If direct value found and not null, return it
        if (directValue !== null && directValue !== 'null' && directValue !== undefined) {
          logMessage(`Query results from ${refTable}.${fieldName}: ${JSON.stringify(directResultsArray)}`);
          return directValue;
        }
        
        console.log(`Direct value not found, trying pattern matching...`);
      } catch (error) {
        console.log(`Direct query failed, trying pattern matching: ${error}`);
      }

      // If direct query failed or returned null, try pattern matching
      // First check if this is a regex filter pattern like "$.Regular Credit.creditRRC.* ? (@key like_regex "^10 Multiply line 5 by")"
      const regexFilterPattern = /\?\s*\(@key\s+like_regex\s+"([^"]+)"\)/i;
      const regexMatch = jsonPath.match(regexFilterPattern);
      
      if (regexMatch) {
        const regexPattern = regexMatch[1];
        console.log(`Detected regex filter pattern: ${regexPattern}`);
        console.log(`Original jsonPath: ${jsonPath}`);
        
        // Extract the base path (everything before the filter) - be more careful
        const splitResult = jsonPath.split(' ?');
        const basePath = splitResult.length > 0 && splitResult[0] !== undefined ? splitResult[0].trim() : jsonPath;
        console.log(`Extracted basePath: ${basePath}`);
        
        // Manually construct the proper JSON path for regex filter
        let properJsonPath;
        
        // Remove the leading $. and handle the remaining path
        let pathWithoutDollar = basePath.replace(/^\$\./, '');
        
        // Split by dots, but be careful with quoted strings
        const parts = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < pathWithoutDollar.length; i++) {
          const char = pathWithoutDollar[i];
          
          if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
            current += char;
          } else if (char === quoteChar && inQuotes) {
            inQuotes = false;
            quoteChar = '';
            current += char;
          } else if (char === '.' && !inQuotes) {
            if (current) {
              parts.push(current);
              current = '';
            }
          } else {
            current += char;
          }
        }
        
        if (current) {
          parts.push(current);
        }
        
        console.log(`Path parts: ${JSON.stringify(parts)}`);
        
        // Process each part
        const processedParts = parts.map(part => {
          // If it ends with .*, handle it specially
          if (part.endsWith('.*')) {
            const basePart = part.slice(0, -2); // Remove the .*
            if (/[^a-zA-Z0-9_]/.test(basePart)) {
              return `"${basePart}".*`;
            }
            return `${basePart}.*`;
          }
          
          // If it ends with just *, handle it specially  
          if (part.endsWith('*') && !part.endsWith('.*')) {
            const basePart = part.slice(0, -1);
            if (/[^a-zA-Z0-9_]/.test(basePart)) {
              return `"${basePart}".*`;
            }
            return `${basePart}.*`;
          }
          
          // If already quoted, keep as is
          if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))) {
            return part;
          }
          
          // Quote if contains spaces or special characters
          if (/[^a-zA-Z0-9_]/.test(part)) {
            return `"${part}"`;
          }
          
          return part;
        });
        
        properJsonPath = '$.' + processedParts.join('.') + ` ? (@key like_regex "${regexPattern}")`;
        
        console.log(`Generated JSON path: ${properJsonPath}`);
        
        // The jsonb_path_query with key filter returns the value, but we need to handle it properly
        // For a pattern like "^10 Multiply line 5 by" matching key "10 Multiply line 5 by 30" with value 150
        // We want to return the value (150)
        
        // Build the path to the object containing the keys we want to search
        const objectPath = '$.' + processedParts.slice(0, -1).join('.');
        console.log(`Object path for jsonb_each: ${objectPath}`);
        
        query = `
          WITH matched_pairs AS (
            SELECT 
              jsonb_each(jsonb_path_query_first(computed_fields, '${objectPath}')) as kv
            FROM ${schemaName}.${refTable}
            WHERE case_rid = :case_rid
          )
          SELECT 
            (kv).value::text as field_value
          FROM matched_pairs
          WHERE (kv).key ~ '${regexPattern}'
          LIMIT 1`;
      } else {
        // Pattern matching for mathematical operations (only if not a regex filter)
        const patterns = [
          // "Multiply line 15 by 20% (0.2). Enter the result"
          {
            pattern: /^Multiply\s+line\s+(\d+)\s+by\s+([0-9.]+)%\s*\([0-9.]+\)\.\s*Enter\s+the\s+result$/i,
            operation: 'multiplyByPercentageWithText'
          },
          // "13 Multiply line 8 by 25%"
          {
            pattern: /^(\d+)\s+Multiply\s+line\s+(\d+)\s+by\s+([0-9.]+)%$/i,
            operation: 'multiplyByPercentage'
          },
          // "10 Multiply line 5 by 30" - must be exact match at start of string
          {
            pattern: /^(\d+)\s+Multiply\s+line\s+(\d+)\s+by\s+(\d+)$/i,
            operation: 'multiply'
          },
          // "10 Multiply line 5 by" (dynamic multiplier) - must be at start and end of string
          {
            pattern: /^(\d+)\s+Multiply\s+line\s+(\d+)\s+by$/i,
            operation: 'multiplyDynamic'
          }
        ];

        let patternMatch = null;
        let matchedPattern = null;

        // Check if this is a direct pattern matching expression
        for (const patternObj of patterns) {
          const match = jsonPath.match(patternObj.pattern);
          if (match) {
            patternMatch = match;
            matchedPattern = patternObj;
            break;
          }
        }

        if (patternMatch && matchedPattern) {
          let expectedResult, lineNumber;
          
          // Handle different pattern structures
          if (matchedPattern.operation === 'multiplyByPercentageWithText') {
            // For "Multiply line 15 by 20% (0.2). Enter the result" - no expected result, just line and percentage
            lineNumber = patternMatch[1];
            expectedResult = null;
          } else {
            // For patterns like "13 Multiply line 8 by 25%" - has expected result
            expectedResult = patternMatch[1];
            lineNumber = patternMatch[2];
          }

          console.log(`Detected ${matchedPattern.operation} pattern: Expected=${expectedResult || 'N/A'}, Line=${lineNumber}`);
          console.log(`Original path: ${jsonPath}`);

          // Get the value from the specified line/field
          const lineFieldPath = `$."Regular Credit"."creditRRC"."line_${lineNumber}"`;

          let multiplier;
          switch (matchedPattern.operation) {
            case 'multiplyByPercentageWithText':
              multiplier = patternMatch[2] ? parseFloat(patternMatch[2]) / 100 : 0.25; // Convert percentage to decimal
              console.log(`Multiplier: ${patternMatch[2] || '25'}% (${multiplier})`);
              break;
            case 'multiplyByPercentage':
              multiplier = patternMatch[3] ? parseFloat(patternMatch[3]) / 100 : 0.25; // Convert percentage to decimal or default to 25%
              console.log(`Multiplier: ${patternMatch[3] || '25'}% (${multiplier})`);
              break;
            case 'multiply':
              multiplier = patternMatch[3] ? parseFloat(patternMatch[3]) : 1;
              console.log(`Multiplier: ${multiplier}`);
              break;
            case 'multiplyDynamic':
              multiplier = 30; // Default multiplier
              console.log(`Multiplier: ${multiplier} (dynamic default)`);
              break;
          }

          // Query to get the line value and perform multiplication
          query = `
            SELECT 
              (jsonb_path_query_first(computed_fields, '${lineFieldPath}')::text::numeric * ${multiplier}) as field_value 
            FROM ${schemaName}.${refTable} 
            WHERE case_rid = :case_rid
            LIMIT 1`;
        } else {
          const quotedJsonPath = quoteJsonPath(jsonPath);
          query = `
            SELECT jsonb_path_query_first(computed_fields, '${quotedJsonPath}')::text AS field_value
            FROM ${schemaName}.${refTable}
            WHERE case_rid = :case_rid
            LIMIT 1`;
        }
      }
    } else {
      // Regular field
      query = `
        SELECT ${fieldName} AS field_value
        FROM ${schemaName}.${refTable}
        WHERE rid = :case_rid
        LIMIT 1`;
    }

    try {
      const [results] = await orgDb.query(query, {
        replacements: { case_rid },
        raw: true,
      });
      const resultsArray = results as any[];
      logMessage(`Query results from ${refTable}.${fieldName}: ${JSON.stringify(resultsArray)}`);
      const fieldValue = resultsArray.length > 0 ? resultsArray[0].field_value : null;
      return fieldValue !== null && fieldValue !== undefined ? fieldValue : '';
    } catch (error) {
      console.error(`Error fetching from ${refTable}.${fieldName}:`, error);
      return '';
    }
  }

  async findAvailableCountryAndState(accountNumber: string, orgDb: Sequelize, caseRid: string):Promise<{ hasFederal: boolean; hasState: boolean; states?: string[]; }> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);
    const query = `
      SELECT is_federal_level, is_state_level, states FROM ${schemaName}.jurisdictions WHERE entity_rid = 'D001-a761961f-4890-4c22-a585-3e74a8b98770';
    `;

    const [results]: any = await orgDb.query(query, { raw: true });
    const result = Array.isArray(results) && results.length > 0 ? results[0] : {};
    return {
      hasFederal: result.is_federal_level || false,
      hasState: result.is_state_level || false,
      states: result.states || []
    }
  }

  async getFederalForms(accountRid: string, countryRid: string, mainDb: Sequelize,  effectiveStart: string, effectiveEnd: string) {
    try {
        console.log("Fetching Federal Forms for Country RID:", countryRid);
        const [fetchFederalForms] = await mainDb.query(rawQueries.fetchFederalForms(countryRid, effectiveStart, effectiveEnd));
        const results = fetchFederalForms as any[];
        return results.length > 0 && results[0] ? results[0] : [];
    } catch (error) {
        logMessage(`Error fetching Federal Forms : ${error}`);
        return [];
    }
  }

  async getStateForms(accountRid: string, countryRid: string, stateRid:string, mainDb: Sequelize,  effectiveStart: string, effectiveEnd: string) {
    try {
        console.log("Fetching Federal Forms for Country RID:", countryRid);
        const [fetchStateForms] = await mainDb.query(rawQueries.fetchStateForms(countryRid, stateRid, effectiveStart, effectiveEnd));
        const results = fetchStateForms as any[];
        return results.length > 0 && results[0] ? results[0] : [];
    } catch (error) {
        logMessage(`Error fetching Federal Forms : ${error}`);
        return [];
    }
  }

}
export default RdFormMapperSchemaService; 