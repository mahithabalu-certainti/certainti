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

  async createProject(projectData: ICreateProject, userId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { project: any };
  }> {
    try {
      const { account_number, account_id } = projectData;

      const { isAccountExist, dataStorage, parentAccountId } =
        await this.schemaService.checkAccountIdAndNumber(
          account_number,
          account_id
        );

      if (!isAccountExist) {
        throw new Error(
          "Invalid account number or account ID. The specified account was not found."
        );
      }

      let accountNumber = account_number;

      if (dataStorage === "store_in_parent") {
        accountNumber = await this.schemaService.fetchParentAccount(
          parentAccountId
        );
      }

      const isExists = await this.schemaService.checkIfSchemaExists(
        accountNumber
      );

      if (!isExists) {
        throw new Error(
          "Invalid account number: The account number does not exist."
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
        industry: projectData.industry,
        account_rid: projectData.account_id,
        account_fiscal_rid: null,
        program_name: projectData.program_name || null,
        client_organization: projectData.client_organization,
        project_start_date: startDate?.toDate() || null,
        project_end_date: endDate?.toDate() || null,
        project_type: projectData.project_type,
        project_classification: projectData.project_classification || null,
        project_client_group: projectData.project_client_group || null,
        project_group: projectData.project_group || null,
        project_summary: projectData.project_summary || null,
        status: projectData.status,
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

  async updateProjectRecords(projectData: IUpdateProject, userId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { project: any };
  }> {
    try {
      const { account_number, account_id } = projectData;

      const { isAccountExist, dataStorage, parentAccountId } =
        await this.schemaService.checkAccountIdAndNumber(
          account_number,
          account_id
        );

      if (!isAccountExist) {
        throw new Error(
          "Invalid account number or account ID. The specified account was not found."
        );
      }

      let accountNumber = account_number;

      if (dataStorage === "store_in_parent") {
        accountNumber = await this.schemaService.fetchParentAccount(
          parentAccountId
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

      const updateProjectData = {
        program_name: projectData.program_name || null,
        project_description: projectData.project_description || null,
        status: (projectData.status as "Active" | "Inactive") || "Active",
        project_start_date: startDate?.toDate() || null,
        project_end_date: endDate?.toDate() || null,
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
        project_classification: projectData.project_classification || null,
        project_client_group: projectData.project_client_group || null,
        project_group: projectData.project_group || null,
        project_summary: projectData.project_summary || null,
        industry: projectData.industry,
        fiscal_year: projectData.fiscal_year,
        total_effort: projectData.total_effort || 0,
        total_cost: projectData.total_cost || 0,
        total_fte: projectData.total_fte || 0,
        total_subcon: projectData.total_sub_con || 0,
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
    accountNumber: string,
    projectId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { project: any };
  }> {
    try {
      const { accountNumber: accountRNumber } =
        await this.schemaService.fetchAccountByNumber(accountNumber);

      const isExists = await this.schemaService.checkIfSchemaExists(
        accountRNumber
      );

      if (!isExists) {
        throw new Error(
          "Invalid account number: The account number does not exist."
        );
      }

      const orgDbSequlize = await initOrgSequelize();
      const mainDbSequlize = await initMainDbSequelize();
      const schemaName = `platform_v2_${accountNumber}`;
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
      throw new Error("Error fetching project by ID: " + (err as Error).message);
    }
  }

  async projectList(
    accountNumber: string,
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
      const {
        accountNumber: accountRNumber,
        accountName,
        accountId,
      } = await this.schemaService.fetchAccountByNumber(accountNumber);

      const isExists = await this.schemaService.checkIfSchemaExists(
        accountRNumber
      );

      if (!isExists) {
        throw new Error(
          "Invalid account number: The account number does not exist."
        );
      }

      const orgDbSequlize = await initOrgSequelize();
      const schemaName = `platform_v2_${accountRNumber}`;
      const ProjectModel = await Project.initialize(orgDbSequlize, schemaName);

      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );

      const { whereClause } = this.buildWhereClause(filters, search);

      const offset = (page - 1) * limit;

      let projectData = await ProjectModel.findAll({
        where: {
          account_rid: accountId,
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
          "industry",
          "project_start_date",
          "project_end_date",
          "project_type",
          "project_classification",
          "project_client_group",
          "project_group",
          "status",
          "account_rid",
        ],
      });

      if (projectData) {
        projectData.forEach((val) => {
          (val.dataValues as any).account_name = accountName;
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
            ? "36b376e9-a42c-44ad-9e90-7985eaf84663"
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
        project_start_date: projectData.project_start_date || null,
        project_end_date: projectData.project_end_date || null,

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
      throw new Error("Error updating project fiscal: " + (err as Error).message);
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
          modified_by: "31fef2ca-9a80-40ac-8a3e-c8638f7ba0d9",
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
      "project_start_date",
      "project_end_date",
      "project_type",
      "project_classification",
      "project_client_group",
      "project_group",
      "status",
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
    search: string
  ): {
    whereClause: Record<string, any>;
  } {
    let whereClause: Record<string, any> = {};

    if (search) {
      whereClause = this.buildSearchCondition(search, whereClause);
    }

    whereClause = this.applyFilters(filters, whereClause);

    return { whereClause };
  }

  private buildSearchCondition(
    search: string,
    whereClause: Record<string, any>
  ): Record<string, any> {
    const searchCondition = {
      [Op.or]: [
        { industry: { [Op.iLike]: `%${search}%` } },
        { r_number: { [Op.iLike]: `%${search}%` } },
      ],
    };

    return Object.keys(whereClause).length > 0
      ? { [Op.and]: [whereClause, searchCondition] }
      : searchCondition;
  }

  private applyFilters(
    filters: Record<string, any>,
    whereClause: Record<string, any>
  ): Record<string, any> {
    const castToTextFields = ["rid", "project_type", "status", "project_start_date", "project_end_date"];

    const filterFields = [
      { clientField: "applyFilters", dbField: "applyFilters" },
      { clientField: "project_ref_id", dbField: "project_ref_id" },
      { clientField: "industry", dbField: "industry" },
      { clientField: "project_start_date", dbField: "project_start_date" },
      { clientField: "project_end_date", dbField: "project_end_date" },
      { clientField: "project_type", dbField: "project_type" },
      { clientField: "project_classification", dbField: "project_classification" },
      { clientField: "project_client_group", dbField: "project_client_group" },
      { clientField: "project_group", dbField: "project_group" },
      { clientField: "status", dbField: "status" },
      { clientField: "r_number", dbField: "r_number" },
    ];

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
      return { [Op.or]: [null, ''] };
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
      return { [Op.between]: [this.normalizeDate(fieldFilter.between[0]),
        this.normalizeDate(fieldFilter.between[1])] };
    }
  }

  private normalizeDate(input: string): string | null {
    let parsed = moment(input, 'MM/DD/YYYY', true);
    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD');
    }
  
    throw new Error("Invalid Date format");
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
