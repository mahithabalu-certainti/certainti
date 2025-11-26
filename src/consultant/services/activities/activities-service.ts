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
  MeetingActivityDetails,
  MeetingActivityDetailsResponse,
  TaskActivityDetails,
  TaskActivityDetailsResponse,
} from '../../types';
import {
  ActivityListURL,
  createActivityEmailURL,
  createActivityMeetingURL,
  updateActivityEmailURL,
  updateActivityMeetingURL,
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

// Email activity
const fetchEmailActivityDetails = async (
  entityId: string,
  activityId: string
): Promise<EmailActivityDetails> => {
  const response = await caseServiceApi.get<EmailActivityDetailsResponse>(
    `/api/activities/email/${activityId}/${entityId}`
  );

  return response.data.data.emailActivityDetails;
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

export const useCreateActivityEmail = () => {
  return useApiMutationSericve<unknown, FormData>(
    createActivityEmailURL(),
    'post'
  );
};

export const useUpdateActivityEmail = () => {
  return useApiMutationSericve<unknown, FormData>(
    updateActivityEmailURL(),
    'post'
  );
};

// Task activity
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

// Meeting Activity
export const fetchMeetingActivityDetails = async (
  entityId: string,
  activityId: string
): Promise<MeetingActivityDetails> => {
  const response = await caseServiceApi.get<MeetingActivityDetailsResponse>(
    `/api/activities/meeting/${activityId}/${entityId}`
  );

  return response.data.data.activityDetails;
};

export const useMeetingActivityDetails = (
  entityId?: string,
  activityId?: string,
  isEnable?: boolean
): UseQueryResult<MeetingActivityDetails | undefined, Error> => {
  return useQuery<MeetingActivityDetails | undefined, Error>({
    queryKey: ['meeting-activity-details', entityId, activityId, isEnable],
    queryFn: () => fetchMeetingActivityDetails(entityId!, activityId!),
    retry: 0,
    gcTime: 0,
    enabled: !!activityId && !!entityId && isEnable,
  });
};

export const useCreateActivityMeeting = () => {
  return useApiMutationSericve<unknown, FormData>(
    createActivityMeetingURL(),
    'post'
  );
};

export const useUpdateActivityMeeting = () => {
  return useApiMutationSericve<unknown, FormData>(
    updateActivityMeetingURL(),
    'put'
  );
};

// Create Activity Task
export interface CreateActivityTaskPayload {
  account_rid: string;
  attach_to: string;
  attachment_level: 'account' | 'project' | 'case';
  task_name: string;
  description?: string;
  fiscal_year?: number;
  effective_start_datetime?: string;
  effective_end_datetime?: string;
  assigned_to?: string;
  status_rid?: string;
  priority_rid?: string;
  checklist_rid?: string;
  tags?: string | Array<{ tag_rid: string; is_new_tag: boolean }>;
}

export const useCreateActivityTask = () => {
  return useMutation<unknown, Error, CreateActivityTaskPayload>({
    mutationFn: async (payload: CreateActivityTaskPayload) => {
      const response = await caseServiceApi.post(
        '/api/activities/task/create',
        payload
      );
      return response.data;
    },
  });
};
