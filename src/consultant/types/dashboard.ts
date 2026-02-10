export interface DashboardCountDetail {
  name: string;
  count: string;
  order: number;
}

export interface DashboardCountDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: DashboardCountDetail[];
}

// Account Chart type
export interface AccountYearData {
  account: string;
  years: { year: number; progress: number }[];
}

export interface HealthStatusDetail {
  account_rid: string;
  account_name: string;
  fiscal_year: number;
  progress: string;
}

export interface HealthStatusResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: HealthStatusDetail[];
}

export interface OverallProjectValueDetail {
  country_rid: string;
  country_code: string;
  country_name: string | null;
  total_project_cost: string;
  qualified_project_cost: string;
  qre_cost: string;
  rd_credits_computed: string;
  rd_credits_submitted: string;
  rd_credits_approved: string;
}

export interface OverallProjectValueResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: OverallProjectValueDetail[];
}
