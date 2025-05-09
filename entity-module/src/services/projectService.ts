import moment from "moment";
import { initOrgSequelize } from "../config/orgDataSource";
import { Project } from "../models/project";
import { HttpStatus } from "../utils/constants";
import { ICreateProject, IUpdateProject } from "../utils/types";
import SchemaService from "./schemaService";
import { ProjectTimeline } from "../models/projectTimeline";
import { ProjectFiscal } from "../models/projectFiscal";
import { Op, Sequelize } from "sequelize";
import { ProjectHistory } from "../models/projectHistory";
import { initMainDbSequelize } from "../config/mainDataSource";

export class ProjectService {
  private schemaService: SchemaService;

  constructor() {
    this.schemaService = new SchemaService();
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

      const accountData =
        await this.schemaService.fetchAccountById(
          account_id
        );

      if (!accountData) {
        throw new Error(
          "Error creating project: Invalid account ID"
        );
      }

      let accountNumber = accountData.r_number;

      if(accountData.parent_account_rid === null || accountData.parent_account_rid === ""){
        throw new Error("Error creating project: Invalid account ID")
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
        throw new Error(
          "Invalid account ID: schema doesn't exists"
        );
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
      const schemaName = `platform_v2_${accountNumber}`;
      const ProjectModel = await Project.initialize(orgDbSequlize, schemaName);
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

      await ProjectHistory.sync({ force: false });

      await ProjectModel.sync({ force: false });
      await ProjectFiscalModel.sync({ force: false });
      await ProjectTimelineModel.sync({ force: false });
      await ProjectHistoryModel.sync({ force: false });
    } catch (err) {
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
          project_ref_id: projectData.project_ref_id,
        },
      });

      if (isRefIdExist) {
        throw new Error("Project reference ID must be unique.");
      }

      const startDate = moment(projectData.project_start_date, "MM/DD/YYYY");
      const endDate = moment(projectData.project_end_date, "MM/DD/YYYY");

      const projectCreationData = {
        project_ref_id: projectData.project_ref_id,
        industry_rid: projectData.industry_rid,
        industry_name: projectData.industry_name,
        account_rid: projectData.account_id,
        account_fiscal_rid: null,
        project_name: projectData.program_name || null,
        client_organization: projectData.client_organization,
        project_startdate: startDate?.toDate() || null,
        project_enddate: endDate?.toDate() || null,
        project_type: projectData.project_type,
        project_classification_rid: projectData.project_classification_rid || null,
        project_client_group: projectData.project_client_group || null,
        project_group: projectData.project_group || null,
        project_summary: projectData.project_summary || null,
        project_status: projectData.status,
        fiscal_year: projectData.fiscal_year,
        country: projectData.country || null,
        region: projectData.region || null,
        currency: projectData.currency || null,
        project_manager: projectData.project_manager,
        project_lead: projectData.project_lead,
        spoc_name: projectData.spoc_name,
        spoc_email: projectData.spoc_email || null,
        spoc_mobile: projectData.spoc_mobile || null,
        project_tpc_name: projectData.project_tpc_name || null,
        project_tpc_email: projectData.project_tpc_email || null,
        project_tpc_mobile: projectData.project_tpc_mobile || null,
        project_cc_list: projectData.project_cc_list || null,
        total_effort: projectData.total_effort || 0,
        total_cost: projectData.total_cost || 0.0,
        total_fte: projectData.total_fte || 0,
        total_sub_con: projectData.total_sub_con || 0,
        total_non_labor_cost: projectData.total_non_labor_cost || 0.0,
        total_fte_effort: projectData.total_fte_effort || 0,
        total_sub_con_effort: projectData.total_sub_con_effort || 0,
        total_fte_cost: projectData.total_fte_cost || 0.0,
        total_sub_con_cost: projectData.total_sub_con_cost || 0.0,
        last_rd_ai_assess_on: projectData.last_rd_ai_assess_on || null,
        last_rd_ai_assess_by: projectData.last_rd_ai_assess_by || null,
        auto_send_ai_interaction: projectData.auto_send_ai_interaction ?? false,
        auto_access_rd: projectData.auto_access_rd ?? false,
        max_ai_interaction: projectData.max_ai_interaction || 0,
        blended_rate_fte: projectData.blended_rate_fte || null,
        blended_rate_sub_con: projectData.blended_rate_sub_con || null,
        project_description: projectData.project_description || null,
        created_datetime: new Date(),
        modified_datetime: new Date(),
        created_by: projectData.created_by,
        modified_by: projectData.modified_by || null,
      };

      const project = await ProjectModel.create({
        ...projectCreationData,
      });

      if (project && project.rid) {
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

      if (!accountData) {
        throw new Error(
          "Invalid account ID."
        );
      }

      if(accountData.parent_account_rid === null || accountData.parent_account_rid === ""){
        throw new Error("Invalid account ID")
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
        throw new Error(
          "Invalid account ID: project does not exist."
        );
      }

      const orgDbSequlize = await initOrgSequelize();
      const schemaName = `platform_v2_${accountNumber}`;
      const ProjectModel = await Project.initialize(orgDbSequlize, schemaName);

      const startDate = moment(projectData.project_start_date, "MM/DD/YYYY");
      const endDate = moment(projectData.project_end_date, "MM/DD/YYYY");

      const existingData = await ProjectModel.findOne({
        where: {
          rid: projectData.project_id,
        },
      });

      const existingRefId = await ProjectModel.findOne({
        where: {
          project_ref_id: projectData.project_ref_id,
        },
      });

      if (existingRefId && existingRefId.rid !== projectData.project_id) {
        throw new Error(
          `Duplicate Project Ref ID: '${projectData.project_ref_id}' already exists.`
        );
      }

      if (!existingData) {
        throw new Error(
          "Invalid project ID. The specified project was not found."
        );
      }

      projectData.modified_by = userId;

      const updateProjectData = {
        project_name: projectData.program_name || null,
        project_description: projectData.project_description || null,
        project_status: (projectData.status as "Active" | "Inactive") || "Active",
        project_startdate: startDate?.toDate() || null,
        project_enddate: endDate?.toDate() || null,
        project_ref_id: projectData.project_ref_id,
        project_lead: projectData.project_lead,
        project_manager: projectData.project_manager,
        project_type: projectData.project_type as "Fixed" | "Time & Material",
        spoc_name: projectData.spoc_name,
        spoc_email: projectData.spoc_email || null,
        spoc_mobile: projectData.spoc_mobile || null,
        project_tpc_name: projectData.project_tpc_name || null,
        project_tpc_email: projectData.project_tpc_email || null,
        project_tpc_mobile: projectData.project_tpc_mobile || null,
        project_cc_list: projectData.project_cc_list || null,
        project_classification_rid: projectData.project_classification_rid || null,
        project_client_group: projectData.project_client_group || null,
        project_group: projectData.project_group || null,
        project_summary: projectData.project_summary || null,
        industry_rid: projectData.industry_rid,
        industry_name: projectData.industry_name,
        fiscal_year: projectData.fiscal_year,
        total_effort: projectData.total_effort || 0,
        total_cost: projectData.total_cost || 0,
        total_fte: projectData.total_fte || 0,
        total_sub_con: projectData.total_sub_con || 0,
        total_non_labor_cost: projectData.total_non_labor_cost || 0,
        total_fte_effort: projectData.total_fte_effort || 0,
        total_sub_con_effort: projectData.total_sub_con_effort || 0,
        total_fte_cost: projectData.total_fte_cost || 0,
        total_sub_con_cost: projectData.total_sub_con_cost || 0,
        auto_send_ai_interaction: projectData.auto_send_ai_interaction ?? false,
        auto_access_rd: projectData.auto_access_rd ?? false,
        max_ai_interaction: projectData.max_ai_interaction || 0,
        blended_rate_fte: projectData.blended_rate_fte || null,
        blended_rate_sub_con: projectData.blended_rate_sub_con || null,
        modified_by: userId,
        modified_datetime: new Date(),
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
        await this.updateProjectFiscal(
          updateProject,
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

       if(!accountData){
        throw new Error(
          "Invalid account ID"
        );
      }

      if(accountData.parent_account_rid === null || accountData.parent_account_rid === ""){
        throw new Error("Invalid account ID")
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

      let projectData = await ProjectModel.findOne({
        where: {
          rid: projectId,
        },
      });

      if (projectData) {
        projectData = await this.schemaService.insertProjectGeoData(
          projectData,
          mainDbSequlize
        );
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
    data?: { projects: any };
  }> {
    try {
      const accountData = await this.schemaService.fetchAccountById(accountId);

      if(!accountData){
        throw new Error(
          "Invalid account account ID."
        );
      }

      if(accountData.parent_account_rid === null || accountData.parent_account_rid === ""){
        throw new Error("Invalid account ID")
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
          },
        };
      }

      const orgDbSequlize = await initOrgSequelize();
      const schemaName = `platform_v2_${accountRNumber}`;
      const ProjectModel = await Project.initialize(orgDbSequlize, schemaName);

      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );

      const { whereClause } = this.buildWhereClause(filters, search, false);

      const offset = (page - 1) * limit;

      let projectData = await ProjectModel.findAll({
        where: {
          account_rid: accountData.rid,
          ...whereClause,
          ...(fiscalYear && fiscalYear !== 0
            ? { fiscal_year: fiscalYear }
            : {}),
        },
        order: [[finalSortBy, finalSortOrder]],
        offset,
        limit,
        attributes: [
          "r_number",
          "project_ref_id",
          "industry_rid",
          "industry_name",
          "project_startdate",
          "project_enddate",
          "project_type",
          "project_classification_rid",
          "project_client_group",
          "project_group",
          "project_status",
          "account_rid",
        ]
      });

      if (projectData) {
        projectData.forEach((val) => {
          (val.dataValues as any).account_name = accountData.account_name;
          (val.dataValues as any).account_number = accountRNumber;
        });
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projects: projectData,
        },
      };
    } catch (err) {
      throw new Error("Error fetching project: " + (err as Error).message);
    }
  }

  async allProjectList(
    fiscalYear: number = 0,
    page: number = 1,
    limit: number = 10,
    search: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC",
    globalFilters: Record<string, string[]> = {} 
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

      const sort = {
        sortCol: finalSortBy,
        sortOrder: finalSortOrder,
      };

      const { whereClause } = this.buildWhereClause(filters, search, true);

      const appliedAccountNumber = await this.schemaService.computeGlobalAccountFilter(globalFilters);

      const { finalResult: allProjectList, totalCount } =
        await this.schemaService.fetchAllProjects(
          offset,
          limit,
          sort,
          whereClause,
          fiscalYear,
          appliedAccountNumber
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
        project_name: projectData.program_name || "",
        eid: projectData.eid || null,
        fiscal_year: projectData.fiscal_year,
        account_rid: projectData.account_rid,

        max_ai_interactions: projectData.max_ai_interaction || 0,
        expiry_duration: null,

        autosend_interaction: projectData.auto_send_ai_interaction ?? false,
        project_status: projectData.status as "Active" | "Inactive",
        project_startdate: projectData.project_start_date || null,
        project_enddate: projectData.project_end_date || null,

        total_fte_prj: projectData.total_fte || 0,
        total_subcon_prj: projectData.total_sub_con || 0,

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
        project_ref_id: projectData.project_ref_id,
        account_rid: projectData.account_id,
        fiscal_year: projectData.fiscal_year,
        max_ai_interaction: projectData.max_ai_interaction || 0,
        auto_send_ai_interaction: projectData.auto_send_ai_interaction ?? false,
        project_startdate: projectData.project_start_date || null,
        project_enddate: projectData.project_end_date || null,

        total_fte: projectData.total_fte || 0,
        total_sub_con: projectData.total_sub_con || 0,

        total_cost: projectData.total_cost || 0,
        blended_rate_fte: projectData.blended_rate_fte || null,
        blended_rate_sub_con: projectData.blended_rate_sub_con || null,
        interaction_cc_list: projectData.project_cc_list || null,
        modified_by: projectData.modified_by,
        modified_datetime: new Date(),
        project_status: projectData.status as "Active" | "Inactive",

        total_fte_prj: projectData.total_fte || 0,
        total_subcon_prj: projectData.total_sub_con || 0,

        total_cost_prj: projectData.total_cost || 0,
        total_cost_fte_prj: projectData.total_fte_cost || 0,
        total_cost_subcon_prj: projectData.total_sub_con_cost,
        total_cost_nonlabor_prj: projectData.total_non_labor_cost,

        total_hours_prj: projectData.total_effort,
        total_hours_fte_prj: projectData.total_fte_effort,
        total_hours_subcon_prj: projectData.total_sub_con_effort,
      };

      await ProjectFiscalModel.update(updateData, {
        where: {
          rid: projectRid,
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
          modified_by: newProjectData["modified_by"],
          r_number: "",
        }));

      if (historyChanges.length === 0) return;

      const latest = await ProjectHistoryModel.findAll();

      historyChanges.forEach((change, i) => {
        change.r_number = `PROH${(latest.length + i + 1)
          .toString()
          .padStart(4, "0")}`;
      });

      await ProjectHistoryModel.bulkCreate(historyChanges);
    } catch (err) {
      throw new Error(
        "Error updating project history : " + (err as Error).message
      );
    }
  }

  getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "r_number",
      "project_ref_id",
      "industry",
      "project_startdate",
      "project_enddate",
      "project_type",
      "project_classification",
      "project_client_group",
      "project_group",
      "project_status",
      "account_rid",
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
        { project_ref_id: { [Op.iLike]: `%${search}%` } },
        { project_name: { [Op.iLike]: `%${search}%` } },
        { project_description: { [Op.iLike]: `%${search}%` } },
        { project_manager: { [Op.iLike]: `%${search}%` } },
        { project_lead: { [Op.iLike]: `%${search}%` } },
        { spoc_name: { [Op.iLike]: `%${search}%` } },
        { spoc_email: { [Op.iLike]: `%${search}%` } },
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
    ];

    const filterFields = this.getFilterFields(isAllProject);

    filterFields.forEach(({ clientField, dbField }) => {
      if (filters[clientField]) {
        const fieldFilter = filters[clientField];

        if (castToTextFields.includes(dbField)) {
          whereClause[dbField] = Sequelize.where(
            Sequelize.cast(Sequelize.col(dbField), "TEXT"),
            this.getFieldFilter(fieldFilter, dbField)
          );
        } else {
          whereClause[dbField] = this.getFieldFilter(fieldFilter, dbField);
        }
      }
    });

    return whereClause;
  }

  private getFieldFilter(fieldFilter: any, dbField: string): any {
    if (fieldFilter.equals) {
      return { [Op.iLike]: fieldFilter.equals };
    }
    if (fieldFilter.not_equals) {
      return { [Op.notILike]: fieldFilter.not_equals };
    }

    if (fieldFilter.contains) {
      return { [Op.iLike]: `%${fieldFilter.contains}%` };
    }
    if (fieldFilter.not_contains) {
      return { [Op.notILike]: `%${fieldFilter.not_contains}%` };
    }

    if (fieldFilter.isEmpty === true) {
      return { [Op.or]: [null, ""] };
    }

    if (fieldFilter.value) {
      return fieldFilter.value;
    }
    if (fieldFilter.greater_than) {
      return { [Op.gt]: this.normalizeDate(fieldFilter.greater_than) };
    }
    if (fieldFilter.lesser_than) {
      return { [Op.lt]: this.normalizeDate(fieldFilter.lesser_than) };
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
  }

  getSortParametersForAllProjects(
    sortBy: string,
    sortOrder: string
  ): [string, string] {
    const validSortColumns = [
      "r_number",
      "project_ref_id",
      "industry",
      "project_startdate",
      "project_enddate",
      "project_name",
      "project_description",
      "project_manager",
      "project_lead",
      "total_effort",
      "total_cost",
      "spoc_name",
      "spoc_email",
      "project_status",
      "account_rid",
    ];

    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  private normalizeDate(input: string): string | null {
    let parsed = moment(input, "MM/DD/YYYY", true);
    if (parsed.isValid()) {
      return parsed.format("YYYY-MM-DD");
    }

    throw new Error("Invalid Date format");
  }

  private getFilterFields(
    isAllProject: boolean
  ): { clientField: string; dbField: string }[] {
    const projectFilterFields = [
      { clientField: "applyFilters", dbField: "applyFilters" },
      { clientField: "project_ref_id", dbField: "project_ref_id" },
      { clientField: "industry", dbField: "industry" },
      { clientField: "project_startdate", dbField: "project_startdate" },
      { clientField: "project_enddate", dbField: "project_enddate" },
      { clientField: "project_type", dbField: "project_type" },
      {
        clientField: "project_classification",
        dbField: "project_classification",
      },
      { clientField: "project_client_group", dbField: "project_client_group" },
      { clientField: "project_group", dbField: "project_group" },
      { clientField: "project_status", dbField: "project_status" },
      { clientField: "r_number", dbField: "r_number" },
    ];

    const allProjectFields = [
      { clientField: "rid", dbField: "rid" },
      { clientField: "r_number", dbField: "r_number" },
      { clientField: "project_ref_id", dbField: "project_ref_id" },
      { clientField: "industry", dbField: "industry" },
      { clientField: "project_name", dbField: "project_name" },
      { clientField: "project_description", dbField: "project_description" },
      { clientField: "project_manager", dbField: "project_manager" },
      { clientField: "project_lead", dbField: "project_lead" },
      { clientField: "total_effort", dbField: "total_effort" },
      { clientField: "total_cost", dbField: "total_cost" },
      { clientField: "spoc_name", dbField: "spoc_name" },
      { clientField: "spoc_email", dbField: "spoc_email" },
      { clientField: "project_status", dbField: "project_status" },
      { clientField: "project_startdate", dbField: "project_startdate" },
      { clientField: "project_enddate", dbField: "project_enddate" },
      { clientField: "created_datetime", dbField: "created_datetime" },
      { clientField: "created_by", dbField: "created_by" },
      { clientField: "source_schema", dbField: "source_schema" },
    ];

    return isAllProject ? allProjectFields : projectFilterFields;
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
          type: "SELECT"
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
      console.log(err)
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Formats an error response to be returned from service methods.
   *
   * @param {Error} err - The caught error.
   * @returns {object} - Standardized error response object.
   */
  private throwServiceError(err: Error): {
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
}
