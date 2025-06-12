import moment, { Moment } from "moment";
import "moment-timezone";  
import { initOrgSequelize } from "../config/orgDataSource";
import { Project, setupProjectSequence } from "../models/project";
import { HttpStatus } from "../utils/constants";
import { ICreateProject, IUpdateProject } from "../utils/types";
import SchemaService from "./schemaService";
import { ProjectTimeline, setupProjectTimelineSeq } from "../models/projectTimeline";
import { ProjectFiscal, setupProjectFiscal } from "../models/projectFiscal";
import { Op, Sequelize } from "sequelize";
import { ProjectHistory, setupProjectHistorySeq } from "../models/projectHistory";
import { initMainDbSequelize } from "../config/mainDataSource";
import { RedisService } from "./redisService";
import Decimal from "decimal.js";
import { KeyContact, setupKeyContactsSequence } from "../models/keyContactDetails";
import { ProjectSummary, setupProjectSummarySequence } from "../models/projectSummary";
import currency from "currency.js";

export class ProjectService {
  private schemaService: SchemaService;
  // private redisService: RedisService;

  constructor() {
    this.schemaService = new SchemaService();
    // this.redisService = redisService;
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

      if(accountData.status !== "active"){
        throw new Error("Project creation failed: The selected account is inactive. Please choose an active account.");
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
        accountNumber
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
      const schemaName = `platform_v2_${accountNumber}`;

      const ProjectModel = await Project.initialize(orgDbSequlize, schemaName);

      const KeyContactModel = await KeyContact.initialize(
        orgDbSequlize,
        schemaName
      );
      const ProjectTimelineModel = await ProjectTimeline.initialize(
        orgDbSequlize,
        schemaName
      );
      const ProjectFiscalModel = await ProjectFiscal.initialize(
        orgDbSequlize,
        schemaName
      );
      const ProjectHistoryModel = await ProjectHistory.initialize(
        orgDbSequlize,
        schemaName
      );
      // const ProjectSummaryModel = await ProjectSummary.initialize(
      //   mainDbSequlize,
      //   ""
      // );

      await ProjectModel.sync({ force: false });
      await KeyContactModel.sync({ force: false });
      await ProjectFiscalModel.sync({ force: false });
      await ProjectHistory.sync({ force: false });
      await ProjectTimelineModel.sync({ force: false });
      await ProjectHistoryModel.sync({ force: false });
      // await ProjectSummaryModel.sync({ force: false });
      await setupProjectSequence(orgDbSequlize, schemaName);
      await setupProjectFiscal(orgDbSequlize, schemaName);
      await setupProjectTimelineSeq(orgDbSequlize, schemaName);
      await setupProjectHistorySeq(orgDbSequlize, schemaName);
      await setupProjectSummarySequence(mainDbSequlize);
      await setupKeyContactsSequence(orgDbSequlize, schemaName);
    } catch (err) {
      console.log("Error project tales", err);
      return this.throwServiceError(err as Error);
    }
  }

  async createProjectRecords(
    projectData: ICreateProject,
    accountNumber: string
  ): Promise<Project> {
    try {
      const orgDbSequlize = await initOrgSequelize();
      const schemaName = `platform_v2_${accountNumber}`;
      const ProjectModel = await Project.initialize(orgDbSequlize, schemaName);

      const isRefIdExist = await ProjectModel.findOne({
        where: {
          project_code: projectData.project_code,
        },
      });

      if (isRefIdExist) {
        throw new Error("Project code must be unique.");
      }
      
      const startDate = projectData?.project_startdate 
        ? moment.utc(projectData.project_startdate, "YYYY-MM-DD", true).isValid() 
        ? moment.utc(projectData.project_startdate, "YYYY-MM-DD") 
        : null
        : null;

      const endDate = projectData?.project_enddate 
        ? moment.utc(projectData.project_enddate, "YYYY-MM-DD", true).isValid() 
        ? moment.utc(projectData.project_enddate, "YYYY-MM-DD") 
        : null
        : null;
      const projectCreationData = {
        project_code: projectData.project_code,
        industry_rid: projectData.industry_rid,
        industry_name: projectData.industry_name,
        account_rid: projectData.account_id,
        account_fiscal_rid: null,
        program_name: projectData.program_name || null,
        project_name: projectData.project_name || null,
        project_startdate: startDate?.toDate() || null,
        project_enddate: endDate?.toDate() || null,
        project_type: projectData.project_type,
        project_classification_rid:
          projectData.project_classification_rid || null,
        project_classification_other: projectData.project_classification_other || null, 
        project_client_group: projectData.project_client_group || null,
        project_group: projectData.project_group || null,
        project_status: projectData.project_status,
        fiscal_year: projectData.fiscal_year,
        country: projectData.country || null,
        region: projectData.region || null,
        currency: projectData.currency || null,
        total_effort: projectData.total_effort && parseInt(projectData.total_effort) || null,
        
        total_cost: projectData.total_cost || null,

        total_fte: projectData.total_fte || null,
        total_sub_con: projectData.total_sub_con || null,
        total_non_labor_cost: projectData.total_non_labor_cost || null,
        total_fte_effort: projectData.total_fte_effort && parseInt(projectData.total_fte_effort) || null,
        total_sub_con_effort: projectData.total_sub_con_effort && parseInt(projectData.total_sub_con_effort) || null,
        total_fte_cost: projectData.total_fte_cost || null,
        total_sub_con_cost: projectData.total_sub_con_cost || null,
        auto_send_ai_interaction: projectData.auto_send_ai_interaction,
        auto_access_rd: projectData.auto_access_rd ?? false,
        max_ai_interaction: projectData.max_ai_interaction,
        blended_rate_fte: projectData.blended_rate_fte || null,
        blended_rate_sub_con: projectData.blended_rate_sub_con || null,
        project_description: projectData.project_description || null,
        created_datetime: new Date(),
        modified_datetime: new Date(),
        created_by: projectData.created_by,
        modified_by: projectData.modified_by || null,
        comments: projectData.comments || null,
      };

      const project = await ProjectModel.create({
        ...projectCreationData,
      });

      if (project && project.rid) {
        await this.addProjectSummary(
          projectData,
          project,
          startDate,
          endDate,
          projectData.key_contacts
        );

        if (projectData.key_contacts) {
          await this.schemaService.manageKeyContacts(
            projectData.key_contacts,
            project.rid,
            projectCreationData.created_by,
            schemaName
          );
        }
        this.addProjectFiscalRecords(
          projectCreationData,
          orgDbSequlize,
          schemaName,
          project.rid
        );
        this.addProjectTimeline(
          accountNumber,
          projectData.account_id,
          "create",
          project.rid,
          projectData
        );
      }

      return project;
    } catch (err) {
      throw new Error("Error creating project: " + (err as Error).message);
    }
  }

  async updateProjectRecords(
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

      if(accountData.status !== "active"){
        throw new Error("Project creation failed: The selected account is inactive. Please choose an active account.");
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

      const orgDbSequlize = await initOrgSequelize();
      const schemaName = `platform_v2_${accountNumber}`;
      const ProjectModel = await Project.initialize(orgDbSequlize, schemaName);
      const startDate = projectData?.project_startdate 
        ? moment.utc(projectData.project_startdate, "YYYY-MM-DD", true).isValid() 
        ? moment.utc(projectData.project_startdate, "YYYY-MM-DD") 
        : null
        : null;

      const endDate = projectData?.project_enddate 
        ? moment.utc(projectData.project_enddate, "YYYY-MM-DD", true).isValid() 
        ? moment.utc(projectData.project_enddate, "YYYY-MM-DD") 
        : null
        : null;
      const existingData = await ProjectModel.findOne({
        where: {
          rid: projectData.project_id,
        },
      });

      const existingRefId = await ProjectModel.findOne({
        where: {
          project_code: projectData.project_code,
        },
      });

      if (existingRefId && existingRefId.rid !== projectData.project_id) {
        throw new Error(
          `Duplicate Project Code: '${projectData.project_code}' already exists.`
        );
      }

      if (!existingData) {
        throw new Error(
          "Invalid project ID. The specified project was not found."
        );
      }

      projectData.modified_by = userId;

      const updateProjectData = {
        project_name: projectData.project_name || null,
        project_description: projectData.project_description || null,
        program_name: projectData.program_name || null,
        project_status:
          (projectData.project_status as "Active" | "Inactive") || "Active",
        project_startdate: startDate?.toDate() || null,
        project_enddate: endDate?.toDate() || null,
        project_code: projectData.project_code,
        project_type: projectData.project_type as "Fixed" | "Time & Material",
        project_classification_rid:
          projectData.project_classification_rid || null,
        project_classification_other: projectData.project_classification_other || null, 
        project_client_group: projectData.project_client_group || null,
        project_group: projectData.project_group || null,
        project_summary: projectData.project_summary || null,
        industry_rid: projectData.industry_rid,
        industry_name: projectData.industry_name,
        fiscal_year: projectData.fiscal_year,
        total_effort: projectData.total_effort && parseInt(projectData.total_effort) || null,
        total_cost: projectData.total_cost || null,
        total_fte: projectData.total_fte || null,
        total_sub_con: projectData.total_sub_con || null,

        country: projectData.country || null,
        currency: projectData.currency || null,
        region: projectData.region || null,

        total_non_labor_cost: projectData.total_non_labor_cost || null,
        total_fte_effort: projectData.total_fte_effort && parseInt(projectData.total_fte_effort) || null,
        total_sub_con_effort: projectData.total_sub_con_effort && parseInt(projectData.total_sub_con_effort) || null,
        total_fte_cost: projectData.total_fte_cost || null,
        total_sub_con_cost: projectData.total_sub_con_cost || null,
        auto_send_ai_interaction: projectData.auto_send_ai_interaction ?? false,
        auto_access_rd: projectData.auto_access_rd ?? false,
        max_ai_interaction: projectData.max_ai_interaction || 0,
        blended_rate_fte: projectData.blended_rate_fte || null,
        blended_rate_sub_con: projectData.blended_rate_sub_con || null,
        modified_by: userId,
        modified_datetime: new Date(),
        comments: projectData.comments || null,
      };

      const updateProject = await ProjectModel.update(
        {
          ...updateProjectData,
        },
        {
          where: {
            rid: projectData.project_id,
          },
        }
      );

      if (updateProject) {
        await this.schemaService.manageKeyContacts(
          projectData.key_contacts,
          projectData.project_id,
          userId,
          schemaName
        );
        await this.updateProjectSummary(
          projectData,
          startDate,
          endDate,
          projectData.key_contacts,
          userId
        );
        await this.updateProjectFiscal(
          updateProjectData,
          orgDbSequlize,
          schemaName,
          projectData.project_id
        );
        await this.addProjectTimeline(
          accountNumber,
          projectData.account_id,
          "update",
          projectData.project_id,
          projectData
        );
        await this.updateProjectHistory(
          accountNumber,
          projectData.project_id,
          updateProjectData,
          existingData
        );
      }

      // await this.redisService.deleteUserProjectCache(userId)

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          project: updateProject,
        },
      };
    } catch (err) {
      throw new Error("Error updating project: " + (err as Error).message);
    }
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

      const orgDbSequlize = await initOrgSequelize();
      const mainDbSequlize = await initMainDbSequelize();
      const schemaName = `platform_v2_${accountRNumber}`;
      const ProjectModel = await Project.initialize(orgDbSequlize, schemaName);
      const KeyContactModel = await KeyContact.initialize(
        orgDbSequlize,
        schemaName
      );

      let projectData = await ProjectModel.findOne({
        where: {
          rid: projectId,
        },
        include: [
          {
            model: KeyContactModel,
            as: "keyContact",
          },
        ],
      });

      if (projectData) {

        const mainDbInit = await initMainDbSequelize();

        await this.assignCurrencyRid(projectData, mainDbInit);

        projectData = await this.schemaService.insertProjectGeoData(
          projectData,
          mainDbSequlize
        );
        projectData = await this.schemaService.insertIndustyName(
          projectData,
          mainDbSequlize
        );
        projectData = await this.schemaService.projectKeyContactData(
          projectData,
          mainDbSequlize
        );
        projectData = await this.schemaService.projectClassificationData(
          projectData,
          mainDbSequlize
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
      ...(project.dataValues || project),
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
    sortOrder: string = "ASC"
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

      const orgDbSequlize = await initOrgSequelize();
      const schemaName = `platform_v2_${accountRNumber}`;
      const ProjectModel = await Project.initialize(orgDbSequlize, schemaName);
      const KeyContactModel = await KeyContact.initialize(
        orgDbSequlize,
        schemaName
      );

      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );
      const [finalMetaDataSortBy, finalMetaDataSortOrder] = this.getMetaDataSortParameters(
        sortBy,
        sortOrder
      );

      const { whereClause } = this.buildWhereClause(filters, search, false);

      const offset = (page - 1) * limit;

      let { rows: projectData, count } = await ProjectModel.findAndCountAll({
        where: {
          account_rid: accountData.rid,
          ...whereClause,
          ...(fiscalYear && fiscalYear !== 0
            ? { fiscal_year: fiscalYear }
            : {}),
        },
        order: [[finalSortBy, finalSortOrder]],
        distinct: true,
        offset,
        limit,
        attributes: [
          "rid",
          "r_number",
          "project_code",
          "project_name",
          "program_name",
          "fiscal_year",
          "industry_rid",
          "industry_name",
          "project_startdate",
          "project_enddate",
          "project_type",
          "project_classification_rid",
          "project_classification_other",
          "project_client_group",
          "project_group",
          "project_status",
          "account_rid",
          "rid",
          "total_cost",
          "total_effort",
          "total_fte",
          "total_fte_cost",
          "total_sub_con",
          "total_sub_con_cost",
          "total_non_labor_cost",
          "comments",
          "country",
          "region",
          "currency",
          "industry_name",
          "qualified_research_expenditure",
          "is_rd_qualified",
          "qre",
          "created_datetime",
          "modified_datetime",
          "assessment_status"
        ],
        include: [
          {
            model: KeyContactModel,
            as: "keyContact",
          },
        ],
      });

      

      if (projectData) {
        const mainDbInit = await initMainDbSequelize();

        await Promise.all(projectData.map(result => this.assignCurrencyRid(result, mainDbInit)));
      
        projectData.forEach((val) => {
          const dataValues = val.dataValues as any;
          dataValues.account_name = accountData.account_name;
        });
        projectData = await this.schemaService.insertProjectListGeoData(
          projectData,
          mainDbInit
        );
        projectData = await this.schemaService.insertIndusty(
          projectData,
          mainDbInit
        );

        projectData = await this.schemaService.insertKeyRole(
          projectData,
          mainDbInit
        );
        projectData = await this.schemaService.insertProjectClassification(
          projectData,
          mainDbInit
        );

        projectData = await this.schemaService.finalProjectSort(projectData, finalMetaDataSortBy, finalMetaDataSortOrder, filters);
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projects: projectData,
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
    userId: string
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
        await this.schemaService.computeGlobalAccountFilter(
          globalFilters,
        );

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
          accountDataSort
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
    timezone: any
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
      let exportData = rawResult.map((project: any) => {   
        return {
          "Project Code": project.project_code || "-",
          "Name": project.project_name || "-",
          "Project Type": project.project_type || "-",
          "Account Name": project.account_name || "-",
          "Fiscal Year":project.fiscal_year || "-",
          "Project Classification": project.classification_name || "-",
          "Customer Group": project.project_client_group || "-",
          "Project Group": project?.project_group || "-",
          "Project Effort (Hours)": project.total_effort || "-",
          "Project Cost": formatNumberForExport(project.total_cost, project.currency_symbol) || "-",
          "FTE Cost": formatNumberForExport(project.total_fte_cost, project.currency_symbol) || "-",
          "SubCon Cost": formatNumberForExport(project.total_sub_con, project.currency_symbol) || "-",
          "Non-Labor Cost": formatNumberForExport(project.total_non_labor_cost, project.currency_symbol) || "-",
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

  async exportProjectList(
    accountId: string,
    fiscalYear: number = 0,
    search: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC"
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projects: any; totalCount: number };
  }> {
    try{

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

      const orgDbSequlize = await initOrgSequelize();
      const schemaName = `platform_v2_${accountRNumber}`;
      const ProjectModel = await Project.initialize(orgDbSequlize, schemaName);
      const KeyContactModel = await KeyContact.initialize(
        orgDbSequlize,
        schemaName
      );

      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );
      const [finalMetaDataSortBy, finalMetaDataSortOrder] = this.getMetaDataSortParameters(
        sortBy,
        sortOrder
      );

      const { whereClause } = this.buildWhereClause(filters, search, false);

      let { rows: projectData, count } = await ProjectModel.findAndCountAll({
        where: {
          account_rid: accountData.rid,
          ...whereClause,
          ...(fiscalYear && fiscalYear !== 0
            ? { fiscal_year: fiscalYear }
            : {}),
        },
        order: [[finalSortBy, finalSortOrder]],
        distinct: true,
        attributes: [
          "rid",
          "r_number",
          "project_code",
          "project_name",
          "program_name",
          "fiscal_year",
          "industry_rid",
          "industry_name",
          "project_startdate",
          "project_enddate",
          "project_type",
          "project_classification_rid",
          "project_classification_other",
          "project_client_group",
          "project_group",
          "project_status",
          "account_rid",
          "rid",
          "total_cost",
          "total_effort",
          "total_fte",
          "total_fte_cost",
          "total_sub_con",
          "total_sub_con_cost",
          "total_non_labor_cost",
          "comments",
          "country",
          "region",
          "currency",
          "industry_name",
          "qualified_research_expenditure",
          "is_rd_qualified",
          "qre",
          "created_datetime",
          "modified_datetime",
          "assessment_status"
        ],
        include: [
          {
            model: KeyContactModel,
            as: "keyContact",
          },
        ],
      });

      if (projectData) {
        const mainDbInit = await initMainDbSequelize();

        await Promise.all(projectData.map(result => this.assignCurrencyRid(result, mainDbInit)));

        projectData.forEach((val) => {
          const dataValues = val.dataValues as any;
          dataValues.account_name = accountData.account_name;
        });
        projectData = await this.schemaService.insertProjectListGeoData(
          projectData,
          mainDbInit
        );
        projectData = await this.schemaService.insertIndusty(
          projectData,
          mainDbInit
        );

        projectData = await this.schemaService.insertKeyRole(
          projectData,
          mainDbInit
        );
        projectData = await this.schemaService.insertProjectClassification(
          projectData,
          mainDbInit
        );

        projectData = await this.schemaService.finalProjectSort(projectData, finalMetaDataSortBy, finalMetaDataSortOrder, filters);
      }

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

      const rawResult = projectData || [];
      let exportData = rawResult.map((project: any) => {   
        return {
          "Project Code": project.project_code || "-",
          "Name": project.project_name || "-",
          "Project Type": project.project_type || "-",
          "Fiscal Year":project.fiscal_year || "-",
          "Project Classification": project.classification_name || "-",
          "Customer Group": project.project_client_group || "-",
          "Project Group": project?.project_group || "-",
          "Project Effort (Hours)": project.total_effort || "-",
          "Project Cost": formatNumberForExport(project.total_cost, project.currency_symbol) || "-",
          "FTE Cost": formatNumberForExport(project.total_fte_cost, project.currency_symbol) || "-",
          "SubCon Cost": formatNumberForExport(project.total_sub_con, project.currency_symbol) || "-",
          "Non-Labor Cost": formatNumberForExport(project.total_non_labor_cost, project.currency_symbol) || "-",
          "Assessment Status": project.assessment_status || "-",
          "QRE %": project.qre || "-",
          "QRE": formatNumberForExport(project.qualified_research_expenditure, project.currency_symbol) || "-",
          "Project Point of Contact": project.project_point_of_contact || "-",
          "Technical Point of Contact": project.technical_point_of_contact || "-",
          "Comments": project.comments || "-",
          "Last Modified": project.modified_datetime
          ? moment(project.modified_datetime).format('YYYY-MM-DD')
          : '-',
          "Project ID": project.r_number || "-",
        };
      });

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projects: exportData,
          totalCount: count,
        },
      };
    }catch(err){
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
      const schemaName = `platform_v2_${accountNumber}`;
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
        modified_by:
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

        max_ai_interactions: projectData.max_ai_interaction || 0,
        expiry_duration: null,

        autosend_interaction: projectData.auto_send_ai_interaction ?? false,
        project_status: projectData.project_status as "Active" | "Inactive",
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

      await ProjectFiscalModel.create(projectFiscalData);
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
        project_status: projectData.project_status as "Active" | "Inactive",

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
      const schemaName = `platform_v2_${accountNumber}`;
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
          modified_by: newProjectData["modified_by"],        }));

      if (historyChanges.length === 0) return;

      // const latest = await ProjectHistoryModel.findAll();

      // historyChanges.forEach((change, i) => {
      //   change.r_number = `${(latest.length + i + 1)
      //     .toString()
      //     .padStart(4, "0")}`;
      // });

      await ProjectHistoryModel.bulkCreate(historyChanges);
    } catch (err) {
      throw new Error(
        "Error updating project history : " + (err as Error).message
      );
    }
  }

  async addProjectSummary(
    projectData: any,
    project: any,
    startDate: Moment | null,
    endDate: Moment | null,
    keyContacts: any[]
  ) {
    try {
      const mainDbSequlize = await initMainDbSequelize();
      const ProjectSummaryModel = await ProjectSummary.initialize(
        mainDbSequlize,
        ""
      );
      // await ProjectSummaryModel.sync({ force: false });

      const {
        technicalConsultant,
        financialConsultant,
        projectPointOfContact,
      } = await this.calculateKeyContactDetails(keyContacts, mainDbSequlize);

      await ProjectSummaryModel.create({
        project_code: projectData.project_code,
        industry_rid: projectData.industry_rid,
        industry_name: projectData.industry_name,
        account_rid: projectData.account_id,
        program_name: projectData.program_name || null,
        project_name: projectData.project_name || null,
        project_startdate: startDate?.toDate() || null,
        project_enddate: endDate?.toDate() || null,
        project_status: projectData.project_status,
        project_type: projectData.project_type,
        project_client_group: projectData.project_client_group,
        project_group: projectData.project_group,
        project_classification_rid: projectData.project_classification_rid,
        project_classification_other: projectData.project_classification_other,
        fiscal_year: projectData.fiscal_year,
        country: projectData.country || null,
        region: projectData.region || null,
        currency: projectData.currency || null,
        total_effort: projectData.total_effort || null,
        total_cost: projectData.total_cost || null,
        total_fte: projectData.total_fte || null,
        total_sub_con: projectData.total_sub_con || null,
        total_non_labor_cost: projectData.total_non_labor_cost || null,
        total_fte_cost: projectData.total_fte_cost || null,
        total_sub_con_cost: projectData.total_sub_con_cost || null,
        comments: projectData.comments || null,
        created_datetime: new Date(),
        modified_datetime: new Date(),
        created_by: projectData.created_by,
        modified_by: projectData.modified_by || null,
        project_number: project.r_number || "",
        project_id: project.rid || "",
        technical_point_of_contact: technicalConsultant,
        financial_consultant: financialConsultant,
        project_point_of_contact: projectPointOfContact,
      });
    } catch (err) {
      throw err;
    }
  }

  async updateProjectSummary(
    projectData: any,
    startDate: Moment | null,
    endDate: Moment | null,
    keyContacts: any[],
    userId: string
  ) {
    try {
      const mainDbSequlize = await initMainDbSequelize();
      const ProjectSummaryModel = await ProjectSummary.initialize(
        mainDbSequlize,
        ""
      );

      const {
        technicalConsultant,
        financialConsultant,
        projectPointOfContact,
      } = await this.calculateKeyContactDetails(keyContacts, mainDbSequlize);

      const updateProjectData = {
        project_name: projectData.project_name || null,
        program_name: projectData.program_name || null,
        project_status:
          (projectData.project_status as "Active" | "Inactive") || "Active",
        project_startdate: startDate?.toDate() || null,
        project_enddate: endDate?.toDate() || null,
        project_code: projectData.project_code,
        industry_rid: projectData.industry_rid,
        industry_name: projectData.industry_name,
        fiscal_year: projectData.fiscal_year,

        project_type: projectData.project_type,
        project_client_group: projectData.project_client_group,
        project_group: projectData.project_group,
        project_classification_rid: projectData.project_classification_rid,
        project_classification_other: projectData.project_classification_other,

        total_effort: projectData.total_effort || null,
        total_cost: projectData.total_cost || null,

        total_fte: projectData.total_fte || null,
        total_sub_con: projectData.total_sub_con || null,

        total_fte_cost: projectData.total_fte_cost || null,
        total_sub_con_cost: projectData.total_sub_con_cost || null,
        total_non_labor_cost: projectData.total_non_labor_cost || null,

        modified_by: userId,
        modified_datetime: new Date(),
        comments: projectData.comments || null,

        ...(technicalConsultant && {
          technical_point_of_contact: technicalConsultant,
        }),
        ...(financialConsultant && {
          financial_consultant: financialConsultant,
        }),
        ...(projectPointOfContact && {
          project_point_of_contact: projectPointOfContact,
        }),
      };

      await ProjectSummaryModel.update(
        {
          ...updateProjectData,
        },
        {
          where: {
            project_id: projectData.project_id,
          },
        }
      );
    } catch (err) {
      throw err;
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
      
      technicalConsultant = technicalContact ? technicalContact.key_contact_name : null;
      financialConsultant = financialContact ? financialContact.key_contact_name : null;
      projectPointOfContact = pointOfContact ? pointOfContact.key_contact_name : null;
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
      "project_type",
      "project_classification_rid",
      "project_client_group",
      "project_group",
      "project_status",
      "account_rid",
      "rid",
      "total_cost",
      "total_effort",
      "total_fte",
      "total_fte_cost",
      "total_sub_con",
      "total_sub_con_cost",
      "total_non_labor_cost",
      "country",
      "region",
      "currency",
      "qualified_research_expenditure",
      "is_rd_qualified",
      "qre",
      "fiscal_year",
      "comments",
      "modified_datetime",
      "assessment_status"
    ];

    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  getMetaDataSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "account_name",
      "country_name",
      "region_name",
      "currency_name",
      "technical_point_of_contact",
      "financial_consultant",
      "project_point_of_contact",
      "classification_name",
      "industry_name"
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
    isAllProject: boolean = false
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

    whereClause = this.applyFilters(filters, whereClause, isAllProject);

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
        { project_status: { [Op.iLike]: `%${search}%` } },
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
      isAllProject: boolean
    ): Record<string, any> {
      const castToTextFields = [
        "rid",
        "project_type",
        "project_status",
        "project_startdate",
        "project_enddate",
        "total_effort",
        "total_cost",
        "fiscal_year"
      ];
    
      const numberFields = ["total_effort", "total_cost", "fiscal_year", "total_fte", "total_fte_cost", "total_sub_con", 
        "total_sub_con_cost", "total_non_labor_cost", "qualified_research_expenditure", "qre"]; 
      const dateFields = [ "project_startdate", "project_enddate", "modified_datetime"];
      const enumFields = [
        "project_status",
        "project_type",
        "fiscal_year",
      ];
      const booleanFields = [ "is_rd_qualified" ];
    
      const filterFields = this.getFilterFields(isAllProject);
    
      filterFields.forEach(({ clientField, dbField }) => {
        if (filters[clientField]) {
          const fieldFilter = filters[clientField];
          const isNumber = numberFields.includes(dbField);
          const isDate = dateFields.includes(dbField);
          const isEnum = enumFields.includes(dbField);
          const isBoolean = booleanFields.includes(dbField);
          const isTextCastNeeded = castToTextFields.includes(dbField) && !isNumber && !isDate && !isBoolean;


          if (isTextCastNeeded) {
            whereClause[dbField] = Sequelize.where(
              Sequelize.cast(Sequelize.col(dbField), "TEXT"),
              this.getFieldFilter(fieldFilter, dbField, isNumber, isDate, isEnum, isBoolean)
            );
          } else {
            whereClause[dbField] = this.getFieldFilter(fieldFilter, dbField, isNumber, isDate, isEnum, isBoolean);
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
            [Op.or]: [
              { [Op.ne]: fieldFilter.not_equals },
              { [Op.is]: null },
            ]
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

            const startOfDay = moment.utc(dateStr, "YYYY-MM-DD").startOf("day").toDate();
            const endOfDay = moment.utc(dateStr, "YYYY-MM-DD").endOf("day").toDate();

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
            [Op.or]: [
              { [Op.ne]: fieldFilter.not_equals },
              { [Op.is]: null },
            ],
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
          [Op.or]: [
            { [Op.notILike]: fieldFilter.not_equals },
            { [Op.is]: null },
          ],
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
          ]        
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
    sortOrder: string
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
      "project_status",
      "fiscal_year",
      "account_name",
      "program_name",
      "qualified_research_expenditure",
      "is_rd_qualified",
      "qre",
      "total_fte",
      "total_fte_cost",
      "total_sub_con",
      "total_sub_con_cost",
      "total_non_labor_cost",
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
      "project_type"
    ];

    if (!validSortColumns.includes(sortBy)) {
      sortBy = "ps.created_datetime";
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
    isAllProject: boolean
  ): { clientField: string; dbField: string }[] {
    const projectFilterFields = [
      { clientField: "rid", dbField: "rid" },
      { clientField: "r_number", dbField: "r_number" },
      { clientField: "project_code", dbField: "project_code" },
      { clientField: "program_name", dbField: "program_name" },
      { clientField: "project_name", dbField: "project_name" },
      { clientField: "project_description", dbField: "project_description" },
      { clientField: "fiscal_year", dbField: "fiscal_year" },
      { clientField: "total_effort", dbField: "total_effort" },
      { clientField: "total_cost", dbField: "total_cost" },
      { clientField: "project_type", dbField: "project_type" },
      { clientField: "project_status", dbField: "project_status" },
      { clientField: "project_startdate", dbField: "project_startdate" },
      { clientField: "project_enddate", dbField: "project_enddate" },
      { clientField: "project_client_group", dbField: "project_client_group" },
      { clientField: "project_group", dbField: "project_group" },
      { clientField: "project_status", dbField: "project_status" },
      { clientField: "created_datetime", dbField: "created_datetime" },
      { clientField: "created_by", dbField: "created_by" },
      { clientField: "total_fte_cost", dbField: "total_fte_cost" },
      { clientField: "total_fte", dbField: "total_fte" },
      { clientField: "total_sub_con", dbField: "total_sub_con" },
      { clientField: "total_sub_con_cost", dbField: "total_sub_con_cost" },
      { clientField: "total_non_labor_cost", dbField: "total_non_labor_cost" },
      { clientField: "comments", dbField: "comments" },
      { clientField: "qualified_research_expenditure", dbField: "qualified_research_expenditure" },
      { clientField: "is_rd_qualified", dbField: "is_rd_qualified" },
      { clientField: "qre", dbField: "qre" },
      { clientField: "modified_datetime", dbField: "modified_datetime" },
      { clientField: "assessment_status", dbField: "assessment_status" },
    ];

    return projectFilterFields;
  }

  buildMetaDataWhereClause(filters: Record<string, any>){

    const filterFields = [
      { clientField: "account_name", dbField: "account_name" },
      { clientField: "country_name", dbField: "country_name" },
      { clientField: "region_name", dbField: "region_name" },
      { clientField: "currency_name", dbField: "currency_name" },
      { clientField: "technical_point_of_contact", dbField: "technical_point_of_contact" },
      { clientField: "financial_consultant", dbField: "financial_consultant" },
      { clientField: "project_point_of_contact", dbField: "project_point_of_contact" },
      { clientField: "classification_name", dbField: "classification_name" },
    ]
  
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

  async getCurrencyDetailsByAccountRidRaw(accountRid: string): Promise<string | null> {
    const query = `SELECT a.currency_rid FROM public.account a WHERE a.rid = :accountRid`;
    try {
      const mainDb = await initMainDbSequelize();
      const result = await mainDb.query(query, {
        replacements: { accountRid },
        type: 'SELECT'
      });
      return result?(result[0] as any).currency_rid : null;
    } catch (err) {
      console.error('Error getting currency symbol:', err);
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
            { type: 'SELECT' }
          );
          result.currency = usdCurrencyId[0]?.rid;
        } catch (err) {
          console.error('Error getting USD currency rid:', err);
        }
      }
    }
  }
}

function isValidTimezone(tz: string) {
  return moment.tz.names().includes(tz);
}