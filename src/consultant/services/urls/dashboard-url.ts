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
  fiscalYear?: number
): string => {
  const url = `/api/report/overallProjectValue?flag=${flag}`;
  return fiscalYear ? `${url}&fiscalYear=${fiscalYear}` : url;
};
