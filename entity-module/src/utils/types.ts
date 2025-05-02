export interface ICreateResource {
  account_number: string;
  resource_ref_id: string;
  resource_type: "FullTime" | "Contract"| "Non-Labor";
  full_name?: string | null;
  org_name?: string | null;
  role?: string | null;
  fiscal_year: number;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  effective_from_date?: Date | null;
  effective_end_date?: Date | null;
  designation?: string | null;
  total_years_experience?: number | null;
  total_years_in_org?: number | null;
  resource_status?: "Active" | "Inactive";
  created_by: string;
  modified_by?: string | null;
  account_id: string;
  comments?: string;
}

export interface IUpdateResource {
  resource_id: string;
  account_number: string;
  resource_ref_id: string;
  resource_type: "FullTime" | "Contract" | "Non-Labor";
  full_name?: string | null;
  org_name?: string | null;
  role?: string | null;
  fiscal_year: number;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  effective_from_date?: string | null;
  effective_end_date?: string | null;
  designation?: string | null;
  total_years_experience?: number | null;
  total_years_in_org?: number | null;
  resource_status?: "Active" | "Inactive";
  modified_by: string;
  comments?: string;
}
export interface IResourceCost {
  eid: string;
  account_rid: string;
  resource_type: string;
  resource_rid: string;
  resource_ref_id: string;
  effective_date?: string | null;
  end_date?: string | null;
  currency_rid?: string;
  cost_frequency: string;
  cost: number;
  created_datetime?: string | null;
  modified_datetime?: string | null;
  created_by?: string | null;
  modified_by?: string | null;
  status?: "active" | "inactive";
  accountNumber: string;
  fiscal_year?: string;
  resource_number: string;
}

export interface IUpdateResourceCost {
  rid: string,
  eid: string;
  effective_date?: string | null;
  end_date?: string | null;
  currency_rid?: string;
  cost_frequency: string;
  cost: number;
  modified_datetime?: string | null;
  modified_by?: string | null;
  status?: "active" | "inactive";
  accountNumber: string;
}

export interface IResourceSkill {
   eid?: string;
   account_rid: string;
   resource_type: string;
   resource_rid: string;
   resource_ref_id: string,
   resource_desc?: string;
   skill_rid: string;
   start_date?: string | null;
   skill_description?: string;
   skill_level?: string;
   status?: string;
   years_of_experience?: number,
   fiscal_year?: number,
   created_by?: string | null;
   modified_by?: string | null;
   skill_type?: string;
   skill_name: string;
   technical_weightage?: number;
   accountNumber: string;
   resource_number: string;
}

export interface IUpdateResourceSkill {
  rid: string;
  eid?: string;
  start_date?: string | null;
  skill_description?: string;
  skill_level?: string;
  status?: string;
  years_of_experience?: number,
  modified_by?: string | null;
  skill_rid: string;
  skill_name: string;
  skill_type?: string;
  technical_weightage?: number;
  accountNumber: string;
}

export interface ICreateProject {
  account_number: string;
  account_id: string;
  project_ref_id: string;
  industry: string;
  program_name?: string | null;
  client_organization: string;
  project_start_date?: Date | null;
  project_end_date?: Date | null;
  project_type: "Fixed" | "Time & Material";
  project_classification?: string | null;
  project_client_group?: string | null;
  project_group?: string | null;
  project_summary?: string | null;
  status?: "Active" | "Inactive";
  fiscal_year: number;
  country?: string | null;
  region?: string | null;
  currency?: string | null;
  project_manager: string;
  project_lead: string;
  spoc_name: string;
  spoc_email?: string | null;
  spoc_mobile?: string | null;
  project_tpc_name?: string | null;
  project_tpc_email?: string | null;
  project_tpc_mobile?: string | null;
  project_cc_list?: string | null;
  total_effort?: number;
  total_cost?: number;
  total_fte?: number;
  total_sub_con?: number;
  total_non_labor_cost?: number;
  total_fte_effort?: number;
  total_sub_con_effort?: number;
  total_fte_cost?: number;
  total_sub_con_cost?: number;
  last_rd_ai_assess_on?: Date | null;
  last_rd_ai_assess_by?: string | null;
  auto_send_ai_interaction?: boolean;
  auto_access_rd?: boolean;
  max_ai_interaction?: number;
  blended_rate_fte?: string | null;
  blended_rate_sub_con?: string | null;
  project_description?: string | null;
  modified_by?: string;
  created_by: string;
}

export interface IUpdateProject {
  project_id: string;
  account_number: string;
  account_id: string;
  project_ref_id: string;
  industry: string;
  program_name?: string | null;
  client_organization: string;
  project_start_date?: Date | null;
  project_end_date?: Date | null;
  project_type: "Fixed" | "Time & Material";
  project_classification?: string | null;
  project_client_group?: string | null;
  project_group?: string | null;
  project_summary?: string | null;
  status?: "Active" | "Inactive";
  fiscal_year: number;
  country?: string | null;
  region?: string | null;
  currency?: string | null;
  project_manager: string;
  project_lead: string;
  spoc_name: string;
  spoc_email?: string | null;
  spoc_mobile?: string | null;
  project_tpc_name?: string | null;
  project_tpc_email?: string | null;
  project_tpc_mobile?: string | null;
  project_cc_list?: string | null;
  total_effort?: number;
  total_cost?: number;
  total_fte?: number;
  total_sub_con?: number;
  total_non_labor_cost?: number;
  total_fte_effort?: number;
  total_sub_con_effort?: number;
  total_fte_cost?: number;
  total_sub_con_cost?: number;
  last_rd_ai_assess_on?: Date | null;
  last_rd_ai_assess_by?: string | null;
  auto_send_ai_interaction?: boolean;
  auto_access_rd?: boolean;
  max_ai_interaction?: number;
  blended_rate_fte?: string | null;
  blended_rate_sub_con?: string | null;
  project_description?: string | null;
  modified_by?: string;
  created_by: string;
}