import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  DashboardCountDetail,
  HealthStatusDetail,
  OverallProjectValueDetail,
} from '../../types/dashboard';
import {
  dashboardCountDetailsMock,
  healthStatusDetailMock,
  overallProjectValueMock,
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
