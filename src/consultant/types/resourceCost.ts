import { CommonApiResponse } from '../../common-service';

export interface ResourceCostListParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filters?: object;
}

export type ResourceCostList = {
  id: string;
  resource_cost_number: string;
  resource_ref_id: string;
  currency: string;
  start_date: string;
  end_date: string;
  annual_compensation: string | null;
  semi_annual_compensation: string | null;
  bi_weekly_compensation: string | null;
  monthly_compensation: string | null;
  weekly_compensation: string | null;
  daily_compensation: string | null;
  hourly_compensation: string | null;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
};

export interface NewCostData {
  costType: string;
  cost: string;
}

export interface ResourceCostApiResponse extends CommonApiResponse {
  data: {
    resourceCost: ResourceCostList[];
    count: number;
  };
}
