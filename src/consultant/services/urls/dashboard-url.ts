export const getDashboardCountDetailsURL = (flag: string = 'all'): string => {
  return `/api/report/countDetails?flag=${flag}`;
};

export const getCasesByHealthStatusURL = (
  flag: string = 'all',
  fiscalYear?: number
): string => {
  const url = `/api/report/casesByHealthStatus?flag=${flag}`;
  return fiscalYear ? `${url}&fiscalYear=${fiscalYear}` : url;
};

export const getOverallProjectValueURL = (
  flag: string = 'all',
  countryType: 'all' | 'active',
  fiscalYear?: number
): string => {
  const url = `/api/report/overallProjectValue?flag=${flag}&countryType=${countryType}`;
  return fiscalYear ? `${url}&fiscalYear=${fiscalYear}` : url;
};

export const getGlobalLevelChartURL = (
  flag: string = 'all',
  countryType: 'all' | 'active',
  fiscalYear?: number,
  countryRid?: string
): string => {
  let url = `/api/report/globalLevelChart?flag=${flag}&countryType=${countryType}`;
  if (fiscalYear) url += `&fiscalYear=${fiscalYear}`;
  if (countryRid) url += `&countryRid=${countryRid}`;
  return url;
};

export const getWeeklyProductivityListURL = (flag: string = 'all'): string => {
  return `/api/report/weeklyProductivityList?flag=${flag}`;
};

export const getOverdueApprovalsListURL = (flag: string = 'all'): string => {
  return `/api/report/overdueApprovalsList?flag=${flag}`;
};

export const getUpcomingTasksListURL = (flag: string = 'all'): string => {
  return `/api/report/upcomingTasksList?flag=${flag}`;
};

export const getDueTodayOverdueTasksListURL = (
  flag: string = 'all'
): string => {
  return `/api/report/dueTodayOverdueTasksList?flag=${flag}`;
};

export const getOpenTasksListURL = (flag: string = 'all'): string => {
  return `/api/report/openTasksList?flag=${flag}`;
};

export const getCompletedTasksThisWeekListURL = (
  flag: string = 'all'
): string => {
  return `/api/report/completedTasksThisWeekList?flag=${flag}`;
};

export const getMeetingListURL = (flag: string = 'all'): string => {
  return `/api/report/meetingList?flag=${flag}`;
};

export const getPendingFollowUpsURL = (flag: string = 'all'): string => {
  return `/api/report/pendingFollowUpsList?flag=${flag}`;
};
