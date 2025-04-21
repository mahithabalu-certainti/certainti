import { CommonApiResponse } from '../../common-service';

export interface ResourceCostListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  accountNumber?: string;
  fiscalYear?: string | number;
  id?:string
}

export type ResourceCostList = {
  id?: string;
  rid?: string;
  status?: string;
  created_datetime?: string;
  modified_datetime?: string;
  resource_fullname?:string,
  eid?: string;
  account_rid?: string;
  resource_type?: string;
  resource_rid?: string;
  resource_ref_id?: string;
  effective_date?: string;
  end_date?: string;
  annual_cost?: string | null;
  semi_annual_cost?: string | null;
  monthly_cost?: string | null;
  weekly_cost?: string | null;
  bi_weekly_cost?: string | null;
  daily_cost?: string | null;
  hourly_cost?: string | null;
  currency_rid?: string;
  fiscal_year?: string;
  currency_code?: string;
  resource_cost_number?:string,
  r_number?: string;
  created_by?: string | null;
  modified_by?: string | null;
};

export interface NewCostData {
  annual_cost: string | null;
  semi_annual_cost: string | null;
  bi_weekly_cost: string | null;
  monthly_cost: string | null;
  weekly_cost: string | null;
  daily_cost: string | null;
  hourly_cost: string | null;
}

export interface ResourceCostApiResponse extends CommonApiResponse {
  data: {
    resourceCost: ResourceCostList[];
    count: number;
  };
}

export type ResourceCostSkillFormData = {
  accountNumber?:string,
  account_rid?:string,
  rid?: string;
  cost_rid?:string,
  skill_rid?:string,
  resource_ref_id?: string;
  resource_rid?: string;
  resource_full_name?: string;
  resource_type?: string;
  resource_org_name?: string;
  resource_first_name?: string;
  resource_status?: string;
  resource_middle_name?: string;
  status?: string;
  resource_last_name?: string;
  resource_email?: string;
  resource_mobile?: string;
  country?: string;
  region?: string;
  currency?: string;
  financial_start_date?: string;
  financial_end_date?: string;
  annual?: string;
  semi_annual?: string;
  monthly?: string;
  bi_weekly?: string;
  weekly?: string;
  daily?: string;
  hourly?: string;
  resource_effective_from?: string;
  resource_end_date?: string;
  designation?: string;
  manager_name?: string;
  total_years_of_experience?: string;
  total_years_in_the_organisation?: string;
  description?: string;
  skill_level?: string;
  skill_name?: string;
  skill_start_date?: string;
  years_of_experience?: string;
  resource_desc?:string
};

export type ResourceCostPayload = {
  eid?: string;
  rid?: string;
  account_rid?: string;
  resource_type?: string;
  resource_rid: string;
  resource_ref_id: string;
  effective_date?: string;
  end_date?: string;
  annual_cost?: number | null;
  semi_annual_cost?: number | null;
  monthly_cost?: number | null;
  weekly_cost?: number | null;
  bi_weekly_cost?: number | null;
  daily_cost?: number | null;
  hourly_cost?: number | null;
  fiscal_year?: string;
  currency_rid?: string;
  accountNumber?: string;
  status?: string;
};
