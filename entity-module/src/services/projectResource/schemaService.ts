import { Op, Order, Sequelize, Transaction, literal } from "sequelize";
import {
  ProjectResource,
  setupProjectResourceSequence,
} from "../../models/projectResource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { initMainDbSequelize } from "../../config/mainDataSource";
import {
  ICreateProjectResource,
  IUpdateInlineProjectResource,
  IUpdateProjectResource,
} from "../../utils/types";
import moment from "moment";
import { Project } from "../../models/project";
import { ProjectResourceMapper } from "../../utils/projectMapper";
import { ProjectFiscal } from "../../models/projectFiscal";
import {
  ProjectResourceTimeline,
  setupProjectResourceTimelineSequence,
} from "../../models/projectResourceTimeline";
import {
  ProjectResourceHistory,
  setupProjectResourceHistorySequence,
} from "../../models/projectResourceHistory";
import {
  ProjectResourceFiscal,
  setupProjectResourceFiscalSequence,
} from "../../models/projectResourceFiscal";
import {
  ProjectResourceFiscalRegion,
  setupProjectResourceFiscalRegionSequence,
} from "../../models/projectResourceFiscalRegion";
import { Resources } from "../../models/resource";
import { ResourceFiscal } from "../../models/resourceFiscal";
import { ResourceFiscalRegion } from "../../models/resourceFiscalRegion";
import { AccountFiscal } from "../../models/accountFiscal";
import { ProjectFiscalRegion } from "../../models/projectFiscalRegion";
import { AccountFiscalRegion } from "../../models/accountFiscalRegion";
import { MAIN_SCHEMA_NAME, SCHEMANAME_PREFIX, rawQueries } from "../../utils/constants";
import SchemaService from "../schemaService";
import { fetchProjectById, fetchResCodesForPrjRes, getCurrencyDetailsQuery } from "../../utils/rawQueries";
import AccountDetails from "../../models/accountDetails";
import Decimal from "decimal.js";
import currency from "currency.js";
import { errorLog, logMessage } from "../../utils/helpers";
import { CaseProjectResource } from "../../models/caseProjectResourceModel";
import { CaseProjectResourceFiscal } from "../../models/caseProjectResourceFiscalModel";
import { CaseProject } from "../../models/caseProjectsModel";
import { CaseProjectFiscalRegion } from "../../models/caseProjectFiscalRegionModel";

export class ProjectResourceSchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;

  private modelCache: Map<
    string,
    {
      ProjectResource: ReturnType<typeof ProjectResource.initialize>;
      Project: ReturnType<typeof Project.initialize>;
      ProjectFiscal: ReturnType<typeof ProjectFiscal.initialize>;
      ProjectResourceTimeline: ReturnType<
        typeof ProjectResourceTimeline.initialize
      >;
      ProjectResourceHistory: ReturnType<
        typeof ProjectResourceHistory.initialize
      >;
      ProjectResourceFiscal: ReturnType<
        typeof ProjectResourceFiscal.initialize
      >;
      ProjectResourceFiscalRegion: ReturnType<
        typeof ProjectResourceFiscalRegion.initialize
      >;
      Resources: ReturnType<typeof Resources.initialize>;
      ResourcesFiscal: ReturnType<typeof ResourceFiscal.initialize>;
      ResourceFiscalRegion: ReturnType<typeof ResourceFiscalRegion.initialize>;
      AccountFiscal: ReturnType<typeof AccountFiscal.initialize>;
      ProjectFiscalRegion: ReturnType<typeof ProjectFiscalRegion.initialize>;
      AccountFiscalRegion: ReturnType<typeof AccountFiscalRegion.initialize>;
    }
  > = new Map();

  constructor() { }

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

  private async getModels(accountNumber: string) {
    const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;

    const sequelize = await this.getSequelize();
    this.mainDbSequelize = await this.getMainSequelize();

    const AccountFiscalModel = await AccountFiscal.initialize(
      sequelize,
      schemaName
    );
    const AccountDetailsModel = await AccountDetails.initialize(
      sequelize,
      schemaName
    );

    const ProjectResourceModel = await ProjectResource.initialize(
      sequelize,
      schemaName
    );

    const ProjectResourceFiscalModel = await ProjectResourceFiscal.initialize(
      sequelize,
      schemaName
    );

    const ProjectResourceFiscalRegionModel =
      await ProjectResourceFiscalRegion.initialize(sequelize, schemaName);

    const ProjectModel = await Project.initialize(sequelize, schemaName);

    const ProjectFiscalModel = await ProjectFiscal.initialize(
      sequelize,
      schemaName
    );

    const ProjectResourceTimelineModel =
      await ProjectResourceTimeline.initialize(sequelize, schemaName);

    const ProjectResourceHistoryModel = await ProjectResourceHistory.initialize(
      sequelize,
      schemaName
    );

    const ResourcesModel = await Resources.initialize(sequelize, schemaName);
    const ResourcesFiscalModel = await ResourceFiscal.initialize(
      sequelize,
      schemaName
    );
    const ResourceFiscalRegionModel = await ResourceFiscalRegion.initialize(
      sequelize,
      schemaName
    );

    const ProjectFiscalRegionModel = await ProjectFiscalRegion.initialize(
      sequelize,
      schemaName
    );
    const AccountFiscalRegionModel = await AccountFiscalRegion.initialize(
      sequelize,
      schemaName
    );

    const CaseProjectResourceModel = await CaseProjectResource.initialize(
      sequelize,
      schemaName
    )

    const CaseProjectResourceFiscalModel = await CaseProjectResourceFiscal.initialize(
      sequelize,
      schemaName
    )

    const CaseProjectModel = await CaseProject.initialize(
      sequelize,
      schemaName
    )

    const CaseProjectFiscalRegionModel = await CaseProjectFiscalRegion.initialize(
      sequelize,
      schemaName
    )

    CaseProjectResourceModel.belongsTo(ResourcesModel, {
      foreignKey: "resource_rid",
      targetKey: "rid",
      as: "project_resource_resource",
    });

    CaseProjectResourceModel.belongsTo(CaseProjectModel, {
      foreignKey: "case_project_rid",
      targetKey: "rid",
      as: "case_project",
    });


    ProjectResourceModel.belongsTo(AccountDetailsModel, {
      foreignKey: "account_rid",
      targetKey: "account_rid",
      as: "project_resource_account",
    });

    ProjectResourceModel.belongsTo(ProjectModel, {
      foreignKey: "project_rid",
      targetKey: "rid",
      as: "project_resource_project",
    });

    ProjectResourceModel.belongsTo(ProjectFiscalModel, {
      foreignKey: "project_fiscal_rid",
      targetKey: "rid",
      as: "project_resource_project_fiscal",
    });

    ProjectResourceModel.belongsTo(ResourcesModel, {
      foreignKey: "resource_rid",
      targetKey: "rid",
      as: "project_resource_resource",
    });

    ProjectResourceFiscalModel.belongsTo(AccountDetailsModel, {
      foreignKey: "account_rid",
      targetKey: "account_rid",
      as: "project_resource__fiscal_account",
    });

    ProjectResourceFiscalModel.belongsTo(ProjectModel, {
      foreignKey: "project_rid",
      targetKey: "rid",
      as: "project_resource_fiscal_project",
    });

    ProjectResourceFiscalModel.belongsTo(ProjectFiscalModel, {
      foreignKey: "project_fiscal_rid",
      targetKey: "rid",
      as: "project_resource_fiscal_project_fiscal",
    });

    ProjectResourceFiscalModel.belongsTo(ResourcesModel, {
      foreignKey: "resource_rid",
      targetKey: "rid",
      as: "project_resource_fiscal_resource",
    });

    ProjectResourceFiscalRegionModel.belongsTo(AccountDetailsModel, {
      foreignKey: "account_rid",
      targetKey: "account_rid",
      as: "project_resource__fiscal_region_account",
    });

    ProjectResourceFiscalRegionModel.belongsTo(ProjectModel, {
      foreignKey: "project_rid",
      targetKey: "rid",
      as: "project_resource_fiscal_region_project",
    });

    ProjectResourceFiscalRegionModel.belongsTo(ProjectFiscalModel, {
      foreignKey: "project_fiscal_rid",
      targetKey: "rid",
      as: "project_resource_fiscal_region_project_fiscal",
    });

    ProjectResourceFiscalRegionModel.belongsTo(ResourcesModel, {
      foreignKey: "resource_rid",
      targetKey: "rid",
      as: "project_resource_fiscal_region_resource",
    });

    ProjectResourceTimelineModel.belongsTo(AccountDetailsModel, {
      foreignKey: "account_rid",
      targetKey: "account_rid",
      as: "project_resource_timeline_account",
    });

    ProjectResourceTimelineModel.belongsTo(ProjectResourceModel, {
      foreignKey: "entity_rid",
      targetKey: "rid",
      as: "project_resource_timeline_project_resource",
    });

    ProjectResourceHistoryModel.belongsTo(ProjectResourceModel, {
      foreignKey: "project_resource_rid",
      targetKey: "rid",
      as: "project_resource_histoy_project_resource",
    });

    // ProjectResourceModel.belongsTo(ResourcesModel, {
    //   foreignKey: "resource_rid",
    //   targetKey: "rid",
    //   as: "project_resource_resource",
    // });
    const models = {
      ProjectResource: ProjectResourceModel,
      Project: ProjectModel,
      ProjectFiscal: ProjectFiscalModel,
      ProjectResourceTimeline: ProjectResourceTimelineModel,
      ProjectResourceHistory: ProjectResourceHistoryModel,
      ProjectResourceFiscal: ProjectResourceFiscalModel,
      ProjectResourceFiscalRegion: ProjectResourceFiscalRegionModel,
      Resources: ResourcesModel,
      ResourcesFiscal: ResourcesFiscalModel,
      ResourceFiscalRegion: ResourceFiscalRegionModel,
      AccountFiscal: AccountFiscalModel,
      ProjectFiscalRegion: ProjectFiscalRegionModel,
      AccountFiscalRegion: AccountFiscalRegionModel,
      CaseProjectResource: CaseProjectResourceModel,
      CaseProjectResourceFiscal: CaseProjectResourceFiscalModel,
      CaseProject: CaseProjectModel,
      CaseProjectFiscalRegion: CaseProjectFiscalRegionModel,
    };
    this.modelCache.set(schemaName, models);
    return models;
  }

  async createProjectResourcesTable(accountNumber: string) {
    const {
      ProjectResource,
      ProjectResourceTimeline,
      ProjectResourceHistory,
      ProjectResourceFiscal,
      ProjectResourceFiscalRegion,
      ResourceFiscalRegion,
      ProjectFiscalRegion,
      AccountFiscalRegion,
    } = await this.getModels(accountNumber);
    try {
      await ProjectResource.sync({ force: false });
      await ProjectResourceFiscal.sync({ force: false });
      await ProjectResourceFiscalRegion.sync({ force: false });
      await ProjectResourceTimeline.sync({ force: false });
      await ProjectResourceHistory.sync({ force: false });
      await ResourceFiscalRegion.sync({ force: false });
      await ProjectFiscalRegion.sync({ force: false });
      await AccountFiscalRegion.sync({ force: false });
      if (this.orgDbSequelize) {
        const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
        await setupProjectResourceSequence(this.orgDbSequelize, schemaName);
        await setupProjectResourceFiscalSequence(
          this.orgDbSequelize,
          schemaName
        );
        await setupProjectResourceFiscalRegionSequence(
          this.orgDbSequelize,
          schemaName
        );
        await setupProjectResourceHistorySequence(
          this.orgDbSequelize,
          schemaName
        );
        await setupProjectResourceTimelineSequence(
          this.orgDbSequelize,
          schemaName
        );
      }
    } catch (err) {
      errorLog(`Error creating project resources table, ${(err as Error).message}`);
      throw new Error("Error creating project resources table");
    }
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

  async validateProjectResource(
    accountNumber: string,
    projectResourceData: any,
    fiscalYear: number,
    projectCode: string,
    resourceData: any
  ) {
    const { ProjectResource } = await this.getModels(accountNumber);

    const startDateTocheck = projectResourceData.start_date
      ? moment.utc(projectResourceData.start_date, "YYYY-MM-DD")
      : null;

    const endDateToCheck = projectResourceData.end_date
      ? moment.utc(projectResourceData.end_date, "YYYY-MM-DD")
      : null;

    const projectData = await ProjectResource.findOne({
      where: {
        account_rid: projectResourceData.account_rid,
        fiscal_year: fiscalYear,
        start_date: startDateTocheck ? startDateTocheck?.toDate() : null,
        end_date: endDateToCheck ? endDateToCheck?.toDate() : null,
        rid: { [Op.ne]: projectResourceData.project_resource_rid },
        project_fiscal_rid: projectResourceData.project_fiscal_rid,
        resource_rid: resourceData.rid,
      },
    });

    return !!projectData;
  }

  async validateProjectResourceInlineEdit(
    accountNumber: string,
    projectResourceData: any,
    fiscalYear: number,
    projectCode: string,
    existingProjectResource: any,
    resourceData: any
  ) {
    const { ProjectResource } = await this.getModels(accountNumber);

    const startDateTocheck = projectResourceData.start_date
      ? moment.utc(projectResourceData.start_date, "YYYY-MM-DD")
      : existingProjectResource.start_date
        ? moment.utc(existingProjectResource.start_date, "YYYY-MM-DD")
        : null;

    const endDateToCheck = projectResourceData.end_date
      ? moment.utc(projectResourceData.end_date, "YYYY-MM-DD")
      : existingProjectResource.end_date
        ? moment.utc(existingProjectResource.end_date, "YYYY-MM-DD")
        : null;

    const projectData = await ProjectResource.findOne({
      where: {
        account_rid: projectResourceData.account_rid,
        fiscal_year: fiscalYear,
        start_date: startDateTocheck ? startDateTocheck?.toDate() : null,
        end_date: endDateToCheck ? endDateToCheck?.toDate() : null,
        rid: { [Op.ne]: projectResourceData.project_resource_rid },
        project_fiscal_rid: projectResourceData.project_fiscal_rid,
        resource_rid: resourceData.rid,
      },
    });

    return !!projectData;
  }

  async existsInProjectResourceTable(
    accountNumber: string,
    accountId: string,
    projectData: any,
    resourceData: any,
    fiscalYear: number,
    projectCode: string,
    resourceCode: string,
    startDate?: string | null,
    endDate?: string | null
  ): Promise<boolean> {
    const { ProjectResource } = await this.getModels(accountNumber);

    const startDateTocheck = startDate
      ? moment.utc(startDate, "YYYY-MM-DD")
      : null;
    const endDateToCheck = endDate ? moment.utc(endDate, "YYYY-MM-DD") : null;

    const isExists = await ProjectResource.findOne({
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
        start_date: startDateTocheck ? startDateTocheck?.toDate() : null,
        end_date: endDateToCheck ? endDateToCheck?.toDate() : null,
        project_fiscal_rid: projectData.rid,
        resource_rid: resourceData.rid,
        // [Op.and]: [
        //   Sequelize.where(
        //     Sequelize.fn("LOWER", Sequelize.col("project_code")),
        //     Sequelize.fn("LOWER", projectCode)
        //   ),
        //   Sequelize.where(
        //     Sequelize.fn("LOWER", Sequelize.col("resource_code")),
        //     Sequelize.fn("LOWER", resourceCode)
        //   ),
        // ],
      },
    });

    return !!isExists;
  }

  async existsInResourceTable(
    accountNumber: string,
    accountId: string,
    resourceCode: string,
    transaction: Transaction
  ): Promise<boolean> {
    const { Resources } = await this.getModels(accountNumber);

    const isExists = await Resources.findOne({
      where: {
        account_rid: accountId,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("resource_code")),
            Sequelize.fn("LOWER", resourceCode)
          ),
        ],
      },
      transaction,
    });

    return !!isExists;
  }

  async findDuplicateProjectResource(
    accountNumber: string,
    projectResourceData: ICreateProjectResource | IUpdateProjectResource,
    resourceData: any,
    statusMap: any
  ) {
    const { ProjectResource } = await this.getModels(accountNumber);

    const normalizedRole = projectResourceData.project_resource_role?.trim().toLowerCase();

    const whereClause: any = {
      resource_rid: resourceData.rid,
      account_rid: projectResourceData.account_rid,
      project_fiscal_rid: projectResourceData.project_fiscal_rid,
      status_rid: {
        [Op.in]: [
          statusMap?.get("Active"),
          statusMap?.get("Anomaly"),
          statusMap?.get("Duplicate"),
          null,
        ].filter(Boolean) as string[],
      },
    };

    if (normalizedRole !== undefined && normalizedRole !== null && normalizedRole.trim() !== null) {
      whereClause[Op.and] = [
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("project_resource_role")),
          normalizedRole
        ),
      ];
    } else {
      whereClause.project_resource_role = {
        [Op.is]: null,
      };
    }

    const data = await ProjectResource.findOne({ where: whereClause });

    return data;
  }

  async findDuplicateProjectResourceOnUpdate(
    accountNumber: string,
    projectResourceData: IUpdateProjectResource | IUpdateInlineProjectResource,
    resourceData: any,
    statusMap: any
  ) {
    const { ProjectResource } = await this.getModels(accountNumber);

    const normalizedRole = projectResourceData.project_resource_role?.trim().toLowerCase();

    const whereClause: any = {
      resource_rid: resourceData.rid,
      account_rid: projectResourceData.account_rid,
      project_fiscal_rid: projectResourceData.project_fiscal_rid,
      status_rid: {
        [Op.in]: [
          statusMap?.get("Active"),
          statusMap?.get("Anomaly"),
          statusMap?.get("Duplicate"),
          null,
        ].filter(Boolean) as string[],
      },
      rid: {
        [Op.ne]: projectResourceData.project_resource_rid,
      },
    };

    if (normalizedRole !== undefined && normalizedRole !== null && normalizedRole.trim() !== "") {
      // Compare non-null role using LOWER
      whereClause[Op.and] = [
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("project_resource_role")),
          normalizedRole
        ),
      ];
    } else {
      // Compare NULL role using IS NULL
      whereClause.project_resource_role = {
        [Op.is]: null,
      };
    }

    const data = await ProjectResource.findOne({ where: whereClause });

    return data;
  }

  async getExistingEffortInProjectResource(
    accountNumber: string,
    projectResourceData: any,
    resourceId: string
  ): Promise<ProjectResource[]> {

    const { ProjectResource } = await this.getModels(accountNumber);

    const startDate = projectResourceData.start_date
      ? moment.utc(projectResourceData.start_date)
      : null;
    const endDate = projectResourceData.end_date
      ? moment.utc(projectResourceData.end_date)
      : null;

    const whereClause: any = {
      project_fiscal_rid: projectResourceData.project_fiscal_rid,
      account_rid: projectResourceData.account_rid,
      resource_rid: resourceId,
      [Op.and]: [
        {
          start_date: { [Op.lte]: endDate?.toDate() },
        },
        {
          end_date: { [Op.gte]: startDate?.toDate() },
        },
      ],
    };

    const existingResources = await ProjectResource.findAll({
      where: whereClause,
    });

    return existingResources;
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

  async fetchProjectResourceById(
    accountNumber: string,
    projectResourceId: string
  ) {
    const { ProjectResource } = await this.getModels(accountNumber);

    const projectResourceData = await ProjectResource.findOne({
      where: {
        rid: projectResourceId,
      },
    });

    return projectResourceData;
  }

  async updateProjectResourceStatus(
    accountNumber: string,
    projectResourceId: string,
    statusId: string,
    userId: string,
    transaction: Transaction
  ) {
    const { ProjectResource } = await this.getModels(accountNumber);

    await ProjectResource.update({
      status_rid: statusId,
      modified_by: userId,
      modified_datetime: new Date(),
    }, {
      where: {
        rid: projectResourceId
      },
      transaction,
    })
  }

  async updateCaseProjectResourceStatus(
    accountNumber: string,
    projectResourceId: string,
    statusId: string,
    userId: string,
    transaction: Transaction,
    caseMapping: CaseProject
  ) {
    const { CaseProjectResource } = await this.getModels(accountNumber);

    await CaseProjectResource.update({
      status_rid: statusId,
      modified_by: userId,
      modified_datetime: new Date(),
    }, {
      where: {
        project_resource_rid: projectResourceId,
        case_rid: caseMapping.case_rid
      },
      transaction,
    })
  }

  async existsInResourceFiscalTable(
    accountNumber: string,
    accountId: string,
    resourceCode: string,
    fiscalYear: number,
    transaction: Transaction
  ): Promise<boolean> {
    const { ResourcesFiscal } = await this.getModels(accountNumber);

    const isExists = await ResourcesFiscal.findOne({
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("resource_code")),
            Sequelize.fn("LOWER", resourceCode)
          ),
        ],
      },
      transaction,
    });

    return !!isExists;
  }

  async existsInProjectFiscalTable(
    accountNumber: string,
    accountId: string,
    projectCode: string,
    fiscalYear: number,
    transaction: Transaction
  ): Promise<boolean> {
    const { ProjectFiscal } = await this.getModels(accountNumber);

    const isExists = await ProjectFiscal.findOne({
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("project_code")),
            Sequelize.fn("LOWER", projectCode)
          ),
        ],
      },
      transaction,
    });

    return !!isExists;
  }

  async existsInProjectFiscalRegionTable(
    accountNumber: string,
    accountId: string,
    projectId: string,
    fiscalYear: number,
    regionId: string,
    transaction: Transaction
  ) {
    const { ProjectFiscalRegion } = await this.getModels(accountNumber);

    const isExists = await ProjectFiscalRegion.findOne({
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
        region_rid: regionId,
        project_fiscal_rid: projectId,
        // [Op.and]: [
        //   Sequelize.where(
        //     Sequelize.fn("LOWER", Sequelize.col("project_code")),
        //     Sequelize.fn("LOWER", projectCode)
        //   ),
        // ],
      },
      transaction,
    });

    return !!isExists;
  }

  async existsInAccountFiscalTable(
    accountNumber: string,
    accountId: string,
    fiscalYear: number,
    transaction: Transaction
  ): Promise<boolean> {
    const { AccountFiscal } = await this.getModels(accountNumber);

    const existingFiscal = await AccountFiscal.findOne({
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
      },
      transaction,
    });

    return !!existingFiscal;
  }

  async existsInAccountFiscalRegionTable(
    accountNumber: string,
    accountId: string,
    fiscalYear: number,
    regionId: string,
    transaction: Transaction
  ): Promise<boolean> {
    const { AccountFiscalRegion } = await this.getModels(accountNumber);

    const existingFiscal = await AccountFiscalRegion.findOne({
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
        region_rid: regionId,
      },
      transaction,
    });

    return !!existingFiscal;
  }

  async existsInProjectResourceFiscalTable(
    accountNumber: string,
    accountId: string,
    fiscalYear: number,
    projectId: string,
    resourceId: string,
    countryId: string | null,
    transaction: Transaction
  ): Promise<any> {
    const { ProjectResourceFiscal } = await this.getModels(accountNumber);

    const isExists = await ProjectResourceFiscal.findOne({
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
        country_rid: countryId ? countryId : null,
        project_fiscal_rid: projectId,
        resource_rid: resourceId,
      },
      transaction,
    });

    return isExists;
  }

  async existsInCaseProjectResourceFiscalTable(
    accountNumber: string,
    accountId: string,
    fiscalYear: number,
    projectId: string,
    resourceId: string,
    countryId: string | null,
    transaction: Transaction,
    caseMapping: any,
  ): Promise<boolean> {
    const { CaseProjectResourceFiscal } = await this.getModels(accountNumber);

    const isExists = await CaseProjectResourceFiscal.findOne({
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
        country_rid: countryId ? countryId : null,
        project_fiscal_rid: projectId,
        resource_rid: resourceId,
        case_rid: caseMapping.case_rid,
      },
      transaction,
    });

    return !!isExists;
  }

  async existsInProjectResourceFiscalRegionTable(
    accountNumber: string,
    accountId: string,
    fiscalYear: number,
    projectId: string,
    resourceId: string,
    countryId: string | null,
    regionId: string,
    transaction: Transaction
  ) {
    const { ProjectResourceFiscalRegion } = await this.getModels(accountNumber);

    const existing = await ProjectResourceFiscalRegion.findOne({
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
        region_rid: regionId,
        project_fiscal_rid: projectId,
        resource_rid: resourceId,
        // [Op.and]: [
        //   Sequelize.where(
        //     Sequelize.fn("LOWER", Sequelize.col("project_code")),
        //     Sequelize.fn("LOWER", projectCode)
        //   ),
        //   Sequelize.where(
        //     Sequelize.fn("LOWER", Sequelize.col("resource_code")),
        //     Sequelize.fn("LOWER", resourceCode)
        //   ),
        // ],
      },
      transaction,
    });

    return !!existing;
  }

  async existsInResourceFiscalRegionTable(
    accountNumber: string,
    accountId: string,
    resourceCode: string,
    regionId: string,
    fiscalYear: number,
    transaction: Transaction
  ) {
    const { ResourceFiscalRegion } = await this.getModels(accountNumber);

    const existing = await ResourceFiscalRegion.findOne({
      where: {
        account_rid: accountId,
        country_region_rid: regionId,
        fiscal_year: fiscalYear,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("resource_code")),
            Sequelize.fn("LOWER", resourceCode)
          ),
        ],
      },
      transaction,
    });

    return !!existing;
  }

  // async insertIntoResourceTable(
  //   accountNumber: string,
  //   accountId: string,
  //   userId: string,
  //   projectResourceData: ICreateProjectResource,
  //   transaction: Transaction
  // ) {
  //   const { Resources } = await this.getModels(accountNumber);

  //   const startDate = projectResourceData.start_date
  //     ? moment.utc(projectResourceData.start_date, "YYYY-MM-DD")
  //     : null;
  //   const endDate = projectResourceData.end_date
  //     ? moment.utc(projectResourceData.end_date, "YYYY-MM-DD")
  //     : null;

  //   await Resources.create(
  //     {
  //       resource_code: projectResourceData.resource_code,
  //       resource_type_rid: projectResourceData.resource_type_rid,
  //       account_rid: accountId,
  //       resource_designation: projectResourceData.designation || null,
  //       resource_name: projectResourceData.resource_name || null,
  //       resource_startdate: startDate ? startDate.toDate() : null,
  //       resource_enddate: endDate ? endDate.toDate() : null,
  //       region_rid: projectResourceData.region_rid || null,
  //       country_rid: projectResourceData.country_rid || null,
  //       resource_orgname: projectResourceData.resource_orgname || null,
  //       resource_role: projectResourceData.resource_role || null,
  //       status_rid: projectResourceData.status_rid || null,
  //       comments: projectResourceData.description || "",
  //       created_datetime: new Date(),
  //       created_by: userId,
  //     },
  //     {
  //       transaction,
  //     }
  //   );
  // }

  async insertIntoResourceFiscalTable(
    accountNumber: string,
    accountId: string,
    userId: string,
    projectResourceData: ICreateProjectResource,
    fiscal_year: number,
    transaction: Transaction
  ) {
    const { ResourcesFiscal, Resources } = await this.getModels(accountNumber);

    const startDate = projectResourceData.start_date
      ? moment.utc(projectResourceData.start_date, "YYYY-MM-DD")
      : null;
    const endDate = projectResourceData.end_date
      ? moment.utc(projectResourceData.end_date, "YYYY-MM-DD")
      : null;

    const resourceData = await Resources.findOne({
      where: {
        account_rid: accountId,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("resource_code")),
            Sequelize.fn("LOWER", projectResourceData.resource_code)
          ),
        ],
      },
      transaction,
    });

    if (!resourceData) {
      logMessage(`Resource with code ${projectResourceData.resource_code} not found for account ${accountId}`);
      throw new Error(
        `Resource with code ${projectResourceData.resource_code} not found for account ${accountId}`
      );
    }

    await ResourcesFiscal.create(
      {
        resource_rid: resourceData.rid || "",
        resource_code: projectResourceData.resource_code,
        resource_type_rid: resourceData.resource_type_rid, // need to add resource fiscal
        account_rid: accountId,
        country_rid: projectResourceData.country_rid || null,
        country_region_rid: projectResourceData.region_rid || null,
        fiscal_year: fiscal_year,
        total_cost_for_year_project_resource_level:
          projectResourceData.net_total_cost_pro_res || null,
        total_effort_for_year_project_resource_level:
          projectResourceData.total_hours_pro_res || null,
        effective_date: startDate ? startDate.toDate() : null,
        end_date: endDate ? endDate.toDate() : null,
        created_by: userId,
        created_datetime: new Date(),
      },
      {
        transaction,
      }
    );
  }

  async insertIntoResourceFiscalRegionTable(
    accountNumber: string,
    accountId: string,
    userId: string,
    projectResourceData: ICreateProjectResource | IUpdateProjectResource,
    fiscalYear: number,
    transaction: Transaction
  ) {
    const { ResourceFiscalRegion, Resources } = await this.getModels(
      accountNumber
    );

    const startDate = projectResourceData.start_date
      ? moment.utc(projectResourceData.start_date, "YYYY-MM-DD")
      : null;
    const endDate = projectResourceData.end_date
      ? moment.utc(projectResourceData.end_date, "YYYY-MM-DD")
      : null;

    const resourceData = await Resources.findOne({
      where: {
        account_rid: accountId,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("resource_code")),
            Sequelize.fn("LOWER", projectResourceData.resource_code)
          ),
        ],
      },
      transaction,
    });

    if (!resourceData) {
      logMessage(`Resource with code ${projectResourceData.resource_code} not found for account ${accountId}`);
      throw new Error(
        `Resource with code ${projectResourceData.resource_code} not found for account ${accountId}`
      );
    }

    await ResourceFiscalRegion.create(
      {
        resource_rid: resourceData.rid || "",
        resource_code: projectResourceData.resource_code,
        resource_type_rid: resourceData.resource_type_rid, // need to add resource fiscal
        account_rid: accountId,
        country_rid: projectResourceData.country_rid || null,
        country_region_rid: projectResourceData.region_rid || null,
        fiscal_year: fiscalYear,
        total_cost_for_year_project_resource_level:
          projectResourceData.net_total_cost_pro_res || null,
        total_effort_for_year_project_resource_level:
          projectResourceData.total_hours_pro_res || null,
        effective_date: startDate ? startDate.toDate() : null,
        end_date: endDate ? endDate.toDate() : null,
        created_by: userId,
        created_datetime: new Date(),
      },
      {
        transaction,
      }
    );
  }

  async insertIntoResourceFiscalRegionTableOnUpdate(
    accountNumber: string,
    accountId: string,
    userId: string,
    projectResourceData: IUpdateProjectResource,
    resourceData: any,
    fiscalYear: number,
    statusMap: any,
    transaction: Transaction,
    existingProjectResource: any = {}
  ) {
    const { ProjectResource, ResourceFiscalRegion, Resources } =
      await this.getModels(accountNumber);

    const oldGroupKey = {
      resource_rid: existingProjectResource.resource_rid,
      region_rid: existingProjectResource.region_rid,
      fiscal_year: fiscalYear,
    };

    const newGroupKey = {
      resource_rid: resourceData.rid,
      region_rid: projectResourceData.region_rid,
      fiscal_year: fiscalYear,
    };

    const isGroupChanged =
      oldGroupKey.resource_rid?.toLowerCase() !==
      newGroupKey.resource_rid?.toLowerCase() ||
      oldGroupKey.region_rid !== newGroupKey.region_rid ||
      oldGroupKey.fiscal_year !== newGroupKey.fiscal_year;

    const buildGroupWhere = (groupKey: any) => ({
      account_rid: accountId,
      country_region_rid: groupKey.region_rid,
      fiscal_year: fiscalYear,
      [Op.and]: [
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("resource_code")),
          Sequelize.fn("LOWER", groupKey.resource_code)
        ),
      ],
    });

    // 1. If group changed, update or delete old group
    if (isGroupChanged) {
      const oldAggregates: any = await ProjectResource.findOne({
        attributes: [
          "resource_rid",
          "region_rid",
          [
            Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
            "total_effort",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
            "total_cost",
          ],
        ],
        group: ["resource_rid", "region_rid"],
        where: {
          account_rid: projectResourceData.account_rid,
          region_rid: oldGroupKey.region_rid,
          resource_rid: existingProjectResource.resource_rid,
          fiscal_year: fiscalYear,
          status_rid: {
            [Op.in]: [
              statusMap?.get("Active"),
              null,
            ].filter(Boolean) as string[],
          },
          rid: { [Op.ne]: projectResourceData.project_resource_rid },
        },
        raw: true,
        transaction,
      });

      const oldFiscalRecord = await ResourceFiscalRegion.findOne({
        where: {
          resource_rid: oldGroupKey.resource_rid,
          country_region_rid: oldGroupKey.region_rid,
        },
        transaction,
      });

      if (oldAggregates && oldFiscalRecord) {
        await ResourceFiscalRegion.update(
          {
            total_cost_for_year_project_resource_level:
              oldAggregates.total_cost,
            total_effort_for_year_project_resource_level:
              oldAggregates.total_effort,
            modified_by: userId,
            modified_datetime: new Date(),
          },
          {
            where: { rid: oldFiscalRecord.rid },
            transaction,
          }
        );
      } else if (oldFiscalRecord) {
        await ResourceFiscalRegion.destroy({
          where: { rid: oldFiscalRecord.rid },
          transaction,
        });
      }
    }

    // 2. Update or create new group
    const newAggregates: any = await ProjectResource.findOne({
      attributes: [
        "resource_rid",
        "region_rid",
        [
          Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
          "total_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
          "total_cost",
        ],
      ],
      group: ["resource_rid", "region_rid"],
      where: {
        account_rid: projectResourceData.account_rid,
        region_rid: newGroupKey.region_rid,
        resource_rid: resourceData.rid,
        fiscal_year: fiscalYear,
        status_rid: {
          [Op.in]: [
            statusMap?.get("Active"),
          ].filter(Boolean) as string[],
        },
      },
      raw: true,
      transaction,
    });

    const newFiscalRecord = await ResourceFiscalRegion.findOne({
      where: {
        account_rid: accountId,
        country_region_rid: newGroupKey.region_rid,
        fiscal_year: fiscalYear,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("resource_code")),
            Sequelize.fn("LOWER", resourceData.resource_code)
          ),
        ],
      },
      transaction,
    });

    const resource = await Resources.findOne({
      where: {
        account_rid: accountId,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("resource_code")),
            Sequelize.fn("LOWER", projectResourceData.resource_code)
          ),
        ],
      },
      transaction,
    });

    const startDate = projectResourceData.start_date
      ? moment.utc(projectResourceData.start_date, "YYYY-MM-DD").toDate()
      : null;
    const endDate = projectResourceData.end_date
      ? moment.utc(projectResourceData.end_date, "YYYY-MM-DD").toDate()
      : null;

    if (newFiscalRecord) {
      await ResourceFiscalRegion.update(
        {
          total_cost_for_year_project_resource_level:
            newAggregates?.total_cost ?? 0,
          total_effort_for_year_project_resource_level:
            newAggregates?.total_effort ?? 0,
          resource_rid: resource?.rid ?? "",
          modified_by: userId,
          modified_datetime: new Date(),
        },
        {
          where: { rid: newFiscalRecord.rid },
          transaction,
        }
      );
    } else {
      if (projectResourceData.region_rid) {
        await ResourceFiscalRegion.create(
          {
            resource_code: projectResourceData.resource_code,
            resource_rid: resource?.rid ?? "",
            account_rid: accountId,
            country_rid: projectResourceData.country_rid || null,
            country_region_rid: projectResourceData.region_rid || null,
            fiscal_year: fiscalYear,
            total_cost_for_year_project_resource_level:
              newAggregates?.total_cost ?? 0,
            total_effort_for_year_project_resource_level:
              newAggregates?.total_effort ?? 0,
            effective_date: startDate,
            end_date: endDate,
            created_by: userId,
            created_datetime: new Date(),
            resource_type_rid: resource?.resource_type_rid || "", // need to add resource fiscal
          },
          { transaction }
        );
      }
    }
  }

  async updateResourceFiscalTable(
    accountNumber: string,
    accountId: string,
    userId: string,
    projectResourceData: ICreateProjectResource,
    transaction: Transaction
  ) {
    const { ResourcesFiscal } = await this.getModels(accountNumber);

    const startDate = projectResourceData.start_date
      ? moment.utc(projectResourceData.start_date, "YYYY-MM-DD", true)
      : null;

    const endDate = projectResourceData.end_date
      ? moment.utc(projectResourceData.end_date, "YYYY-MM-DD", true)
      : null;

    await ResourcesFiscal.update(
      {
        resource_type_rid: "", // need to add resource fiscal
        country_rid: projectResourceData.country_rid || null,
        country_region_rid: projectResourceData.region_rid || null,
        total_cost_for_year_project_resource_level:
          projectResourceData.net_total_cost_pro_res || null,
        total_effort_for_year_project_resource_level:
          projectResourceData.total_hours_pro_res || null,
        effective_date: startDate ? startDate.toDate() : null,
        end_date: endDate ? endDate.toDate() : null,
        modified_by: userId,
        modified_datetime: new Date(),
      },
      {
        where: {
          account_rid: accountId,
          fiscal_year: projectResourceData.fiscal_year,
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn("LOWER", Sequelize.col("resource_code")),
              Sequelize.fn("LOWER", projectResourceData.resource_code)
            ),
          ],
        },
        transaction,
      }
    );
  }

  async insertProjectFiscalTable(
    accountNumber: string,
    accountId: string,
    projectCode: string,
    fiscalYear: number,
    projectResourceData: ICreateProjectResource,
    userId: string,
    transaction: Transaction
  ) {
    const { ProjectFiscal, Project } = await this.getModels(accountNumber);

    const projectData = await Project.findOne({
      where: {
        account_rid: accountId,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("project_code")),
            Sequelize.fn("LOWER", projectCode)
          ),
        ],
      },
      transaction,
    });

    const resourceType: any = await this.fetchResourceType(
      "" // need to add resource fiscal
    );

    if (!resourceType) {
      logMessage(`Invalid resource type ID: ${""}`); // need to add resource fiscal
      throw new Error(
        `Invalid resource type ID: ${""}` // need to add resource fiscal
      );
    }

    if (!projectData) {
      logMessage(`Project not found for code: ${projectCode}`);
      throw new Error(`Project not found for code: ${projectCode}`);
    }

    const baseData: any = ProjectResourceMapper.mapToProjectFiscal(
      projectData,
      projectData.rid,
      fiscalYear,
      userId
    );

    // const insertFields: any = {
    //   account_rid: accountId,
    //   fiscal_year: fiscalYear,
    //   project_code: projectCode,
    //   project_rid: projectData?.rid || null,
    //   total_cost_from_prj_res: projectResourceData.total_cost_pro_res || null,
    //   total_effort_from_prj_res:
    //     projectResourceData.total_hours_pro_res || null,
    //   total_cost_fte_from_prj_res: null,
    //   total_cost_subcon_from_prj_res: null,
    //   total_cost_nonlabor_from_prj_res: null,
    //   total_effort_fte_from_prj_res: null,
    //   total_effort_subcon_from_prj_res: null,
    // };

    // Map to specific fields based on resource type
    const typeCode = resourceType[0].resource_type_name.toLowerCase();
    switch (typeCode) {
      case "full-time":
        baseData.total_cost_fte_from_prj_res =
          projectResourceData.net_total_cost_pro_res || null;
        baseData.total_effort_fte_from_prj_res =
          projectResourceData.total_hours_pro_res || null;

        baseData.effective_fte_effort =
          projectResourceData.total_hours_pro_res || null;
        baseData.effective_fte_cost =
          projectResourceData.net_total_cost_pro_res || null;
        break;
      case "sub con":
        baseData.total_cost_subcon_from_prj_res =
          projectResourceData.net_total_cost_pro_res || null;
        baseData.total_effort_subcon_from_prj_res =
          projectResourceData.total_hours_pro_res || null;

        baseData.effective_subcon_effort =
          projectResourceData.total_hours_pro_res || null;
        baseData.effective_subcon_cost =
          projectResourceData.net_total_cost_pro_res || null;
        break;
      case "non-labor":
        baseData.total_cost_nonlabor_from_prj_res =
          projectResourceData.net_total_cost_pro_res || null;

        baseData.effective_nonlabor_cost =
          projectResourceData.net_total_cost_pro_res || null;
        break;
      default:
        logMessage(`Unhandled resource type code: ${typeCode}`);
        throw new Error(`Unhandled resource type code: ${typeCode}`);
    }

    if (baseData) {
      baseData.total_cost_from_prj_res = this.safeSum(
        baseData.total_cost_fte_from_prj_res,
        baseData.total_cost_subcon_from_prj_res,
        baseData.total_cost_nonlabor_from_prj_res
      );

      baseData.total_effort_from_prj_res = this.safeSum(
        baseData.total_effort_fte_from_prj_res,
        baseData.total_effort_subcon_from_prj_res
      );

      baseData.effective_cost = baseData.total_cost_from_prj_res;
      baseData.effective_effort = baseData.total_effort_from_prj_res;
    }

    const createdProjectFiscal = await ProjectFiscal.create(
      {
        ...baseData,
        region_rid: projectResourceData.region_rid || null,
      },
      {
        transaction,
      }
    );

    return createdProjectFiscal;
  }

  async insertProjectFiscalSummaryTable(
    accountNumber: string,
    accountId: string,
    projectCode: string,
    fiscalYear: number,
    projectResourceData: ICreateProjectResource,
    userId: string,
    createdProjectFiscal: any,
    transaction: Transaction
  ) {
    const { Project } = await this.getModels(accountNumber);

    const projectData = await Project.findOne({
      where: {
        account_rid: accountId,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("project_code")),
            Sequelize.fn("LOWER", projectCode)
          ),
        ],
      },
      transaction,
    });

    const resourceType: any = await this.fetchResourceType(
      "" // need to add resource fiscal
    );

    if (!resourceType) {
      logMessage(`Invalid resource type ID: ${""}`); // need to add resource fiscal
      throw new Error(
        `Invalid resource type ID: ${""}` // need to add resource fiscal
      );
    }

    if (!projectData) {
      logMessage(`Project not found for code: ${projectCode}`);
      throw new Error(`Project not found for code: ${projectCode}`);
    }

    const baseData: any = ProjectResourceMapper.mapToProjectFiscal(
      projectData,
      projectData.rid,
      fiscalYear,
      userId
    );

    // Map to specific fields based on resource type
    const typeCode = resourceType[0].resource_type_name.toLowerCase();
    switch (typeCode) {
      case "full-time":
        baseData.total_cost_fte_from_prj_res =
          projectResourceData.net_total_cost_pro_res || null;
        baseData.total_effort_fte_from_prj_res =
          projectResourceData.total_hours_pro_res || null;

        baseData.effective_fte_effort =
          projectResourceData.total_hours_pro_res || null;
        baseData.effective_fte_cost =
          projectResourceData.net_total_cost_pro_res || null;
        break;
      case "sub con":
        baseData.total_cost_subcon_from_prj_res =
          projectResourceData.net_total_cost_pro_res || null;
        baseData.total_effort_subcon_from_prj_res =
          projectResourceData.total_hours_pro_res || null;

        baseData.effective_subcon_effort =
          projectResourceData.total_hours_pro_res || null;
        baseData.effective_subcon_cost =
          projectResourceData.net_total_cost_pro_res || null;
        break;
      case "non-labor":
        baseData.total_cost_nonlabor_from_prj_res =
          projectResourceData.net_total_cost_pro_res || null;

        baseData.effective_nonlabor_cost =
          projectResourceData.net_total_cost_pro_res || null;
        break;
      default:
        logMessage(`Unhandled resource type code: ${typeCode}`);
        throw new Error(`Unhandled resource type code: ${typeCode}`);
    }

    if (baseData) {
      baseData.total_cost_from_prj_res = this.safeSum(
        baseData.total_cost_fte_from_prj_res,
        baseData.total_cost_subcon_from_prj_res,
        baseData.total_cost_nonlabor_from_prj_res
      );

      baseData.total_effort_from_prj_res = this.safeSum(
        baseData.total_effort_fte_from_prj_res,
        baseData.total_effort_subcon_from_prj_res
      );

      baseData.effective_cost = baseData.total_cost_from_prj_res;
      baseData.effective_effort = baseData.total_effort_from_prj_res;
    }

    if (createdProjectFiscal && createdProjectFiscal.r_number) {
      baseData.r_number = createdProjectFiscal.r_number;
    }

    const insertQuery = `
      INSERT INTO ${MAIN_SCHEMA_NAME}.project_fiscal_summary (
        ${Object.keys(baseData).join(", ")},
        region_rid , project_fiscal_rid
      ) VALUES (
        ${Object.keys(baseData)
        .map((k) => `:${k}`)
        .join(", ")},
        :region_rid, :project_fiscal_rid
      )
    `;

    await this.mainDbSequelize?.query(insertQuery, {
      replacements: {
        ...baseData,
        region_rid: projectResourceData.region_rid || null,
        project_fiscal_rid: createdProjectFiscal.rid,
      },
      type: "INSERT",
    });
  }

  async insertProjectFiscalRegionTable(
    accountNumber: string,
    projectCode: string,
    projectResourceData: ICreateProjectResource | IUpdateProjectResource,
    resourceData: Resources,
    fiscalYear: number,
    userId: string,
    transaction: Transaction
  ) {
    const { ProjectFiscalRegion, ProjectFiscal } = await this.getModels(
      accountNumber
    );

    const projectData = await ProjectFiscal.findOne({
      where: {
        account_rid: projectResourceData.account_rid,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("project_code")),
            Sequelize.fn("LOWER", projectCode)
          ),
        ],
      },
      transaction,
    });

    const resourceType: any = await this.fetchResourceType(
      resourceData.resource_type_rid // need to add resource fiscal
    );

    if (!resourceType) {
      logMessage(`Invalid resource type ID: ${""}`); // need to add resource fiscal
      throw new Error(
        `Invalid resource type ID: ${""}` // need to add resource fiscal
      );
    }

    if (!projectData) {
      logMessage(`Project not found for code: ${projectCode}`);
      throw new Error(`Project not found for code: ${projectCode}`);
    }

    const baseData: any = ProjectResourceMapper.mapToProjectFiscal(
      projectData,
      projectData?.project_rid,
      fiscalYear,
      userId
    );

    // Map to specific fields based on resource type
    const typeCode = resourceType[0].resource_type_name.toLowerCase();
    switch (typeCode) {
      case "full-time":
        baseData.total_cost_fte_from_prj_res =
          projectResourceData.net_total_cost_pro_res || null;
        baseData.total_effort_fte_from_prj_res =
          projectResourceData.total_hours_pro_res || null;

        baseData.effective_fte_effort =
          projectResourceData.total_hours_pro_res || null;
        baseData.effective_fte_cost =
          projectResourceData.net_total_cost_pro_res || null;
        break;
      case "sub con":
        baseData.total_cost_subcon_from_prj_res =
          projectResourceData.net_total_cost_pro_res || null;
        baseData.total_effort_subcon_from_prj_res =
          projectResourceData.total_hours_pro_res || null;

        baseData.effective_subcon_effort =
          projectResourceData.total_hours_pro_res || null;
        baseData.effective_subcon_cost =
          projectResourceData.net_total_cost_pro_res || null;
        break;
      case "non-labor":
        baseData.total_cost_nonlabor_from_prj_res =
          projectResourceData.net_total_cost_pro_res || null;

        baseData.effective_nonlabor_cost =
          projectResourceData.net_total_cost_pro_res || null;
        break;
      default:
        logMessage(`Unhandled resource type code: ${typeCode}`);
        throw new Error(`Unhandled resource type code: ${typeCode}`);
    }

    if (baseData) {
      baseData.total_cost_from_prj_res = this.safeSum(
        baseData.total_cost_fte_from_prj_res,
        baseData.total_cost_subcon_from_prj_res,
        baseData.total_cost_nonlabor_from_prj_res
      );

      baseData.total_effort_from_prj_res = this.safeSum(
        baseData.total_effort_fte_from_prj_res,
        baseData.total_effort_subcon_from_prj_res
      );

      baseData.effective_cost = baseData.total_cost_from_prj_res;
      baseData.effective_effort = baseData.total_effort_from_prj_res;
    }

    await ProjectFiscalRegion.create(
      {
        ...baseData,
        country_rid: projectResourceData.country_rid || null,
        currency_rid: projectResourceData.currency_rid || null,
        region_rid: projectResourceData.region_rid || null,
      },
      {
        transaction,
      }
    );
  }

  async insertProjectFiscalRegionTableOnUpdate(
    accountNumber: string,
    projectCode: string,
    projectId: string,
    projectResourceData: ICreateProjectResource | IUpdateProjectResource,
    resourceData: any,
    fiscalYear: number,
    userId: string,
    statusMap: any,
    transaction: Transaction
  ) {
    const { ProjectFiscalRegion, ProjectFiscal, ProjectResource, CaseProjectFiscalRegion } =
      await this.getModels(accountNumber);

    const projectData = await ProjectFiscal.findOne({
      where: {
        account_rid: projectResourceData.account_rid,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("project_code")),
            Sequelize.fn("LOWER", projectCode)
          ),
        ],
      },
      transaction,
    });

    if (!projectData) {
      logMessage(`Project not found for code: ${projectCode}`);
      throw new Error(`Project not found for code: ${projectCode}`);
    }

    if (!projectResourceData.region_rid) {
      await ProjectFiscalRegion.destroy({
        where: {
          account_rid: projectResourceData.account_rid,
          fiscal_year: fiscalYear,
          project_fiscal_rid: projectResourceData.project_fiscal_rid,
        },
        transaction,
      });
      return;
    }

    const resourceType: any = await this.fetchResourceType(
      resourceData.resource_type_rid
    ); // need to add resource fiscal
    if (!resourceType) {
      logMessage(`Invalid resource type ID: ${resourceData.resource_type_rid}`);
      throw new Error(
        `Invalid resource type ID: ${resourceData.resource_type_rid}`
      ); // need to add resource fiscal
    }

    const resourceTypeName = resourceType[0]?.resource_type_name?.toLowerCase();

    // Aggregate by resource type
    const aggregates: any = await ProjectResource.findAll({
      attributes: [
        [
          Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
          "total_cost",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
          "total_effort",
        ],
      ],
      where: {
        account_rid: projectResourceData.account_rid,
        fiscal_year: fiscalYear,
        project_fiscal_rid: projectResourceData.project_fiscal_rid,
        status_rid: {
          [Op.in]: [
            statusMap?.get("Active"),
          ].filter(Boolean) as string[],
        },
      },
      raw: true,
      transaction,
    });

    const baseData: any = ProjectResourceMapper.mapToProjectFiscal(
      projectData,
      projectData?.project_rid,
      fiscalYear,
      userId
    );

    // Initialize all fields
    baseData.total_cost_fte_from_prj_res = 0;
    baseData.total_effort_fte_from_prj_res = 0;
    baseData.effective_fte_cost = 0;
    baseData.effective_fte_effort = 0;

    baseData.total_cost_subcon_from_prj_res = 0;
    baseData.total_effort_subcon_from_prj_res = 0;
    baseData.effective_subcon_cost = 0;
    baseData.effective_subcon_effort = 0;

    baseData.total_cost_nonlabor_from_prj_res = 0;
    baseData.effective_nonlabor_cost = 0;

    // Distribute aggregate values based on resource type name
    for (const row of aggregates) {
      // const resType: any = await this.fetchResourceType(row.resource_type_rid);
      // const typeName = resType?.[0]?.resource_type_name?.toLowerCase();

      switch (resourceTypeName) {
        case "full-time":
          baseData.total_cost_fte_from_prj_res = +row.total_cost || 0;
          baseData.total_effort_fte_from_prj_res = +row.total_effort || 0;
          baseData.effective_fte_cost = +row.total_cost || 0;
          baseData.effective_fte_effort = +row.total_effort || 0;
          break;
        case "sub con":
          baseData.total_cost_subcon_from_prj_res = +row.total_cost || 0;
          baseData.total_effort_subcon_from_prj_res = +row.total_effort || 0;
          baseData.effective_subcon_cost = +row.total_cost || 0;
          baseData.effective_subcon_effort = +row.total_effort || 0;
          break;
        case "non-labor":
          baseData.total_cost_nonlabor_from_prj_res = +row.total_cost || 0;
          baseData.effective_nonlabor_cost = +row.total_cost || 0;
          break;
      }
    }

    // Final total aggregation
    baseData.total_cost_from_prj_res = this.safeSum(
      baseData.total_cost_fte_from_prj_res,
      baseData.total_cost_subcon_from_prj_res,
      baseData.total_cost_nonlabor_from_prj_res
    );

    baseData.total_effort_from_prj_res = this.safeSum(
      baseData.total_effort_fte_from_prj_res,
      baseData.total_effort_subcon_from_prj_res
    );

    baseData.effective_cost = baseData.total_cost_from_prj_res;
    baseData.effective_effort = baseData.total_effort_from_prj_res;

    const existingRecord = await ProjectFiscalRegion.findOne({
      where: {
        account_rid: projectResourceData.account_rid,
        fiscal_year: fiscalYear,
        region_rid: projectResourceData.region_rid,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("project_code")),
            Sequelize.fn("LOWER", projectCode)
          ),
        ],
      },
      transaction,
    });

    const additionalFields = {
      country_rid: projectResourceData.country_rid || null,
      currency_rid: projectResourceData.currency_rid || null,
      region_rid: projectResourceData.region_rid || null,
    };

    if (existingRecord) {
      const isProjectResource =
        existingRecord.default_metric_type === "project_resource";

      const updateData: any = {
        total_cost_fte_from_prj_res: baseData.total_cost_fte_from_prj_res,
        total_effort_fte_from_prj_res: baseData.total_effort_fte_from_prj_res,
        total_cost_subcon_from_prj_res: baseData.total_cost_subcon_from_prj_res,
        total_effort_subcon_from_prj_res:
          baseData.total_effort_subcon_from_prj_res,
        total_cost_nonlabor_from_prj_res:
          baseData.total_cost_nonlabor_from_prj_res,
        total_cost_from_prj_res: baseData.total_cost_from_prj_res,
        total_effort_from_prj_res: baseData.total_effort_from_prj_res,
        ...additionalFields,
        modified_by: userId,
        modified_datetime: new Date(),
      };

      if (isProjectResource) {
        updateData.effective_fte_cost = baseData.effective_fte_cost;
        updateData.effective_fte_effort = baseData.effective_fte_effort;
        updateData.effective_subcon_cost = baseData.effective_subcon_cost;
        updateData.effective_subcon_effort = baseData.effective_subcon_effort;
        updateData.effective_nonlabor_cost = baseData.effective_nonlabor_cost;
        updateData.effective_cost = baseData.effective_cost;
        updateData.effective_effort = baseData.effective_effort;
      }

      await ProjectFiscalRegion.update(updateData, {
        where: { rid: existingRecord.rid },
        transaction,
      });
    } else {
      // New record — set all values and mark source as project_resource
      if (projectResourceData.region_rid) {
        await ProjectFiscalRegion.create(
          {
            ...baseData,
            ...additionalFields,
            created_by: userId,
            created_datetime: new Date(),
            default_metric_type: "project_resource",
          },
          {
            transaction,
          }
        );
      }
    }
  }

  async cleanupOrphanedProjectFiscalRegions(
    accountNumber: string,
    accountId: string,
    projectRid: string,
    projectCode: string,
    fiscalYear: number,
    transaction: Transaction
  ) {
    const { ProjectResource, ProjectFiscalRegion, CaseProjectFiscalRegion } = await this.getModels(
      accountNumber
    );

    // 1. Get distinct region_rids from project_resource
    const existingRegionRids = await ProjectResource.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("region_rid")), "region_rid"],
      ],
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
        project_fiscal_rid: projectRid,
      },
      raw: true,
      transaction,
    });

    const activeRegionSet = new Set(
      existingRegionRids.map((r) => r.region_rid)
    );

    // 2. Get all project_fiscal_region entries for that project/fiscal year
    const fiscalRegions = await ProjectFiscalRegion.findAll({
      attributes: ["region_rid", "rid"],
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("project_code")),
            Sequelize.fn("LOWER", projectCode)
          ),
        ],
      },
      raw: true,
      transaction,
    });

    // 3. Remove those not in current active regions
    const orphanedRids = fiscalRegions
      .filter(
        (fr) => !activeRegionSet.has(fr.region_rid) && fr.region_rid !== null
      )
      .map((fr) => fr.rid);

    if (orphanedRids.length > 0) {
      await ProjectFiscalRegion.destroy({
        where: {
          rid: { [Op.in]: orphanedRids },
          default_metric_type: "project_resource",
        },
        transaction,
      });
    }
  }

  async fetchResourceType(resourceTypeId: string) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.getMainSequelize();
    }

    const results = await this.mainDbSequelize.query(
      rawQueries.fetchSpecificResourceTypeById(),
      {
        replacements: { resourceTypeId },
        type: "SELECT",
      }
    );

    return results;
  }

  async addProjectResources(
    accountNumber: string,
    projectResource: ICreateProjectResource,
    projectData: any,
    userId: string
  ) {
    const { ProjectResource } = await this.getModels(accountNumber);

    const startDate = projectResource.start_date
      ? moment.utc(projectResource.start_date, "YYYY-MM-DD")
      : null;
    const endDate = projectResource.end_date
      ? moment.utc(projectResource.end_date, "YYYY-MM-DD")
      : null;

    const projectResourceCode =
      projectData.project_code + "-" + projectResource.resource_code;

    const baseData = ProjectResourceMapper.mapToProjectResource(
      projectResource,
      projectData.project_rid,
      startDate,
      endDate,
      userId,
      projectResourceCode
    );

    const createdProjectResource = await ProjectResource.create(baseData);

    return createdProjectResource;
  }

  async insertIntoCaseProjectResourceTable(
    accountNumber: string,
    projectCode: string,
    projectResourceData: ICreateProjectResource,
    projectId: string,
    fiscalYear: number,
    userId: string,
    stausId: string,
    transaction: Transaction,
    caseMapping: any,
    projectResource: any,
  ) {
    const { CaseProjectResource } = await this.getModels(accountNumber);

    const resource = await Resources.findOne({
      where: {
        account_rid: projectResourceData.account_rid,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("resource_code")),
            Sequelize.fn("LOWER", projectResourceData.resource_code)
          ),
        ],
      },
      attributes: ["rid"],
      transaction,
    });

    const projectResourceCode =
      projectCode + "-" + projectResourceData.resource_code;

    const startDate = projectResourceData.start_date
      ? moment.utc(projectResourceData.start_date, "YYYY-MM-DD")
      : null;
    const endDate = projectResourceData.end_date
      ? moment.utc(projectResourceData.end_date, "YYYY-MM-DD")
      : null;

    const updatedAssignedRoleId = await this.checkSkillSubtype(
      projectResourceData.assigned_skill_role_type_rid,
      projectResourceData.skill_role_rid,
      projectResourceData.skill_role_others,
      userId
    );

    const caseProjectResource = await CaseProjectResource.create(
      {
        project_resource_code: projectResourceCode,
        account_rid: projectResourceData.account_rid,
        project_rid: projectId,
        project_fiscal_rid: projectResourceData.project_fiscal_rid,
        resource_rid: resource?.rid || "",
        project_resource_rid: projectResource.rid,
        case_project_rid: caseMapping.rid,
        case_rid: caseMapping.case_rid,
        assigned_skill_role_type_rid: updatedAssignedRoleId,
        start_date: startDate ? startDate.toDate() : null,
        end_date: endDate ? endDate.toDate() : null,
        fiscal_year: fiscalYear,
        status_rid: stausId,
        created_by: userId,
        created_datetime: new Date(),
        description: projectResourceData.description || null,
        total_cost_pro_res: projectResourceData.total_cost_pro_res || null,
        net_total_cost_pro_res: projectResourceData.net_total_cost_pro_res || null,
        total_hours_pro_res: projectResourceData.total_hours_pro_res || null,
        country_rid: projectResourceData.country_rid || null,
        region_rid: projectResourceData.region_rid || null,
        currency_rid: projectResourceData.currency_rid || null,
        qre_final: null,
        qre_percent: null,
        salary: projectResourceData.salary || null,
        bonus: projectResourceData.bonus || null,
        deductions: projectResourceData.deductions || null,
        insurance: projectResourceData.insurance || null,
        project_resource_role: projectResourceData.project_resource_role || null,
        r_number: projectResource.r_number || null,
      },
      {
        transaction,
      }
    );

    return caseProjectResource;
  }

  async insertIntoProjectResourceTable(
    accountNumber: string,
    projectCode: string,
    projectResourceData: ICreateProjectResource,
    projectId: string,
    fiscalYear: number,
    userId: string,
    stausId: string,
    transaction: Transaction
  ) {
    const { ProjectResource } = await this.getModels(accountNumber);

    const resource = await Resources.findOne({
      where: {
        account_rid: projectResourceData.account_rid,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("resource_code")),
            Sequelize.fn("LOWER", projectResourceData.resource_code)
          ),
        ],
      },
      attributes: ["rid"],
      transaction,
    });

    const projectResourceCode =
      projectCode + "-" + projectResourceData.resource_code;

    const startDate = projectResourceData.start_date
      ? moment.utc(projectResourceData.start_date, "YYYY-MM-DD")
      : null;
    const endDate = projectResourceData.end_date
      ? moment.utc(projectResourceData.end_date, "YYYY-MM-DD")
      : null;

    const updatedAssignedRoleId = await this.checkSkillSubtype(
      projectResourceData.assigned_skill_role_type_rid,
      projectResourceData.skill_role_rid,
      projectResourceData.skill_role_others,
      userId
    );

    const projectResource = await ProjectResource.create(
      {
        project_resource_code: projectResourceCode,
        account_rid: projectResourceData.account_rid,
        project_rid: projectId,
        project_fiscal_rid: projectResourceData.project_fiscal_rid,
        resource_rid: resource?.rid || "",
        assigned_skill_role_type_rid: updatedAssignedRoleId,
        start_date: startDate ? startDate.toDate() : null,
        end_date: endDate ? endDate.toDate() : null,
        fiscal_year: fiscalYear,
        status_rid: stausId,
        created_by: userId,
        created_datetime: new Date(),
        description: projectResourceData.description || null,
        total_cost_pro_res: projectResourceData.total_cost_pro_res || null,
        net_total_cost_pro_res: projectResourceData.net_total_cost_pro_res || null,
        total_hours_pro_res: projectResourceData.total_hours_pro_res || null,
        country_rid: projectResourceData.country_rid || null,
        region_rid: projectResourceData.region_rid || null,
        currency_rid: projectResourceData.currency_rid || null,
        qre_final: null,
        qre_percent: null,
        salary: projectResourceData.salary || null,
        bonus: projectResourceData.bonus || null,
        deductions: projectResourceData.deductions || null,
        insurance: projectResourceData.insurance || null,
        project_resource_role: projectResourceData.project_resource_role || null
      },
      {
        transaction,
      }
    );

    return projectResource;
  }

  async checkSkillSubtype(
    skillTypeId: string | null,
    skillRoleRid: string | null,
    skillRoleOthers: string | null,
    userId: string
  ): Promise<string | null> {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.getMainSequelize();
    }

    if (!skillTypeId) return null;

    const resourceRoles: any = await this.mainDbSequelize.query(
      rawQueries.fetchSkillRoleSubType(),
      {
        type: "SELECT",
        replacements: { skillTypeId },
      }
    );

    // If subtype is 'Other', insert new record using skillRoleOthers
    if (
      resourceRoles.length > 0 &&
      resourceRoles[0].sub_type_name === "Other"
    ) {
      const existingSubType: any = await this.mainDbSequelize.query(
        rawQueries.fetchSkillRoleSubTypeByName(),
        {
          type: "SELECT",
          replacements: {
            skill_role_rid: skillRoleRid,
            sub_type_name: skillRoleOthers,
          },
        }
      );

      // If exists, return existing rid
      if (existingSubType.length > 0) {
        return existingSubType[0].rid;
      }

      // Generate new rid using gen_random_uuid()
      const idResult: any = await this.mainDbSequelize.query(
        `SELECT 'D001-' || gen_random_uuid() AS id`,
        { type: "SELECT" }
      );
      const newRid = idResult[0].id;

      const timestamp = new Date().toISOString();

      await this.mainDbSequelize.query(
        rawQueries.insertSkillRoleSubType(),
        {
          replacements: {
            rid: newRid,
            created_by: userId,
            created_datetime: timestamp,
            skill_role_rid: skillRoleRid,
            sub_type_name: skillRoleOthers,
          },
        }
      );

      return newRid;
    }

    return skillTypeId;
  }

  async insertIntoProjectResourceFiscalTable(
    accountNumber: string,
    projectResourceData: ICreateProjectResource,
    projectData: any,
    userId: string,
    createdProjectResource: any,
    transaction: Transaction
  ) {
    const { ProjectResourceFiscal, Resources } = await this.getModels(
      accountNumber
    );

    const resource = await Resources.findOne({
      where: {
        account_rid: projectResourceData.account_rid,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("resource_code")),
            Sequelize.fn("LOWER", projectResourceData.resource_code)
          ),
        ],
      },
      attributes: ["rid"],
      transaction,
    });

    if (!createdProjectResource || !resource) {
      logMessage(
        "Missing related resource or project resource entry to complete insertion"
      );
      throw new Error(
        "Missing related resource or project resource entry to complete insertion"
      );
    }

    const projectResourceFiscal = await ProjectResourceFiscal.create(
      {
        account_rid: projectResourceData.account_rid,
        project_rid: projectData.project_rid,
        project_fiscal_rid: projectResourceData.project_fiscal_rid,
        resource_rid: resource.rid || "",
        fiscal_year: projectData.fiscal_year,
        status_rid: projectResourceData.status_rid || null,
        total_cost_pro_res: projectResourceData.net_total_cost_pro_res || null,
        total_hours_pro_res: projectResourceData.total_hours_pro_res || null,
        country_rid: projectResourceData.country_rid || null,
        region_rid: projectResourceData.region_rid || null,
        currency_rid: projectResourceData.currency_rid || null,
        description: projectResourceData.description || null,
        created_by: userId,
        created_datetime: new Date(),
      },
      {
        transaction,
      }
    );

    return projectResourceFiscal;
  }

  async insertIntoCaseProjectResourceFiscalTable(
    accountNumber: string,
    projectResourceData: ICreateProjectResource,
    projectData: any,
    userId: string,
    createdProjectResource: any,
    transaction: Transaction,
    caseMapping: any,
    projectResourceFiscal: any,
  ) {
    const { CaseProjectResourceFiscal, Resources } = await this.getModels(
      accountNumber
    );

    const resource = await Resources.findOne({
      where: {
        account_rid: projectResourceData.account_rid,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("resource_code")),
            Sequelize.fn("LOWER", projectResourceData.resource_code)
          ),
        ],
      },
      attributes: ["rid"],
      transaction,
    });

    if (!createdProjectResource || !resource) {
      logMessage(
        "Missing related resource or project resource entry to complete insertion"
      );
      throw new Error(
        "Missing related resource or project resource entry to complete insertion"
      );
    }

    await CaseProjectResourceFiscal.create(
      {
        case_project_rid: caseMapping.rid,
        case_rid: caseMapping.case_rid,
        project_resource_fiscal_rid: projectResourceFiscal.rid,
        account_rid: projectResourceData.account_rid,
        project_rid: projectData.project_rid,
        project_fiscal_rid: projectResourceData.project_fiscal_rid,
        resource_rid: resource.rid || "",
        fiscal_year: projectData.fiscal_year,
        status_rid: projectResourceData.status_rid || null,
        total_cost_pro_res: projectResourceData.net_total_cost_pro_res || null,
        total_hours_pro_res: projectResourceData.total_hours_pro_res || null,
        country_rid: projectResourceData.country_rid || null,
        region_rid: projectResourceData.region_rid || null,
        currency_rid: projectResourceData.currency_rid || null,
        description: projectResourceData.description || null,
        created_by: userId,
        created_datetime: new Date(),
      },
      {
        transaction,
      }
    );
  }

  async insertIntoProjectResourceFiscalRegionTable(
    accountNumber: string,
    projectResourceData: ICreateProjectResource,
    projectId: string,
    project_code: string,
    fiscalYear: number,
    userId: string,
    createdProjectResource: any,
    transaction: Transaction
  ) {
    const { ProjectResourceFiscalRegion, Resources } = await this.getModels(
      accountNumber
    );

    const resource = await Resources.findOne({
      where: {
        account_rid: projectResourceData.account_rid,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("resource_code")),
            Sequelize.fn("LOWER", projectResourceData.resource_code)
          ),
        ],
      },
      attributes: ["rid"],
      transaction,
    });

    if (!createdProjectResource || !resource) {
      logMessage("Missing related resource entry to complete insertion");
      throw new Error("Missing related resource entry to complete insertion");
    }

    const basedata = ProjectResourceMapper.mapToProjectResourceFiscalRegion(
      projectResourceData,
      projectId,
      fiscalYear,
      userId,
      resource.rid ?? ""
    );

    await ProjectResourceFiscalRegion.create(basedata, {
      transaction,
    });
  }

  async updateProjectResourceFiscalTable(
    accountNumber: string,
    projectResourceData: any,
    projectData: any,
    fiscalYear: number,
    projectId: string,
    resourceId: string,
    userId: string,
    transaction: Transaction
  ) {
    const { ProjectResourceFiscal } = await this.getModels(accountNumber);

    const projectFiscalData = await ProjectResourceFiscal.findOne({
      where: {
        account_rid: projectResourceData.account_rid,
        fiscal_year: fiscalYear,
        project_rid: projectData.project_rid,
        project_fiscal_rid: projectId,
        resource_rid: resourceId,
        // [Op.and]: [
        //   Sequelize.where(
        //     Sequelize.fn("LOWER", Sequelize.col("project_code")),
        //     Sequelize.fn("LOWER", projectCode)
        //   ),
        //   Sequelize.where(
        //     Sequelize.fn("LOWER", Sequelize.col("resource_code")),
        //     Sequelize.fn("LOWER", projectResourceData.resource_code)
        //   ),
        // ],
      },
      transaction,
    });

    if (!projectFiscalData) {
      logMessage("Project Fiscal Not Found");
      throw new Error("Project Fiscal Not Found");
    }

    const baseData = ProjectResourceMapper.maptToUpdateProjectResourceFiscal(
      projectResourceData,
      userId
    );

    const aggregates: any = await ProjectResource.findOne({
      attributes: [
        "account_rid",
        "fiscal_year",
        "project_rid",
        "project_fiscal_rid",
        "resource_rid",
        [
          Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
          "total_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
          "total_cost",
        ],
      ],
      group: [
        "account_rid",
        "fiscal_year",
        "project_rid",
        "project_fiscal_rid",
        "resource_rid",
      ],
      where: {
        account_rid: projectResourceData.account_rid,
        fiscal_year: fiscalYear,
        project_rid: projectData.project_rid,
        project_fiscal_rid: projectId,
        resource_rid: resourceId,
        // [Op.and]: [
        //   Sequelize.where(
        //     Sequelize.fn("LOWER", Sequelize.col("project_code")),
        //     Sequelize.fn("LOWER", projectCode)
        //   ),
        //   Sequelize.where(
        //     Sequelize.fn("LOWER", Sequelize.col("resource_code")),
        //     Sequelize.fn("LOWER", projectResourceData.resource_code)
        //   ),
        // ],
      },
      raw: true,
      transaction,
    });

    await ProjectResourceFiscal.update(
      {
        ...baseData,
        total_hours_pro_res: aggregates.total_effort,
        total_cost_pro_res: aggregates.total_cost,
      },
      {
        where: {
          rid: projectFiscalData.rid,
        },
        transaction,
      }
    );
  }

  async updateCaseProjectResourceFiscalTable(
    accountNumber: string,
    projectResourceData: any,
    projectData: any,
    fiscalYear: number,
    projectId: string,
    resourceId: string,
    userId: string,
    transaction: Transaction,
    caseMapping: any,
  ) {
    const { CaseProjectResourceFiscal } = await this.getModels(accountNumber);

    const projectFiscalData = await CaseProjectResourceFiscal.findOne({
      where: {
        account_rid: projectResourceData.account_rid,
        fiscal_year: fiscalYear,
        project_rid: projectData.project_rid,
        project_fiscal_rid: projectId,
        resource_rid: resourceId,
        case_rid: caseMapping.case_rid,
        // [Op.and]: [
        //   Sequelize.where(
        //     Sequelize.fn("LOWER", Sequelize.col("project_code")),
        //     Sequelize.fn("LOWER", projectCode)
        //   ),
        //   Sequelize.where(
        //     Sequelize.fn("LOWER", Sequelize.col("resource_code")),
        //     Sequelize.fn("LOWER", projectResourceData.resource_code)
        //   ),
        // ],
      },
      transaction,
    });

    if (!projectFiscalData) {
      logMessage("Project Fiscal Not Found");
      throw new Error("Project Fiscal Not Found");
    }

    const baseData = ProjectResourceMapper.maptToUpdateProjectResourceFiscal(
      projectResourceData,
      userId
    );

    const aggregates: any = await CaseProjectResource.findOne({
      attributes: [
        "account_rid",
        "fiscal_year",
        "project_rid",
        "project_fiscal_rid",
        "resource_rid",
        [
          Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
          "total_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
          "total_cost",
        ],
      ],
      group: [
        "account_rid",
        "fiscal_year",
        "project_rid",
        "project_fiscal_rid",
        "resource_rid",
      ],
      where: {
        account_rid: projectResourceData.account_rid,
        fiscal_year: fiscalYear,
        project_rid: projectData.project_rid,
        project_fiscal_rid: projectId,
        resource_rid: resourceId,
        case_rid: caseMapping.case_rid,
        // [Op.and]: [
        //   Sequelize.where(
        //     Sequelize.fn("LOWER", Sequelize.col("project_code")),
        //     Sequelize.fn("LOWER", projectCode)
        //   ),
        //   Sequelize.where(
        //     Sequelize.fn("LOWER", Sequelize.col("resource_code")),
        //     Sequelize.fn("LOWER", projectResourceData.resource_code)
        //   ),
        // ],
      },
      raw: true,
      transaction,
    });

    await CaseProjectResourceFiscal.update(
      {
        ...baseData,
        total_hours_pro_res: aggregates.total_effort,
        total_cost_pro_res: aggregates.total_cost,
      },
      {
        where: {
          project_fiscal_rid: projectFiscalData.project_fiscal_rid,
          case_rid: caseMapping.case_rid,
        },
        transaction,
      }
    );
  }

  async updateCaseProjectResourceFiscalOnUpdateTable(
    accountNumber: string,
    projectResourceData: any,
    projectId: string,
    fiscalYear: number,
    userId: string,
    resourceData: any,
    existingProjectResource: any = {},
    statusMap: any,
    transaction: Transaction,
    caseMapping: CaseProject
  ) {
    const { CaseProjectResource, CaseProjectResourceFiscal } = await this.getModels(
      accountNumber
    );

    const oldGroupKey = {
      case_rid: caseMapping.case_rid,
      project_rid: existingProjectResource.project_rid,
      project_fiscal_rid: existingProjectResource.project_fiscal_rid,
      resource_rid: existingProjectResource.resource_rid,
      country_rid: existingProjectResource.country_rid,
      fiscal_year: existingProjectResource.fiscal_year,
    };

    const newGroupKey = {
      case_rid: caseMapping.case_rid,
      project_rid: projectId,
      project_fiscal_rid: projectResourceData.project_fiscal_rid,
      resource_rid: resourceData.rid,
      country_rid: projectResourceData.country_rid,
      fiscal_year: fiscalYear,
    };

    const isGroupChanged =
      oldGroupKey.project_fiscal_rid.toLowerCase() !==
      newGroupKey.project_fiscal_rid.toLowerCase() ||
      oldGroupKey.resource_rid.toLowerCase() !==
      newGroupKey.resource_rid.toLowerCase() ||
      oldGroupKey.fiscal_year !== newGroupKey.fiscal_year ||
      (oldGroupKey.country_rid ?? null) !== (newGroupKey.country_rid ?? null);

    // Helper to build where clause
    const buildGroupWhere = (groupKey: any) => {
      const where: any = {
        account_rid: projectResourceData.account_rid,
        fiscal_year: groupKey.fiscal_year,
        resource_rid: groupKey.resource_rid,
        project_fiscal_rid: groupKey.project_fiscal_rid,
      };

      if (groupKey.country_rid === null || groupKey.country_rid === undefined) {
        where.country_rid = { [Op.is]: null };
      } else {
        where.country_rid = groupKey.country_rid;
      }

      return where;
    };

    // 2. If the group changed, update old group
    if (isGroupChanged) {
      const oldAggregates: any = await CaseProjectResource.findAll({
        attributes: [
          "account_rid",
          "fiscal_year",
          "project_rid",
          "project_fiscal_rid",
          "resource_rid",
          "country_rid",
          [
            Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
            "total_effort",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
            "total_cost",
          ],
        ],
        group: [
          "account_rid",
          "fiscal_year",
          "project_rid",
          "project_fiscal_rid",
          "resource_rid",
          "country_rid",
        ],
        where: {
          ...buildGroupWhere(oldGroupKey),
          rid: { [Op.ne]: projectResourceData.project_resource_rid }, // exclude updated record
          status_rid: {
            [Op.in]: [
              statusMap?.get("Active"),
              null,
            ].filter(Boolean) as string[],
          }
        },
        raw: true,
        transaction,
      });

      if (oldAggregates.length > 0) {
        const oldFiscalRecord = await CaseProjectResourceFiscal.findOne({
          where: buildGroupWhere(oldGroupKey),
          transaction,
        });

        if (oldFiscalRecord) {

          await CaseProjectResourceFiscal.update(
            {
              total_hours_pro_res: oldAggregates[0].total_effort,
              total_cost_pro_res: oldAggregates[0].total_cost,
            },
            {
              where: {
                project_resource_fiscal_rid: oldFiscalRecord.project_resource_fiscal_rid,
                case_rid: caseMapping.case_rid
              },
              transaction,
            }
          );
        }
      } else {
        await CaseProjectResourceFiscal.destroy({
          where: buildGroupWhere(oldGroupKey),
          transaction,
        });
      }
    }

    // 3. Update or create the new group aggregate
    const newAggregates: any = await CaseProjectResource.findOne({
      attributes: [
        "account_rid",
        "fiscal_year",
        "project_rid",
        "project_fiscal_rid",
        "resource_rid",
        "country_rid",
        [
          Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
          "total_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
          "total_cost",
        ],
      ],
      group: [
        "account_rid",
        "fiscal_year",
        "project_rid",
        "project_fiscal_rid",
        "resource_rid",
        "country_rid",
      ],
      where: {
        ...buildGroupWhere(newGroupKey),
        status_rid: {
          [Op.in]: [
            statusMap?.get("Active"),
          ].filter(Boolean) as string[],
        }
      },
      raw: true,
      transaction,
    });

    const newFiscalRecord = await CaseProjectResourceFiscal.findOne({
      where: buildGroupWhere(newGroupKey),
      transaction,
    });

    const baseData = ProjectResourceMapper.maptToUpdateProjectResourceFiscal(
      projectResourceData,
      userId
    );

    if (newFiscalRecord) {
      // Update existing fiscal record
      if (newAggregates) {
        await CaseProjectResourceFiscal.update(
          {
            ...baseData,
            total_hours_pro_res: newAggregates.total_effort,
            total_cost_pro_res: newAggregates.total_cost,
          },
          {
            where: {
              project_resource_fiscal_rid: newFiscalRecord.project_resource_fiscal_rid,
              case_rid: caseMapping.case_rid
            },
            transaction,
          }
        );
      }
    } else {
      // Create new fiscal record
      const resource = await Resources.findOne({
        where: {
          account_rid: projectResourceData.account_rid,
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn("LOWER", Sequelize.col("resource_code")),
              Sequelize.fn("LOWER", projectResourceData.resource_code)
            ),
          ],
        },
        attributes: ["rid"],
        transaction,
      });
    }
  }

  async updateProjectResourceFiscalOnUpdateTable(
    accountNumber: string,
    projectResourceData: any,
    projectId: string,
    fiscalYear: number,
    userId: string,
    resourceData: any,
    existingProjectResource: any = {},
    statusMap: any,
    transaction: Transaction
  ) {
    const { ProjectResource, ProjectResourceFiscal } = await this.getModels(
      accountNumber
    );

    const oldGroupKey = {
      project_rid: existingProjectResource.project_rid,
      project_fiscal_rid: existingProjectResource.project_fiscal_rid,
      resource_rid: existingProjectResource.resource_rid,
      country_rid: existingProjectResource.country_rid,
      fiscal_year: existingProjectResource.fiscal_year,
    };

    const newGroupKey = {
      project_rid: projectId,
      project_fiscal_rid: projectResourceData.project_fiscal_rid,
      resource_rid: resourceData.rid,
      country_rid: projectResourceData.country_rid,
      fiscal_year: fiscalYear,
    };

    const isGroupChanged =
      oldGroupKey.project_fiscal_rid.toLowerCase() !==
      newGroupKey.project_fiscal_rid.toLowerCase() ||
      oldGroupKey.resource_rid.toLowerCase() !==
      newGroupKey.resource_rid.toLowerCase() ||
      oldGroupKey.fiscal_year !== newGroupKey.fiscal_year ||
      (oldGroupKey.country_rid ?? null) !== (newGroupKey.country_rid ?? null);

    // Helper to build where clause
    const buildGroupWhere = (groupKey: any) => {
      const where: any = {
        account_rid: projectResourceData.account_rid,
        fiscal_year: groupKey.fiscal_year,
        resource_rid: groupKey.resource_rid,
        project_fiscal_rid: groupKey.project_fiscal_rid,
      };

      if (groupKey.country_rid === null || groupKey.country_rid === undefined) {
        where.country_rid = { [Op.is]: null };
      } else {
        where.country_rid = groupKey.country_rid;
      }

      return where;
    };

    // 2. If the group changed, update old group
    if (isGroupChanged) {
      const oldAggregates: any = await ProjectResource.findAll({
        attributes: [
          "account_rid",
          "fiscal_year",
          "project_rid",
          "project_fiscal_rid",
          "resource_rid",
          "country_rid",
          [
            Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
            "total_effort",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
            "total_cost",
          ],
        ],
        group: [
          "account_rid",
          "fiscal_year",
          "project_rid",
          "project_fiscal_rid",
          "resource_rid",
          "country_rid",
        ],
        where: {
          ...buildGroupWhere(oldGroupKey),
          rid: { [Op.ne]: projectResourceData.project_resource_rid }, // exclude updated record
          status_rid: {
            [Op.in]: [
              statusMap?.get("Active"),
              null,
            ].filter(Boolean) as string[],
          }
        },
        raw: true,
        transaction,
      });

      if (oldAggregates.length > 0) {
        const oldFiscalRecord = await ProjectResourceFiscal.findOne({
          where: buildGroupWhere(oldGroupKey),
          transaction,
        });

        if (oldFiscalRecord) {
          await ProjectResourceFiscal.update(
            {
              total_hours_pro_res: oldAggregates[0].total_effort,
              total_cost_pro_res: oldAggregates[0].total_cost,
            },
            {
              where: { rid: oldFiscalRecord.rid },
              transaction,
            }
          );
        }
      } else {
        await ProjectResourceFiscal.destroy({
          where: buildGroupWhere(oldGroupKey),
          transaction,
        });
      }
    }

    // 3. Update or create the new group aggregate
    const newAggregates: any = await ProjectResource.findOne({
      attributes: [
        "account_rid",
        "fiscal_year",
        "project_rid",
        "project_fiscal_rid",
        "resource_rid",
        "country_rid",
        [
          Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
          "total_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
          "total_cost",
        ],
      ],
      group: [
        "account_rid",
        "fiscal_year",
        "project_rid",
        "project_fiscal_rid",
        "resource_rid",
        "country_rid",
      ],
      where: {
        ...buildGroupWhere(newGroupKey),
        status_rid: {
          [Op.in]: [
            statusMap?.get("Active"),
          ].filter(Boolean) as string[],
        }
      },
      raw: true,
      transaction,
    });

    const newFiscalRecord = await ProjectResourceFiscal.findOne({
      where: buildGroupWhere(newGroupKey),
      transaction,
    });

    const baseData = ProjectResourceMapper.maptToUpdateProjectResourceFiscal(
      projectResourceData,
      userId
    );

    if (newFiscalRecord) {
      // Update existing fiscal record
      if (newAggregates) {
        await ProjectResourceFiscal.update(
          {
            ...baseData,
            total_hours_pro_res: newAggregates.total_effort,
            total_cost_pro_res: newAggregates.total_cost,
          },
          {
            where: { rid: newFiscalRecord.rid },
            transaction,
          }
        );
      }
    } else {
      // Create new fiscal record
      const resource = await Resources.findOne({
        where: {
          account_rid: projectResourceData.account_rid,
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn("LOWER", Sequelize.col("resource_code")),
              Sequelize.fn("LOWER", projectResourceData.resource_code)
            ),
          ],
        },
        attributes: ["rid"],
        transaction,
      });

      await ProjectResourceFiscal.create(
        {
          account_rid: projectResourceData.account_rid,
          project_rid: projectId,
          project_fiscal_rid: projectResourceData.project_fiscal_rid,
          fiscal_year: fiscalYear,
          resource_rid: resource?.rid || "",
          status_rid: projectResourceData.status_rid || null,
          total_hours_pro_res: projectResourceData.total_hours_pro_res ?? 0,
          total_cost_pro_res: projectResourceData.net_total_cost_pro_res ?? 0,
          country_rid: projectResourceData.country_rid || null,
          region_rid: projectResourceData.region_rid || null,
          currency_rid: projectResourceData.currency_rid || null,
          description: projectResourceData.description || null,
          created_by: userId,
          created_datetime: new Date(),
        },
        {
          transaction,
        }
      );
    }
  }

  async updateProjectResourceFiscalRegionTable(
    accountNumber: string,
    projectResourceData: ICreateProjectResource | IUpdateProjectResource,
    projectData: any,
    fiscalYear: number,
    projectId: string,
    resourceId: string,
    userId: string,
    transaction: Transaction
  ) {
    const { ProjectResourceFiscalRegion, ProjectResource, Resources } =
      await this.getModels(accountNumber);

    const fiscalRegionRecord = await ProjectResourceFiscalRegion.findOne({
      where: {
        account_rid: projectResourceData.account_rid,
        fiscal_year: fiscalYear,
        country_rid: projectResourceData.country_rid,
        region_rid: projectResourceData.region_rid,
        project_fiscal_rid: projectId,
        resource_rid: resourceId,
        // [Op.and]: [
        //   Sequelize.where(
        //     Sequelize.fn("LOWER", Sequelize.col("project_code")),
        //     Sequelize.fn("LOWER", projectCode)
        //   ),
        //   Sequelize.where(
        //     Sequelize.fn("LOWER", Sequelize.col("resource_code")),
        //     Sequelize.fn("LOWER", projectResourceData.resource_code)
        //   ),
        // ],
      },
      transaction,
    });

    if (!fiscalRegionRecord && projectResourceData.region_rid) {
      const resource = await Resources.findOne({
        where: {
          account_rid: projectResourceData.account_rid,
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn("LOWER", Sequelize.col("resource_code")),
              Sequelize.fn("LOWER", projectResourceData.resource_code)
            ),
          ],
        },
        attributes: ["rid"],
        transaction,
      });

      const newData = ProjectResourceMapper.mapToProjectResourceFiscalRegion(
        projectResourceData,
        projectData.project_rid,
        fiscalYear,
        userId,
        resource?.rid || ""
      );

      await ProjectResourceFiscalRegion.create(newData, {
        transaction,
      });

      return;
    }

    const basedata =
      ProjectResourceMapper.maptToUpdateProjectResourceFiscalRegion(
        projectResourceData,
        userId
      );

    const aggregates: any = await ProjectResource.findOne({
      attributes: [
        "account_rid",
        "fiscal_year",
        "project_rid",
        "project_fiscal_rid",
        "resource_rid",
        "country_rid",
        "region_rid",
        [
          Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
          "total_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
          "total_cost",
        ],
      ],
      group: [
        "account_rid",
        "fiscal_year",
        "project_rid",
        "project_fiscal_rid",
        "resource_rid",
        "country_rid",
        "region_rid",
      ],
      where: {
        account_rid: projectResourceData.account_rid,
        fiscal_year: fiscalYear,
        country_rid: projectResourceData.country_rid,
        region_rid: projectResourceData.region_rid,
        project_rid: projectData.project_rid,
        project_fiscal_rid: projectId,
        resource_rid: resourceId,
        // [Op.and]: [
        //   Sequelize.where(
        //     Sequelize.fn("LOWER", Sequelize.col("project_code")),
        //     Sequelize.fn("LOWER", projectCode)
        //   ),
        //   Sequelize.where(
        //     Sequelize.fn("LOWER", Sequelize.col("resource_code")),
        //     Sequelize.fn("LOWER", projectResourceData.resource_code)
        //   ),
        // ],
      },
      raw: true,
      transaction,
    });

    if (fiscalRegionRecord) {
      await ProjectResourceFiscalRegion.update(
        {
          ...basedata,
          total_hours_pro_res: aggregates?.total_effort || 0,
          total_cost_pro_res: aggregates?.total_cost || 0,
        },
        {
          where: {
            rid: fiscalRegionRecord.rid,
          },
          transaction,
        }
      );
    }
  }

  async updateProjectResourceFiscalRegionTableOnUpdate(
    accountNumber: string,
    projectResourceData: IUpdateProjectResource,
    projectId: string,
    fiscalYear: number,
    projectCode: string,
    resourceData: any,
    userId: string,
    existingProjectResource: any,
    statusMap: any,
    transaction: Transaction
  ) {
    const { ProjectResourceFiscalRegion, ProjectResource, Resources } =
      await this.getModels(accountNumber);

    const oldGroupKey = {
      project_rid: existingProjectResource.project_rid,
      project_fiscal_rid: existingProjectResource.project_fiscal_rid,
      resource_rid: existingProjectResource.resource_rid,
      fiscal_year: existingProjectResource.fiscal_year,
      country_rid: existingProjectResource.country_rid,
      region_rid: existingProjectResource.region_rid,
    };

    const newGroupKey = {
      project_rid: projectId,
      project_fiscal_rid: projectResourceData.project_fiscal_rid,
      resource_rid: resourceData.rid,
      fiscal_year: fiscalYear,
      country_rid: projectResourceData.country_rid,
      region_rid: projectResourceData.region_rid,
    };

    const isGroupChanged =
      oldGroupKey.project_fiscal_rid?.toLowerCase() !==
      newGroupKey.project_fiscal_rid?.toLowerCase() ||
      oldGroupKey.resource_rid?.toLowerCase() !==
      newGroupKey.resource_rid?.toLowerCase() ||
      oldGroupKey.fiscal_year !== newGroupKey.fiscal_year ||
      oldGroupKey.country_rid !== newGroupKey.country_rid ||
      oldGroupKey.region_rid !== newGroupKey.region_rid;

    const buildGroupWhere = (groupKey: any) => ({
      account_rid: projectResourceData.account_rid,
      fiscal_year: groupKey.fiscal_year,
      country_rid: groupKey.country_rid,
      region_rid: groupKey.region_rid,
      project_fiscal_rid: groupKey.project_fiscal_rid,
      resource_rid: groupKey.resource_rid,
      // [Op.and]: [
      //   Sequelize.where(
      //     Sequelize.fn("LOWER", Sequelize.col("project_code")),
      //     Sequelize.fn("LOWER", groupKey.project_code)
      //   ),
      //   Sequelize.where(
      //     Sequelize.fn("LOWER", Sequelize.col("resource_code")),
      //     Sequelize.fn("LOWER", groupKey.resource_code)
      //   ),
      // ],
    });

    // --- STEP 1: If group changed, update/delete old region fiscal record ---
    if (isGroupChanged) {
      const oldAggregates: any = await ProjectResource.findOne({
        attributes: [
          "account_rid",
          "fiscal_year",
          "project_rid",
          "project_fiscal_rid",
          "resource_rid",
          "country_rid",
          "region_rid",
          [
            Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
            "total_effort",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
            "total_cost",
          ],
        ],
        group: [
          "account_rid",
          "fiscal_year",
          "project_rid",
          "project_fiscal_rid",
          "resource_rid",
          "country_rid",
          "region_rid",
        ],
        where: {
          ...buildGroupWhere(oldGroupKey),
          rid: { [Op.ne]: projectResourceData.project_resource_rid }, // exclude current
          status_rid: {
            [Op.in]: [
              statusMap?.get("Active"),
              null,
            ].filter(Boolean) as string[],
          }
        },
        raw: true,
        transaction,
      });

      const oldFiscalRegionRecord = await ProjectResourceFiscalRegion.findOne({
        where: buildGroupWhere(oldGroupKey),
        transaction,
      });

      if (oldAggregates && oldFiscalRegionRecord) {
        await ProjectResourceFiscalRegion.update(
          {
            total_hours_pro_res: oldAggregates.total_effort,
            total_cost_pro_res: oldAggregates.total_cost,
          },
          {
            where: { rid: oldFiscalRegionRecord.rid },
            transaction,
          }
        );
      } else if (oldFiscalRegionRecord) {
        await ProjectResourceFiscalRegion.destroy({
          where: { rid: oldFiscalRegionRecord.rid },
          transaction,
        });
      }
    }

    // --- STEP 2: Always update or insert the new group fiscal region ---
    const newAggregates: any = await ProjectResource.findOne({
      attributes: [
        "account_rid",
        "fiscal_year",
        "project_rid",
        "project_fiscal_rid",
        "resource_rid",
        "country_rid",
        "region_rid",
        [
          Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
          "total_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
          "total_cost",
        ],
      ],
      group: [
        "account_rid",
        "fiscal_year",
        "project_rid",
        "project_fiscal_rid",
        "resource_rid",
        "country_rid",
        "region_rid",
      ],
      where: {
        ...buildGroupWhere(newGroupKey),
        status_rid: {
          [Op.in]: [
            statusMap?.get("Active"),
          ].filter(Boolean) as string[],
        }
      },
      raw: true,
      transaction,
    });

    const fiscalRegionRecord = await ProjectResourceFiscalRegion.findOne({
      where: buildGroupWhere(newGroupKey),
      transaction,
    });

    const baseData =
      ProjectResourceMapper.maptToUpdateProjectResourceFiscalRegion(
        projectResourceData,
        userId
      );

    if (fiscalRegionRecord) {
      await ProjectResourceFiscalRegion.update(
        {
          ...baseData,
          total_hours_pro_res: newAggregates?.total_effort || 0,
          total_cost_pro_res: newAggregates?.total_cost || 0,
        },
        {
          where: {
            rid: fiscalRegionRecord.rid,
          },
          transaction,
        }
      );
    } else {
      if (projectResourceData.region_rid) {
        const resource = await Resources.findOne({
          where: {
            account_rid: projectResourceData.account_rid,
            [Op.and]: [
              Sequelize.where(
                Sequelize.fn("LOWER", Sequelize.col("resource_code")),
                Sequelize.fn("LOWER", projectResourceData.resource_code)
              ),
            ],
          },
          attributes: ["rid"],
          transaction,
        });

        const newData = ProjectResourceMapper.mapToProjectResourceFiscalRegion(
          projectResourceData,
          projectId,
          fiscalYear,
          userId,
          resource?.rid || ""
        );

        await ProjectResourceFiscalRegion.create(
          {
            ...newData,
            total_hours_pro_res: newAggregates?.total_effort || 0,
            total_cost_pro_res: newAggregates?.total_cost || 0,
          },
          { transaction }
        );
      }
    }
  }

  async addProjectResourceTimeline(
    accountNumber: string,
    eventName: string,
    projectResourceData: ICreateProjectResource,
    projectResourceId: string,
    userId: string,
    transaction: Transaction
  ) {
    try {
      const { ProjectResourceTimeline } = await this.getModels(accountNumber);

      await ProjectResourceTimeline.create(
        {
          account_rid: projectResourceData.account_rid,
          event_name: eventName,
          event_status: "success",
          event_type: "ui handler",
          entity_rid: projectResourceId,
          created_by: userId,
          created_datetime: new Date(),
        },
        {
          transaction,
        }
      );
    } catch (err) {
      errorLog("Error adding timeline", (err as Error).message);
      throw new Error("Error creating project resource timeline");
    }
  }

  async updateProjectResourceTimeline(
    accountNumber: string,
    eventName: string,
    projectResourceData: IUpdateProjectResource | IUpdateInlineProjectResource,
    projectResourceId: string,
    userId: string,
    transaction: Transaction
  ) {
    try {
      const { ProjectResourceTimeline } = await this.getModels(accountNumber);

      await ProjectResourceTimeline.create(
        {
          account_rid: projectResourceData.account_rid,
          event_name: eventName,
          event_status: "success",
          event_type: "ui handler",
          entity_rid: projectResourceId,
          created_by: userId,
          created_datetime: new Date(),
        },
        {
          transaction,
        }
      );
    } catch (err) {
      errorLog("Error adding timeline", (err as Error).message);
      throw new Error("Error creating project resource timline");
    }
  }

  async addProjectResourceHistory(
    accountNumber: string,
    newProjectResourceData: any,
    existingProjectData: any,
    projectResourceId: string,
    userId: string,
    transaction: Transaction
  ) {
    const { ProjectResourceHistory } = await this.getModels(accountNumber);

    const excludedFields = [
      "modified_by",
      "account_rid",
      "project_rid",
      "project_fiscal_rid",
      "modified_datetime",
    ];

    const cleanedNewData = Object.fromEntries(
      Object.entries(newProjectResourceData).filter(
        ([key]) => !excludedFields.includes(key)
      )
    );

    const historyChanges = Object.entries(cleanedNewData)
      .filter(([key, newValue]) => {
        const oldValue = existingProjectData[key];

        if (newValue == null && oldValue == null) return false;

        if (typeof newValue === "number" || typeof oldValue === "number") {
          return Number(newValue) !== Number(oldValue);
        }

        return String(newValue ?? "") !== String(oldValue ?? "");
      })
      .map(([key, newValue]) => ({
        project_resource_rid: projectResourceId,
        attribute_name: key,
        old_value:
          existingProjectData[key] !== null &&
            existingProjectData[key] !== undefined
            ? String(existingProjectData[key])
            : "",
        new_value:
          newValue !== null && newValue !== undefined ? String(newValue) : "",
        modified_by: userId,
        r_number: "",
        created_by: userId,
      }));

    if (historyChanges.length === 0) return;

    const latest = await ProjectResourceHistory.findAll();

    historyChanges.forEach((change, i) => {
      change.r_number = `PRORH${(latest.length + i + 1)
        .toString()
        .padStart(4, "0")}`;
    });

    await ProjectResourceHistory.bulkCreate(historyChanges, {
      transaction,
    });
  }

  async insertIntoAccountFiscal(
    accountNumber: string,
    projectResourceData: ICreateProjectResource,
    fiscalYear: number,
    userId: string,
    transaction: Transaction
  ) {
    const { AccountFiscal } = await this.getModels(accountNumber);

    const baseData = ProjectResourceMapper.mapToAccountFiscal(
      projectResourceData,
      userId
    );

    await AccountFiscal.create(
      {
        ...baseData,
        account_rid: projectResourceData.account_rid,
        fiscal_year: fiscalYear,
      },
      {
        transaction,
      }
    );
  }

  async insertIntoAccountFiscalRegion(
    accountNumber: string,
    projectResourceData: ICreateProjectResource | IUpdateProjectResource,
    resourceData: any,
    fiscalYear: number,
    regionId: string,
    userId: string,
    transaction: Transaction
  ) {
    const { AccountFiscalRegion } = await this.getModels(accountNumber);

    const baseData: any = ProjectResourceMapper.mapToAccountFiscal(
      projectResourceData,
      userId
    );

    const resourceType: any = await this.fetchResourceType(
      resourceData.resource_type_rid // need to add resource fiscal
    );

    if (resourceType) {
      const typeCode = resourceType[0].resource_type_name.toLowerCase();

      switch (typeCode) {
        case "full-time":
          baseData.total_project_hours_fte =
            projectResourceData.total_hours_pro_res || null;
          baseData.total_project_cost_fte =
            projectResourceData.net_total_cost_pro_res || null;
          break;
        case "sub con":
          baseData.total_project_hours_subcon =
            projectResourceData.total_hours_pro_res || null;
          baseData.total_project_cost_subcon =
            projectResourceData.net_total_cost_pro_res || null;
          break;
        case "non-labor":
          baseData.total_project_cost_nonlabor =
            projectResourceData.net_total_cost_pro_res || null;
          break;
        default:
          logMessage(`Unknown resource_type_rid: ${typeCode}`);
          break;
      }
    }

    await AccountFiscalRegion.create(
      {
        ...baseData,
        account_rid: projectResourceData.account_rid,
        fiscal_year: fiscalYear,
        region_rid: regionId,
      },
      {
        transaction,
      }
    );
  }

  async insertIntoAccountFiscalRegionOnUpdate(
    accountNumber: string,
    projectResourceData: ICreateProjectResource | IUpdateProjectResource,
    fiscalYear: number,
    newRegionId: string | null,
    oldRegionId: string | null, // <-- New parameter
    userId: string,
    statusMap: any,
    transaction: Transaction
  ) {
    const { AccountFiscalRegion, ProjectFiscalRegion } = await this.getModels(
      accountNumber
    );

    // 1. If new region exists, aggregate and upsert it
    if (newRegionId) {
      const aggregate: any = await ProjectFiscalRegion.findOne({
        attributes: [
          [
            Sequelize.fn("SUM", Sequelize.col("effective_fte_effort")),
            "total_fte_effort",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("effective_fte_cost")),
            "total_fte_cost",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("effective_subcon_effort")),
            "total_subcon_effort",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("effective_subcon_cost")),
            "total_subcon_cost",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("effective_nonlabor_cost")),
            "total_nonlabor_cost",
          ],
        ],
        where: {
          account_rid: projectResourceData.account_rid,
          fiscal_year: fiscalYear,
          region_rid: newRegionId,
        },
        raw: true,
        transaction,
      });

      const baseData: any = ProjectResourceMapper.mapToAccountFiscal(
        projectResourceData,
        userId
      );

      baseData.total_project_hours_fte = +aggregate?.total_fte_effort || 0;
      baseData.total_project_cost_fte = +aggregate?.total_fte_cost || 0;
      baseData.total_project_hours_subcon =
        +aggregate?.total_subcon_effort || 0;
      baseData.total_project_cost_subcon = +aggregate?.total_subcon_cost || 0;
      baseData.total_project_cost_nonlabor =
        +aggregate?.total_nonlabor_cost || 0;

      baseData.total_project_hours = this.safeSum(
        baseData.total_project_hours_fte,
        baseData.total_project_hours_subcon
      );

      baseData.total_project_cost = this.safeSum(
        baseData.total_project_cost_fte,
        baseData.total_project_cost_subcon,
        baseData.total_project_cost_nonlabor
      );

      const existingRecord = await AccountFiscalRegion.findOne({
        where: {
          account_rid: projectResourceData.account_rid,
          fiscal_year: fiscalYear,
          region_rid: newRegionId,
        },
        transaction,
      });

      if (existingRecord) {
        await AccountFiscalRegion.update(
          {
            ...baseData,
            modified_by: userId,
            modified_datetime: new Date(),
          },
          {
            where: { rid: existingRecord.rid },
            transaction,
          }
        );
      } else {
        await AccountFiscalRegion.create(
          {
            ...baseData,
            account_rid: projectResourceData.account_rid,
            fiscal_year: fiscalYear,
            region_rid: newRegionId,
            created_by: userId,
            created_datetime: new Date(),
          },
          {
            transaction,
          }
        );
      }
    }

    // 2. If old region is different and now unused, delete it
    if (oldRegionId && oldRegionId !== newRegionId) {
      const projectFiscalCount = await ProjectFiscalRegion.count({
        where: {
          account_rid: projectResourceData.account_rid,
          fiscal_year: fiscalYear,
          region_rid: oldRegionId,
        },
        transaction,
      });

      if (projectFiscalCount === 0) {
        await AccountFiscalRegion.destroy({
          where: {
            account_rid: projectResourceData.account_rid,
            fiscal_year: fiscalYear,
            region_rid: oldRegionId,
          },
          transaction,
        });
      }
    }
  }

  async cleanupOrphanedAccountFiscalRegion(
    accountNumber: string,
    accountId: string,
    fiscalYear: number,
    regionId: string | null,
    transaction: Transaction
  ) {
    if (!regionId) return;

    const { AccountFiscalRegion, ProjectFiscalRegion } = await this.getModels(
      accountNumber
    );

    // Check if any project_fiscal_region rows still exist for this region
    const projectFiscalCount = await ProjectFiscalRegion.count({
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
        region_rid: regionId,
      },
      transaction,
    });

    if (projectFiscalCount === 0) {
      await AccountFiscalRegion.destroy({
        where: {
          account_rid: accountId,
          fiscal_year: fiscalYear,
          region_rid: regionId,
        },
        transaction,
      });
    }
  }

  async aggregatesResourceFiscal(
    accountNumber: string,
    accountId: string,
    resourceCode: string,
    resourceData: any,
    fiscalYear: number,
    statusMap: any,
    transaction: Transaction
  ) {
    const { ResourcesFiscal, ProjectResource } = await this.getModels(
      accountNumber
    );

    const aggregates: any = await ProjectResource.findOne({
      attributes: [
        "account_rid",
        "fiscal_year",
        "resource_rid",
        [
          Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
          "total_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
          "total_cost",
        ],
      ],
      where: {
        account_rid: accountId,
        resource_rid: resourceData.rid,
        fiscal_year: fiscalYear,
        status_rid: {
          [Op.in]: [
            statusMap?.get("Active"),
          ].filter(Boolean) as string[],
        },
      },
      group: ["account_rid", "fiscal_year", "resource_rid"],
      raw: true,
      transaction,
    });

    if (!aggregates) return;

    await ResourcesFiscal.update(
      {
        total_effort_for_year_project_resource_level: aggregates.total_effort,
        total_cost_for_year_project_resource_level: aggregates.total_cost,
      },
      {
        where: {
          account_rid: accountId,
          fiscal_year: fiscalYear,
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn("LOWER", Sequelize.col("resource_code")),
              Sequelize.fn("LOWER", resourceCode)
            ),
          ],
        },
        transaction,
      }
    );
  }

  async aggregatesResourceFiscalRegion(
    accountNumber: string,
    accountId: string,
    resourceCode: string,
    resourceData: any,
    fiscalYear: number,
    statusMap: any,
    transaction: Transaction
  ) {
    const { ResourceFiscalRegion, ProjectResource } = await this.getModels(
      accountNumber
    );

    const aggregates: any = await ProjectResource.findOne({
      attributes: [
        "account_rid",
        "fiscal_year",
        "resource_rid",
        "region_rid",
        [
          Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
          "total_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
          "total_cost",
        ],
      ],
      where: {
        account_rid: accountId,
        resource_rid: resourceData.rid,
        fiscal_year: fiscalYear,
        status_rid: {
          [Op.in]: [
            statusMap?.get("Active"),
          ].filter(Boolean) as string[],
        },
      },
      group: ["account_rid", "fiscal_year", "resource_rid", "region_rid"],
      raw: true,
      transaction,
    });

    if (!aggregates) return;

    await ResourceFiscalRegion.update(
      {
        total_effort_for_year_project_resource_level: aggregates.total_effort,
        total_cost_for_year_project_resource_level: aggregates.total_cost,
      },
      {
        where: {
          account_rid: accountId,
          country_region_rid: aggregates.region_rid,
          fiscal_year: fiscalYear,
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn("LOWER", Sequelize.col("resource_code")),
              Sequelize.fn("LOWER", resourceCode)
            ),
          ],
        },
        transaction,
      }
    );
  }

  async aggregatesProjectFiscal(
    accountNumber: string,
    accountId: string,
    projectId: string,
    fiscalYear: number,
    statusMap: any,
    transaction: Transaction
  ) {
    const { ProjectResource, ProjectFiscal, CaseProject } = await this.getModels(
      accountNumber
    );

    const resourceTypes: any = await this.fetchResourceTypeAll();

    const resourceTypeMap: Record<string, string> = {};
    for (const rt of resourceTypes) {
      resourceTypeMap[rt.rid] = rt.resource_type_name.toLowerCase();
    }

    const aggregates: any = await ProjectResource.findAll({
      attributes: [
        "account_rid",
        "project_rid",
        "project_fiscal_rid",
        "fiscal_year",
        [
          Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
          "total_cost",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
          "total_effort",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("rid")), "count"],
      ],
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
        project_fiscal_rid: projectId,
        status_rid: {
          [Op.in]: [
            statusMap?.get("Active"),
          ].filter(Boolean) as string[],
        },
      },
      group: [
        "account_rid",
        "project_rid",
        "project_fiscal_rid",
        "fiscal_year",
      ],
      raw: true,
      transaction,
    });

    const byTypeAggregates: any[] = await ProjectResource.findAll({
      attributes: [
        [
          Sequelize.col("project_resource_resource.resource_type_rid"),
          "resource_type_rid",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_hours_pro_res"), "DECIMAL")
          ),
          "total_effort",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("net_total_cost_pro_res"), "DECIMAL")
          ),
          "total_cost",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("ProjectResource.rid")), "count"],
      ],
      include: [
        {
          model: Resources,
          as: "project_resource_resource",
          attributes: ["resource_type_rid"],
          required: true,
        },
      ],
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
        project_fiscal_rid: projectId,
        status_rid: {
          [Op.in]: [
            statusMap?.get("Active"),
          ].filter(Boolean) as string[],
        },
      },
      group: ["project_resource_resource.resource_type_rid"],
      raw: true,
      transaction,
    });

    if (!aggregates) return;

    if (!aggregates || aggregates.length === 0) return;

    let total_cost_fte = 0;
    let total_cost_subcon = 0;
    let total_cost_nonlabor = 0;
    let total_effort_fte = 0;
    let total_effort_subcon = 0;

    let total_fte_count = 0;
    let total_subcon_count = 0;
    let total_nonlabor_count = 0;

    for (const row of byTypeAggregates) {
      const typeName = resourceTypeMap[row.resource_type_rid] || "";
      const cost = Number(row.total_cost || 0);
      const effort = Number(row.total_effort || 0);
      const count = Number(row.count || 0);

      switch (typeName) {
        case "full-time":
          total_cost_fte = cost;
          total_effort_fte = effort;
          total_fte_count = count;
          break;
        case "sub con":
          total_cost_subcon = cost;
          total_effort_subcon = effort;
          total_subcon_count = count;
          break;
        case "non-labor":
          total_cost_nonlabor = cost;
          total_nonlabor_count = count;
          break;
        default:
          logMessage(`Unknown resource_type_rid: ${row.resource_type_rid}`);
          break;
      }
    }

    const total_cost = this.safeSum(
      total_cost_fte,
      total_cost_subcon,
      total_cost_nonlabor
    );
    const total_effort = this.safeSum(total_effort_fte, total_effort_subcon);

    await ProjectFiscal.update(
      {
        total_cost_fte_from_prj_res: total_cost_fte,
        total_cost_subcon_from_prj_res: total_cost_subcon,
        total_cost_nonlabor_from_prj_res: total_cost_nonlabor,

        total_effort_fte_from_prj_res: total_effort_fte,
        total_effort_subcon_from_prj_res: total_effort_subcon,

        total_cost_from_prj_res: total_cost,
        total_effort_from_prj_res: total_effort,

        total_fte_from_prj_res: total_fte_count,
        total_subcon_from_prj_res: total_subcon_count,
        total_nonlabor_from_prj_res: total_nonlabor_count,
      },
      {
        where: {
          account_rid: accountId,
          fiscal_year: fiscalYear,
          rid: projectId,
          // [Op.and]: [
          //   Sequelize.where(
          //     Sequelize.fn("LOWER", Sequelize.col("project_code")),
          //     Sequelize.fn("LOWER", projectCode)
          //   ),
          // ],
        },
        transaction,
      }
    );

    await ProjectFiscal.update(
      {
        effective_fte_cost: total_cost_fte,
        effective_subcon_cost: total_cost_subcon,
        effective_nonlabor_cost: total_cost_nonlabor,
        effective_fte_effort: total_effort_fte,
        effective_subcon_effort: total_effort_subcon,
        effective_cost: total_cost,
        effective_effort: total_effort,

        effective_total_fte: total_fte_count,
        effective_total_subcon: total_subcon_count,
        effective_total_nonlabor: total_nonlabor_count,
      },
      {
        where: {
          account_rid: accountId,
          fiscal_year: fiscalYear,
          default_metric_type: "project_resource",
          rid: projectId,
          effective_metric_type: {
            [Op.is]: null,
          },
          // [Op.and]: [
          //   Sequelize.where(
          //     Sequelize.fn("LOWER", Sequelize.col("project_code")),
          //     Sequelize.fn("LOWER", projectCode)
          //   ),
          // ],
        },
        transaction,
      }
    );
  }

  async aggregatesCaseProjectFiscal(
    accountNumber: string,
    accountId: string,
    projectId: string,
    fiscalYear: number,
    statusMap: any,
    transaction: Transaction,
    caseMapping: any,
  ) {
    const { CaseProjectResource, CaseProject } = await this.getModels(
      accountNumber
    );

    const resourceTypes: any = await this.fetchResourceTypeAll();

    const resourceTypeMap: Record<string, string> = {};
    for (const rt of resourceTypes) {
      resourceTypeMap[rt.rid] = rt.resource_type_name.toLowerCase();
    }

    const aggregates: any = await CaseProjectResource.findAll({
      attributes: [
        "account_rid",
        "project_rid",
        "project_fiscal_rid",
        "fiscal_year",
        [
          Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
          "total_cost",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
          "total_effort",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("rid")), "count"],
      ],
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
        project_fiscal_rid: projectId,
        case_rid: caseMapping?.case_rid,
        status_rid: {
          [Op.in]: [
            statusMap?.get("Active"),
          ].filter(Boolean) as string[],
        },
      },
      group: [
        "account_rid",
        "project_rid",
        "project_fiscal_rid",
        "fiscal_year",
      ],
      raw: true,
      transaction,
    });

    const byTypeAggregates: any[] = await CaseProjectResource.findAll({
      attributes: [
        [
          Sequelize.col("project_resource_resource.resource_type_rid"),
          "resource_type_rid",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_hours_pro_res"), "DECIMAL")
          ),
          "total_effort",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("net_total_cost_pro_res"), "DECIMAL")
          ),
          "total_cost",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("CaseProjectResource.rid")), "count"],
      ],
      include: [
        {
          model: Resources,
          as: "project_resource_resource",
          attributes: ["resource_type_rid"],
          required: true,
        },
      ],
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
        project_fiscal_rid: projectId,
        case_rid: caseMapping?.case_rid,
        status_rid: {
          [Op.in]: [
            statusMap?.get("Active"),
          ].filter(Boolean) as string[],
        },
      },
      group: ["project_resource_resource.resource_type_rid"],
      raw: true,
      transaction,
    });

    if (!aggregates) return;

    if (!aggregates || aggregates.length === 0) return;

    let total_cost_fte = 0;
    let total_cost_subcon = 0;
    let total_cost_nonlabor = 0;
    let total_effort_fte = 0;
    let total_effort_subcon = 0;

    let total_fte_count = 0;
    let total_subcon_count = 0;
    let total_nonlabor_count = 0;

    for (const row of byTypeAggregates) {
      const typeName = resourceTypeMap[row.resource_type_rid] || "";
      const cost = Number(row.total_cost || 0);
      const effort = Number(row.total_effort || 0);
      const count = Number(row.count || 0);

      switch (typeName) {
        case "full-time":
          total_cost_fte = cost;
          total_effort_fte = effort;
          total_fte_count = count;
          break;
        case "sub con":
          total_cost_subcon = cost;
          total_effort_subcon = effort;
          total_subcon_count = count;
          break;
        case "non-labor":
          total_cost_nonlabor = cost;
          total_nonlabor_count = count;
          break;
        default:
          logMessage(`Unknown resource_type_rid: ${row.resource_type_rid}`);
          break;
      }
    }

    const total_cost = this.safeSum(
      total_cost_fte,
      total_cost_subcon,
      total_cost_nonlabor
    );
    const total_effort = this.safeSum(total_effort_fte, total_effort_subcon);

    await CaseProject.update(
      {
        total_cost_fte_from_prj_res: total_cost_fte,
        total_cost_subcon_from_prj_res: total_cost_subcon,
        total_cost_nonlabor_from_prj_res: total_cost_nonlabor,

        total_effort_fte_from_prj_res: total_effort_fte,
        total_effort_subcon_from_prj_res: total_effort_subcon,

        total_cost_from_prj_res: total_cost,
        total_effort_from_prj_res: total_effort,

        total_fte_from_prj_res: total_fte_count,
        total_subcon_from_prj_res: total_subcon_count,
        total_nonlabor_from_prj_res: total_nonlabor_count,
      },
      {
        where: {
          account_rid: accountId,
          fiscal_year: fiscalYear,
          rid: projectId,
          case_rid: caseMapping?.case_rid,
          // [Op.and]: [
          //   Sequelize.where(
          //     Sequelize.fn("LOWER", Sequelize.col("project_code")),
          //     Sequelize.fn("LOWER", projectCode)
          //   ),
          // ],
        },
        transaction,
      }
    );

    await CaseProject.update(
      {
        effective_fte_cost: total_cost_fte,
        effective_subcon_cost: total_cost_subcon,
        effective_nonlabor_cost: total_cost_nonlabor,
        effective_fte_effort: total_effort_fte,
        effective_subcon_effort: total_effort_subcon,
        effective_cost: total_cost,
        effective_effort: total_effort,

        effective_total_fte: total_fte_count,
        effective_total_subcon: total_subcon_count,
        effective_total_nonlabor: total_nonlabor_count,
      },
      {
        where: {
          account_rid: accountId,
          fiscal_year: fiscalYear,
          default_metric_type: "project_resource",
          rid: projectId,
          case_rid: caseMapping?.case_rid,
          effective_metric_type: {
            [Op.is]: null,
          },
          // [Op.and]: [
          //   Sequelize.where(
          //     Sequelize.fn("LOWER", Sequelize.col("project_code")),
          //     Sequelize.fn("LOWER", projectCode)
          //   ),
          // ],
        },
        transaction,
      }
    );
  }

  async aggregatesProjectFiscalSummary(
    accountNumber: string,
    accountId: string,
    projectId: string,
    projectCode: string,
    fiscalYear: number,
    statusMap: any,
    transaction: Transaction
  ) {
    const { ProjectResource, ProjectFiscal } = await this.getModels(
      accountNumber
    );

    const resourceTypes: any = await this.fetchResourceTypeAll();

    const resourceTypeMap: Record<string, string> = {};
    for (const rt of resourceTypes) {
      resourceTypeMap[rt.rid] = rt.resource_type_name.toLowerCase();
    }

    const aggregates: any = await ProjectResource.findAll({
      attributes: [
        "account_rid",
        "project_rid",
        "project_fiscal_rid",
        "fiscal_year",
        [
          Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
          "total_cost",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
          "total_effort",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("rid")), "count"],
      ],
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
        project_fiscal_rid: projectId,
        status_rid: {
          [Op.in]: [
            statusMap?.get("Active"),
          ].filter(Boolean) as string[],
        },
      },
      group: [
        "account_rid",
        "project_rid",
        "project_fiscal_rid",
        "fiscal_year",
      ],
      raw: true,
      transaction,
    });

    if (!aggregates) return;

    if (!aggregates || aggregates.length === 0) return;

    let total_cost_fte = 0;
    let total_cost_subcon = 0;
    let total_cost_nonlabor = 0;
    let total_effort_fte = 0;
    let total_effort_subcon = 0;

    let total_fte_count = 0;
    let total_subcon_count = 0;
    let total_nonlabor_count = 0;

    for (const row of aggregates) {
      const typeName = resourceTypeMap[row.resource_type_rid] || "";
      const cost = Number(row.total_cost || 0);
      const effort = Number(row.total_effort || 0);
      const count = Number(row.count || 0);

      switch (typeName) {
        case "full-time":
          total_cost_fte = cost;
          total_effort_fte = effort;
          total_fte_count = count;
          break;
        case "sub con":
          total_cost_subcon = cost;
          total_effort_subcon = effort;
          total_subcon_count = count;
          break;
        case "non-labor":
          total_cost_nonlabor = cost;
          total_nonlabor_count = count;
          break;
        default:
          logMessage(`Unknown resource_type_rid: ${row.resource_type_rid}`);
          break;
      }
    }

    const total_cost = this.safeSum(
      total_cost_fte,
      total_cost_subcon,
      total_cost_nonlabor
    );
    const total_effort = this.safeSum(total_effort_fte, total_effort_subcon);

    const updateQuery = `
      UPDATE ${MAIN_SCHEMA_NAME}.project_fiscal_summary
      SET
        total_cost_fte_from_prj_res = :total_cost_fte,
        total_cost_subcon_from_prj_res = :total_cost_subcon,
        total_cost_nonlabor_from_prj_res = :total_cost_nonlabor,

        total_effort_fte_from_prj_res = :total_effort_fte,
        total_effort_subcon_from_prj_res = :total_effort_subcon,

        total_cost_from_prj_res = :total_cost,
        total_effort_from_prj_res = :total_effort,

        total_fte_from_prj_res = :total_fte_count,
        total_subcon_from_prj_res = :total_subcon_count,
        total_nonlabor_from_prj_res = :total_nonlabor_count
      WHERE account_rid = :accountId
        AND fiscal_year = :fiscalYear
        AND LOWER(project_code) = LOWER(:projectCode)
    `;

    await this.mainDbSequelize?.query(updateQuery, {
      replacements: {
        total_cost_fte,
        total_cost_subcon,
        total_cost_nonlabor,
        total_effort_fte,
        total_effort_subcon,
        total_cost,
        total_effort,
        total_fte_count,
        total_subcon_count,
        total_nonlabor_count,
        accountId,
        fiscalYear,
        projectCode,
      },
      type: "UPDATE",
    });

    const updateEffectiveQuery = `
      UPDATE ${MAIN_SCHEMA_NAME}.project_fiscal_summary
      SET
        effective_fte_cost = :total_cost_fte,
        effective_subcon_cost = :total_cost_subcon,
        effective_nonlabor_cost = :total_cost_nonlabor,
        effective_fte_effort = :total_effort_fte,
        effective_subcon_effort = :total_effort_subcon,
        effective_cost = :total_cost,
        effective_effort = :total_effort,
        effective_total_fte = :total_fte_count,
        effective_total_subcon = :total_subcon_count,
        effective_total_nonlabor = :total_nonlabor_count
      WHERE account_rid = :accountId
        AND fiscal_year = :fiscalYear
        AND default_metric_type = 'project_resource'
        AND effective_metric_type IS NULL
        AND LOWER(project_code) = LOWER(:projectCode)
    `;

    await this.mainDbSequelize?.query(updateEffectiveQuery, {
      replacements: {
        total_cost_fte,
        total_cost_subcon,
        total_cost_nonlabor,
        total_effort_fte,
        total_effort_subcon,
        total_cost,
        total_effort,
        total_fte_count,
        total_subcon_count,
        total_nonlabor_count,
        accountId,
        fiscalYear,
        projectCode,
      },
      type: "UPDATE",
    });
  }

  async aggregatesProjectFiscalRegion(
    accountNumber: string,
    accountId: string,
    projectCode: string,
    projectId: string,
    fiscalYear: number,
    statusMap: any,
    transaction: Transaction
  ) {
    const { ProjectResource, ProjectFiscalRegion, CaseProjectFiscalRegion } = await this.getModels(
      accountNumber
    );

    // 1. Get all resource types
    const resourceTypes: any = await this.fetchResourceTypeAll();

    const resourceTypeMap: Record<string, string> = {};
    for (const rt of resourceTypes) {
      resourceTypeMap[rt.rid] = rt.resource_type_name.toLowerCase();
    }

    // 2. Aggregate by region + resource_type_rid
    const aggregates: any[] = await ProjectResource.findAll({
      attributes: [
        "ProjectResource.region_rid",
        [
          Sequelize.col("project_resource_resource.resource_type_rid"),
          "resource_type_rid",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
          "total_cost",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
          "total_effort",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("ProjectResource.rid")), "count"],
      ],
      include: [
        {
          model: Resources,
          as: "project_resource_resource",
          attributes: ["resource_type_rid"],
          required: true,
        },
      ],
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
        project_fiscal_rid: projectId,
        status_rid: {
          [Op.in]: [
            statusMap?.get("Active"),
          ].filter(Boolean) as string[],
        },
      },
      group: ["ProjectResource.region_rid", "project_resource_resource.resource_type_rid"],
      raw: true,
      transaction,
    });

    if (!aggregates || aggregates.length === 0) return;

    // 3. Group aggregates by region and update ProjectFiscal for each
    const regionGroups: any = aggregates.reduce((acc, row) => {
      const region = row.region_rid || "__UNKNOWN__";
      if (!acc[region]) acc[region] = [];
      acc[region].push(row);
      return acc;
    }, {} as Record<string, any[]>);

    for (const [region, rows] of Object.entries(regionGroups) as [
      string,
      any[]
    ][]) {
      let total_cost_fte = 0;
      let total_cost_subcon = 0;
      let total_cost_nonlabor = 0;
      let total_effort_fte = 0;
      let total_effort_subcon = 0;

      let total_fte_count = 0;
      let total_subcon_count = 0;
      let total_nonlabor_count = 0;

      for (const row of rows) {
        const typeName = resourceTypeMap[row.resource_type_rid] || "";
        const cost = Number(row.total_cost || 0);
        const effort = Number(row.total_effort || 0);
        const count = Number(row.count || 0);

        switch (typeName) {
          case "full-time":
            total_cost_fte = cost;
            total_effort_fte = effort;
            total_fte_count = count;
            break;
          case "sub con":
            total_cost_subcon = cost;
            total_effort_subcon = effort;
            total_subcon_count = count;
            break;
          case "non-labor":
            total_cost_nonlabor = cost;
            total_nonlabor_count = count;
            break;
          default:
            break;
        }
      }

      const total_cost = this.safeSum(
        total_cost_fte,
        total_cost_subcon,
        total_cost_nonlabor
      );
      const total_effort = this.safeSum(total_effort_fte, total_effort_subcon);

      // 4a. Always update base totals
      await ProjectFiscalRegion.update(
        {
          total_cost_fte_from_prj_res: total_cost_fte,
          total_cost_subcon_from_prj_res: total_cost_subcon,
          total_cost_nonlabor_from_prj_res: total_cost_nonlabor,

          total_effort_fte_from_prj_res: total_effort_fte,
          total_effort_subcon_from_prj_res: total_effort_subcon,

          total_cost_from_prj_res: total_cost,
          total_effort_from_prj_res: total_effort,

          total_fte_from_prj_res: total_fte_count,
          total_subcon_from_prj_res: total_subcon_count,
          total_nonlabor_from_prj_res: total_nonlabor_count,
        },
        {
          where: {
            account_rid: accountId,
            fiscal_year: fiscalYear,
            project_code: projectCode,
            region_rid: region,
            [Op.and]: [
              Sequelize.where(
                Sequelize.fn("LOWER", Sequelize.col("project_code")),
                Sequelize.fn("LOWER", projectCode)
              ),
            ],
          },
          transaction,
        }
      );

      // 4b. Conditionally update effective values
      await ProjectFiscalRegion.update(
        {
          effective_fte_cost: total_cost_fte,
          effective_subcon_cost: total_cost_subcon,
          effective_nonlabor_cost: total_cost_nonlabor,
          effective_fte_effort: total_effort_fte,
          effective_subcon_effort: total_effort_subcon,
          effective_cost: total_cost,
          effective_effort: total_effort,
          effective_metric_type: null,

          effective_total_fte: total_fte_count,
          effective_total_subcon: total_subcon_count,
          effective_total_nonlabor: total_nonlabor_count,
        },
        {
          where: {
            account_rid: accountId,
            fiscal_year: fiscalYear,
            project_code: projectCode,
            region_rid: region,
            default_metric_type: "project_resource",
            effective_metric_type: { [Op.is]: null },
            [Op.and]: [
              Sequelize.where(
                Sequelize.fn("LOWER", Sequelize.col("project_code")),
                Sequelize.fn("LOWER", projectCode)
              ),
            ],
          },
          transaction,
        }
      );
    }
  }

  async aggregatesCaseProjectFiscalRegion(
    accountNumber: string,
    accountId: string,
    projectCode: string,
    projectId: string,
    fiscalYear: number,
    statusMap: any,
    transaction: Transaction,
    caseMapping: any,
  ) {
    const { CaseProjectResource, CaseProjectFiscalRegion } = await this.getModels(
      accountNumber
    );

    // 1. Get all resource types
    const resourceTypes: any = await this.fetchResourceTypeAll();

    const resourceTypeMap: Record<string, string> = {};
    for (const rt of resourceTypes) {
      resourceTypeMap[rt.rid] = rt.resource_type_name.toLowerCase();
    }

    // 2. Aggregate by region + resource_type_rid
    const aggregates: any[] = await CaseProjectResource.findAll({
      attributes: [
        "region_rid",
        [
          Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
          "total_cost",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
          "total_effort",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("rid")), "count"],
      ],
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
        project_fiscal_rid: projectId,
        case_rid: caseMapping?.case_rid,
        status_rid: {
          [Op.in]: [
            statusMap?.get("Active"),
          ].filter(Boolean) as string[],
        },
      },
      group: ["region_rid"],
      raw: true,
      transaction,
    });

    if (!aggregates || aggregates.length === 0) return;

    // 3. Group aggregates by region and update ProjectFiscal for each
    const regionGroups: any = aggregates.reduce((acc, row) => {
      const region = row.region_rid || "__UNKNOWN__";
      if (!acc[region]) acc[region] = [];
      acc[region].push(row);
      return acc;
    }, {} as Record<string, any[]>);

    for (const [region, rows] of Object.entries(regionGroups) as [
      string,
      any[]
    ][]) {
      let total_cost_fte = 0;
      let total_cost_subcon = 0;
      let total_cost_nonlabor = 0;
      let total_effort_fte = 0;
      let total_effort_subcon = 0;

      let total_fte_count = 0;
      let total_subcon_count = 0;
      let total_nonlabor_count = 0;

      for (const row of rows) {
        const typeName = resourceTypeMap[row.resource_type_rid] || "";
        const cost = Number(row.total_cost || 0);
        const effort = Number(row.total_effort || 0);
        const count = Number(row.count || 0);

        switch (typeName) {
          case "full-time":
            total_cost_fte = cost;
            total_effort_fte = effort;
            total_fte_count = count;
            break;
          case "sub con":
            total_cost_subcon = cost;
            total_effort_subcon = effort;
            total_subcon_count = count;
            break;
          case "non-labor":
            total_cost_nonlabor = cost;
            total_nonlabor_count = count;
            break;
          default:
            break;
        }
      }

      const total_cost = this.safeSum(
        total_cost_fte,
        total_cost_subcon,
        total_cost_nonlabor
      );
      const total_effort = this.safeSum(total_effort_fte, total_effort_subcon);

      // 4a. Always update base totals
      await CaseProjectFiscalRegion.update(
        {
          total_cost_fte_from_prj_res: total_cost_fte,
          total_cost_subcon_from_prj_res: total_cost_subcon,
          total_cost_nonlabor_from_prj_res: total_cost_nonlabor,

          total_effort_fte_from_prj_res: total_effort_fte,
          total_effort_subcon_from_prj_res: total_effort_subcon,

          total_cost_from_prj_res: total_cost,
          total_effort_from_prj_res: total_effort,

          total_fte_from_prj_res: total_fte_count,
          total_subcon_from_prj_res: total_subcon_count,
          total_nonlabor_from_prj_res: total_nonlabor_count,
        },
        {
          where: {
            account_rid: accountId,
            fiscal_year: fiscalYear,
            project_code: projectCode,
            region_rid: region,
            case_rid: caseMapping?.case_rid,
            [Op.and]: [
              Sequelize.where(
                Sequelize.fn("LOWER", Sequelize.col("project_code")),
                Sequelize.fn("LOWER", projectCode)
              ),
            ],
          },
          transaction,
        }
      );

      // 4b. Conditionally update effective values
      await CaseProjectFiscalRegion.update(
        {
          effective_fte_cost: total_cost_fte,
          effective_subcon_cost: total_cost_subcon,
          effective_nonlabor_cost: total_cost_nonlabor,
          effective_fte_effort: total_effort_fte,
          effective_subcon_effort: total_effort_subcon,
          effective_cost: total_cost,
          effective_effort: total_effort,
          effective_metric_type: null,

          effective_total_fte: total_fte_count,
          effective_total_subcon: total_subcon_count,
          effective_total_nonlabor: total_nonlabor_count,
        },
        {
          where: {
            account_rid: accountId,
            fiscal_year: fiscalYear,
            project_code: projectCode,
            region_rid: region,
            default_metric_type: "project_resource",
            case_rid: caseMapping?.case_rid,
            effective_metric_type: { [Op.is]: null },
            [Op.and]: [
              Sequelize.where(
                Sequelize.fn("LOWER", Sequelize.col("project_code")),
                Sequelize.fn("LOWER", projectCode)
              ),
            ],
          },
          transaction,
        }
      );
    }
  }

  async aggregatesProject(
    accountNumber: string,
    accountId: string,
    projectCode: string,
    transaction: Transaction
  ) {
    const { Project, ProjectFiscal } = await this.getModels(accountNumber);

    const aggregates: any = await ProjectFiscal.findOne({
      attributes: [
        "account_rid",
        "project_rid",
        [Sequelize.fn("SUM", Sequelize.col("effective_cost")), "total_cost"],
        [
          Sequelize.fn("SUM", Sequelize.col("effective_effort")),
          "total_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("effective_total_fte")),
          "effective_total_fte",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("effective_total_subcon")),
          "effective_total_subcon",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("effective_total_nonlabor")),
          "effective_total_nonlabor",
        ],
      ],
      where: {
        account_rid: accountId,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("project_code")),
            Sequelize.fn("LOWER", projectCode)
          ),
        ],
      },
      group: ["account_rid", "project_rid"],
      raw: true,
      transaction,
    });

    if (!aggregates) {
      return;
    }

    const totalCost = Number(aggregates.total_cost || 0);
    const totalEffort = Number(aggregates.total_effort || 0);

    await Project.update(
      {
        total_cost: totalCost,
        total_effort: totalEffort,
        total_fte: aggregates.effective_total_fte || null,
        total_subcon: aggregates.effective_total_subcon || null,
      },
      {
        where: {
          account_rid: accountId,
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn("LOWER", Sequelize.col("project_code")),
              Sequelize.fn("LOWER", projectCode)
            ),
          ],
        },
        transaction,
      }
    );
  }

  async aggregatesProjectSummary(
    accountNumber: string,
    accountId: string,
    projectCode: string,
    transaction: Transaction
  ) {
    const { ProjectFiscal } = await this.getModels(accountNumber);

    const aggregates: any = await ProjectFiscal.findOne({
      attributes: [
        "account_rid",
        "project_code",
        [Sequelize.fn("SUM", Sequelize.col("effective_cost")), "total_cost"],
        [
          Sequelize.fn("SUM", Sequelize.col("effective_effort")),
          "total_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("effective_total_fte")),
          "effective_total_fte",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("effective_total_subcon")),
          "effective_total_subcon",
        ],
      ],
      where: {
        account_rid: accountId,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("project_code")),
            Sequelize.fn("LOWER", projectCode)
          ),
        ],
      },
      group: ["account_rid", "project_code"],
      raw: true,
      transaction,
    });

    if (!aggregates) {
      return;
    }

    const totalCost = Number(aggregates.total_cost || 0);
    const totalEffort = Number(aggregates.total_effort || 0);

    const totalfte = Number(aggregates.effective_total_fte || 0);
    const totalSubcon = Number(aggregates.effective_total_subcon || 0);

    const updateQuery = `
    UPDATE ${MAIN_SCHEMA_NAME}.project_summary
    SET total_cost = :totalCost,
        total_effort = :totalEffort,
        total_fte = :totalfte,
        total_subcon = :totalSubcon
    WHERE account_rid = :accountId
      AND LOWER(project_code) = LOWER(:projectCode)
  `;

    await this.mainDbSequelize?.query(updateQuery, {
      replacements: {
        totalCost,
        totalEffort,
        accountId,
        projectCode,
        totalfte,
        totalSubcon,
      },
      type: "UPDATE",
    });
  }

  async aggregatesAccountFiscal(
    accountNumber: string,
    accountId: string,
    fiscalYear: number,
    transaction: Transaction
  ) {
    const { AccountFiscal, ProjectFiscal } = await this.getModels(
      accountNumber
    );

    const aggregates: any = await ProjectFiscal.findOne({
      attributes: [
        "account_rid",
        "fiscal_year",
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.fn("DISTINCT", Sequelize.col("project_code"))
          ),
          "total_projects",
        ],
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(effective_cost, 0)")),
          "effective_cost",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(effective_effort, 0)")
          ),
          "effective_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_fte_prj, 0)")),
          "total_fte_prj",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_subcon_prj, 0)")
          ),
          "total_subcon_prj",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_effort_fte_from_prj_res, 0)")
          ),
          "effective_fte_effort",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_effort_subcon_from_prj_res, 0)")
          ),
          "effective_subcon_effort",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_cost_fte_from_prj_res, 0)")
          ),
          "effective_fte_cost",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_cost_subcon_from_prj_res, 0)")
          ),
          "effective_subcon_cost",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_cost_nonlabor_from_prj_res, 0)")
          ),
          "effective_nonlabor_cost",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(effective_total_fte, 0)")
          ),
          "effective_total_fte",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(effective_total_subcon, 0)")
          ),
          "effective_total_subcon",
        ],

        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_cost_from_prj_res, 0)")
          ),
          "total_cost_from_prj_res",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_effort_from_prj_res, 0)")
          ),
          "total_effort_from_prj_res",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_effort_fte_from_prj_res, 0)")
          ),
          "total_effort_fte_from_prj_res",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_effort_subcon_from_prj_res, 0)")
          ),
          "total_effort_subcon_from_prj_res",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_cost_fte_from_prj_res, 0)")
          ),
          "total_cost_fte_from_prj_res",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_cost_subcon_from_prj_res, 0)")
          ),
          "total_cost_subcon_from_prj_res",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_cost_nonlabor_from_prj_res, 0)")
          ),
          "total_cost_nonlabor_from_prj_res",
        ],
      ],
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
      },
      group: ["account_rid", "fiscal_year"],
      raw: true,
      transaction,
    });

    if (!aggregates) return;

    // 2. Update Account fiscal table with aggregated totals
    await AccountFiscal.update(
      {
        // total_projects: aggregates.total_projects,
        // total_project_cost: aggregates.effective_cost,
        // total_project_hours: aggregates.effective_effort,
        // total_fte: aggregates.effective_total_fte,
        // total_subcon: aggregates.effective_total_subcon,
        total_project_res_cost: aggregates.total_cost_from_prj_res,
        total_project_res_hours: aggregates.total_effort_from_prj_res,
        total_project_res_hours_fte: aggregates.total_effort_fte_from_prj_res,
        total_project_res_hours_subcon:
          aggregates.total_effort_subcon_from_prj_res,
        total_project_res_cost_fte: aggregates.total_cost_fte_from_prj_res,
        total_project_res_cost_subcon:
          aggregates.total_cost_subcon_from_prj_res,
        total_project_res_cost_nonlabor:
          aggregates.total_cost_nonlabor_from_prj_res,
      },
      {
        where: {
          account_rid: accountId,
          fiscal_year: fiscalYear,
        },
        transaction,
      }
    );
  }

  async aggregatesAccountFiscalRegion(
    accountNumber: string,
    accountId: string,
    fiscalYear: number,
    transaction: Transaction
  ) {
    const { ProjectFiscal, AccountFiscalRegion } = await this.getModels(
      accountNumber
    );

    // Step 1: Aggregate ProjectFiscal data grouped by region
    const aggregates: any[] = await ProjectFiscalRegion.findAll({
      attributes: [
        "account_rid",
        "fiscal_year",
        "region_rid",
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.fn("DISTINCT", Sequelize.col("project_code"))
          ),
          "total_projects",
        ],
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(effective_cost, 0)")),
          "effective_cost",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(effective_effort, 0)")
          ),
          "effective_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_fte_prj, 0)")),
          "total_fte_prj",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_subcon_prj, 0)")
          ),
          "total_subcon_prj",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(effective_fte_effort, 0)")
          ),
          "effective_fte_effort",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(effective_subcon_effort, 0)")
          ),
          "effective_subcon_effort",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(effective_fte_cost, 0)")
          ),
          "effective_fte_cost",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(effective_subcon_cost, 0)")
          ),
          "effective_subcon_cost",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(effective_nonlabor_cost, 0)")
          ),
          "effective_nonlabor_cost",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(effective_total_fte, 0)")
          ),
          "effective_total_fte",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(effective_total_subcon, 0)")
          ),
          "effective_total_subcon",
        ],
      ],
      where: {
        account_rid: accountId,
        fiscal_year: fiscalYear,
      },
      group: ["account_rid", "fiscal_year", "region_rid"],
      raw: true,
      transaction,
    });

    if (!aggregates || aggregates.length === 0) return;

    // Step 2: Update each region's fiscal record
    for (const row of aggregates) {
      await AccountFiscalRegion.update(
        {
          total_projects: row.total_projects,
          total_project_cost: row.effective_cost,
          total_project_hours: row.effective_effort,
          total_fte: row.effective_total_fte,
          total_subcon: row.effective_total_subcon,
          total_project_res_hours_fte: row.effective_fte_effort,
          total_project_res_hours_subcon: row.effective_subcon_effort,
          total_project_res_cost_fte: row.effective_fte_cost,
          total_project_res_cost_subcon: row.effective_subcon_cost,
          total_project_res_cost_nonlabor: row.effective_nonlabor_cost,
        },
        {
          where: {
            account_rid: accountId,
            fiscal_year: fiscalYear,
            region_rid: row.region_rid,
          },
          transaction,
        }
      );
    }
  }

  async aggregatesAccount(
    accountNumber: string,
    accountId: string,
    transaction: Transaction
  ) {
    const { AccountFiscal, Project } = await this.getModels(accountNumber);

    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.getMainSequelize();
    }

    const aggregates: any = await AccountFiscal.findOne({
      attributes: [
        "account_rid",
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_project_cost, 0)")
          ),
          "total_project_cost",
        ],
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_projects, 0)")),
          "total_projects",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_project_hours, 0)")
          ),
          "total_project_hours",
        ],
      ],
      where: {
        account_rid: accountId,
      },
      group: ["account_rid"],
      transaction,
    });

    if (!aggregates) return;

    const totalProjectCount = await Project.findAll({
      where: {
        account_rid: accountId,
      },
      transaction,
    });

    const query = `
      UPDATE ${MAIN_SCHEMA_NAME}.account
      SET total_projects = :total_projects,
          total_project_cost = :total_project_cost,
          total_project_hours = :total_project_hours
      WHERE rid = :account_rid
    `;

    await this.mainDbSequelize.query(query, {
      replacements: {
        total_projects: totalProjectCount.length,
        total_project_cost: aggregates.total_project_cost,
        total_project_hours: aggregates.total_project_hours,
        account_rid: accountId,
      },
      type: "UPDATE",
    });
  }

  async updateResourceFiscal(
    accountNumber: string,
    accountId: string,
    userId: string,
    projectResourceData: IUpdateProjectResource,
    resourceData: any,
    fiscalYear: number,
    statusMap: any,
    transaction: Transaction,
    existingProjectResource: any = {}
  ) {
    const { ProjectResource, ResourcesFiscal, Resources } =
      await this.getModels(accountNumber);

    const oldGroupKey = {
      resource_rid: existingProjectResource.resource_rid,
      fiscal_year: fiscalYear,
    };

    const newGroupKey = {
      resource_rid: resourceData.rid,
      fiscal_year: fiscalYear,
    };

    const isGroupChanged =
      oldGroupKey.resource_rid?.toLowerCase() !==
      newGroupKey.resource_rid?.toLowerCase();

    const buildGroupWhere = (groupKey: any) => ({
      account_rid: accountId,
      resource_rid: groupKey.resource_rid,
      fiscal_year: fiscalYear,
      // [Op.and]: [
      //   Sequelize.where(
      //     Sequelize.fn("LOWER", Sequelize.col("resource_code")),
      //     Sequelize.fn("LOWER", groupKey.resource_code)
      //   ),
      // ],
    });

    // 1. If group changed, update or delete old group
    if (isGroupChanged) {
      const oldAggregates: any = await ProjectResource.findOne({
        attributes: [
          "fiscal_year",
          "resource_rid",
          [
            Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
            "total_effort",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
            "total_cost",
          ],
        ],
        group: ["fiscal_year", "resource_rid"],
        where: {
          account_rid: projectResourceData.account_rid,
          resource_rid: existingProjectResource.resource_rid,
          fiscal_year: fiscalYear,
          status_rid: {
            [Op.in]: [
              statusMap?.get("Active"),
              null,
            ].filter(Boolean) as string[],
          },
          rid: { [Op.ne]: projectResourceData.project_resource_rid }, // exclude current
        },
        raw: true,
        transaction,
      });

      const oldFiscalRecord = await ResourcesFiscal.findOne({
        where: buildGroupWhere(oldGroupKey),
        transaction,
      });

      if (oldAggregates && oldFiscalRecord) {
        await ResourcesFiscal.update(
          {
            total_effort_for_year_project_resource_level:
              oldAggregates.total_effort,
            total_cost_for_year_project_resource_level:
              oldAggregates.total_cost,
          },
          {
            where: { rid: oldFiscalRecord.rid },
            transaction,
          }
        );
      } else if (oldFiscalRecord) {
        await ResourcesFiscal.destroy({
          where: { rid: oldFiscalRecord.rid },
          transaction,
        });
      }
    }

    // 2. Update or create new group
    const newAggregates: any = await ProjectResource.findOne({
      attributes: [
        "account_rid",
        "resource_rid",
        [
          Sequelize.fn("SUM", Sequelize.col("total_hours_pro_res")),
          "total_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("net_total_cost_pro_res")),
          "total_cost",
        ],
      ],
      group: ["account_rid", "resource_rid"],
      where: {
        account_rid: projectResourceData.account_rid,
        resource_rid: resourceData.rid,
        fiscal_year: fiscalYear,
        status_rid: {
          [Op.in]: [
            statusMap?.get("Active"),
          ].filter(Boolean) as string[],
        }
      },
      raw: true,
      transaction,
    });

    const newFiscalRecord = await ResourcesFiscal.findOne({
      where: buildGroupWhere(newGroupKey),
      transaction,
    });

    const resource = await Resources.findOne({
      where: {
        account_rid: projectResourceData.account_rid,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("resource_code")),
            Sequelize.fn("LOWER", projectResourceData.resource_code)
          ),
        ],
      },
      transaction,
    });

    if (newFiscalRecord) {
      if (newAggregates) {
        await ResourcesFiscal.update(
          {
            resource_code: projectResourceData.resource_code,
            account_rid: accountId,
            resource_rid: resource?.rid ?? "",
            total_effort_for_year_project_resource_level:
              newAggregates.total_effort,
            total_cost_for_year_project_resource_level: newAggregates.total_cost,
            modified_by: userId,
            modified_datetime: new Date(),
          },
          {
            where: { rid: newFiscalRecord.rid },
            transaction,
          }
        );
      }
    } else {
      if (newAggregates) {
        await ResourcesFiscal.create(
          {
            resource_code: projectResourceData.resource_code,
            account_rid: accountId,
            resource_rid: resource?.rid ?? "",
            total_effort_for_year_project_resource_level:
              newAggregates.total_effort ?? null,
            total_cost_for_year_project_resource_level:
              newAggregates.total_cost ?? null,
            fiscal_year: fiscalYear,
            created_by: userId,
            resource_type_rid: resource?.resource_type_rid || "", // need to add resource fiscal
            created_datetime: new Date(),
          },
          { transaction }
        );
      } else {
        await ResourcesFiscal.create(
          {
            resource_code: projectResourceData.resource_code,
            account_rid: accountId,
            resource_rid: resource?.rid ?? "",
            fiscal_year: fiscalYear,
            total_effort_for_year_project_resource_level:
              projectResourceData.total_hours_pro_res ?? null,
            total_cost_for_year_project_resource_level:
              projectResourceData.net_total_cost_pro_res ?? null,
            created_by: userId,
            resource_type_rid: resource?.resource_type_rid || "", // need to add resource fiscal
            created_datetime: new Date(),
          },
          { transaction }
        );
      }
    }
  }

  async updateProjectResourceRecords(
    accountNumber: string,
    projectResourceData: IUpdateProjectResource,
    userId: string,
    resourceId: string,
    projectData: any,
    stausId: string,
    transaction: Transaction
  ) {
    const { ProjectResource } = await this.getModels(accountNumber);

    const startDate = projectResourceData.start_date
      ? moment.utc(projectResourceData.start_date, "YYYY-MM-DD", true)
      : null;

    const endDate = projectResourceData.end_date
      ? moment.utc(projectResourceData.end_date, "YYYY-MM-DD", true)
      : null;

    const projectResourceCode =
      projectData.project_code + "-" + projectResourceData.resource_code;

    projectResourceData.modified_by = userId;

    const updatedAssignedRoleId = await this.checkSkillSubtype(
      projectResourceData.assigned_skill_role_type_rid,
      projectResourceData.skill_role_rid,
      projectResourceData.skill_role_others,
      userId
    );

    const updateProjectData = ProjectResourceMapper.mapToUpdateProjectResource(
      projectResourceData,
      startDate,
      endDate,
      projectResourceCode,
      resourceId,
      userId
    );

    const updateProjectResource = await ProjectResource.update(
      {
        ...updateProjectData,
        assigned_skill_role_type_rid: updatedAssignedRoleId,
        status_rid: stausId,
        project_resource_role: projectResourceData.project_resource_role ?? null
      },
      {
        where: {
          rid: projectResourceData.project_resource_rid,
        },
        transaction,
      }
    );

    return updateProjectResource;
  }

  async updateCaseProjectResourceRecords(
    accountNumber: string,
    projectResourceData: IUpdateProjectResource,
    userId: string,
    resourceId: string,
    projectData: any,
    stausId: string,
    transaction: Transaction,
    caseMapping: CaseProject
  ) {
    const { CaseProjectResource } = await this.getModels(accountNumber);

    const startDate = projectResourceData.start_date
      ? moment.utc(projectResourceData.start_date, "YYYY-MM-DD", true)
      : null;

    const endDate = projectResourceData.end_date
      ? moment.utc(projectResourceData.end_date, "YYYY-MM-DD", true)
      : null;

    const projectResourceCode =
      projectData.project_code + "-" + projectResourceData.resource_code;

    projectResourceData.modified_by = userId;

    const updatedAssignedRoleId = await this.checkSkillSubtype(
      projectResourceData.assigned_skill_role_type_rid,
      projectResourceData.skill_role_rid,
      projectResourceData.skill_role_others,
      userId
    );

    const updateProjectData = ProjectResourceMapper.mapToUpdateProjectResource(
      projectResourceData,
      startDate,
      endDate,
      projectResourceCode,
      resourceId,
      userId
    );

    const updateProjectResource = await CaseProjectResource.update(
      {
        ...updateProjectData,
        assigned_skill_role_type_rid: updatedAssignedRoleId,
        status_rid: stausId,
        project_resource_role: projectResourceData.project_resource_role ?? null
      },
      {
        where: {
          project_resource_rid: projectResourceData.project_resource_rid,
          case_rid: caseMapping.case_rid
        },
        transaction,
      }
    );

    return updateProjectResource;
  }

  async updateInlineProjectResourceRecords(
    accountNumber: string,
    projectResourceData: IUpdateInlineProjectResource,
    userId: string,
    projectData: any,
    resourceData: Resources,
    stausId: string,
    transaction: Transaction
  ) {
    const { ProjectResource } = await this.getModels(accountNumber);

    const projectResourceCode =
      projectData.project_code + "-" + projectResourceData.resource_code;

    const {
      project_resource_rid,
      account_rid,
      project_fiscal_rid,
      ...fieldsToUpdate
    } = projectResourceData;

    if (fieldsToUpdate.resource_code) {
      fieldsToUpdate.resource_rid = resourceData.rid;
    }
    fieldsToUpdate.total_hours_pro_res = fieldsToUpdate.total_hours_pro_res || null

    const updateProjectResource = await ProjectResource.update(
      {
        ...fieldsToUpdate,
        project_resource_code: projectResourceCode,
        modified_datetime: new Date(),
        modified_by: userId,
        status_rid: stausId
      },
      {
        where: {
          rid: project_resource_rid,
        },
        transaction,
      }
    );

    
    const updatedResource = await ProjectResource.findOne({
      where: { rid: project_resource_rid },
      transaction,
    });

    return updatedResource;
  }

  async updateInlineCaseProjectResourceRecords(
    accountNumber: string,
    projectResourceData: IUpdateInlineProjectResource,
    userId: string,
    projectData: any,
    resourceData: Resources,
    stausId: string,
    transaction: Transaction,
    caseMapping: CaseProject
  ) {
    const { CaseProjectResource } = await this.getModels(accountNumber);

    const projectResourceCode =
      projectData.project_code + "-" + projectResourceData.resource_code;

    const {
      project_resource_rid,
      account_rid,
      project_fiscal_rid,
      ...fieldsToUpdate
    } = projectResourceData;

    if (fieldsToUpdate.resource_code) {
      fieldsToUpdate.resource_rid = resourceData.rid;
    }
    fieldsToUpdate.total_hours_pro_res = fieldsToUpdate.total_hours_pro_res || null

    const updateProjectResource = await CaseProjectResource.update(
      {
        ...fieldsToUpdate,
        project_resource_code: projectResourceCode,
        modified_datetime: new Date(),
        modified_by: userId,
        status_rid: stausId
      },
      {
        where: {
          project_resource_rid: project_resource_rid,
          case_rid: caseMapping.case_rid
        },
        transaction,
      }
    );

    const updatedResource = await CaseProjectResource.findOne({
      where: { rid: project_resource_rid },
      transaction,
    });

    return updatedResource;
  }

  async fetchExistingProjectResource(
    accountNumber: string,
    projectId: string,
    transaction: Transaction
  ) {
    const { ProjectResource } = await this.getModels(accountNumber);

    const existingData = await ProjectResource.findOne({
      where: {
        rid: projectId,
      },
      transaction,
    });

    return existingData;
  }

  async fetchProjectResourceDetails(
    accountNumber: string,
    projectResourceId: string
  ) {
    const { ProjectResource } = await this.getModels(accountNumber);

    let projectResource = await ProjectResource.findOne({
      where: {
        rid: projectResourceId,
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

  async listProjectResourceSchema(
    accountNumber: string,
    accountId: string,
    projectId: string,
    rawFilters: Record<string, any> = {},
    filters: Record<string, any> = {},
    fiscalYear: number,
    offset: number,
    limit: number,
    order: Order,
    sortBy: string,
    sortOrder: string
  ) {
    const { ProjectResource, Resources } = await this.getModels(accountNumber);

    const whereFilters: any = {
      account_rid: accountId,
      project_fiscal_rid: projectId,
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

    let projectResource = await ProjectResource.findAll({
      order: dbOrder,
      where: {
        ...whereFilters,
      },
      include: [
        {
          model: Resources,
          attributes: [],
          required: false,
          as: "project_resource_resource",
        }
      ]
    });

    let totalCount = await ProjectResource.count({
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
    projectId: string,
    rawFilters: Record<string, any> = {},
    filters: Record<string, any> = {},
    fiscalYear: number,
    order: Order,
    sortBy: string,
    sortOrder: string,
    userId: string
  ) {
    const { ProjectResource } = await this.getModels(accountNumber);

    const whereFilters: any = {
      account_rid: accountId,
      project_fiscal_rid: projectId,
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

    let projectResource = await ProjectResource.findAll({
      order: dbOrder,
      where: {
        ...whereFilters,
      },
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
    const allowedFieldSet = new Set<string>();
    for (const field of projectResourceFields) {
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

        // Always show two decimal places
        const formattedValue = decimalValue.toFixed(2);

        // Extract just the formatted currency pattern using a dummy value
        const pattern = currency(0, {
          symbol: currency_symbol || "$",
          precision: 2,
          pattern: "! #",
          separator: ",",
          decimal: ".",
        }).format(); // e.g., "$ 0.00"

        // Format actual value manually using Decimal
        const [intPart, decPart] = formattedValue.split(".");
        const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        const formattedNumber = `${formattedInt}.${decPart}`;
        // Replace "0.00" in pattern with our real number
        return pattern.replace("0.00", formattedNumber);
      } catch (error) {
        console.error("Error formatting number:", error);
        return "-";
      }
    };

    const labelMap: Record<string, string> = {
      resource_code: "Resource Code",
      resource_name: "Resource Name",
      country_rid: "Resource Country",
      region_rid: "Resource Region",
      fiscal_year: "Fiscal Year",
      resource_type_rid: "Resource Type",
      resource_role: "Role",
      total_hours_pro_res: "Effort (Hours)",
      net_total_cost_pro_res: "Net Resource Cost",
      resource_designation: "Designation",
      qre_percent: "QRE %",
      qre_final: "QRE",
      status_rid: "Status",
      description: "Comments",
      project_resource_role: "Project Resource Role",
      r_number: "Project Resource ID"
      // "r_number": "Project Resource ID",
    };
    let exportData = projectResource.map((resource: any) => {
      const exportData: Record<string, string> = {};
      let resultMap = {
        resource_code: resource.resource_code || "-",
        resource_name: resource.resource_name || "-",
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
      };
      for (const [field, value] of Object.entries(resultMap)) {
        if (allowedFieldSet.has(field)) {
          exportData[labelMap[field]] = value;
        }
      }
      return exportData;
    });

    return exportData;
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
      let typeResult: any[] = []
      if (uniqueTypeIds.size !== 0) {
        typeResult = await this.mainDbSequelize.query(
          rawQueries.GET_RESOURCE_TYPES,
          {
            replacements: { resourceTypeRid: Array.from(uniqueTypeIds) },
            type: "SELECT",
          }
        );
      } else {
        typeResult = []
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
      "status_name"
    ];

    const matchFilter = (record: any, key: string, filter: any): boolean => {
      const value = record[key];

      // Enum field logic (exact/in list)
      if (enumFields.includes(key)) {
        if (filter.equals !== undefined) return value === filter.equals;
        if (filter.not_equals !== undefined) return value !== filter.not_equals;
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

  async listResourceCodes(
    accountNumber: string,
    accountId: string,
    projectFiscalRid: string,
    search: string
  ) {
    let schemaName = rawQueries.fetchSchemaName(accountNumber)
    const orgDb = await initOrgSequelize()
    const projectDates: any = await orgDb.query(fetchProjectById(schemaName, projectFiscalRid))
    const formattedStartDate = projectDates[0][0].project_startdate !== null ? moment(projectDates[0][0].project_startdate).format("YYYY-MM-DD") : null
    const formattedEndDate = projectDates[0][0].project_enddate !== null ? moment(projectDates[0][0].project_enddate).format("YYYY-MM-DD") : null
    let resourceCodes: any = await orgDb.query(fetchResCodesForPrjRes(schemaName, search, accountId, formattedStartDate, formattedEndDate))

    if (resourceCodes[0] && resourceCodes[0].length > 0) {
      resourceCodes[0] = await this.insertResourceTypeName(resourceCodes[0]);
    }

    return resourceCodes[0];
  }

  async listAssignedResourceCodes(
    accountNumber: string,
    accountId: string,
    projectFiscalId: string
  ) {
    const { Resources, ProjectResource } = await this.getModels(accountNumber);

    const assignedResources = await ProjectResource.findAll({
      attributes: ["resource_rid"],
      where: {
        project_fiscal_rid: projectFiscalId,
        account_rid: accountId,
      },
    });

    const resourceRids = assignedResources.map((res: any) => res.resource_rid);

    if (resourceRids.length === 0) {
      return [];
    }

    let resourceCodes = await Resources.findAll({
      attributes: ["rid", "resource_code", "resource_type_rid"],
      where: {
        rid: resourceRids,
      },
      order: [["resource_code", "ASC"]],
    });

    if (resourceCodes && resourceCodes.length > 0) {
      resourceCodes = await this.insertResourceTypeName(resourceCodes);
    }

    return resourceCodes;
  }

  async insertResourceTypeName(resourceCodes: any[]) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.getMainSequelize();
    }

    // Step 1: Extract unique resource_type_rids
    const uniqueTypeIds = [
      ...new Set(
        resourceCodes
          .map((res) => res.resource_type_rid)
          .filter((id) => id !== null && id !== undefined)
      ),
    ];

    if (uniqueTypeIds.length === 0) return resourceCodes;

    // Step 2: Query resource_type table for names
    const typeResult: any[] = await this.mainDbSequelize.query(
      rawQueries.GET_RESOURCE_TYPES,
      {
        replacements: { resourceTypeRid: uniqueTypeIds },
        type: "SELECT",
      }
    );

    // Step 3: Build lookup map
    const typeMap = new Map<string, string>();
    for (const type of typeResult) {
      typeMap.set(type.rid, type.resource_type_name);
    }

    // Step 4: Enrich resourceCodes with resource_type_name
    const enriched = resourceCodes.map((resource) => {
      const typeName = typeMap.get(resource.resource_type_rid) || null;
      return {
        ...(resource.dataValues ?? resource),
        resource_type_name: typeName,
      };
    });

    return enriched;
  }

  async listResourceSkillRoles() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.getMainSequelize();
    }

    const resourceRoles = await this.mainDbSequelize.query(
      rawQueries.fetchSkillRole(),
      {
        type: "SELECT",
      }
    );

    return resourceRoles;
  }

  async listResourceSkillRolesSubType() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.getMainSequelize();
    }

    const resourceRoles = await this.mainDbSequelize.query(
      rawQueries.fetchActiveSkillRoleSubType(),
      {
        type: "SELECT",
      }
    );

    return resourceRoles;
  }

  safeSum(...args: (number | null | undefined)[]) {
    return args.reduce<number>((sum, val) => sum + (val || 0), 0);
  }

  async fetchResourceTypeAll() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.getMainSequelize();
    }

    const results = await this.mainDbSequelize.query(
      rawQueries.fetchAllResourceTypes(),
      {
        type: "SELECT",
      }
    );

    return results;
  }

  async fetchAttachmentsByProjectResourceId(
    project_resource_rid: string
  ): Promise<any[]> {
    try {
      const sequelize = await initMainDbSequelize();

      const result = await sequelize.query(
        rawQueries.fetchAttachmentSummary(),
        {
          replacements: { project_resource_rid },
          type: "SELECT",
        }
      );

      return result;
    } catch (error) {
      errorLog(
        "Error fetching attachments",
        (error as Error).message
      );
      throw new Error("Failed to fetch attachments");
    }
  }
}
