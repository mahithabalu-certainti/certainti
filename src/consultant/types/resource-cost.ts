import { CommonApiResponse } from '../../common-service';

export interface ResourceCostListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: object;
  accountNumber?: string;
  fiscalYear?: string | number;
  id?: string;
  resourceRid?: string;
}

export type ResourceCostList = {
  id?: string;
  rid?: string;
  status?: string;
  created_datetime?: string;
  modified_datetime?: string;
  resource_fullname?: string;
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
  cost: string | null;
  cost_frequency?: string | null;
  currency_rid?: string;
  fiscal_year?: string;
  currency?: string;
  currency_code?: string;
  resource_cost_number?: string;
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
  accountNumber?: string;
  account_rid?: string;
  rid?: string;
  cost_rid?: string;
  skill_rid?: string;
  resource_ref_id?: string;
  resource_rid?: string;
  resource_full_name?: string;
  resource_number?: string;
  resource_type?: string;
  resource_code?: string;
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
  cost_frequency?: string;
  cost?: string;
  resource_effective_from?: string;
  resource_end_date?: string;
  designation?: string;
  manager_name?: string;
  total_years_of_experience?: string;
  total_years_in_the_organisation?: string;
  description?: string;
  skill_level?: string;
  skill_details?: string;
  skill_start_date?: string;
  years_of_experience?: string;
  resource_desc?: string;
  skill_type?: string;
  skill_sub_type?: string;
  fiscal_year?: string;
  comments?: string;
  skill_type_others?: string;
  skill_subtype_others?: string;
};

export type ResourceCostPayload = {
  eid?: string;
  rid?: string;
  account_rid?: string;
  resource_type?: string;
  resource_number?: string;
  resource_rid: string;
  resource_ref_id: string;
  resource_code?: string;
  effective_date?: string;
  end_date?: string;
  cost?: string;
  cost_frequency?: string;
  fiscal_year?: string;
  currency_rid?: string | null;
  accountNumber?: string;
  status?: string;
  comments?: string;
};
