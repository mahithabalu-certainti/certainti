export interface TimesheetProjectTableListURLParams {
  page?: number;
  limit?: number;
  sort: string;
  sort_by: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear?: number | string;
  account_rid: string;
  documentRid: string;
  bothParentAndChild?: boolean;
}

export interface TimesheetProjectTableListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue: string;
  data: {
    projects: TimesheetProjectList[];
    totalCount?: number;
  };
}

export type TimesheetProjectList = {
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
  is_rd_qualified: boolean;
  industry_name_other: string | null;
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
  ProjectFiscal: ProjectFiscalSummary[];
  _level?: number;
  currency_rid?: string;
};

export type ProjectFiscalSummary = {
  account_status_name?: string;
  project_code: string;
  project_group: string | null;
  project_name: string | null;
  project_type: string;
  fiscal_year: number;
  project_client_group: string | null;
  account_name: string;
  qre: string | null;
  classification_name: string | null;
  total_effort: number | null;
  total_cost: number | null;
  total_cost_fte: number | null;
  total_cost_subcon: number | null;
  total_cost_nonlabor: number | null;
  assessment_status: string | null;
  qre_final: string | null;
  project_point_of_contact: string | null;
  technical_point_of_contact: string | null;
  comments: string | null;
  modified_datetime: string;
  project_rid: string;
  created_datetime: string;
  project_fiscal_rid: string;
  rid: string;
};

export interface TimesheetResourceTableListResponse {
  statusCode: number;
  statusMessage: string;
  statusCodeValue: string;
  data: {
    resources: TimesheetResourceListType[];
    count?: number;
  };
}
export type TimesheetResourceListType = {
  rid: string;
  r_number: string;
  resource_code: string;
  resource_name: string;
  resource_firstname: string | null;
  resource_lastname: string | null;
  resource_type_rid: string;
  status_rid: string;
  resource_role: string | null;
  resource_designation: string | null;
  resource_orgname: string | null;
  comments: string | null;
  resource_total_experience: number | null;
  country_rid: string | null;
  region_rid: string | null;
  city_rid: string | null;
  account_name: string;
  total_project_hours: number | null;
  estimated_rd_hours: number | null;
  country_name: string | null;
  region_name: string | null;
  city_name: string | null;
  resource_type_name: string;
  status_name: string;
  total_hours_pro_res: number | null;
  total_cost_pro_res: number | null;
  qre_percent: number | null;
  qre_final: number | null;
  currency_symbol: string;

};

export interface TimesheetProjectExportListURLParams {
  page?: number;
  limit?: number;
  sortOrder: 'ASC' | 'DESC';
  sortBy: string;
  filters?: object;
  fiscalYear?: number | string;
  account_rid: string;
  documentRid: string;
  bothParentAndChild?: boolean;
}