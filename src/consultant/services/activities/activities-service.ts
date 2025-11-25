import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import {
  ActivityList,
  ActivityListApiResponse,
  ActivityListURLParams,
  EmailActivityDetails,
  EmailActivityDetailsResponse,
  TaskActivityDetails,
  TaskActivityDetailsResponse,
} from '../../types';
import {
  ActivityListURL,
  createActivityEmailURL,
  updateActivityEmailURL,
} from '../urls/activities-url';

export const useApiMutationSericve = <T, V = void>(
  endpoint: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  options?: UseMutationOptions<T, Error, V>
): UseMutationResult<T, Error, V> => {
  return useMutation<T, Error, V>({
    mutationFn: async (data) => {
      const isFormData = data instanceof FormData;

      const response = await caseServiceApi.request<T>({
        url: endpoint,
        method,
        data,
        headers: isFormData
          ? { 'Content-Type': 'multipart/form-data' }
          : { 'Content-Type': 'application/json' },
      });

      return response.data;
    },
    ...options,
  });
};

export const fetchActivityList = async (
  params: ActivityListURLParams
): Promise<{ activities: ActivityList[]; count: number }> => {
  const response = await caseServiceApi.get<ActivityListApiResponse>(
    ActivityListURL(params)
  );
  return {
    activities: response.data.data.activities,
    count: response.data.data.totalCount,
  };
};

export const useActivityList = (
  params: ActivityListURLParams,
  shouldFetchList: boolean,
  refreshActivities?: number
): UseQueryResult<{ activities: ActivityList[]; count: number }, Error> => {
  return useQuery<{ activities: ActivityList[]; count: number }, Error>({
    queryKey: ['activity-list', params, refreshActivities],
    queryFn: () => fetchActivityList(params),
    retry: 0,
    gcTime: 0,
    enabled:
      !!shouldFetchList &&
      !!params.attachmentLevel &&
      !!params.accountRid &&
      !!params.entityId &&
      !!params.activity_type,
  });
};

// Email activity details
const fetchEmailActivityDetails = async (
  entityId: string,
  activityId: string
): Promise<EmailActivityDetails> => {
  const response = await caseServiceApi.get<EmailActivityDetailsResponse>(
    `/api/activities/email/detail/${entityId}/${activityId}`
  );

  return response.data.data;
};

export const useEmailActivityDetails = (
  entityId?: string,
  activityId?: string,
  isEnable?: boolean
): UseQueryResult<EmailActivityDetails | undefined, Error> => {
  return useQuery<EmailActivityDetails | undefined, Error>({
    queryKey: ['email-activity-details', entityId, activityId, isEnable],
    queryFn: () => fetchEmailActivityDetails(entityId!, activityId!),
    retry: 0,
    gcTime: 0,
    enabled: !!activityId && !!entityId && isEnable,
  });
};

// Task activity details
const fetchTaskActivityDetails = async (
  entityId: string,
  activityId: string
): Promise<TaskActivityDetails> => {
  const response = await caseServiceApi.get<TaskActivityDetailsResponse>(
    `/api/activities/task/detail/${entityId}/${activityId}`
  );

  return response.data.data;
};

export const useTaskActivityDetails = (
  entityId?: string,
  activityId?: string,
  isEnable?: boolean
): UseQueryResult<TaskActivityDetails | undefined, Error> => {
  return useQuery<TaskActivityDetails | undefined, Error>({
    queryKey: ['task-activity-details', entityId, activityId, isEnable],
    queryFn: () => fetchTaskActivityDetails(entityId!, activityId!),
    retry: 0,
    gcTime: 0,
    enabled: !!activityId && !!entityId && isEnable,
  });
};

export const useCreateActivityEmail = () => {
  return useApiMutationSericve<unknown, FormData>(
    createActivityEmailURL(),
    'post'
  );
};

export const useUpdateActivityEmail = () => {
  return useApiMutationSericve<unknown, FormData>(
    updateActivityEmailURL(),
    'put'
  );
};
