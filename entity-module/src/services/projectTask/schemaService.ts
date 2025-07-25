import { Op, Sequelize, Transaction } from "sequelize";
import { initOrgSequelize } from "../../config/orgDataSource";
import { initMainDbSequelize } from "../../config/mainDataSource";
import {
  ProjectTask,
  setupProjectTaskSequence,
} from "../../models/projectTask";
import { ICreateProjectTask } from "../../utils/types";
import moment from "moment";
import { ProjectTaskMapper } from "../../utils/projectMapper";
import AccountDetails from "../../models/accountDetails";
import { ProjectFiscal } from "../../models/projectFiscal";
import { Resources } from "../../models/resource";
import { ProjectResourceFiscal } from "../../models/projectResourceFiscal";
import { ProjectResourceFiscalRegion } from "../../models/projectResourceFiscalRegion";
import { ResourceFiscal } from "../../models/resourceFiscal";
import { ResourceFiscalRegion } from "../../models/resourceFiscalRegion";
import {
  ProjectTaskTimeline,
  setupProjectTaskTimelineSeq,
} from "../../models/projectTaskTimeline";
import { ProjectResource } from "../../models/projectResource";
import { MAIN_SCHEMA_NAME } from "../../utils/constants";
import { ProjectFiscalRegion } from "../../models/projectFiscalRegion";
import { Project } from "../../models/project";
import { AccountFiscal } from "../../models/accountFiscal";
import { AccountFiscalRegion } from "../../models/accountFiscalRegion";

export class ProjectTaskSchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;

  private modelCache: Map<
    string,
    {
      AccountFiscal: ReturnType<typeof AccountFiscal.initialize>;
      AccountFiscalRegion: ReturnType<typeof AccountFiscalRegion.initialize>;
      Project: ReturnType<typeof Project.initialize>;
      ProjectFiscal: ReturnType<typeof ProjectFiscal.initialize>;
      ProjectFiscalRegion: ReturnType<typeof ProjectFiscalRegion.initialize>;
      ProjectTask: ReturnType<typeof ProjectTask.initialize>;
      ProjectTaskTimeline: ReturnType<typeof ProjectTaskTimeline.initialize>;
      ProjectResource: ReturnType<typeof ProjectResource.initialize>;
      ProjectResourceFiscal: ReturnType<
        typeof ProjectResourceFiscal.initialize
      >;
      ProjectResourceFiscalRegion: ReturnType<
        typeof ProjectResourceFiscalRegion.initialize
      >;
      Resources: ReturnType<typeof Resources.initialize>;
      ResourceFiscal: ReturnType<typeof ResourceFiscal.initialize>;
      ResourceFiscalRegion: ReturnType<typeof ResourceFiscalRegion.initialize>;
    }
  > = new Map();

  constructor() {}

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
    const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;

    const sequelize = await this.getSequelize();
    this.mainDbSequelize = await this.getMainSequelize();

    const AccountDetailsModel = AccountDetails.initialize(
      sequelize,
      schemaName
    );
    const AccountFiscalModel = AccountFiscal.initialize(sequelize, schemaName);
    const AccountFiscalRegionModel = AccountFiscalRegion.initialize(
      sequelize,
      schemaName
    );

    const ProjectModel = Project.initialize(sequelize, schemaName);
    const ProjectFiscalModel = ProjectFiscal.initialize(sequelize, schemaName);
    const ProjectFiscalRegionModel = ProjectFiscalRegion.initialize(
      sequelize,
      schemaName
    );

    const ResourceModel = Resources.initialize(sequelize, schemaName);

    const ProjectTaskModel = await ProjectTask.initialize(
      sequelize,
      schemaName
    );
    const ProjectTaskTimelineModel = await ProjectTaskTimeline.initialize(
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

    const ResourcesModel = await Resources.initialize(sequelize, schemaName);
    const ResourcesFiscalModel = await ResourceFiscal.initialize(
      sequelize,
      schemaName
    );
    const ResourceFiscalRegionModel = await ResourceFiscalRegion.initialize(
      sequelize,
      schemaName
    );

    ProjectTaskModel.belongsTo(AccountDetailsModel, {
      foreignKey: "account_rid",
      targetKey: "account_rid",
      as: "account",
    });

    ProjectTaskModel.belongsTo(ProjectFiscalModel, {
      foreignKey: "project_fiscal_rid",
      targetKey: "rid",
      as: "project",
    });

    ProjectTaskModel.belongsTo(ResourceModel, {
      foreignKey: "resource_rid",
      targetKey: "rid",
      as: "resource",
    });

    const models = {
      ProjectTask: ProjectTaskModel,
      ProjectResourceFiscal: ProjectResourceFiscalModel,
      ProjectResourceFiscalRegion: ProjectResourceFiscalRegionModel,
      ResourceFiscal: ResourcesFiscalModel,
      ResourceFiscalRegion: ResourceFiscalRegionModel,
      ProjectTaskTimeline: ProjectTaskTimelineModel,
      ProjectResource: ProjectResourceModel,
      ProjectFiscal: ProjectFiscalModel,
      Resources: ResourcesModel,
      ProjectFiscalRegion: ProjectFiscalRegionModel,
      Project: ProjectModel,
      AccountFiscal: AccountFiscalModel,
      AccountFiscalRegion: AccountFiscalRegionModel,
    };
    this.modelCache.set(schemaName, models);
    return models;
  }

  async createProjectTaskTables(accountNumber: string) {
    const { ProjectTask, ProjectTaskTimeline } = await this.getModels(
      accountNumber
    );
    try {
      await ProjectTask.sync({ force: false });
      await ProjectTaskTimeline.sync({ force: false });
      if (this.orgDbSequelize) {
        const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;
        await setupProjectTaskSequence(this.orgDbSequelize, schemaName);
        await setupProjectTaskTimelineSeq(this.orgDbSequelize, schemaName);
      }
    } catch (err) {
      throw new Error("Error creating project resources table");
    }
  }

  async getExistingEffortInProjectTask(
    accountNumber: string,
    projectTaskData: ICreateProjectTask,
    resourceId: string
  ): Promise<ProjectTask[]> {
    const { ProjectTask } = await this.getModels(accountNumber);

    const startDate = projectTaskData.start_date
      ? moment.utc(projectTaskData.start_date, "YYYY-MM-DD")
      : null;
    const endDate = projectTaskData.end_date
      ? moment.utc(projectTaskData.end_date, "YYYY-MM-DD")
      : null;

    const whereClause: any = {
      project_fiscal_rid: projectTaskData.project_fiscal_rid,
      account_rid: projectTaskData.account_rid,
      resource_rid: resourceId,
    };

    if (startDate) whereClause.start_date = { [Op.lte]: endDate };
    if (endDate) whereClause.end_date = { [Op.gte]: startDate };

    const existingTasks = await ProjectTask.findAll(whereClause);
    return existingTasks;
  }

  async addProjectTask(
    accountNumber: string,
    projectTaskData: ICreateProjectTask,
    userId: string,
    projectData: ProjectFiscal,
    resourceData: Resources,
    transaction: Transaction
  ) {
    const { ProjectTask } = await this.getModels(accountNumber);

    const startDate = projectTaskData.start_date
      ? moment.utc(projectTaskData.start_date, "YYYY-MM-DD")
      : null;
    const endDate = projectTaskData.end_date
      ? moment.utc(projectTaskData.end_date, "YYYY-MM-DD")
      : null;

    const projectResourceCode =
      projectData.project_code + "-" + resourceData.resource_code;

    const baseData = ProjectTaskMapper.mapToProjectTask(
      projectTaskData,
      startDate,
      endDate,
      userId,
      projectResourceCode,
      projectData,
      resourceData
    );

    const createdProjectResource = await ProjectTask.create(baseData, {
      transaction,
    });

    return createdProjectResource;
  }

  async addProjectTaskTimeline(
    accountNumber: string,
    eventName: string,
    projectTaskData: ICreateProjectTask,
    projectTaskId: string,
    userId: string,
    transaction: Transaction
  ) {
    try {
      const { ProjectTaskTimeline } = await this.getModels(accountNumber);

      await ProjectTaskTimeline.create(
        {
          account_rid: projectTaskData.account_rid,
          event_name: eventName,
          event_status: "success",
          event_type: "ui handler",
          entity_rid: projectTaskId,
          created_by: userId,
          event_datetime: new Date(),
          created_datetime: new Date(),
        },
        {
          transaction,
        }
      );
    } catch (err) {
      console.log("Error addinng timelne", err);
      throw new Error("Error creating project resource timline");
    }
  }

  async startAggregation(
    accountNumber: string,
    projectTaskData: ICreateProjectTask,
    projectData: ProjectFiscal,
    resourceData: Resources,
    fiscalYear: number,
    resourceId: string,
    userId: string,
    transaction: Transaction
  ) {
    // project resources
    await this.addProjectResource(
      accountNumber,
      projectTaskData,
      projectData,
      resourceData,
      fiscalYear,
      resourceId,
      userId,
      transaction
    );
    await this.aggregateProjectResourceFiscal(
      accountNumber,
      projectTaskData,
      projectData,
      fiscalYear,
      resourceId,
      userId,
      transaction
    );
    await this.aggregateProjectResourceFiscalRegion(
      accountNumber,
      projectTaskData,
      projectData,
      fiscalYear,
      resourceId,
      userId,
      transaction
    );

    // resources
    await this.aggregateResourceFiscal(
      accountNumber,
      projectTaskData,
      resourceData,
      fiscalYear,
      resourceId,
      userId,
      transaction
    );
    await this.aggregateResourceFiscalRegion(
      accountNumber,
      projectTaskData,
      resourceData,
      fiscalYear,
      resourceId,
      userId,
      transaction
    );

    // project
    await this.aggregateProjectFiscal(
      accountNumber,
      projectTaskData,
      fiscalYear,
      transaction
    );
    await this.aggregateProjectFiscalRegion(
      accountNumber,
      projectTaskData,
      projectData,
      fiscalYear,
      userId,
      transaction
    );
    // await this.aggregateProject(
    //   accountNumber,
    //   projectTaskData,
    //   projectData,
    //   transaction
    // );

    // account module
    await this.aggregateAccountFiscal(
      accountNumber,
      projectTaskData.account_rid,
      fiscalYear,
      transaction
    );
    await this.aggregatesAccountFiscalRegion(
      accountNumber,
      projectTaskData.account_rid,
      fiscalYear,
      transaction
    );
  }

  async addProjectResource(
    accountNumber: string,
    projectTaskData: ICreateProjectTask,
    projectData: ProjectFiscal,
    resourceData: Resources,
    fiscalYear: number,
    resourceId: string,
    userId: string,
    transaction: Transaction
  ) {
    const { ProjectResource } = await this.getModels(accountNumber);
    const { project_fiscal_rid, account_rid } = projectTaskData;

    const projectResourceCode =
      projectData.project_code + "-" + resourceData.resource_code;

    const startDate = projectTaskData.start_date
      ? moment.utc(projectTaskData.start_date, "YYYY-MM-DD")
      : null;
    const endDate = projectTaskData.end_date
      ? moment.utc(projectTaskData.end_date, "YYYY-MM-DD")
      : null;

    await ProjectResource.findOrCreate({
      where: {
        account_rid,
        project_fiscal_rid: project_fiscal_rid,
        resource_rid: resourceId,
      },
      defaults: {
        account_rid,
        project_rid: projectData.project_rid,
        project_fiscal_rid: projectTaskData.project_fiscal_rid,
        resource_rid: resourceId,
        fiscal_year: fiscalYear,
        currency_rid: projectTaskData.currency_rid || null,
        country_rid: projectTaskData.country_rid || null,
        region_rid: projectTaskData.region_rid || null,
        start_date: startDate ? startDate.toDate() : null,
        end_date: endDate ? endDate.toDate() : null,
        created_by: userId,
        description: projectTaskData.comments || null,
        project_resource_code: projectResourceCode,
        created_datetime: new Date(),
      },
      transaction,
    });
  }

  async aggregateProjectResourceFiscal(
    accountNumber: string,
    projectTaskData: ICreateProjectTask,
    projectData: ProjectFiscal,
    fiscalYear: number,
    resourceId: string,
    userId: string,
    transaction: Transaction
  ) {
    const { ProjectTask, ProjectResourceFiscal } = await this.getModels(
      accountNumber
    );
    const { project_fiscal_rid, account_rid } = projectTaskData;

    const aggregated: any = await ProjectTask.findOne({
      attributes: [
        "fiscal_year",
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_hours_pro_task"), "DECIMAL")
          ),
          "total_effort",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_cost_pro_task"), "DECIMAL")
          ),
          "total_cost",
        ],
      ],
      where: {
        project_fiscal_rid: project_fiscal_rid,
        account_rid,
        resource_rid: resourceId,
        fiscal_year: fiscalYear,
      },
      group: ["fiscal_year"],
      raw: true,
      transaction,
    });

    if (aggregated) {
      const { total_effort, total_cost } = aggregated;

      const [fiscalEntry, created] = await ProjectResourceFiscal.findOrCreate({
        where: {
          project_fiscal_rid: project_fiscal_rid,
          account_rid,
          resource_rid: resourceId,
          fiscal_year: fiscalYear,
        },
        defaults: {
          account_rid,
          project_rid: projectData.project_rid,
          project_fiscal_rid: project_fiscal_rid,
          resource_rid: resourceId,
          fiscal_year: fiscalYear,
          created_by: userId,
          country_rid: projectTaskData.country_rid || null,
          currency_rid: projectTaskData.currency_rid || null,
          region_rid: projectTaskData.region_rid || null,
          project_resource_rid: "", // need to remove in the db
          created_datetime: new Date(),
          total_hours_from_tasks: total_effort || null,
          total_cost_from_tasks: total_cost || null,
        },
        transaction,
      });

      if (!created) {
        await fiscalEntry.update(
          {
            total_hours_from_tasks: total_effort || null,
            total_cost_from_tasks: total_cost || null,
          },
          {
            transaction,
          }
        );
      }
    }
  }

  async aggregateProjectResourceFiscalRegion(
    accountNumber: string,
    projectTaskData: ICreateProjectTask,
    projectData: ProjectFiscal,
    fiscalYear: number,
    resourceId: string,
    userId: string,
    transaction: Transaction
  ) {
    const { ProjectTask, ProjectResourceFiscalRegion } = await this.getModels(
      accountNumber
    );
    const { project_fiscal_rid, account_rid, region_rid } = projectTaskData;

    const aggregated: any = await ProjectTask.findOne({
      attributes: [
        "fiscal_year",
        "region_rid",
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_hours_pro_task"), "DECIMAL")
          ),
          "total_effort",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_cost_pro_task"), "DECIMAL")
          ),
          "total_cost",
        ],
      ],
      where: {
        project_fiscal_rid,
        account_rid,
        resource_rid: resourceId,
        fiscal_year: fiscalYear,
        region_rid,
      },
      group: ["fiscal_year", "region_rid"],
      raw: true,
      transaction,
    });

    if (aggregated) {
      const { total_effort, total_cost } = aggregated;

      const [fiscalRegionEntry, created] =
        await ProjectResourceFiscalRegion.findOrCreate({
          where: {
            project_fiscal_rid,
            account_rid,
            resource_rid: resourceId,
            fiscal_year: fiscalYear,
            region_rid,
          },
          defaults: {
            account_rid,
            project_rid: projectData.project_rid,
            project_fiscal_rid,
            resource_rid: resourceId,
            country_rid: projectTaskData.country_rid || null,
            currency_rid: projectTaskData.currency_rid || null,
            region_rid: projectTaskData.region_rid || null,
            created_by: userId,
            created_datetime: new Date(),
            fiscal_year: fiscalYear,
            total_hours_from_tasks: total_effort || null,
            total_cost_from_tasks: total_cost || null,
          },
          transaction,
        });

      if (!created) {
        // If already existed, just update the fields
        await fiscalRegionEntry.update(
          {
            total_hours_from_tasks: total_effort || null,
            total_cost_from_tasks: total_cost || null,
          },
          {
            transaction,
          }
        );
      }
    }
  }

  async aggregateResourceFiscal(
    accountNumber: string,
    projectTaskData: ICreateProjectTask,
    resourceData: Resources,
    fiscalYear: number,
    resourceId: string,
    userId: string,
    transaction: Transaction
  ) {
    const { ProjectTask, ResourceFiscal } = await this.getModels(accountNumber);
    const { account_rid } = projectTaskData;

    const aggregated: any = await ProjectTask.findOne({
      attributes: [
        "fiscal_year",
        "resource_rid",
        "account_rid",
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_hours_pro_task"), "DECIMAL")
          ),
          "total_effort",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_cost_pro_task"), "DECIMAL")
          ),
          "total_cost",
        ],
      ],
      where: {
        account_rid,
        resource_rid: resourceId,
        fiscal_year: fiscalYear,
      },
      group: ["fiscal_year", "resource_rid", "account_rid"],
      raw: true,
      transaction,
    });

    if (aggregated) {
      const { total_effort, total_cost } = aggregated;

      const [resourceFiscalEntry, created] = await ResourceFiscal.findOrCreate({
        where: {
          account_rid,
          resource_rid: resourceId,
        },
        defaults: {
          account_rid,
          resource_rid: resourceId,
          fiscal_year: fiscalYear,
          country_region_rid: projectTaskData.region_rid || null,
          country_rid: projectTaskData.country_rid || null,
          resource_type_rid: resourceData.resource_type_rid,
          resource_code: resourceData.resource_code,
          created_by: userId,
          created_datetime: new Date(),
          total_effort_for_year_project_task_level: total_effort || null,
          total_cost_for_year_project_task_level: total_cost || null,
        },
        transaction,
      });

      if (!created) {
        await resourceFiscalEntry.update(
          {
            total_effort_for_year_project_task_level: total_effort || null,
            total_cost_for_year_project_task_level: total_cost || null,
          },
          { transaction }
        );
      }
    }
  }

  async aggregateResourceFiscalRegion(
    accountNumber: string,
    projectTaskData: ICreateProjectTask,
    resourceData: Resources,
    fiscalYear: number,
    resourceId: string,
    userId: string,
    transaction: Transaction
  ) {
    const { ProjectTask, ResourceFiscalRegion } = await this.getModels(
      accountNumber
    );
    const { account_rid } = projectTaskData;

    const aggregated: any = await ProjectTask.findOne({
      attributes: [
        "fiscal_year",
        "resource_rid",
        "account_rid",
        "region_rid",
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_hours_pro_task"), "DECIMAL")
          ),
          "total_effort",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_cost_pro_task"), "DECIMAL")
          ),
          "total_cost",
        ],
      ],
      where: {
        account_rid,
        resource_rid: resourceId,
        fiscal_year: fiscalYear,
        region_rid: projectTaskData.region_rid,
      },
      group: ["fiscal_year", "resource_rid", "account_rid", "region_rid"],
      raw: true,
      transaction,
    });

    if (aggregated) {
      const { total_effort, total_cost } = aggregated;

      const [resourceFiscalRegionEntry, created] =
        await ResourceFiscalRegion.findOrCreate({
          where: {
            account_rid,
            resource_rid: resourceId,
            country_region_rid: projectTaskData.region_rid,
          },
          defaults: {
            account_rid,
            resource_rid: resourceId,
            fiscal_year: fiscalYear,
            country_region_rid: projectTaskData.region_rid || null,
            country_rid: projectTaskData.country_rid || null,
            resource_type_rid: resourceData.resource_type_rid,
            resource_code: resourceData.resource_code,
            created_by: userId,
            created_datetime: new Date(),
            total_effort_for_year_project_task_level: total_effort || null,
            total_cost_for_year_project_task_level: total_cost || null,
          },
          transaction,
        });

      if (!created) {
        await resourceFiscalRegionEntry.update(
          {
            total_effort_for_year_project_task_level: total_effort || null,
            total_cost_for_year_project_task_level: total_cost || null,
          },
          { transaction }
        );
      }
    }
  }

  async aggregateProjectFiscal(
    accountNumber: string,
    projectTaskData: ICreateProjectTask,
    fiscalYear: number,
    transaction: Transaction
  ) {
    const { ProjectTask, ProjectFiscal, Resources } = await this.getModels(
      accountNumber
    );
    const { account_rid, project_fiscal_rid } = projectTaskData;

    const totalAggregate: any = await ProjectTask.findOne({
      attributes: [
        "fiscal_year",
        "account_rid",
        "project_fiscal_rid",
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_hours_pro_task"), "DECIMAL")
          ),
          "total_effort",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_cost_pro_task"), "DECIMAL")
          ),
          "total_cost",
        ],
      ],
      where: {
        account_rid,
        fiscal_year: fiscalYear,
        project_fiscal_rid,
      },
      group: ["fiscal_year", "account_rid", "project_fiscal_rid"],
      raw: true,
      transaction,
    });

    const byTypeAggregates: any[] = await ProjectTask.findAll({
      attributes: [
        [Sequelize.col("resource.resource_type_rid"), "resource_type_rid"],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_hours_pro_task"), "DECIMAL")
          ),
          "total_effort",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_cost_pro_task"), "DECIMAL")
          ),
          "total_cost",
        ],
      ],
      include: [
        {
          model: Resources,
          as: "resource",
          attributes: ["resource_type_rid"],
          required: true,
        },
      ],
      where: {
        account_rid,
        fiscal_year: fiscalYear,
        project_fiscal_rid,
      },
      group: ["resource.resource_type_rid"],
      raw: true,
      transaction,
    });

    // Initialize
    let total_effort_fte_from_tasks = null;
    let total_cost_fte_from_tasks = null;
    let total_effort_subcon_from_tasks = null;
    let total_cost_subcon_from_tasks = null;

    for (const row of byTypeAggregates) {
      const resourceTypeId = row.resource_type_rid;
      if (!resourceTypeId) continue;

      const [resourceType]: any = await this.fetchResourceType(resourceTypeId);
      const typeName = resourceType?.resource_type_name?.toLowerCase();

      if (!typeName) continue;

      if (typeName === "full-time") {
        total_effort_fte_from_tasks = row.total_effort;
        total_cost_fte_from_tasks = row.total_cost;
      } else if (typeName === "sub con") {
        total_effort_subcon_from_tasks = row.total_effort;
        total_cost_subcon_from_tasks = row.total_cost;
      }
    }

    if (totalAggregate) {
      const { total_effort, total_cost } = totalAggregate;

      await ProjectFiscal.update(
        {
          total_cost_from_tasks: total_cost || null,
          total_effort_from_tasks: total_effort || null,
          total_cost_fte_from_tasks,
          total_cost_subcon_from_tasks,
          total_effort_fte_from_tasks,
          total_effort_subcon_from_tasks,
        },
        {
          where: {
            account_rid,
            fiscal_year: fiscalYear,
            rid: project_fiscal_rid,
          },
          transaction,
        }
      );
    }
  }

  async aggregateProjectFiscalRegion(
    accountNumber: string,
    projectTaskData: ICreateProjectTask,
    projectData: ProjectFiscal,
    fiscalYear: number,
    userId: string,
    transaction: Transaction
  ) {
    const { ProjectTask, ProjectFiscalRegion, Resources } =
      await this.getModels(accountNumber);
    const { account_rid, project_fiscal_rid, region_rid } = projectTaskData;

    const totalAggregate: any = await ProjectTask.findOne({
      attributes: [
        "fiscal_year",
        "account_rid",
        "project_fiscal_rid",
        "region_rid",
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_hours_pro_task"), "DECIMAL")
          ),
          "total_effort",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_cost_pro_task"), "DECIMAL")
          ),
          "total_cost",
        ],
      ],
      where: {
        account_rid,
        fiscal_year: fiscalYear,
        project_fiscal_rid,
        region_rid,
      },
      group: ["fiscal_year", "account_rid", "project_fiscal_rid", "region_rid"],
      raw: true,
      transaction,
    });

    const byTypeAggregates: any[] = await ProjectTask.findAll({
      attributes: [
        [Sequelize.col("resource.resource_type_rid"), "resource_type_rid"],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_hours_pro_task"), "DECIMAL")
          ),
          "total_effort",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_cost_pro_task"), "DECIMAL")
          ),
          "total_cost",
        ],
      ],
      include: [
        {
          model: Resources,
          as: "resource",
          attributes: ["resource_type_rid"], // 👈 prevent extra joins causing GROUP BY issues
          required: true,
        },
      ],
      where: {
        account_rid,
        fiscal_year: fiscalYear,
        project_fiscal_rid,
        region_rid, // 👈 make sure it's scoped to the region
      },
      group: ["resource.resource_type_rid", "ProjectTask.region_rid"], // 👈 must include region_rid
      raw: true,
      transaction,
    });

    // Aggregate manually in case multiple rows per resource type
    let total_effort_fte_from_tasks: number | null = 0;
    let total_cost_fte_from_tasks: number | null = 0;
    let total_effort_subcon_from_tasks: number | null = 0;
    let total_cost_subcon_from_tasks: number | null = 0;

    for (const row of byTypeAggregates) {
      const resourceTypeId = row.resource_type_rid;
      if (!resourceTypeId) continue;

      const [resourceType]: any = await this.fetchResourceType(resourceTypeId);
      const typeName = resourceType?.resource_type_name?.toLowerCase();
      if (!typeName) continue;

      const effort = parseFloat(row.total_effort || 0);
      const cost = parseFloat(row.total_cost || 0);

      if (typeName === "full-time") {
        total_effort_fte_from_tasks += effort;
        total_cost_fte_from_tasks += cost;
      } else if (typeName === "sub con") {
        total_effort_subcon_from_tasks += effort;
        total_cost_subcon_from_tasks += cost;
      }
    }

    // Convert zeros to nulls (optional, based on your logic)
    if (total_effort_fte_from_tasks === 0) total_effort_fte_from_tasks = null;
    if (total_cost_fte_from_tasks === 0) total_cost_fte_from_tasks = null;
    if (total_effort_subcon_from_tasks === 0)
      total_effort_subcon_from_tasks = null;
    if (total_cost_subcon_from_tasks === 0) total_cost_subcon_from_tasks = null;

    if (totalAggregate) {
      const { total_effort, total_cost } = totalAggregate;

      const existingRegion = await ProjectFiscalRegion.findOne({
        where: {
          account_rid,
          fiscal_year: fiscalYear,
          project_rid: projectData.project_rid, ///need to handle this
          region_rid,
        },
        transaction,
      });

      // Step 2: Insert if missing
      if (!existingRegion) {
        await ProjectFiscalRegion.create(
          {
            account_rid,
            fiscal_year: fiscalYear,
            project_code: projectData.project_code,
            project_rid: projectData.project_rid,
            project_fiscal_rid: projectData.rid,
            project_type_rid: projectData.project_type_rid,
            region_rid,
            total_cost_from_tasks: total_cost || null,
            total_effort_from_tasks: total_effort || null,
            total_cost_fte_from_tasks,
            total_cost_subcon_from_tasks,
            total_effort_fte_from_tasks,
            total_effort_subcon_from_tasks,
            created_by: userId,
            created_datetime: new Date(),
            max_ai_interaction: 0,
            auto_send_ai_interaction: false,
            comments: projectData.comments || null,
            program_name: projectData.program_name || null,
            project_startdate: projectData.project_startdate || null,
            project_enddate: projectData.project_enddate || null,
            project_group: projectData.project_group || null,
            project_classification_rid:
              projectData.project_classification_rid || null,
            project_classification_other:
              projectData.project_classification_other || null,
            project_client_group: projectData.project_client_group || null,
            project_description: projectData.project_description || null,
            status_rid: projectData.status_rid || "",
          },
          { transaction }
        );
      } else {
        // Step 3: Update if exists
        await ProjectFiscalRegion.update(
          {
            total_cost_from_tasks: total_cost || null,
            total_effort_from_tasks: total_effort || null,
            total_cost_fte_from_tasks,
            total_cost_subcon_from_tasks,
            total_effort_fte_from_tasks,
            total_effort_subcon_from_tasks,
          },
          {
            where: {
              account_rid,
              fiscal_year: fiscalYear,
              project_rid: projectData.project_rid,
              region_rid,
            },
            transaction,
          }
        );
      }
    }
  }

  async aggregateProject(
    accountNumber: string,
    projectTaskData: ICreateProjectTask,
    projectData: ProjectFiscal,
    transaction: Transaction
  ) {
    const { ProjectFiscal, Project } = await this.getModels(accountNumber);
    const { account_rid } = projectTaskData;
    const { project_rid } = projectData;

    console.log("Entity IDS", project_rid, account_rid);

    // Aggregate from project_fiscal
    const fiscalAggregates: any = await ProjectFiscal.findOne({
      attributes: [
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(
              Sequelize.col("total_effort_fte_from_tasks"),
              "DECIMAL"
            )
          ),
          "total_project_task_hours_fte",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(
              Sequelize.col("total_cost_fte_from_tasks"),
              "DECIMAL"
            )
          ),
          "total_project_task_cost_fte",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(
              Sequelize.col("total_effort_subcon_from_tasks"),
              "DECIMAL"
            )
          ),
          "total_project_task_hours_subcon",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(
              Sequelize.col("total_cost_subcon_from_tasks"),
              "DECIMAL"
            )
          ),
          "total_project_task_cost_subcon",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_effort_from_tasks"), "DECIMAL")
          ),
          "total_effort_from_tasks",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_cost_from_tasks"), "DECIMAL")
          ),
          "total_cost_from_tasks",
        ],
      ],
      where: {
        account_rid,
        project_rid,
      },
      raw: true,
      transaction,
    });

    // Convert string → float, and 0 → null
    const parseValue = (val: any) => {
      const num = parseFloat(val);
      return isNaN(num) || num === 0 ? null : num;
    };

    const total_project_task_hours_fte = parseValue(
      fiscalAggregates.total_project_task_hours_fte
    );
    const total_project_task_cost_fte = parseValue(
      fiscalAggregates.total_project_task_cost_fte
    );
    const total_project_task_hours_subcon = parseValue(
      fiscalAggregates.total_project_task_hours_subcon
    );
    const total_project_task_cost_subcon = parseValue(
      fiscalAggregates.total_project_task_cost_subcon
    );

    const total_project_task_hours = parseValue(
      fiscalAggregates.total_effort_from_tasks
    );
    const total_project_task_cost = parseValue(
      fiscalAggregates.total_cost_from_tasks
    );

    // Update project
    // await Project.update(
    //   {
    //     total_project_task_hours,
    //     total_project_task_cost,
    //     total_project_task_hours_fte,
    //     total_project_task_cost_fte,
    //     total_project_task_hours_subcon,
    //     total_project_task_cost_subcon,
    //   },
    //   {
    //     where: {
    //       account_rid,
    //       rid: project_rid,
    //     },
    //     transaction,
    //   }
    // );
  }

  async aggregateAccountFiscal(
    accountNumber: string,
    account_rid: string,
    fiscalYear: number,
    transaction: Transaction
  ) {
    const { ProjectFiscal, AccountFiscal } = await this.getModels(
      accountNumber
    );

    const projectAggregates: any = await ProjectFiscal.findOne({
      attributes: [
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_effort_from_tasks"), "DECIMAL")
          ),
          "total_project_task_hours",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(Sequelize.col("total_cost_from_tasks"), "DECIMAL")
          ),
          "total_project_task_cost",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(
              Sequelize.col("total_effort_fte_from_tasks"),
              "DECIMAL"
            )
          ),
          "total_project_task_hours_fte",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(
              Sequelize.col("total_cost_fte_from_tasks"),
              "DECIMAL"
            )
          ),
          "total_project_task_cost_fte",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(
              Sequelize.col("total_effort_subcon_from_tasks"),
              "DECIMAL"
            )
          ),
          "total_project_task_hours_subcon",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.cast(
              Sequelize.col("total_cost_subcon_from_tasks"),
              "DECIMAL"
            )
          ),
          "total_project_task_cost_subcon",
        ],
      ],
      where: {
        account_rid,
        fiscal_year: fiscalYear,
      },
      raw: true,
      transaction,
    });

    const parseValue = (val: any) => {
      const num = parseFloat(val);
      return isNaN(num) || num === 0 ? null : num;
    };

    const updatePayload = {
      total_project_task_hours: parseValue(
        projectAggregates.total_project_task_hours
      ),
      total_project_task_cost: parseValue(
        projectAggregates.total_project_task_cost
      ),
      total_project_task_hours_fte: parseValue(
        projectAggregates.total_project_task_hours_fte
      ),
      total_project_task_cost_fte: parseValue(
        projectAggregates.total_project_task_cost_fte
      ),
      total_project_task_hours_subcon: parseValue(
        projectAggregates.total_project_task_hours_subcon
      ),
      total_project_task_cost_subcon: parseValue(
        projectAggregates.total_project_task_cost_subcon
      ),
    };

    await AccountFiscal.update(updatePayload, {
      where: {
        account_rid,
        fiscal_year: fiscalYear,
      },
      transaction,
    });
  }

  async aggregatesAccountFiscalRegion(
    accountNumber: string,
    account_rid: string,
    fiscalYear: number,
    transaction: Transaction
  ) {
    const { ProjectFiscalRegion, AccountFiscalRegion } = await this.getModels(
      accountNumber
    );

    // Step 1: Get all distinct region_rid values from ProjectFiscalRegion
    const regions: ProjectFiscalRegion[] = await ProjectFiscalRegion.findAll(
      {
        attributes: [[Sequelize.col("region_rid"), "region_rid"]],
        where: {
          account_rid,
          fiscal_year: fiscalYear,
        },
        group: ["region_rid"],
        raw: true,
        transaction,
      }
    );

    for (const { region_rid } of regions) {
      // Step 2: Ensure AccountFiscalRegion exists for region
      const [fiscalRegionRecord, created] =
        await AccountFiscalRegion.findOrCreate({
          where: {
            account_rid,
            fiscal_year: fiscalYear,
            region_rid,
          },
          defaults: {
            created_by: "",
            created_datetime: new Date(),
            account_rid,
            fiscal_year: fiscalYear,
          },
          transaction,
        });

      // Step 3: Aggregate data for the specific region
      const aggregates: any = await ProjectFiscalRegion.findOne({
        attributes: [
          [
            Sequelize.fn(
              "SUM",
              Sequelize.cast(
                Sequelize.col("total_effort_from_tasks"),
                "DECIMAL"
              )
            ),
            "total_project_task_hours",
          ],
          [
            Sequelize.fn(
              "SUM",
              Sequelize.cast(Sequelize.col("total_cost_from_tasks"), "DECIMAL")
            ),
            "total_project_task_cost",
          ],
          [
            Sequelize.fn(
              "SUM",
              Sequelize.cast(
                Sequelize.col("total_effort_fte_from_tasks"),
                "DECIMAL"
              )
            ),
            "total_project_task_hours_fte",
          ],
          [
            Sequelize.fn(
              "SUM",
              Sequelize.cast(
                Sequelize.col("total_cost_fte_from_tasks"),
                "DECIMAL"
              )
            ),
            "total_project_task_cost_fte",
          ],
          [
            Sequelize.fn(
              "SUM",
              Sequelize.cast(
                Sequelize.col("total_effort_subcon_from_tasks"),
                "DECIMAL"
              )
            ),
            "total_project_task_hours_subcon",
          ],
          [
            Sequelize.fn(
              "SUM",
              Sequelize.cast(
                Sequelize.col("total_cost_subcon_from_tasks"),
                "DECIMAL"
              )
            ),
            "total_project_task_cost_subcon",
          ],
        ],
        where: {
          account_rid,
          fiscal_year: fiscalYear,
          region_rid,
        },
        raw: true,
        transaction,
      });

      // Step 4: Parse and normalize
      const parseValue = (val: any) => {
        const num = parseFloat(val);
        return isNaN(num) || num === 0 ? null : num;
      };

      const updatePayload = {
        total_project_task_hours: parseValue(
          aggregates.total_project_task_hours
        ),
        total_project_task_cost: parseValue(aggregates.total_project_task_cost),
        total_project_task_hours_fte: parseValue(
          aggregates.total_project_task_hours_fte
        ),
        total_project_task_cost_fte: parseValue(
          aggregates.total_project_task_cost_fte
        ),
        total_project_task_hours_subcon: parseValue(
          aggregates.total_project_task_hours_subcon
        ),
        total_project_task_cost_subcon: parseValue(
          aggregates.total_project_task_cost_subcon
        ),
      };

      // Step 5: Update the AccountFiscalRegion
      await fiscalRegionRecord.update(updatePayload, { transaction });
    }
  }

  async fetchResourceType(resourceTypeId: string) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.getMainSequelize();
    }

    const results = await this.mainDbSequelize.query(
      `SELECT * FROM ${MAIN_SCHEMA_NAME}.resource_type WHERE rid = :resourceTypeId`,
      {
        replacements: { resourceTypeId },
        type: "SELECT",
      }
    );

    return results;
  }
}
