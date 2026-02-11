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

export interface GlobalLevelChartDetail {
  account_name: string;
  country_name: string;
  country_code: string;
  total_project_cost: string;
  qualified_project_cost: string;
  qre_cost: string;
  rd_credits_computed: string;
  rd_credits_submitted: string;
  rd_credits_approved: string;
}

export interface GlobalLevelChartResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: GlobalLevelChartDetail[];
}

export interface WeeklyProductivityDetail {
  category: string;
  count: string | number;
  total: string | number;
  unit: string;
}

export interface WeeklyProductivityResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: WeeklyProductivityDetail[];
}

export interface OverdueApprovalsDetail {
  rid: string;
  r_number: string;
  task_name: string;
  status: string;
  effective_start_datetime: string;
  effective_end_datetime: string;
  case_r_number: string;
  case_name: string;
  assigned_to: string;
  priority_name: string;
  fiscal_year: number;
  account_name: string;
  assigned_to_name: string;
  category_name: string;
  profile_url: string | null;
}

export interface OverdueApprovalsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: OverdueApprovalsDetail[];
}

export interface DashboardTaskDetail {
  rid: string;
  r_number: string;
  task_name: string;
  status: string;
  effective_start_datetime: string;
  effective_end_datetime: string;
  case_r_number: string;
  case_name: string;
  assigned_to: string;
  priority_name: string | null;
  fiscal_year: number;
  account_name: string;
  assigned_to_name: string;
  profile_url: string | null;
}

export interface DashboardTaskResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: DashboardTaskDetail[];
}

export type UpcomingTasksResponse = DashboardTaskResponse;
export type DueTodayOverdueTasksResponse = DashboardTaskResponse;
export type OpenTasksResponse = DashboardTaskResponse;
export type CompletedTasksThisWeekResponse = DashboardTaskResponse;
