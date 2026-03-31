import { AttachmentList } from './attachment';
import { NewProjectData } from './project';

export type AssignProject = {
  rid: string;
  r_number: string;
  is_qualified: boolean;
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
  currency_rid: string | null;
};
export type ReviewProject = {
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
  total_fte_prj: number | null;
  total_effort_subcon_prj: number | null;
  total_cost_nonlabor_prj: number | null;
  assessment_status: string | null;
  rd_percent_final: string | null;
  qre_final: string | null;
  comments: string | null;
  modified_datetime: string;
  project_point_of_contact: string | null;
  project_technical_point_of_contact: string | null;
  project_point_of_contact_email: string;
  primary_point_of_contact_name: string;
  currency_symbol: string | undefined;
  total_subcon_prj: number | null;
  total_nonlabor_prj: number | null;
  total_effort_fte_prj: number | null;
  total_resources_prj: number | null;
  total_tasks: number | null;
  total_technical_summaries: number | null;
  industry_name: string;
};

export interface AssignProjectListURLParams {
  page: number;
  limit: number;
  sort: string;
  sort_by: 'ASC' | 'DESC';
  filter?: object;
  account_rid?: string;
  case_rid?: string;
  fiscal_year?: number;
  search?: string;
  type?: string;
}

export interface assignProjectsListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: {
    page: number;
    limit: number;
    total_result: number;
    projects: AssignProject[];
  };
}
export type AssignProjectList = {
  project_rid: string;
  project_fiscal_rid: string;
  project_group: string;
};
export interface AssignProjectsParams {
  account_rid: string;
  case_rid: string;
  projects: AssignProjectList[];
}
export type CaseSortOrder = 'ASC' | 'DESC';
export interface ReviewProjectListURLParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: CaseSortOrder;
  fiscalYear?: number | string;
  filters?: object;
  searchTerm?: string;
  search?: string;
  timezone?: string;
  type?: string;
}
export type ReviewListProject = {
  rid: string;
  r_number: string;
  account_rid: string;
  project_rid: string;
  project_code: string;
  project_name: string | null;
  project_type_name: string;
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

export interface ReviewListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    reviewProjects: ReviewListProject[];
    count: number;
  };
}
export interface CaseGlobalFilters {
  [key: string]: string[];
}
export interface ReviewProjectExportParams {
  sortBy?: string;
  sortOrder?: CaseSortOrder;
  filters?: object;
  fiscalYear?: number | string;
  globalFilters?: CaseGlobalFilters;
  timezone?: string;
  search?: string;
}

export interface EmailTemplatePreviewParams {
  account_rid: string;
  case_rid: string;
  category_name: string;
}

export interface EmailTemplatePreview {
  to_email: string[];
  cc_email: string[];
  subject: string;
  body_html: string;
}

export interface EmailTemplatePreviewData {
  templatePreview: EmailTemplatePreview;
}

export interface EmailTemplatePreviewResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: EmailTemplatePreviewData;
}
export interface SentProjectsParams {
  case_rid: string;
  account_rid: string;
  to_email: string[];
  cc_email: string[];
  recipient_name: string;
  subject: string;
  body_html: string;
  project_id: string[];
  sort_by?: string;
  sort_order?: string;
  filters?: {
    project_code?: {
      contains: string;
    };
    // Add other filter types as needed
  };
}

export interface SentProjectsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    success: boolean;
    message?: string;
    // Add other response fields as per your API response
  };
}

export interface CasesProjectDetailResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    project: NewProjectData;
    attachment: AttachmentList[];
  };
}
