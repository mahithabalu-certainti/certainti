import { Op, Sequelize, Transaction } from "sequelize";
import { initOrgSequelize } from "../../config/orgDataSource";
import { initMainDbSequelize } from "../../config/mainDataSource";
import {
  ProjectTask,
  setupProjectTaskSequence,
} from "../../models/projectTask";
import { ICreateProjectTask, IUpdateProjectTask } from "../../utils/types";
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
import { ProjectTaskHistory, setupProjectTaskHistorySequence } from "../../models/projectTaskHiistory";

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
      ProjectTaskHistory: ReturnType<typeof ProjectTaskHistory.initialize>;
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
    const ProjectTaskHistoryModel = await ProjectTaskHistory.initialize(
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
      ProjectTaskHistory: ProjectTaskHistoryModel,
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
      await ProjectTaskHistory.sync({ force: false });
      if (this.orgDbSequelize) {
        const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;
        await setupProjectTaskSequence(this.orgDbSequelize, schemaName);
        await setupProjectTaskTimelineSeq(this.orgDbSequelize, schemaName);
        await setupProjectTaskHistorySequence(this.orgDbSequelize, schemaName);
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
      [Op.and]: [
        { start_date: { [Op.gte]: startDate?.toDate() } }, 
        Sequelize.where(
          Sequelize.cast(Sequelize.col("end_date"), "date"),
          {
            [Op.lte]: endDate?.toDate(),
          }
        ),
      ],
    };

    // if (startDate) whereClause.start_date = { [Op.gte]: startDate?.toDate() };
    // if (endDate) whereClause.end_date = { [Op.lte]: endDate?.toDate() };

    const existingTasks = await ProjectTask.findAll({
      where: {
        ...whereClause
      }
    });
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

  async updateProjectTask(
    accountNumber: string,
    projectTaskData: IUpdateProjectTask,
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

    const baseData = ProjectTaskMapper.mapToProjectTaskUpdate(
      projectTaskData,
      startDate,
      endDate,
      userId,
      projectResourceCode,
      projectData,
      resourceData
    );

    const updatedProjectResource = await ProjectTask.update({
      ...baseData,
      region_rid: resourceData.region_rid
    }, {
      where: {
        rid: projectTaskData.project_task_rid,
      },
      transaction,
    });

    return updatedProjectResource;
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
          transaction
        }
      );
    } catch (err) {
      console.log("Error addinng timelne", err);
      throw new Error("Error creating project resource timline");
    }
  }

  async addProjectTaskTimelineForInlineEdit(
    accountNumber: string,
    eventName: string,
    accountRid: string,
    projectTaskId: string,
    userId: string
  ) {
    try {
      const { ProjectTaskTimeline } = await this.getModels(accountNumber);

      await ProjectTaskTimeline.create(
        {
          account_rid: accountRid,
          event_name: eventName,
          event_status: "success",
          event_type: "ui handler",
          entity_rid: projectTaskId,
          created_by: userId,
          event_datetime: new Date(),
          created_datetime: new Date(),
        },
      );
    } catch (err) {
      console.log("Error addinng timelne", err);
      throw new Error("Error creating project resource timline");
    }
  }

  async addProjctTaskHistory(
    accountNumber: string,
    newProjectTaskData: ICreateProjectTask,
    existingProjectTaskData: any,
    projectTaskId: string,
    userId: string,
    transaction: Transaction
  ){
    const { ProjectTaskHistory } = await this.getModels(accountNumber);

    const excludedFields = [
      "modified_by",
      "account_rid",
      "project_rid",
      "project_fiscal_rid",
      "project_task_rid",
      "resource_code",
      "modified_datetime",
    ];

    const cleanedNewData = Object.fromEntries(
      Object.entries(newProjectTaskData).filter(
        ([key]) => !excludedFields.includes(key)
      )
    );

    const historyChanges = Object.entries(cleanedNewData)
      .filter(([key, newValue]) => {
        const oldValue = existingProjectTaskData[key];

        if (newValue == null && oldValue == null) return false;

        // Handle numeric comparison with fixed precision
        if (!isNaN(newValue) && !isNaN(oldValue)) {
          const roundedNew = Number(parseFloat(newValue).toFixed(2));
          const roundedOld = Number(parseFloat(oldValue).toFixed(2));
          return roundedNew !== roundedOld;
        }

        // Fallback to string comparison
        return String(newValue ?? "") !== String(oldValue ?? "");
      })
      .map(([key, newValue]) => ({
        project_task_rid: projectTaskId,
        attribute_name: key,
        old_value:
          existingProjectTaskData[key] !== null &&
          existingProjectTaskData[key] !== undefined
            ? String(existingProjectTaskData[key])
            : "",
        new_value:
          newValue !== null && newValue !== undefined ? String(newValue) : "",
        modified_by: userId,
        r_number: "",
        created_by: userId,
      }));

    if (historyChanges.length === 0) return;

    const latest = await ProjectTaskHistory.findAll();

    historyChanges.forEach((change, i) => {
      change.r_number = `PTAH${(latest.length + i + 1)
        .toString()
        .padStart(4, "0")}`;
    });

    await ProjectTaskHistory.bulkCreate(historyChanges, {
      transaction
    });
  }

  async addProjctTaskHistoryForInline(
    accountNumber: string,
    newProjectTaskData: any,
    existingProjectTaskData: any,
    projectTaskId: string,
    userId: string
  ){
    const { ProjectTaskHistory } = await this.getModels(accountNumber);

    const excludedFields = [
      "modified_by",
      "account_rid",
      "project_rid",
      "project_fiscal_rid",
      "project_task_rid",
      "resource_code",
      "modified_datetime",
    ];

    const cleanedNewData = Object.fromEntries(
      Object.entries(newProjectTaskData).filter(
        ([key]) => !excludedFields.includes(key)
      )
    );

    const historyChanges = Object.entries(cleanedNewData)
      .filter(([key, newValue]) => {
        const oldValue = existingProjectTaskData[key];

        if (newValue == null && oldValue == null) return false;

        // Handle numeric comparison with fixed precision
        if (!isNaN(Number(newValue)) && !isNaN(Number(oldValue))) {
          const roundedNew = Number(parseFloat(String(newValue)).toFixed(2));
          const roundedOld = Number(parseFloat(oldValue).toFixed(2));
          return roundedNew !== roundedOld;
        }

        // Fallback to string comparison
        return String(newValue ?? "") !== String(oldValue ?? "");
      })
      .map(([key, newValue]) => ({
        project_task_rid: projectTaskId,
        attribute_name: key,
        old_value:
          existingProjectTaskData[key] !== null &&
          existingProjectTaskData[key] !== undefined
            ? String(existingProjectTaskData[key])
            : "",
        new_value:
          newValue !== null && newValue !== undefined ? String(newValue) : "",
        modified_by: userId,
        r_number: "",
        created_by: userId,
      }));

    if (historyChanges.length === 0) return;

    const latest = await ProjectTaskHistory.findAll();

    historyChanges.forEach((change, i) => {
      change.r_number = `PTAH${(latest.length + i + 1)
        .toString()
        .padStart(4, "0")}`;
    });

    await ProjectTaskHistory.bulkCreate(historyChanges);
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
      resourceId,
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
      resourceId,
      transaction
    );
  }

  async addProjectResource(
    accountNumber: string,
    projectTaskData: ICreateProjectTask | IUpdateProjectTask,
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
    const { project_fiscal_rid, account_rid } = projectTaskData;

    const resource = await Resources.findOne({
      where: { rid: resourceId },
      transaction,
    });
  
    const region_rid = resource?.region_rid;
  
    if (!region_rid) {
      return;
    }

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

    const resource = await Resources.findOne({
      where: { rid: resourceId },
      transaction,
    });
  
    const region_rid = resource?.region_rid;
  
    if (!region_rid) {
      return;
    }

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
        region_rid: region_rid,
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
            country_region_rid: region_rid,
          },
          defaults: {
            account_rid,
            resource_rid: resourceId,
            fiscal_year: fiscalYear,
            country_region_rid: region_rid || null,
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
    projectTaskData: ICreateProjectTask | IUpdateProjectTask,
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
    resourceId: string,
    userId: string,
    transaction: Transaction
  ) {
    const { ProjectTask, ProjectFiscalRegion, Resources } =
      await this.getModels(accountNumber);
    const { account_rid, project_fiscal_rid } = projectTaskData;

    const resource = await Resources.findOne({
      where: { rid: resourceId },
      transaction,
    });
  
    const region_rid = resource?.region_rid;
  
    if (!region_rid) {
      return;
    }

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
    resourceId: string,
    transaction: Transaction
  ) {
    const { ProjectFiscalRegion, AccountFiscalRegion } = await this.getModels(
      accountNumber
    );

    const resource = await Resources.findOne({
      where: { rid: resourceId },
      transaction,
    });

    const region_rid = resource?.region_rid;

    if (!region_rid) {
      return;
    }

    // Step 1: Get all distinct region_rid values from ProjectFiscalRegion
    const regions: ProjectFiscalRegion[] = await ProjectFiscalRegion.findAll({
      attributes: [[Sequelize.col("region_rid"), "region_rid"]],
      where: {
        account_rid,
        fiscal_year: fiscalYear,
      },
      group: ["region_rid"],
      raw: true,
      transaction,
    });

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

  async startUpdateAggregation(
    accountNumber: string,
    projectTaskData: IUpdateProjectTask,
    taskData: ProjectTask,
    resourceData: Resources,
    fiscalYear: number,
    resourceId: string,
    projectData: ProjectFiscal,
    userId: string,
    transaction: Transaction
  ){
    // project resource
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
    await this.aggregateProjectResourceFiscalOnUpdate(
      accountNumber,
      projectTaskData,
      taskData,
      fiscalYear,
      resourceId,
      userId,
      transaction
    );
    await this.aggregateProjectResourceFiscalRegionOnUpdate(
      accountNumber,
      projectTaskData,
      taskData,
      fiscalYear,
      resourceId,
      userId,
      transaction
    );

    // resources 
    await this.aggregateResourceFiscalOnUpdate(
      accountNumber,
      projectTaskData,
      taskData,
      resourceId,
      resourceData,
      userId,
      transaction
    );
    await this.aggregateResourceFiscalRegionOnUpdate(
      accountNumber,
      projectTaskData,
      taskData,
      resourceId,
      resourceData,
      userId,
      transaction
    );

    //project 
    await this.aggregateProjectFiscal(
      accountNumber,
      projectTaskData,
      fiscalYear,
      transaction,
    );
    await this.aggregateProjectFiscalRegionOnUpdate(
      accountNumber,
      projectTaskData,
      taskData,
      fiscalYear,
      resourceId,
      resourceData,
      userId,
      transaction
    );

    // account 
    await this.aggregateAccountFiscal(
      accountNumber,
      projectTaskData.account_rid,
      fiscalYear,
      transaction
    );
    await this.aggregateAccountFiscalRegionOnUpdate(
      accountNumber,
      projectTaskData,
      taskData,
      fiscalYear,
      resourceId,
      resourceData,
      userId,
      transaction
    );
  }

  async aggregateProjectResourceFiscalOnUpdate(
    accountNumber: string,
    projectTaskData: ICreateProjectTask,
    existingProjectTask: ProjectTask,
    fiscalYear: number,
    resourceId: string,
    userId: string,
    transaction: Transaction
  ){
    const { ProjectTask, ProjectResourceFiscal } = await this.getModels(accountNumber);

    const newGroupKey = {
      project_fiscal_rid: projectTaskData.project_fiscal_rid,
      account_rid: projectTaskData.account_rid,
      fiscal_year: fiscalYear,
      resource_rid: resourceId,
    };

    const oldGroupKey = {
      project_fiscal_rid: existingProjectTask.project_fiscal_rid,
      account_rid: existingProjectTask.account_rid,
      fiscal_year: existingProjectTask.fiscal_year,
      resource_rid: existingProjectTask.resource_rid,
    };

    const isGroupChanged = (
      newGroupKey.project_fiscal_rid !== oldGroupKey.project_fiscal_rid ||
      newGroupKey.account_rid !== oldGroupKey.account_rid ||
      newGroupKey.fiscal_year !== oldGroupKey.fiscal_year ||
      newGroupKey.resource_rid !== oldGroupKey.resource_rid
    );

    // 🔁 Step 1: Recalculate old group aggregate if changed
    if (isGroupChanged) {
      const oldAggregate = await ProjectTask.findAll({
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('total_cost_pro_task')), 'totalCost'],
          [Sequelize.fn('SUM', Sequelize.col('total_hours_pro_task')), 'totalEffort']
        ],
        where: {
          project_fiscal_rid: oldGroupKey.project_fiscal_rid,
          account_rid: oldGroupKey.account_rid,
          fiscal_year: oldGroupKey.fiscal_year,
          resource_rid: oldGroupKey.resource_rid
        },
        transaction
      });

      const oldCost = parseFloat(oldAggregate[0].get('totalCost') as string) || 0;
      const oldEffort = parseFloat(oldAggregate[0].get('totalEffort') as string) || 0;

      if (oldCost === 0 && oldEffort === 0) {
        // Check if any tasks still reference the old group
        const taskCount = await ProjectTask.count({
          where: {
            project_fiscal_rid: oldGroupKey.project_fiscal_rid,
            account_rid: oldGroupKey.account_rid,
            fiscal_year: oldGroupKey.fiscal_year,
            resource_rid: oldGroupKey.resource_rid
          },
          transaction
        });
  
        if (taskCount === 0) {
          // 🗑️ No more tasks reference this group → safe to delete
          await ProjectResourceFiscal.destroy({
            where: oldGroupKey,
            transaction
          });
        } else {
          // Update zero aggregates (still used elsewhere)
          await ProjectResourceFiscal.update(
            {
              total_cost_from_tasks: oldCost,
              total_hours_from_tasks: oldEffort,
              modified_by: userId,
              modified_datetime: new Date()
            },
            {
              where: oldGroupKey,
              transaction
            }
          );
        }
      } else {
        // Non-zero aggregate → just update
        await ProjectResourceFiscal.update(
          {
            total_cost_from_tasks: oldCost,
            total_hours_from_tasks: oldEffort,
            modified_by: userId,
            modified_datetime: new Date()
          },
          {
            where: oldGroupKey,
            transaction
          }
        );
      }
    }

    // 🔁 Step 2: Ensure new group exists
    const existingNewGroup = await ProjectResourceFiscal.findOne({
      where: newGroupKey,
      transaction
    });

    if (!existingNewGroup) {
      await ProjectResourceFiscal.create({
        ...newGroupKey,
        total_cost_from_tasks: projectTaskData.total_cost_pro_task,
        total_hours_from_tasks: projectTaskData.total_hours_pro_task,
        created_by: userId,
        created_datetime: new Date(),
        project_rid: existingProjectTask.project_rid,
        project_resource_rid: "",
      }, { transaction });
    }

    // 🔁 Step 3: Recalculate new group aggregate
    const newAggregate = await ProjectTask.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('total_cost_pro_task')), 'totalCost'],
        [Sequelize.fn('SUM', Sequelize.col('total_hours_pro_task')), 'totalEffort']
      ],
      where: {
        project_fiscal_rid: newGroupKey.project_fiscal_rid,
        account_rid: newGroupKey.account_rid,
        fiscal_year: newGroupKey.fiscal_year,
        resource_rid: newGroupKey.resource_rid
      },
      transaction
    });

    const newCost = parseFloat(newAggregate[0].get('totalCost') as string) || 0;
    const newEffort = parseFloat(newAggregate[0].get('totalEffort') as string) || 0;

    await ProjectResourceFiscal.update(
      {
        total_hours_from_tasks: newEffort,
        total_cost_from_tasks: newCost,
        modified_by: userId,
        modified_datetime: new Date()
      },
      {
        where: newGroupKey,
        transaction
      }
    );
  }

  async aggregateProjectResourceFiscalRegionOnUpdate(
    accountNumber: string,
    projectTaskData: ICreateProjectTask,
    existingProjectTask: ProjectTask,
    fiscalYear: number,
    resourceId: string,
    userId: string,
    transaction: Transaction
  ) {
    const {
      ProjectTask,
      ProjectResourceFiscalRegion,
      Resources
    } = await this.getModels(accountNumber);
  
    // Step 0: Fetch region_rid from resource for both new and old
    const [newResource, oldResource] = await Promise.all([
      Resources.findOne({
        where: { rid: resourceId },
        transaction
      }),
      Resources.findOne({
        where: { rid: existingProjectTask.resource_rid },
        transaction
      })
    ]);
  
    if (!newResource || !oldResource) {
      throw new Error('Unable to resolve resource_rid to region_rid');
    }
  
    const newRegionRid = newResource.region_rid;
    const oldRegionRid = oldResource.region_rid;
  
    const newGroupKey = {
      project_fiscal_rid: projectTaskData.project_fiscal_rid,
      account_rid: projectTaskData.account_rid,
      fiscal_year: fiscalYear,
      resource_rid: resourceId,
      region_rid: newRegionRid
    };
  
    const oldGroupKey = {
      project_fiscal_rid: existingProjectTask.project_fiscal_rid,
      account_rid: existingProjectTask.account_rid,
      fiscal_year: existingProjectTask.fiscal_year,
      resource_rid: existingProjectTask.resource_rid,
      region_rid: oldRegionRid
    };
  
    const isGroupChanged = (
      newGroupKey.project_fiscal_rid !== oldGroupKey.project_fiscal_rid ||
      newGroupKey.account_rid !== oldGroupKey.account_rid ||
      newGroupKey.fiscal_year !== oldGroupKey.fiscal_year ||
      newGroupKey.resource_rid !== oldGroupKey.resource_rid ||
      newGroupKey.region_rid !== oldGroupKey.region_rid
    );
  
    // Step 1: Recalculate and cleanup old group if changed
    if (isGroupChanged) {
      const oldAggregate = await ProjectTask.findAll({
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('total_cost_pro_task')), 'totalCost'],
          [Sequelize.fn('SUM', Sequelize.col('total_hours_pro_task')), 'totalEffort']
        ],
        where: oldGroupKey,
        transaction
      });
  
      const oldCost = parseFloat(oldAggregate[0].get('totalCost') as string) || 0;
      const oldEffort = parseFloat(oldAggregate[0].get('totalEffort') as string) || 0;
  
      const remainingTasks = await ProjectTask.count({
        where: oldGroupKey,
        transaction
      });
  
      if (oldCost === 0 && oldEffort === 0 && remainingTasks === 0) {
        await ProjectResourceFiscalRegion.destroy({
          where: oldGroupKey,
          transaction
        });
      } else {
        await ProjectResourceFiscalRegion.update(
          {
            total_cost_from_tasks: oldCost,
            total_hours_from_tasks: oldEffort,
            modified_by: userId,
            modified_datetime: new Date()
          },
          {
            where: oldGroupKey,
            transaction
          }
        );
      }
    }
  
    // Step 2: Ensure new group exists
    const existingNewGroup = await ProjectResourceFiscalRegion.findOne({
      where: newGroupKey,
      transaction
    });
  
    if (!existingNewGroup) {
      if(newRegionRid){
        await ProjectResourceFiscalRegion.create({
          ...newGroupKey,
          total_cost_from_tasks: projectTaskData.total_cost_pro_task,
          total_hours_from_tasks: projectTaskData.total_hours_pro_task,
          region_rid: newRegionRid,
          created_by: userId,
          created_datetime: new Date(),
          project_rid: existingProjectTask.project_rid
        }, { transaction });
      }
    }
  
    // Step 3: Recalculate and update new group aggregate
    const newAggregate = await ProjectTask.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('total_cost_pro_task')), 'totalCost'],
        [Sequelize.fn('SUM', Sequelize.col('total_hours_pro_task')), 'totalEffort']
      ],
      where: newGroupKey,
      transaction
    });
  
    const newCost = parseFloat(newAggregate[0].get('totalCost') as string) || 0;
    const newEffort = parseFloat(newAggregate[0].get('totalEffort') as string) || 0;
  
    await ProjectResourceFiscalRegion.update(
      {
        total_hours_from_tasks: newEffort,
        total_cost_from_tasks: newCost,
        modified_by: userId,
        modified_datetime: new Date()
      },
      {
        where: newGroupKey,
        transaction
      }
    );
  }  

  async aggregateResourceFiscalOnUpdate(
    accountNumber: string,
    projectTaskData: ICreateProjectTask,
    existingProjectTask: ProjectTask,
    resourceId: string,
    resourceData: Resources,
    userId: string,
    transaction: Transaction
  ) {
    const {
      ProjectTask,
      ResourceFiscal
    } = await this.getModels(accountNumber);
  
    const newGroupKey = {
      account_rid: projectTaskData.account_rid,
      resource_rid: resourceId
    };
  
    const oldGroupKey = {
      account_rid: existingProjectTask.account_rid,
      resource_rid: existingProjectTask.resource_rid
    };
  
    const isGroupChanged = (
      newGroupKey.account_rid !== oldGroupKey.account_rid ||
      newGroupKey.resource_rid !== oldGroupKey.resource_rid
    );
  
    // 🔁 Step 1: Recalculate and clean old group if changed
    if (isGroupChanged) {
      const oldAggregate = await ProjectTask.findAll({
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('total_cost_pro_task')), 'totalCost'],
          [Sequelize.fn('SUM', Sequelize.col('total_hours_pro_task')), 'totalEffort']
        ],
        where: {
          account_rid: oldGroupKey.account_rid,
          resource_rid: oldGroupKey.resource_rid
        },
        transaction
      });
  
      const oldCost = parseFloat(oldAggregate[0].get('totalCost') as string) || 0;
      const oldEffort = parseFloat(oldAggregate[0].get('totalEffort') as string) || 0;
  
      const taskCount = await ProjectTask.count({
        where: {
          account_rid: oldGroupKey.account_rid,
          resource_rid: oldGroupKey.resource_rid
        },
        transaction
      });
  
      if (oldCost === 0 && oldEffort === 0 && taskCount === 0) {
        await ResourceFiscal.destroy({
          where: oldGroupKey,
          transaction
        });
      } else {
        await ResourceFiscal.update(
          {
            total_cost_for_year_project_task_level: oldCost,
            total_effort_for_year_project_task_level: oldEffort,
            modified_by: userId,
            modified_datetime: new Date()
          },
          {
            where: oldGroupKey,
            transaction
          }
        );
      }
    }
  
    // 🔁 Step 2: Ensure new group exists
    const existingNewGroup = await ResourceFiscal.findOne({
      where: newGroupKey,
      transaction
    });
  
    if (!existingNewGroup) {
      await ResourceFiscal.create({
        ...newGroupKey,
        total_cost_for_year_project_task_level: projectTaskData.total_cost_pro_task,
        total_effort_for_year_project_task_level: projectTaskData.total_hours_pro_task,
        created_by: userId,
        resource_type_rid: resourceData.resource_type_rid,
        resource_code: resourceData.resource_code,
        created_datetime: new Date()
      }, { transaction });
    }
  
    // 🔁 Step 3: Recalculate and update new group aggregate
    const newAggregate = await ProjectTask.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('total_cost_pro_task')), 'totalCost'],
        [Sequelize.fn('SUM', Sequelize.col('total_hours_pro_task')), 'totalEffort']
      ],
      where: {
        account_rid: newGroupKey.account_rid,
        resource_rid: newGroupKey.resource_rid
      },
      transaction
    });
  
    const newCost = parseFloat(newAggregate[0].get('totalCost') as string) || 0;
    const newEffort = parseFloat(newAggregate[0].get('totalEffort') as string) || 0;
  
    await ResourceFiscal.update(
      {
        total_cost_for_year_project_task_level: newCost,
        total_effort_for_year_project_task_level: newEffort,
        modified_by: userId,
        modified_datetime: new Date()
      },
      {
        where: newGroupKey,
        transaction
      }
    );
  }  

  async aggregateResourceFiscalRegionOnUpdate(
    accountNumber: string,
    projectTaskData: ICreateProjectTask,
    existingProjectTask: ProjectTask,
    resourceId: string,
    resourceData: Resources, // passed from calling context to avoid re-fetch
    userId: string,
    transaction: Transaction
  ) {
    const {
      ProjectTask,
      ResourceFiscalRegion,
      Resources
    } = await this.getModels(accountNumber);
  
    // Step 0: Get region_rid for new and old resource
    const [oldResource] = await Promise.all([
      Resources.findOne({
        where: { rid: existingProjectTask.resource_rid },
        transaction
      })
    ]);
  
    if (!resourceData || !oldResource) {
      throw new Error('Unable to resolve region_rid from resource');
    }
  
    const newRegionRid = resourceData.region_rid;
    const oldRegionRid = oldResource.region_rid;
  
    const newGroupKey = {
      account_rid: projectTaskData.account_rid,
      resource_rid: resourceId,
      region_rid: newRegionRid
    };
  
    const oldGroupKey = {
      account_rid: existingProjectTask.account_rid,
      resource_rid: existingProjectTask.resource_rid,
      region_rid: oldRegionRid
    };
  
    const isGroupChanged = (
      newGroupKey.account_rid !== oldGroupKey.account_rid ||
      newGroupKey.resource_rid !== oldGroupKey.resource_rid ||
      newGroupKey.region_rid !== oldGroupKey.region_rid
    );
  
    // 🔁 Step 1: Recalculate old group aggregate
    if (isGroupChanged) {
      const oldAggregate = await ProjectTask.findAll({
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('total_cost_pro_task')), 'totalCost'],
          [Sequelize.fn('SUM', Sequelize.col('total_hours_pro_task')), 'totalEffort']
        ],
        where: oldGroupKey,
        transaction
      });
  
      const oldCost = parseFloat(oldAggregate[0].get('totalCost') as string) || 0;
      const oldEffort = parseFloat(oldAggregate[0].get('totalEffort') as string) || 0;
  
      const taskCount = await ProjectTask.count({
        where: oldGroupKey,
        transaction
      });
  
      if (oldCost === 0 && oldEffort === 0 && taskCount === 0) {
        await ResourceFiscalRegion.destroy({
          where: {
            account_rid: existingProjectTask.account_rid,
            resource_rid: existingProjectTask.resource_rid,
            country_region_rid: oldRegionRid
          },
          transaction
        });
      } else {
        await ResourceFiscalRegion.update(
          {
            total_cost_for_year_project_task_level: oldCost,
            total_effort_for_year_project_task_level: oldEffort,
            modified_by: userId,
            modified_datetime: new Date()
          },
          {
            where: {
              account_rid: existingProjectTask.account_rid,
              resource_rid: existingProjectTask.resource_rid,
              country_region_rid: oldRegionRid
            },
            transaction
          }
        );
      }
    }
  
    // 🔁 Step 2: Ensure new group exists
    const existingNewGroup = await ResourceFiscalRegion.findOne({
      where: {
        account_rid: projectTaskData.account_rid,
        resource_rid: resourceId,
        country_region_rid: newRegionRid
      },
      transaction
    });
  
    if (!existingNewGroup) {
      if(newRegionRid){
        await ResourceFiscalRegion.create({
          account_rid: projectTaskData.account_rid,
          resource_rid: resourceId,
          country_region_rid: newRegionRid,
          total_cost_for_year_project_task_level: projectTaskData.total_cost_pro_task,
          total_effort_for_year_project_task_level: projectTaskData.total_hours_pro_task,
          resource_type_rid: resourceData.resource_type_rid,
          resource_code: resourceData.resource_code,
          created_by: userId,
          created_datetime: new Date()
        }, { transaction });
      }
    }
  
    // 🔁 Step 3: Recalculate new group aggregate
    const newAggregate = await ProjectTask.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('total_cost_pro_task')), 'totalCost'],
        [Sequelize.fn('SUM', Sequelize.col('total_hours_pro_task')), 'totalEffort']
      ],
      where: newGroupKey,
      transaction
    });
  
    const newCost = parseFloat(newAggregate[0].get('totalCost') as string) || 0;
    const newEffort = parseFloat(newAggregate[0].get('totalEffort') as string) || 0;
  
    await ResourceFiscalRegion.update(
      {
        total_effort_for_year_project_task_level: newEffort,
        total_cost_for_year_project_task_level: newCost,
        modified_by: userId,
        modified_datetime: new Date()
      },
      {
        where: {
          account_rid: projectTaskData.account_rid,
          resource_rid: resourceId,
          country_region_rid: newRegionRid
        },
        transaction
      }
    );
  }  

  async aggregateProjectFiscalRegionOnUpdate(
    accountNumber: string,
    projectTaskData: IUpdateProjectTask,
    existingProjectTask: ProjectTask,
    fiscalYear: number,
    resourceId: string,
    resourceData: Resources,
    userId: string,
    transaction: Transaction
  ) {
    const {
      ProjectTask,
      ProjectFiscalRegion,
      Resources,
      Project
    } = await this.getModels(accountNumber);
  
    const oldResource = await Resources.findOne({
      where: { rid: existingProjectTask.resource_rid },
      transaction
    });
  
    if (!resourceData || !oldResource) {
      throw new Error('Unable to resolve region_rid for resource');
    }
  
    const newRegionRid = resourceData.region_rid;
    const oldRegionRid = oldResource.region_rid;
  
    const newGroupKey = {
      account_rid: projectTaskData.account_rid,
      fiscal_year: fiscalYear,
      project_rid: existingProjectTask.project_rid,
      region_rid: newRegionRid
    };
  
    const oldGroupKey = {
      account_rid: existingProjectTask.account_rid,
      fiscal_year: existingProjectTask.fiscal_year,
      project_rid: existingProjectTask.project_rid,
      region_rid: oldRegionRid
    };
  
    const isGroupChanged = (
      newGroupKey.account_rid !== oldGroupKey.account_rid ||
      newGroupKey.fiscal_year !== oldGroupKey.fiscal_year ||
      newGroupKey.project_rid !== oldGroupKey.project_rid ||
      newGroupKey.region_rid !== oldGroupKey.region_rid
    );
  
    // 🔁 Step 1: Recalculate and clean old group if changed
    if (isGroupChanged) {
      const oldAggregate = await ProjectTask.findAll({
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('total_cost_pro_task')), 'totalCost'],
          [Sequelize.fn('SUM', Sequelize.col('total_hours_pro_task')), 'totalEffort']
        ],
        where: oldGroupKey,
        transaction
      });
    
      const oldCost = parseFloat(oldAggregate[0].get('totalCost') as string) || 0;
      const oldEffort = parseFloat(oldAggregate[0].get('totalEffort') as string) || 0;
    
      const taskCount = await ProjectTask.count({
        where: oldGroupKey,
        transaction
      });
    
      // 👇 NEW: FTE/Subcon breakdown for old group
      const groupedOldByType: any = await ProjectTask.findAll({
        attributes: [
          [Sequelize.col("resource.resource_type_rid"), "resource_type_rid"],
          [Sequelize.fn("SUM", Sequelize.col("total_cost_pro_task")), "total_cost"],
          [Sequelize.fn("SUM", Sequelize.col("total_hours_pro_task")), "total_effort"]
        ],
        include: [
          {
            model: Resources,
            as: "resource",
            attributes: ["resource_type_rid"],
            required: true
          }
        ],
        where: oldGroupKey,
        group: ["resource.resource_type_rid"],
        raw: true,
        transaction
      });
    
      let old_cost_fte_from_tasks = null;
      let old_effort_fte_from_tasks = null;
      let old_cost_subcon_from_tasks = null;
      let old_effort_subcon_from_tasks = null;
    
      for (const row of groupedOldByType) {
        const resourceTypeId = row.resource_type_rid;
        if (!resourceTypeId) continue;
    
        const [resourceType]: any = await this.fetchResourceType(resourceTypeId);
        const typeName = resourceType?.resource_type_name?.toLowerCase();
    
        if (typeName === "full-time") {
          old_cost_fte_from_tasks = row.total_cost;
          old_effort_fte_from_tasks = row.total_effort;
        } else if (typeName === "sub con") {
          old_cost_subcon_from_tasks = row.total_cost;
          old_effort_subcon_from_tasks = row.total_effort;
        }
      }
    
      if (oldCost === 0 && oldEffort === 0 && taskCount === 0) {
        await ProjectFiscalRegion.destroy({
          where: oldGroupKey,
          transaction
        });
      } else {
        await ProjectFiscalRegion.update(
          {
            total_cost_from_tasks: oldCost,
            total_effort_from_tasks: oldEffort,
            total_cost_fte_from_tasks: old_cost_fte_from_tasks,
            total_effort_fte_from_tasks: old_effort_fte_from_tasks,
            total_cost_subcon_from_tasks: old_cost_subcon_from_tasks,
            total_effort_subcon_from_tasks: old_effort_subcon_from_tasks,
            modified_by: userId,
            modified_datetime: new Date()
          },
          {
            where: oldGroupKey,
            transaction
          }
        );
      }
    }    
  
    // 🔁 Step 2: Ensure new group exists
    const existingNewGroup = await ProjectFiscalRegion.findOne({
      where: newGroupKey,
      transaction
    });
  
    if (!existingNewGroup) {
      const projectData = await Project.findOne({
        where: {
          rid: existingProjectTask.project_rid
        }
      });
  
      if (projectData) {
        await ProjectFiscalRegion.create({
          ...newGroupKey,
          total_cost_from_tasks: projectTaskData.total_cost_pro_task,
          total_effort_from_tasks: projectTaskData.total_hours_pro_task,
          project_code: projectData?.project_code,
          project_type_rid: projectData?.project_type_rid,
          max_ai_interaction: projectData?.max_ai_interaction,
          auto_send_ai_interaction: projectData.auto_send_ai_interaction,
          status_rid: projectData.status_rid,
          project_fiscal_rid: "",
          created_by: userId,
          created_datetime: new Date()
        }, { transaction });
      }
    }
  
    // 🔁 Step 3: Recalculate and update new group aggregate, including FTE/Subcon
    const groupedByType: any[] = await ProjectTask.findAll({
      attributes: [
        [Sequelize.col("resource.resource_type_rid"), "resource_type_rid"],
        [Sequelize.fn("SUM", Sequelize.col("total_cost_pro_task")), "total_cost"],
        [Sequelize.fn("SUM", Sequelize.col("total_hours_pro_task")), "total_effort"]
      ],
      include: [
        {
          model: Resources,
          as: "resource",
          attributes: ["resource_type_rid"],
          required: true
        }
      ],
      where: newGroupKey,
      group: ["resource.resource_type_rid"],
      raw: true,
      transaction
    });
  
    let total_cost_fte_from_tasks = null;
    let total_effort_fte_from_tasks = null;
    let total_cost_subcon_from_tasks = null;
    let total_effort_subcon_from_tasks = null;
  
    for (const row of groupedByType) {
      const resourceTypeId = row.resource_type_rid;
      if (!resourceTypeId) continue;
  
      const [resourceType]: any = await this.fetchResourceType(resourceTypeId);
      const typeName = resourceType?.resource_type_name?.toLowerCase();
  
      if (typeName === "full-time") {
        total_cost_fte_from_tasks = row.total_cost;
        total_effort_fte_from_tasks = row.total_effort;
      } else if (typeName === "sub con") {
        total_cost_subcon_from_tasks = row.total_cost;
        total_effort_subcon_from_tasks = row.total_effort;
      }
    }
  
    const totalAggregate = await ProjectTask.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('total_cost_pro_task')), 'totalCost'],
        [Sequelize.fn('SUM', Sequelize.col('total_hours_pro_task')), 'totalEffort']
      ],
      where: newGroupKey,
      transaction
    });
  
    const newCost = parseFloat(totalAggregate[0].get('totalCost') as string) || 0;
    const newEffort = parseFloat(totalAggregate[0].get('totalEffort') as string) || 0;
  
    await ProjectFiscalRegion.update(
      {
        total_cost_from_tasks: newCost,
        total_effort_from_tasks: newEffort,
        total_cost_fte_from_tasks,
        total_effort_fte_from_tasks,
        total_cost_subcon_from_tasks,
        total_effort_subcon_from_tasks,
        modified_by: userId,
        modified_datetime: new Date()
      },
      {
        where: newGroupKey,
        transaction
      }
    );
  }  

  async aggregateAccountFiscalRegionOnUpdate(
    accountNumber: string,
    projectTaskData: IUpdateProjectTask,
    existingProjectTask: ProjectTask,
    fiscalYear: number,
    resourceId: string,
    resourceData: Resources,
    userId: string,
    transaction: Transaction
  ) {
    const {
      ProjectTask,
      AccountFiscalRegion,
      Resources
    } = await this.getModels(accountNumber);
  
    const oldResource = await Resources.findOne({
      where: { rid: existingProjectTask.resource_rid },
      transaction
    });
  
    if (!resourceData || !oldResource) {
      throw new Error('Unable to resolve region_rid for resource');
    }
  
    const newRegionRid = resourceData.region_rid;
    const oldRegionRid = oldResource.region_rid;
  
    const newGroupKey = {
      account_rid: projectTaskData.account_rid,
      fiscal_year: fiscalYear,
      region_rid: newRegionRid
    };
  
    const oldGroupKey = {
      account_rid: existingProjectTask.account_rid,
      fiscal_year: existingProjectTask.fiscal_year,
      region_rid: oldRegionRid
    };
  
    const isGroupChanged = (
      newGroupKey.account_rid !== oldGroupKey.account_rid ||
      newGroupKey.fiscal_year !== oldGroupKey.fiscal_year ||
      newGroupKey.region_rid !== oldGroupKey.region_rid
    );
  
    // 🔁 Step 1: Recalculate and clean old group if changed
    if (isGroupChanged) {
      const oldAggregate = await ProjectTask.findAll({
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('total_cost_pro_task')), 'totalCost'],
          [Sequelize.fn('SUM', Sequelize.col('total_hours_pro_task')), 'totalEffort']
        ],
        where: oldGroupKey,
        transaction
      });
    
      const oldCost = parseFloat(oldAggregate[0].get('totalCost') as string) || 0;
      const oldEffort = parseFloat(oldAggregate[0].get('totalEffort') as string) || 0;
    
      const taskCount = await ProjectTask.count({
        where: oldGroupKey,
        transaction
      });
    
      // 👇 Recalculate FTE/SubCon for old group
      const groupedOldByType: any[] = await ProjectTask.findAll({
        attributes: [
          [Sequelize.col("resource.resource_type_rid"), "resource_type_rid"],
          [Sequelize.fn("SUM", Sequelize.col("total_cost_pro_task")), "total_cost"],
          [Sequelize.fn("SUM", Sequelize.col("total_hours_pro_task")), "total_effort"]
        ],
        include: [
          {
            model: Resources,
            as: "resource",
            attributes: ["resource_type_rid"],
            required: true
          }
        ],
        where: oldGroupKey,
        group: ["resource.resource_type_rid"],
        raw: true,
        transaction
      });
    
      let old_cost_fte_from_tasks = null;
      let old_effort_fte_from_tasks = null;
      let old_cost_subcon_from_tasks = null;
      let old_effort_subcon_from_tasks = null;
    
      for (const row of groupedOldByType) {
        const resourceTypeId = row.resource_type_rid;
        if (!resourceTypeId) continue;
    
        const [resourceType]: any = await this.fetchResourceType(resourceTypeId);
        const typeName = resourceType?.resource_type_name?.toLowerCase();
    
        if (typeName === "full-time") {
          old_cost_fte_from_tasks = row.total_cost;
          old_effort_fte_from_tasks = row.total_effort;
        } else if (typeName === "sub con") {
          old_cost_subcon_from_tasks = row.total_cost;
          old_effort_subcon_from_tasks = row.total_effort;
        }
      }
    
      if (oldCost === 0 && oldEffort === 0 && taskCount === 0) {
        await AccountFiscalRegion.destroy({
          where: oldGroupKey,
          transaction
        });
      } else {
        await AccountFiscalRegion.update(
          {
            total_project_task_cost: oldCost,
            total_project_task_hours: oldEffort,
            total_project_task_cost_fte: old_cost_fte_from_tasks,
            total_project_task_hours_fte: old_effort_fte_from_tasks,
            total_project_task_cost_subcon: old_cost_subcon_from_tasks,
            total_project_task_hours_subcon: old_effort_subcon_from_tasks,
            modified_by: userId,
            modified_datetime: new Date()
          },
          {
            where: oldGroupKey,
            transaction
          }
        );
      }
    }    
  
    // 🔁 Step 2: Ensure new group exists
    const existingNewGroup = await AccountFiscalRegion.findOne({
      where: newGroupKey,
      transaction
    });
  
    if (!existingNewGroup) {
      await AccountFiscalRegion.create({
        ...newGroupKey,
        total_project_task_cost: projectTaskData.total_cost_pro_task,
        total_project_task_hours: projectTaskData.total_hours_pro_task,
        created_by: userId,
        created_datetime: new Date()
      }, { transaction });
    }
  
    // 🔁 Step 3: FTE & Subcon Aggregation by resource_type
    const groupedByType: any[] = await ProjectTask.findAll({
      attributes: [
        [Sequelize.col("resource.resource_type_rid"), "resource_type_rid"],
        [Sequelize.fn("SUM", Sequelize.col("total_cost_pro_task")), "total_cost"],
        [Sequelize.fn("SUM", Sequelize.col("total_hours_pro_task")), "total_effort"]
      ],
      include: [
        {
          model: Resources,
          as: "resource",
          attributes: ["resource_type_rid"],
          required: true
        }
      ],
      where: newGroupKey,
      group: ["resource.resource_type_rid"],
      raw: true,
      transaction
    });
  
    let total_cost_fte_from_tasks = null;
    let total_effort_fte_from_tasks = null;
    let total_cost_subcon_from_tasks = null;
    let total_effort_subcon_from_tasks = null;
  
    for (const row of groupedByType) {
      const resourceTypeId = row.resource_type_rid;
      if (!resourceTypeId) continue;
  
      const [resourceType]: any = await this.fetchResourceType(resourceTypeId);
      const typeName = resourceType?.resource_type_name?.toLowerCase();
  
      if (typeName === "full-time") {
        total_cost_fte_from_tasks = row.total_cost;
        total_effort_fte_from_tasks = row.total_effort;
      } else if (typeName === "sub con") {
        total_cost_subcon_from_tasks = row.total_cost;
        total_effort_subcon_from_tasks = row.total_effort;
      }
    }
  
    // 🔁 Step 4: Total aggregate (overall cost & hours)
    const newAggregate = await ProjectTask.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('total_cost_pro_task')), 'totalCost'],
        [Sequelize.fn('SUM', Sequelize.col('total_hours_pro_task')), 'totalEffort']
      ],
      where: newGroupKey,
      transaction
    });
  
    const newCost = parseFloat(newAggregate[0].get('totalCost') as string) || 0;
    const newEffort = parseFloat(newAggregate[0].get('totalEffort') as string) || 0;
  
    // 🔁 Step 5: Update final record
    await AccountFiscalRegion.update(
      {
        total_project_task_cost: newCost,
        total_project_task_hours: newEffort,
        total_project_task_cost_fte: total_cost_fte_from_tasks,
        total_project_task_hours_fte: total_effort_fte_from_tasks,
        total_project_task_cost_subcon: total_cost_subcon_from_tasks,
        total_project_task_hours_subcon: total_effort_subcon_from_tasks,
        modified_by: userId,
        modified_datetime: new Date()
      },
      {
        where: newGroupKey,
        transaction
      }
    );
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

  async validateProjectTaskById(
    accountNumber: string,
    projectTaskId: string,
    accountId: string
  ) {
    const { ProjectTask } = await this.getModels(accountNumber);

    const projectTaskData = await ProjectTask.findOne({
      where: {
        rid: projectTaskId,
        account_rid: accountId,
      },
    });

    if (!projectTaskData) {
      throw new Error("Project task does not exist for the given account");
    }

    return projectTaskData;
  }
}
