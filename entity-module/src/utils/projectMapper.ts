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
      project_type: projectData.project_type,
      project_classification_rid:
        projectData.project_classification_rid || null,
      project_classification_other:
        projectData.project_classification_other || null,
      project_client_group: projectData.project_client_group || null,
      project_group: projectData.project_group || null,
      project_status: projectData.project_status,
      fiscal_year: projectData.fiscal_year,
      country: projectData.country || null,
      region: projectData.region || null,
      currency: projectData.currency || null,
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
      modified_datetime: new Date(),
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
      eid: null,
      project_code: data.project_code,
      industry_rid: data.industry_rid || null,
      industry_name: data.industry_name || null,
      account_rid: data.account_id,
      account_fiscal_rid: null,
      program_name: data.program_name || null,
      project_name: data.project_name || null,
      fiscal_year: data.fiscal_year,
      project_startdate: startDate?.toDate() || null,
      project_enddate: endDate?.toDate() || null,
      project_type: data.project_type,
      project_classification_rid: data.project_classification_rid || null,
      project_classification_other: data.project_classification_other || null,
      project_client_group: data.project_client_group || null,
      project_group: data.project_group || null,
      project_status: data.project_status || null,
      country: data.country || null,
      region: data.region || null,
      comments: data.comments || "",
      currency: data.currency || null,

      total_fte: data.total_fte || 0,
      total_subcon: data.total_subcon || 0,
      total_effort: data.total_effort || null,
      total_cost: data.total_cost || null,
      total_effort_fte: data.total_effort_fte || null,
      total_effort_subcon: data.total_effort_subcon || null,
      total_cost_fte: data.total_cost_fte || null,
      total_cost_subcon: data.total_cost_subcon || null,
      total_cost_nonlabor: data.total_cost_nonlabor || null,

      auto_send_ai_interaction: data.auto_send_ai_interaction,
      auto_access_rd: data.auto_access_rd ?? false,
      max_ai_interaction: data.max_ai_interaction,

      blended_rate_fte: data.blended_rate_fte || null,
      blended_rate_subcon: data.blended_rate_subcon || null,

      created_datetime: new Date(),
      modified_datetime: new Date(),
      created_by: userId,
      modified_by: userId,
    };
  }

  static mapToProjectSummary(
    projectData: ICreateProject,
    project: any,
    startDate: moment.Moment | null,
    endDate: moment.Moment | null,
    technicalConsultant: string | null,
    financialConsultant: string | null,
    projectPointOfContact: string | null
  ) {
    return {
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
      total_fte: projectData.total_fte || 0,
      total_subcon: projectData.total_subcon || 0,
      total_cost_nonlabor: projectData.total_cost_nonlabor || null,
      total_cost_fte: projectData.total_cost_fte || null,
      total_cost_subcon: projectData.total_cost_subcon || null,
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
    };
  }

  static mapToProjectFiscalSummary(
    projectData: ICreateProject,
    projectId: any,
    startDate: moment.Moment | null,
    endDate: moment.Moment | null,
    technicalConsultant: string | null,
    financialConsultant: string | null,
    projectPointOfContact: string | null,
    projectFiscalId: string
  ) {
    return {
      project_rid: projectId,
      project_fiscal_rid: projectFiscalId,
      eid: null,
      project_code: projectData.project_code,
      industry_rid: projectData.industry_rid || null,
      industry_name: projectData.industry_name || null,
      account_rid: projectData.account_id,
      account_fiscal_rid: null,
      program_name: projectData.program_name || null,
      project_name: projectData.project_name || null,
      fiscal_year: projectData.fiscal_year,
      project_startdate: startDate?.toDate() || null,
      project_enddate: endDate?.toDate() || null,
      project_type: projectData.project_type,
      project_classification_rid:
        projectData.project_classification_rid || null,
      project_classification_other:
        projectData.project_classification_other || null,
      project_client_group: projectData.project_client_group || null,
      project_group: projectData.project_group || null,
      project_status: projectData.project_status || null,
      country: projectData.country || null,
      region: projectData.region || null,
      comments: projectData.comments || "",
      currency: projectData.currency || null,

      total_fte: projectData.total_fte || 0,
      total_subcon: projectData.total_subcon || 0,
      total_effort: projectData.total_effort || null,
      total_cost: projectData.total_cost || null,
      total_effort_fte: projectData.total_effort_fte || null,
      total_effort_subcon: projectData.total_effort_subcon || null,
      total_cost_fte: projectData.total_cost_fte || null,
      total_cost_subcon: projectData.total_cost_subcon || null,
      total_cost_nonlabor: projectData.total_cost_nonlabor || null,

      auto_send_ai_interaction: projectData.auto_send_ai_interaction,
      auto_access_rd: projectData.auto_access_rd ?? false,
      max_ai_interaction: projectData.max_ai_interaction,

      blended_rate_fte: projectData.blended_rate_fte || null,
      blended_rate_subcon: projectData.blended_rate_subcon || null,

      created_datetime: new Date(),
      modified_datetime: new Date(),
      created_by: projectData.created_by,
      modified_by: projectData.modified_by,

      technical_point_of_contact: technicalConsultant,
      financial_consultant: financialConsultant,
      project_point_of_contact: projectPointOfContact,

      is_rd_qualified: null,
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
    endDate: moment.Moment | null,
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
      project_type: data.project_type,
      project_classification_rid: data.project_classification_rid || null,
      project_classification_other: data.project_classification_other || null,
      project_client_group: data.project_client_group || null,
      project_group: data.project_group || null,
      project_status: data.project_status || null,
      country: data.country || null,
      region: data.region || null,
      comments: data.comments || "",
      currency: data.currency || null,

      total_fte: data.total_fte || 0,
      total_subcon: data.total_subcon || 0,
      total_effort: data.total_effort || null,
      total_cost: data.total_cost || null,
      total_effort_fte: data.total_effort_fte || null,
      total_effort_subcon: data.total_effort_subcon || null,
      total_cost_fte: data.total_cost_fte || null,
      total_cost_subcon: data.total_cost_subcon || null,
      total_cost_nonlabor: data.total_cost_nonlabor || null,

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
    financialConsultant: string | null,
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
      project_type: projectData.project_type,
      project_classification_rid:
        projectData.project_classification_rid || null,
      project_classification_other:
        projectData.project_classification_other || null,
      project_client_group: projectData.project_client_group || null,
      project_group: projectData.project_group || null,
      project_status: projectData.project_status || null,
      country: projectData.country || null,
      region: projectData.region || null,
      comments: projectData.comments || "",
      currency: projectData.currency || null,

      total_fte: projectData.total_fte || 0,
      total_subcon: projectData.total_subcon || 0,
      total_effort: projectData.total_effort || null,
      total_cost: projectData.total_cost || null,
      total_effort_fte: projectData.total_effort_fte || null,
      total_effort_subcon: projectData.total_effort_subcon || null,
      total_cost_fte: projectData.total_cost_fte || null,
      total_cost_subcon: projectData.total_cost_subcon || null,
      total_cost_nonlabor: projectData.total_cost_nonlabor || null,

      auto_send_ai_interaction: projectData.auto_send_ai_interaction,
      auto_access_rd: projectData.auto_access_rd ?? false,
      max_ai_interaction: projectData.max_ai_interaction,

      blended_rate_fte: projectData.blended_rate_fte || null,
      blended_rate_subcon: projectData.blended_rate_subcon || null,

      modified_datetime: new Date(),
      modified_by: projectData.modified_by,

      technical_point_of_contact: technicalConsultant,
      financial_consultant: financialConsultant,
      project_point_of_contact: projectPointOfContact,
    };
  }
}
