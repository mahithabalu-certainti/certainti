import { Op, Order, Sequelize, Transaction, literal } from "sequelize";
// import {
//   ProjectResource,
//   setupProjectResourceSequence,
// } from "../../models/projectResource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { initMainDbSequelize } from "../../config/mainDataSource";

import moment from "moment";
import { CaseProjectResource } from "../../models/caseProjectResourceModel";
// import { Project } from "../../models/project";
// import { ProjectResourceMapper } from "../../utils/projectMapper";
import { ProjectFiscal } from "../../models/projectFiscal";
// import {
//   ProjectResourceTimeline,
//   setupProjectResourceTimelineSequence,
// } from "../../models/projectResourceTimeline";
// import {
//   ProjectResourceHistory,
//   setupProjectResourceHistorySequence,
// } from "../../models/projectResourceHistory";
// import {
//   ProjectResourceFiscal,
//   setupProjectResourceFiscalSequence,
// } from "../../models/projectResourceFiscal";
// import {
//   ProjectResourceFiscalRegion,
//   setupProjectResourceFiscalRegionSequence,
// } from "../../models/projectResourceFiscalRegion";
import { Resources } from "../../models/resource";
// import { ResourceFiscal } from "../../models/resourceFiscal";
// import { ResourceFiscalRegion } from "../../models/resourceFiscalRegion";
// import { AccountFiscal } from "../../models/accountFiscal";
// import { ProjectFiscalRegion } from "../../models/projectFiscalRegion";
// import { AccountFiscalRegion } from "../../models/accountFiscalRegion";
import { MAIN_SCHEMA_NAME, SCHEMANAME_PREFIX, rawQueries } from "../../utils/constants";
// import SchemaService from "../schemaService";
import SchemaService from "../cases/schemaService";
import {
  // fetchProjectById, fetchResCodesForPrjRes,
  getCurrencyDetailsQuery
} from "../../utils/rawQueries";
// import AccountDetails from "../../models/accountDetails";
import Decimal from "decimal.js";
import currency from "currency.js";
import { errorLog, logMessage } from "../../utils/helpers";

export class ProjectResourceSchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;

  private modelCache: Map<
    string,
    {
      // ProjectResource: ReturnType<typeof ProjectResource.initialize>;
      // Project: ReturnType<typeof Project.initialize>;
      ProjectFiscal: ReturnType<typeof ProjectFiscal.initialize>;
      // ProjectResourceTimeline: ReturnType<
      //   typeof ProjectResourceTimeline.initialize
      // >;
      // ProjectResourceHistory: ReturnType<
      //   typeof ProjectResourceHistory.initialize
      // >;
      // ProjectResourceFiscal: ReturnType<
      //   typeof ProjectResourceFiscal.initialize
      // >;
      // ProjectResourceFiscalRegion: ReturnType<
      //   typeof ProjectResourceFiscalRegion.initialize
      // >;
      // Resources: ReturnType<typeof Resources.initialize>;
      // ResourcesFiscal: ReturnType<typeof ResourceFiscal.initialize>;
      // ResourceFiscalRegion: ReturnType<typeof ResourceFiscalRegion.initialize>;
      // AccountFiscal: ReturnType<typeof AccountFiscal.initialize>;
      // ProjectFiscalRegion: ReturnType<typeof ProjectFiscalRegion.initialize>;
      // AccountFiscalRegion: ReturnType<typeof AccountFiscalRegion.initialize>;
    }
  > = new Map();

  constructor() { }

  async inMemorySortAndFilter(
    projectResources: any[],
    sortBy: string,
    sortOrder: string,
    filters?: Record<string, any>
  ): Promise<any[]> {
    const enumFields = [
      "region_name",
      "resource_type_name",
      "country_name",
      "resource_code",
      "resource_name",
      "resource_role",
      "resource_type_rid",
      "status_name",
      "project_code",
      "project_name"
    ];

    const matchFilter = (record: any, key: string, filter: any): boolean => {
      const value = record[key];

      // Enum field logic (exact/in list)
      if (enumFields.includes(key)) {
        if (filter.equals !== undefined) return value === filter.equals;
        if (filter.not_equals !== undefined) return value !== filter.not_equals;
        if (filter.contains !== undefined) {
            return value?.toLowerCase()?.includes(filter?.contains?.toLowerCase()) && value !== null
        }
        if (filter.is_empty === true) return value === null || value === "";
        if (Array.isArray(filter.in)) return filter.in.includes(value);
      }

      // Text fields (contains / not contains)
      // if (typeof value === "string") {
      //   if (filter.contains !== undefined) {
      //     return value.toLowerCase().includes(filter.contains.toLowerCase());
      //   }
      //   if (filter.not_contains !== undefined) {
      //     return !value
      //       .toLowerCase()
      //       .includes(filter.not_contains.toLowerCase());
      //   }
      // }

      // // Generic field equality
      // if (filter.equals !== undefined) return value === filter.equals;
      // if (filter.not_equals !== undefined) return value !== filter.not_equals;
      // if (filter.is_empty === true) return value === null || value === "";

      return true;
    };

    let filtered = projectResources.filter((record) => {
      if (!filters) return true;

      return Object.entries(filters).every(([key, filterValue]) => {
        if (!filterValue || Object.keys(filterValue).length === 0) return true;
        return matchFilter(record, key, filterValue);
      });
    });

    if (!sortBy || sortBy === "created_datetime") {
      return filtered;
    }

    if (sortBy && enumFields.includes(sortBy)) {
      filtered.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];

        const aIsNull = aVal === null || aVal === undefined;
        const bIsNull = bVal === null || bVal === undefined;

        if (aIsNull && bIsNull) return 0;
        if (aIsNull) return 1;
        if (bIsNull) return -1;

        const valA = typeof aVal === "string" ? aVal.toLowerCase() : aVal;
        const valB = typeof bVal === "string" ? bVal.toLowerCase() : bVal;

        if (valA < valB) return sortOrder === "DESC" ? 1 : -1;
        if (valA > valB) return sortOrder === "DESC" ? -1 : 1;
        return 0;
      });
    }

    return filtered;
  }

  async resourceStatusType(accountNumber: string, projectResources: any[]) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.getMainSequelize();
    }

    // Collect unique status_rid values
    const uniqueStatusIds = new Set<string>();
    for (const res of projectResources) {
      if (res.status_rid) {
        uniqueStatusIds.add(res.status_rid);
      }
    }

    // Fetch status names from DB
    const statusResults: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchResourceStatus,
      {
        replacements: { projectTaskStatusId: Array.from(uniqueStatusIds) },
        type: "SELECT",
      }
    );

    // Create a map of rid -> resource_status_name
    const statusMap = new Map<string, string>();
    for (const status of statusResults) {
      statusMap.set(status.rid, status.resource_status_name);
    }

    // Enrich the project resources with status_name
    const enrichedResources = projectResources.map((resource) => {
      const statusName = statusMap.get(resource.status_rid || "") || null;

      return {
        ...(resource.dataValues ?? resource),
        status_name: statusName,
      };
    });

    return enrichedResources;
  }

  async insertResourceCode(
    accountNumber: string,
    projectResources: any[]
  ): Promise<any[]> {
    try {
      const { Resources } = await this.getModels(accountNumber);

      // Get unique resource_rids from all project resources
      const uniqueResourceRids = [
        ...new Set(
          projectResources
            .map((res) => res.resource_rid)
            .filter((id) => id !== null && id !== undefined)
        ),
      ];

      // Fetch all resources in one query
      const resourceResults = await Resources.findAll({
        where: {
          rid: uniqueResourceRids,
        },
        attributes: ["rid", "resource_code"],
        raw: true,
      });

      // Convert result array to a map for fast lookup
      const resourceCodeMap: any = new Map<string, string>();
      for (const res of resourceResults) {
        resourceCodeMap.set(res.rid, res.resource_code);
      }

      // Enrich each project resource object with resource_code
      const enrichedResources = projectResources.map((resource) => {
        const code = resourceCodeMap.get(resource.resource_rid) || null;
        return {
          ...(resource.dataValues ?? resource),
          resource_code: code,
        };
      });

      return enrichedResources;
    } catch (err) {
      errorLog("Error fetching resource code data", (err as Error).message);
      throw new Error(
        "Error fetching resource code data: " + (err as Error).message
      );
    }
  }

  async insertProjectRegionData(projectResources: any[]): Promise<any[]> {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.getMainSequelize();
      }

      // Get unique region_rids from all project resources
      const uniqueRegionIds = [
        ...new Set(
          projectResources
            .map((res) => res.region_rid)
            .filter((id) => id !== null && id !== undefined)
        ),
      ];

      // Get unique country_rids
      const uniqueCountryIds = [
        ...new Set(
          projectResources
            .map((res) => res.country_rid)
            .filter((id) => id !== null && id !== undefined)
        ),
      ];

      const uniqueCurrencyIds = [
        ...new Set(
          projectResources
            .map((res) => res.currency_rid)
            .filter((id) => id !== null && id !== undefined)
        ),
      ];

      const regionMap = new Map<string, string>();
      const countryMap = new Map<string, string>();
      const currencyMap = new Map<string, string>();

      if (uniqueRegionIds.length > 0) {
        const regionsResult: any = await this.mainDbSequelize.query(
          rawQueries.fetchStatesByIds(),
          {
            replacements: { ids: uniqueRegionIds },
            type: "SELECT",
          }
        );

        for (const region of regionsResult) {
          regionMap.set(region.rid, region.state_name);
        }
      }

      if (uniqueCountryIds.length > 0) {
        const countriesResult: any = await this.mainDbSequelize.query(
          rawQueries.GET_COUNTRIES,
          {
            replacements: { countryRid: uniqueCountryIds },
            type: "SELECT",
          }
        );

        for (const country of countriesResult) {
          countryMap.set(country.rid, country.country_name);
        }
      }

      if (uniqueCurrencyIds.length > 0) {
        const currenciesResult: any = await this.mainDbSequelize.query(
          `SELECT rid, currency_code, currency_symbol FROM ${MAIN_SCHEMA_NAME}.currency WHERE rid IN (:ids)`,
          {
            replacements: { ids: uniqueCurrencyIds },
            type: "SELECT",
          }
        );

        for (const currency of currenciesResult) {
          currencyMap.set(currency.rid, currency.currency_symbol);
        }
      }

      // Enrich each project resource object with region name


      // Enrich each project resource object with region name
      const enrichedResources = projectResources.map((resource) => {
        const regionName = regionMap.get(resource.region_rid) || null;
        const countryName = countryMap.get(resource.country_rid) || null;
        const currencySymbol = currencyMap.get(resource.currency_rid) || null;
        return {
          ...(resource.dataValues ?? resource),
          region_name: regionName,
          country_name: countryName,
          currency_symbol: currencySymbol,
        };
      });

      return enrichedResources;
    } catch (err) {
      errorLog("Error fetching region data", (err as Error).message);
      throw new Error("Error fetching region data: " + (err as Error).message);
    }
  }

  async insertProjectCurrencyData(projectResources: any[]): Promise<any[]> {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.getMainSequelize();
      }

      // Get unique currency_rids
      const uniqueCurrencyIds = [
        ...new Set(
          projectResources
            .map((res) => res.currency_rid)
            .filter((id) => id !== null && id !== undefined)
        ),
      ];

      const currencyMap = new Map<
        string,
        { currency_code: string; currency_symbol: string }
      >();

      if (uniqueCurrencyIds.length > 0) {
        const { query, replacements } = getCurrencyDetailsQuery(
          MAIN_SCHEMA_NAME,
          uniqueCurrencyIds
        );

        const currenciesResult: any[] = await this.mainDbSequelize.query(
          query,
          {
            replacements,
            type: "SELECT",
          }
        );

        for (const currency of currenciesResult) {
          currencyMap.set(currency.rid, {
            currency_code: currency.currency_code,
            currency_symbol: currency.currency_symbol,
          });
        }
      }

      // Enrich each project resource object with currency code and symbol
      const enrichedResources = projectResources.map((resource) => {
        const currencyData = currencyMap.get(resource.currency_rid) || {
          currency_code: null,
          currency_symbol: null,
        };

        return {
          ...(resource.dataValues ?? resource),
          currency_code: currencyData.currency_code,
          currency_symbol: currencyData.currency_symbol,
        };
      });

      return enrichedResources;
    } catch (err) {
      errorLog("Error fetching currency data", (err as Error).message);
      throw new Error(
        "Error fetching currency data: " + (err as Error).message
      );
    }
  }

  async insertResourceTypeData(
    accountNumber: string,
    projectResources: any[]
  ): Promise<any[]> {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.getMainSequelize();
      }

      const { Resources } = await this.getModels(accountNumber);

      // Step 1: Get unique resource_rids from project resources
      const uniqueResourceRids = [
        ...new Set(
          projectResources
            .map((res) => res.resource_rid)
            .filter((id) => id !== null && id !== undefined)
        ),
      ];

      if (uniqueResourceRids.length === 0) {
        return projectResources.map((resource) => ({
          ...(resource.dataValues ?? resource),
          resource_type_name: null,
          resource_name: null,
          resource_role: null,
        }));
      }

      // Step 2: Fetch resource data from Resources model
      const resourceResult = await Resources.findAll({
        where: {
          rid: uniqueResourceRids,
        },
        attributes: [
          "rid",
          "resource_type_rid",
          "resource_name",
          "resource_role",
        ],
        raw: true,
      });

      // Map resource_rid to full resource data
      const resourceMap: any = new Map<string, any>();
      const uniqueTypeIds = new Set<string>();

      for (const res of resourceResult) {
        resourceMap.set(res.rid, res);
        if (res.resource_type_rid) {
          uniqueTypeIds.add(res.resource_type_rid);
        }
      }

      // Step 3: Fetch resource_type_rid → resource_type_name mapping
      let typeResult:any[] = [];
      if(uniqueTypeIds.size > 0 )
      {
       typeResult = await this.mainDbSequelize.query(
        rawQueries.GET_RESOURCE_TYPES,
        {
          replacements: { resourceTypeRid: Array.from(uniqueTypeIds) },
          type: "SELECT",
        }
      );
    }

      const typeMap = new Map<string, string>();
      for (const type of typeResult) {
        typeMap.set(type.rid, type.resource_type_name);
      }

      // Step 4: Enrich project resources with resource_type_name, resource_name, and resource_role
      const enrichedResources = projectResources.map((resource) => {
        const resData = resourceMap.get(resource.resource_rid) || {};
        const typeName = typeMap.get(resData.resource_type_rid || "") || null;

        return {
          ...(resource.dataValues ?? resource),
          resource_type_name: typeName,
          resource_name: resData.resource_name ?? null,
          resource_role: resData.resource_role ?? null,
          resource_type_rid: resData.resource_type_rid ?? null,
        };
      });

      return enrichedResources;
    } catch (err) {
      errorLog("Error fetching resource type data", (err as Error).message);
      throw new Error(
        "Error fetching resource type data: " + (err as Error).message
      );
    }
  }

  async getSequelize(): Promise<Sequelize> {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize();
    }
    return this.orgDbSequelize;
  }

  private async getMainSequelize(): Promise<Sequelize> {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }

  async fetchValidAccountNumberById(accountId: string) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.getMainSequelize();
      }

      const [account]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchAccountDetailsByRid(accountId),
        {
          type: "SELECT",
        }
      );

      let accountRnumber = account?.r_number;

      if (account?.storage_type === "store_in_parent") {
        const [accountData]: any[] = await this.mainDbSequelize.query(
          rawQueries.fetchAccountDetailsByRid(account?.parent_account_rid),
          {
            replacements: { rid: account?.parent_account_rid },
            type: "SELECT",
          }
        );
        accountRnumber = accountData?.r_number;
      }

      return {
        accountNumber: accountRnumber,
        accountId: account?.rid,
        accountName: account?.account_name,
      };
    } catch (err) {
      errorLog(`Error fetching account, ${(err as Error).message}`);
      throw new Error("Error fetching account : " + (err as Error).message);
    }
  }

  private async getModels(accountNumber: string) {
    const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;

    const sequelize = await this.getSequelize();
    this.mainDbSequelize = await this.getMainSequelize();

    const CaseProjectResourceModel = await CaseProjectResource.initialize(
      sequelize,
      schemaName
    );
    // const AccountFiscalModel = await AccountFiscal.initialize(
    //   sequelize,
    //   schemaName
    // );
    // const AccountDetailsModel = await AccountDetails.initialize(
    //   sequelize,
    //   schemaName
    // );

    // const ProjectResourceModel = await ProjectResource.initialize(
    //   sequelize,
    //   schemaName
    // );

    // const ProjectResourceFiscalModel = await ProjectResourceFiscal.initialize(
    //   sequelize,
    //   schemaName
    // );

    // const ProjectResourceFiscalRegionModel =
    //   await ProjectResourceFiscalRegion.initialize(sequelize, schemaName);

    // const ProjectModel = await Project.initialize(sequelize, schemaName);

    const ProjectFiscalModel = await ProjectFiscal.initialize(
      sequelize,
      schemaName
    );

    // const ProjectResourceTimelineModel =
    //   await ProjectResourceTimeline.initialize(sequelize, schemaName);

    // const ProjectResourceHistoryModel = await ProjectResourceHistory.initialize(
    //   sequelize,
    //   schemaName
    // );

    const ResourcesModel = await Resources.initialize(sequelize, schemaName);
    // const ResourcesFiscalModel = await ResourceFiscal.initialize(
    //   sequelize,
    //   schemaName
    // );
    // const ResourceFiscalRegionModel = await ResourceFiscalRegion.initialize(
    //   sequelize,
    //   schemaName
    // );

    // const ProjectFiscalRegionModel = await ProjectFiscalRegion.initialize(
    //   sequelize,
    //   schemaName
    // );
    // const AccountFiscalRegionModel = await AccountFiscalRegion.initialize(
    //   sequelize,
    //   schemaName
    // );

    // ProjectResourceModel.belongsTo(AccountDetailsModel, {
    //   foreignKey: "account_rid",
    //   targetKey: "account_rid",
    //   as: "project_resource_account",
    // });

    // ProjectResourceModel.belongsTo(ProjectModel, {
    //   foreignKey: "project_rid",
    //   targetKey: "rid",
    //   as: "project_resource_project",
    // });

    // ProjectResourceModel.belongsTo(ProjectFiscalModel, {
    //   foreignKey: "project_fiscal_rid",
    //   targetKey: "rid",
    //   as: "project_resource_project_fiscal",
    // });

    CaseProjectResourceModel.belongsTo(ResourcesModel, {
      foreignKey: "resource_rid",
      targetKey: "rid",
      as: "project_resource_resource",
    });

    // ProjectResourceFiscalModel.belongsTo(AccountDetailsModel, {
    //   foreignKey: "account_rid",
    //   targetKey: "account_rid",
    //   as: "project_resource__fiscal_account",
    // });

    // ProjectResourceFiscalModel.belongsTo(ProjectModel, {
    //   foreignKey: "project_rid",
    //   targetKey: "rid",
    //   as: "project_resource_fiscal_project",
    // });

    CaseProjectResourceModel.belongsTo(ProjectFiscalModel, {
      foreignKey: "project_fiscal_rid",
      targetKey: "rid",
      as: "project_resource_fiscal_project_fiscal",
    });

    // ProjectResourceFiscalModel.belongsTo(ResourcesModel, {
    //   foreignKey: "resource_rid",
    //   targetKey: "rid",
    //   as: "project_resource_fiscal_resource",
    // });

    // ProjectResourceFiscalRegionModel.belongsTo(AccountDetailsModel, {
    //   foreignKey: "account_rid",
    //   targetKey: "account_rid",
    //   as: "project_resource__fiscal_region_account",
    // });

    // ProjectResourceFiscalRegionModel.belongsTo(ProjectModel, {
    //   foreignKey: "project_rid",
    //   targetKey: "rid",
    //   as: "project_resource_fiscal_region_project",
    // });

    // ProjectResourceFiscalRegionModel.belongsTo(ProjectFiscalModel, {
    //   foreignKey: "project_fiscal_rid",
    //   targetKey: "rid",
    //   as: "project_resource_fiscal_region_project_fiscal",
    // });

    // ProjectResourceFiscalRegionModel.belongsTo(ResourcesModel, {
    //   foreignKey: "resource_rid",
    //   targetKey: "rid",
    //   as: "project_resource_fiscal_region_resource",
    // });

    // ProjectResourceTimelineModel.belongsTo(AccountDetailsModel, {
    //   foreignKey: "account_rid",
    //   targetKey: "account_rid",
    //   as: "project_resource_timeline_account",
    // });

    // ProjectResourceTimelineModel.belongsTo(ProjectResourceModel, {
    //   foreignKey: "entity_rid",
    //   targetKey: "rid",
    //   as: "project_resource_timeline_project_resource",
    // });

    // ProjectResourceHistoryModel.belongsTo(ProjectResourceModel, {
    //   foreignKey: "project_resource_rid",
    //   targetKey: "rid",
    //   as: "project_resource_histoy_project_resource",
    // });

    // ProjectResourceModel.belongsTo(ResourcesModel, {
    //   foreignKey: "resource_rid",
    //   targetKey: "rid",
    //   as: "project_resource_resource",
    // });
    const models = {
      // ProjectResource: ProjectResourceModel,
      // Project: ProjectModel,
      ProjectFiscal: ProjectFiscalModel,
      // ProjectResourceTimeline: ProjectResourceTimelineModel,
      // ProjectResourceHistory: ProjectResourceHistoryModel,
      // ProjectResourceFiscal: ProjectResourceFiscalModel,
      // ProjectResourceFiscalRegion: ProjectResourceFiscalRegionModel,
      Resources: ResourcesModel,
      CaseProjectResource: CaseProjectResourceModel,
      // ResourcesFiscal: ResourcesFiscalModel,
      // ResourceFiscalRegion: ResourceFiscalRegionModel,
      // AccountFiscal: AccountFiscalModel,
      // ProjectFiscalRegion: ProjectFiscalRegionModel,
      // AccountFiscalRegion: AccountFiscalRegionModel,
    };
    this.modelCache.set(schemaName, models);
    return models;
  }

  async listProjectResourceSchema(
    accountNumber: string,
    accountId: string,
    caseId: string,
    rawFilters: Record<string, any> = {},
    filters: Record<string, any> = {},
    fiscalYear: number,
    offset: number,
    limit: number,
    order: Order,
    sortBy: string,
    sortOrder: string
  ) {
    const { CaseProjectResource, Resources } = await this.getModels(accountNumber);

    const whereFilters: any = {
      account_rid: accountId,
      case_rid: caseId,
      ...filters,
    };

    if (fiscalYear) {
      whereFilters.fiscal_year = fiscalYear;
    }

    const isDbField = ![
      "region_name",
      "resource_type_name",
      "country_name",
      "resource_code",
      "resource_role",
      "resource_name",
      "resource_type_rid",
      "status_name"
    ].includes(sortBy);
    const dbOrder =
      isDbField && sortBy && sortOrder
        ? [literal(`"${sortBy}" ${sortOrder} NULLS LAST`)]
        : order;

    let projectResource = await CaseProjectResource.findAll({
      order: dbOrder,
      where: {
        ...whereFilters,
      },
      attributes: {
        include: [
          [Sequelize.col("project_resource_fiscal_project_fiscal.project_code"), "project_code"],
          [Sequelize.col("project_resource_fiscal_project_fiscal.project_name"), "project_name"],
        ]
      },
      include: [
        {
          model: ProjectFiscal,
          attributes: [],
          required: false,
          as: "project_resource_fiscal_project_fiscal",
        },
        {
          model: Resources,
          attributes: [],
          required: false,
          as: "project_resource_resource",
        }
      ]
    });

    let totalCount = await CaseProjectResource.count({
      where: {
        ...whereFilters,
      },
      include: [
        {
          model: Resources,
          attributes: [],
          required: false,
          as: "project_resource_resource",
        },
      ],
    });

    if (projectResource && projectResource.length > 0) {
      projectResource = await this.insertProjectRegionData(projectResource);
      projectResource = await this.insertProjectCurrencyData(projectResource);
      projectResource = await this.insertResourceTypeData(
        accountNumber,
        projectResource
      );
      projectResource = await this.insertResourceCode(
        accountNumber,
        projectResource
      );
      projectResource = await this.resourceStatusType(
        accountNumber,
        projectResource
      );

      projectResource = await this.inMemorySortAndFilter(
        projectResource,
        sortBy,
        sortOrder,
        rawFilters
      );
    }

    if (totalCount > projectResource.length) {
      totalCount = projectResource.length;
    }

    return {
      data: projectResource,
      count: totalCount,
    };
  }



  async exportProjectResourceSchema(
    accountNumber: string,
    accountId: string,
    caseId: string,
    rawFilters: Record<string, any> = {},
    filters: Record<string, any> = {},
    fiscalYear: number,
    order: Order,
    sortBy: string,
    sortOrder: string,
    userId: string
  ) {
    const { CaseProjectResource } = await this.getModels(accountNumber);

    const whereFilters: any = {
      account_rid: accountId,
      case_rid: caseId,
      ...filters,
    };

    if (fiscalYear) {
      whereFilters.fiscal_year = fiscalYear;
    }

    const isDbField = ![
      "region_name",
      "resource_type_name",
      "country_name",
      "resource_code",
      "resource_role",
      "resource_name",
      "resource_type_rid",
      "status_name"
    ].includes(sortBy);
    const dbOrder =
      isDbField && sortBy && sortOrder
        ? [literal(`"${sortBy}" ${sortOrder} NULLS LAST`)]
        : order;

    let projectResource = await CaseProjectResource.findAll({
      order: dbOrder,
      where: {
        ...whereFilters,
      },
      attributes: {
        include: [
          [Sequelize.col("project_resource_fiscal_project_fiscal.project_code"), "project_code"],
          [Sequelize.col("project_resource_fiscal_project_fiscal.project_name"), "project_name"],
        ]
      },
      include: [
        {
          model: ProjectFiscal,
          attributes: [],
          required: false,
          as: "project_resource_fiscal_project_fiscal",
        },]
    });



    if (projectResource && projectResource.length > 0) {
      projectResource = await this.insertProjectRegionData(projectResource);
      projectResource = await this.insertResourceTypeData(
        accountNumber,
        projectResource
      );
      projectResource = await this.insertResourceCode(
        accountNumber,
        projectResource
      );
      projectResource = await this.resourceStatusType(
        accountNumber,
        projectResource
      );

      projectResource = await this.inMemorySortAndFilter(
        projectResource,
        sortBy,
        sortOrder,
        rawFilters
      );
    }
    const schemaService = new SchemaService();
    const projectResourceFields = await schemaService.getAllowedExportFields(
      userId,
      "projects_resources_view_edit"
    );
    const projectFields = await schemaService.getAllowedExportFields(
      userId,
      "projects_view_edit"
    );
    const allowedFieldSet = new Set<string>();
    for (const field of projectResourceFields) {
      if (field.read) {
        allowedFieldSet.add(field.field_name);
      }
    }
    for (const field of projectFields) {
      if (field.read) {
        allowedFieldSet.add(field.field_name);
      }
    }

    const formatNumberForExport = (
      value: any,
      currency_symbol: string
    ): string => {
      if (value == null || value === "") return "-";

      try {
        const decimalValue = new Decimal(value.toString());
        if (!decimalValue.isFinite()) return "-";

        const formattedValue = decimalValue.toFixed(2);
        const pattern = currency(0, {
          symbol: currency_symbol || "$",
          precision: 2,
          pattern: "! #",
          separator: ",",
          decimal: ".",
        }).format();

        // const [intPart, decPart] = formattedValue.split(".");
        const parts = formattedValue.split(".");
        const intPart = parts[0] || "0";
        const decPart = parts[1] || "00";
        const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const formattedNumber = `${formattedInt}.${decPart}`;

        return pattern.replace("0.00", formattedNumber);
      } catch (error) {
        console.error("Error formatting number:", error);
        return "-";
      }
    };

    const labelMap: Record<string, string> = {
      resource_code: "Resource Code",
      resource_name: "Resource Name",
      project_code: "Project Code",
      project_name: "Project Name",
      country_rid: "Resource Country",
      region_rid: "Resource Region",
      fiscal_year: "Fiscal Year",
      resource_type_rid: "Resource Type",
      resource_role: "Role",
      total_hours_pro_res: "Effort (Hours)",
      net_total_cost_pro_res: "Net Resource Cost",
      resource_designation: "Designation",
      // qre_percent: "QRE %",
      qre_final: "QRE Final",
      // status_rid: "Status",
      description: "Comments",
      project_resource_role: "Project Resource Role",
      r_number: "Project Resource ID"
    };
    let exportData = projectResource.map((resource: any) => {
      const exportData: Record<string, string> = {};
      let resultMap = {
        resource_code: resource.resource_code || "-",
        resource_name: resource.resource_name || "-",
        project_code: resource.project_code || "-",
        project_name: resource.project_name || "-",
        country_rid: resource.country_name || "-",
        region_rid: resource.region_name || "-",
        fiscal_year: resource.fiscal_year || "-",
        resource_type_rid: resource?.resource_type_name || "-",
        resource_role: resource.resource_role || "-",
        project_resource_role: resource.project_resource_role || "-",
        total_hours_pro_res: resource.total_hours_pro_res || "-",
        net_total_cost_pro_res: formatNumberForExport(resource.net_total_cost_pro_res, resource.currency_symbol || '$') || "-",
        qre_percent: resource.qre_percent || "-",
        qre_final: resource.qre_final || "-",
        status_rid: resource.status_name || "-",
        description: resource.description || "-",
        r_number: resource.r_number || "-",
        case_project_rid: resource.case_project_rid || "-",
        case_rid: resource.case_rid || "-",
        project_rid: resource.project_rid || "-",
        project_fiscal_rid: resource.project_fiscal_rid || "-"
      };
      for (const [field, value] of Object.entries(resultMap)) {
        if (allowedFieldSet.has(field)) {
          const label = labelMap[field];
          if (label) {
            exportData[label] = value;
          }
        }
      }

      return exportData;
    });

    return exportData;
  }

  async insertProjectGeoData(projectResource: any) {
    try {
      const countryId = projectResource.country_rid;
      const regionId = projectResource.region_rid;
      const currencyId = projectResource.currency_rid;

      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.getMainSequelize();
      }

      let countryRow: any = null;
      let regionRow: any = null;
      let currencyRow: any = null;

      if (countryId) {
        const result = await this.mainDbSequelize.query(
          rawQueries.fetchCountryById(),
          {
            replacements: { id: countryId },
            type: "SELECT",
          }
        );
        countryRow =
          Array.isArray(result) && result.length > 0 ? result[0] : null;
      }

      if (regionId) {
        const result = await this.mainDbSequelize.query(
          rawQueries.fetchStateById(),
          {
            replacements: { id: regionId },
            type: "SELECT",
          }
        );
        regionRow =
          Array.isArray(result) && result.length > 0 ? result[0] : null;
      }

      if (currencyId) {
        const result = await this.mainDbSequelize.query(
          rawQueries.fetchCurrencyById(),
          {
            replacements: { id: currencyId },
            type: "SELECT",
          }
        );
        currencyRow =
          Array.isArray(result) && result.length > 0 ? result[0] : null;
      }

      projectResource = {
        ...projectResource.dataValues,
        country_name: countryRow?.country_name || null,
        country_code: countryRow?.country_code || null,
        region_name: regionRow?.state_name || null,
        currency_name: currencyRow?.currency_code || null,
        currency_symbol: currencyRow?.currency_symbol || null,
      };

      return projectResource;
    } catch (err) {
      errorLog("Error fetching geo data", (err as Error).message);
      throw new Error("Error fetching geo data: " + (err as Error).message);
    }
  }

  async insertUserDetails(projectResource: any): Promise<any> {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.getMainSequelize();
      }

      const createdById = projectResource.created_by;
      const modifiedById = projectResource.modified_by;

      const getUserFullName = async (userId: string) => {
        if (!userId) return null;

        const [results]: any = await this.mainDbSequelize?.query(
          rawQueries.fetchUserById(),
          {
            replacements: { userId },
            type: "SELECT",
          }
        );

        if (!results) return null;

        const { first_name, middle_name, last_name } = results as any;
        return [first_name, middle_name, last_name].filter(Boolean).join(" ");
      };

      const createdName = await getUserFullName(createdById);
      const modifiedName = await getUserFullName(modifiedById);

      return {
        ...projectResource,
        created_name: createdName || null,
        modified_name: modifiedName || null,
      };
    } catch (err) {
      errorLog("Error adding user details", (err as Error).message);
      throw new Error("Error adding user details" + (err as Error).message);
    }
  }

  async insertProjectResourceTypeAndStatus(projectResource: any) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.getMainSequelize();
      }

      if (projectResource.status_rid) {
        const statusResult: any = await this.mainDbSequelize?.query(
          rawQueries.fetchResourceStatusById(),
          {
            replacements: { id: projectResource.status_rid },
            type: "SELECT",
          }
        );

        const status = statusResult[0];
        projectResource.status_name = status?.resource_status_name;
      } else {
        projectResource.status_name = null;
      }
      if (projectResource.resource_type_rid) {
        const projectTypeResult: any = await this.mainDbSequelize?.query(
          rawQueries.fetchSpecificResourceTypeById(),
          {
            replacements: { resourceTypeId: projectResource.resource_type_rid },
            type: "SELECT",
          }
        );
        const projectType = projectTypeResult[0];
        projectResource.resource_type_name = projectType?.resource_type_name;
      } else {
        projectResource.resource_type_name = null;
      }

      return projectResource;
    } catch (err) {
      errorLog("Error enriching key roles", (err as Error).message);
      throw new Error("Error enriching key roles: " + (err as Error).message);
    }
  }

  async insertProjectResourceRoleSkill(projectResource: any) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.getMainSequelize();
      }

      if (projectResource.assigned_skill_role_type_rid) {
        const skillResult: any = await this.mainDbSequelize?.query(
          rawQueries.fetchSkillRoleSubType(),
          {
            replacements: { skillTypeId: projectResource.assigned_skill_role_type_rid },
            type: "SELECT",
          }
        );

        const roleSkill = skillResult[0];
        projectResource.assigned_skill_role = roleSkill?.sub_type_name;
      } else {
        projectResource.assigned_skill_role = null;
      }

      return projectResource;
    } catch (err) {
      errorLog("Error enriching key roles", (err as Error).message);
      throw new Error("Error enriching key roles: " + (err as Error).message);
    }
  }

  async insertResourceDetails(accountNumber: string, projectResource: any) {
    try {
      const { Resources } = await this.getModels(accountNumber);

      const resourceRid = projectResource.resource_rid;

      if (!resourceRid) {
        return {
          ...(projectResource.dataValues ?? projectResource),
          resource_code: null,
        };
      }

      // Fetch the resource code for the given rid
      const resource = await Resources.findOne({
        where: { rid: resourceRid },
        attributes: ["resource_code", "resource_name", "resource_type_rid"],
        raw: true,
      });

      const resourceCode = resource?.resource_code || null;
      const resourceName = resource?.resource_name || null;
      const resourceTypeRid = resource?.resource_type_rid || null;
      let resourceTypeName = null;
      if (resourceTypeRid) {
        // Fetch the resource type name for the given rid
        const [resourceType]: any = await this.mainDbSequelize?.query(
          `SELECT resource_type_name FROM ${MAIN_SCHEMA_NAME}.resource_type WHERE rid = :id`,
          {
            replacements: { id: resourceTypeRid },
            type: "SELECT",
          }
        );
        console.log('resourceType in return', resourceType);
        resourceTypeName = resourceType?.resource_type_name || null;
      }

      // Enrich and return the project resource object
      return {
        ...(projectResource.dataValues ?? projectResource),
        resource_code: resourceCode,
        resource_name: resourceName,
        resource_type_name: resourceTypeName,
      };
    } catch (err) {
      errorLog("Error fetching resource details", (err as Error).message);
      throw new Error(
        "Error fetching resource details: " + (err as Error).message
      );
    }
  }

  async fetchProjectResourceDetails(
    accountNumber: string,
    caseProjectResourceId: string
  ) {
    const { CaseProjectResource } = await this.getModels(accountNumber);

    let projectResource = await CaseProjectResource.findOne({
      where: {
        rid: caseProjectResourceId,
      },
    });

    if (projectResource) {
      projectResource = await this.insertProjectGeoData(projectResource);
      projectResource = await this.insertUserDetails(projectResource);
      projectResource = await this.insertProjectResourceTypeAndStatus(
        projectResource
      );
      projectResource = await this.insertProjectResourceRoleSkill(
        projectResource
      );
      projectResource = await this.insertResourceDetails(
        accountNumber,
        projectResource
      );
    }

    return projectResource;
  }

  async validateProjectFiscalById(accountNumber: string, projectId: string) {
    const { ProjectFiscal } = await this.getModels(accountNumber);
    const projectData = await ProjectFiscal.findOne({
      where: {
        rid: projectId,
      },
    });
    if (!projectData) {
      errorLog("Error fetching project fiscal", "Invalid project ID: Project doesn't exists");
      throw new Error("Invalid project ID: Project doesn't exists");
    }
    return projectData;
  }

  async validateResourceByCode(
    accountNumber: string,
    resourceCode: string,
    accountId: string
  ) {
    const { Resources } = await this.getModels(accountNumber);

    const resourceData = await Resources.findOne({
      where: {
        resource_code: resourceCode,
        account_rid: accountId,
      },
    });

    return resourceData;
  }

  async getResourceStatuses(): Promise<Map<string, string> | null> {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.getMainSequelize();
      }
      const resourceStatus = rawQueries.fetchAllResourceStatus();
      const results = await this.mainDbSequelize.query(resourceStatus, {
        type: "SELECT",
      });

      if (!results || !Array.isArray(results)) {
        return null;
      }

      // Create lookup maps
      const statusMap = new Map(
        results.map((st: any) => [st.resource_status_name, st.rid])
      );

      return statusMap;
    } catch (error) {
      errorLog("Error fetching resource statuses:", (error as Error).message);
      return null;
    }
  }

  async getCurrencyThreshold(
    currency_rid?: string | null
  ): Promise<number | null> {
    let currencyResult;

    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.getMainSequelize();
    }

    if (currency_rid) {
      [currencyResult] = await this.mainDbSequelize.query(
        rawQueries.fetchCurrencyThresold(),
        {
          replacements: { currency_rid },
          type: "SELECT",
        }
      );
    } else {
      [currencyResult] = await this.mainDbSequelize.query(
        rawQueries.fetchDefualtCurrencyThresold(),
        {
          type: "SELECT",
        }
      );
    }

    return (currencyResult as any)?.currency_threshold ?? null;
  }



  async fetchProjectResourceById(
    accountNumber: string,
    projectResourceId: string
  ) {
    const { CaseProjectResource } = await this.getModels(accountNumber);

    const projectResourceData = await CaseProjectResource.findOne({
      where: {
        rid: projectResourceId,
      },
    });

    return projectResourceData;
  }


  async fetchExistingProjectResource(
    accountNumber: string,
    project_resource_rid: string,
    transaction: Transaction
  ) {
    const { CaseProjectResource } = await this.getModels(accountNumber);

    const existingData = await CaseProjectResource.findOne({
      where: {
        rid: project_resource_rid,
      },
      transaction,
    });

    return existingData;
  }

  async validateResourceById(
    accountNumber: string,
    resourceId: string,
    accountId: string
  ) {
    const { Resources } = await this.getModels(accountNumber);

    const resourceData = await Resources.findOne({
      where: {
        rid: resourceId,
        account_rid: accountId,
      },
    });

    return resourceData;
  }


}
