export interface ProjectList {
  rid: string;
  account_number: string;
  account_name: string;
  r_number: string;
  project_ref_id: string;
  industry: string;
  project_startdate: string;
  project_enddate: string;
  project_type: string;
  project_classification: string;
  project_client_group: string;
  project_group: string; 
  project_status: string;
}

export type Project = {
  id: string;
  accountNumber: string;
  accountName: string;
  projectNumber: string;
  projectRefId: string;
  industry: string;
  project_startdate: string;
  project_enddate: string;
  projectType: string;
  projectClassification: string;
  projectClientGroup: string;
  projectGroup: string;
  project_status: string;
};

export type ProjectColumn<T> = {
  id: string;
  header: string;
  sortable?: boolean;
  sort?: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
};

export interface ProjectListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  filters?: object;
  fiscalYear: number;
  accountNumber?: string;
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
  key_contact_role_rid: string;
  is_primary_contact: boolean;
  include_in_communication: boolean;
  status: Status;
  action_type?: string;
}
export interface NewProjectData {
  account_id: string;
  account_number: string;
  project_code: string;
  project_name:string;
  project_id?:string;
  industry: string; 
  industry_rid: string;
  program_name: string;
  client_organization: string; // "TechCorp Inc."
  project_startdate: string; // e.g., "04/22/2025"
  project_enddate: string;   // e.g., "10/23/2025"
  project_type: string; // "Fixed"
  project_classification: string;
  project_client_group: string;
  project_group: string;
  project_summary: string;
  project_status: string; // "Active"
  fiscal_year: number; // 2025
  country: string; // UUID
  region: string;  // UUID
  currency: string; // UUID
  project_manager: string; // e.g., "Alice Johnson"
  project_lead: string;    // e.g., "Bob Smith"
  spoc_name: string;
  spoc_email: string;
  spoc_mobile: string;
  project_tpc_name: string;
  project_tpc_email: string;
  project_tpc_mobile: string;
  project_cc_list: string;
  total_effort: number | null;
  total_cost: number | null;
  total_fte: number | null;
  total_sub_con: number | null;
  total_non_labor_cost: number | null;
  total_fte_effort: number | null;
  total_sub_con_effort: number | null;
  total_fte_cost: number | null;
  total_sub_con_cost: number | null;
  last_rd_ai_assess_on: string;
  last_rd_ai_assess_by: string;
  auto_send_ai_interaction: boolean;
  auto_access_rd: boolean;
  max_ai_interaction: number | null;
  blended_rate_fte: string;
  blended_rate_sub_con: string;
  project_description: string;
  comments:string
  key_contacts: KeyContacts[];
}
