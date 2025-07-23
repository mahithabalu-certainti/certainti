import { Op, Order, QueryTypes, Sequelize, col, fn, literal, where } from "sequelize";
import { initOrgSequelize } from "../config/orgDataSource";
import { Project } from "../models/project";
import { ProjectFiscal } from "../models/projectFiscal";
import {
  ICreateProject,
  IKeyContactDetail,
  IUpdateProject,
} from "../utils/types";
import moment, { Moment } from "moment";
import { ProjectMapper } from "../utils/projectMapper";
import { ProjectTimeline } from "../models/projectTimeline";
import { KeyContact } from "../models/keyContactDetails";
import { KeyContactService } from "./keyContactService";
import { ProjectSummary } from "../models/projectSummary";
import { initMainDbSequelize } from "../config/mainDataSource";
import { ProjectFiscalSummary } from "../models/projectFiscalSummary";
import { AccountFiscal } from "../models/accountFiscal";
import { ProjectHistory } from "../models/projectHistory";
import currency from "currency.js";
import { isValidTimezone } from "../utils/valideTimeChecker";
import { Logger } from "winston";
import { MAIN_SCHEMA_NAME } from "../utils/constants";
import {
  ProjectFiscalRegion,
  ProjectFiscalRegionAttributes,
} from "../models/projectFiscalRegion";
import { AccountFiscalRegion } from "../models/accountFiscalRegion";
import { ProjectResource } from "../models/projectResource";
import { ProjectResourceFiscal } from "../models/projectResourceFiscal";
import { ProjectResourceFiscalRegion } from "../models/projectResourceFiscalRegion";
import AccountDetails from "../models/accountDetails";
import SchemaService from "./schemaService";

class ProjectIngestionService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  keyContactService: KeyContactService;
  private logger: Logger;

  private modelCache: Map<
    string,
    {
      Project: ReturnType<typeof Project.initialize>;
      ProjectFiscal: ReturnType<typeof ProjectFiscal.initialize>;
      ProjectTimeline: ReturnType<typeof ProjectTimeline.initialize>;
      KeyContact: ReturnType<typeof KeyContact.initialize>;
      ProjectSummary: ReturnType<typeof ProjectSummary.initialize>;
      ProjectFiscalSummary: ReturnType<typeof ProjectFiscalSummary.initialize>;
      AccountFiscal: ReturnType<typeof AccountFiscal.initialize>;
      ProjectHistory: ReturnType<typeof ProjectHistory.initialize>;
      ProjectFiscalRegion: ReturnType<typeof ProjectFiscalRegion.initialize>;
      AccountFiscalRegion: ReturnType<typeof AccountFiscalRegion.initialize>;
      ProjectResource: ReturnType<typeof ProjectResource.initialize>;
      ProjectResourceFiscal: ReturnType<
        typeof ProjectResourceFiscal.initialize
      >;
      ProjectResourceFiscalRegion: ReturnType<
        typeof ProjectResourceFiscalRegion.initialize
      >;
      AccountDetails: ReturnType<typeof AccountDetails.initialize>;
    }
  > = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
    this.keyContactService = new KeyContactService();
  }

  get keyContacts() {
    return this.keyContactService;
  }

  private async getSequelize(): Promise<Sequelize> {
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
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const sequelize = await this.getSequelize();
    const mainDbSequelize = await this.getMainSequelize();

    const KeyContactModel = await KeyContact.initialize(sequelize, schemaName);
    const ProjectFiscalModel = await ProjectFiscal.initialize(
      sequelize,
      schemaName
    );
    const ProjectModel = await Project.initialize(sequelize, schemaName);

    const ProjectFiscalRegionModel = await ProjectFiscalRegion.initialize(sequelize, schemaName);

    const ProjectTimelineModel = await ProjectTimeline.initialize(
      sequelize,
      schemaName
    );

    const AccountDetailsModel = await AccountDetails.initialize(
      sequelize,
      schemaName
    );
    const AccountFiscalModel = await AccountFiscal.initialize(
      sequelize,
      schemaName
    );
    const AccountFiscalRegionModel = await AccountFiscalRegion.initialize(
      sequelize,
      schemaName
    );

    const ProjectHistoryModel = await ProjectHistory.initialize(
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

    const ProjectSummaryModel = await ProjectSummary.initialize(
      mainDbSequelize,
      ""
    );
    const ProjectFiscalSummaryModel = await ProjectFiscalSummary.initialize(
      mainDbSequelize,
      ""
    );

    const models = {
      Project: ProjectModel,
      ProjectFiscal: ProjectFiscalModel,
      ProjectTimeline: ProjectTimelineModel,
      KeyContact: KeyContactModel,
      ProjectSummary: ProjectSummaryModel,
      ProjectFiscalSummary: ProjectFiscalSummaryModel,
      AccountFiscal: AccountFiscalModel,
      AccountFiscalRegion: AccountFiscalRegionModel,
      ProjectHistory: ProjectHistoryModel,
      ProjectFiscalRegion: ProjectFiscalRegionModel,
      ProjectResource: ProjectResourceModel,
      ProjectResourceFiscal: ProjectResourceFiscalModel,
      ProjectResourceFiscalRegion: ProjectResourceFiscalRegionModel,
      AccountDetails: AccountDetailsModel,
    };
    this.modelCache.set(schemaName, models);
    return models;
  }

  async checkIfProjectExists(
    accountNumber: string,
    projectData: ICreateProject,
    accountData: any
  ): Promise<"none" | "project_exists" | "fiscal_exists"> {
    const { Project } = await this.getModels(accountNumber);

    const project = await Project.findOne({
      where: {
        [Op.and]: [
          where(
            fn("LOWER", col("project_code")),
            fn("LOWER", projectData.project_code)
          ),
          { account_rid: accountData.rid },
        ],
      },
    });

    if (!project) return "none";

    const fiscal = await this.checkIfProjectFiscalExists(
      accountNumber,
      projectData,
      accountData.rid
    );

    return fiscal ? "fiscal_exists" : "project_exists";
  }

  async checkIfProjectFiscalExists(
    accountNumber: string,
    projectData: any,
    accountId: string
  ) {
    const { ProjectFiscal } = await this.getModels(accountNumber);

    const fiscal = await ProjectFiscal.findOne({
      where: {
        [Op.and]: [
          where(
            fn("LOWER", col("project_code")),
            fn("LOWER", projectData.project_code)
          ),
          { account_rid: accountId },
          { fiscal_year: projectData.fiscal_year },
        ],
      },
    });

    return fiscal;
  }

  async checkIfProjectFiscalExistsOnUpdate(
    accountNumber: string,
    projectData: any,
    accountId: string,
    projectFiscalId: string
  ) {
    const { ProjectFiscal } = await this.getModels(accountNumber);

    const fiscal = await ProjectFiscal.findOne({
      where: {
        [Op.and]: [
          where(
            fn("LOWER", col("project_code")),
            fn("LOWER", projectData.project_code)
          ),
          { account_rid: accountId },
          { fiscal_year: projectData.fiscal_year },
          { rid: { [Op.ne]: projectFiscalId } },
        ],
      },
    });

    return fiscal;
  }

  async getProjectByCode(
    accountNumber: string,
    projectCode: string,
    accountRid: string
  ) {
    const { Project } = await this.getModels(accountNumber);

    return Project.findOne({
      where: {
        [Op.and]: [
          // Convert both the project_code column and input projectCode to lowercase for comparison
          where(fn("LOWER", col("project_code")), fn("LOWER", projectCode)),
          { account_rid: accountRid },
        ],
      },
    });
  }

  async addProjectFiscal(
    accountNumber: string,
    projectData: ICreateProject,
    projectId: string,
    userId: string
  ) {
    const { ProjectFiscal } = await this.getModels(accountNumber);

    const startDate = projectData.project_startdate
      ? moment.utc(projectData.project_startdate, "YYYY-MM-DD")
      : null;
    const endDate = projectData.project_enddate
      ? moment.utc(projectData.project_enddate, "YYYY-MM-DD")
      : null;

    const baseData = ProjectMapper.mapToProjectFiscalModel(
      projectData,
      projectId,
      startDate,
      endDate,
      userId
    );

    return ProjectFiscal.create({
      ...baseData,
      default_metric_type: "project",
    });
  }

  async addProjectFiscalRegion(
    accountNumber: string,
    projectData: ICreateProject,
    projectId: string,
    userId: string
  ) {
    const { ProjectFiscalRegion } = await this.getModels(accountNumber);

    const startDate = projectData.project_startdate
      ? moment.utc(projectData.project_startdate, "YYYY-MM-DD")
      : null;
    const endDate = projectData.project_enddate
      ? moment.utc(projectData.project_enddate, "YYYY-MM-DD")
      : null;

    const baseData = ProjectMapper.mapToProjectFiscalModel(
      projectData,
      projectId,
      startDate,
      endDate,
      userId
    );

    return ProjectFiscalRegion.create({
      ...baseData,
      default_metric_type: "project",
    });
  }

  async createProjectWithFiscal(
    accountNumber: string,
    projectData: ICreateProject,
    userId: string
  ) {
    const { Project } = await this.getModels(accountNumber);

    const startDate = projectData.project_startdate
      ? moment.utc(projectData.project_startdate, "YYYY-MM-DD")
      : null;
    const endDate = projectData.project_enddate
      ? moment.utc(projectData.project_enddate, "YYYY-MM-DD")
      : null;

    const baseData = ProjectMapper.mapToProjectModel(
      projectData,
      startDate,
      endDate,
      userId
    );

    const createdProject = await Project.create(baseData);

    return createdProject;
  }

  async updateProjectAggregatesFromFiscal(
    accountNumber: string,
    accountId: string,
    projectCode: string
  ) {
    const { Project, ProjectFiscal } = await this.getModels(accountNumber);

    const aggregates = await ProjectFiscal.findOne({
      attributes: [
        "project_code",
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_cost_prj, 0)")),
          "total_cost_prj",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_effort_prj, 0)")
          ),
          "total_effort_prj",
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
            Sequelize.literal("COALESCE(total_effort_fte_prj, 0)")
          ),
          "total_effort_fte_prj",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_effort_subcon_prj, 0)")
          ),
          "total_effort_subcon_prj",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_cost_fte_prj, 0)")
          ),
          "total_cost_fte_prj",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_cost_subcon_prj, 0)")
          ),
          "total_cost_subcon_prj",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_cost_nonlabor_prj, 0)")
          ),
          "total_cost_nonlabor_prj",
        ],
      ],
      where: { project_code: projectCode, account_rid: accountId },
      group: ["project_code"],
      raw: true,
    });

    if (!aggregates) return;

    // 2. Update Project table with aggregated totals
    await Project.update(
      {
        total_cost: aggregates.total_cost_prj,
        total_effort: aggregates.total_effort_prj,
        total_fte: aggregates.total_fte_prj,
        total_subcon: aggregates.total_subcon_prj,
        total_effort_fte: aggregates.total_effort_fte_prj,
        total_effort_subcon: aggregates.total_effort_subcon_prj,
        total_cost_fte: aggregates.total_cost_fte_prj,
        total_cost_subcon: aggregates.total_cost_subcon_prj,
        total_cost_nonlabor: aggregates.total_cost_nonlabor_prj,
      },
      {
        where: { project_code: projectCode, account_rid: accountId },
      }
    );
  }

  async updateProjectSummaryAggregatesFromFiscal(
    accountNumber: string,
    projectCode: string,
    accountId: string
  ) {
    const { ProjectSummary, ProjectFiscalSummary } = await this.getModels(
      accountNumber
    );

    const aggregates = await ProjectFiscalSummary.findOne({
      attributes: [
        "project_code",
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_cost_prj, 0)")),
          "total_cost_prj",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_effort_prj, 0)")
          ),
          "total_effort_prj",
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
            Sequelize.literal("COALESCE(total_cost_fte_prj, 0)")
          ),
          "total_cost_fte_prj",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_cost_subcon_prj, 0)")
          ),
          "total_cost_subcon_prj",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(total_cost_nonlabor_prj, 0)")
          ),
          "total_cost_nonlabor_prj",
        ],
      ],
      where: { project_code: projectCode, account_rid: accountId },
      group: ["project_code"],
      raw: true,
    });

    if (!aggregates) return;

    // 2. Update Project table with aggregated totals
    await ProjectSummary.update(
      {
        total_cost: aggregates.total_cost_prj,
        total_effort: aggregates.total_effort_prj,
        total_fte: aggregates.total_fte_prj,
        total_subcon: aggregates.total_subcon_prj,
        total_cost_fte: aggregates.total_cost_fte_prj,
        total_cost_subcon: aggregates.total_cost_subcon_prj,
        total_cost_nonlabor: aggregates.total_cost_nonlabor_prj,
      },
      {
        where: { project_code: projectCode, account_rid: accountId },
      }
    );
  }

  async addProjectTimeline(
    accountNumber: string,
    accountId: string,
    eventName: string,
    projectId: string,
    projectData: ICreateProject
  ) {
    const { ProjectTimeline } = await this.getModels(accountNumber);

    await ProjectTimeline.create({
      account_rid: accountId,
      event_name: eventName,
      event_status: "success",
      event_type: "ui handler",
      entity_rid: projectId,
      created_by: projectData.created_by,
    });
  }

  async manageKeyContacts(
    key_contacts: IKeyContactDetail,
    projectId: string,
    userId: string,
    schemaName: string
  ) {
    const { KeyContact } = await this.getModels(schemaName);
    for (const contact of Object.values(key_contacts)) {
      if (contact.action_type === "edit") {
        if (
          contact.key_contact_name ||
          contact.key_contact_email ||
          contact.key_contact_role_rid
        ) {
          this.keyContacts.updateKeyContactDetails(contact, userId, KeyContact);
        }
      } else if (contact.action_type === "delete") {
        {
          this.keyContacts.deleteKeyContactDetails(
            contact.rid,
            projectId,
            KeyContact
          );
        }
      } else if (contact.action_type === "add") {
        if (
          contact.key_contact_name ||
          contact.key_contact_email ||
          contact.key_contact_role_rid
        ) {
          this.keyContacts.insertKeyContactDetails(
            KeyContact,
            contact,
            projectId,
            userId
          );
        }
      }
    }
  }

  async addProjectSummary(
    accountNumber: string,
    projectData: any,
    project: any,
    startDate: Moment | null,
    endDate: Moment | null,
    keyContacts: any[]
  ) {
    const { ProjectSummary } = await this.getModels(accountNumber);

    const { technicalConsultant, projectPointOfContact,projectPointOfContactEmail } =
      await this.keyContactService.calculateKeyContactDetails(
        keyContacts,
        this.mainDbSequelize
      );

    const summaryData = ProjectMapper.mapToProjectSummary(
      projectData,
      project,
      startDate,
      endDate,
      technicalConsultant,
      projectPointOfContact,
      projectPointOfContactEmail
    );

    return await ProjectSummary.create(summaryData);
  }

  async addProjectFiscalSummary(
    accountNumber: string,
    projectData: any,
    projectFiscal: any,
    projectId: string,
    keyContacts: any[],
    projectFiscalId: string
  ) {
    const { ProjectFiscalSummary } = await this.getModels(accountNumber);

    const { technicalConsultant, projectPointOfContact } =
      await this.keyContactService.calculateKeyContactDetails(
        keyContacts,
        this.mainDbSequelize
      );

    const startDate = projectData.project_startdate
      ? moment.utc(projectData.project_startdate, "YYYY-MM-DD")
      : null;
    const endDate = projectData.project_enddate
      ? moment.utc(projectData.project_enddate, "YYYY-MM-DD")
      : null;

    const summaryData = ProjectMapper.mapToProjectFiscalSummary(
      projectData,
      projectFiscal,
      projectId,
      startDate,
      endDate,
      technicalConsultant,
      projectPointOfContact,
      projectFiscalId
    );

    await ProjectFiscalSummary.create(summaryData);
  }

  async addAccountFiscal(accountNumber: string, projectData: ICreateProject) {
    const { AccountFiscal } = await this.getModels(accountNumber);

    const accountFiscalData = ProjectMapper.mapToAccountFiscal(projectData);

    const account_rid = projectData.account_id;
    const fiscal_year = projectData.fiscal_year;

    if (!account_rid || !fiscal_year) {
      throw new Error(
        "Missing required account_rid or fiscal_year in project data."
      );
    }

    const existingFiscal = await AccountFiscal.findOne({
      where: {
        account_rid,
        fiscal_year,
      },
    });

    if (!existingFiscal) {
      await AccountFiscal.create({
        ...accountFiscalData,
        total_projects: 1,
        account_rid,
        fiscal_year,
        created_datetime: new Date(),
      });
    } else {
      await this.updateAccountFiscalAggregatesFromFiscal(
        accountNumber,
        projectData
      );
    }
  }

  async autoAssignToDefaultUserGroup(project_rid:string,account_rid: string,userId:string) {
    const autoAssignedChildGroup = await this.mainDbSequelize?.query<{ group_rid: string }>(
        `
        SELECT ug.rid AS group_rid
        FROM "${MAIN_SCHEMA_NAME}"."user_groups" ug
        JOIN "${MAIN_SCHEMA_NAME}"."user_group_account_mapping" ugam ON ug.rid = ugam.group_rid
        JOIN "${MAIN_SCHEMA_NAME}"."user_group_type" ugt ON ug.group_type_rid = ugt.rid
        WHERE ugam.account_rid = :account_rid
          AND ugt.type = 'AUTO_ASSIGNED_CHILD'
        `,
        {
          replacements: { account_rid },
          type: QueryTypes.SELECT
        }
      );

      const childGroupRid = autoAssignedChildGroup?.[0]?.group_rid;
       await this.mainDbSequelize?.query(
      `
      INSERT INTO "${MAIN_SCHEMA_NAME}"."user_group_entity_access" (
        group_rid, entity_type, entity_rid, access_type, created_by, created_datetime
      )
      VALUES (
        :group_rid, 'PROJECT', :entity_rid, 'INCLUDE', :created_by, NOW()
      )
      `,
      {
        replacements: {
          group_rid: childGroupRid,
          entity_rid: project_rid,
          created_by: userId,
        }
      }
    );
  }

  async addAccountFiscalRegion(accountNumber: string, projectData: ICreateProject){
    const { AccountFiscalRegion } = await this.getModels(accountNumber);

    const accountFiscalData = ProjectMapper.mapToAccountFiscal(projectData);

    const account_rid = projectData.account_id;
    const fiscal_year = projectData.fiscal_year;

    if (!account_rid || !fiscal_year) {
      throw new Error(
        "Missing required account_rid or fiscal_year in project data."
      );
    }

    const existingFiscal = await AccountFiscalRegion.findOne({
      where: {
        account_rid,
        fiscal_year,
        region_rid: projectData.region_rid,
      },
    });

    if (!existingFiscal) {
      await AccountFiscalRegion.create({
        ...accountFiscalData,
        region_rid: projectData.region_rid,
        total_projects: 1,
        account_rid,
        fiscal_year,
        created_datetime: new Date(),
      });
    } else {
      await this.updateAccountFiscalRegionAggregatesFromFiscal(
        accountNumber,
        projectData
      );
    }
  }

  async updateAccountFiscalAggregatesFromFiscal(
    accountNumber: string,
    projectData: ICreateProject
  ) {
    const { ProjectFiscal, AccountFiscal } = await this.getModels(
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
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(effective_effort, 0)")
          ),
          "effective_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(effective_cost, 0)")),
          "effective_cost",
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
      ],
      where: {
        account_rid: projectData.account_id,
        fiscal_year: projectData.fiscal_year,
      },
      group: ["account_rid", "fiscal_year"],
      raw: true,
    });

    if (!aggregates) return;

    // 2. Update Account fiscal table with aggregated totals
    await AccountFiscal.update(
      {
        total_projects: aggregates.total_projects,
        total_project_cost: aggregates.effective_cost,
        total_project_hours: aggregates.effective_effort,
        total_fte: aggregates.effective_total_fte,
        total_subcon: aggregates.effective_total_subcon,
        total_project_hours_fte: aggregates.effective_fte_effort,
        total_project_hours_subcon: aggregates.effective_subcon_effort,
        total_project_cost_fte: aggregates.effective_fte_cost,
        total_project_cost_subcon: aggregates.effective_subcon_cost,
        total_project_cost_nonlabor: aggregates.effective_nonlabor_cost,
      },
      {
        where: {
          account_rid: projectData.account_id,
          fiscal_year: projectData.fiscal_year,
        },
      }
    );
  }

  async updateAccountFiscalRegionAggregatesFromFiscal(
    accountNumber: string,
    projectData: ICreateProject
  ) {
    const { ProjectFiscalRegion, AccountFiscalRegion } = await this.getModels(
      accountNumber
    );

    const aggregates: any = await ProjectFiscalRegion.findOne({
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
          Sequelize.fn(
            "SUM",
            Sequelize.literal("COALESCE(effective_effort, 0)")
          ),
          "effective_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(effective_cost, 0)")),
          "effective_cost",
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
      ],
      where: {
        account_rid: projectData.account_id,
        fiscal_year: projectData.fiscal_year,
        region_rid: projectData.region_rid,
      },
      group: ["account_rid", "fiscal_year", "region_rid"],
      raw: true,
    });

    if (!aggregates) return;

    // 2. Update Account fiscal table with aggregated totals
    await AccountFiscalRegion.update(
      {
        total_projects: aggregates.total_projects,
        total_project_cost: aggregates.effective_cost,
        total_project_hours: aggregates.effective_effort,
        total_fte: aggregates.total_fte__prj,
        total_subcon: aggregates.total_subcon_prj,
        total_project_hours_fte: aggregates.total_effort_fte_prj,
        total_project_hours_subcon: aggregates.total_effort_subcon_prj,
        total_project_cost_fte: aggregates.total_cost_fte_prj,
        total_project_cost_subcon: aggregates.total_cost_subcon_prj,
        total_project_cost_nonlabor: aggregates.total_cost_nonlabor_prj,
      },
      {
        where: {
          account_rid: projectData.account_id,
          fiscal_year: projectData.fiscal_year,
          region_rid: projectData.region_rid,
        },
      }
    );
  }

  async updateAccountAggregatesFromAccountFiscal(
    accountNumber: string,
    accountId: string
  ) {
    const { AccountFiscal, Project } = await this.getModels(accountNumber);

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
    });

    if (!aggregates) return;

    const totalProjectCount = await Project.findAll({
      where: {
        account_rid: accountId,
      },
    });

    const query = `
      UPDATE ${MAIN_SCHEMA_NAME}.account
      SET total_projects = :total_projects,
          total_project_cost = :total_project_cost,
          total_project_hours = :total_project_hours
      WHERE rid = :account_rid
    `;

    await this.mainDbSequelize?.query(query, {
      replacements: {
        total_projects: totalProjectCount.length,
        total_project_cost: aggregates.total_project_cost,
        total_project_hours: aggregates.total_project_hours,
        account_rid: accountId,
      },
      type: "UPDATE",
    });
  }

  async updateProjectResources(
    accountNumber: string,
    projectData: IUpdateProject,
    existingProjectId: string,
    existingFiscalYear: number | null
  ) {
    const {
      ProjectResource,
      ProjectResourceFiscal,
      ProjectResourceFiscalRegion,
    } = await this.getModels(accountNumber);

    const shouldUpdateFiscalYear =
      existingFiscalYear &&
      projectData.fiscal_year &&
      existingFiscalYear !== projectData.fiscal_year;

    if (shouldUpdateFiscalYear) {
      await ProjectResource.update(
        {
          ...(shouldUpdateFiscalYear && {
            fiscal_year: projectData.fiscal_year,
          }),
        },
        {
          where: {
            project_rid: existingProjectId,
            account_rid: projectData.account_id,
          },
        }
      );
      await ProjectResourceFiscal.update(
        {
          ...(shouldUpdateFiscalYear && {
            fiscal_year: projectData.fiscal_year,
          }),
        },
        {
          where: {
            project_rid: existingProjectId,
            account_rid: projectData.account_id,
          },
        }
      );
      await ProjectResourceFiscalRegion.update(
        {
          ...(shouldUpdateFiscalYear && {
            fiscal_year: projectData.fiscal_year,
          }),
        },
        {
          where: {
            project_rid: existingProjectId,
            account_rid: projectData.account_id,
          },
        }
      );
    }
  }

  async updateProjectFiscal(
    accountNumber: string,
    projectData: IUpdateProject,
    existingProjectCode: string
  ) {
    const { ProjectFiscal, Project } = await this.getModels(accountNumber);

    const startDate =
      projectData.project_startdate !== null
        ? moment.utc(projectData.project_startdate, "YYYY-MM-DD")
        : null;
    const endDate =
      projectData.project_enddate !== null
        ? moment.utc(projectData.project_enddate, "YYYY-MM-DD")
        : null;

    const baseData = ProjectMapper.mapToProjectFiscalUpdateModel(
      projectData,
      startDate,
      endDate
    );

    const {
      total_cost_prj: effective_cost,
      total_effort_prj: effective_effort,
      total_fte_prj: effective_total_fte,
      total_subcon_prj: effective_total_subcon,
      total_effort_fte_prj: effective_fte_effort,
      total_effort_subcon_prj: effective_subcon_effort,
      total_cost_fte_prj: effective_fte_cost,
      total_cost_subcon_prj: effective_subcon_cost,
      total_cost_nonlabor_prj: effective_nonlabor_cost,
    } = baseData;

    await ProjectFiscal.update(baseData, {
      where: {
        rid: projectData.project_fiscal_id,
      },
    });

    await ProjectFiscal.update(
      {
        effective_cost,
        effective_effort,
        effective_total_fte,
        effective_total_subcon,
        effective_fte_effort,
        effective_subcon_effort,
        effective_fte_cost,
        effective_subcon_cost,
        effective_nonlabor_cost,
      },
      {
        where: {
          rid: projectData.project_fiscal_id,
          default_metric_type: "project",
          effective_metric_type: null,
        },
      }
    );

    if (
      existingProjectCode &&
      projectData.project_code &&
      existingProjectCode !== projectData.project_code
    ) {
      await ProjectFiscal.update(
        { project_code: projectData.project_code },
        {
          where: {
            project_code: existingProjectCode,
            account_rid: projectData.account_id,
          },
        }
      );

      await Project.update(
        { project_code: projectData.project_code },
        {
          where: {
            project_code: existingProjectCode,
            account_rid: projectData.account_id,
          },
        }
      );
    }
  }

  async updateProjectFiscalRegion(
    accountNumber: string,
    projectData: IUpdateProject,
    existingProjectCode: string
  ) {
    const { ProjectFiscalRegion , ProjectFiscal } = await this.getModels(accountNumber);

    const startDate = projectData.project_startdate
      ? moment.utc(projectData.project_startdate, "YYYY-MM-DD")
      : null;
    const endDate = projectData.project_enddate
      ? moment.utc(projectData.project_enddate, "YYYY-MM-DD")
      : null;

    const baseData = ProjectMapper.mapToProjectFiscalUpdateModel(
      projectData,
      startDate,
      endDate
    );

    const aggregates = await ProjectFiscal.findAll({
      where: {
        account_rid: projectData.account_id,
        project_code: projectData.project_code,
        fiscal_year: projectData.fiscal_year,
        default_metric_type: "project",
        effective_metric_type: null,
      },
      attributes: [
        [Sequelize.fn("SUM", Sequelize.col("total_cost_prj")), "effective_cost"],
        [Sequelize.fn("SUM", Sequelize.col("total_effort_prj")), "effective_effort"],
        [Sequelize.fn("SUM", Sequelize.col("total_fte_prj")), "effective_total_fte"],
        [Sequelize.fn("SUM", Sequelize.col("total_subcon_prj")), "effective_total_subcon"],
        [Sequelize.fn("SUM", Sequelize.col("total_effort_fte_prj")), "effective_fte_effort"],
        [Sequelize.fn("SUM", Sequelize.col("total_effort_subcon_prj")), "effective_subcon_effort"],
        [Sequelize.fn("SUM", Sequelize.col("total_cost_fte_prj")), "effective_fte_cost"],
        [Sequelize.fn("SUM", Sequelize.col("total_cost_subcon_prj")), "effective_subcon_cost"],
        [Sequelize.fn("SUM", Sequelize.col("total_cost_nonlabor_prj")), "effective_nonlabor_cost"],
      ],
      raw: true,
    });

    const aggregateValues = aggregates[0];

    const matchCriteria = {
      account_rid: projectData.account_id,
      project_code: projectData.project_code,
      fiscal_year: projectData.fiscal_year,
      default_metric_type: "project",
      effective_metric_type: null,
    };

    const existingRecord: any = await ProjectFiscalRegion.findOne({
      where: matchCriteria,
    });

    if (existingRecord) {
      // Aggregate values
      await existingRecord.update(aggregateValues);
    } else {
      // Create new record
      await ProjectFiscalRegion.create({
        ...baseData,
        account_rid: projectData.account_id,
        project_code: projectData.project_code,
        fiscal_year: projectData.fiscal_year,
        default_metric_type: "project",
        effective_metric_type: null,
        created_by: projectData.created_by,
        project_rid: projectData.project_fiscal_id, 

        effective_cost: baseData.total_cost_prj,
        effective_effort: baseData.total_effort_prj,
        effective_total_fte: baseData.total_fte_prj,
        effective_total_subcon: baseData.total_subcon_prj,
        effective_fte_effort: baseData.total_effort_fte_prj,
        effective_subcon_effort: baseData.total_effort_subcon_prj,
        effective_fte_cost: baseData.total_cost_fte_prj,
        effective_subcon_cost: baseData.total_cost_subcon_prj,
        effective_nonlabor_cost: baseData.total_cost_nonlabor_prj,
      });
    }

    // Handle project_code change if needed

    if (
      existingProjectCode &&
      projectData.project_code &&
      existingProjectCode !== projectData.project_code
    ) {
      await ProjectFiscalRegion.update(
        { project_code: projectData.project_code },
        {
          where: {
            project_code: existingProjectCode,
            account_rid: projectData.account_id,
          },
        }
      );
    }

    await this.clearRemovedRegionAggregates(
      accountNumber,
      projectData
    );
  }

  async clearRemovedRegionAggregates(
    accountNumber: string,
    projectData: IUpdateProject
  ) {
    const { ProjectFiscal, ProjectFiscalRegion } = await this.getModels(
      accountNumber
    );
  
    const regionsInUse = await ProjectFiscal.findAll({
      attributes: ["region_rid"],
      where: {
        account_rid: projectData.account_id,
        project_code: projectData.project_code,
        fiscal_year: projectData.fiscal_year,
        region_rid: { [Op.ne]: null },
      },
      group: ["region_rid"],
    });
  
    const activeRegionIds = regionsInUse
      .map((r) => r.region_rid)
      .filter((id): id is string => typeof id === "string");
  
    await ProjectFiscalRegion.destroy({
      where: {
        account_rid: projectData.account_id,
        project_code: projectData.project_code,
        fiscal_year: projectData.fiscal_year,
        region_rid: {
          [Op.notIn]: activeRegionIds.length > 0 ? activeRegionIds : ["__none__"] 
        },
        default_metric_type: "project",
        effective_metric_type: null,
      },
    });
  }

  async updateProjectHistory(
    accountNumber: string,
    projectData: IUpdateProject,
    existingProjectData: any
  ) {
    const { ProjectHistory } = await this.getModels(accountNumber);

    const excludedFields = [
      "created_by",
      "modified_by",
      "account_rid",
      "modified_datetime",
    ];

    const startDate =
      projectData.project_startdate !== null
        ? moment.utc(projectData.project_startdate, "YYYY-MM-DD")
        : null;
    const endDate =
      projectData.project_enddate !== null
        ? moment.utc(projectData.project_enddate, "YYYY-MM-DD")
        : null;

    const newProjectData = ProjectMapper.mapToProjectFiscalUpdateModel(
      projectData,
      startDate,
      endDate
    );

    const cleanedNewData = Object.fromEntries(
      Object.entries(newProjectData).filter(
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
        project_rid: projectData.project_fiscal_id,
        attribute_name: key,
        old_value:
          existingProjectData[key] !== null &&
          existingProjectData[key] !== undefined
            ? String(existingProjectData[key])
            : "",
        new_value:
          newValue !== null && newValue !== undefined ? String(newValue) : "",
        created_by: newProjectData["modified_by"] || "",
      }));

    if (historyChanges.length === 0) return;

    await ProjectHistory.bulkCreate(historyChanges);
  }

  async fetchProjectFiscalById(accountNumber: string, projectFiscalId: string) {
    const { ProjectFiscal } = await this.getModels(accountNumber);

    const fiscalDataById = await ProjectFiscal.findOne({
      where: {
        rid: projectFiscalId,
      },
    });

    return fiscalDataById;
  }

  async updateProjectFiscalSummary(
    accountNumber: string,
    projectData: any,
    existingProjectCode: any
  ) {
    const { ProjectFiscalSummary, ProjectSummary } = await this.getModels(
      accountNumber
    );

    const { technicalConsultant, projectPointOfContact } =
      await this.keyContactService.calculateKeyContactDetails(
        projectData.key_contacts,
        this.mainDbSequelize
      );

    const startDate = projectData.project_startdate
      ? moment.utc(projectData.project_startdate, "YYYY-MM-DD")
      : null;
    const endDate = projectData.project_enddate
      ? moment.utc(projectData.project_enddate, "YYYY-MM-DD")
      : null;

    const baseData = ProjectMapper.mapToProjectFiscalSummaryUpdate(
      projectData,
      startDate,
      endDate,
      technicalConsultant,
      projectPointOfContact
    );

    await ProjectFiscalSummary.update(baseData, {
      where: {
        project_fiscal_rid: projectData.project_fiscal_id,
      },
    });

    if (
      existingProjectCode &&
      projectData.project_code &&
      existingProjectCode !== projectData.project_code
    ) {
      await ProjectFiscalSummary.update(
        { project_code: projectData.project_code },
        {
          where: {
            project_code: existingProjectCode,
            account_rid: projectData.account_id,
          },
        }
      );

      await ProjectSummary.update(
        { project_code: projectData.project_code },
        {
          where: {
            project_code: existingProjectCode,
            account_rid: projectData.account_id,
          },
        }
      );
    }
  }

  async fetchProjectList(
    accountNumber: string,
    accountData: any,
    filters: Record<string, any> = {},
    fiscalYear: number,
    offset: number,
    limit: number,
    order: string[][],
    bothParentAndChild: boolean,
    rawFilters: Record<string, any> = {},
    finalMetaDataSortBy: string,
    finalMetaDataSortOrder: string,
    graphqlData: any,
    accessibleIds: string[]
  ) {
    const { Project, ProjectFiscal } = await this.getModels(accountNumber);

    const parentLevelFields = [
      "project_name",
      "industry_name",
      "classification_name",
      "project_type_rid",
      "technical_point_of_contact",
      "financial_consultant",
      "project_point_of_contact",
      "account_name",
      "project_code",
      "project_client_group",
      "project_group",
      "total_effort",
      "total_cost",
      "total_cost_fte",
      "total_cost_subcon",
      "total_cost_nonlabor",
      "assessment_status",
      "qre",
      "project_point_of_contact",
      "technical_point_of_contact",
      "comments",
      "modified_datetime",
      "r_number",
    ];

    const fiscalFieldMap: Record<string, string> = {
      total_cost: "total_cost_prj",
      total_cost_fte: "total_cost_fte_prj",
      total_cost_subcon: "total_cost_subcon_prj",
      total_cost_nonlabor: "total_cost_nonlabor_prj",
      total_effort: "total_effort_prj",
      total_fte: "total_fte_prj",
      modified_datetime: "modified_datetime",
      assessment_status: "assessment_status",
      qre_final: "qre_final",
      r_number: "r_number",
      comments: "comments",
      project_group: "project_group",
      project_client_group: "project_client_group",
      fiscal_year: "fiscal_year",
      project_type_rid: "project_type_rid",
      project_name: "project_name",
      project_code: "project_code",
    };

    const childOnlyFilters = ["fiscal_year", "project_code"];
    let isChildOnlyFilter: boolean = false;

    const parentFilters: Record<string, any> = {};

    for (const key in filters) {
      if (parentLevelFields.includes(key)) {
        parentFilters[key] = filters[key];
      }
      if (childOnlyFilters.includes(key)) {
        isChildOnlyFilter = true;
      }
    }

    let whereProject: Record<string, any>;
    let whereFiscal: Record<string, any>;
    let projectData: any;
    const fullOrder: any[] = [];
    let totalCount: number = 0;
    if (graphqlData.type == "graphql") {
      whereProject = {
        account_rid: accountData.rid,
        ...(bothParentAndChild ? parentFilters : {}),
        rid: graphqlData.project_rid,
      };
      whereFiscal = {
        account_rid: accountData.rid,
      };

      projectData = await Project.findAll({
        where: whereProject,
        subQuery: false,
        order: fullOrder,
        attributes: {
          include: [
            ["account_rid", "account_id"],
            ["rid", "project_rid"],
          ],
        },
        include: [
          {
            model: ProjectFiscal,
            as: "ProjectFiscal",
            required: false,
            where: {
              account_rid: accountData.rid,
              ...whereFiscal,
            },
            attributes: {
              include: [
                ["rid", "project_fiscal_rid"],
                ["total_fte_prj", "total_fte"],
                ["total_effort_prj", "total_effort"],
                ["total_cost_prj", "total_cost"],
                ["total_cost_fte_prj", "total_cost_fte"],
                ["total_cost_subcon_prj", "total_cost_subcon"],
                ["total_cost_nonlabor_prj", "total_cost_nonlabor"],
              ],
            },
          },
        ],
      });
    } else {
      whereProject = {
        account_rid: accountData.rid,
        ...(bothParentAndChild ? parentFilters : {}),
        ...(accessibleIds.length > 0 ? { rid: accessibleIds } : {}),
      };
      whereFiscal = {
        account_rid: accountData.rid,
      };
      
      for (const key in filters) {
        const dbField = fiscalFieldMap[key];
        if (dbField) {
          whereFiscal[dbField] = filters[key];
        }
    }
      if (fiscalYear) {
        whereFiscal.fiscal_year = fiscalYear;
      }
      
          for (const [field, direction] of order) {
      const sortDirection = direction.toUpperCase() === "DESC" ? "DESC" : "ASC";
      const nullsHandled = `${sortDirection} NULLS LAST`;

      if (bothParentAndChild) {
        if (parentLevelFields.includes(field)) {
          fullOrder.push([
            Sequelize.literal(`"Project"."${field}" ${nullsHandled}`),
          ]);
        }
        if (field === "created_datetime") {
          fullOrder.push([
            Sequelize.literal(`"Project"."created_datetime" ${nullsHandled}`),
          ]);
        }
      } else {
        if (field === "created_datetime") {
          fullOrder.push([
            Sequelize.literal(`"Project"."project_code" ${nullsHandled}`),
          ]);
        } else {
          fullOrder.push([
            Sequelize.literal(`"Project"."project_code" ASC NULLS LAST`),
          ]);
        }
      }

      const aliasFilter =
        fiscalFieldMap[field] !== undefined ? fiscalFieldMap[field] : field;

      fullOrder.push([
        Sequelize.literal(`"ProjectFiscal"."${aliasFilter}" ${nullsHandled}`),
      ]);
    }
      projectData = await Project.findAll({
        where: whereProject,
        offset,
        limit,
        subQuery: false,
        order: fullOrder,
        attributes: {
          include: [
            ["account_rid", "account_id"],
            ["rid", "project_rid"],
          ],
        },
        include: [
          {
            model: ProjectFiscal,
            as: "ProjectFiscal",
            required: false,
            where: {
              account_rid: accountData.rid,
              ...whereFiscal,
            },
            attributes: {
              include: [
                ["rid", "project_fiscal_rid"],
                ["total_fte_prj", "total_fte"],
                ["total_effort_prj", "total_effort"],
                ["total_cost_prj", "total_cost"],
                ["total_cost_fte_prj", "total_cost_fte"],
                ["total_cost_subcon_prj", "total_cost_subcon"],
                ["total_cost_nonlabor_prj", "total_cost_nonlabor"],
              ],
            },
          },
        ],
      });
    }

    // const whereFiscal: Record<string, any> = {
    //   account_rid: accountData.rid,
    // };

    let projects = projectData;

    const count = await Project.count({
      where: whereProject,
      include: [
        {
          model: ProjectFiscal,
          as: "ProjectFiscal",
          required: false,
          where: {
            account_rid: accountData.rid,
            ...whereFiscal,
          },
        },
      ],
      distinct: true,
    });

    if (this.mainDbSequelize) {
      let projectData = await this.enrichKeyContactsManually(
        projects,
        accountNumber
      );

      projectData = await this.keyContacts.insertKeyRole(
        projectData,
        this.mainDbSequelize
      );

      projectData = await this.insertCurrencyDetails(projectData);

      projectData = await this.insertProjectClassification(
        projectData,
        this.mainDbSequelize
      );

      projectData = await this.finalProjectSort(
        projectData,
        finalMetaDataSortBy,
        finalMetaDataSortOrder,
        bothParentAndChild,
        rawFilters
      );
      projects = projectData;

      totalCount = count;
      if (projects && projects.length > 0 && !bothParentAndChild) {
        projects = projects.filter((val: any) => val.ProjectFiscal.length > 0);
        if (totalCount > projects.length) {
          totalCount = projects.length;
        }
      }

      if (isChildOnlyFilter && bothParentAndChild) {
        projects = projects.filter((val: any) => val.ProjectFiscal.length > 0);
        if (totalCount > projects.length) {
          totalCount = projects.length;
        }
      }

      if (bothParentAndChild) {
        if (totalCount > projects.length) {
          totalCount = projects.length;
        }
      }
    }

    return {
      projects,
      count: totalCount,
    };
  }

  async fetchProjectListExport(
    accountNumber: string,
    accountData: any,
    filters: Record<string, any> = {},
    fiscalYear: number,
    order: string[][],
    bothParentAndChild: boolean,
    rawFilters: Record<string, any> = {},
    finalMetaDataSortBy: string,
    finalMetaDataSortOrder: string,
    timezone: string,
    userId: string,
    accessibleIds: string[]
  ) {
    const { Project, ProjectFiscal } = await this.getModels(accountNumber);

    const parentLevelFields = [
      "project_name",
      "industry_name",
      "classification_name",
      "project_type_rid",
      "technical_point_of_contact",
      "financial_consultant",
      "project_point_of_contact",
      "account_name",
      "project_code",
      "project_client_group",
      "project_group",
      "total_effort",
      "total_cost",
      "total_cost_fte",
      "total_cost_subcon",
      "total_cost_nonlabor",
      "assessment_status",
      "qre",
      "project_point_of_contact",
      "technical_point_of_contact",
      "comments",
      "modified_datetime",
      "r_number",
    ];

    const fiscalFieldMap: Record<string, string> = {
      total_cost: "total_cost_prj",
      total_cost_fte: "total_cost_fte_prj",
      total_cost_subcon: "total_cost_subcon_prj",
      total_cost_nonlabor: "total_cost_nonlabor_prj",
      total_effort: "total_effort_prj",
      total_fte: "total_fte_prj",
      modified_datetime: "modified_datetime",
      assessment_status: "assessment_status",
      qre_final: "qre_final",
      r_number: "r_number",
      comments: "comments",
      project_group: "project_group",
      project_client_group: "project_client_group",
      fiscal_year: "fiscal_year",
      project_type_rid: "project_type_rid",
      project_name: "project_name",
      project_code: "project_code",
    };

    const childOnlyFilters = ["fiscal_year", "project_code"];
    let isChildOnlyFilter: boolean = false;

    const parentFilters: Record<string, any> = {};

    for (const key in filters) {
      if (parentLevelFields.includes(key)) {
        parentFilters[key] = filters[key];
      }
      if (childOnlyFilters.includes(key)) {
        isChildOnlyFilter = true;
      }
    }

    const whereProject: Record<string, any> = {
      account_rid: accountData.rid,
      ...(bothParentAndChild ? parentFilters : {}),
      ...(accessibleIds.length > 0 ? { rid: accessibleIds } : {}),
    };

    const whereFiscal: Record<string, any> = {
      account_rid: accountData.rid,
    };

    for (const key in filters) {
      const dbField = fiscalFieldMap[key];
      if (dbField) {
        whereFiscal[dbField] = filters[key];
      }
    }

    if (fiscalYear) {
      whereFiscal.fiscal_year = fiscalYear;
    }

    const fullOrder: any[] = [];

    for (const [field, direction] of order) {
      const sortDirection = direction.toUpperCase() === "DESC" ? "DESC" : "ASC";
      const nullsHandled = `${sortDirection} NULLS LAST`;

      if (bothParentAndChild) {
        if (parentLevelFields.includes(field)) {
          fullOrder.push([
            Sequelize.literal(`"Project"."${field}" ${nullsHandled}`),
          ]);
        }
      } else {
        fullOrder.push([
          Sequelize.literal(`"Project"."project_code" ASC NULLS LAST`),
        ]);
      }

      const aliasFilter =
        fiscalFieldMap[field] !== undefined ? fiscalFieldMap[field] : field;

      fullOrder.push([
        Sequelize.literal(`"ProjectFiscal"."${aliasFilter}" ${nullsHandled}`),
      ]);
    }

    let projects = await Project.findAll({
      where: whereProject,
      order: fullOrder,
      include: [
        {
          model: ProjectFiscal,
          as: "ProjectFiscal",
          required: false,
          where: {
            account_rid: accountData.rid,
            ...whereFiscal,
          },
          attributes: [
            "rid",
            "r_number",
            "project_rid",
            "eid",
            "created_datetime",
            "modified_datetime",
            "created_by",
            "modified_by",
            "project_code",
            "industry_rid",
            "industry_name",
            "fiscal_year",
            "project_name",
            "program_name",
            "project_type_rid",
            "project_classification_rid",
            "project_classification_other",
            "project_client_group",
            "project_group",
            "auto_send_ai_interaction",
            "account_rid",
            "country_rid",
            "region_rid",
            "currency_rid",
            "max_ai_interaction",
            "expiry_duration",
            "auto_access_rd",
            "status_rid",
            "project_startdate",
            "project_enddate",
            "qre_final",
            "comments",
            ["total_fte_prj", "total_fte"],
            "total_subcon_prj",
            "total_nonlabor_prj",
            ["total_effort_prj", "total_effort"],
            ["total_cost_prj", "total_cost"],
            ["total_cost_fte_prj", "total_cost_fte"],
            ["total_cost_subcon_prj", "total_cost_subcon"],
            ["total_cost_nonlabor_prj", "total_cost_nonlabor"],
          ],
        },
      ],
    });

    if (this.mainDbSequelize) {
      let projectData = await this.enrichKeyContactsManually(
        projects,
        accountNumber
      );

      projectData.forEach((e) => {
        e.account_name = accountData.account_name;
        e.ProjectFiscal.forEach((val: any) => {
          val.account_name = accountData.account_name;
        });
      });

      projectData = await this.keyContacts.insertKeyRole(
        projectData,
        this.mainDbSequelize
      );

      projectData = await this.insertCurrencyDetails(projectData);

      projectData = await this.insertProjectClassification(
        projectData,
        this.mainDbSequelize
      );

      projectData = await this.finalProjectSort(
        projectData,
        finalMetaDataSortBy,
        finalMetaDataSortOrder,
        bothParentAndChild,
        rawFilters
      );
      projects = projectData;

      if (projects && projects.length > 0 && !bothParentAndChild) {
        projects = projects.filter((val: any) => val.ProjectFiscal.length > 0);
      }

      if (isChildOnlyFilter && bothParentAndChild) {
        projects = projects.filter((val: any) => val.ProjectFiscal.length > 0);
      }
    }

    const formatNumberForExport = (
      value: any,
      currency_symbol: string
    ): string => {
      if (value == null || value === "") return "-";
      const num = Number(value);
      if (isNaN(num)) return "-";
      return currency(num, {
        symbol: currency_symbol ? currency_symbol : "$",
        precision: 2,
        pattern: "! #",
        separator: ",",
        decimal: ".",
      }).format();
    };

    const rawResult = projects || [];
    const schemaService = new SchemaService();
     const allowedFieldsForExport = await schemaService.getAllowedExportFields(userId,"projects_view_edit");
        const allowedFieldSet = new Set<string>();
        for (const field of allowedFieldsForExport) {
          if (field.read) {
            allowedFieldSet.add(field.field_desc);
          }
        }
        const labelMap: Record<string, string> = {
        "Project Code": "Project Code",
        "Project Name": "Name",
        "Project Type": "Project Type",
        "Account Name": "Name",
        "Fiscal Year": "Fiscal Year",
        "Project Classification": "Classification",
        "Customer Group": "Client Group",
        "Project Group": "Project Group",
        "Project Effort (Hours)": "Total Effort In Hrs",
        "Project Cost": "Total Cost",
        "FTE Cost": "Total FTE Cost",
        "SubCon Cost": "Total Sub Con Cost",
        "Non-Labor Cost": "Total Non Labor Cost",
        "Assessment Status": "Assessment Status",
        "QRE%": "QRE %",
        "QRE": "QRE",
        "Project Point of Contact": "Key Contacts List",
        "Technical Point of Contact": "Key Contacts List",
        "Comments": "Comments",
        "Last Modified": "Updated On",
        "Project ID": "Project ID",
      };


    let exportData = rawResult.flatMap((project: any) => {
      const baseRow = {
        "Project Code": project.project_code || "-",
        Name: project.project_name || "-",
        "Project Type": project.project_type_name || "-",
        "Account Name": project.account_name || "-",
        "Fiscal Year": project.fiscal_year || "-",
        "Project Classification": project.classification_name || "-",
        "Customer Group": project.project_client_group || "-",
        "Project Group": project?.project_group || "-",
        "Project Effort (Hours)": project.total_effort || "-",
        "Project Cost":
          formatNumberForExport(project.total_cost, project.currency_symbol) ||
          "-",
        "FTE Cost":
          formatNumberForExport(
            project.total_cost_fte,
            project.currency_symbol
          ) || "-",
        "SubCon Cost":
          formatNumberForExport(
            project.total_cost_subcon,
            project.currency_symbol
          ) || "-",
        "Non-Labor Cost":
          formatNumberForExport(
            project.total_cost_nonlabor,
            project.currency_symbol
          ) || "-",
        "Assessment Status": project.assessment_status || "-",
        "QRE %": project.qre || "-",
        QRE:
          formatNumberForExport(
            project.qualified_research_expenditure,
            project.currency_symbol
          ) || "-",
        "Project Point of Contact": project.project_point_of_contact || "-",
        "Technical Point of Contact": project.technical_point_of_contact || "-",
        Comments: project.comments || "-",
        "Last Modified": project.modified_datetime
          ? timezone && isValidTimezone(timezone)
            ? moment(project.modified_datetime)
                .tz(timezone)
                .format("YYYY-MM-DD, hh:mm:ss A")
            : moment(project.modified_datetime).format("YYYY-MM-DD, hh:mm:ss A")
          : "-",
        "Project ID": project.r_number || "-",
      };
       const filteredProjectRow: Record<string, string> = {};
        for (const [label, value] of Object.entries(baseRow)) {
    
          const mappedLabel = labelMap[label] || label;
          if (allowedFieldSet.has(mappedLabel)) {
            filteredProjectRow[label] = value; // Keep original label for export
          }
        }

      const fiscalSummaries = project.ProjectFiscal || [];

     const fiscalRows = fiscalSummaries.map((fiscal: any) => {
      const rawFiscalRow = {
        "Project Code": fiscal.project_code ? fiscal.project_code + ' - FY' + fiscal.fiscal_year : "-",
        "Name": fiscal.project_name || "-",
        "Project Type": fiscal.project_type_name || "-",
        "Account Name": project.account_name || "-",
        "Fiscal Year": `FY-${fiscal.fiscal_year}` || "-",
        "Project Classification": fiscal.classification_name || "-",
        "Customer Group": fiscal.project_client_group || "-",
        "Project Group": fiscal?.project_group || "-",
        "Project Effort (Hours)": fiscal.total_effort || "-",
        "Project Cost": formatNumberForExport(fiscal.total_cost, fiscal.currency_symbol) || "-",
        "FTE Cost": formatNumberForExport(fiscal.total_cost_fte, fiscal.currency_symbol) || "-",
        "SubCon Cost": formatNumberForExport(fiscal.total_cost_subcon, fiscal.currency_symbol) || "-",
        "Non-Labor Cost": formatNumberForExport(fiscal.total_cost_nonlabor, fiscal.currency_symbol) || "-",
        "Assessment Status": fiscal.assessment_status || "-",
        "QRE %": "-", // Only base project has QRE %
        "QRE": formatNumberForExport(fiscal.qre_final, project.currency_symbol) || "-",
        "Project Point of Contact": fiscal.project_point_of_contact || "-",
        "Technical Point of Contact": fiscal.technical_point_of_contact || "-",
        "Comments": fiscal.comments || "-",
        "Last Modified": fiscal.modified_datetime
          ? timezone && isValidTimezone(timezone)
            ? moment(fiscal.modified_datetime).tz(timezone).format('YYYY-MM-DD, hh:mm:ss A')
            : moment(fiscal.modified_datetime).format('YYYY-MM-DD, hh:mm:ss A')
          : '-',
        "Project ID": fiscal.r_number || "-",
      };

    const filteredFiscalRow: Record<string, string> = {};
    for (const [label, value] of Object.entries(rawFiscalRow)) {
      const mappedLabel = labelMap[label] || label;
      if (allowedFieldSet.has(mappedLabel)) {
        filteredFiscalRow[label] = value; // keep original label for export
      }
    }

    return filteredFiscalRow;
});


      return [filteredProjectRow, ...fiscalRows];
    });

    return {
      exportData,
      count: exportData.length,
    };
  }

  async fetchAccountDetailsById(accountNumber: string, accountId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.getSequelize();
    }

    const accountDetails = await this.orgDbSequelize.query(
      `select * from ${schemaName}.account_details where account_rid = :accountId`,
      {
        replacements: { accountId },
        type: "SELECT",
      }
    );

    return accountDetails;
  }

  async fetchProjectById(accountNumber: string, projectId: string) {
    const { ProjectFiscal } = await this.getModels(accountNumber);

    let projectData = await ProjectFiscal.findOne({
      where: {
        rid: projectId,
      },
      attributes: {
        include: [
          ["total_fte_prj", "total_fte"],
          ["total_subcon_prj", "total_subcon"],
          ["total_cost_prj", "total_cost"],
          ["total_effort_prj", "total_effort"],
          ["total_effort_fte_prj", "total_effort_fte"],
          ["total_effort_subcon_prj", "total_effort_subcon"],
          ["total_cost_fte_prj", "total_cost_fte"],
          ["total_cost_subcon_prj", "total_cost_subcon"],
          ["total_cost_nonlabor_prj", "total_cost_nonlabor"],
          ["country_rid", "country"],
          ["region_rid", "region"],
          ["currency_rid", "currency"],
        ],
      },
    });

    return projectData;
  }

  async fetchProjectInfoById(accountNumber: string, projectId: string) {
    const { ProjectFiscal } = await this.getModels(accountNumber);

    const projectData = await ProjectFiscal.findOne({
      where: {
        rid: projectId,
      },
      attributes: ["rid", "project_code"],
    });

    return projectData;
  }

  async fetchProjectResourceById(
    accountNumber: string,
    projectResourceId: string
  ) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = `
    SELECT rid,r_number 
    FROM "${schemaName}".project_resource
    WHERE rid = :projectResourceId
  `;

    const sequelize = await this.getSequelize();
    const result = await sequelize.query(query, {
      replacements: { projectResourceId },
      type: "SELECT",
      raw: true,
    });

    return result[0];
  }

  async fetchProjectTaskById(accountNumber: string, projectTaskId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = `
    SELECT rid,r_number 
    FROM "${schemaName}".project_task
    WHERE rid = :projectTaskId
  `;

    const sequelize = await this.getSequelize();
    const result = await sequelize.query(query, {
      replacements: { projectTaskId },
      type: "SELECT",
      raw: true,
    });

    return result[0];
  }

  async fetchResourceById(accountNumber: string, resourceId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = `
    SELECT rid,resource_code 
    FROM "${schemaName}".resources
    WHERE rid = :resourceId
  `;

    const sequelize = await this.getSequelize();
    const result = await sequelize.query(query, {
      replacements: { resourceId },
      type: "SELECT",
      raw: true,
    });

    return result[0];
  }

  async fetchResourceCostById(accountNumber: string, resourceCostId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = `
    SELECT rid,r_number 
    FROM "${schemaName}".resource_cost
    WHERE rid = :resourceCostId
  `;

    const sequelize = await this.getSequelize();
    const result = await sequelize.query(query, {
      replacements: { resourceCostId },
      type: "SELECT",
      raw: true,
    });

    return result[0];
  }

  async fetchResourceSkillById(accountNumber: string, resourceSkillId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = `
    SELECT rid,r_number 
    FROM "${schemaName}".resource_skill
    WHERE rid = :resourceSkillId
  `;

    const sequelize = await this.getSequelize();
    const result = await sequelize.query(query, {
      replacements: { resourceSkillId },
      type: "SELECT",
      raw: true,
    });

    return result[0];
  }

  async insertProjectClassification(
    projects: any[],
    mainDbSequelize: Sequelize
  ) {
    try {
      const allClassificationIds = new Set<string>();
      const allProjectTypeIds = new Set<string>();
      const allStatusIds = new Set<string>();

      for (const project of projects) {
        if (project.project_classification_rid) {
          allClassificationIds.add(project.project_classification_rid);
        }
        if (project.project_type_rid) {
          allProjectTypeIds.add(project.project_type_rid);
        }
        if (project.status_rid) {
          allStatusIds.add(project.status_rid);
        }

        if (Array.isArray(project.ProjectFiscal)) {
          for (const child of project.ProjectFiscal) {
            if (child.project_classification_rid) {
              allClassificationIds.add(child.project_classification_rid);
            }
            if (child.project_type_rid) {
              allProjectTypeIds.add(child.project_type_rid);
            }
            if (child.status_rid) {
              allStatusIds.add(child.status_rid);
            }
          }
        }
      }

      const classificationIds = [...allClassificationIds];
      const projectTypeIds = [...allProjectTypeIds];
      const statusTypeIds = [...allStatusIds];

      let classificationMap: Record<string, any> = {};
      let projectTypeMap: Record<string, any> = {};
      let statusMap: Record<string, any> = {};

      if (classificationIds.length > 0) {
        const classificationRows = await mainDbSequelize.query(
          `SELECT rid, classification_name FROM ${MAIN_SCHEMA_NAME}.project_classification WHERE rid IN (:ids)`,
          {
            replacements: { ids: classificationIds },
            type: "SELECT",
          }
        );

        classificationMap = Object.fromEntries(
          (Array.isArray(classificationRows) ? classificationRows : []).map(
            (c: any) => [c.rid, c]
          )
        );
      }
      if (projectTypeIds.length > 0) {
        const projectTypeList = await mainDbSequelize.query(
          `SELECT rid, project_type_name FROM ${MAIN_SCHEMA_NAME}.project_type WHERE rid IN (:ids)`,
          {
            replacements: { ids: projectTypeIds },
            type: "SELECT",
          }
        );

        projectTypeMap = Object.fromEntries(
          (Array.isArray(projectTypeList) ? projectTypeList : []).map(
            (c: any) => [c.rid, c]
          )
        );
      }

      if (statusTypeIds.length > 0) {
        const statusTypeList = await mainDbSequelize.query(
          `SELECT rid, status_name FROM ${MAIN_SCHEMA_NAME}.status WHERE rid IN (:ids)`,
          {
            replacements: { ids: statusTypeIds },
            type: "SELECT",
          }
        );

        statusMap = Object.fromEntries(
          (Array.isArray(statusTypeList) ? statusTypeList : []).map(
            (c: any) => [c.rid, c]
          )
        );
      }

      const updatedProjects = projects.map((project) => {
        const updatedProject: any = {
          ...(typeof project.toJSON === "function"
            ? project.toJSON()
            : project),
          classification_name:
            classificationMap[project.project_classification_rid]
              ?.classification_name || null,
          is_other_classification: !!project.project_classification_other,
          project_type_name:
            projectTypeMap[project.project_type_rid]?.project_type_name || null,
          status_name: statusMap[project.status_rid]?.status_name,
        };

        if (Array.isArray(project.ProjectFiscal)) {
          updatedProject.ProjectFiscal = project.ProjectFiscal.map(
            (child: any) => ({
              ...(typeof child.toJSON === "function" ? child.toJSON() : child),
              classification_name:
                classificationMap[child.project_classification_rid]
                  ?.classification_name || null,
              is_other_classification: !!child.project_classification_other,
              project_type_name:
                projectTypeMap[child.project_type_rid]?.project_type_name ||
                null,
              status_name: statusMap[project.status_rid]?.status_name,
            })
          );
        }

        return updatedProject;
      });

      return updatedProjects;
    } catch (err) {
      throw new Error(
        "Error fetching classification: " + (err as Error).message
      );
    }
  }

  async finalProjectSort(
    projects: any[],
    sortBy: string,
    sortOrder: string,
    isBoth: boolean,
    filters?: Record<string, any>
  ): Promise<any[]> {
    const filterableClientFields = [
      "account_name",
      "country_rid",
      "region_rid",
      "currency_rid",
      "technical_point_of_contact",
      "financial_consultant",
      "project_point_of_contact",
      "classification_name",
      "industry_name",
      "name",
      "project_type_rid",
      "project_type_name",
    ];

    const enumFields = [
      "country_rid",
      "currency_rid",
      "region_rid",
      "classification_name",
      "project_type_rid",
    ];

    const hasValidFilters = filterableClientFields.some((key) => {
      const f = filters?.[key];
      return (
        f &&
        Object.keys(f).some(
          (k) => f[k] !== undefined && f[k] !== null && f[k] !== ""
        )
      );
    });

    const matchFilter = (record: any, key: string, filter: any) => {
      const value = record[key];
      const isEnumField = enumFields.includes(key);

      if (isEnumField) {
        if (key === "classification_name") {
          if (filter.equals !== undefined) {
            if (filter.equals === "Other") {
              return record.is_other_classification === true;
            } else {
              return (
                !record.is_other_classification &&
                record.classification_name === filter.equals
              );
            }
          }
          if (filter.not_equals !== undefined) {
            if (filter.not_equals === "Other") {
              return !record.is_other_classification;
            } else {
              return (
                record.is_other_classification === true ||
                record.classification_name === null ||
                (record.is_other_classification === false &&
                  record.classification_name !== filter.not_equals)
              );
            }
          }
          if (filter.is_empty === true) {
            return value === null || value === "";
          }
          if (Array.isArray(filter.in)) {
            const containsOther = filter.in.includes("Other");
            const hasOtherOnly = filter.in.length === 1 && containsOther;

            if (hasOtherOnly) {
              return (
                record.project_classification_other !== null &&
                record.is_other_classification
              );
            } else if (containsOther) {
              return (
                (filter.in.includes(value) &&
                  !record.is_other_classification) ||
                (record.project_classification_other !== null &&
                  record.is_other_classification)
              );
            } else {
              return filter.in.includes(value);
            }
          }
        } else {
          if (filter.equals !== undefined) return value === filter.equals;
          if (filter.not_equals !== undefined)
            return value !== filter.not_equals;
          if (filter.is_empty === true) return value === null || value === "";
          if (Array.isArray(filter.in)) return filter.in.includes(value);
        }
      } else {
        if (filter.equals !== undefined) return value === filter.equals;
        if (filter.not_equals !== undefined) return value !== filter.not_equals;
        if (filter.contains !== undefined) {
          if (typeof value === "string") {
            return value.toLowerCase().includes(filter.contains.toLowerCase());
          }
          return false;
        }
        if (filter.not_contains !== undefined && typeof value === "string") {
          return !value
            .toLowerCase()
            .includes(filter.not_contains.toLowerCase());
        }
        if (filter.is_empty === true) return value === null || value === "";
      }

      return true;
    };

    let filteredProjects = [...projects];

    if (hasValidFilters && filters) {
      filteredProjects = filteredProjects
        .map((project) => {
          const parentMatches = isBoth
            ? filterableClientFields.every((key) => {
                const filter = filters[key];
                if (!filter || Object.keys(filter).length === 0) return true;
                return matchFilter(project, key, filter);
              })
            : false;

          const matchingChildren = (project.ProjectFiscal || []).filter(
            (child: any) =>
              filterableClientFields.every((key) => {
                const filter = filters[key];
                if (!filter || Object.keys(filter).length === 0) return true;
                return matchFilter(child, key, filter);
              })
          );

          if (isBoth) {
            if (parentMatches) {
              if (matchingChildren.length > 0) {
                return {
                  ...project,
                  ProjectFiscal: matchingChildren,
                };
              } else {
                return {
                  ...project,
                  ProjectFiscal: [],
                };
              }
            } else {
              return null;
            }
          } else {
            // Only filter by children
            if (matchingChildren.length > 0) {
              return {
                ...project,
                ProjectFiscal: matchingChildren,
              };
            } else {
              return {
                ...project,
                ProjectFiscal: [],
              };
            }
          }
        })
        .filter(Boolean); // remove nulls
    }

    // Sorting remains top-level only
    if (!sortBy || sortBy === "created_datetime") {
      return filteredProjects;
    }

    function extractSortableValue(project: any, sortBy: string): any {
      if (isBoth) {
        const topLevelValue = project[sortBy];
        if (
          topLevelValue !== null &&
          topLevelValue !== undefined &&
          (typeof topLevelValue !== "string" || topLevelValue.trim() !== "")
        ) {
          return topLevelValue;
        }

        for (const fiscal of project.ProjectFiscal || []) {
          const val = fiscal?.[sortBy];
          if (
            val !== null &&
            val !== undefined &&
            (typeof val !== "string" || val.trim() !== "")
          ) {
            return val;
          }
        }

        return null;
      } else {
        // Extract first non-null child-level value only
        for (const fiscal of project.ProjectFiscal || []) {
          const val = fiscal?.[sortBy];
          if (
            val !== null &&
            val !== undefined &&
            (typeof val !== "string" || val.trim() !== "")
          ) {
            return val;
          }
        }

        return null; // All children are null/missing for this field
      }
    }

    const sortByField = (arr: any, key: string, asc: string) => {
      return arr.sort((a: any, b: any) => {
        const valA = a[key];
        const valB = b[key];

        // Handle nulls last
        if (valA === null && valB !== null) return 1;
        if (valA !== null && valB === null) return -1;
        if (valA === null && valB === null) return 0;

        // Handle number or string
        if (typeof valA === "number" && typeof valB === "number") {
          return asc === "ASC" ? valA - valB : valB - valA;
        }

        if (typeof valA === "string" && typeof valB === "string") {
          return asc === "ASC"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        return 0; // fallback
      });
    };

    const sortedData = filteredProjects.map((item) => {
      if (isBoth || (!isBoth && item.ProjectFiscal)) {
        return {
          ...item,
          ProjectFiscal: item.ProjectFiscal
            ? sortByField(item.ProjectFiscal, sortBy, sortOrder)
            : undefined,
        };
      }
      return item;
    });

    const finalData = isBoth
      ? sortByField(sortedData, sortBy, sortOrder)
      : sortedData;

    // const sortByProject = (arr: any, asc: boolean, field: string) => {
    //   return arr.sort((a, b) => {
    //     if (a.field === null && b.field !== null) return 1;
    //     if (a.field !== null && b.field === null) return -1;
    //     if (a.field === null && b.field === null) return 0;

    //     return asc
    //       ? a.project.localeCompare(b.project)
    //       : b.project.localeCompare(a.project);
    //   });
    // };

    // const sortedList = filteredProjects.sort((a, b) => {
    //   const valA = extractSortableValue(a, sortBy);
    //   const valB = extractSortableValue(b, sortBy);

    //   const aIsNull = valA === null || valA === undefined || valA === "";
    //   const bIsNull = valB === null || valB === undefined || valB === "";

    //   // Always push nulls to bottom
    //   if (aIsNull && !bIsNull) return 1;
    //   if (!aIsNull && bIsNull) return -1;
    //   if (aIsNull && bIsNull) return 0;

    //   // String comparison
    //   if (typeof valA === "string" && typeof valB === "string") {
    //     return sortOrder.toUpperCase() === "ASC"
    //       ? valA.localeCompare(valB)
    //       : valB.localeCompare(valA);
    //   }

    //   // Number/date fallback
    //   const numA = typeof valA === "number" ? valA : new Date(valA).getTime();
    //   const numB = typeof valB === "number" ? valB : new Date(valB).getTime();

    //   return sortOrder.toUpperCase() === "ASC" ? numA - numB : numB - numA;
    // });

    return finalData;
  }

  async enrichKeyContactsManually(projects: any[], accountNumber: string) {
    const { KeyContact } = await this.getModels(accountNumber);

    const allProjectIds = projects.map((p) => p.rid);
    const allFiscalIds = projects.flatMap((p) =>
      (p.ProjectFiscal || []).map((f: any) => f.rid)
    );

    const allIds = [...new Set([...allProjectIds, ...allFiscalIds])];
    if (allIds.length === 0) return projects;

    // Fetch key_contact records where reference_id is in allIds
    const keyContacts: any[] = await KeyContact.findAll({
      where: {
        entity_rid: allIds,
      },
      raw: true,
    });

    // Group keyContacts by reference_id
    const contactMap: Record<string, any[]> = {};
    for (const kc of keyContacts) {
      const refId = kc.entity_rid;
      if (!contactMap[refId]) contactMap[refId] = [];
      contactMap[refId].push(kc);
    }

    // Inject contacts into the correct project/fiscal records
    const enriched = projects.map((project) => {
      const projId = project.rid;
      const projectKeyContacts = contactMap[projId] || [];

      const enrichedFiscal = (project.ProjectFiscal || []).map(
        (fiscal: any) => ({
          ...(typeof fiscal.toJSON === "function" ? fiscal.toJSON() : fiscal),
          keyContact: contactMap[fiscal.rid] || [],
        })
      );

      return {
        ...(typeof project.toJSON === "function" ? project.toJSON() : project),
        keyContact: projectKeyContacts,
        ProjectFiscal: enrichedFiscal,
      };
    });

    return enriched;
  }

  async enrichKeyContactsByProjectId(project: any, accountNumber: string) {
    const { KeyContact } = await this.getModels(accountNumber);

    const projectId = project.rid;

    const allIds = [...new Set([projectId])];
    if (allIds.length === 0) return project;

    const keyContacts: any[] = await KeyContact.findAll({
      where: {
        entity_rid: allIds,
      },
      raw: true,
    });

    const contactMap: Record<string, any[]> = {};
    for (const kc of keyContacts) {
      const refId = kc.entity_rid;
      if (!contactMap[refId]) contactMap[refId] = [];
      contactMap[refId].push(kc);
    }

    const enrichedProject = {
      ...project.dataValues,
      keyContact: contactMap[projectId] || [],
    };

    return enrichedProject;
  }

  async insertCurrencyDetails(project: any) {
    try {
      if (project && project.length === 0) return project;
      if (!this.mainDbSequelize) throw new Error("Database not initialized");

      // Step 1: Collect all unique currency_rids
      const currencyRidSet = new Set<string>();

      for (const item of project) {
        if (item.currency_rid) currencyRidSet.add(item.currency_rid);
        if (item.ProjectFiscal) {
          for (const fiscal of item.ProjectFiscal) {
            if (fiscal.currency_rid) currencyRidSet.add(fiscal.currency_rid);
          }
        }
      }

      const currencyRids = Array.from(currencyRidSet);
      if (currencyRids.length === 0) return project;

      // Step 2: Fetch currency details in one query
      const placeholders = currencyRids.map(() => "?").join(", ");
      const query = `
        SELECT rid, currency_code, currency_symbol 
        FROM ${MAIN_SCHEMA_NAME}.currency 
        WHERE rid IN (${placeholders})
      `;

      const results: any = await this.mainDbSequelize.query(query, {
        replacements: currencyRids,
        type: "SELECT",
      });

      // Step 3: Map rid -> currency data
      const currencyMap: any = new Map<
        string,
        { currency_code: string; currency_symbol: string }
      >();
      for (const row of results) {
        currencyMap.set(row.rid, {
          currency_code: row.currency_code,
          currency_symbol: row.currency_symbol,
        });
      }

      // Step 4: Assign back the currency data to project and projectFiscal items
      for (const item of project) {
        const currency = currencyMap.get(item.currency_rid);
        if (currency) {
          item.currency_code = currency.currency_code;
          item.currency_symbol = currency.currency_symbol;
        } else {
          item.currency_code = null;
          item.currency_symbol = null;
        }

        if (item.ProjectFiscal) {
          for (const fiscal of item.ProjectFiscal) {
            const currency = currencyMap.get(fiscal.currency_rid);
            if (currency) {
              fiscal.currency_code = currency.currency_code;
              fiscal.currency_symbol = currency.currency_symbol;
            } else {
              fiscal.currency_code = null;
              fiscal.currency_symbol = null;
            }
          }
        }
      }

      return project;
    } catch (err) {
      console.error("Error in insertCurrencyDetails:", err);
    }
  }

  async getProjectsByAccountId(schemaNumber: string, accountRid: string) {
    const { ProjectFiscal } = await this.getModels(schemaNumber);

    return ProjectFiscal.findAll({
      where: {
        account_rid: accountRid,
      },
      order: [["created_datetime", "DESC"]],
    });
  }

  /**
   * Fetches project resources for multiple project IDs using a single SQL query
   *
   * @param {string} accountNumber - Account number to determine schema
   * @param {string[]} projectIds - Array of project IDs
   * @returns {Promise<any[]>} - Project_resources data
   */
  async getProjectResourcesByProjectIds(
    accountNumber: string,
    projectIds: string[]
  ): Promise<any[]> {
    try {
      if (projectIds.length === 0) return [];

      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const query = `
      SELECT 
        ps.rid,
        ps.project_rid
      FROM "${schemaName}".project_resource ps
      WHERE ps.project_rid IN (:projectIds)
      ORDER BY ps.created_datetime DESC
    `;

      const sequelize = await initOrgSequelize();
      const results = await sequelize.query(query, {
        replacements: { projectIds },
        type: "SELECT",
      });

      return results;
    } catch (error) {
      console.error("Error fetching project resources (bulk):", error);
      throw error;
    }
  }

  /**
   * Fetches project tasks for multiple project resource IDs using a single SQL query
   *
   * @param {string} accountNumber - Account number to determine schema
   * @param {string[]} projectResourceIds - Array of project resource IDs
   * @returns {Promise<any[]>} - Project_task data
   */
  async getProjectTasksByProjectResourceIds(
    accountNumber: string,
    projectResourceIds: string[]
  ): Promise<any[]> {
    try {
      if (projectResourceIds.length === 0) return [];
      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;
      const sequelize = await initOrgSequelize();

      // Check if project_task table exists
      const checkTableQuery = `
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = '${schemaName}'
      AND table_name = 'project_task'
    );
  `;

      const [tableExists] = await sequelize.query(checkTableQuery, {
        type: "SELECT",
      });

      if ((tableExists as any).exists === false) {
        return [];
      }

      const query = `
      SELECT 
        pt.rid,
        pt.project_resource_rid
      FROM "${schemaName}".project_task pt
      WHERE pt.project_resource_rid IN (:projectResourceIds)
      ORDER BY pt.created_datetime DESC
    `;

    const results = await sequelize.query(query, {
      replacements: { projectResourceIds },
      type: 'SELECT'
    });

    return results;

  } catch (error) {
    console.error('Error fetching project tasks (bulk):', error);
    throw error;
  }
}

}

export default ProjectIngestionService;
