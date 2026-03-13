import {
  Op,
  Order,
  QueryTypes,
  Sequelize,
  col,
  fn,
  literal,
  where,
} from "sequelize";
import { initOrgSequelize } from "../config/orgDataSource";
import "moment-timezone";
import { Project } from "../models/project";
import { ProjectFiscal } from "../models/projectFiscal";
import {
  ICreateProject,
  IKeyContactDetail,
  IUpdateProject,
  CaseStatusResult,
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
import { DEFAULT_PROJECT_DETAILS, entityTypes, eventNames, eventTypes, MAIN_SCHEMA_NAME, rawQueries } from "../utils/constants";
import {
  ProjectFiscalRegion,
} from "../models/projectFiscalRegion";
import { AccountFiscalRegion } from "../models/accountFiscalRegion";
import { ProjectResource } from "../models/projectResource";
import { ProjectResourceFiscal } from "../models/projectResourceFiscal";
import { ProjectResourceFiscalRegion } from "../models/projectResourceFiscalRegion";
import AccountDetails from "../models/accountDetails";
import SchemaService from "./schemaService";
import { Kafka, Producer } from "kafkajs";
import { AccountFiscalSummary } from "../models/accountFiscalSummary";
import { logMessage } from "../utils/helpers";
import { checkProjectMappedToProjectRes } from "../utils/rawQueries";
import { CaseProject } from "../models/caseProjectsModel";
import { Case } from "../models/caseModel";
import { CaseProjectFiscalRegion } from "../models/caseProjectFiscalRegionModel";
import { CaseKeyContactDetails } from "../models/caseKeyContactModel";
import { calculateFiscalYearDateRange } from "../utils/dateFunction";


class ProjectIngestionService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  keyContactService: KeyContactService;
  private logger: Logger;
  private producer!: Producer;

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
      CaseKeyContactDetails: ReturnType<typeof CaseKeyContactDetails.initialize>;
    }
  > = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
    this.keyContactService = new KeyContactService(logger);
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

    const AccountDetailsModel = await AccountDetails.initialize(
      sequelize,
      schemaName
    );
    const AccountFiscalModel = await AccountFiscal.initialize(
      sequelize,
      schemaName
    );
    const AccountFiscalSummaryModel = await AccountFiscalSummary.initialize(
      mainDbSequelize,
      ""
    );
    const AccountFiscalRegionModel = await AccountFiscalRegion.initialize(
      sequelize,
      schemaName
    );

    const KeyContactModel = await KeyContact.initialize(sequelize, schemaName);
    const ProjectModel = await Project.initialize(sequelize, schemaName);
    const ProjectFiscalModel = await ProjectFiscal.initialize(
      sequelize,
      schemaName
    );

    ProjectModel.hasMany(ProjectFiscalModel, {
      foreignKey: "project_rid",
      sourceKey: "rid",
      as: "ProjectFiscal",
    });

    const ProjectFiscalRegionModel = await ProjectFiscalRegion.initialize(
      sequelize,
      schemaName
    );

    const ProjectTimelineModel = await ProjectTimeline.initialize(
      sequelize,
      schemaName
    );

    ProjectFiscalModel.hasMany(ProjectTimelineModel, {
      foreignKey: "entity_rid",
      sourceKey: "rid",
      as: "ProjectTimelines",
    });

    AccountFiscalModel.belongsTo(AccountDetailsModel, {
      foreignKey: "account_rid",
      targetKey: "account_rid",
      as: "account_fiscal_account",
    });
    AccountFiscalRegionModel.belongsTo(AccountDetailsModel, {
      foreignKey: "account_rid",
      targetKey: "account_rid",
      as: "account_fiscal_region_account",
    });

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
    const CaseProjectModel = await CaseProject.initialize(
      sequelize,
      schemaName
    );
    const CaseModel = await Case.initialize(
      sequelize,
      schemaName
    );
    const CaseProjectFiscalRegionModel = await CaseProjectFiscalRegion.initialize(
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
    const caseKeyContactModel = await CaseKeyContactDetails.initialize(sequelize, schemaName);


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
      AccountFiscalSummary: AccountFiscalSummaryModel,
      CaseProject: CaseProjectModel,
      Case: CaseModel,
      CaseProjectFiscalRegion: CaseProjectFiscalRegionModel,
      CaseKeyContactDetails: caseKeyContactModel,
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

    const accountSettings: any = await this.fetchAccountDetailsById(
      accountNumber,
      projectData.account_id
    );

    const baseData = ProjectMapper.mapToProjectFiscalModel(
      projectData,
      projectId,
      startDate,
      endDate,
      accountSettings,
      userId
    );
    const response = await ProjectFiscal.create({
      ...baseData,
      default_metric_type: "project",
    });
    const isTriggerEnabled = await this.isAutoTriggerRDAssessment(accountNumber, {
      account_rid: projectData.account_id,
      project_fiscal_rid: response.rid,
    });
    if (isTriggerEnabled) {
      const req = {
        data: [
          {
            account_rid: projectData.account_id,
            project_fiscal_rid: [response.rid],
          },
        ],
        type: "project",
      };
      logMessage(`Triggering AI for project fiscal rid: ${req}`);
      await this.triggerAI(req, userId, response.project_code, accountNumber, entityTypes.AUTO_RD_ASSESSMENT);
    }

    return response;
  }

  async isAutoTriggerRDAssessment(
    accountNumber: string,
    interactionDetails: any
  ) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.getMainSequelize();
      }
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.getSequelize();
      }
      const globalInteractionAccess = await this.checkGlobalAutoTriggerAccess(this.mainDbSequelize);
      if (globalInteractionAccess) {
        return true;
      } else {

        const accountInteraction = await this.checkAccountAutoTriggerAccess(accountNumber, interactionDetails.account_rid, this.orgDbSequelize);
        if (accountInteraction) {
          return true;
        }

        const projectInteraction = await this.checkProjectAutoTriggerAccess(accountNumber, interactionDetails.project_fiscal_rid, this.orgDbSequelize);
        if (projectInteraction) {
          return true;
        }

        return false;
      }
    } catch (err) {
      logMessage(`Error checking auto-send interaction status: ${err}`);
      throw new Error(
        "Error checking auto-send interaction status: " + (err as Error).message
      );
    }
  }
  async checkGlobalAutoTriggerAccess(mainDbSequelize: Sequelize) {
    try {
      const [globalAccess]: any[] = await mainDbSequelize.query(
        rawQueries.fetchGlobalAutoTriggerAccess(),
        { type: "SELECT" }
      );
      return globalAccess?.auto_access_rd ?? false;
    } catch (err) {
      logMessage(`Error checking global auto-access RD interaction access: ${err}`);
      throw new Error(
        "Error checking global auto-access RD interaction access: " +
        (err as Error).message
      );
    }
  }

  async checkAccountAutoTriggerAccess(accountNumber: string,
    accountRid: string, orgDbSequelize: Sequelize) {
    try {

      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;
      const [accountInfo]: any[] = await orgDbSequelize.query(
        rawQueries.fetchAccountLevelInfoForTriggerAI(accountRid, schemaName),
        { type: "SELECT" }
      );
      return accountInfo?.auto_access_rd ?? false;
    } catch (err) {
      logMessage(`Error checking account auto-trigger interaction access: ${err}`);
      throw new Error(
        "Error checking account auto-trigger interaction access: " +
        (err as Error).message
      );
    }
  }

  async checkProjectAutoTriggerAccess(accountNumber: string,
    project_fiscal_rid: string, orgDbSequelize: Sequelize) {
    try {
      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;
      const [projectInfo]: any[] = await orgDbSequelize.query(
        rawQueries.fetchisAutoTriggerEnabled(
          project_fiscal_rid,
          schemaName
        ),
        { type: "SELECT" }
      );
      return projectInfo?.auto_access_rd ?? false;
    } catch (err) {
      logMessage(`Error checking project auto-trigger interaction access: ${err}`);
      throw new Error(
        "Error checking project auto-trigger interaction access: " +
        (err as Error).message
      );
    }
  }
  private async getProducer(): Promise<Producer> {
    if (!this.producer) {
      const kafka = new Kafka({
        clientId: "my-app",
        brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
      });
      this.producer = kafka.producer();
      await this.producer.connect();
    }
    return this.producer;
  }

  async fetchValidAccountNumberById(accountId: string) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.getMainSequelize();
      }

      const [account]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchAccountById,
        {
          replacements: { rid: accountId },
          type: "SELECT",
        }
      );

      let accountRnumber = account?.r_number;

      if (account?.storage_type === "store_in_parent") {
        const [accountData]: any[] = await this.mainDbSequelize.query(
          rawQueries.fetchAccountById,
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
      throw new Error("Error fetching account : " + (err as Error).message);
    }
  }

  async triggerAI(req: any, userId: string, projectCode: string, accountNumber: string, type: string = entityTypes.AUTO_RD_ASSESSMENT) {
    try {
      let payload: {
        company_id?: any;
        input_text: string;
        model_type: string;
        project_id?: any;
      } = {
        input_text: "This is some text to be processed by the AI.",
        model_type: "NA",
      };

      payload.company_id = req.data[0].account_rid;
      payload.project_id = req.data[0].project_fiscal_rid;
      this.logger.info(
        `Triggering AI with payload: ${JSON.stringify(payload)}`
      );

      const topic =
        process.env.KAFKA_AI_REQUEST_TRIGGER_TOPIC || "ai_assessment_request";
      const message = {
        value: JSON.stringify(payload),
      };
      const producer = await this.getProducer();
      const sendResult = await producer.send({
        topic,
        messages: [message],
      });
      //   Check if the message was processed successfully
      this.logger.info(
        `Message sent to topic ${topic}: ${JSON.stringify(sendResult)}`
      );
      const schemaService = new SchemaService();
      const userEventInfo: any = await schemaService.fetchUserAndEventInfo({
        userId: userId!,
        eventType: eventTypes.UI_HANDLER
      });
      await schemaService.createAccountTimelineEntry(accountNumber!, {
        created_by: userId!,
        account_rid: req.data[0].account_rid,
        entity_rid: req.data[0].project_fiscal_rid!,
        entity_name: entityTypes.AUTO_RD_ASSESSMENT,
        created_by_name: userEventInfo.full_name,
        event_type_rid: userEventInfo.event_type_rid,
        event_name: eventNames.TRIGGERED,
        descriptions: projectCode || '',
        project_rid: req.data[0].project_fiscal_rid
      }, ["project"]);
      return {
        statusMessage: "RD Assessment Initiated",
        status: "success",
        data: null,
      };
    } catch (error) {
      this.logger.error("Error in triggerAI", error);
      return {
        statusMessage: "Failed to process AI request",
        status: "error",
        data: null,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async addProjectFiscalRegion(
    accountNumber: string,
    projectData: ICreateProject,
    projectFiscalData: ProjectFiscal,
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

    const accountSettings: any = this.fetchAccountDetailsById(
      accountNumber,
      projectData.account_id
    );

    const baseData = ProjectMapper.mapToProjectFiscalModel(
      projectData,
      projectId,
      startDate,
      endDate,
      accountSettings,
      userId
    );

    return ProjectFiscalRegion.create({
      ...baseData,
      project_fiscal_rid: projectFiscalData.rid,
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
          Sequelize.fn("SUM", Sequelize.col("total_cost_prj")),
          "total_cost_prj",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_effort_prj")),
          "total_effort_prj",
        ],
        [Sequelize.fn("SUM", Sequelize.col("total_fte_prj")), "total_fte_prj"],
        [
          Sequelize.fn("SUM", Sequelize.col("total_subcon_prj")),
          "total_subcon_prj",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_nonlabor_prj")),
          "total_nonlabor_prj",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_effort_fte_prj")),
          "total_effort_fte_prj",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_effort_subcon_prj")),
          "total_effort_subcon_prj",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_cost_fte_prj")),
          "total_cost_fte_prj",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_cost_subcon_prj")),
          "total_cost_subcon_prj",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_cost_nonlabor_prj")),
          "total_cost_nonlabor_prj",
        ],
      ],
      where: {
        project_code: projectCode,
        account_rid: accountId,
      },
      group: ["project_code"],
      raw: true,
    });

    if (!aggregates) return;

    // 2. Update Project table with aggregated totals
    await Project.update(
      {
        total_cost: aggregates.total_cost_prj,
        total_effort: aggregates.total_effort_prj,
        total_fte: Number(aggregates.total_fte_prj || 0),
        total_subcon: Number(aggregates.total_subcon_prj || 0),
        total_nonlabor: Number(aggregates.total_nonlabor_prj || 0),
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
          Sequelize.fn("SUM", Sequelize.literal("total_cost_prj")),
          "total_cost_prj",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("total_effort_prj")
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
            Sequelize.literal("COALESCE(total_nonlabor_prj, 0)")
          ),
          "total_nonlabor_prj",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("total_cost_fte_prj")
          ),
          "total_cost_fte_prj",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("total_cost_subcon_prj")
          ),
          "total_cost_subcon_prj",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("total_cost_nonlabor_prj")
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
        total_fte: Number(aggregates.total_fte_prj || 0),
        total_subcon: Number(aggregates.total_subcon_prj || 0),
        total_nonlabor: Number(aggregates.total_nonlabor_prj || 0),
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
    const { KeyContact, CaseKeyContactDetails, Case } = await this.getModels(schemaName);

    let projectCaseMapping: any[] = [];
    const checkTableExists = await this.checkCaseProjectsTableExists(schemaName);
    if (checkTableExists) {
      projectCaseMapping = await this.fetchProjectFiscalCaseMapping(
        schemaName,
        projectId
      );
    }

    for (const contact of Object.values(key_contacts)) {
      if (contact.action_type === "edit") {
        if (
          contact.key_contact_name ||
          contact.key_contact_email ||
          contact.key_contact_role_rid
        ) {
          this.keyContacts.updateKeyContactDetails(contact, userId, KeyContact);
          this.keyContacts.updateCaseKeyContactDetails(contact, userId, CaseKeyContactDetails, Case, projectCaseMapping);
        }
      } else if (contact.action_type === "delete") {
        {
          this.keyContacts.deleteKeyContactDetails(
            contact.rid,
            projectId,
            KeyContact
          );
          this.keyContacts.deleteCaseKeyContactDetails(
            contact.rid,
            projectId,
            CaseKeyContactDetails,
            Case,
            projectCaseMapping
          );
        }
      } else if (contact.action_type === "add") {
        if (
          contact.key_contact_name ||
          contact.key_contact_email ||
          contact.key_contact_role_rid
        ) {
          const createdKeyContact = await this.keyContacts.insertKeyContactDetails(
            KeyContact,
            contact,
            projectId,
            userId
          );

          this.keyContacts.insertCaseKeyContactDetails(
            contact,
            userId,
            CaseKeyContactDetails,
            Case,
            projectCaseMapping,
            projectId,
            createdKeyContact.rid
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

    const {
      technicalConsultant,
      projectPointOfContact,
      projectPointOfContactEmail,
      isEmailRecipient,
    } = await this.keyContactService.calculateKeyContactDetails(
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
      projectPointOfContactEmail,
      isEmailRecipient
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

    const { technicalConsultant, projectPointOfContact, isEmailRecipient, technicalPointOfContactEmail, projectPointOfContactEmail } =
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
      projectPointOfContactEmail,
      technicalPointOfContactEmail,
      isEmailRecipient,
      projectFiscalId
    );

    await ProjectFiscalSummary.create(summaryData);
  }

  async addAccountFiscal(accountNumber: string, projectData: ICreateProject) {
    const { AccountFiscal, AccountFiscalSummary } = await this.getModels(
      accountNumber
    );

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
      console.log("Creating new AccountFiscal record");
      let accountFiscal = await AccountFiscal.create({
        ...accountFiscalData,
        total_projects: 1,
        account_rid,
        fiscal_year,
        created_datetime: new Date(),
      });
      await AccountFiscalSummary.create({
        ...accountFiscalData,
        r_number: accountFiscal.dataValues.r_number,
        total_projects: 1,
        account_rid,
        fiscal_year,
        created_datetime: new Date(),
      });
    } else {
      console.log("Updating existing AccountFiscal record");
      await this.updateAccountFiscalAggregatesFromFiscal(
        accountNumber,
        projectData
      );
    }
  }

  async autoAssignToDefaultUserGroup(
    project_rid: string,
    account_rid: string,
    userId: string
  ) {
    const autoAssignedChildGroup = await this.mainDbSequelize?.query<{
      group_rid: string;
    }>(rawQueries.fetchUserGroups(), {
      replacements: { account_rid },
      type: QueryTypes.SELECT,
    });

    const childGroupRid = autoAssignedChildGroup?.[0]?.group_rid;
    await this.mainDbSequelize?.query(rawQueries.insertIntoGroupEntity(), {
      replacements: {
        group_rid: childGroupRid,
        entity_rid: project_rid,
        created_by: userId,
      },
    });
  }

  async addAccountFiscalRegion(
    accountNumber: string,
    projectData: ICreateProject,
    regionRid?: string
  ) {
    const { AccountFiscalRegion } = await this.getModels(accountNumber);

    const accountFiscalData = ProjectMapper.mapToAccountFiscal(projectData);

    const account_rid = projectData.account_id;
    const fiscal_year = projectData.fiscal_year;

    if (!account_rid || !fiscal_year) {
      throw new Error(
        "Missing required account_rid or fiscal_year in project data."
      );
    }
    let query;
    if (regionRid === null && projectData.region_rid == '') {
      query = {
        [Op.is]: null
      }
    } else {
      query = regionRid
    }
    //commented out since statewise summary will account only from  project resources
    // if(projectData.region_rid === '') {
    //   await AccountFiscalRegion.destroy({
    //     where : {
    //       account_rid,
    //       fiscal_year,
    //       region_rid: query,
    //     }
    //   })
    // }
    const existingFiscal = await AccountFiscalRegion.findOne({
      where: {
        account_rid,
        fiscal_year,
        region_rid: projectData.region_rid,
      },
    });

    if (!existingFiscal) {
      if (projectData.region_rid) {
        await AccountFiscalRegion.create({
          ...accountFiscalData,
          region_rid: projectData.region_rid,
          total_projects: 1,
          account_rid,
          fiscal_year,
          created_datetime: new Date(),
        });
      }
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
    const { ProjectFiscal, AccountFiscal, AccountFiscalSummary } =
      await this.getModels(accountNumber);

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
            Sequelize.literal("COALESCE(total_effort_prj, 0)")
          ),
          "total_effort_prj",
        ],
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_cost_prj, 0)")),
          "total_cost_prj",
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
            Sequelize.literal("COALESCE(total_nonlabor_prj, 0)")
          ),
          "total_nonlabor_prj",
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
        total_project_cost: aggregates.total_cost_prj,
        total_project_hours: aggregates.total_effort_prj,
        total_fte: Number(aggregates.total_fte_prj || 0),
        total_subcon: Number(aggregates.total_subcon_prj || 0),
        total_nonlabor: Number(aggregates.total_nonlabor_prj || 0),
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
        },
      }
    );

    await AccountFiscalSummary.update(
      {
        total_projects: aggregates.total_projects,
        total_project_cost: aggregates.total_cost_prj,
        total_project_hours: aggregates.total_effort_prj,
        total_fte: Number(aggregates.total_fte_prj || 0),
        total_subcon: Number(aggregates.total_subcon_prj || 0),
        total_nonlabor: Number(aggregates.total_nonlabor_prj || 0),
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
            Sequelize.literal("COALESCE(total_effort_prj, 0)")
          ),
          "total_effort_prj",
        ],
        [
          Sequelize.fn("SUM", Sequelize.literal("COALESCE(total_cost_prj, 0)")),
          "total_cost_prj",
        ],
        [
          Sequelize.cast(
            Sequelize.fn(
              "SUM",
              Sequelize.literal("COALESCE(total_fte_prj, 0)")
            ),
            "INTEGER"
          ),
          "total_fte_prj",
        ],
        [
          Sequelize.cast(
            Sequelize.fn(
              "SUM",
              Sequelize.literal("COALESCE(total_subcon_prj, 0)")
            ),
            "INTEGER"
          ),
          "total_subcon_prj",
        ],
        [
          Sequelize.cast(
            Sequelize.fn(
              "SUM",
              Sequelize.literal("COALESCE(total_nonlabor_prj, 0)")
            ),
            "INTEGER"
          ),
          "total_nonlabor_prj",
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
        total_project_cost: aggregates.total_cost_prj,
        total_project_hours: aggregates.total_effort_prj,
        total_fte: aggregates.total_fte_prj,
        total_subcon: aggregates.total_subcon_prj,
        total_nonlabor: aggregates.total_nonlabor_prj,
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
      total_nonlabor_prj: effective_total_nonlabor,
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
    if (projectData.currency_rid !== null) {
      await Project.update({
        currency_rid: projectData.currency_rid
      }, {
        where: {
          rid: projectData.project_id
        }
      })
    }

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
        effective_total_nonlabor,
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
    const { ProjectFiscalRegion, ProjectFiscal } = await this.getModels(
      accountNumber
    );

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
        [
          Sequelize.fn("SUM", Sequelize.col("total_cost_prj")),
          "effective_cost",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_effort_prj")),
          "effective_effort",
        ],
        [
          Sequelize.cast(
            Sequelize.fn("SUM", Sequelize.col("total_fte_prj")),
            "INTEGER"
          ),
          "effective_total_fte",
        ],
        [
          Sequelize.cast(
            Sequelize.fn("SUM", Sequelize.col("total_subcon_prj")),
            "INTEGER"
          ),
          "effective_total_subcon",
        ],
        [
          Sequelize.cast(
            Sequelize.fn("SUM", Sequelize.col("total_nonlabor_prj")),
            "INTEGER"
          ),
          "effective_total_nonlabor",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_effort_fte_prj")),
          "effective_fte_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_effort_subcon_prj")),
          "effective_subcon_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_cost_fte_prj")),
          "effective_fte_cost",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_cost_subcon_prj")),
          "effective_subcon_cost",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_cost_nonlabor_prj")),
          "effective_nonlabor_cost",
        ],
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
      await existingRecord.update({
        ...baseData,
        aggregateValues
      });
    } else {
      // Create new record
      if (projectData.region_rid !== null && projectData.region_rid !== '') {
        await ProjectFiscalRegion.create({
          ...baseData,
          account_rid: projectData.account_id,
          project_code: projectData.project_code,
          fiscal_year: projectData.fiscal_year,
          default_metric_type: "project",
          effective_metric_type: null,
          created_by: projectData.created_by,
          project_rid: projectData.project_id,
          project_fiscal_rid: projectData.project_fiscal_id,
          max_ai_interaction: DEFAULT_PROJECT_DETAILS.maxAiInteraction,
          auto_send_ai_interaction: false,
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

    await this.clearRemovedRegionAggregates(accountNumber, projectData);
  }
  async updateCaseProject(
    accountNumber: string,
    projectData: IUpdateProject,
    caseProjectData: CaseProject,
    existingProjectCode: string
  ) {
    const { CaseProject } = await this.getModels(accountNumber);

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
      total_nonlabor_prj: effective_total_nonlabor,
      total_effort_fte_prj: effective_fte_effort,
      total_effort_subcon_prj: effective_subcon_effort,
      total_cost_fte_prj: effective_fte_cost,
      total_cost_subcon_prj: effective_subcon_cost,
      total_cost_nonlabor_prj: effective_nonlabor_cost,
    } = baseData;

    await CaseProject.update(baseData, {
      where: {
        project_fiscal_rid: projectData.project_fiscal_id,
        case_rid: caseProjectData.case_rid
      },
    });

    await CaseProject.update(
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
        effective_total_nonlabor,
      },
      {
        where: {
          project_fiscal_rid: projectData.project_fiscal_id,
          case_rid: caseProjectData.case_rid,
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
      await CaseProject.update(
        { project_code: projectData.project_code },
        {
          where: {
            project_code: existingProjectCode,
            account_rid: projectData.account_id,
            case_rid: caseProjectData.case_rid,
          },
        }
      );

    }
  }

  async updateCaseProjectFiscalRegion(
    accountNumber: string,
    projectData: IUpdateProject,
    caseProjectData: CaseProject,
    existingProjectCode: string
  ) {
    const { CaseProjectFiscalRegion, CaseProject } = await this.getModels(
      accountNumber
    );

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

    const aggregates = await CaseProject.findAll({
      where: {
        account_rid: projectData.account_id,
        project_code: projectData.project_code,
        fiscal_year: projectData.fiscal_year,
        default_metric_type: "project",
        effective_metric_type: null,
      },
      attributes: [
        [
          Sequelize.fn("SUM", Sequelize.col("total_cost_prj")),
          "effective_cost",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_effort_prj")),
          "effective_effort",
        ],
        [
          Sequelize.cast(
            Sequelize.fn("SUM", Sequelize.col("total_fte_prj")),
            "INTEGER"
          ),
          "effective_total_fte",
        ],
        [
          Sequelize.cast(
            Sequelize.fn("SUM", Sequelize.col("total_subcon_prj")),
            "INTEGER"
          ),
          "effective_total_subcon",
        ],
        [
          Sequelize.cast(
            Sequelize.fn("SUM", Sequelize.col("total_nonlabor_prj")),
            "INTEGER"
          ),
          "effective_total_nonlabor",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_effort_fte_prj")),
          "effective_fte_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_effort_subcon_prj")),
          "effective_subcon_effort",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_cost_fte_prj")),
          "effective_fte_cost",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_cost_subcon_prj")),
          "effective_subcon_cost",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("total_cost_nonlabor_prj")),
          "effective_nonlabor_cost",
        ],
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

    const existingRecord: any = await CaseProjectFiscalRegion.findOne({
      where: matchCriteria,
    });

    if (existingRecord) {
      // Aggregate values
      await existingRecord.update({
        ...baseData,
        aggregateValues
      });
    } else {
      if (projectData.region_rid !== null && projectData.region_rid !== '') {
        await CaseProjectFiscalRegion.create({
          ...baseData,
          account_rid: projectData.account_id,
          project_code: projectData.project_code,
          fiscal_year: projectData.fiscal_year,
          default_metric_type: "project",
          effective_metric_type: null,
          created_by: projectData.created_by,
          project_rid: projectData.project_id,
          project_fiscal_rid: projectData.project_fiscal_id,
          max_ai_interaction: DEFAULT_PROJECT_DETAILS.maxAiInteraction,
          auto_send_ai_interaction: false,
          total_cost_prj: baseData.total_cost_prj,
          effective_cost: baseData.total_cost_prj,
          effective_effort: baseData.total_effort_prj,
          effective_total_fte: baseData.total_fte_prj,
          effective_total_subcon: baseData.total_subcon_prj,
          effective_fte_effort: baseData.total_effort_fte_prj,
          effective_subcon_effort: baseData.total_effort_subcon_prj,
          effective_fte_cost: baseData.total_cost_fte_prj,
          effective_subcon_cost: baseData.total_cost_subcon_prj,
          effective_nonlabor_cost: baseData.total_cost_nonlabor_prj,
          case_rid: caseProjectData.case_rid,
          case_project_rid: caseProjectData.rid,
          project_fiscal_region_rid: ''
        });
      }
    }

    if (
      existingProjectCode &&
      projectData.project_code &&
      existingProjectCode !== projectData.project_code
    ) {
      await CaseProjectFiscalRegion.update(
        { project_code: projectData.project_code },
        {
          where: {
            project_code: existingProjectCode,
            account_rid: projectData.account_id,
          },
        }
      );
    }

    await this.clearRemovedCaseRegionAggregates(accountNumber, projectData);
  }

  async clearRemovedCaseRegionAggregates(
    accountNumber: string,
    projectData: IUpdateProject
  ) {
    const { CaseProjectFiscalRegion, CaseProject } = await this.getModels(
      accountNumber
    );

    const regionsInUse = await CaseProject.findAll({
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

    await CaseProjectFiscalRegion.destroy({
      where: {
        account_rid: projectData.account_id,
        project_code: projectData.project_code,
        fiscal_year: projectData.fiscal_year,
        region_rid: {
          [Op.notIn]:
            activeRegionIds.length > 0 ? activeRegionIds : ["__none__"],
        },
        default_metric_type: "project",
        effective_metric_type: null,
      },
    });
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
          [Op.notIn]:
            activeRegionIds.length > 0 ? activeRegionIds : ["__none__"],
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

  async fetchProjectFiscalCaseMapping(accountNumber: string, projectFiscalId: string) {
    const { CaseProject } = await this.getModels(accountNumber);

    const fiscalDataById = await CaseProject.findAll({
      where: {
        project_fiscal_rid: projectFiscalId,
      },
    });

    return fiscalDataById;
  }

  async updateCaseProjectTables(accountNumber: string, caseMapping: CaseProject, projectData: IUpdateProject, existingProjectCode: string) {
    const { Case } = await this.getModels(accountNumber);

    const caseData = await Case.findOne({
      where: {
        rid: caseMapping.case_rid,
      },
    });

    if (!caseData) {
      return;
    }

    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }

    const caseStatus = await this.mainDbSequelize.query(
      rawQueries.fetchCaseStatusByRid(caseData.status_rid),
      {
        type: "SELECT",
      }
    ) as CaseStatusResult[];

    if (caseStatus[0]?.status_name === "Closed") {
      return;
    }

    await this.updateCaseProject(
      accountNumber,
      projectData,
      caseMapping,
      existingProjectCode)

    await this.updateCaseProjectFiscalRegion(
      accountNumber,
      projectData,
      caseMapping,
      existingProjectCode)
  }


  async updateProjectFiscalSummary(
    accountNumber: string,
    projectData: any,
    existingProjectCode: any
  ) {
    const { ProjectFiscalSummary, ProjectSummary } = await this.getModels(
      accountNumber
    );

    const {
      technicalConsultant,
      projectPointOfContact,
      projectPointOfContactEmail,
      technicalPointOfContactEmail,
      isEmailRecipient,
    } = await this.keyContactService.calculateKeyContactDetails(
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
      projectPointOfContact,
      projectPointOfContactEmail,
      technicalPointOfContactEmail,
      isEmailRecipient
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

  async addProjectResourceExistsFlags(projects: any[]): Promise<any[]> {
    const orgDb = await initOrgSequelize();
    const checkPromises: Promise<void>[] = [];

    for (const project of projects) {
      const { accountNumber } =
        await this.fetchValidAccountNumberById(project.account_rid);
      const schemaName = rawQueries.fetchSchemaName(accountNumber);

      if (project.ProjectFiscal && project.ProjectFiscal.length > 0) {
        for (const fiscal of project.ProjectFiscal) {
          try {
            // Check if table exists
            const checkTable: any = await orgDb.query(`
              SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = '${schemaName}'
                  AND table_name = 'project_resource'
              ) AS table_exists;
            `);

            const tableExists = checkTable[0][0].table_exists;

            if (tableExists) {
              const query = checkProjectMappedToProjectRes(schemaName, fiscal.project_fiscal_rid);

              const promise = orgDb
                .query(query)
                .then((result: any) => {
                  fiscal.is_project_exists = result[0]?.length > 0;
                })
                .catch((error) => {
                  console.error(`Error checking project resource for fiscal ${fiscal.project_fiscal_rid}:`, error);
                  fiscal.is_project_exists = false;
                });

              checkPromises.push(promise);
            } else {
              // Table doesn't exist, set flag to false
              fiscal.is_project_exists = false;
            }
          } catch (error) {
            console.error(`Error checking table existence for schema ${schemaName}:`, error);
            fiscal.is_project_exists = false;
          }
        }
      }
    }

    await Promise.all(checkPromises);
    return projects;
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
    accessibleIds: string[],
    apiSource: string = "project",
    documentRid?: string,
    searchClause: Record<symbol, any> = {}
  ) {
    const { Project, ProjectFiscal, ProjectTimeline } = await this.getModels(
      accountNumber
    );

    const parentLevelFields = [
      "project_name",
      "industry_name",
      "classification_name",
      "project_type_rid",
      "technical_point_of_contact",
      "financial_consultant",
      "project_point_of_contact",
      "project_point_of_contact_email",
      "technical_point_of_contact_email",
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
      rd_percent_final: "rd_percent_final",
      is_assesed: "is_assesed",
    };

    const childOnlyFilters = ["fiscal_year", "project_code", "rd_percent_final", "qre_final", "is_assesed"];
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
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    if (graphqlData.type == "graphql") {
      whereProject = {
        account_rid: accountData.rid,
        ...(bothParentAndChild ? parentFilters : {}),
        rid: graphqlData.project_rid,
      };
      whereFiscal = {
        account_rid: accountData.rid,
      };
      if (fiscalYear) {
        whereFiscal.fiscal_year = fiscalYear;
      }

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
            required: !!documentRid,
            where: {
              account_rid: accountData.rid,
              ...whereFiscal,
              ...searchClause,
            },
            include: [
              ...(documentRid
                ? [
                  {
                    model: ProjectTimeline,
                    as: "ProjectTimelines",
                    required: true,
                    where: {
                      document_rid: documentRid,
                      event_name: "insert"
                    },
                    attributes: [
                      "rid",
                      "entity_rid", // THIS IS CRUCIAL
                      "document_rid",
                      "event_name",
                    ],
                  },
                ]
                : []),
              // KeyContact filter-only join (no data fetched)
            ],
            attributes: {
              include: [
                ["rid", "project_fiscal_rid"],
                ["total_fte_prj", "total_fte"],
                ["total_effort_prj", "total_effort"],
                ["total_cost_prj", "total_cost"],
                ["total_cost_fte_prj", "total_cost_fte"],
                ["total_cost_subcon_prj", "total_cost_subcon"],
                ["total_cost_nonlabor_prj", "total_cost_nonlabor"],
                [
                  Sequelize.literal(`EXISTS (
                    SELECT 1
                    FROM "${schemaName}"."project_resource" pr
                    WHERE pr.project_fiscal_rid = "ProjectFiscal"."rid"
                  )`),
                  "is_project_exists",
                ],
              ],
            },
          },
        ],
      });

      if (projectData.length > 0) {
        projectData = await this.addProjectResourceExistsFlags(projectData);
      }
    } else {
      whereProject = {
        account_rid: accountData.rid,
        ...(bothParentAndChild ? parentFilters : {}),
      };
      whereFiscal = {
        account_rid: accountData.rid,
        ...(accessibleIds.length > 0 ? { rid: accessibleIds } : {}),
      };
      let activeStatusId = "";
      if (apiSource === "interaction") {
        const [activeId]: any[] = await this.mainDbSequelize!.query(
          rawQueries.fetchActiveStatus(),
          { type: "SELECT" }
        );
        whereFiscal.status_rid = activeId.rid;
        whereProject.status_rid = activeId.rid;
        activeStatusId = activeId.rid;
      }

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
        const sortDirection =
          direction.toUpperCase() === "DESC" ? "DESC" : "ASC";
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
              Sequelize.literal(`"Project"."created_datetime" ASC NULLS LAST`),
            ]);
            fullOrder.push([
              Sequelize.literal(`"ProjectFiscal"."fiscal_year" ASC`),
            ]);
          }
          else {
            if (field === "project_code" && sortDirection === "ASC") {
              fullOrder.push([
                Sequelize.literal(`"Project"."project_code" ASC NULLS LAST`),
              ]);
              fullOrder.push([
                Sequelize.literal(`"ProjectFiscal"."fiscal_year" ASC`),
              ]);
            } else if (field === "project_code" && sortDirection === "DESC") {
              fullOrder.push([
                Sequelize.literal(`"Project"."project_code" DESC NULLS LAST`),
              ]);
              fullOrder.push([
                Sequelize.literal(`"ProjectFiscal"."fiscal_year" DESC`),
              ]);
            }
            else {
              if (field === 'rd_percent_final') {
                fullOrder.push([
                  Sequelize.literal(`"Project"."project_code" ASC NULLS LAST`),
                ]);
                fullOrder.push([
                  Sequelize.literal(`"ProjectFiscal"."${field}" ${nullsHandled}`),
                ]);
              }
              else if (field === "qre_final") {
                fullOrder.push([
                  Sequelize.literal(`"Project"."project_code" ASC NULLS LAST`),
                ]);
                fullOrder.push([
                  Sequelize.literal(`"ProjectFiscal"."${field}" ${nullsHandled}`),
                ]);
              }
              else {
                if (field !== 'qre_final' && field !== 'fiscal_year' && field !== 'rd_percent_final' && field !== 'is_assesed') {
                  fullOrder.push([
                    Sequelize.literal(`"Project"."${field}" ${nullsHandled}`),
                  ]);
                }
              }
            }
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
            required: !!documentRid,
            where: {
              account_rid: accountData.rid,
              ...searchClause,
              ...whereFiscal,
            },
            include: documentRid
              ? [
                {
                  model: ProjectTimeline,
                  as: "ProjectTimelines",
                  required: true,
                  where: {
                    document_rid: documentRid,
                    event_name: "insert"
                  },
                  attributes: [
                    "rid",
                    "entity_rid", // THIS IS CRUCIAL
                    "document_rid",
                    "event_name",
                  ],
                },
              ]
              : [],
            attributes: {
              include: [
                [Sequelize.col("rid"), "project_fiscal_rid"],
                [Sequelize.col("total_fte_prj"), "total_fte"],
                [Sequelize.col("total_effort_prj"), "total_effort"],
                [Sequelize.col("total_cost_prj"), "total_cost"],
                [Sequelize.col("total_cost_fte_prj"), "total_cost_fte"],
                [Sequelize.col("total_cost_subcon_prj"), "total_cost_subcon"],
                [
                  Sequelize.col("total_cost_nonlabor_prj"),
                  "total_cost_nonlabor",
                ],
                [
                  Sequelize.literal(`EXISTS (
                    SELECT 1
                    FROM "${schemaName}"."project_resource" pr
                    WHERE pr.project_fiscal_rid = "ProjectFiscal"."rid"
                  )`),
                  "is_project_exists",
                ],
                ...(apiSource === "interaction"
                  ? [
                    [
                      Sequelize.literal(`EXISTS (
                      SELECT 1 FROM "${schemaName}"."key_contact_details" kc
                      WHERE kc.entity_rid = "ProjectFiscal"."rid"
                        AND kc.include_in_communication = true
                        AND kc.status_rid = '${activeStatusId}'
                    )`),
                      "isKeyContactIncluded",
                    ] as [any, string],
                  ]
                  : []),
              ] as (
                | string
                | [
                  (
                    | string
                    | ReturnType<typeof Sequelize.fn>
                    | ReturnType<typeof Sequelize.col>
                    | ReturnType<typeof Sequelize.literal>
                  ),
                  string
                ]
              )[],
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
          include: [
            ...(documentRid
              ? [
                {
                  model: ProjectTimeline,
                  as: "ProjectTimelines",
                  required: true,
                  where: {
                    document_rid: documentRid,
                    event_name: "insert"
                  },
                  attributes: [
                    "rid",
                    "entity_rid", // THIS IS CRUCIAL
                    "document_rid",
                    "event_name",
                  ],
                },
              ]
              : []),
          ],
          required: !!documentRid,
          where: {
            account_rid: accountData.rid,
            ...searchClause,
            ...whereFiscal,
          },
        },
      ],
      distinct: true,
    });

    if (this.mainDbSequelize) {
      let projectData = await this.enrichKeyContactsManually(
        projects,
        accountNumber,
        apiSource
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
      if (this.orgDbSequelize) {
        this.orgDbSequelize = await initOrgSequelize();
      }
      projectData = await this.insertRDAssessmentFlag(
        projectData,
        this.mainDbSequelize,
        this.orgDbSequelize!,
        schemaName,
        accountData.rid
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
      if (searchClause[Op.or] && searchClause[Op.or].length > 0) {
        projects = projects.filter((val: any) => val.ProjectFiscal.length > 0);
      }
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

    // if (projects.length > 0) {
    //   projects = await this.addProjectResourceExistsFlags(projects);
    // }

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
    accessibleIds: string[],
    documentRid?: string,
    searchClause: Record<symbol, any> = {}
  ) {
    const { Project, ProjectFiscal, ProjectTimeline } = await this.getModels(
      accountNumber
    );

    const parentLevelFields = [
      "project_name",
      "industry_name",
      "classification_name",
      "project_type_rid",
      "technical_point_of_contact",
      "financial_consultant",
      "project_point_of_contact",
      "project_point_of_contact_email",
      "technical_point_of_contact_email",
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
      rd_percent_final: "rd_percent_final",
      is_assesed: "is_assesed",
    };

    const childOnlyFilters = ["fiscal_year", "project_code", "is_assesed"];
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
          required: !!documentRid,
          where: {
            account_rid: accountData.rid,
            ...whereFiscal,
            ...searchClause,
          },
          include: documentRid
            ? [
              {
                model: ProjectTimeline,
                as: "ProjectTimelines",
                required: true,
                where: {
                  document_rid: documentRid,
                },
                attributes: [
                  "rid",
                  "entity_rid", // THIS IS CRUCIAL
                  "document_rid",
                  "event_name",
                ],
              },
            ]
            : [],
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
            "rd_percent_final",
            "comments",
            ["total_fte_prj", "total_fte"],
            "total_subcon_prj",
            "total_nonlabor_prj",
            ["total_effort_prj", "total_effort"],
            ["total_cost_prj", "total_cost"],
            ["total_cost_fte_prj", "total_cost_fte"],
            ["total_cost_subcon_prj", "total_cost_subcon"],
            ["total_cost_nonlabor_prj", "total_cost_nonlabor"],
            "is_assesed",
          ],
        },
      ],
    });

    if (this.mainDbSequelize) {
      let projectData = await this.enrichKeyContactsManually(
        projects,
        accountNumber,
        ""
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
    const allowedFieldsForExport = await schemaService.getAllowedExportFields(
      userId,
      "projects_view_edit"
    );
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
      "QRE Percent Final": "QRE Percent Final",
      "QRE Final": "QRE Final",
      "Project Point of Contact": "Key Contacts List",
      "Project Point of Contact Email": "Key Contacts List",
      "Technical Point of Contact": "Key Contacts List",
      "Technical Point of Contact Email": "Key Contacts List",
      "Comments": "Comments",
      "Last Modified": "Updated On",
      "Project ID": "Project ID",
    };

    let exportData = rawResult.flatMap((project: any) => {
      const baseRow = {
        "Project Code": project.project_code || "-",
        "Name": "-",
        "Project Type": "-",
        "Account Name": "-",
        "Fiscal Year": "-",
        "Project Classification": "-",
        "Customer Group": "-",
        "Project Group": "-",
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
        "Assessment Status": "-",
        "QRE Percent Final": project.rd_percent_final || "-",
        "QRE Final": project.qre_final || "-",
        "Project Point of Contact": "-",
        "Project Point of Contact Email": "-",
        "Technical Point of Contact": "-",
        "Technical Point of Contact Email": "-",
        "Comments": "-",
        "Last Modified": "-",
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
        let modifiedDateTime = fiscal.modified_datetime;
        const rawFiscalRow = {
          "Project Code": fiscal.project_code
            ? fiscal.project_code + " - FY" + fiscal.fiscal_year
            : "-",
          Name: fiscal.project_name || "-",
          "Project Type": fiscal.project_type_name || "-",
          "Account Name": project.account_name || "-",
          "Fiscal Year": `FY-${fiscal.fiscal_year}` || "-",
          "Project Classification": fiscal.classification_name || "-",
          "Customer Group": fiscal.project_client_group || "-",
          "Project Group": fiscal?.project_group || "-",
          "Project Effort (Hours)": fiscal.total_effort || "-",
          "Project Cost":
            formatNumberForExport(fiscal.total_cost, fiscal.currency_symbol) ||
            "-",
          "FTE Cost":
            formatNumberForExport(
              fiscal.total_cost_fte,
              fiscal.currency_symbol
            ) || "-",
          "SubCon Cost":
            formatNumberForExport(
              fiscal.total_cost_subcon,
              fiscal.currency_symbol
            ) || "-",
          "Non-Labor Cost":
            formatNumberForExport(
              fiscal.total_cost_nonlabor,
              fiscal.currency_symbol
            ) || "-",
          "Assessment Status": fiscal.assessment_status || "-",
          "QRE Percent Final": fiscal.rd_percent_final || "-", // Only base project has QRE %
          "QRE Final":
            fiscal.qre_final || // formatNumberForExport(fiscal.qre_final, project.currency_symbol)
            "-",
          "Project Point of Contact": fiscal.project_point_of_contact || "-",
          "Project Point of Contact Email": fiscal.project_point_of_contact_email || "-",
          "Technical Point of Contact":
            fiscal.technical_point_of_contact || "-",
          "Technical Point of Contact Email": fiscal.technical_point_of_contact_email || "-",
          Comments: fiscal.comments || "-",
          "Last Modified": modifiedDateTime
            ? timezone && isValidTimezone(timezone)
              ? moment
                .tz(modifiedDateTime.toISOString(), timezone)
                .add(5, 'hours').add(30, 'minutes')
                .format("YYYY-MMM-DD, hh:mm:ss A")
              : moment(modifiedDateTime.toISOString()).add(5, 'hours').add(30, 'minutes').format(
                "YYYY-MMM-DD, hh:mm:ss A"
              )
            : "-",
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
      rawQueries.fetchAccountDetailsById(schemaName),
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
          ["is_rd_claim_qualified", "is_rd_claim_qualified"],
          ["is_assesed", "is_assesed"]
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
      attributes: ["rid", "project_code", "currency_rid", "project_name"],
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

    const query = rawQueries.fetchProjectResourceById(schemaName);

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

    const query = rawQueries.fetchProjectTaskById(schemaName);

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

    const query = rawQueries.fetchResourceById(schemaName);

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

    const query = rawQueries.fetchResourceCostById(schemaName);

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

    const query = rawQueries.fetchResourceSkillById(schemaName);

    const sequelize = await this.getSequelize();
    const result = await sequelize.query(query, {
      replacements: { resourceSkillId },
      type: "SELECT",
      raw: true,
    });

    return result[0];
  }

  async fetchCaseById(accountNumber: string, caseId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = rawQueries.fetchCaseById(schemaName);

    const sequelize = await this.getSequelize();
    const result = await sequelize.query(query, {
      replacements: { caseId },
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
          rawQueries.fetchProjectClassificationById(),
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
          rawQueries.fetchProjectTypeById(),
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
          rawQueries.fetchStatusByIds(),
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

  async insertRDAssessmentFlag(
    projects: any[],
    mainDbSequelize: Sequelize,
    orgDbSequelize: Sequelize,
    schemaName: string,
    accountRid: string,
  ) {
    try {
      const [accountInfo]: any[] = await mainDbSequelize.query(
        rawQueries.fetchAccountDetailsInfo(accountRid),
        { type: 'SELECT' }
      );
      const [accountFiscalInfo]: any[] = await orgDbSequelize.query(
        rawQueries.fetchAccountInfo(schemaName, accountRid), { type: 'SELECT' }
      );
      const fiscalStart = accountFiscalInfo?.fiscal_start_date; // e.g. 'Apr/01'
      const fiscalEnd = accountFiscalInfo?.fiscal_end_date; // e.g. 'Mar/31'

      // Fetch all platform configs for this country
      const allPlatformConfigs: any[] = await mainDbSequelize.query(
        rawQueries.fetchAllPlatformConfig(accountInfo.country_rid),
        { type: 'SELECT' }
      );

      const updatedProjects = projects.map((project) => {
        const updatedProject: any = {
          ...(typeof project.toJSON === "function"
            ? project.toJSON()
            : project),
        };

        if (Array.isArray(project.ProjectFiscal)) {
          updatedProject.ProjectFiscal = project.ProjectFiscal.map((child: any) => {
            const childObj = typeof child.toJSON === "function" ? child.toJSON() : child;
            const [splitMonthStart, splitDateStart] = fiscalStart.split("/");
            const [splitMonthEnd, splitDateEnd] = fiscalEnd.split("/");
            const fetchedStartEndDate = calculateFiscalYearDateRange(splitMonthStart, splitMonthEnd, child.fiscal_year, splitDateStart, splitDateEnd)

            // Check if this fiscal period falls within any platform config's effective dates
            let is_rd_trigger_qualified = false;
            for (const config of allPlatformConfigs) {
              const effStart = new Date(config.effective_start_date);
              const effEnd = new Date(config.effective_end_date);
              // Optimized: prefer config.config_json.project_type, fallback to config.project_type_rid
              let configProjectTypes: string[] = [];
              const pjType = config.config_json?.project_type ?? config.project_type_rid;
              if (Array.isArray(pjType)) {
                configProjectTypes = pjType.map(String);
              } else if (typeof pjType === 'string') {
                configProjectTypes = pjType.split(',').map((s: string) => s.trim());
              } else if (pjType != null) {
                configProjectTypes = [String(pjType)];
              }
              if ((config.effective_start_date <= fetchedStartEndDate.endDate || config.effective_start_date == null)
                && (config.effective_end_date >= fetchedStartEndDate.startDate || config.effective_end_date == null)
                && configProjectTypes.includes(String(childObj.project_type_rid))
              ) {
                is_rd_trigger_qualified = true;
                break;
              }
            }
            return {
              ...childObj,
              is_rd_trigger_qualified: is_rd_trigger_qualified,
            };
          });
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
      "project_point_of_contact_email",
      "technical_point_of_contact_email",
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

  async enrichKeyContactsManually(
    projects: any[],
    accountNumber: string,
    apiSource: string
  ) {
    const { KeyContact } = await this.getModels(accountNumber);

    const allProjectIds = projects.map((p) => p.rid);
    const allFiscalIds = projects.flatMap((p) =>
      (p.ProjectFiscal || []).map((f: any) => f.rid)
    );

    const allIds = [...new Set([...allProjectIds, ...allFiscalIds])];
    if (allIds.length === 0) return projects;

    const allFiscalIdsForInteractions = [...new Set([...allFiscalIds])];

    // Fetch key_contact records where reference_id is in allIds
    const keyContacts: any[] = await KeyContact.findAll({
      where: {
        entity_rid: allIds,
      },
      raw: true,
    });
    const contactInteractionMap: Record<string, any[]> = {};
    if (apiSource.toLowerCase() === "interaction") {
      let interactionKeyContact: any[] = [];
      if (allFiscalIdsForInteractions.length > 0) {
        let schemaName = rawQueries.fetchSchemaName(accountNumber);
        interactionKeyContact = await KeyContact.findAll({
          where: {
            entity_rid: allFiscalIdsForInteractions,
            include_in_communication: true,
          },
          raw: true,
        });
      }
      for (const kc of interactionKeyContact) {
        const refId = kc.entity_rid;
        if (!contactInteractionMap[refId]) contactInteractionMap[refId] = [];
        contactInteractionMap[refId].push(kc);
      }
    }

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
          interactionKeyRecipients: contactInteractionMap[fiscal.rid] || [],
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
      const query = rawQueries.fetchCurrenciesByIds(placeholders);

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

      const query = rawQueries.fetchProjectResourceAndFiscal(schemaName);

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
   * Fetches project tasks for multiple project IDs using a single SQL query
   *
   * @param {string} accountNumber - Account number to determine schema
   * @param {string[]} projectIds - Array of project IDs
   * @returns {Promise<any[]>} - Project_task data
   */
  async getProjectTasksByProjectIds(
    accountNumber: string,
    projectIds: string[]
  ): Promise<any[]> {
    try {
      if (!projectIds?.length) return [];

      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;
      const sequelize = await initOrgSequelize();

      // Check if project_task table exists
      const checkTableQuery = rawQueries.checkProjectTaskExists(schemaName);

      const [tableExists] = await sequelize.query(checkTableQuery, {
        type: "SELECT",
      });

      if ((tableExists as any).exists === false) {
        return [];
      }

      const query = rawQueries.fetchProjectTaskAndFiscal(schemaName);

      const results = await sequelize.query(query, {
        replacements: { projectIds },
        type: "SELECT",
      });

      return results;
    } catch (error) {
      console.error("Error fetching project tasks:", error);
      throw error;
    }
  }

  async deleteAccountFiscalForInlineEdit(
    r_number: any,
    account_rid: any,
    fiscal_year: any,
    projectData: ICreateProject
  ) {
    const { AccountFiscal, ProjectFiscal } = await this.getModels(r_number);
    const existingProjectFiscal = await ProjectFiscal.findOne({
      where: {
        account_rid,
        fiscal_year,
      },
    });

    if (!existingProjectFiscal) {
      await AccountFiscal.destroy({
        where: {
          account_rid,
          fiscal_year,
        },
      });
    } else {
      await this.updateAccountFiscalAggregatesFromFiscal(r_number, projectData);
    }
  }

  async deleteAccountFiscalRegionForInlineEdit(
    r_number: any,
    account_rid: any,
    fiscal_year: any,
    projectData: ICreateProject
  ) {
    const { AccountFiscalRegion, ProjectFiscalRegion, ProjectFiscal } =
      await this.getModels(r_number);
    const existingProjectFiscal = await ProjectFiscal.findOne({
      where: {
        account_rid,
        fiscal_year,
        region_rid: projectData.region_rid,
      },
    });
    if (!existingProjectFiscal) {
      await ProjectFiscalRegion.destroy({
        where: {
          account_rid,
          fiscal_year,
          region_rid: projectData.region_rid,
        },
      });

      await AccountFiscalRegion.destroy({
        where: {
          account_rid,
          fiscal_year,
          region_rid: projectData.region_rid,
        },
      });
    } else {
      await this.updateAccountFiscalRegionAggregatesFromFiscal(
        r_number,
        projectData
      );
    }
  }

  async checkCaseProjectsTableExists(accountNumber: string): Promise<boolean> {
    const orgDb = await initOrgSequelize();

    // extract digits only → trd365_00001 format
    const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;

    const result = await orgDb.query(
      rawQueries.checkCaseProjectsTableExists,
      {
        replacements: { schemaName },
        type: QueryTypes.SELECT,
        plain: true, // get single record, no need array
      }
    ) as { exists: boolean };

    return !!result?.exists;
  }
}

export default ProjectIngestionService;
