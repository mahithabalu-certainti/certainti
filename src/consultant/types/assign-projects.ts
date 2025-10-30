export type AssignProject = {
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
