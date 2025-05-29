export type ProjectList = {
  rid: string;
  account_id?: string;
  project_id?: string;
  account_rid?: string;
  account_number: string;
  account_name: string;
  r_number: string;
  project_ref_id: string;
  modified_datetime?: string;
  industry: string;
  project_startdate: string;
  project_enddate: string;
  project_type: string;
  project_classification: string;
  project_client_group: string;
  project_group: string;
  project_status: string;
  technical_consultant?: string;
  financial_consultant?: string;
  project_point_of_contact: string;
  currency_code?: string;
  region_name?: string;
  country_name?: string;
  description?: string;
  status: string;
  comments?: string;
  total_effort?: string;
  total_cost?: string;
  total_fte?: number;
  total_sub_con?: number;
  total_non_labor_cost?: string;
  total_fte_effort?: string;
  total_sub_con_cost?: string;
  total_fte_cost?: string;
  qre?: string;
  is_rd_qualified?: string;
  qualified_research_expenditure?: string;
  program_name?: string;
  industry_name?: string;
  fiscal_year: string;
  name?: string;
  project_code?: string;
};

export type Project = {
  id: string;
  accountNumber: string;
  accountName: string;
  projectNumber: string;
  project_code: string;
  industry: string;
  project_startdate: string;
  project_enddate: string;
  projectType: string;
  projectClassification: string;
  projectClientGroup: string;
  projectGroup: string;
  project_status: string;
  industry_name?: string;
};

export interface ProjectTableColumn<T> {
  id: string;
  sortId: string;
  label: string;
  sortable?: boolean;
  width: string | number;
  sticky?: boolean;
  sx?: React.CSSProperties;
  render?: (row: T) => React.ReactNode;
}

export interface ProjectListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  fiscalYear: number;
  accountNumber?: string;
}
export enum Status {
  Active = 'active',
  InActive = 'inactive',
}
export type ProjectListResponse = {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    projects: ProjectList[];
    count: number;
  };
};
export interface KeyContacts {
  key_contact_id?: string;
  account_rid?: string;
  key_contact_name: string;
  key_contact_email: string;
  key_contact_role: string;
  is_primary_contact: boolean;
  include_in_communication: boolean;
  status: Status;
  action_type?: string;
  key_contact_status?: Status;
  role_name?: string;
}
export interface NewProjectData {
  account_id?: string;
  name?: string;
  r_number?: string;
  industry_rid_name?: string;
  start_date?: string | null;
  end_date?: string | null;
  clasification?: string | null;
  project_classification_other?: string | null;
  classification_name?: string | null;
  client_group?: string | null;
  account_rid?: string;
  description?: string | null;
  status?: string;
  currency_name?: string;
  region_name?: string;
  country_name?: string;
  record_id?: string;
  created_on?: string;
  created_by?: string;
  modified_on?: string;
  modified_by?: string;
  is_active?: boolean;
  updated_on?: string;
  Updated_By?: string;
  created_datetime?: string;
  modified_datetime?: string;
  keyContact?: KeyContacts[] | undefined;
  efforts_in_hrs?: string | null;
  total_fte_count?: number | null;
  total_sub_con_count?: number | null;
  account_number?: string;
  project_code?: string;
  project_name?: string;
  project_id?: string;
  industry: string;
  industry_rid: string | null;
  industry_name: string;
  program_name: string;
  client_organization?: string;
  project_startdate?: string | null;
  project_enddate?: string | null;
  project_type?: string;
  project_classification_rid?: string | null;
  project_client_group?: string;
  project_group?: string;
  project_summary?: string;
  project_status?: string;
  fiscal_year?: number;
  country?: string;
  region?: string;
  currency?: string;
  total_effort?: string | null;
  total_cost?: string | null;
  total_fte?: number | null;
  total_sub_con?: number | null;
  total_non_labor_cost?: string | null;
  total_fte_effort?: string | null;
  total_sub_con_effort?: string | null;
  total_fte_cost?: string | null;
  total_sub_con_cost?: string | null;
  auto_send_ai_interaction?: boolean | string;
  auto_assessment?: boolean | string;
  auto_access_rd?: boolean;
  max_ai_interaction?: number | null;
  blended_rate_fte?: string | null;
  blended_rate_FTE?: string | null;
  max_ai_interaction_follow_up?: number | null;
  blended_rate_subCon?: string | null;
  blended_rate_sub_con?: string | null;
  project_description?: string;
  comments?: string;
  key_contacts?: KeyContacts[];
  key_contact_name?: string;
  key_contact_email?: string;
  key_contact_role?: string;
  rid?: string;
  is_primary_contact?: string;
  include_in_communication?: string;
  key_contact_status?: Status;
}
