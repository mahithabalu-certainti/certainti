import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  DashboardCountDetail,
  DashboardTaskDetail,
  GlobalLevelChartDetail,
  HealthStatusDetail,
  OverallProjectValueDetail,
  OverdueApprovalsDetail,
  WeeklyProductivityDetail,
} from '../../types/dashboard';
import {
  completedTasksThisWeekMock,
  dashboardCountDetailsMock,
  dueTodayOverdueTasksMock,
  globalLevelChartMock,
  healthStatusDetailMock,
  openTasksMock,
  overallProjectValueMock,
  overdueApprovalsMock,
  upcomingTasksMock,
  weeklyProductivityMock,
} from '../../mockdata/dashboard-mock';

export const fetchDashboardCountDetails = async (
  flag: string
): Promise<DashboardCountDetail[]> => {
  try {
    // const response = await reportServiceApi.get<DashboardCountDetailsResponse>(
    //   getDashboardCountDetailsURL(flag)
    // );
    // return response.data.data;
    console.log('dashboard-count', flag);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return dashboardCountDetailsMock.data;
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
    // const response = await reportServiceApi.get<HealthStatusResponse>(
    //   getCasesByHealthStatusURL(flag, fiscalYear)
    // );

    // return response.data.data;
    console.log('case-health-status', flag, fiscalYear);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return healthStatusDetailMock.data;
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
    // const response = await reportServiceApi.get<OverallProjectValueResponse>(
    //   getOverallProjectValueURL(flag, fiscalYear)
    // );
    // return response.data.data;

    console.log('overall-project-value', flag, fiscalYear);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return overallProjectValueMock.data;
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
): Promise<GlobalLevelChartDetail[]> => {
  try {
    // const response = await reportServiceApi.get<GlobalLevelChartResponse>(
    //   getGlobalLevelChartURL(flag, fiscalYear, countryRid)
    // );
    // return response.data.data;
    console.log('global-level-chart', flag, fiscalYear, countryRid);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return globalLevelChartMock.data;
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
): UseQueryResult<GlobalLevelChartDetail[], Error> => {
  return useQuery<GlobalLevelChartDetail[], Error>({
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
    // const response = await reportServiceApi.get<WeeklyProductivityResponse>(
    //   getWeeklyProductivityListURL(flag)
    // );
    // return response.data.data;

    console.log('weekly-productivity', flag);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return weeklyProductivityMock.data;
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
    // const response = await reportServiceApi.get<OverdueApprovalsResponse>(
    //   getOverdueApprovalsListURL(flag)
    // );
    // return response.data.data;
    console.log('overdue-approvals', flag);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return overdueApprovalsMock.data;
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
    // const response = await reportServiceApi.get<UpcomingTasksResponse>(
    //   getUpcomingTasksListURL(flag)
    // );
    // return response.data.data;
    console.log('upcoming-tasks', flag);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return upcomingTasksMock.data;
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
    // const response = await reportServiceApi.get<DueTodayOverdueTasksResponse>(
    //   getDueTodayOverdueTasksListURL(flag)
    // );
    // return response.data.data;
    console.log('due-today-overdue-tasks', flag);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return dueTodayOverdueTasksMock.data;
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
    // const response = await reportServiceApi.get<OpenTasksResponse>(
    //   getOpenTasksListURL(flag)
    // );
    // return response.data.data;
    console.log('open-tasks', flag);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return openTasksMock.data;
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
    // const response = await reportServiceApi.get<CompletedTasksThisWeekResponse>(
    //   getCompletedTasksThisWeekListURL(flag)
    // );
    // return response.data.data;
    console.log('completed-tasks-this-week', flag);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return completedTasksThisWeekMock.data;
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
