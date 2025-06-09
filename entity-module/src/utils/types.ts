export interface ICreateResource {
  account_number: string;
  resource_code: string;
  resource_type: "Full-Time" | "Sub Con"| "Non-Labor";
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  org_name?: string | null;
  role?: string | null;
  resource_country?: string | null;
  resource_region?: string | null;
  resource_city?: string | null;
  effective_from_date?: Date | null;
  effective_end_date?: Date | null;
  resource_designation?: string | null;
  total_years_experience?: number | null;
  total_years_in_org?: number | null;
  resource_status?: "Active" | "Inactive";
  created_by?: string | null;
  modified_by?: string | null;
  account_id: string;
  comments?: string;
}

export interface IUpdateResource {
  resource_id: string;
  account_number: string;
  resource_code: string;
  resource_type: "Full-Time" | "Sub Con" | "Non-Labor";
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  org_name?: string | null;
  role?: string | null;
  resource_country?: string | null;
  resource_region?: string | null;
  resource_city?: string | null;
  effective_from_date?: string | null;
  effective_end_date?: string | null;
  resource_designation?: string | null;
  total_years_experience?: number | null;
  total_years_in_org?: number | null;
  resource_status?: "Active" | "Inactive";
  modified_by ?: string | null;
  comments?: string;
}
export interface IResourceCost {
  eid: string;
  account_rid: string;
  resource_type: string;
  resource_rid: string;
  resource_code: string;
  effective_date?: string | null;
  end_date?: string | null;
  currency_rid?: string;
  // cost_frequency: string;
  // cost: number;
  annual_cost?: number | "";
  // semi_annual_cost?: number | "";
  monthly_cost?: number | "";
  weekly_cost?: number | "";
  bi_weekly_cost?: number | "";
  daily_cost?: number | "";
  hourly_cost?: number | "";
  effort_in_hrs?: number | "";
  fiscal_year: number;
  created_datetime?: string | null;
  modified_datetime?: string | null;
  comments?: string;
  created_by?: string | null;
  modified_by?: string | null;
  status?: "active" | "inactive";
  accountNumber: string;
  resource_number: string;
}

export interface IUpdateResourceCost {
  rid: string,
  eid: string;
  effective_date?: string | null;
  end_date?: string | null;
  currency_rid?: string;
  fiscal_year: number;
  // cost_frequency: string;
  // cost: number;
  annual_cost?: number | "";
  // semi_annual_cost?: number | "";
  monthly_cost?: number | "";
  weekly_cost?: number | "";
  bi_weekly_cost?: number | "";
  daily_cost?: number | "";
  hourly_cost?: number | "";
  effort_in_hrs?: number | "";
  comments?: string;
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
   resource_code: string,
   effective_from?: string | null;
   skill_description?: string;
   skill_level?: string;
   skill_type_rid: string;
   skill_subtype_rid: string;
   skill_type_others: string;
   skill_subtype_others: string;
   skill_details?: string;
   comments?: string;
   status?: string;
   created_by?: string | null;
   modified_by?: string | null;
   accountNumber: string;
   resource_number: string;
}

export interface IUpdateResourceSkill {
  rid: string;
  eid?: string;
  effective_from?: string | null;
  skill_description?: string;
  skill_level?: string;
  status?: string;
  modified_by?: string | null;
  skill_type_rid: string;
  skill_subtype_rid: string;
  skill_type_others: string;
  skill_subtype_others: string;
  comments?: string;
  skill_details?: string;
  accountNumber: string;
}

export interface ICreateProject {
  account_number: string;
  account_id: string;
  project_code: string;
  program_name?: string | null;
  project_name?: string | null;
  industry_rid: string;
  industry_name?: string;
  client_organization: string;
  project_startdate?: Date | null;
  project_enddate?: Date | null;
  project_type: "Fixed" | "Time & Material";
  project_classification_rid?: string | null;
  project_classification_other?: string | null;
  project_client_group?: string | null;
  project_group?: string | null;
  project_summary?: string | null;
  project_status: "Active" | "Inactive";
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
  total_effort?: string | null;
  total_cost?: string | null;
  total_fte?: number | null;
  total_sub_con?: number | null;
  total_non_labor_cost?: string | null;
  total_fte_effort?: string | null;
  total_sub_con_effort?: string | null;
  total_fte_cost?: string | null;
  total_sub_con_cost?: string | null;
  last_rd_ai_assess_on?: Date | null;
  last_rd_ai_assess_by?: string | null;
  auto_send_ai_interaction: boolean;
  auto_access_rd?: boolean;
  max_ai_interaction: number;
  blended_rate_fte?: string | null;
  blended_rate_sub_con?: number | null;
  project_description?: string | null;
  modified_by?: string;
  created_by: string;
  key_contacts: any;
  comments?: string;
}

export interface IUpdateProject {
  project_id: string;
  account_number: string;
  account_id: string;
  project_code: string;
  project_name?: string | null;
  industry_rid: string;
  industry_name: string;
  program_name?: string | null;
  client_organization: string;
  project_startdate?: Date | null;
  project_enddate?: Date | null;
  project_type: "Fixed" | "Time & Material";
  project_classification_rid?: string | null;
  project_classification_other?: string | null;
  project_client_group?: string | null;
  project_group?: string | null;
  project_summary?: string | null;
  project_status: "Active" | "Inactive";
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
  total_effort?: string | null;
  total_cost?: string | null;
  total_fte?: number | null;
  total_sub_con?: number | null;
  total_non_labor_cost?: string | null;
  total_fte_effort?: string | null;
  total_sub_con_effort?: string | null;
  total_fte_cost?: string | null;
  total_sub_con_cost?: string | null;
  last_rd_ai_assess_on?: Date | null;
  last_rd_ai_assess_by?: string | null;
  auto_send_ai_interaction: boolean;
  auto_access_rd?: boolean;
  max_ai_interaction: number;
  blended_rate_fte?: string | null;
  blended_rate_sub_con?: number | null;
  project_description?: string | null;
  modified_by?: string;
  created_by: string;
  key_contacts:any;
  comments?: string;
}

export interface IKeyContactDetail {
  key_contact_rid: string;
  key_contact_name: string;
  key_contact_email: string;
  key_contact_role: string;
  is_primary_contact: boolean;
  include_in_communication: boolean;
  status: "active" | "inactive";
}

export interface IUpdateKeyContactDetail {
  rid: string;
  key_contact_name: string;
  key_contact_email: string;
  key_contact_role: string;
  is_primary_contact: boolean;
  include_in_communication: boolean;
  status: "active" | "inactive";
}