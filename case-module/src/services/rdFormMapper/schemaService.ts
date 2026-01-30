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
    const query = rawQueries.fetchRdFormMapperConfigurations(formId);
    const [results] = await mainDb.query(query, { 
      replacements: { formId },
      raw: true 
    });
    return results;
  }

  async saveFederalFilledFormUrl(caseRid: string,countryRid: string, filledFormUrl: string, orgDb: Sequelize, accountNumber: string): Promise<void> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);
    await orgDb.query(rawQueries.saveFederalFilledFormUrl(schemaName), { 
      replacements: { filledFormUrl, caseRid, countryRid },
      raw: true 
    });
    logMessage(`Filled form URL saved for case RID: ${caseRid}`);
  }

  async updateFederalFormError(caseRid: string,countryRid: string, orgDb: Sequelize, accountNumber: string): Promise<void> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);
    await orgDb.query(rawQueries.updateFederalFormError(schemaName), {
      replacements: { caseRid, countryRid },
      raw: true
    });
    logMessage(`Federal form error updated for case RID: ${caseRid}`);
  }

  async updateStateFormError(caseRid: string,countryRid: string,stateRid: string, orgDb: Sequelize, accountNumber: string): Promise<void> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);
    await orgDb.query(rawQueries.updateStateFormError(schemaName), {
      replacements: { caseRid, countryRid, stateRid },
      raw: true
    });
    logMessage(`State form error updated for case RID: ${caseRid}`);
  }

  async getFederalFormUrl(caseRid: string,countryRid: string, orgDb: Sequelize, accountNumber: string): Promise<{filled_form_url: string | null, form_error_message: string | null}> {
    let schemaName = rawQueries.fetchSchemaName(accountNumber);

    const [results]: any = await orgDb.query(rawQueries.fetchFederalFormUrl(schemaName), {
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
    const [results]: any = await orgDb.query(rawQueries.fetchStateFormUrl(schemaName), {
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
    await orgDb.query(rawQueries.saveStateFilledFormUrl(schemaName), { 
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
    const [results] = await mainDb.query(rawQueries.getDataMapperObjects(), { 
      replacements: { country_rid, form_rid },
      raw: true 
    });
    return results;
  }

  /**
   * Get data mapper object by RID
   */
  async getDataMapperObjectByRid(rid: string): Promise<any> {
    const mainDb = await this.getMainDb();
    try {
      const [results] = await mainDb.query(rawQueries.getDatamapperObjectById(), { 
        replacements: { rid },
        raw: true 
      });
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

  /**
   * Fetch field value from reference table dynamically
   */
  async fetchFieldValueFromRefTable(
    refTable: string,
    fieldName: string,
    is_json: boolean,
    account_rid: string,
    case_rid: string,
    schemaName: string
  ): Promise<any> {
    const orgDb = await this.getOrgDb();
    logMessage(`Fetching field: ${fieldName} from ${refTable} (JSON: ${is_json})`);

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
      
      // Execute the direct query first
      try {
        const [directResults] = await orgDb.query(rawQueries.fetchDynamicFieldValues(schemaName,refTable,quotedJsonPath), {
          replacements: { case_rid },
          raw: true,
        });
        const directResultsArray = directResults as any[];
        const directValue = directResultsArray.length > 0 ? directResultsArray[0].field_value : null;
        
        // If direct value found and not null, return it
        if (directValue !== null && directValue !== 'null' && directValue !== undefined) {
          logMessage(`Direct field retrieval successful for ${refTable}.${fieldName}: ${directValue}`);
          return directValue;
        }
        
        // If direct value is null, return empty string instead of continuing to pattern matching
        if (directValue === null || directValue === 'null') {
          logMessage(`Field ${fieldName} has null value, returning empty string`);
          return '';
        }
        
      } catch (error) {
        logMessage(`Direct query failed for ${fieldName}, attempting pattern matching: ${error}`);
      }

      // If direct query failed or returned null, try pattern matching
      // First check if this is a regex filter pattern like "$.Regular Credit.creditRRC.* ? (@key like_regex "^10 Multiply line 5 by")"
      const regexFilterPattern = /\?\s*\(@key\s+like_regex\s+"([^"]+)"\)/i;
      const regexMatch = jsonPath.match(regexFilterPattern);
      
      if (regexMatch) {
        const regexPattern = regexMatch[1];
        logMessage(`Processing regex filter pattern: ${regexPattern} for ${fieldName}`);
        
        // Extract the base path (everything before the filter)
        const splitResult = jsonPath.split(' ?');
        const basePath = splitResult.length > 0 && splitResult[0] !== undefined ? splitResult[0].trim() : jsonPath;
        
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
        
        // Process each part
        const processedParts = parts.map(part => {
          // If it ends with .*, handle it specially
          if (part.endsWith('.*')) {
            const basePart = part.slice(0, -2);
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
        
        // Build the path to the object containing the keys we want to search
        const objectPath = '$.' + processedParts.slice(0, -1).join('.');
        
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

          logMessage(`Processing ${matchedPattern.operation}: Line=${lineNumber}, Expected=${expectedResult || 'N/A'}`);

          // Get the value from the specified line/field - just extract without multiplication
          const lineFieldPath = `$."Regular Credit"."creditRRC"."line_${lineNumber}"`;
          
          logMessage(`Extracting field value from: line_${lineNumber} (no multiplication applied)`);

          // Query to get the line value without performing multiplication
          query = `
            SELECT 
              jsonb_path_query_first(computed_fields, '${lineFieldPath}')::text as field_value 
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
    const [results]: any = await orgDb.query(rawQueries.fetchConfiguration(schemaName), { raw: true });
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