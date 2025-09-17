export interface ICreateResource {
  account_number: string;
  resource_code: string;
  resource_type_rid: string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  org_name?: string | null;
  role?: string | null;
  country_rid?: string | null;
  region_rid?: string | null;
  city_rid?: string | null;
  effective_from_date?: Date | null;
  effective_end_date?: Date | null;
  resource_designation?: string | null;
  total_years_experience?: number | null;
  total_years_in_org?: number | null;
  status_rid?: string | null;
  created_by?: string | null;
  modified_by?: string | null;
  account_id: string;
  comments?: string;
}

export interface IUpdateResource {
  resource_id: string;
  account_number: string;
  resource_code: string;
  resource_type_rid: string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  org_name?: string | null;
  role?: string | null;
  country_rid?: string | null;
  region_rid?: string | null;
  city_rid?: string | null;
  effective_from_date?: string | null;
  effective_end_date?: string | null;
  resource_designation?: string | null;
  total_years_experience?: number | null;
  total_years_in_org?: number | null;
  status_rid?: string;
  modified_by ?: string | null;
  comments?: string;
}
export interface IResourceCost {
  eid: string;
  account_rid: string;
  resource_type_rid: string;
  resource_rid: string;
  resource_code: string;
  effective_from?: string | null;
  end_date?: string | null;
  currency_rid?: string;
  // cost_frequency: string;
  // cost: number;
  // annual_cost?: number | "";
  // semi_annual_cost?: number | "";
  // monthly_cost?: number | "";
  // weekly_cost?: number | "";
  // bi_weekly_cost?: number | "";
  // daily_cost?: number | "";
  // hourly_cost?: number | "";
  effort_in_hrs?: number | "";
  salary?: number | "";
  bonus?: number | "";
  insurance?: number | "";
  deductions?: number | "";
  net_resource_cost: number;
  resource_cost?: number | "";
  fiscal_year: number;
  created_datetime?: string | null;
  modified_datetime?: string | null;
  comments?: string;
  created_by?: string | null;
  modified_by?: string | null;
  status_rid?: string; //"Active" | "Inactive" | "Duplicate" | "Anomaly";
  accountNumber: string;
  resource_number: string;
  user_preference?: string | null;
}

export interface IUpdateResourceCost {
  rid: string,
  eid: string;
  resource_rid: string;
  effective_from?: string | null;
  end_date?: string | null;
  currency_rid?: string;
  fiscal_year: number;
  // cost_frequency: string;
  // cost: number;
  // annual_cost?: number | "";
  // semi_annual_cost?: number | "";
  // monthly_cost?: number | "";
  // weekly_cost?: number | "";
  // bi_weekly_cost?: number | "";
  // daily_cost?: number | "";
  // hourly_cost?: number | "";
  effort_in_hrs?: number | "";
  salary?: number | "";
  bonus?: number | "";
  insurance?: number | "";
  deductions?: number | "";
  net_resource_cost: number;
  resource_cost?: number | "";
  comments?: string;
  modified_datetime?: string | null;
  modified_by?: string | null;
  status_rid?: string;
 // status_id?: "Active" | "Inactive"| "Duplicate" | "Anomaly";
  accountNumber: string;
  user_preference?: string | null;
}

export interface IResourceSkill {
   eid?: string;
   account_rid: string;
   resource_type_rid: string;
   resource_rid: string;
   resource_code: string,
   effective_from?: string | null;
   skill_description?: string;
   skill_level_rid?: string;
   skill_type_rid: string;
   skill_subtype_rid: string;
   skill_type_others: string;
   skill_subtype_others: string;
   skill_details?: string;
   comments?: string;
   status_rid?: string;
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
  skill_level_rid?: string;
  status_rid?: string;
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
  project_type_rid: string;
  project_classification_rid?: string | null;
  project_classification_other?: string | null;
  project_client_group?: string | null;
  project_group?: string | null;
  project_summary?: string | null;
  status_rid: string;
  fiscal_year: number;
  country_rid?: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;
  project_manager: string;
  project_lead: string;
  spoc_name: string;
  spoc_email?: string | null;
  spoc_mobile?: string | null;
  project_tpc_name?: string | null;
  project_tpc_email?: string | null;
  project_tpc_mobile?: string | null;
  project_cc_list?: string | null;
  total_effort?: number | null;
  total_cost?: number | null;
  total_fte?: number;
  total_subcon?: number;
  total_cost_nonlabor?: number | null;
  total_effort_fte?: number | null;
  total_effort_subcon?: number | null;
  total_cost_fte?: number | null;
  total_cost_subcon?: number | null;
  last_rd_ai_assess_on?: Date | null;
  last_rd_ai_assess_by?: string | null;
  auto_send_ai_interaction: boolean;
  auto_access_rd?: boolean;
  max_ai_interaction: number;
  blended_rate_fte?: number | null;
  blended_rate_subcon?: number | null;
  project_description?: string | null;
  modified_by?: string;
  created_by: string;
  key_contacts: any;
  comments?: string;
  assessment_status?: string;
  is_rd_qualified?: boolean;
  qre?: number;
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
  project_type_rid: string;
  project_classification_rid?: string | null;
  project_classification_other?: string | null;
  project_client_group?: string | null;
  project_group?: string | null;
  project_summary?: string | null;
  status_rid: string;
  fiscal_year: number;
  country_rid?: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;
  project_manager: string;
  project_lead: string;
  spoc_name: string;
  spoc_email?: string | null;
  spoc_mobile?: string | null;
  project_tpc_name?: string | null;
  project_tpc_email?: string | null;
  project_tpc_mobile?: string | null;
  project_cc_list?: string | null;
  total_effort?: number | null;
  total_cost?: number | null;
  total_fte?: number;
  total_subcon?: number;
  total_cost_nonlabor?: number | null;
  total_effort_fte?: number | null;
  total_effort_subcon?: number | null;
  total_cost_fte?: number | null;
  total_cost_subcon?: number | null;
  last_rd_ai_assess_on?: Date | null;
  last_rd_ai_assess_by?: string | null;
  auto_send_ai_interaction: boolean;
  auto_access_rd?: boolean;
  max_ai_interaction: number;
  blended_rate_fte?: number | null;
  blended_rate_subcon?: number | null;
  project_description?: string | null;
  modified_by?: string;
  created_by: string;
  key_contacts:any;
  comments?: string;
  project_fiscal_id: string;
}

export interface IKeyContactDetail {
  key_contact_rid: string;
  key_contact_name: string;
  key_contact_email: string;
  key_contact_role: string;
  is_primary_contact: boolean;
  include_in_communication: boolean;
  interaction_cc_recipient:boolean;
  status_rid: string;
}

export interface IUpdateKeyContactDetail {
  rid: string;
  key_contact_name: string;
  key_contact_email: string;
  key_contact_role: string;
  is_primary_contact: boolean;
  include_in_communication: boolean;
  interaction_cc_recipient:boolean;
  status_rid: string;
}

export interface ICreateAttachment {
  browse_file: string,
  account_rid: string,
  document_name: string,
  attach_to: string,
  attachment_level: string,
  fiscal_year: number,
  format: string,
  size_in_mb: number,
  document_type_rid: string,
  document_category_rid: string,
  document_category_others: string,
  document_type_others: string,
  comments: string,
}


export interface ICreateProjectResource {
  project_fiscal_rid: string;
  account_rid: string;
  resource_id: string;
  project_code: string;
  resource_code: string;
  project_resource_role?: string | null | undefined;
  user_preference?: string;
  manager_name?: string;
  manager_ref_id?: string;
  assigned_skill_role_type_rid: string | null;
  skill_role_rid: string | null;
  skill_role_others: string | null;
  status_rid?: string | null;
  total_hours_pro_res?: number;
  total_cost_pro_res?: number;
  fiscal_year: number;
  country_rid: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  effort_project_resource_level?: number | null;
  cost_project_resource_level?: number | null;
  salary?: number | null;
  bonus?: number | null;
  deductions?: number | null;
  insurance?: number | null;
  description?: string | null;
  created_by: string;
  modified_by?: string;
  total_hours_from_tasks? : number | null,
  total_cost_from_tasks? : number | null,
}
export interface IUpdateProjectResource {
  project_resource_rid: string;
  project_fiscal_rid: string;
  account_rid: string;
  resource_id: string;
  resource_code: string;
  project_resource_role?: string;
  manager_name?: string;
  manager_ref_id?: string;
  assigned_skill_role_type_rid: string | null;
  skill_role_rid: string | null;
  skill_role_others: string | null;
  status_rid?: string | null;
  total_hours_pro_res?: number;
  total_cost_pro_res?: number;
  fiscal_year: number;
  country_rid?: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  effort_project_resource_level?: number | null;
  cost_project_resource_level?: number | null;
  salary?: number | null;
  bonus?: number | null;
  deductions?: number | null;
  insurance?: number | null;
  description?: string | null;
  modified_by?: string;
  user_preference?: string | null;
  total_hours_from_tasks? : number | null,
  total_cost_from_tasks? : number | null,
}

export interface IUpdateInlineProjectResource {
  project_resource_rid: string;
  project_fiscal_rid: string;
  account_rid: string;
  resource_code?: string;
  resource_name?: string;
  resource_type_rid: string;
  resource_role?: string | null;
  total_hours_pro_res?: number;
  total_cost_pro_res?: number;
  region_rid?: string | null;
  description?: string | null;
  modified_by?: string;
  resource_rid?: string;
  country_rid?: string | null;
}

export interface ICreateProjectTask {
  project_fiscal_rid: string;
  account_rid: string;
  resource_id: string;
  resource_code: string;
  total_hours_pro_task?: number;
  total_cost_pro_task?: number;
  fiscal_year: number;
  country_rid: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  comments?: string | null;
  created_by: string;
  modified_by?: string;
  status_rid : string;
  project_resource_rid? : string
}

export interface IUpdateProjectTask {
  project_task_rid: string;
  project_fiscal_rid: string;
  account_rid: string;
  resource_id: string;
  resource_code: string;
  total_hours_pro_task?: number;
  total_cost_pro_task?: number;
  fiscal_year: number;
  country_rid: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  comments?: string | null;
  created_by: string;
  modified_by?: string;
  status_rid : string
  project_resource_rid? : string
}

export interface IAnomalyStatus {
  rid: string,
  accountId: string,
  action: "accept" | "reject",
  resourceCode: string;
  type: string
}