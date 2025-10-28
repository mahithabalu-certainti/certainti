export type AssignProject = {
  project_classification_other: string | null;
  project_code: string;
  project_name: string | null;
  account_name?: string;
  account_status_name?: string;
  account_id: string;
  project_rid: string;
  modified_datetime: string;
  assessment_status: string | null;
  qre: string | null;
  qre_final?: string | null;
  rd_percent_potential_ai: string | null;
  is_rd_qualified: boolean;
  industry_name_other: string | null;
  project_type: string;
  project_type_name: string;
  project_client_group: string | null;
  project_group: string | null;
  project_classification_rid: string | null;
  classification_name: string | null;
  project_status: string;
  project_point_of_contact: string | null;
  technical_point_of_contact: string | null;
  r_number: string;
  program_name: string | null;
  project_startdate: string | null;
  project_enddate: string | null;
  total_cost: number | null;
  total_effort: number | null;
  total_fte: number | null;
  total_cost_fte: number | null;
  total_subcon: number | null;
  total_cost_subcon: number | null;
  total_cost_nonlabor: number | null;
  comments: string | null;
  country_name: string | null;
  currency_code: string;
  currency_symbol: string;
  region_name: string | null;
  created_datetime: string;
  rid?: string;
  account_rid?: string;
  fiscal_year?: number;
  project_fiscal_rid?: string;
  // ProjectFiscal: ProjectFiscalSummary[];
  _level?: number;
  currency_rid?: string;
};

export interface AssignProjectListURLParams {
  page: number;
  limit: number;
  sort: string;
  sort_by: 'ASC' | 'DESC';
  filters?: object;
  globalFilters?: object;
  account_rid?: string;
  interaction_rid?: string;
  project_rid?: string;
  project_fiscal_rid?: string;
  fiscal_year?: number;
  isGlobal?: boolean;
  flag?: string;
  attachment_count?: number | string | null;
  search?: string;
  reminder_specific_list?: boolean;
}

export interface assignProjectsListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue?: string;
  data: {
    page: number;
    limit: number;
    totalCount: number;
    interactions: AssignProject[];
  };
}
