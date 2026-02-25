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

// Common payload interface for all dashboard APIs
export interface DashboardPayload {
  flag: string;
  fiscalYear: number;
  globalFilters: unknown;
  countryType?: 'all' | 'active';
  countryRid?: string;
  filingType?: string;
}

export const fetchDashboardCountDetails = async (
  payload: DashboardPayload
): Promise<DashboardCountDetail[]> => {
  try {
    const response = await reportServiceApi.post<DashboardCountDetailsResponse>(
      getDashboardCountDetailsURL(),
      payload
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching dashboard count details:', error);
    throw error;
  }
};

export const useGetDashboardCountDetails = (
  payload: DashboardPayload,
  isEnable: boolean = true
): UseQueryResult<DashboardCountDetail[], Error> => {
  return useQuery<DashboardCountDetail[], Error>({
    queryKey: ['dashboard-count-details', payload],
    queryFn: () => fetchDashboardCountDetails(payload),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchCasesByHealthStatus = async (
  payload: DashboardPayload
): Promise<HealthStatusDetail[]> => {
  try {
    const response = await reportServiceApi.post<HealthStatusResponse>(
      getCasesByHealthStatusURL(),
      payload
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching cases by health status:', error);
    throw error;
  }
};

export const useGetCasesByHealthStatus = (
  payload: DashboardPayload,
  isEnable: boolean = true
): UseQueryResult<HealthStatusDetail[], Error> => {
  return useQuery<HealthStatusDetail[], Error>({
    queryKey: ['cases-by-health-status', payload],
    queryFn: () => fetchCasesByHealthStatus(payload),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchOverallProjectValue = async (
  payload: DashboardPayload
): Promise<OverallProjectValueDetail[]> => {
  try {
    const response = await reportServiceApi.post<OverallProjectValueResponse>(
      getOverallProjectValueURL(),
      payload
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching overall project value:', error);
    throw error;
  }
};

export const useGetOverallProjectValue = (
  payload: DashboardPayload,
  isEnable: boolean = true
): UseQueryResult<OverallProjectValueDetail[], Error> => {
  return useQuery<OverallProjectValueDetail[], Error>({
    queryKey: ['overall-project-value', payload],
    queryFn: () => fetchOverallProjectValue(payload),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchGlobalLevelChart = async (
  payload: DashboardPayload
): Promise<GlobalLevelChartData> => {
  try {
    const response = await reportServiceApi.post<GlobalLevelChartResponse>(
      getGlobalLevelChartURL(),
      payload
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching global level chart:', error);
    throw error;
  }
};

export const useGetGlobalLevelChart = (
  payload: DashboardPayload,
  isEnable: boolean = true
): UseQueryResult<GlobalLevelChartData, Error> => {
  return useQuery<GlobalLevelChartData, Error>({
    queryKey: ['global-level-chart', payload],
    queryFn: () => fetchGlobalLevelChart(payload),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchWeeklyProductivity = async (
  payload: DashboardPayload
): Promise<WeeklyProductivityDetail[]> => {
  try {
    const response = await reportServiceApi.post<WeeklyProductivityResponse>(
      getWeeklyProductivityListURL(),
      payload
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching weekly productivity:', error);
    throw error;
  }
};

export const useGetWeeklyProductivity = (
  payload: DashboardPayload,
  isEnable: boolean = true
): UseQueryResult<WeeklyProductivityDetail[], Error> => {
  return useQuery<WeeklyProductivityDetail[], Error>({
    queryKey: ['weekly-productivity', payload],
    queryFn: () => fetchWeeklyProductivity(payload),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchOverdueApprovals = async (
  payload: DashboardPayload
): Promise<OverdueApprovalsDetail[]> => {
  try {
    const response = await reportServiceApi.post<OverdueApprovalsResponse>(
      getOverdueApprovalsListURL(),
      payload
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching overdue approvals:', error);
    throw error;
  }
};

export const useGetOverdueApprovals = (
  payload: DashboardPayload,
  isEnable: boolean = true
): UseQueryResult<OverdueApprovalsDetail[], Error> => {
  return useQuery<OverdueApprovalsDetail[], Error>({
    queryKey: ['overdue-approvals', payload],
    queryFn: () => fetchOverdueApprovals(payload),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchUpcomingTasks = async (
  payload: DashboardPayload
): Promise<DashboardTaskDetail[]> => {
  try {
    const response = await reportServiceApi.post<UpcomingTasksResponse>(
      getUpcomingTasksListURL(),
      payload
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching upcoming tasks:', error);
    throw error;
  }
};

export const useGetUpcomingTasks = (
  payload: DashboardPayload,
  isEnable: boolean = true
): UseQueryResult<DashboardTaskDetail[], Error> => {
  return useQuery<DashboardTaskDetail[], Error>({
    queryKey: ['upcoming-tasks', payload],
    queryFn: () => fetchUpcomingTasks(payload),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchDueTodayOverdueTasks = async (
  payload: DashboardPayload
): Promise<DashboardTaskDetail[]> => {
  try {
    const response = await reportServiceApi.post<DueTodayOverdueTasksResponse>(
      getDueTodayOverdueTasksListURL(),
      payload
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching due today/overdue tasks:', error);
    throw error;
  }
};

export const useGetDueTodayOverdueTasks = (
  payload: DashboardPayload,
  isEnable: boolean = true
): UseQueryResult<DashboardTaskDetail[], Error> => {
  return useQuery<DashboardTaskDetail[], Error>({
    queryKey: ['due-today-overdue-tasks', payload],
    queryFn: () => fetchDueTodayOverdueTasks(payload),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchOpenTasks = async (
  payload: DashboardPayload
): Promise<DashboardTaskDetail[]> => {
  try {
    const response = await reportServiceApi.post<OpenTasksResponse>(
      getOpenTasksListURL(),
      payload
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching open tasks:', error);
    throw error;
  }
};

export const useGetOpenTasks = (
  payload: DashboardPayload,
  isEnable: boolean = true
): UseQueryResult<DashboardTaskDetail[], Error> => {
  return useQuery<DashboardTaskDetail[], Error>({
    queryKey: ['open-tasks', payload],
    queryFn: () => fetchOpenTasks(payload),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchCompletedTasksThisWeek = async (
  payload: DashboardPayload
): Promise<DashboardTaskDetail[]> => {
  try {
    const response =
      await reportServiceApi.post<CompletedTasksThisWeekResponse>(
        getCompletedTasksThisWeekListURL(),
        payload
      );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching completed tasks this week:', error);
    throw error;
  }
};

export const useGetCompletedTasksThisWeek = (
  payload: DashboardPayload,
  isEnable: boolean = true
): UseQueryResult<DashboardTaskDetail[], Error> => {
  return useQuery<DashboardTaskDetail[], Error>({
    queryKey: ['completed-tasks-this-week', payload],
    queryFn: () => fetchCompletedTasksThisWeek(payload),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchMeetingList = async (
  payload: Omit<DashboardPayload, 'fiscalYear'>
): Promise<DashboardMeetingDetail[]> => {
  try {
    const response = await reportServiceApi.post<DashboardMeetingListResponse>(
      getMeetingListURL(),
      payload
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching meeting list:', error);
    throw error;
  }
};

export const useGetMeetingList = (
  payload: Omit<DashboardPayload, 'fiscalYear'>,
  isEnable: boolean = true
): UseQueryResult<DashboardMeetingDetail[], Error> => {
  return useQuery<DashboardMeetingDetail[], Error>({
    queryKey: ['meeting-list', payload],
    queryFn: () => fetchMeetingList(payload),
    retry: 0,
    enabled: isEnable,
  });
};

export const fetchPendingFollowUps = async (
  payload: DashboardPayload
): Promise<PendingFollowUpDetail[]> => {
  try {
    const response = await reportServiceApi.post<PendingFollowUpListResponse>(
      getPendingFollowUpsURL(),
      payload
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching pending follow ups:', error);
    throw error;
  }
};

export const useGetPendingFollowUps = (
  payload: DashboardPayload,
  isEnable: boolean = true
): UseQueryResult<PendingFollowUpDetail[], Error> => {
  return useQuery<PendingFollowUpDetail[], Error>({
    queryKey: ['pending-follow-ups', payload],
    queryFn: () => fetchPendingFollowUps(payload),
    retry: 0,
    enabled: isEnable,
  });
};

export const ExportDashboardReport = async (
  type: ExportReportType,
  payload: DashboardPayload | Omit<DashboardPayload, 'fiscalYear'>
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
    const url = `/api/report/${type}Export`;

    const response = await reportServiceApi.post(url, payload);
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
