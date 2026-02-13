import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  DashboardCountDetail,
  DashboardMeetingDetail,
  DashboardTaskDetail,
  GlobalLevelChartData,
  HealthStatusDetail,
  OverallProjectValueDetail,
  OverdueApprovalsDetail,
  WeeklyProductivityDetail,
  PendingFollowUpDetail,
  DashboardCountDetailsResponse,
  HealthStatusResponse,
  OverallProjectValueResponse,
  GlobalLevelChartResponse,
  WeeklyProductivityResponse,
  OverdueApprovalsResponse,
  UpcomingTasksResponse,
  DueTodayOverdueTasksResponse,
  OpenTasksResponse,
  CompletedTasksThisWeekResponse,
  DashboardMeetingListResponse,
  PendingFollowUpListResponse,
  ExportReportType,
} from '../../types/dashboard';
import { reportServiceApi } from '../../../api/api';
import {
  getCasesByHealthStatusURL,
  getCompletedTasksThisWeekListURL,
  getDashboardCountDetailsURL,
  getDueTodayOverdueTasksListURL,
  getGlobalLevelChartURL,
  getMeetingListURL,
  getOpenTasksListURL,
  getOverallProjectValueURL,
  getOverdueApprovalsListURL,
  getPendingFollowUpsURL,
  getUpcomingTasksListURL,
  getWeeklyProductivityListURL,
} from '../urls';

export const fetchDashboardCountDetails = async (
  flag: string
): Promise<DashboardCountDetail[]> => {
  try {
    const response = await reportServiceApi.get<DashboardCountDetailsResponse>(
      getDashboardCountDetailsURL(flag)
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching dashboard count details:', error);
    throw error;
  }
};

export const useGetDashboardCountDetails = (
  flag: string = 'all',
  isEnable: boolean = true
): UseQueryResult<DashboardCountDetail[], Error> => {
  return useQuery<DashboardCountDetail[], Error>({
    queryKey: ['dashboard-count-details', flag],
    queryFn: () => fetchDashboardCountDetails(flag),
    retry: 0,
    enabled: isEnable && !!flag,
  });
};

export const fetchCasesByHealthStatus = async (
  flag: string,
  fiscalYear?: number
): Promise<HealthStatusDetail[]> => {
  try {
    const response = await reportServiceApi.get<HealthStatusResponse>(
      getCasesByHealthStatusURL(flag, fiscalYear)
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching cases by health status:', error);
    throw error;
  }
};

export const useGetCasesByHealthStatus = (
  flag: string = 'all',
  fiscalYear?: number,
  isEnable: boolean = true
): UseQueryResult<HealthStatusDetail[], Error> => {
  return useQuery<HealthStatusDetail[], Error>({
    queryKey: ['cases-by-health-status', flag, fiscalYear],
    queryFn: () => fetchCasesByHealthStatus(flag, fiscalYear),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchOverallProjectValue = async (
  flag: string,
  fiscalYear?: number
): Promise<OverallProjectValueDetail[]> => {
  try {
    const response = await reportServiceApi.get<OverallProjectValueResponse>(
      getOverallProjectValueURL(flag, fiscalYear)
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching overall project value:', error);
    throw error;
  }
};

export const useGetOverallProjectValue = (
  flag: string = 'all',
  fiscalYear?: number,
  isEnable: boolean = true
): UseQueryResult<OverallProjectValueDetail[], Error> => {
  return useQuery<OverallProjectValueDetail[], Error>({
    queryKey: ['overall-project-value', flag, fiscalYear],
    queryFn: () => fetchOverallProjectValue(flag, fiscalYear),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchGlobalLevelChart = async (
  flag: string,
  fiscalYear?: number,
  countryRid?: string
): Promise<GlobalLevelChartData> => {
  try {
    const response = await reportServiceApi.get<GlobalLevelChartResponse>(
      getGlobalLevelChartURL(flag, fiscalYear, countryRid)
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching global level chart:', error);
    throw error;
  }
};

export const useGetGlobalLevelChart = (
  flag: string = 'all',
  fiscalYear?: number,
  countryRid?: string,
  isEnable: boolean = true
): UseQueryResult<GlobalLevelChartData, Error> => {
  return useQuery<GlobalLevelChartData, Error>({
    queryKey: ['global-level-chart', flag, fiscalYear, countryRid],
    queryFn: () => fetchGlobalLevelChart(flag, fiscalYear, countryRid),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchWeeklyProductivity = async (
  flag: string
): Promise<WeeklyProductivityDetail[]> => {
  try {
    const response = await reportServiceApi.get<WeeklyProductivityResponse>(
      getWeeklyProductivityListURL(flag)
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching weekly productivity:', error);
    throw error;
  }
};

export const useGetWeeklyProductivity = (
  flag: string = 'all',
  isEnable: boolean = true
): UseQueryResult<WeeklyProductivityDetail[], Error> => {
  return useQuery<WeeklyProductivityDetail[], Error>({
    queryKey: ['weekly-productivity', flag],
    queryFn: () => fetchWeeklyProductivity(flag),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchOverdueApprovals = async (
  flag: string
): Promise<OverdueApprovalsDetail[]> => {
  try {
    const response = await reportServiceApi.get<OverdueApprovalsResponse>(
      getOverdueApprovalsListURL(flag)
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching overdue approvals:', error);
    throw error;
  }
};

export const useGetOverdueApprovals = (
  flag: string = 'all',
  isEnable: boolean = true
): UseQueryResult<OverdueApprovalsDetail[], Error> => {
  return useQuery<OverdueApprovalsDetail[], Error>({
    queryKey: ['overdue-approvals', flag],
    queryFn: () => fetchOverdueApprovals(flag),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchUpcomingTasks = async (
  flag: string
): Promise<DashboardTaskDetail[]> => {
  try {
    const response = await reportServiceApi.get<UpcomingTasksResponse>(
      getUpcomingTasksListURL(flag)
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching upcoming tasks:', error);
    throw error;
  }
};

export const useGetUpcomingTasks = (
  flag: string = 'all',
  isEnable: boolean = true
): UseQueryResult<DashboardTaskDetail[], Error> => {
  return useQuery<DashboardTaskDetail[], Error>({
    queryKey: ['upcoming-tasks', flag],
    queryFn: () => fetchUpcomingTasks(flag),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchDueTodayOverdueTasks = async (
  flag: string
): Promise<DashboardTaskDetail[]> => {
  try {
    const response = await reportServiceApi.get<DueTodayOverdueTasksResponse>(
      getDueTodayOverdueTasksListURL(flag)
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching due today/overdue tasks:', error);
    throw error;
  }
};

export const useGetDueTodayOverdueTasks = (
  flag: string = 'all',
  isEnable: boolean = true
): UseQueryResult<DashboardTaskDetail[], Error> => {
  return useQuery<DashboardTaskDetail[], Error>({
    queryKey: ['due-today-overdue-tasks', flag],
    queryFn: () => fetchDueTodayOverdueTasks(flag),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchOpenTasks = async (
  flag: string
): Promise<DashboardTaskDetail[]> => {
  try {
    const response = await reportServiceApi.get<OpenTasksResponse>(
      getOpenTasksListURL(flag)
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching open tasks:', error);
    throw error;
  }
};

export const useGetOpenTasks = (
  flag: string = 'all',
  isEnable: boolean = true
): UseQueryResult<DashboardTaskDetail[], Error> => {
  return useQuery<DashboardTaskDetail[], Error>({
    queryKey: ['open-tasks', flag],
    queryFn: () => fetchOpenTasks(flag),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchCompletedTasksThisWeek = async (
  flag: string
): Promise<DashboardTaskDetail[]> => {
  try {
    const response = await reportServiceApi.get<CompletedTasksThisWeekResponse>(
      getCompletedTasksThisWeekListURL(flag)
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching completed tasks this week:', error);
    throw error;
  }
};

export const useGetCompletedTasksThisWeek = (
  flag: string = 'all',
  isEnable: boolean = true
): UseQueryResult<DashboardTaskDetail[], Error> => {
  return useQuery<DashboardTaskDetail[], Error>({
    queryKey: ['completed-tasks-this-week', flag],
    queryFn: () => fetchCompletedTasksThisWeek(flag),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchMeetingList = async (
  flag: string
): Promise<DashboardMeetingDetail[]> => {
  try {
    const response = await reportServiceApi.get<DashboardMeetingListResponse>(
      getMeetingListURL(flag)
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching meeting list:', error);
    throw error;
  }
};

export const useGetMeetingList = (
  flag: string = 'all',
  isEnable: boolean = true
): UseQueryResult<DashboardMeetingDetail[], Error> => {
  return useQuery<DashboardMeetingDetail[], Error>({
    queryKey: ['meeting-list', flag],
    queryFn: () => fetchMeetingList(flag),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchPendingFollowUps = async (
  flag: string
): Promise<PendingFollowUpDetail[]> => {
  try {
    const response = await reportServiceApi.get<PendingFollowUpListResponse>(
      getPendingFollowUpsURL(flag)
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching pending follow ups:', error);
    throw error;
  }
};

export const useGetPendingFollowUps = (
  flag: string = 'all',
  isEnable: boolean = true
): UseQueryResult<PendingFollowUpDetail[], Error> => {
  return useQuery<PendingFollowUpDetail[], Error>({
    queryKey: ['pending-follow-ups', flag],
    queryFn: () => fetchPendingFollowUps(flag),
    retry: 0,
    enabled: isEnable,
  });
};

export const ExportDashboardReport = async (
  type: ExportReportType,
  flag: string = 'all'
) => {
  const getFilename = (type: ExportReportType) => {
    switch (type) {
      case 'dueTodayOverdueTasks':
        return 'due_today_overdue_tasks_report.xlsx';
      case 'openTasks':
        return 'open_tasks_report.xlsx';
      case 'pendingFollowUps':
        return 'pending_followups_report.xlsx';
      case 'completedTasksThisWeek':
        return 'completed_tasks_this_week_report.xlsx';
      case 'upcomingTasks':
        return 'upcoming_tasks_report.xlsx';
      case 'weeklyProductivity':
        return 'weekly_productivity_report.xlsx';
      case 'meetingList':
        return 'meeting_list_report.xlsx';
      case 'overdueApprovals':
        return 'overdue_approvals_report.xlsx';
      default:
        return 'dashboard_report.xlsx';
    }
  };

  try {
    // Construct the URL dynamically as all reports follow the same pattern
    const url = `/api/report/${type}Export?flag=${flag}`;

    const response = await reportServiceApi.get(url);
    const base64Data = response.data?.data;

    if (!base64Data) {
      console.error('No base64 data found in the response.');
      return;
    }

    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = getFilename(type);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};
