import { CommonApiResponse } from '../../common-service';

export interface ResourceCostListParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
  accountNumber?: string;
  fiscalYear?: number;
}

export type ResourceCostList = {
  id?: string;
  rid?: string;
  status?: string;
  created_datetime?: string;
  modified_datetime?: string;
  eid?: string;
  account_rid?: string;
  resource_type?: 'Full-time';
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
  currency?:string,
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
