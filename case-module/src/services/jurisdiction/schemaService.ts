import { Sequelize, Transaction } from "sequelize";
import { CaseModelService } from "../caseModelsService";
import { logMessage } from "../../utils/helpers";

interface IJurisdictionRequest {
  rid?: string;
  created_by: string;
  modified_by?: string;
  account_rid: string;
  case_rid?: string;
  is_federal_level: boolean;
  is_state_level: boolean;
  states?: string[];
  level: string;
}

export class JurisdictionSchemaService {
  private orgDbSequelize: Sequelize | null = null;
   private mainDbSequelize: Sequelize | null = null;
  private caseModelService: CaseModelService;

  constructor() {
    this.caseModelService = new CaseModelService();
  }

  /**
   * Create or update jurisdiction record based on existence.
   * If record exists (based on account_rid + case_rid), it will update it.
   * Otherwise, it creates a new record.
   */
  async createOrUpdateJurisdiction(
    accountNumber: string,
    jurisdictionData: IJurisdictionRequest,
    transaction: Transaction
  ) {
    try {
      
      const { Jurisdiction } = await this.caseModelService.getModels(accountNumber);

      const entity_rid = jurisdictionData.level === "case" ? jurisdictionData.case_rid : jurisdictionData.account_rid;

      const existing = await Jurisdiction.findOne({
        where: {
          entity_rid: entity_rid
        },
        transaction,
      });

      if (existing) {
        // Update existing jurisdiction
        await existing.update(
          {
            modified_by: jurisdictionData.created_by,
            modified_datetime: new Date(),
            is_federal_level: jurisdictionData.is_federal_level,
            is_state_level: jurisdictionData.is_state_level,
            states: jurisdictionData.states,
          },
          { transaction }
        );

        logMessage(`Updated jurisdiction for account ${jurisdictionData.account_rid}`);
        return existing;
      } else {
        // Create new jurisdiction
        const newJurisdiction = await Jurisdiction.create(
          {
            created_by: jurisdictionData.created_by,
            entity_rid: entity_rid || "",
            is_federal_level: jurisdictionData.is_federal_level,
            is_state_level: jurisdictionData.is_state_level,
            states: jurisdictionData.states,
            level: jurisdictionData.level 
          },
          { transaction }
        );

        logMessage(`Created new jurisdiction for account ${jurisdictionData.account_rid}`);
        return newJurisdiction;
      }
    } catch (error) {
      logMessage(`Error in createOrUpdateJurisdiction: ${error}`);
      throw new Error("Error processing jurisdiction: " + error);
    }
  }

   async fetchJurisdictionConfigDetailsById(
      configRequest:any
    ) {
      const { JurisdictionConfig } = await this.caseModelService.getModels("");
      const response:any = await JurisdictionConfig.findOne({
        where: {
          country_rid: configRequest.country_rid,
        }
      });
      let jurisdictionConfig = null;
      if (response && response.config_json) {
        jurisdictionConfig = await this.formatConfigForFE(response.config_json);
      }

      // Fetch platform config
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }
     /* const [platformConfigRow]: any[] = await this.mainDbSequelize.query(
        `SELECT config_json FROM trd365.rd_platform_config LIMIT 1;`
      );
      let platformConfig = null;
      if (platformConfigRow && platformConfigRow.config_json) {
        platformConfig = await this.formatConfigForFE(platformConfigRow.config_json);
      }
         */
      let platformConfig = {
        project_types :["Fixed Price"]
      }

      return {
        countryCode:"USA",
        stateCode:null,
        jurisdictionConfig,
        platformConfig
      };
  }


 async formatConfigForFE(config: Record<string, any>) {
  if(!this.mainDbSequelize) {
    this.mainDbSequelize = await this.caseModelService.getMainSequelize();
  }
  const  [configMeta]:any[] = await this.mainDbSequelize.query(
    `SELECT 
      k.rid as credit_parameter_key_rid,
      k.credit_parameter_name,
      k.data_type,
      k.credit_parameter_display_name,
      k.credit_config_group_rid,
      g.credit_program_name
    FROM 
      trd365.rd_credit_parameter_key k
    JOIN 
      trd365.rd_credit_config_group g
      ON k.credit_config_group_rid = g.rid
    WHERE 
      g.country_rid = 'D001-e66380cd-d24c-4581-8e29-07ada063acdb'
      AND g.state_rid IS NULL;`
  );

  // Fetch parameter values separately
  const [paramValues]: any[] = await this.mainDbSequelize.query(
    `SELECT credit_config_group_rid, config_json FROM trd365.rd_credit_parameter_values;`
  );
  // Map config group rid to config_json
  const groupConfigMap: Record<string, any> = {};
  for (const row of paramValues) {
    groupConfigMap[row.credit_config_group_rid] = row.config_json;
  }
  console.log("groupConfigMap:", groupConfigMap);
  // Convert configMeta array to a lookup object by credit_parameter_name
  const metaLookup: Record<string, any> = {};
  for (const meta of configMeta) {
      metaLookup[meta.credit_parameter_name] = meta;
  }

  // Group by credit_program_name and attach credit_config_group_rid
  // First, collect all possible programs from configMeta
    const allPrograms: Record<string, { creditConfigGroupId: string, items: any[] }> = {};
  for (const meta of configMeta) {
    const programName = meta.credit_program_name || "Unknown";
    const groupId = meta.credit_config_group_rid || "";
    if (!allPrograms[programName]) {
      allPrograms[programName] = {
        creditConfigGroupId: groupId,
        items: []
      };
    }
  }


  // Fill items for each program using configMeta so all parameters are included
  for (const meta of configMeta) {
    const programName = meta.credit_program_name || "Unknown";
    let value = null;
    // Prefer value from groupConfigMap if present, else from config JSON
    if (groupConfigMap.hasOwnProperty(meta.credit_config_group_rid) && groupConfigMap[meta.credit_config_group_rid]) {
      const groupConfig = groupConfigMap[meta.credit_config_group_rid];
      value = groupConfig[meta.credit_parameter_name] !== undefined ? groupConfig[meta.credit_parameter_name] : null;
    }
    if (value === null && config.hasOwnProperty(meta.credit_parameter_name)) {
      value = config[meta.credit_parameter_name];
    }
    if (allPrograms[programName]) {
      allPrograms[programName].items.push({
        label: meta.credit_parameter_name,
        displayName: meta.credit_parameter_display_name || meta.credit_parameter_name,
        value,
        type: meta.data_type || typeof value
      });
    }
  }

  // Return all programs, even if their items array is empty
  return allPrograms;
}

async updateJurisdictionConfig(
    configRequest:any
  ) {
    console.log("Updating jurisdiction config with request:", configRequest);
    const { JurisdictionConfig } = await this.caseModelService.getModels("");
    if (Array.isArray(configRequest.data)) {
      for (const group of configRequest.data) {
        const response:any = await JurisdictionConfig.findOne({
          where: {
            credit_config_group_rid: group.creditConfigGroupId,
          }
        });
        if (!response) {
          throw new Error(`Invalid credit_config_group_rid: ${group.creditConfigGroupId}`);
        }
        // Map items array to config_json object
        let configJson: Record<string, any> = {};
        if (Array.isArray(group.items)) {
          for (const item of group.items) {
            configJson[item.label] = item.value;
          }
        }
        await response.update({
          config_json: configJson
        });
      }
      return true;
    }
    return false;
  }

}
