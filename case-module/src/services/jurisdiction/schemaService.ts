import { Sequelize, Transaction } from "sequelize";
import { CaseModelService } from "../caseModelsService";
import {
  buildBooleanFilterCondition,
  buildDatetimeFilterConditionTemplates,
  buildNumericFilterCondition,
  buildStringFilterCondition,
  errorLog,
  logMessage,
} from "../../utils/helpers";
import { filterType } from "../../utils/types";
import {
  filtersColumnsForJurisdictionConfig,
  filterTypesForJurisdictionConfig,
  rawQueries,
} from "../../utils/constants";
import { listAllJurisdictionConfig } from "../../utils/rawQueries";

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
    // Helper: handle federal to non-federal transition
    private async handleFederalToNonFederal(JurisdictionConfig: any, response: any, configRequest: any, group: any) {
      // Delete platform config
      await JurisdictionConfig.destroy({ where: { federal_config_id: configRequest.config_rid } });
      // Update main config
      await response.update({
        config_json: group,
        effective_end_date: configRequest.effective_end_date,
        effective_start_date: configRequest.effective_start_date,
        credit_config_group_rid: configRequest.jurisdiction_config_group_rid,
        config_name: configRequest.config_name,
        status_rid: configRequest.status_rid,
        modified_datetime: new Date(),
        modified_by: configRequest.modified_by,
      });
    }

    // Helper: update main jurisdiction config
    private async updateMainConfig(response: any, configRequest: any, group: any, updateGroupRid = false) {
      await response.update({
        config_json: group,
        effective_end_date: configRequest.effective_end_date,
        effective_start_date: configRequest.effective_start_date,
        config_name: configRequest.config_name,
        status_rid: configRequest.status_rid,
        modified_datetime: new Date(),
        modified_by: configRequest.modified_by,
        credit_config_group_rid: configRequest.jurisdiction_config_group_rid
    });
  }

    // Helper: update or create platform config
    private async updatePlatformConfig(JurisdictionConfig: any, configRequest: any) {
      const group = configRequest.platformConfig;
      const response: any = await JurisdictionConfig.findOne({
        where: { federal_config_id: configRequest.config_rid },
      });
      if (!response) {
        // Create if not exists
        await JurisdictionConfig.create({
          config_name: configRequest.config_name,
          created_datetime: new Date(),
          created_by: configRequest.modified_by,
          effective_end_date: configRequest.effective_end_date,
          effective_start_date: configRequest.effective_start_date,
          credit_config_group_rid: configRequest.platform_config_group_rid,
          config_json: JSON.parse(JSON.stringify(configRequest.platformConfig)),
          status_rid: configRequest.status_rid,
          federal_config_id: configRequest.config_rid,
        });
      } else {
        await response.update({
          config_json: group,
          effective_end_date: configRequest.effective_end_date,
          effective_start_date: configRequest.effective_start_date,
          status_rid: configRequest.status_rid,
          modified_datetime: new Date(),
          modified_by: configRequest.modified_by,
        });
      }
    }
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
      const { Jurisdiction } = await this.caseModelService.getModels(
        accountNumber
      );

      const entity_rid =
        jurisdictionData.level === "case"
          ? jurisdictionData.case_rid
          : jurisdictionData.account_rid;

      const existing = await Jurisdiction.findOne({
        where: {
          entity_rid: entity_rid,
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

        logMessage(
          `Updated jurisdiction for account ${jurisdictionData.account_rid}`
        );
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
            level: jurisdictionData.level,
          },
          { transaction }
        );

        logMessage(
          `Created new jurisdiction for account ${jurisdictionData.account_rid}`
        );
        return newJurisdiction;
      }
    } catch (error) {
      logMessage(`Error in createOrUpdateJurisdiction: ${error}`);
      throw new Error("Error processing jurisdiction: " + error);
    }
  }

  async fetchJurisdictionConfigDetailsById(configRequest: any) {
    let jurisdictionConfig = await this.formatConfigForFE(
      "edit",
      configRequest
    );
    if (!jurisdictionConfig) {
      return null;
    }
    return {
      config_name: jurisdictionConfig.config_name,
      jurisdictionConfig: jurisdictionConfig?.jdConfig,
      platformConfig: jurisdictionConfig?.platformConfig,
      effective_start_date: jurisdictionConfig?.effective_start_date,
      effective_end_date: jurisdictionConfig?.effective_end_date,
      country_rid: jurisdictionConfig?.country_rid,
      is_federal: jurisdictionConfig?.is_federal,
      state_rid: jurisdictionConfig?.state_rid,
      country_code: jurisdictionConfig?.country_code,
      state_name: jurisdictionConfig?.state_name,
      country_name: jurisdictionConfig?.country_name,
      created_datetime: jurisdictionConfig?.created_datetime,
      created_by: jurisdictionConfig?.created_by,
      modified_datetime: jurisdictionConfig?.modified_datetime,
      modified_by: jurisdictionConfig?.modified_by,
      created_user_name: jurisdictionConfig?.created_user_name,
      modified_user_name: jurisdictionConfig?.modified_user_name,
      status_rid: jurisdictionConfig?.status_rid,
      r_number: jurisdictionConfig?.r_number,
      rid:jurisdictionConfig?.rid
    };
  }

  async getJurisdictionConfigDataForNewEntry(configRequest: any) {
    let jurisdictionConfig = await this.formatConfigForFE("new", configRequest);
    if (!jurisdictionConfig) {
      return null;
    }
    return {
      jurisdictionConfig: jurisdictionConfig?.jdConfig,
      platformConfig: jurisdictionConfig?.platformConfig,
    };
  }

  async formatConfigForFE(type: string, configRequest?: any) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    // Fetch config metadata for the group
    let [configMeta]: any[] = [];
    let [platformConfig]: any[] = [];
    let platformConfigsData: any = null;
    if (type !== "new") {
      [configMeta] = await this.mainDbSequelize.query(
        rawQueries.getJurisdictionById(configRequest.credit_config_group_rid)
      );
    } else {
      [configMeta] = await this.mainDbSequelize.query(
        rawQueries.getJurisdictionByCountryId(
          configRequest.country_rid,
          configRequest.state_rid,
          configRequest.is_federal,
          configRequest.credit_program_name
        )
      );
    }
    if (configMeta.length === 0) {
      return null;
    }

    // Fetch parameter values for the config group
    let paramValues: any[] = [];
    let platformConfigValues: any[] = [];
    if (type !== "new") {
      [paramValues] = await this.mainDbSequelize.query(
        rawQueries.getJurisdictionConfigValuesById(configRequest.config_rid)
      );
       [platformConfigValues] = await this.mainDbSequelize.query(
        rawQueries.getJurisdictionPlatformConfigValuesById(configRequest.config_rid)
      );
    }
  
    // Build a map of config group rid to config_json
    const groupConfigMap = Object.fromEntries(
      paramValues.map((row) => [row.credit_config_group_rid, row.config_json])
    );
    if(configMeta[0]?.is_federal){
    [platformConfig] = await this.mainDbSequelize.query(
      rawQueries.getPlatformJurisdictionConfig()
    );
    const platformGroupConfigMap = Object.fromEntries(
      platformConfigValues.map((row) => [row.credit_config_group_rid, row.config_json])
    );
     const platformConfigs: any[] = [];
     const platformGroupId =
      platformConfigValues.length > 0
        ? platformConfigValues[0].credit_config_group_rid
        : "";
      for (const meta of platformConfig) {
      let value = null;
      if (platformGroupConfigMap[platformGroupId]) {
        const groupConfig = platformGroupConfigMap[platformGroupId];
        value = groupConfig[meta.credit_parameter_name] ?? null;
      }
      platformConfigs.push({
        label: meta.credit_parameter_name,
        displayName:
          meta.credit_parameter_display_name || meta.credit_parameter_name,
        value,
        type: meta.data_type || typeof value,
        is_required: meta.is_required || false,
      });
    }
      platformConfigsData = {
      configItems: platformConfigs,
      credit_program_name:
        platformConfig.length > 0
          ? platformConfig[0].credit_program_name
          : null,
      config_rid:
        platformConfig.length > 0 ? platformConfig[0].credit_config_group_rid : null,
    };
  }

    // Build a flat array of config items for the config group
    const configItems: any[] = [];
    const groupId =
      configMeta.length > 0 ? configMeta[0].credit_config_group_rid : "";
    for (const meta of configMeta) {
      let value = null;
      if (groupConfigMap[groupId]) {
        const groupConfig = groupConfigMap[groupId];
        value = groupConfig[meta.credit_parameter_name] ?? null;
      }
      configItems.push({
        label: meta.credit_parameter_name,
        displayName:
          meta.credit_parameter_display_name || meta.credit_parameter_name,
        value,
        type: meta.data_type || typeof value,
        is_required: meta.is_required || false,
      });
    }
   
    let jdConfig = {
      configItems,
      credit_program_name:
        configMeta.length > 0 ? configMeta[0].credit_program_name : null,
      config_rid: configMeta.length > 0 ? configMeta[0].credit_config_group_rid : null,
    };
   
    return {
      rid:paramValues.length > 0 ? paramValues[0].rid : null,
      config_name:
        paramValues.length > 0 ? paramValues[0].config_name : null,
      status_rid:
        paramValues.length > 0 ? paramValues[0].status_rid : null,
      effective_start_date:
        paramValues.length > 0 ? paramValues[0].effective_start_date : null,
      effective_end_date:
        paramValues.length > 0 ? paramValues[0].effective_end_date : null,
      jdConfig,
      platformConfig: platformConfigsData,
      country_rid: configMeta.length > 0 ? configMeta[0].country_rid : null,
      is_federal: configMeta.length > 0 ? configMeta[0].is_federal : null,
      state_rid: configMeta.length > 0 ? configMeta[0].state_rid : null,
      country_code: configMeta.length > 0 ? configMeta[0].country_code : null,
      state_name: configMeta.length > 0 ? configMeta[0].state_name : null,
      country_name: configMeta.length > 0 ? configMeta[0].country_name : null,
      is_required: configMeta.length > 0 ? configMeta[0].is_required : null,
      r_number:
        paramValues.length > 0 ? paramValues[0].r_number : null,
      created_datetime:
        paramValues.length > 0 ? paramValues[0].created_datetime : null,
      created_by:
        paramValues.length > 0 ? paramValues[0].created_by : null,
      modified_datetime:
        paramValues.length > 0 ? paramValues[0].modified_datetime : null,
      modified_by:
        paramValues.length > 0 ? paramValues[0].modified_by : null,
      created_user_name:
        paramValues.length > 0 ? paramValues[0].created_user_name : null,
      modified_user_name:
        paramValues.length > 0 ? paramValues[0].modified_user_name : null,
    };
  }

  async updateJurisdictionConfig(configRequest: any) {
    const { JurisdictionConfig } = await this.caseModelService.getModels("");
    let updated = false;
    const response: any = await JurisdictionConfig.findOne({
      where: { rid: configRequest.config_rid },
    });
    if (!response) {
      throw new Error(`Invalid config_rid: ${configRequest.config_rid}`);
    }

    // 1. Handle is_federal change
    if (response.is_federal !== configRequest.is_federal) {
      if (configRequest.is_federal === false) {
        // Federal to non-federal
        if (configRequest.jurisdictionConfig) {
          await this.handleFederalToNonFederal(JurisdictionConfig, response, configRequest, configRequest.jurisdictionConfig);
          updated = true;
        }
      } else {
        // Non-federal to federal (update group rid and config)
        if (configRequest.jurisdictionConfig) {
          await this.updateMainConfig(response, configRequest, configRequest.jurisdictionConfig, true);
          updated = true;
        }
      }
    } else {
      // 2. Normal update
      if (configRequest.jurisdictionConfig) {
        await this.updateMainConfig(response, configRequest, configRequest.jurisdictionConfig);
        updated = true;
      }
    }

    // 3. Platform config update (if federal)
    if (configRequest.is_federal && configRequest.platformConfig) {
      await this.updatePlatformConfig(JurisdictionConfig, configRequest);
      updated = true;
    }

    // 4. GraphQL update
    if (configRequest?.apiType === "graphql") {
      configRequest.modified_datetime = new Date();
      configRequest.modified_by = configRequest.modified_by;
      await response.update(configRequest);
      updated = true;
    }
  
    return updated;
  }

  async createJurisdictionConfig(configRequest: any) {
    const { JurisdictionConfig } = await this.caseModelService.getModels("");
    let created = false;
    if (
      configRequest.jurisdictionConfig
    ) {
      let createdConfig = await JurisdictionConfig.create({
        config_name: configRequest.config_name,
        created_datetime: new Date(),
        created_by: configRequest.created_by,
        effective_end_date: configRequest.effective_end_date,
        effective_start_date: configRequest.effective_start_date,
        credit_config_group_rid: configRequest.jurisdiction_config_group_rid,
        config_json: JSON.parse(JSON.stringify(configRequest.jurisdictionConfig)),
        status_rid: configRequest.status_rid,
        is_federal: configRequest.is_federal || false,
      });
      created = true;
      configRequest.federal_rid = createdConfig.rid;
    }
    // Create platform config
    if (
      configRequest.is_federal &&
      configRequest.platformConfig)
      {
     
      await JurisdictionConfig.create({
        config_name: configRequest.config_name,
        created_datetime: new Date(),
        created_by: configRequest.created_by,
        effective_end_date: configRequest.effective_end_date,
        effective_start_date: configRequest.effective_start_date,
        credit_config_group_rid: configRequest.platform_config_group_rid,
        config_json: JSON.parse(JSON.stringify(configRequest.platformConfig)),
        status_rid: configRequest.status_rid,
        federal_config_id: configRequest.federal_rid,
      });
      created = true;
    }
    return created;
  }

  async listJurisdictionConfig(
    page: number,
    limit: number,
    apiType: string,
    filters: filterType,
    search: string,
    sortBy: string,
    sortOrder: string,
    configRid?: string
  ) {
    try {
      // Ensure filters is not null or undefined
      filters = filters || {};
      let offset = (page - 1) * limit;
      let pagination = `LIMIT ${limit} OFFSET ${offset}`;
      if (apiType === "download") {
        pagination = ``;
      }
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }
      let filteredQueryArray: string[] = [];
      let andConditions = ``;
      let filterQueryValues;
      let whereKey: string = ``;
      let sortValue;
      let searchValue: string;
      let graphQlQuery: string = ``;
      let filterDatas = this.filterForJurisdictionConfig(
        filters,
        andConditions,
        filteredQueryArray,
        filterTypesForJurisdictionConfig,
        filtersColumnsForJurisdictionConfig
      );
      // Optimize filter query processing
      filterQueryValues = filterDatas?.filteredQueryArray?.length
        ? filterDatas.filteredQueryArray.join(" AND ")
        : "";

      searchValue = search ? `%${search}%` : `%%`;
      whereKey = `1 = 1`;

       if (apiType === "graphql") {
        graphQlQuery = ` jc.rid = '${configRid}'`;
      }

      // Optimized conditions joining
      const conditions = [filterQueryValues, graphQlQuery].filter(Boolean);
      const joinedConditions =
        conditions.length > 0 ? " AND " + conditions.join(" AND ") : "";

      // Optimized sorting logic using extracted utility function
      const sortColumn = this.getSortColumnForJurisdictionConfig(sortBy);
      const sortDirection = sortOrder || "ASC";
      logMessage(
        `Sorting by column: ${sortColumn}, direction: ${sortDirection}`
      );
      sortValue = `ORDER BY ${sortColumn} ${sortDirection}`;
      let jurisdictionConfigQuery = await listAllJurisdictionConfig(
        searchValue,
        whereKey,
        joinedConditions,
        sortValue,
        pagination
      );
      const [result]: any[] = await this.mainDbSequelize.query(
        jurisdictionConfigQuery,
        { type: "SELECT" }
      );
      if(result && result?.jurisdiction_config_list != null){
       return {
        result: result.jurisdiction_config_list,
        count: result?.jurisdiction_config_list[0]?.total_records || 0,
      };
      } else {
        return {
          result: [],
          count: 0,
        };
      }
      
    } catch (err) {
      logMessage(`Error in listing jurisdiction config: ${err}`);
      errorLog(
        "Error in fetching jurisdiction config:",
        (err as Error).message
      );
      return {
        result: [],
        count: 0,
      }
    }
  }

  filterForJurisdictionConfig(
    filters: filterType,
    andConditions: string,
    filteredQueryArray: string[],
    filterTypes: any,
    filterColumns: any
  ) {
    let filteredColumns: string | undefined;
    if (filters && Object.keys(filters).length > 0) {
      for (let [key, conditions] of Object.entries(filters)) {
        if (Object.keys(filterTypes).includes(key)) {
          filteredColumns = filterColumns[key];
          andConditions = ` AND `;
        }
        for (let [condition, values] of Object.entries(conditions)) {
          switch (filterTypes[key]) {
            case "string": {
              let dynamicReference = `jc`;
              if (filteredColumns == "country_rid") dynamicReference = `g`;
              if (filteredColumns == "state_rid") dynamicReference = `g`;
              const stringCondition = buildStringFilterCondition(
                condition,
                values,
                filteredColumns!,
                dynamicReference
              );
              if (stringCondition) {
                filteredQueryArray.push(stringCondition);
              }
              break;
            }
             case "boolean": {
              let dynamicReference = `g`;
            
              const booleanCondition = buildBooleanFilterCondition(
                condition,
                values,
                filteredColumns!,
                dynamicReference
              );
              if (booleanCondition) {
                filteredQueryArray.push(booleanCondition);
              }
              break;
            }
            case "number": {
              const numericCondition = buildNumericFilterCondition(
                condition,
                values,
                filteredColumns!
              );
              if (numericCondition) {
                filteredQueryArray.push(numericCondition);
              }
              break;
            }
            case "datetime": {
              let dynamicReference = `jc`;
              const datetimeCondition = buildDatetimeFilterConditionTemplates(
                condition,
                values,
                filteredColumns!,
                dynamicReference
              );
              if (datetimeCondition) {
                filteredQueryArray.push(datetimeCondition);
              }
              break;
            }
          }
        }
      }
      return {
        filteredQueryArray,
        andConditions,
      };
    } else {
      filteredQueryArray = [];
      andConditions = ` `;
      return {
        filteredQueryArray,
        andConditions,
      };
    }
  }

  getSortColumnForJurisdictionConfig = (sortField: string): string => {
    const sortMapping: Record<string, string> = {
      r_number: "r_number",
      created_datetime: "created_datetime",
      modified_datetime: "modified_datetime",
      status_rid: "status_name",
      created_user_name: "created_user_name",
      modified_user_name: "modified_user_name",
      effective_start_date: "effective_start_date",
      effective_end_date: "effective_end_date",
      createdAt: "created_datetime",
      category_rid: "category_name",
      config_name: "config_full_name",
      state_name: "state_name",
      country_name: "country_name",
      is_federal: "is_federal"
    };

    return sortMapping[sortField] || "r_number";
  };
}
