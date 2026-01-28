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
    const mainDb = await this.getMainDb();
    const orgDb  =await this.getOrgDb();
    console.log(`Fetching field value from ${refTable}.${fieldName}   is_json: ${is_json}`);
    
    // Basic validation to prevent SQL injection
    // if (!refTable || !fieldName || 
    //     !/^[a-zA-Z0-9_.]+$/.test(refTable) || 
    //     !/^[a-zA-Z0-9_]+$/.test(fieldName)) {
    //   throw new Error('Invalid table or field name format');
    // }
    
    let schemaName = 'trd365_00891';
    let query;
    
    if (is_json) {
      let jsonPath = fieldName.replace(/^\$\.computed_fields\./, '$.');
      // Helper to quote each property in the path
      function quoteJsonPath(path: string): string {
        // Remove initial $.
        let p = path.replace(/^\$\./, '');
        // Split by . but keep quoted property names together
        const parts = p.match(/(?:[^.\["']+|"[^"]*"|'[^']*')+/g) || [];
        // Quote each part if not already quoted
        const quoted = parts.map(part => {
          if (part.startsWith('"') && part.endsWith('"')) return part;
          if (part.startsWith("'") && part.endsWith("'")) return part;
          // If contains space or special char, quote
          if (/[^a-zA-Z0-9_]/.test(part)) return `"${part}"`;
          return part;
        });
        return '$.' + quoted.join('.');
      }

      let quotedJsonPath = quoteJsonPath(jsonPath);
      query = `SELECT jsonb_path_query_first(computed_fields, '${quotedJsonPath}')::text as field_value FROM ${schemaName}.${refTable} WHERE case_rid = :case_rid`;
    } else {
      // Regular field query
      query = `SELECT ${fieldName} as field_value FROM ${schemaName}.${refTable} WHERE rid = :case_rid`;
    }
    query += ' LIMIT 1';
    
    try {
      const [results] = await orgDb.query(query, { 
        replacements: { case_rid },
        raw: true 
      });
      const resultsArray = results as any[];
      logMessage(`Query results from ${refTable}.${fieldName}: ${JSON.stringify(resultsArray)}`); 
      return resultsArray.length > 0 ? resultsArray[0].field_value : null;
    } catch (error) {
      console.error(`Error fetching from ${refTable}.${fieldName}:`, error);
      return null;
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