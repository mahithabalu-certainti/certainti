import { ICreateProject, IUpdateProject } from "./types";

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
      max_ai_interaction: projectData.max_ai_interaction,
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

      max_ai_interaction: data.max_ai_interaction,
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
    projectPointOfContact: string | null
  ) {
    return {
      project_code: projectData.project_code,
      project_rid: project.rid || "",

      created_datetime: new Date(),
      modified_datetime: new Date(),
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
    };
  }

  static mapToProjectFiscalSummary(
    projectData: ICreateProject,
    projectId: string,
    startDate: moment.Moment | null,
    endDate: moment.Moment | null,
    technicalConsultant: string | null,
    projectPointOfContact: string | null,
    projectFiscalId: string
  ) {
    return {
      project_rid: projectId,
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

      max_ai_interaction: projectData.max_ai_interaction,
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
      modified_datetime: new Date(),

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
      max_ai_interaction: data.max_ai_interaction,

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
      max_ai_interaction: projectData.max_ai_interaction,

      blended_rate_fte: projectData.blended_rate_fte || null,
      blended_rate_subcon: projectData.blended_rate_subcon || null,

      modified_datetime: new Date(),
      modified_by: projectData.modified_by || null,

      technical_point_of_contact: technicalConsultant,
      project_point_of_contact: projectPointOfContact,
    };
  }
}
