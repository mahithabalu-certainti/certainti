import { AttachmentList } from './attachment';
export interface CaseProjectResourceRow {
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
  attachment: AttachmentList[];
  assigned_skill_role_type_rid?: string | null;
  skill_role_rid?: string | null;
  skill_role_others?: string | null;
  fiscal_year?: number;
  project_fiscal_rid?: string;
  resource_rid?: string;
  account_number?: string;
  [key: string]: unknown;
}

export interface CaseProjectResourceListURLParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: Record<string, any>;
  search: string;
  case_rid: string;
  accountRid: string;
  fiscalYear: number;
  type?: string;
}

export type CaseProjectResourceList = CaseProjectResourceRow;

export interface CaseProjectResourceListResponse {
  data: {
    projectResources: CaseProjectResourceList[];
    count: number;
    totalCount: number;
  };
}
