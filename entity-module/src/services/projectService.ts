import moment, { Moment } from "moment";
import "moment-timezone";  
import { initOrgSequelize } from "../config/orgDataSource";
import { Project, setupProjectSequence } from "../models/project";
import { HttpStatus } from "../utils/constants";
import { ICreateProject, IUpdateProject } from "../utils/types";
import SchemaService from "./schemaService";
import {
  ProjectTimeline,
  setupProjectTimelineSeq,
} from "../models/projectTimeline";
import { ProjectFiscal, setupProjectFiscal } from "../models/projectFiscal";
import { Op, Sequelize } from "sequelize";
import {
  ProjectHistory,
  setupProjectHistorySeq,
} from "../models/projectHistory";
import { initMainDbSequelize } from "../config/mainDataSource";
import {
  KeyContact,
  setupKeyContactsSequence,
} from "../models/keyContactDetails";
import {
  ProjectSummary,
  setupProjectSummarySequence,
} from "../models/projectSummary";
import currency from "currency.js";
import ProjectIngestionService from "./projectIngestionService";
import {
  AccountFiscal,
  setupAccountFiscalSequence,
} from "../models/accountFiscal";
import { isValidTimezone } from "../utils/valideTimeChecker";
import { Logger } from "winston";

export class ProjectService {
  private schemaService: SchemaService;
  private projectIngestion: ProjectIngestionService;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.schemaService = new SchemaService();
    this.projectIngestion = new ProjectIngestionService(this.logger);
  }

  async createProject(
    projectData: ICreateProject,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { project: any };
  }> {
    try {
      const { account_id } = projectData;

      const accountData = await this.schemaService.fetchAccountById(account_id);

      if (!accountData) {
        throw new Error("Error creating project: Invalid account ID");
      }

      if (accountData.status !== "active") {
        throw new Error(
          "Project creation failed: The selected account is inactive. Please choose an active account."
        );
      }

      let accountNumber = accountData.r_number;

      if (
        accountData.parent_account_rid === null ||
        accountData.parent_account_rid === ""
      ) {
        throw new Error("Error creating project: Invalid account ID");
      }

      if (accountData.storage_type === "store_in_parent") {
        accountNumber = await this.schemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
      }

      const isExists = await this.schemaService.checkIfSchemaExists(
        accountNumber
      );

      if (!isExists) {
        throw new Error("Invalid account ID: schema doesn't exists");
      }

      await this.createProjectTables(accountNumber);

      projectData.created_by = userId;
      projectData.modified_by = userId;

      const project = await this.createProjectRecords(
        projectData,
        accountNumber,
        accountData,
        userId
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          project,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  async createProjectTables(accountNumber: string) {
    try {
      const orgDbSequlize = await initOrgSequelize();
      const mainDbSequlize = await initMainDbSequelize();
      const schemaName = `trd365_${accountNumber.replace(/\D/g, '')}`;
      

      const KeyContactModel = await KeyContact.initialize(
        orgDbSequlize,
        schemaName
      );

      const ProjectFiscalModel = await ProjectFiscal.initialize(
        orgDbSequlize,
        schemaName
      );
      const ProjectModel = await Project.initialize(orgDbSequlize, schemaName);
      const ProjectTimelineModel = await ProjectTimeline.initialize(
        orgDbSequlize,
        schemaName
      );
      const ProjectHistoryModel = await ProjectHistory.initialize(
        orgDbSequlize,
        schemaName
      );
      const AccountFiscalModel = await AccountFiscal.initialize(
        orgDbSequlize,
        schemaName
      );

      await ProjectModel.sync({ force: false });
      await ProjectFiscalModel.sync({ force: false });
      await KeyContactModel.sync({ force: false });
      await ProjectHistory.sync({ force: false });
      await ProjectTimelineModel.sync({ force: false });
      await ProjectHistoryModel.sync({ force: false });
      await AccountFiscalModel.sync({ force: false });
      await setupProjectSequence(orgDbSequlize, schemaName);
      await setupProjectFiscal(orgDbSequlize, schemaName);
      await setupProjectTimelineSeq(orgDbSequlize, schemaName);
      await setupProjectHistorySeq(orgDbSequlize, schemaName);
      await setupProjectSummarySequence(mainDbSequlize);
      await setupKeyContactsSequence(orgDbSequlize, schemaName);
      await setupAccountFiscalSequence(orgDbSequlize, schemaName);
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  async createProjectRecords(
    projectData: ICreateProject,
    accountNumber: string,
    accountData: any,
    userId: string
  ): Promise<any> {
    try {
      const existing = await this.projectIngestion.checkIfProjectExists(
        accountNumber,
        projectData,
        accountData
      );

      let createdProjectId = "";

      if (existing === "fiscal_exists") {
        throw new Error(
          "Project already exists in the account for the fiscal year"
        );
      }

      if (existing === "project_exists") {
        const existingProject = await this.projectIngestion.getProjectByCode(
          accountNumber,
          projectData.project_code,
          accountData.rid
        );

        if (existingProject && existingProject.rid) {
          const createdProjectFiscal =
            await this.projectIngestion.addProjectFiscal(
              accountNumber,
              projectData,
              existingProject.rid,
              userId
            );

          if (createdProjectFiscal && createdProjectFiscal.rid) {
            createdProjectId = createdProjectFiscal.rid;
            await this.projectIngestion.addProjectFiscalSummary(
              accountNumber,
              projectData,
              existingProject.rid,
              projectData.key_contacts,
              createdProjectFiscal.rid
            );

            await this.projectIngestion.updateProjectAggregatesFromFiscal(
              accountNumber,
              accountData.rid,
              existingProject.project_code
            );

            await this.projectIngestion.updateProjectSummaryAggregatesFromFiscal(
              accountNumber,
              existingProject.project_code,
              accountData.rid
            );

            await this.projectIngestion.addAccountFiscal(
              accountNumber,
              projectData
            );

            await this.projectIngestion.updateAccountAggregatesFromAccountFiscal(
              accountNumber,
              projectData.account_id
            );

            if (projectData.key_contacts && createdProjectFiscal.rid) {
              await this.projectIngestion.manageKeyContacts(
                projectData.key_contacts,
                createdProjectFiscal.rid,
                projectData.created_by,
                accountNumber
              );
            }
          }
        }

        return {
          rid: createdProjectId
        };
      } else {
        const createdProject =
          await this.projectIngestion.createProjectWithFiscal(
            accountNumber,
            projectData,
            userId
          );

        if (createdProject && createdProject.rid) {
          createdProjectId = createdProject.rid;
          const createdProjectFiscal =
            await this.projectIngestion.addProjectFiscal(
              accountNumber,
              projectData,
              createdProject.rid,
              userId
            );

          const startDate = projectData.project_startdate
          ? moment.utc(projectData.project_startdate, "YYYY-MM-DD")
          : null;
          const endDate = projectData.project_enddate
            ? moment.utc(projectData.project_enddate, "YYYY-MM-DD")
            : null;

          await this.projectIngestion.addProjectSummary(
            accountNumber,
            projectData,
            createdProject,
            startDate,
            endDate,
            projectData.key_contacts
          );

          await this.projectIngestion.addProjectFiscalSummary(
            accountNumber,
            projectData,
            createdProject.rid,
            projectData.key_contacts,
            createdProjectFiscal.rid || "",

          );

          await this.projectIngestion.addAccountFiscal(
            accountNumber,
            projectData
          );

          await this.projectIngestion.updateAccountAggregatesFromAccountFiscal(
            accountNumber,
            projectData.account_id
          );

          if (projectData.key_contacts) {
            await this.projectIngestion.manageKeyContacts(
              projectData.key_contacts,
              createdProject.rid || "",
              projectData.created_by,
              accountNumber
            );
            await this.projectIngestion.manageKeyContacts(
              projectData.key_contacts,
              createdProjectFiscal.rid || "",
              projectData.created_by,
              accountNumber
            );
          }

          await this.projectIngestion.addProjectTimeline(
            accountNumber,
            projectData.account_id,
            "create",
            createdProject.rid,
            projectData
          );
        }
      }

      return { rid: createdProjectId };
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  async updateProject(
    projectData: IUpdateProject,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { project: any };
  }> {
    try {
      const { account_id } = projectData;

      const accountData = await this.schemaService.fetchAccountById(account_id);

      if (accountData.status !== "active") {
        throw new Error(
          "Project creation failed: The selected account is inactive. Please choose an active account."
        );
      }

      if (!accountData) {
        throw new Error("Invalid account ID.");
      }

      if (
        accountData.parent_account_rid === null ||
        accountData.parent_account_rid === ""
      ) {
        throw new Error("Invalid account ID");
      }

      let accountNumber = accountData.r_number;

      if (accountData.storage_type === "store_in_parent") {
        accountNumber = await this.schemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
      }

      const isExists = await this.schemaService.checkIfSchemaAndTableExists(
        accountNumber
      );

      if (!isExists) {
        throw new Error("Invalid account ID: project does not exist.");
      }

      projectData.modified_by = userId;
      projectData.created_by = userId;

      await this.updateProjectRecords(
        accountNumber,
        projectData,
        accountData,
        userId
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          project: [],
        },
      };
    } catch (err) {
      throw new Error("Error updating project: " + (err as Error).message);
    }
  }

  async updateProjectRecords(
    accountNumber: string,
    projectData: IUpdateProject,
    accountData: any,
    userId: string
  ) {
    const fiscalData =
      await this.projectIngestion.checkIfProjectFiscalExistsOnUpdate(
        accountNumber,
        projectData,
        accountData.rid,
        projectData.project_fiscal_id
      );

    if (fiscalData) {
      throw new Error(
        "Project already exists in the account for the fiscal year"
      );
    }

    const existingFiscalData =
      await this.projectIngestion.fetchProjectFiscalById(
        accountNumber,
        projectData.project_fiscal_id
      );

    await this.projectIngestion.updateProjectFiscal(
      accountNumber,
      projectData,
      existingFiscalData?.project_code || ""
    );

    if (projectData.key_contacts) {
      await this.projectIngestion.manageKeyContacts(
        projectData.key_contacts,
        projectData.project_fiscal_id,
        userId,
        accountNumber
      );
    }

    await this.projectIngestion.updateProjectHistory(
      accountNumber,
      projectData,
      existingFiscalData
    );

    await this.projectIngestion.updateProjectFiscalSummary(
      accountNumber,
      projectData,
      existingFiscalData?.project_code
    );

    await this.projectIngestion.updateProjectAggregatesFromFiscal(
      accountNumber,
      accountData.rid,
      projectData.project_code
    );

    await this.projectIngestion.updateProjectSummaryAggregatesFromFiscal(
      accountNumber,
      projectData?.project_code || "",
      accountData.rid
    );

    await this.projectIngestion.addAccountFiscal(accountNumber, projectData);

    await this.projectIngestion.updateAccountAggregatesFromAccountFiscal(
      accountNumber,
      accountData.rid
    );
  }

  async projectById(
    accountId: string,
    projectId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { project: any };
  }> {
    try {
      const accountData = await this.schemaService.fetchAccountById(accountId);

      if (!accountData) {
        throw new Error("Invalid account ID");
      }

      if (
        accountData.parent_account_rid === null ||
        accountData.parent_account_rid === ""
      ) {
        throw new Error("Invalid account ID");
      }

      let accountRNumber = accountData.r_number;

      if (accountData.storage_type === "store_in_parent") {
        accountRNumber = await this.schemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
      }

      const isExists = await this.schemaService.checkIfSchemaAndTableExists(
        accountRNumber
      );

      if (!isExists) {
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            project: [],
          },
        };
      }

      let projectData = await this.projectIngestion.fetchProjectById(accountRNumber, projectId);

      if (projectData) {
        const mainDbInit = await initMainDbSequelize();

        await this.assignCurrencyRid(projectData, mainDbInit);

        projectData = await this.projectIngestion.enrichKeyContactsByProjectId(projectData, accountRNumber);

        projectData = await this.schemaService.insertProjectGeoData(
          projectData,
          mainDbInit
        );
        projectData = await this.schemaService.insertIndustyName(
          projectData,
          mainDbInit
        );
        projectData = await this.schemaService.insertProjectTypeAndStatus(
          projectData,
          mainDbInit
        );
        projectData = await this.schemaService.projectKeyContactData(
          projectData,
          mainDbInit
        );
        projectData = await this.schemaService.projectClassificationData(
          projectData,
          mainDbInit
        );

        projectData = this.insertAccount(projectData, accountData);

        projectData = await this.schemaService.insertUserDetails(projectData);
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          project: projectData,
        },
      };
    } catch (err) {
      throw new Error(
        "Error fetching project by ID: " + (err as Error).message
      );
    }
  }

  insertAccount(project: any, account: any,){
    return {
      ...(project),
      account_name: account.account_name,
      account_status:account.status
    }
  }

  async projectList(
    accountId: string,
    fiscalYear: number = 0,
    page: number = 1,
    limit: number = 10,
    search: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    bothParentAndChild: boolean = false
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; totalCount: number };
  }> {
    try {

      const accountData = await this.schemaService.fetchAccountById(accountId);

      if (!accountData) {
        throw new Error("Invalid account account ID.");
      }

      if (
        accountData.parent_account_rid === null ||
        accountData.parent_account_rid === ""
      ) {
        throw new Error("Invalid account ID");
      }

      let accountRNumber = accountData.r_number;

      if (accountData.storage_type === "store_in_parent") {
        accountRNumber = await this.schemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
      }

      const isExists = await this.schemaService.checkIfSchemaAndTableExists(
        accountRNumber
      );

      if (!isExists) {
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            projects: [],
            totalCount: 0,
          },
        };
      }

      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );
      const [finalMetaDataSortBy, finalMetaDataSortOrder] =
        this.getMetaDataSortParameters(sortBy, sortOrder);

      const { whereClause } = this.buildWhereClause(filters, search, false, bothParentAndChild);

      const offset = (page - 1) * limit;

      const order = [[finalSortBy, finalSortOrder]];

      const { projects, count } = await this.projectIngestion.fetchProjectList(
        accountRNumber,
        accountData,
        whereClause,
        fiscalYear,
        offset,
        limit,
        order,
        bothParentAndChild,
        filters,
        finalMetaDataSortBy,
        finalMetaDataSortOrder
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projects: projects,
          totalCount: count,
        },
      };
    } catch (err) {
      throw new Error("Error fetching project: " + (err as Error).message);
    }
  }

  async exportProjectList(
    accountId: string,
    fiscalYear: number = 0,
    search: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    bothParentAndChild: boolean = false,
    timezone: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; totalCount: number };
  }> {
    try {

      const accountData = await this.schemaService.fetchAccountById(accountId);

      if (!accountData) {
        throw new Error("Invalid account account ID.");
      }

      if (
        accountData.parent_account_rid === null ||
        accountData.parent_account_rid === ""
      ) {
        throw new Error("Invalid account ID");
      }

      let accountRNumber = accountData.r_number;

      if (accountData.storage_type === "store_in_parent") {
        accountRNumber = await this.schemaService.fetchParentAccount(
          accountData.parent_account_rid
        );
      }

      const isExists = await this.schemaService.checkIfSchemaAndTableExists(
        accountRNumber
      );

      if (!isExists) {
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            projects: [],
            totalCount: 0,
          },
        };
      }

      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );
      const [finalMetaDataSortBy, finalMetaDataSortOrder] =
        this.getMetaDataSortParameters(sortBy, sortOrder);

      const { whereClause } = this.buildWhereClause(filters, search, false, bothParentAndChild);

      const order = [[finalSortBy, finalSortOrder]];

      const { exportData, count } = await this.projectIngestion.fetchProjectListExport(
        accountRNumber,
        accountData,
        whereClause,
        fiscalYear,
        order,
        bothParentAndChild,
        filters,
        finalMetaDataSortBy,
        finalMetaDataSortOrder,
        timezone
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projects: exportData,
          totalCount: count,
        },
      };
    } catch (err) {
      throw new Error("Error fetching project: " + (err as Error).message);
    }
  }

  async allProjectList(
    fiscalYear: number = 0,
    page: number = 1,
    limit: number = 100,
    search: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    globalFilters: Record<string, string[]> = {},
    userId: string,
    bothParentAndChild: boolean,
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; count: number };
  }> {
    try {
      const offset = (page - 1) * limit;

      const [finalSortBy, finalSortOrder] =
        this.getSortParametersForAllProjects(sortBy, sortOrder);

      const { accountDataSort } = this.processAccountDataSort(
        sortBy,
        sortOrder
      );

      const sort = {
        sortCol: finalSortBy,
        sortOrder: finalSortOrder,
      };

      const appliedAccountNumber =
        await this.schemaService.computeGlobalAccountFilter(globalFilters);

      const { finalResult: allProjectList, totalCount } =
        await this.schemaService.fetchAllProjects(
          offset,
          limit,
          sort,
          filters,
          fiscalYear,
          appliedAccountNumber,
          userId,
          search,
          accountDataSort,
          bothParentAndChild
        );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projects: allProjectList,
          count: totalCount,
        },
      };
    } catch (err) {
      throw new Error("Error fetching project: " + (err as Error).message);
    }
  }

  async exportAllProjectList(
    fiscalYear: number = 0,
    search: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    globalFilters: Record<string, string[]> = {},
    userId: string,
    bothParentAndChild: boolean,
    timezone: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; count: number };
  }> {
    try {
      const [finalSortBy, finalSortOrder] =
        this.getSortParametersForAllProjects(sortBy, sortOrder);
 
      const { accountDataSort } = this.processAccountDataSort(
        sortBy,
        sortOrder
      );
 
      const sort = {
        sortCol: finalSortBy,
        sortOrder: finalSortOrder,
      };
 
      const appliedAccountNumber =
        await this.schemaService.computeGlobalAccountFilter(
          globalFilters,
        );
 
      const { finalResult: allProjectList, totalCount } =
        await this.schemaService.fetchAllProjectsForExport(
          sort,
          filters,
          fiscalYear,
          appliedAccountNumber,
          userId,
          search,
          bothParentAndChild
        );
 
        const formatNumberForExport = (value: any, currency_symbol: string): string => {
          if (value == null || value === '') return '-';
          const num = Number(value);
          if (isNaN(num)) return '-';
          // Use currency.js to format the number with the provided currency symbol
          return currency(num, {
            symbol: currency_symbol? currency_symbol : '$',
            precision: 2,
            pattern: '! #',
            separator: ',',
            decimal: '.'
          }).format();
        };  
 
      const rawResult = allProjectList || [];
      let exportData: any[] = [];
 
      rawResult.forEach((project: any) => {
        // Always add base project data row first
        exportData.push({
          "Project Group": project?.project_group || "-",
          "Project Code": project.project_code || "-",
          "Project Name": project.project_name || "-",
          "Project Type": project.project_type_name || "-",
          "Account Name": project.account_name || "-",
          "Fiscal Year": "-",
          "Project Classification": project.classification_name || "-",
          "Customer Group": project.project_client_group || "-",
          "Project Effort (Hours)": project.total_effort || "-",
          "Project Cost": formatNumberForExport(project.total_cost, project.currency_symbol) || "-",
          "FTE Cost": formatNumberForExport(project.total_cost_fte, project.currency_symbol) || "-",
          "SubCon Cost": formatNumberForExport(project.total_cost_subcon, project.currency_symbol) || "-",
          "Non-Labor Cost": formatNumberForExport(project.total_cost_nonlabor, project.currency_symbol) || "-",
          "Assessment Status": project.assessment_status || "-",
          "QRE%": project.qre || "-",
          "QRE": "-",
          "Project Point of Contact": project.project_point_of_contact || "-",
          "Technical Point of Contact": project.technical_point_of_contact || "-",
          "Comments": project.comments || "-",
          "Last Modified": project.modified_datetime
          ? timezone && isValidTimezone(timezone)
          ? moment(project.modified_datetime).tz(timezone).format('YYYY-MM-DD, hh:mm:ss A')
          : moment(project.modified_datetime).format('YYYY-MM-DD, hh:mm:ss A')
          : '-',
          "Project ID": project.r_number || "-",
        });
 
        // Add fiscal summary rows if they exist
        const fiscalSummaries = project.project_fiscal_summary || [];
        if (fiscalSummaries.length > 0) {
          fiscalSummaries.forEach((fiscal: any) => {
            exportData.push({
              "Project Group": fiscal?.project_group || "-",
              "Project Code": (fiscal.project_code ? fiscal.project_code + ' - FY' + fiscal.fiscal_year : "-") || "-",
              "Project Name": fiscal.project_name || "-",
              "Project Type": fiscal.project_type_name || "-",
              "Account Name": fiscal.account_name || "-",
              "Fiscal Year":  `FY${fiscal.fiscal_year}` || "-",
              "Project Classification": fiscal.classification_name || "-",
              "Customer Group": fiscal.project_client_group || "-",
              "Project Effort (Hours)": fiscal.total_effort_prj || "-",
              "Project Cost": formatNumberForExport(fiscal.total_cost_prj, project.currency_symbol) || "-",
              "FTE Cost": formatNumberForExport(fiscal.total_cost_fte_prj, project.currency_symbol) || "-",
              "SubCon Cost": formatNumberForExport(fiscal.total_cost_subcon_prj, project.currency_symbol) || "-",
              "Non-Labor Cost": formatNumberForExport(fiscal.total_cost_nonlabor_prj, project.currency_symbol) || "-",
              "Assessment Status": fiscal.assessment_status || "-",
              "QRE%": "-",
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
            });
          });
        }
      });
 
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projects: exportData,
          count: totalCount,
        },
      };
    } catch (err) {
      throw new Error("Error fetching project: " + (err as Error).message);
    }
  }

  async addProjectTimeline(
    accountNumber: string,
    accountId: string,
    eventName: string,
    projectId: string,
    projectData: ICreateProject
  ) {
    try {
      const schemaName = `trd365_${accountNumber.replace(/\D/g, '')}`;
      const sequelize = await initOrgSequelize();

      const ProjectTimelineModel = await ProjectTimeline.initialize(
        sequelize,
        schemaName
      );

      await ProjectTimelineModel.create({
        account_rid: accountId,
        event_name: eventName,
        event_status: "success",
        event_type: "ui handler",
        entity_rid: projectId,
        created_by:
          eventName === "update"
            ? projectData.modified_by || ""
            : projectData.created_by || "",
      });
    } catch (err) {
      throw new Error("Error adding timeline : " + (err as Error).message);
    }
  }

  async addProjectFiscalRecords(
    projectData: any,
    sequilzeInstance: Sequelize,
    schemaName: string,
    projectRid: string
  ) {
    try {
      const ProjectFiscalModel = await ProjectFiscal.initialize(
        sequilzeInstance,
        schemaName
      );

      const projectFiscalData = {
        project_rid: projectRid,
        project_name: projectData.project_name || "",
        eid: projectData.eid || null,
        fiscal_year: projectData.fiscal_year,
        account_rid: projectData.account_rid,
        project_code: projectData.program_code,

        max_ai_interactions: projectData.max_ai_interaction || 0,
        expiry_duration: null,

        autosend_interaction: projectData.auto_send_ai_interaction ?? false,
        status_rid: projectData.status_rid,
        project_startdate: projectData.project_startdate || null,
        project_enddate: projectData.project_enddate || null,

        total_fte_prj: projectData.total_fte || null,
        total_subcon_prj: projectData.total_sub_con || null,

        blended_rate_fte: projectData.blended_rate_fte || null,
        blended_rate_subcon: projectData.blended_rate_sub_con || null,

        created_by: projectData.created_by,
        modified_by: projectData.modified_by || null,
        created_datetime: projectData.created_datetime || new Date(),
        modified_datetime: projectData.modified_datetime || new Date(),

        interaction_cc_list: projectData.project_cc_list || null,
        claim_status: null,

        total_cost_prj: projectData.total_cost || 0,
        total_cost_nonlabor_prj: projectData.total_non_labor_cost,
        total_cost_fte_prj: projectData.total_fte_cost,
        total_cost_subcon_prj: projectData.total_sub_con_cost,

        total_hours_prj: projectData.total_effort,
        total_hours_fte_prj: projectData.total_fte_effort,
        total_hours_subcon_prj: projectData.total_sub_con_effort,
      };

      // await ProjectFiscalModel.create(projectFiscalData);
    } catch (err) {
      throw new Error("Error adding project fiscal: " + (err as Error).message);
    }
  }

  async updateProjectFiscal(
    projectData: any,
    sequilzeInstance: Sequelize,
    schemaName: string,
    projectRid: string
  ) {
    try {
      const ProjectFiscalModel = await ProjectFiscal.initialize(
        sequilzeInstance,
        schemaName
      );

      const updateData = {
        account_rid: projectData.account_id,
        fiscal_year: projectData.fiscal_year,
        max_ai_interaction: projectData.max_ai_interaction || 0,
        auto_send_ai_interaction: projectData.auto_send_ai_interaction ?? false,
        project_startdate: projectData?.project_startdate || null,
        project_enddate: projectData?.project_enddate || null,

        total_fte: projectData.total_fte || null,
        total_sub_con: projectData.total_sub_con || null,

        total_cost: projectData.total_cost || null,
        blended_rate_fte: projectData.blended_rate_fte || null,
        blended_rate_sub_con: projectData.blended_rate_sub_con || null,
        interaction_cc_list: projectData.project_cc_list || null,
        modified_by: projectData.modified_by,
        modified_datetime: new Date(),
        status_rid: projectData.status_rid,

        total_fte_prj: projectData.total_fte || null,
        total_subcon_prj: projectData.total_sub_con || null,

        total_cost_prj: projectData.total_cost || null,
        total_cost_fte_prj: projectData.total_fte_cost || null,
        total_cost_subcon_prj: projectData.total_sub_con_cost,
        total_cost_nonlabor_prj: projectData.total_non_labor_cost,

        total_hours_prj: projectData.total_effort,
        total_hours_fte_prj: projectData.total_fte_effort,
        total_hours_subcon_prj: projectData.total_sub_con_effort,
      };

      await ProjectFiscalModel.update(updateData, {
        where: {
          project_rid: projectRid,
        },
      });
    } catch (err) {
      throw new Error(
        "Error updating project fiscal: " + (err as Error).message
      );
    }
  }

  async updateProjectHistory(
    accountNumber: string,
    projectId: string,
    newProjectData: any,
    existingProjectData: any
  ) {
    try {
      const schemaName = `trd365_${accountNumber.replace(/\D/g, '')}`;
      const sequelize = await initOrgSequelize();
      const ProjectHistoryModel = await ProjectHistory.initialize(
        sequelize,
        schemaName
      );

      const excludedFields = [
        "created_by",
        "modified_by",
        "account_rid",
        "modified_datetime",
      ];

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
          project_rid: projectId,
          attribute_name: key,
          old_value:
            existingProjectData[key] !== null &&
            existingProjectData[key] !== undefined
              ? String(existingProjectData[key])
              : "",
          new_value:
            newValue !== null && newValue !== undefined ? String(newValue) : "",
          created_by: newProjectData["modified_by"],
        }));

      if (historyChanges.length === 0) return;

      await ProjectHistoryModel.bulkCreate(historyChanges);
    } catch (err) {
      throw new Error(
        "Error updating project history : " + (err as Error).message
      );
    }
  }


  async calculateKeyContactDetails(keyContacts: any[], mainDbSequlize: any) {
    let technicalConsultant = "-";
    let financialConsultant = "-";
    let projectPointOfContact = "-";

    if (keyContacts) {
      const keyContactIds = [
        ...new Set(keyContacts.map((r: any) => r.key_contact_role)),
      ].filter(Boolean);

      let keyContactMap: Record<string, string> = {};

      if (keyContactIds.length > 0) {
        const keyContactRows = await mainDbSequlize.query(
          `SELECT rid, role_name FROM key_contact_role WHERE rid IN (:ids)`,
          {
            replacements: { ids: keyContactIds },
            type: "SELECT",
          }
        );

        keyContactMap = Object.fromEntries(
          keyContactRows.map((c: any) => [c.rid, c.role_name])
        );
      }

      const enrichedKeyContacts = keyContacts.map((kc: any) => ({
        ...kc,
        role_name: keyContactMap[kc.key_contact_role] || null,
      }));

      const technicalContact = enrichedKeyContacts.find(
        (e: any) =>
          e.role_name === "Client Project Technical Point of Contact" && e.is_primary_contact
      );
      const financialContact = enrichedKeyContacts.find(
        (e: any) =>
          e.role_name === "Financial Consultant" && e.is_primary_contact
      );
      const pointOfContact = enrichedKeyContacts.find(
        (e: any) =>
          e.role_name === "Client Project Point of Contact" && e.is_primary_contact
      );

      technicalConsultant = technicalContact
        ? technicalContact.key_contact_name
        : null;
      financialConsultant = financialContact
        ? financialContact.key_contact_name
        : null;
      projectPointOfContact = pointOfContact
        ? pointOfContact.key_contact_name
        : null;
    } else {
      return {
        technicalConsultant: null,
        financialConsultant: null,
        projectPointOfContact: null,
      };
    }

    return { technicalConsultant, financialConsultant, projectPointOfContact };
  }

  getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "r_number",
      "project_code",
      "industry_name",
      "project_startdate",
      "project_name",
      "program_name",
      "project_enddate",
      "project_type_rid",
      "project_type",
      "project_classification_rid",
      "project_client_group",
      "project_group",
      "status_rid",
      "account_rid",
      "rid",
      "total_cost",
      "total_effort",
      "total_fte",
      "total_cost_fte",
      "total_subcon",
      "total_cost_subcon",
      "total_cost_nonlabor",
      "country_rid",
      "region",
      "currency",
      "qualified_research_expenditure",
      "is_rd_qualified",
      "qre",
      "fiscal_year",
      "comments",
      "modified_datetime",
      "assessment_status",
      "qre_final"
    ];

    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  getMetaDataSortParameters(
    sortBy: string,
    sortOrder: string
  ): [string, string] {
    const validSortColumns = [
      "account_name",
      "country_name",
      "region_name",
      "currency_name",
      "technical_point_of_contact",
      "financial_consultant",
      "project_point_of_contact",
      "classification_name",
      "industry_name",
      "project_type_name",
      "project_type_rid"
    ];

    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  buildWhereClause(
    filters: Record<string, any>,
    search: string,
    isAllProject: boolean = false,
    isParent: boolean = false
  ): {
    whereClause: Record<string, any>;
  } {
    let whereClause: Record<string, any> = {};

    if (search) {
      whereClause = this.buildSearchCondition(
        search,
        whereClause,
        isAllProject
      );
    }

    whereClause = this.applyFilters(filters, whereClause, isAllProject, isParent);

    return { whereClause };
  }

  private buildSearchCondition(
    search: string,
    whereClause: Record<string, any>,
    isAllProject: boolean
  ): Record<string, any> {
    const searchCondition = [
      { industry: { [Op.iLike]: `%${search}%` } },
      { r_number: { [Op.iLike]: `%${search}%` } },
    ];

    let AllProjectsearchCondition = null;

    if (isAllProject) {
      AllProjectsearchCondition = [
        { industry: { [Op.iLike]: `%${search}%` } },
        { r_number: { [Op.iLike]: `%${search}%` } },
        { project_code: { [Op.iLike]: `%${search}%` } },
        { project_name: { [Op.iLike]: `%${search}%` } },
        { project_description: { [Op.iLike]: `%${search}%` } },
        { status_rid: { [Op.iLike]: `%${search}%` } },
        ...(isNaN(parseInt(search))
          ? []
          : [
              { total_cost: { [Op.eq]: parseInt(search) } },
              { total_effort: { [Op.eq]: parseInt(search) } },
            ]),
      ];
    }

    const finalSearchCondition = {
      [Op.or]: isAllProject ? AllProjectsearchCondition : searchCondition,
    };

    return Object.keys(whereClause).length > 0
      ? { [Op.and]: [whereClause, finalSearchCondition] }
      : finalSearchCondition;
  }

  private applyFilters(
    filters: Record<string, any>,
    whereClause: Record<string, any>,
    isAllProject: boolean,
    isParent: boolean
  ): Record<string, any> {
    const castToTextFields = [
      "rid",
      "project_startdate",
      "project_enddate",
      "total_effort",
      "total_cost",
      "fiscal_year",
    ];

    const numberFields = [
      "total_effort",
      "total_cost",
      "fiscal_year",
      "total_fte",
      "total_cost_fte",
      "total_effort_prj",
      "total_subcon",
      "total_cost_subcon",
      "total_cost_nonlabor",
      "qualified_research_expenditure",
      "qre",
      "qre_final"
    ];
    const dateFields = [
      "project_startdate",
      "project_enddate",
      "modified_datetime",
    ];
    const enumFields = ["status_rid", "project_type_rid", "fiscal_year", "ProjectFiscal.project_type_rid"];
    const booleanFields = ["is_rd_qualified"];

    const filterFields = this.getFilterFields(isAllProject, isParent);

    filterFields.forEach(({ clientField, dbField }) => {
      if (filters[clientField]) {
        const fieldFilter = filters[clientField];
        const isNumber = numberFields.includes(dbField);
        const isDate = dateFields.includes(dbField);
        const isEnum = enumFields.includes(dbField);
        const isBoolean = booleanFields.includes(dbField);
        const isTextCastNeeded =
          castToTextFields.includes(clientField) &&
          !isNumber &&
          !isDate &&
          !isBoolean;

        if (isTextCastNeeded) {
          whereClause[dbField] = Sequelize.where(
            Sequelize.cast(Sequelize.col(dbField), "TEXT"),
            this.getFieldFilter(
              fieldFilter,
              dbField,
              isNumber,
              isDate,
              isEnum,
              isBoolean
            )
          );
        } else {
          whereClause[dbField] = this.getFieldFilter(
            fieldFilter,
            dbField,
            isNumber,
            isDate,
            isEnum,
            isBoolean
          );
        }
      }
    });

    return whereClause;
  }

  private getFieldFilter(
    fieldFilter: any,
    dbField: string,
    isNumberField: boolean,
    isDateField: boolean,
    isEnumField: boolean,
    isBooleanField: boolean
  ): any {
    if (isNumberField) {
      if (fieldFilter.equals !== undefined) {
        return { [Op.eq]: fieldFilter.equals };
      }
      if (fieldFilter.not_equals !== undefined) {
        return {
          [Op.or]: [{ [Op.ne]: fieldFilter.not_equals }, { [Op.is]: null }],
        };
      }
      if (fieldFilter.less_than !== undefined) {
        return { [Op.lt]: fieldFilter.less_than };
      }
      if (fieldFilter.greater_than !== undefined) {
        return { [Op.gt]: fieldFilter.greater_than };
      }
      if (
        fieldFilter.between &&
        Array.isArray(fieldFilter.between) &&
        fieldFilter.between.length === 2
      ) {
        return {
          [Op.between]: [fieldFilter.between[0], fieldFilter.between[1]],
        };
      }
      if (fieldFilter.is_empty === true) {
        return { [Op.or]: [null] };
      }
    }

    if (isDateField) {
      if (fieldFilter.equals !== undefined) {
        if (fieldFilter.equals !== undefined) {
          const dateStr = fieldFilter.equals;

          const startOfDay = moment
            .utc(dateStr, "YYYY-MM-DD")
            .startOf("day")
            .toDate();
          const endOfDay = moment
            .utc(dateStr, "YYYY-MM-DD")
            .endOf("day")
            .toDate();

          return {
            [Op.between]: [startOfDay, endOfDay],
          };
        }
      }
      if (fieldFilter.before !== undefined) {
        return { [Op.lt]: this.normalizeDate(fieldFilter.before) };
      }
      if (fieldFilter.after !== undefined) {
        return { [Op.gt]: this.normalizeDate(fieldFilter.after) };
      }
      if (
        fieldFilter.between &&
        Array.isArray(fieldFilter.between) &&
        fieldFilter.between.length === 2
      ) {
        return {
          [Op.between]: [
            this.normalizeDate(fieldFilter.between[0]),
            this.normalizeDate(fieldFilter.between[1]),
          ],
        };
      }
      if (fieldFilter.is_empty === true) {
        return { [Op.or]: [null] };
      }
    }

    if (isEnumField) {
      if (fieldFilter.equals !== undefined) {
        return { [Op.eq]: fieldFilter.equals };
      }
      if (fieldFilter.not_equals !== undefined) {
        return {
          [Op.or]: [{ [Op.ne]: fieldFilter.not_equals }, { [Op.is]: null }],
        };
      }
      if (fieldFilter.in && Array.isArray(fieldFilter.in)) {
        return { [Op.in]: fieldFilter.in };
      }
      if (fieldFilter.is_empty === true) {
        return { [Op.or]: [null] };
      }
    }

    if (isBooleanField) {
      if (fieldFilter.isTrue === true) {
        return { [Op.eq]: true };
      }
      if (fieldFilter.isFalse === true) {
        return { [Op.eq]: false };
      }
      if (fieldFilter.is_empty === true) {
        return { [Op.or]: [null] };
      }
    }

    // String (default)
    if (fieldFilter.equals) {
      return { [Op.iLike]: fieldFilter.equals };
    }
    if (fieldFilter.not_equals) {
      return {
        [Op.or]: [{ [Op.notILike]: fieldFilter.not_equals }, { [Op.is]: null }],
      };
    }
    if (fieldFilter.contains) {
      return { [Op.iLike]: `%${fieldFilter.contains}%` };
    }
    if (fieldFilter.not_contains) {
      return {
        [Op.or]: [
          { [Op.notILike]: `%${fieldFilter.not_contains}%` },
          { [Op.is]: null },
        ],
      };
    }
    if (fieldFilter.is_empty === true) {
      return { [Op.or]: [null, ""] };
    }
    if (fieldFilter.value) {
      return fieldFilter.value;
    }

    return undefined;
  }

  getSortParametersForAllProjects(
    sortBy: string,
    sortOrder: string,
  ): [string, string] {
    const validSortColumns = [
      "r_number",
      "project_code",
      "industry_name",
      "project_startdate",
      "project_enddate",
      "project_name",
      "total_effort",
      "total_cost",
      "status_rid",
      "fiscal_year",
      "account_name",
      "program_name",
      "is_rd_qualified",
      "qre",
      "qre_final",
      "total_fte",
      "total_cost_fte",
      "total_subcon",
      "total_cost_subcon",
      "total_cost_nonlabor",
      "comments",
      "country_name",
      "currency_code",
      "region_name",
      "project_number",
      "project_point_of_contact",
      "financial_consultant",
      "technical_point_of_contact",
      "project_client_group",
      "project_group",
      "classification_name",
      "modified_datetime",
      "assessment_status",
      "project_type_rid",
    ];   
    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }
    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  processAccountDataSort(sortBy: string, sortOrder: string) {
    const accountDataSort: string[][] = [];
    const accountFields = ["account_number", "account_name"];

    if (accountFields.includes(sortBy)) {
      accountDataSort.push([
        sortBy,
        sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC",
      ]);
    }

    return {
      accountDataSort,
    };
  }

  normalizeDate(input: string): any | null {
    let parsed = moment.utc(input, "YYYY-MM-DD", true);
    if (!parsed.isValid()) throw new Error("Invalid date");

    const startOfDay = parsed.startOf("day").toDate();
    return startOfDay;
  }

  getFilterFields(
    isAllProject: boolean,
    isParent: boolean
  ): { clientField: string; dbField: string }[] {
    const projectFilterFields = [
      { clientField: "rid", dbField: "rid" },
      { clientField: "r_number", dbField: "r_number" },
      { clientField: "project_code", dbField: "project_code" },
      { clientField: "program_name", dbField: "program_name" },
      { clientField: "project_name", dbField: "project_name" },
      { clientField: "project_description", dbField: "project_description" },
      { clientField: "fiscal_year", dbField: "fiscal_year" },
      { clientField: "total_effort", dbField: "total_effort"},
      { clientField: "total_cost", dbField: "total_cost" },
      { clientField: "status_rid", dbField: "status_rid" },
      { clientField: "project_type_rid", dbField: "project_type_rid" },
      { clientField: "project_startdate", dbField: "project_startdate" },
      { clientField: "project_enddate", dbField: "project_enddate" },
      { clientField: "project_client_group", dbField: "project_client_group" },
      { clientField: "project_group", dbField: "project_group" },
      { clientField: "created_datetime", dbField: "created_datetime" },
      { clientField: "created_by", dbField: "created_by" },
      { clientField: "total_cost_fte", dbField: "total_cost_fte" },
      { clientField: "total_fte", dbField: "total_fte" },
      { clientField: "total_subcon", dbField: "total_subcon" },
      { clientField: "total_cost_subcon", dbField: "total_cost_subcon" },
      { clientField: "total_cost_nonlabor", dbField: "total_cost_nonlabor" },
      { clientField: "comments", dbField: "comments" },
      { clientField: "qre_final", dbField: "qre_final" },
      {
        clientField: "qualified_research_expenditure",
        dbField: "qualified_research_expenditure",
      },
      { clientField: "is_rd_qualified", dbField: "is_rd_qualified" },
      { clientField: "qre", dbField: "qre" },
      { clientField: "modified_datetime", dbField: "modified_datetime" },
      { clientField: "assessment_status", dbField: "assessment_status" },
    ];

    return projectFilterFields;
  }

  buildMetaDataWhereClause(filters: Record<string, any>) {
    const filterFields = [
      { clientField: "account_name", dbField: "account_name" },
      { clientField: "country_name", dbField: "country_name" },
      { clientField: "region_name", dbField: "region_name" },
      { clientField: "currency_name", dbField: "currency_name" },
      {
        clientField: "technical_point_of_contact",
        dbField: "technical_point_of_contact",
      },
      { clientField: "financial_consultant", dbField: "financial_consultant" },
      {
        clientField: "project_point_of_contact",
        dbField: "project_point_of_contact",
      },
      { clientField: "classification_name", dbField: "classification_name" },
    ];

    return filterFields;
  }

  /**
   * Fetches a list of project classification from the database.
   *
   * @returns {Promise<{ statusCode: number, message: string, errorMessage?: string, data?: { country: any } }>} The response object containing status code, message, and a list of countries.
   * - statusCode: HTTP status code indicating the result of the request.
   * - message: A success or error message based on the outcome of the request.
   * - errorMessage (optional): The error message in case of a failure.
   * - data (optional): An object containing the list of project classification if the request is successful.
   */
  async getProjectClassification(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectClassifications: any; count: number };
  }> {
    try {
      const mainDbSequlize = await initMainDbSequelize();
      const projectClassifications = await mainDbSequlize.query(
        `SELECT rid, classification_name, classification_description, classification_status
         FROM project_classification
         WHERE classification_status = 'Active'
         ORDER BY classification_name ASC`,
        {
          type: "SELECT",
        }
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectClassifications,
          count: projectClassifications.length,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Formats an error response to be returned from service methods.
   *
   * @param {Error} err - The caught error.
   * @returns {object} - Standardized error response object.
   */
  throwServiceError(err: Error): {
    statusCode: number;
    message: string;
    errorMessage: string;
  } {
    return {
      statusCode: HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage: err.message,
    };
  }

  async getCurrencyDetailsByAccountRidRaw(
    accountRid: string
  ): Promise<string | null> {
    const query = `SELECT a.currency_rid FROM public.account a WHERE a.rid = :accountRid`;
    try {
      const mainDb = await initMainDbSequelize();
      const result = await mainDb.query(query, {
        replacements: { accountRid },
        type: "SELECT",
      });
      return result ? (result[0] as any).currency_rid : null;
    } catch (err) {
      console.error("Error getting currency symbol:", err);
      return null;
    }
  }

  async assignCurrencyRid(result: any, mainDbSequelize: any) {
    if (!result.currency) {
      const currencyRid = await this.getCurrencyDetailsByAccountRidRaw(result.account_rid);
      if (currencyRid) {
        result.currency = currencyRid;
      } else {
        try {
          const usdCurrencyId = await mainDbSequelize.query(
            `SELECT c.* FROM public.currency c WHERE c.currency_code = 'USD'`,
            { type: "SELECT" }
          );
          result.currency = usdCurrencyId[0]?.rid;
        } catch (err) {
          console.error("Error getting USD currency rid:", err);
        }
      }
    }
  }
}