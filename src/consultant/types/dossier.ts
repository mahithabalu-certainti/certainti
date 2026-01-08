//-------- Project Documents ----------
export interface ProjectDocumentsListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
}

export interface ProjectDocumentsListExportParams {
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
  timezone?: string;
}

export type ProjectDocumentItem = {
  rid: string;
  r_number: string;
  project_name: string;
  created_datetime: string;
  created_by: string;
  modified_datetime: string | null;
  modified_by: string | null;
  account_rid: string;
  browse_file: string;
  document_name: string;
  attach_to: string;
  attachment_level: string;
  fiscal_year: number;
  format: string;
  size_in_mb: string;
  document_category_rid: string;
  document_category: string;
  document_type_rid: string;
  document_category_others: string | null;
  document_type_others: string | null;
  comments: string | null;
  document_type: string;
  uploaded_by: string;
  attached_to: string;
}

export interface ProjectDocumentListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    page?: number;
    limit?: number;
    count: number;
    projectDocuments: ProjectDocumentItem[];
  };
}

//-------- Qualified Projects ----------
export interface QualifiedProjectsListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
}

export interface QualifiedProjectsListExportParams {
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
  timezone?: string;
}

export type QualifiedProjectItem = {
  rid: string;
  r_number: string;
  account_rid: string;
  project_rid: string;
  project_code: string;
  project_name: string | null;
  project_type_name: string;
  classification_name: string;
  fiscal_year: number;
  project_classification_rid: string | null;
  project_classification_name: string | null;
  project_client_group: string | null;
  project_group: string | null;
  total_effort_prj: number | null;
  total_cost_prj: number | null;
  total_cost_fte_prj: number | null;
  total_cost_subcon_prj: number | null;
  total_cost_nonlabor_prj: number | null;
  assessment_status: string | null;
  rd_percent_final: string | null;
  qre_final: string | null;
  comments: string | null;
  modified_datetime: string;
  project_point_of_contact: string | null;
  project_technical_point_of_contact: string | null;
  currency_symbol: string | undefined;
};

export interface QualifiedProjectListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    page?: number;
    limit?: number;
    count: number;
    qualifiedProjects: QualifiedProjectItem[];
  };
}


//-------- Dossier Summary ----------
export type DossierSummarySectionItem = {
  title: string;
  summary: string;
};

export type DossierSummary = {
  title: string;
  account_name: string;
  country_name: string;
  fiscal_year: number;
  company_overview: DossierSummarySectionItem[];
  overall_projects_summary: DossierSummarySectionItem[];
  assessment_methodology: string;
};

export interface DossierSummaryResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    dossierSummary: DossierSummary;
  };
}


//-------- Resource Summary ----------
export interface ResourceSummaryListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
}

export interface ResourceSummaryListExportParams {
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
  timezone?: string;
}

export type ResourceSummaryItem = {
  rid: string;
  r_number: string;
  resource_code: string;
  project_resource_code: string | null;
  project_resource_id?: string;
  resource_name: string | null;
  resource_firstname: string | null;
  resource_lastname: string | null;
  resource_type_name: string | null;
  resource_type_rid?: string;
  designation: string | null;
  resource_role: string | null;
  resource_orgname: string | null;
  project_rid: string | null;
  project_code: string | null;
  project_name: string | null;
  project_resource_role: string | null;
  country_rid: string | null;
  country_name: string | null;
  country_code: string | null;
  region_rid: string | null;
  region_name: string | null;
  resource_region?: string;
  resource_country?: string;
  city_rid: string | null;
  city_name: string | null;
  currency_rid: string | null;
  currency_name: string | null;
  currency_symbol: string;
  resource_startdate: string | null;
  resource_enddate: string | null;
  start_date?: string | null;
  end_date?: string | null;
  resource_total_experience: string | number | null;
  resource_total_experience_organization: string | number | null;
  total_hours_pro_res: number | string | null;
  effort_hours?: number | string | null;
  total_cost_pro_res: string | number | null;
  net_resource_cost?: string | number | null;
  net_total_cost_pro_res: string | number | null;
  effort_project_resource_level: number | null;
  cost_project_resource_level: number | null;
  qre_final: number | null;
  qre_percent: number | null;
  salary: number | string | null;
  bonus: number | string | null;
  insurance: number | string | null;
  deductions: number | string | null;
  status_rid: string | null;
  status_name: string | null;
  comments: string | null;
  description: string | null;
  account_rid?: string;
  created_by: string;
  modified_by: string;
  created_datetime: string;
  modified_datetime: string;
  assigned_skill_role_type_rid?: string | null;
  skill_role_rid?: string | null;
  skill_role_others?: string | null;
  fiscal_year?: number;
  project_fiscal_rid?: string;
  resource_rid?: string;
  account_number?: string;
};

export interface ResourceSummaryListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    page?: number;
    limit?: number;
    count: number;
    resourceSummary: ResourceSummaryItem[];
  };
}

//-------- Project Summary ----------
export interface ProjectSummaryListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
}

export interface ProjectSummaryListExportParams {
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  caseRid?: string;
  accountRid?: string;
  search?: string;
  timezone?: string;
}

export type ProjectSummaryItem = {
  rid: string;
  r_number: string;
  account_rid: string;
  project_rid: string;
  project_code: string;
  project_name: string | null;
  project_type_name: string;
  classification_name: string;
  fiscal_year: number;
  project_classification_rid: string | null;
  project_classification_name: string | null;
  project_client_group: string | null;
  project_group: string | null;
  total_effort_prj: number | null;
  total_cost_prj: number | null;
  total_cost_fte_prj: number | null;
  total_cost_subcon_prj: number | null;
  total_cost_nonlabor_prj: number | null;
  assessment_status: string | null;
  rd_percent_final: string | null;
  qre_final: string | null;
  comments: string | null;
  modified_datetime: string;
  project_point_of_contact: string | null;
  project_technical_point_of_contact: string | null;
  currency_symbol: string | undefined;
};

export interface ProjectSummaryListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    page?: number;
    limit?: number;
    count: number;
    projectSummary: ProjectSummaryItem[];
  };
}

// RD form
export interface RDFormResponse {
  status: number;
  message: string;
  data: string; // Base64 encoded PDF data
}

export interface RDFormPayload {
  country_rid: string;
  region_rid?: string;
}


// financial highlights 

export interface RDCreditPreviewResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    rid: string;
    case_rid: string;
    country_rid: string;
    state_rid: string;
    input_params: {
      metadata: {
        country: string;
        currency: string;
        credit_type: string;
      };
      qreSummary: {
        totalQREs: number;
        prior_year_qre_1: number;
        prior_year_qre_2: number;
      };
    };
    computed_fields: {
      computed_fields: {
        excess_qre: number;
        allowable_credit: number;
        sum_prior_two_years: number;
        fifty_percent_of_prior_two_years: number;
      };
    };
    final_credit: number | null;
    created_datetime: string;
    modified_datetime: string;
  };
}

export interface RDCreditStatusResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: string; // "COMPLETED", "PENDING", etc.
}

export interface RDCreditInitiatePayload {
  account_rid: string;
  case_rid: string;
  effective_start: string;
  effective_end: string;
}

export interface RDCreditInitiateResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: number;
}
