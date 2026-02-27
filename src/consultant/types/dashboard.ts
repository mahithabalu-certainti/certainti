export interface DashboardCountDetail {
  name: string;
  key: string;
  count: string | number;
  order: number;
  activityCount: number;
}

export interface DashboardCountDetailsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: DashboardCountDetail[];
}

export interface AccountYearData {
  account: string;
  years: { year: number; progress: number; color?: string }[];
}

export interface HealthStatusDetail {
  account_rid: string;
  account_name: string;
  case_completion_percentage: string;
  case_startdate: string;
  fiscal_year: number;
  planned_submission_date: string;
  effective_progress: string;
  colour: string;
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
  total_fte_cost: string;
  total_subcon_cost: string;
  total_nonlabor_cost: string;
}

export interface OverallProjectValueResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: OverallProjectValueDetail[];
}

export interface AccountWiseConsolidation {
  account_rid: string;
  account_name: string;
  country_rid: string;
  country_name: string;
  country_code: string;
  total_project_cost: string;
  qualified_project_cost: string;
  qre_cost: string;
  final_credit_computed: number;
  final_credit_submitted: number;
  final_credit_approved: number;
}

export interface CountryWiseConsolidation {
  country_rid: string;
  country_name: string;
  country_code: string;
  approved: number;
}

export interface GlobalLevelChartData {
  accountWiseConsolidationList: AccountWiseConsolidation[];
  countryWiseConsolidation: CountryWiseConsolidation[];
}

export interface GlobalLevelChartResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: GlobalLevelChartData;
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
  task_type_name: string;
  attach_to: string;
  attachment_level: string;
  attached_to: string;
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
  task_type_name: string;
  attach_to: string;
  attachment_level: string;
  attached_to: string;
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

export interface DashboardMeetingDetail {
  rid: string;
  r_number: string;
  created_by: string;
  modified_by: string | null;
  created_datetime: string;
  modified_datetime: string | null;
  activity_rid: string;
  account_rid: string;
  attach_to: string;
  attachment_level: string;
  status_rid: string;
  effective_start_datetime: string;
  effective_end_datetime: string;
  subject: string;
  meeting_participants: {
    email: string;
    name: string;
  }[];
  meeting_invite: string;
  meeting_id: string;
  minutes_of_meeting: string | null;
  recurrence_days: string[];
  recurrence_interval: number;
  recurrence_type: string;
  time_zone: string;
  effective_start_time: string;
  effective_end_time: string;
  invited_by: {
    email: string;
    name: string;
  };
  recurrence_day_of_month: number | null;
  recurrence_monthly_index: number | null;
  status_name: string;
  priority_name?: string | null;
  attached_to: string;
}

export interface DashboardMeetingListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: DashboardMeetingDetail[];
}

export interface PendingFollowUpDetail {
  rid: string;
  r_number: string;
  task_name: string;
  status_rid: string;
  status_name: string;
  account_rid: string;
  attach_to: string;
  attachment_level: string;
  task_rid: string;
  task_type_name: string;
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
  attached_to: string;
}

export interface PendingFollowUpListResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: PendingFollowUpDetail[];
}

// Account Fiscal Cost
export interface AccountFiscalCostDetail {
  account_rid: string;
  fiscal_year: number;
  total_project_cost: string;
  qre_cost: string | null;
}

export interface AccountFiscalCostResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: AccountFiscalCostDetail[];
}

// Export type
export type ExportReportType =
  | 'dueTodayOverdueTasks'
  | 'openTasks'
  | 'pendingFollowUps'
  | 'completedTasksThisWeek'
  | 'upcomingTasks'
  | 'weeklyProductivity'
  | 'meetingList'
  | 'overdueApprovals';
