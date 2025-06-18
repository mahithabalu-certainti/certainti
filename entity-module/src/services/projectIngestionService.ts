import { Op, Order, Sequelize } from "sequelize";
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

class ProjectIngestionService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  keyContactService: KeyContactService;

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
    }
  > = new Map();

  constructor() {
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
    const schemaName = `platform_v2_${accountNumber}`;
    if (this.modelCache.has(schemaName)) {
      return this.modelCache.get(schemaName)!;
    }

    const sequelize = await this.getSequelize();
    const mainDbSequelize = await this.getMainSequelize();

    const KeyContactModel = await KeyContact.initialize(sequelize, schemaName);
    const ProjectFiscalModel = await ProjectFiscal.initialize(
      sequelize,
      schemaName
    );
    const ProjectModel = await Project.initialize(sequelize, schemaName);

    const ProjectTimelineModel = await ProjectTimeline.initialize(
      sequelize,
      schemaName
    );

    const AccountFiscalModel = await AccountFiscal.initialize(
      sequelize,
      schemaName
    );
    const ProjectHistoryModel = await ProjectHistory.initialize(
      sequelize,
      schemaName
    );

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
      ProjectHistory: ProjectHistoryModel,
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
        project_code: projectData.project_code,
        account_rid: accountData.rid,
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
        project_code: projectData.project_code,
        account_rid: accountId,
        fiscal_year: projectData.fiscal_year,
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
        project_code: projectData.project_code,
        account_rid: accountId,
        fiscal_year: projectData.fiscal_year,
        rid: {
          [Op.ne]: projectFiscalId,
        },
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
        project_code: projectCode,
        account_rid: accountRid,
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

    return ProjectFiscal.create(baseData);
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
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_effort_prj, 0)")),
          "total_effort_prj",
        ],
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_fte_prj, 0)")),
          "total_fte_prj",
        ],
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_subcon_prj, 0)")),
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
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_cost_fte_prj, 0)")),
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
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_effort_prj, 0)")),
          "total_effort_prj",
        ],
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_fte_prj, 0)")),
          "total_fte_prj",
        ],
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_subcon_prj, 0)")),
          "total_subcon_prj",
        ],
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_cost_fte_prj, 0)")),
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
      modified_by:
        eventName === "update"
          ? projectData.modified_by || ""
          : projectData.created_by || "",
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

    const { technicalConsultant, projectPointOfContact } =
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
      projectPointOfContact
    );

    return await ProjectSummary.create(summaryData);
  }

  async addProjectFiscalSummary(
    accountNumber: string,
    projectData: any,
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
      projectId,
      startDate,
      endDate,
      technicalConsultant,
      projectPointOfContact,
      projectFiscalId,
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
        modified_datetime: new Date(),
      });
    } else {
      await this.updateAccountFiscalAggregatesFromFiscal(
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
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_cost_prj, 0)")),
          "total_cost_prj",
        ],
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_effort_prj, 0)")),
          "total_effort_prj",
        ],
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_fte_prj, 0)")),
          "total_fte_prj",
        ],
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_subcon_prj, 0)")),
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
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_cost_fte_prj, 0)")),
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
        total_project_cost: aggregates.total_cost,
        total_project_hours: aggregates.total_effort,
        total_fte: aggregates.total_fte,
        total_subcon: aggregates.total_subcon,
        total_project_hours_fte: aggregates.total_effort_fte,
        total_project_hours_subcon: aggregates.total_effort_subcon,
        total_project_cost_fte: aggregates.total_cost_fte,
        total_project_cost_subcon: aggregates.total_cost_subcon,
        total_project_cost_nonlabor: aggregates.total_cost_nonlabor,
      },
      {
        where: {
          account_rid: projectData.account_id,
          fiscal_year: projectData.fiscal_year,
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
      raw: true,
    });

    if (!aggregates) return;

    const totalProjectCount = await Project.findAll({
      where: {
        account_rid: accountId,
      },
    });

    const query = `
      UPDATE account
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

    await ProjectFiscal.update(baseData, {
      where: {
        rid: projectData.project_fiscal_id,
      },
    });

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
        modified_by: newProjectData["modified_by"] || "",
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
        projectData.keyContacts,
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
    finalMetaDataSortOrder: string
  ) {
    const { Project, ProjectFiscal } = await this.getModels(accountNumber);

    const parentLevelFields = [
      "project_name",
      "industry_name",
      "classification_name",
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
      project_type: "project_type",
      project_name: "project_name",
      project_code: "project_code"
    };

    const parentFilters: Record<string, any> = {};

    for (const key in filters) {
      if (parentLevelFields.includes(key)) {
        parentFilters[key] = filters[key];
      }
    }

    const whereProject: Record<string, any> = {
      account_rid: accountData.rid,
      ...(bothParentAndChild ? parentFilters : {}),
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
      if (bothParentAndChild) {
        if (parentLevelFields.includes(field)) {
          fullOrder.push([field, direction]);
        }
      } else {
        fullOrder.push(["created_datetime", "DESC"]);
      }

      const aliasFilter = fiscalFieldMap[field] !== undefined ? fiscalFieldMap[field] : field;

      fullOrder.push([
        { model: ProjectFiscal, as: "ProjectFiscal" },
        aliasFilter,
        direction,
      ]);
    };

    let { rows: projects, count } = await Project.findAndCountAll({
      where: whereProject,
      offset,
      limit,
      order: fullOrder,
      attributes: {
        include: [
          ['account_rid', 'account_id'],
          ['rid', 'project_rid'] 
        ]
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
              ["total_cost_nonlabor_prj", "total_cost_nonlabor"]
            ]
          }
        },
      ],
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
    }

    return {
      projects,
      count
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
    timezone: string
  ) {
    const { Project, ProjectFiscal } = await this.getModels(accountNumber);

    const parentLevelFields = [
      "project_name",
      "industry_name",
      "classification_name",
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
      project_type: "project_type",
      project_name: "project_name",
      project_code: "project_code"
    };

    const parentFilters: Record<string, any> = {};

    for (const key in filters) {
      if (parentLevelFields.includes(key)) {
        parentFilters[key] = filters[key];
      }
    }

    const whereProject: Record<string, any> = {
      account_rid: accountData.rid,
      ...(bothParentAndChild ? parentFilters : {}),
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
      if (bothParentAndChild) {
        if (parentLevelFields.includes(field)) {
          fullOrder.push([field, direction]);
        }
      } else {
        fullOrder.push(["created_datetime", "DESC"]);
      }

      const aliasFilter = fiscalFieldMap[field] !== undefined ? fiscalFieldMap[field] : field;

      fullOrder.push([
        { model: ProjectFiscal, as: "ProjectFiscal" },
        aliasFilter,
        direction,
      ]);
    };

    let { rows: projects, count } = await Project.findAndCountAll({
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
            "project_type",
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
            "project_status",
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
            ["total_cost_nonlabor_prj", "total_cost_nonlabor"]
          ]
        },
      ],
    });

    if (this.mainDbSequelize) {

      let projectData = await this.enrichKeyContactsManually(
        projects,
        accountNumber
      );

      projectData.forEach((e) => {
        e.account_name = accountData.account_name
        e.ProjectFiscal.forEach((val: any) => {
          val.account_name = accountData.account_name
        })
      })

      projectData = await this.keyContacts.insertKeyRole(
        projectData,
        this.mainDbSequelize
      );

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
    }

    const formatNumberForExport = (value: any, currency_symbol: string): string => {
      if (value == null || value === '') return '-';
      const num = Number(value);
      if (isNaN(num)) return '-';
      return currency(num, {
        symbol: currency_symbol? currency_symbol : '$',
        precision: 2,
        pattern: '! #',
        separator: ',',
        decimal: '.'
      }).format();
    };

    const rawResult = projects || [];

    let exportData = rawResult.flatMap((project: any) => {
      const baseRow = {
        "Project Code": project.project_code || "-",
        "Name": project.project_name || "-",
        "Project Type": project.project_type || "-",
        "Account Name": project.account_name || "-",
        "Fiscal Year": project.fiscal_year || "-",
        "Project Classification": project.classification_name || "-",
        "Customer Group": project.project_client_group || "-",
        "Project Group": project?.project_group || "-",
        "Project Effort (Hours)": project.total_effort || "-",
        "Project Cost": formatNumberForExport(project.total_cost, project.currency_symbol) || "-",
        "FTE Cost": formatNumberForExport(project.total_cost_fte, project.currency_symbol) || "-",
        "SubCon Cost": formatNumberForExport(project.total_cost_subcon, project.currency_symbol) || "-",
        "Non-Labor Cost": formatNumberForExport(project.total_cost_nonlabor, project.currency_symbol) || "-",
        "Assessment Status": project.assessment_status || "-",
        "QRE %": project.qre || "-",
        "QRE": formatNumberForExport(project.qualified_research_expenditure, project.currency_symbol) || "-",
        "Project Point of Contact": project.project_point_of_contact || "-",
        "Technical Point of Contact": project.technical_point_of_contact || "-",
        "Comments": project.comments || "-",
        "Last Modified": project.modified_datetime
          ? timezone && isValidTimezone(timezone)
            ? moment(project.modified_datetime).tz(timezone).format('YYYY-MM-DD, hh:mm:ss A')
            : moment(project.modified_datetime).format('YYYY-MM-DD, hh:mm:ss A')
          : '-',
        "Project ID": project.r_number || "-",
      };

      const fiscalSummaries = project.ProjectFiscal || [];

      const fiscalRows = fiscalSummaries.map((fiscal: any) => ({
        "Project Code": fiscal.project_code || "-",
        "Name": fiscal.project_name || "-",
        "Project Type": fiscal.project_type || "-",
        "Account Name": project.account_name || "-",
        "Fiscal Year": fiscal.fiscal_year || "-",
        "Project Classification": fiscal.classification_name || "-",
        "Customer Group": fiscal.project_client_group || "-",
        "Project Group": fiscal?.project_group || "-",
        "Project Effort (Hours)": fiscal.total_effort_prj || "-",
        "Project Cost": formatNumberForExport(fiscal.total_cost_prj, project.currency_symbol) || "-",
        "FTE Cost": formatNumberForExport(fiscal.total_cost_fte_prj, project.currency_symbol) || "-",
        "SubCon Cost": formatNumberForExport(fiscal.total_cost_subcon_prj, project.currency_symbol) || "-",
        "Non-Labor Cost": formatNumberForExport(fiscal.total_cost_nonlabor_prj, project.currency_symbol) || "-",
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
      }));

      return [baseRow, ...fiscalRows];
    });


    return {
      exportData,
      count
    };
  }

  async fetchProjectById(accountNumber: string, projectId: string) {
    const { ProjectFiscal } = await this.getModels(accountNumber);

    let projectData = await ProjectFiscal.findOne({
      where: {
        rid: projectId,
      },
      attributes: {
        include: [
          ['total_fte_prj', 'total_fte'],
          ['total_subcon_prj', 'total_subcon'],
          ['total_cost_prj', 'total_cost'],
          ['total_effort_prj', 'total_effort'],
          ['total_effort_fte_prj', 'total_effort_fte'],
          ['total_effort_subcon_prj', 'total_effort_subcon'],
          ['total_cost_fte_prj', 'total_cost_fte'],
          ['total_cost_subcon_prj', 'total_cost_subcon'],
          ['total_cost_nonlabor_prj', 'total_cost_nonlabor'],
          ['country_rid', 'country'],
          ['region_rid', 'region'],
          ['currency_rid', 'currency'],
        ]
      }
    });

    return projectData;
  }

  async insertProjectClassification(
    projects: any[],
    mainDbSequelize: Sequelize
  ) {
    try {
      const allClassificationIds = new Set<string>();

      for (const project of projects) {
        if (project.project_classification_rid) {
          allClassificationIds.add(project.project_classification_rid);
        }

        if (Array.isArray(project.ProjectFiscal)) {
          for (const child of project.ProjectFiscal) {
            if (child.project_classification_rid) {
              allClassificationIds.add(child.project_classification_rid);
            }
          }
        }
      }

      const classificationIds = [...allClassificationIds];

      let classificationMap: Record<string, any> = {};

      if (classificationIds.length > 0) {
        const classificationRows = await mainDbSequelize.query(
          `SELECT rid, classification_name FROM project_classification WHERE rid IN (:ids)`,
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

      const updatedProjects = projects.map((project) => {
        const updatedProject: any = {
          ...(typeof project.toJSON === "function"
            ? project.toJSON()
            : project),
          classification_name: project.project_classification_other
            ? project.project_classification_other
            : classificationMap[project.project_classification_rid]
                ?.classification_name || null,
          is_other_classification: !!project.project_classification_other,
        };

        if (Array.isArray(project.ProjectFiscal)) {
          updatedProject.ProjectFiscal = project.ProjectFiscal.map(
            (child: any) => ({
              ...(typeof child.toJSON === "function" ? child.toJSON() : child),
              classification_name: child.project_classification_other
                ? child.project_classification_other
                : classificationMap[child.project_classification_rid]
                    ?.classification_name || null,
              is_other_classification: !!child.project_classification_other,
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
      "country",
      "region",
      "currency",
      "technical_point_of_contact",
      "financial_consultant",
      "project_point_of_contact",
      "classification_name",
      "industry_name",
      "name",
      "project_type",
    ];

    const enumFields = [
      "country",
      "currency",
      "region",
      "classification_name",
      "project_type",
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

    const sortedList = filteredProjects.sort((a, b) => {
      const valA = a[sortBy] ?? a.ProjectFiscal?.[0]?.[sortBy];
      const valB = b[sortBy] ?? b.ProjectFiscal?.[0]?.[sortBy];

      if (valA == null) return sortOrder === "ASC" ? 1 : -1;
      if (valB == null) return sortOrder === "ASC" ? -1 : 1;

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "ASC"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortOrder === "ASC" ? valA - valB : valB - valA;
    });

    return sortedList;
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
}

export default ProjectIngestionService;
