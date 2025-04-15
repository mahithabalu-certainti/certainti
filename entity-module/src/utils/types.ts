export interface ICreateResource {
  account_number: string;
  resource_ref_id: string;
  resource_type: "FullTime" | "Contract";
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  org_name?: string | null;
  role?: string | null;
  fiscal_year: number;
  email?: string | null;
  mobile?: string | null;
  country?: string | null;
  region?: string | null;
  currency?: string | null;
  effective_from_date?: Date | null;
  effective_end_date?: Date | null;
  designation?: string | null;
  manager_name?: string | null;
  total_years_experience?: number | null;
  total_years_in_org?: number | null;
  cost?: number;
  cost_frequencty?:
    | "Annual"
    | "Semi-Annual"
    | "Monthly"
    | "Bi-Weekly"
    | "Weekly"
    | "Daily"
    | "Hourly"
    | null;
  resource_status?: "Active" | "Inactive";
  created_by: string;
  modified_by?: string | null;
  account_id: string;
}

export interface IUpdateResource {
  resource_id: string;
  account_number: string;
  resource_ref_id: string;
  resource_type: "FullTime" | "Contract";
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  org_name?: string | null;
  role?: string | null;
  fiscal_year: number;
  email?: string | null;
  mobile?: string | null;
  country?: string | null;
  region?: string | null;
  currency?: string | null;
  effective_from_date?: string | null;
  effective_end_date?: string | null;
  designation?: string | null;
  manager_name?: string | null;
  total_years_experience?: number | null;
  total_years_in_org?: number | null;
  cost?: number;
  cost_frequency?:
    | "Annual"
    | "Semi-Annual"
    | "Monthly"
    | "Bi-Weekly"
    | "Weekly"
    | "Daily"
    | "Hourly"
    | null;
  resource_status?: "Active" | "Inactive";
  modified_by: string;
  description?: string | null;
}
export interface IResourceCost {
  eid: string;
  account_rid: string;
  resource_type: string;
  resource_rid: string;
  resource_ref_id: string;
  effective_date: Date;
  end_date: Date;
  currency_rid: string;
  annual_cost: number;
  monthly_cost: number;
  weekly_cost: number;
  daily_cost: number;
  hourly_cost: number;
  bi_weekly_cost: number;
  semi_annual_cost: number;
  created_datetime?: string | null;
  modified_datetime?: string | null;
  created_by?: string | null;
  modified_by?: string | null;
  status?: "active" | "inactive";
  accountNumber: string;
  fiscal_year?: string;
}

export interface IUpdateResourceCost {
  rid: string,
  eid: string;
  effective_date: Date;
  end_date: Date;
  currency_rid: string;
  annual_cost: number;
  monthly_cost: number;
  weekly_cost: number;
  daily_cost: number;
  hourly_cost: number;
  bi_weekly_cost: number;
  semi_annual_cost: number;
  modified_datetime?: string | null;
  modified_by?: string | null;
  status?: "active" | "inactive";
  accountNumber: string;
}

export interface IResourceSkill {
   eid: string;
   account_rid: string;
   resource_type: string;
   resource_rid: string;
   resource_ref_id: string,
   resource_desc: string;
   skill_rid: string;
   start_date: Date;
   skill_description?: string;
   skill_level: string;
   status?: string;
   years_of_experience: number,
   fiscal_year: number,
   created_by?: string;
   modified_by?: string;
   skill_type: string;
   skill_name: string;
   technical_weightage: number;
   accountNumber: string;
}

export interface IUpdateResourceSkill {
  rid: string;
  eid: string;
  start_date: Date;
  skill_description?: string;
  skill_level: string;
  status?: string;
  years_of_experience: number,
  modified_by?: string;
  skill_rid: string;
  skill_name: string;
  skill_type: string;
  technical_weightage: number;
  accountNumber: string;
}