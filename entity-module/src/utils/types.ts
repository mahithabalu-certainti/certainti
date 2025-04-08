export interface IResourceCost {
  resource_cost_number: string;
  resource_ref_id: string;
  resource_currency: string;
  resource_start_date: Date;
  resource_end_date: Date;
  resource_annual_compensation?: number | null;
  resource_monthly_compensation?: number | null;
  resource_weekly_compensation?: number | null;
  resource_daily_compensation?: number | null;
  resource_hourly_compensation?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  status: "Active" | "InActive";
}

export interface IUpdateResourceCost {
  id: string;
  resource_cost_number: string;
  resource_currency: string;
  resource_start_date: Date;
  resource_end_date: Date;
  resource_annual_compensation?: number | null;
  resource_monthly_compensation?: number | null;
  resource_weekly_compensation?: number | null;
  resource_daily_compensation?: number | null;
  resource_hourly_compensation?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  status: string;
}
