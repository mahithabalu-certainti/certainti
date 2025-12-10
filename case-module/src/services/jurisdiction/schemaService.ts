import { Sequelize, Transaction } from "sequelize";
import { CaseModelService } from "../caseModelsService";
import {
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
    };
  }

  async getJurisdictionConfigDataForNewEntry(configRequest: any) {
    let jurisdictionConfig = await this.formatConfigForFE("new", configRequest);
    if (!jurisdictionConfig) {
      return null;
    }
    return {
      jurisdictionConfig: jurisdictionConfig?.jdConfig,
    };
  }

  async formatConfigForFE(type: string, configRequest?: any) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }

    // Fetch config metadata for the group
    let [configMeta]: any[] = [];
    let [platformConfig]: any[] = [];
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
    [platformConfig] = await this.mainDbSequelize.query(
      rawQueries.getPlatformJurisdictionConfig()
    );

    // Fetch parameter values for the config group
    let paramValues: any[] = [];
    let platformConfigValues: any[] = [];
    if (type !== "new") {
      [paramValues] = await this.mainDbSequelize.query(
        `SELECT rid,credit_config_group_rid, config_json,effective_start_date,effective_end_date FROM trd365.rd_credit_parameter_values WHERE rid = '${configRequest.config_rid}';`
      );
      [platformConfigValues] = await this.mainDbSequelize.query(
        `SELECT rid,credit_config_group_rid, config_json,effective_start_date,effective_end_date FROM trd365.rd_credit_parameter_values WHERE federal_config_id = '${configRequest.config_rid}';`
      );
    }

    // Build a map of config group rid to config_json
    const groupConfigMap = Object.fromEntries(
      paramValues.map((row) => [row.credit_config_group_rid, row.config_json])
    );

    // Build a flat array of config items for the config group
    const configItems: any[] = [];
    const platformConfigs: any[] = [];
    const platformGroupId =
      platformConfigValues.length > 0
        ? platformConfigValues[0].credit_config_group_rid
        : "";
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
      });
    }
    for (const meta of platformConfig) {
      let value = null;
      if (groupConfigMap[platformGroupId]) {
        const groupConfig = groupConfigMap[platformGroupId];
        value = groupConfig[meta.credit_parameter_name] ?? null;
      }
      platformConfigs.push({
        label: meta.credit_parameter_name,
        displayName:
          meta.credit_parameter_display_name || meta.credit_parameter_name,
        value,
        type: meta.data_type || typeof value,
      });
    }
    let jdConfig = {
      configItems,
      credit_program_name:
        configMeta.length > 0 ? configMeta[0].credit_program_name : null,
      config_rid: paramValues.length > 0 ? paramValues[0].rid : null,
    };
    let platformConfigsData = {
      configItems: platformConfigs,
      credit_program_name:
        platformConfig.length > 0
          ? platformConfig[0].credit_program_name
          : null,
      config_rid:
        platformConfigValues.length > 0 ? platformConfigValues[0].rid : null,
    };
    return {
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
    };
  }

  async updateJurisdictionConfig(configRequest: any) {
    const { JurisdictionConfig } = await this.caseModelService.getModels("");
    let updated = false;
    if (
      configRequest.jurisdictionConfig &&
      Array.isArray(configRequest.jurisdictionConfig.configItems)
    ) {
      const group = configRequest.jurisdictionConfig;
      const response: any = await JurisdictionConfig.findOne({
        where: {
          rid: group.config_rid,
        },
      });
      if (!response) {
        throw new Error(`Invalid config_rid: ${group.config_rid}`);
      }
      let configJson: Record<string, any> = {};
      for (const item of group.configItems) {
        configJson[item.label] = item.value;
      }
      await response.update({
        config_json: configJson,
        effective_end_date: configRequest.effective_end_date,
        effective_start_date: configRequest.effective_start_date,
        modified_datetime: new Date(),
        modified_by: configRequest.modified_by,
      });
      updated = true;
    }
    // Update platform config
    if (
      configRequest.platformConfig &&
      Array.isArray(configRequest.platformConfig.configItems)
    ) {
      const group = configRequest.platformConfig;
      const response: any = await JurisdictionConfig.findOne({
        where: {
          rid: group.config_rid,
        },
      });
      if (!response) {
        throw new Error(`Invalid platform config_rid: ${group.config_rid}`);
      }
      let configJson: Record<string, any> = {};
      for (const item of group.configItems) {
        configJson[item.label] = item.value;
      }
      await response.update({
        config_json: configJson,
        effective_end_date: configRequest.effective_end_date,
        effective_start_date: configRequest.effective_start_date,
        modified_datetime: new Date(),
        modified_by: configRequest.modified_by,
      });
      updated = true;
    }
    return updated;
  }

  async createJurisdictionConfig(configRequest: any) {
    const { JurisdictionConfig } = await this.caseModelService.getModels("");
    let created = false;
    if (
      configRequest.jurisdictionConfig &&
      Array.isArray(configRequest.jurisdictionConfig.configItems)
    ) {
      const group = configRequest.jurisdictionConfig;
      let configJson: Record<string, any> = {};
      for (const item of group.configItems) {
        configJson[item.label] = item.value;
      }
      let createdConfig = await JurisdictionConfig.create({
        created_datetime: new Date(),
        created_by: configRequest.created_by,
        effective_end_date: configRequest.effective_end_date,
        effective_start_date: configRequest.effective_start_date,
        credit_config_group_rid: group.credit_config_group_rid,
        config_json: JSON.parse(JSON.stringify(configJson)),
        status_rid: configRequest.status_rid,
      });
      created = true;
      configRequest.federal_rid = createdConfig.rid;
    }
    // Create platform config
    if (
      configRequest.is_federal &&
      configRequest.platformConfig &&
      Array.isArray(configRequest.platformConfig.configItems)
    ) {
      const group = configRequest.platformConfig;
      let configJson: Record<string, any> = {};
      for (const item of group.configItems) {
        configJson[item.label] = item.value;
      }
      await JurisdictionConfig.create({
        created_datetime: new Date(),
        created_by: configRequest.created_by,
        effective_end_date: configRequest.effective_end_date,
        effective_start_date: configRequest.effective_start_date,
        credit_config_group_rid: group.credit_config_group_rid,
        config_json: JSON.parse(JSON.stringify(configJson)),
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
    sortOrder: string
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
      let templateQuery: string = ``;
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

      // Optimized conditions joining
      const conditions = [filterQueryValues, templateQuery].filter(Boolean);

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
      return result.jurisdiction_config_list;
    } catch (err) {
      logMessage(`Error in listing jurisdiction config: ${err}`);
      errorLog(
        "Error in fetching jurisdiction config:",
        (err as Error).message
      );
      return [];
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
              let dynamicReference = `et`;

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
              let dynamicReference = `et`;
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
    };

    return sortMapping[sortField] || "r_number";
  };
}
