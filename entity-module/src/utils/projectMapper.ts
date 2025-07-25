import { ProjectFiscal } from "../models/projectFiscal";
import { ProjectResource } from "../models/projectResource";
import { Resources } from "../models/resource";
import { DEFAULT_PROJECT_DETAILS } from "./constants";
import {
  ICreateProject,
  ICreateProjectResource,
  ICreateProjectTask,
  IUpdateProject,
  IUpdateProjectResource,
} from "./types";

export class ProjectMapper {
  static mapToProjectModel(
    projectData: ICreateProject,
    startDate: moment.Moment | null,
    endDate: moment.Moment | null,
    userId: string
  ) {
    return {
      project_code: projectData.project_code,
      industry_rid: projectData.industry_rid,
      industry_name: projectData.industry_name,
      account_rid: projectData.account_id,
      account_fiscal_rid: null,
      program_name: projectData.program_name || null,
      project_name: projectData.project_name || null,
      project_startdate: startDate?.toDate() || null,
      project_enddate: endDate?.toDate() || null,
      project_type_rid: projectData.project_type_rid,
      project_classification_rid:
        projectData.project_classification_rid || null,
      project_classification_other:
        projectData.project_classification_other || null,
      project_client_group: projectData.project_client_group || null,
      project_group: projectData.project_group || null,
      status_rid: projectData.status_rid,
      fiscal_year: projectData.fiscal_year,
      country_rid: projectData.country_rid || null,
      region_rid: projectData.region_rid || null,
      currency_rid: projectData.currency_rid || null,
      total_effort: projectData.total_effort || null,
      total_cost: projectData.total_cost || null,
      total_fte: Number(projectData.total_fte) || 0,
      total_subcon: Number(projectData.total_subcon) || 0,
      total_cost_nonlabor: projectData.total_cost_nonlabor || null,
      total_effort_fte: projectData.total_effort_fte || null,
      total_effort_subcon: projectData.total_effort_subcon || null,
      total_cost_fte: projectData.total_cost_fte || null,
      total_cost_subcon: projectData.total_cost_subcon || null,
      auto_send_ai_interaction: projectData.auto_send_ai_interaction,
      auto_access_rd: projectData.auto_access_rd ?? false,
      max_ai_interaction: DEFAULT_PROJECT_DETAILS.maxAiInteraction,
      blended_rate_fte: projectData.blended_rate_fte || null,
      blended_rate_subcon: projectData.blended_rate_subcon,
      project_description: projectData.project_description || null,
      created_datetime: new Date(),
      created_by: userId,
      modified_by: projectData.modified_by || null,
      comments: projectData.comments || null,
    };
  }

  static mapToProjectFiscalModel(
    data: ICreateProject,
    projectId: string,
    startDate: moment.Moment | null,
    endDate: moment.Moment | null,
    userId: string
  ) {
    return {
      project_rid: projectId,

      created_datetime: new Date(),
      created_by: userId,
      modified_by: null,

      project_code: data.project_code,
      industry_rid: data.industry_rid || null,
      industry_name: data.industry_name || null,
      fiscal_year: data.fiscal_year,
      project_name: data.project_name || null,
      program_name: data.program_name || null,
      account_rid: data.account_id,

      country_rid: data.country_rid || null,
      region_rid: data.region_rid || null,
      currency_rid: data.currency_rid || null,

      max_ai_interaction: DEFAULT_PROJECT_DETAILS.maxAiInteraction,
      expiry_duration: null,
      auto_access_rd: data.auto_access_rd ?? false,

      status_rid: data.status_rid,
      project_startdate: startDate?.toDate() || null,
      project_enddate: endDate?.toDate() || null,
      project_type_rid: data.project_type_rid,

      project_client_group: data.project_client_group || null,
      project_group: data.project_group || null,
      project_classification_rid: data.project_classification_rid || null,
      project_classification_other: data.project_classification_other || null,

      auto_send_ai_interaction: data.auto_send_ai_interaction,

      total_fte_prj: data.total_fte || null,
      total_subcon_prj: data.total_subcon || null,
      total_nonlabor_prj: null,
      total_effort_prj: data.total_effort || null,
      total_cost_prj: data.total_cost || null,

      total_effort_fte_prj: data.total_effort_fte || null,
      total_effort_subcon_prj: data.total_effort_subcon || null,
      total_cost_fte_prj: data.total_cost_fte || null,
      total_cost_subcon_prj: data.total_cost_subcon || null,
      total_cost_nonlabor_prj: data.total_cost_nonlabor || null,

      effective_total_fte: data.total_fte || null,
      effective_total_subcon: data.total_subcon || null,
      effective_total_nonlabor: null,
      effective_cost: data.total_cost || null,
      effective_effort: data.total_effort || null,

      effective_fte_cost: data.total_cost_fte || null,
      effective_subcon_cost: data.total_cost_subcon || null,
      effective_nonlabor_cost: data.total_cost_nonlabor || null,
      effective_fte_effort: data.total_effort_fte || null,
      effective_subcon_effort: data.total_effort_subcon || null,

      total_fte_from_prj_res: null,
      total_subcon_from_prj_res: null,
      total_nonlabor_from_prj_res: null,
      total_resources_prj: null,
      total_resources_from_prj_res: null,
      total_resources_from_tasks: null,
      total_effort_from_prj_res: null,
      total_effort_fte_from_prj_res: null,
      total_effort_subcon_from_prj_res: null,
      total_cost_from_prj_res: null,
      total_cost_fte_from_prj_res: null,
      total_cost_subcon_from_prj_res: null,
      total_cost_nonlabor_from_prj_res: null,

      total_fte_from_tasks: null,
      total_subcon_from_tasks: null,
      total_effort_from_tasks: null,
      total_effort_fte_from_tasks: null,
      total_effort_subcon_from_tasks: null,
      total_cost_fte_from_tasks: null,
      total_cost_subcon_from_tasks: null,
      total_cost_from_tasks: null,

      total_cost_prj_blended: null,
      total_cost_fte_prj_blended: null,
      total_cost_subcon_prj_blended: null,
      total_cost_from_prj_res_blended: null,
      total_cost_fte_from_prj_res_blended: null,
      total_cost_subcon_from_prj_res_blended: null,
      total_cost_from_tasks_blended: null,
      total_cost_fte_from_tasks_blended: null,
      total_cost_subcon_from_tasks_blended: null,

      blended_rate_fte: data.blended_rate_fte || null,
      blended_rate_subcon: data.blended_rate_subcon || null,

      rd_percent_potential_ai: null,
      rd_percent_adjustment: null,
      rd_percent_final: null,

      qre_fte: null,
      qre_subcon: null,
      qre_nonlabor: null,
      qre_final: null,

      rd_credits_fte_fed_level: null,
      rd_credits_subcon_fed_level: null,
      rd_credits_nonlabor_fed_level: null,
      rd_credits_fed_level: null,
      rd_credits_total: null,

      interaction_cc_list: null,
      assessment_status: data.assessment_status || null,
      claim_status: null,

      comments: data.comments || null,
      project_description: data.project_description || null,
    };
  }

  static mapToProjectSummary(
    projectData: ICreateProject,
    project: any,
    startDate: moment.Moment | null,
    endDate: moment.Moment | null,
    technicalConsultant: string | null,
    projectPointOfContact: string | null,
    projectPointOfContactEmail: string | null
  ) {
    return {
      project_code: projectData.project_code,
      project_rid: project.rid || "",
      project_r_number: project.r_number || "",
      r_number: project.r_number || "",

      created_datetime: new Date(),
      modified_datetime: undefined,
      created_by: projectData.created_by,
      modified_by: null,

      account_rid: projectData.account_id,

      program_name: projectData.program_name || null,
      project_name: projectData.project_name || null,
      project_startdate: startDate?.toDate() || null,
      project_enddate: endDate?.toDate() || null,

      industry_rid: projectData.industry_rid || null,
      industry_name: projectData.industry_name || null,

      country_rid: projectData.country_rid || null,
      region_rid: projectData.region_rid || null,
      currency_rid: projectData.currency_rid || null,

      project_type_rid: projectData.project_type_rid,
      project_classification_rid:
        projectData.project_classification_rid || null,
      project_classification_other:
        projectData.project_classification_other || null,

      project_client_group: projectData.project_client_group || null,
      project_group: projectData.project_group || null,
      status_rid: projectData.status_rid,

      total_effort: projectData.total_effort || null,
      total_cost: projectData.total_cost || null,

      total_fte: projectData.total_fte || null,
      total_subcon: projectData.total_subcon || null,

      total_cost_fte: projectData.total_cost_fte || null,
      total_cost_subcon: projectData.total_cost_subcon || null,
      total_cost_nonlabor: projectData.total_cost_nonlabor || null,

      blended_rate_fte: projectData.blended_rate_fte || null,
      blended_rate_subcon: projectData.blended_rate_subcon || null,

      project_description: projectData.project_description || null,
      comments: projectData.comments || null,

      is_rd_qualified: projectData.is_rd_qualified ?? false,
      qre: projectData.qre || null,

      assessment_status: projectData.assessment_status || null,

      project_point_of_contact: projectPointOfContact,
      technical_point_of_contact: technicalConsultant,
      project_point_of_contact_email:projectPointOfContactEmail
    };
  }

  static mapToProjectFiscalSummary(
    projectData: ICreateProject,
    projectFiscal: any,
    projectId: string,
    startDate: moment.Moment | null,
    endDate: moment.Moment | null,
    technicalConsultant: string | null,
    projectPointOfContact: string | null,
    projectFiscalId: string
  ) {
    return {
      project_rid: projectId,
      project_r_number: projectFiscal.r_number,
      r_number: projectFiscal.r_number,
      project_fiscal_rid: projectFiscalId,

      created_datetime: new Date(),
      created_by: projectData.created_by,

      project_code: projectData.project_code,
      industry_rid: projectData.industry_rid || null,
      industry_name: projectData.industry_name || null,

      fiscal_year: projectData.fiscal_year,
      project_name: projectData.project_name || null,
      program_name: projectData.program_name || null,

      account_rid: projectData.account_id,

      country_rid: projectData.country_rid || null,
      region_rid: projectData.region_rid || null,
      currency_rid: projectData.currency_rid || null,

      max_ai_interaction: DEFAULT_PROJECT_DETAILS.maxAiInteraction,
      expiry_duration: null,
      auto_access_rd: projectData.auto_access_rd ?? false,

      status_rid: projectData.status_rid,
      project_startdate: startDate?.toDate() || null,
      project_enddate: endDate?.toDate() || null,

      project_type_rid: projectData.project_type_rid,
      project_client_group: projectData.project_client_group || null,
      project_group: projectData.project_group || null,
      project_classification_rid:
        projectData.project_classification_rid || null,
      project_classification_other:
        projectData.project_classification_other || null,

      auto_send_ai_interaction: projectData.auto_send_ai_interaction,

      total_fte_prj: projectData.total_fte || null,
      total_subcon_prj: projectData.total_subcon || null,
      total_nonlabor_prj: null,
      total_effort_prj: projectData.total_effort || null,

      total_effort_fte_prj: projectData.total_effort_fte || null,
      total_effort_subcon_prj: projectData.total_effort_subcon || null,

      total_cost_prj: projectData.total_cost || null,
      total_cost_fte_prj: projectData.total_cost_fte || null,
      total_cost_subcon_prj: projectData.total_cost_subcon || null,
      total_cost_nonlabor_prj: projectData.total_cost_nonlabor || null,

      blended_rate_fte: projectData.blended_rate_fte || null,
      blended_rate_subcon: projectData.blended_rate_subcon || null,

      comments: projectData.comments || null,
      project_description: projectData.project_description || null,

      total_fte_from_prj_res: null,
      total_fte_from_tasks: null,
      total_subcon_from_prj_res: null,
      total_subcon_from_tasks: null,
      total_nonlabor_from_prj_res: null,
      total_resources_prj: null,
      total_resources_from_prj_res: null,
      total_resources_from_tasks: null,

      total_effort_from_prj_res: null,
      total_effort_fte_from_prj_res: null,
      total_effort_subcon_from_prj_res: null,
      total_effort_from_tasks: null,
      total_effort_fte_from_tasks: null,
      total_effort_subcon_from_tasks: null,

      total_cost_fte_from_prj_res: null,
      total_cost_subcon_from_prj_res: null,
      total_cost_nonlabor_from_prj_res: null,
      total_cost_from_prj_res: null,

      total_cost_fte_from_tasks: null,
      total_cost_subcon_from_tasks: null,
      total_cost_from_tasks: null,

      total_cost_prj_blended: null,
      total_cost_fte_prj_blended: null,
      total_cost_subcon_prj_blended: null,
      total_cost_from_prj_res_blended: null,
      total_cost_fte_from_prj_res_blended: null,
      total_cost_subcon_from_prj_res_blended: null,
      total_cost_from_tasks_blended: null,
      total_cost_fte_from_tasks_blended: null,
      total_cost_subcon_from_tasks_blended: null,

      rd_percent_potential_ai: null,
      rd_percent_adjustment: null,
      rd_percent_final: null,

      qre_fte: null,
      qre_subcon: null,
      qre_nonlabor: null,
      qre_final: null,

      rd_credits_fte_fed_level: null,
      rd_credits_subcon_fed_level: null,
      rd_credits_nonlabor_fed_level: null,
      rd_credits_fed_level: null,
      rd_credits_total: null,

      interaction_cc_list: null,
      assessment_status: null,
      claim_status: null,

      project_point_of_contact: projectPointOfContact,
      technical_point_of_contact: technicalConsultant,
    };
  }

  static mapToAccountFiscal(fiscalData: ICreateProject) {
    return {
      tax_claim_level: null,

      blended_rate_fte: fiscalData.blended_rate_fte,
      blended_rate_subcon: fiscalData.blended_rate_subcon,

      total_fte: fiscalData.total_fte,
      total_subcon: fiscalData.total_subcon,

      total_project_hours_fte: fiscalData.total_effort_fte,
      total_project_hours_subcon: fiscalData.total_effort_subcon,
      total_project_hours: fiscalData.total_effort,

      total_project_cost_fte: fiscalData.total_cost_fte,
      total_project_cost_subcon: fiscalData.total_cost_subcon,
      total_project_cost_nonlabor: fiscalData.total_cost_nonlabor,
      total_project_cost: fiscalData.total_cost,

      total_project_qre_fte: null,
      total_project_qre_subcon: null,
      total_projects_qre: null,

      total_projects_rd_credits_fte: null,
      total_projects_rd_credits_subcon: null,
      total_projects_rd_credits: null,

      total_qualifying_projects_fed: null,
      qualifying_fte_fed: null,
      qualifying_subcon_fed: null,

      qualifying_project_hours_fte_fed: null,
      qualifying_project_hours_subcon_fed: null,
      qualifying_project_hours_fed: null,

      qualifying_project_cost_fte_fed: null,
      qualifying_project_cost_subcon_fed: null,
      qualifying_project_cost_nonlabor_fed: null,
      qualifying_project_cost_fed: null,

      qualifying_project_qre_fte_fed: null,
      qualifying_project_qre_subcon_fed: null,
      qualifying_project_qre_fed: null,

      qualifying_project_rd_credits_fte_fed: null,
      qualifying_project_rd_credits_subcon_fed: null,
      qualifying_project_rd_credits_fed: null,

      created_datetime: new Date(),
      modified_datetime: undefined,

      created_by: fiscalData.created_by,
      modified_by: fiscalData.created_by,
    };
  }

  static mapToProjectFiscalUpdateModel(
    data: IUpdateProject,
    startDate: moment.Moment | null,
    endDate: moment.Moment | null
  ) {
    return {
      project_code: data.project_code,
      industry_rid: data.industry_rid || null,
      industry_name: data.industry_name || null,
      program_name: data.program_name || null,
      project_name: data.project_name || null,
      fiscal_year: data.fiscal_year,
      project_startdate: startDate?.toDate() || null,
      project_enddate: endDate?.toDate() || null,
      project_type_rid: data.project_type_rid,
      project_classification_rid: data.project_classification_rid || null,
      project_classification_other: data.project_classification_other || null,
      project_client_group: data.project_client_group || null,
      project_group: data.project_group || null,
      status_rid: data.status_rid,
      region_rid: data.region_rid || null,
      comments_rid: data.comments || "",
      currency_rid: data.currency_rid || null,
      project_description: data.project_description || null,
      country_rid: data.country_rid || null,
      comments: data.comments || "",

      total_fte_prj: data.total_fte || 0,
      total_subcon_prj: data.total_subcon || 0,
      total_effort_prj: data.total_effort || null,
      total_cost_prj: data.total_cost || null,
      total_effort_fte_prj: data.total_effort_fte || null,
      total_effort_subcon_prj: data.total_effort_subcon || null,
      total_cost_fte_prj: data.total_cost_fte || null,
      total_cost_subcon_prj: data.total_cost_subcon || null,
      total_cost_nonlabor_prj: data.total_cost_nonlabor || null,

      auto_send_ai_interaction: data.auto_send_ai_interaction,
      auto_access_rd: data.auto_access_rd ?? false,
      max_ai_interaction: DEFAULT_PROJECT_DETAILS.maxAiInteraction,

      blended_rate_fte: data.blended_rate_fte || null,
      blended_rate_subcon: data.blended_rate_subcon || null,

      modified_datetime: new Date(),
      modified_by: data.modified_by,
    };
  }

  static mapToProjectFiscalSummaryUpdate(
    projectData: ICreateProject,
    startDate: moment.Moment | null,
    endDate: moment.Moment | null,
    technicalConsultant: string | null,
    projectPointOfContact: string | null
  ) {
    return {
      project_code: projectData.project_code,
      industry_rid: projectData.industry_rid || null,
      industry_name: projectData.industry_name || null,
      program_name: projectData.program_name || null,
      project_name: projectData.project_name || null,
      fiscal_year: projectData.fiscal_year,
      project_startdate: startDate?.toDate() || null,
      project_enddate: endDate?.toDate() || null,
      project_type_rid: projectData.project_type_rid,
      project_classification_rid:
        projectData.project_classification_rid || null,
      project_classification_other:
        projectData.project_classification_other || null,
      project_client_group: projectData.project_client_group || null,
      project_group: projectData.project_group || null,
      status_rid: projectData.status_rid,
      country_rid: projectData.country_rid || null,
      region_rid: projectData.region_rid || null,
      currency_rid: projectData.currency_rid || null,
      comments: projectData.comments || null,
      project_description: projectData.project_description || null,

      total_fte_prj: projectData.total_fte || null,
      total_subcon_prj: projectData.total_subcon || null,

      total_effort_prj: projectData.total_effort || null,
      total_cost_prj: projectData.total_cost || null,

      total_effort_fte_prj: projectData.total_effort_fte || null,
      total_effort_subcon_prj: projectData.total_effort_subcon || null,

      total_cost_fte_prj: projectData.total_cost_fte || null,
      total_cost_subcon_prj: projectData.total_cost_subcon || null,
      total_cost_nonlabor_prj: projectData.total_cost_nonlabor || null,

      auto_send_ai_interaction: projectData.auto_send_ai_interaction,
      auto_access_rd: projectData.auto_access_rd ?? false,
      max_ai_interaction: DEFAULT_PROJECT_DETAILS.maxAiInteraction,

      blended_rate_fte: projectData.blended_rate_fte || null,
      blended_rate_subcon: projectData.blended_rate_subcon || null,

      modified_datetime: new Date(),
      modified_by: projectData.modified_by || null,

      technical_point_of_contact: technicalConsultant,
      project_point_of_contact: projectPointOfContact,
    };
  }
}
export class ProjectResourceMapper {
  static mapToProjectResource(
    projectResource: ICreateProjectResource,
    startDate: moment.Moment | null,
    endDate: moment.Moment | null,
    userId: string,
    projectResourceCode: string
  ) {
    return {
      eid: null,
      created_by: userId,
      created_datetime: new Date(),

      account_rid: projectResource.account_rid,
      project_rid: projectResource.project_rid,
      resource_rid: projectResource.resource_id,
      project_code: projectResource.project_code,
      project_resource_code: projectResourceCode,
      fiscal_year: projectResource.fiscal_year,

      start_date: startDate ? startDate.toDate() : null,
      end_date: endDate ? endDate.toDate() : null,

      resource_code: projectResource.resource_code,

      total_hours_pro_res: projectResource.total_hours_pro_res || null,
      total_cost_pro_res: projectResource.total_cost_pro_res || null,

      status_rid: projectResource.status_rid || null,
      country_rid: projectResource.country_rid || null,
      region_rid: projectResource.region_rid || null,
      currency_rid: projectResource.currency_rid || null,

      manager_name: projectResource.manager_name,
      manager_ref_id: projectResource.manager_ref_id,

      effort_project_resource_level:
        projectResource.effort_project_resource_level || null,
      cost_project_resource_level:
        projectResource.cost_project_resource_level || null,

      description: projectResource.description || null,
    };
  }

  static maptToUpdateProjectResourceFiscal(
    projectResource: ICreateProjectResource,
    userId: string
  ) {
    return {
      fiscal_year: projectResource.fiscal_year,
      status_rid: projectResource.status_rid || null,
      description: projectResource.description || null,
      country_rid: projectResource.country_rid || null,
      currency_rid: projectResource.currency_rid || null,
      region_rid: projectResource.region_rid || null,
      modified_by: userId,
      modified_datetime: new Date(),
    };
  }

  static mapToProjectResourceFiscalRegion(
    projectResource: ICreateProjectResource | IUpdateProjectResource,
    fiscalYear: number,
    userId: string,
    resourceId: string
  ) {
    return {
      created_by: userId,
      created_datetime: new Date(),

      account_rid: projectResource.account_rid,
      project_rid: projectResource.project_rid,
      resource_rid: resourceId,
      fiscal_year: fiscalYear,

      total_hours_pro_res: projectResource.total_hours_pro_res ?? null,
      total_cost_pro_res: projectResource.total_cost_pro_res ?? null,

      status_rid: projectResource.status_rid ?? null,
      country_rid: projectResource.country_rid ?? null,
      region_rid: projectResource.region_rid ?? null,
      currency_rid: projectResource.currency_rid ?? null,

      description: projectResource.description ?? null,
    };
  }

  static maptToUpdateProjectResourceFiscalRegion(
    projectResource: ICreateProjectResource | IUpdateProjectResource,
    userId: string
  ) {
    return {
      status_rid: projectResource.status_rid || null,
      description: projectResource.description || null,
      effort_project_resource_level: projectResource.total_hours_pro_res,
      cost_project_resource_level: projectResource.total_cost_pro_res,
      modified_by: userId,
      modified_datetime: new Date(),
    };
  }

  static mapToProjectFiscal(
    data: any,
    projectId: string,
    fiscalYear: number,
    userId: string
  ) {
    return {
      project_rid: projectId,

      created_datetime: new Date(),
      created_by: userId,
      modified_by: null,

      project_code: data.project_code,
      industry_rid: data.industry_rid || null,
      industry_name: data.industry_name || null,
      fiscal_year: fiscalYear,
      project_name: data.project_name || null,
      program_name: data.program_name || null,
      account_rid: data.account_rid,

      country_rid: data.country_rid || null,
      currency_rid: data.currency_rid || null,

      max_ai_interaction: DEFAULT_PROJECT_DETAILS.maxAiInteraction,
      expiry_duration: null,
      auto_access_rd: data.auto_access_rd ?? false,

      status_rid: data.status_rid,
      project_startdate: data.start_date || null,
      project_enddate: data.end_date || null,
      project_type_rid: data.project_type_rid,

      project_client_group: data.project_client_group || null,
      project_group: data.project_group || null,
      project_classification_rid: data.project_classification_rid || null,
      project_classification_other: data.project_classification_other || null,

      auto_send_ai_interaction: data.auto_send_ai_interaction,

      total_fte_prj: data.total_fte || null,
      total_subcon_prj: data.total_subcon || null,
      total_nonlabor_prj: null,
      total_effort_prj: data.total_effort || null,
      total_cost_prj: data.total_cost || null,

      total_effort_fte_prj: data.total_effort_fte || null,
      total_effort_subcon_prj: data.total_effort_subcon || null,
      total_cost_fte_prj: data.total_cost_fte || null,
      total_cost_subcon_prj: data.total_cost_subcon || null,
      total_cost_nonlabor_prj: data.total_cost_nonlabor || null,

      total_fte_from_prj_res: null,
      total_subcon_from_prj_res: null,
      total_nonlabor_from_prj_res: null,
      total_resources_prj: null,
      total_resources_from_prj_res: null,
      total_resources_from_tasks: null,
      total_effort_from_prj_res: null,
      total_effort_fte_from_prj_res: null,
      total_effort_subcon_from_prj_res: null,
      total_cost_from_prj_res: null,
      total_cost_fte_from_prj_res: null,
      total_cost_subcon_from_prj_res: null,
      total_cost_nonlabor_from_prj_res: null,

      effective_total_fte: null,
      effective_total_subcon: null,
      effective_total_nonlabor: null,

      blended_rate_fte: data.blended_rate_fte || null,
      blended_rate_subcon: data.blended_rate_subcon || null,

      assessment_status: data.assessment_status || null,

      default_metric_type: "project_resource",

      comments: data.comments || null,
      project_description: data.project_description || null,
    };
  }

  static mapToAccountFiscal(
    fiscalData: ICreateProjectResource | IUpdateProjectResource,
    userId: string
  ) {
    return {
      tax_claim_level: null,

      blended_rate_fte: null,
      blended_rate_subcon: null,

      total_fte: null,
      total_subcon: null,

      total_project_hours: fiscalData.total_hours_pro_res || null,
      total_project_cost: fiscalData.total_cost_pro_res || null,

      total_project_qre_fte: null,
      total_project_qre_subcon: null,
      total_projects_qre: null,

      total_projects_rd_credits_fte: null,
      total_projects_rd_credits_subcon: null,
      total_projects_rd_credits: null,

      total_qualifying_projects_fed: null,
      qualifying_fte_fed: null,
      qualifying_subcon_fed: null,

      qualifying_project_hours_fte_fed: null,
      qualifying_project_hours_subcon_fed: null,
      qualifying_project_hours_fed: null,

      qualifying_project_cost_fte_fed: null,
      qualifying_project_cost_subcon_fed: null,
      qualifying_project_cost_nonlabor_fed: null,
      qualifying_project_cost_fed: null,

      qualifying_project_qre_fte_fed: null,
      qualifying_project_qre_subcon_fed: null,
      qualifying_project_qre_fed: null,

      qualifying_project_rd_credits_fte_fed: null,
      qualifying_project_rd_credits_subcon_fed: null,
      qualifying_project_rd_credits_fed: null,

      created_datetime: new Date(),

      created_by: userId,
    };
  }

  static mapToUpdateProjectResource(
    projectResource: IUpdateProjectResource,
    startDate: moment.Moment | null,
    endDate: moment.Moment | null,
    projectResourceCode: string,
    resourceId: string,
    userId: string
  ) {
    return {
      modified_datetime: new Date(),
      modified_by: userId,

      resource_rid: resourceId,
      project_resource_code: projectResourceCode,
      fiscal_year: projectResource.fiscal_year,

      start_date: startDate ? startDate.toDate() : null,
      end_date: endDate ? endDate.toDate() : null,

      total_hours_pro_res: projectResource.total_hours_pro_res || null,
      total_cost_pro_res: projectResource.total_cost_pro_res || null,

      status_rid: projectResource.status_rid || null,
      country_rid: projectResource.country_rid || null,
      region_rid: projectResource.region_rid || null,
      currency_rid: projectResource.currency_rid || null,

      manager_name: projectResource.manager_name,
      manager_ref_id: projectResource.manager_ref_id,

      effort_project_resource_level:
        projectResource.effort_project_resource_level || null,
      cost_project_resource_level:
        projectResource.cost_project_resource_level || null,

      salary: projectResource.salary || null,
      bonus: projectResource.bonus || null,
      deductions: projectResource.deductions || null,
      insurance: projectResource.insurance || null,

      description: projectResource.description || null,
    };
  }

  static mapToProjectResourceUpload(
    updateProjectResource: ProjectResource,
    userId: string,
    resourceData: any
  ) {
    return {
      project_resource_rid: updateProjectResource.rid,
      project_rid: updateProjectResource.project_rid,
      account_rid: updateProjectResource.account_rid,
      resource_id: updateProjectResource.resource_rid,
      resource_code: resourceData.resource_code,
      assigned_skill_role_type_rid:
        updateProjectResource.assigned_skill_role_type_rid ?? null,
      status_rid: updateProjectResource.status_rid ?? null,
      skill_role_rid: null,
      skill_role_others: null,
      total_hours_pro_res: updateProjectResource.total_hours_pro_res ?? 0,
      total_cost_pro_res: updateProjectResource.total_cost_pro_res ?? 0,
      fiscal_year: updateProjectResource.fiscal_year,
      country_rid: updateProjectResource.country_rid ?? null,
      region_rid: updateProjectResource.region_rid ?? null,
      currency_rid: updateProjectResource.currency_rid ?? null,
      start_date:  null,
      end_date: null,
      effort_project_resource_level:
        updateProjectResource.effort_project_resource_level ?? null,
      cost_project_resource_level:
        updateProjectResource.cost_project_resource_level ?? null,
      salary: updateProjectResource.salary ?? null,
      bonus: updateProjectResource.bonus ?? null,
      deductions: updateProjectResource.deductions ?? null,
      insurance: updateProjectResource.insurance ?? null,
      description: updateProjectResource.description ?? null,
      modified_by: userId,
    };
  }
}

export class ProjectTaskMapper {
  static mapToProjectTask(
    projectTask: ICreateProjectTask,
    startDate: moment.Moment | null,
    endDate: moment.Moment | null,
    userId: string,
    projectResourceCode: string,
    projectData: ProjectFiscal,
    resourceData: Resources,
  ) {
    return {
      eid: null,
      created_by: userId,
      created_datetime: new Date(),

      account_rid: projectTask.account_rid,
      project_rid: projectData.project_rid,
      project_fiscal_rid: projectTask.project_fiscal_rid,
      resource_rid: resourceData.rid!,
      project_resource_code: projectResourceCode,
      fiscal_year: projectData.fiscal_year,

      start_date: startDate ? startDate.toDate() : null,
      end_date: endDate ? endDate.toDate() : null,

      total_hours_pro_task: projectTask.total_hours_pro_task || null,
      total_cost_pro_task: projectTask.total_cost_pro_task || null,

      country_rid: projectTask.country_rid || null,
      region_rid: projectTask.region_rid || null,
      currency_rid: projectTask.currency_rid || null,

      comments: projectTask.comments || null,
    };
  }
}