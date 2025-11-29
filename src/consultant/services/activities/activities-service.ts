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
  ActivityListExportURLParams,
  ActivityListURLParams,
  ActivityStatusResponse,
  ActivityTaskFormPayload,
  ActivityType,
  CallActivityDetails,
  CallActivityDetailsResponse,
  EmailActivityDetails,
  EmailActivityDetailsResponse,
  ExportAcivityListResponse,
  MeetingActivityDetails,
  MeetingActivityDetailsResponse,
  TaskActivityDetails,
  TaskActivityDetailsResponse,
} from '../../types';
import {
  ActivityListURL,
  createActivityCallURL,
  createActivityEmailURL,
  createActivityMeetingURL,
  createActivityTaskURL,
  getActivityExportListURL,
  updateActivityCallURL,
  updateActivityEmailURL,
  updateActivityMeetingURL,
  updateActivityTaskURL,
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
export const fetchTaskActivityDetails = async (
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
    'post'
  );
};

// Call Activity
export const fetchCallActivityDetails = async (
  entityId: string,
  activityId: string
): Promise<CallActivityDetails> => {
  const response = await caseServiceApi.get<CallActivityDetailsResponse>(
    `/api/activities/call/${activityId}/${entityId}`
  );

  return response.data.data.activityDetails;
};

export const useCallActivityDetails = (
  entityId?: string,
  activityId?: string,
  isEnable?: boolean
): UseQueryResult<CallActivityDetails | undefined, Error> => {
  return useQuery<CallActivityDetails | undefined, Error>({
    queryKey: ['call-activity-details', entityId, activityId, isEnable],
    queryFn: () => fetchCallActivityDetails(entityId!, activityId!),
    retry: 0,
    gcTime: 0,
    enabled: !!activityId && !!entityId && isEnable,
  });
};

export const useCreateActivityCall = () => {
  return useApiMutationSericve<unknown, FormData>(
    createActivityCallURL(),
    'post'
  );
};

export const useUpdateActivityCall = () => {
  return useApiMutationSericve<unknown, FormData>(
    updateActivityCallURL(),
    'post'
  );
};

// Create Activity Task
export const useCreateActivityTask = () => {
  return useMutation<unknown, Error, ActivityTaskFormPayload>({
    mutationFn: async (payload: ActivityTaskFormPayload) => {
      const response = await caseServiceApi.post(
        createActivityTaskURL(),
        payload
      );
      return response.data;
    },
  });
};

// Update Activity Task
export const useUpdateActivityTask = () => {
  return useMutation<
    unknown,
    Error,
    ActivityTaskFormPayload & { task_rid: string }
  >({
    mutationFn: async (
      payload: ActivityTaskFormPayload & { task_rid: string }
    ) => {
      const response = await caseServiceApi.post(
        updateActivityTaskURL(),
        payload
      );
      return response.data;
    },
  });
};

// Activty Status
export const getActivityStatusUrl = (activity_type?: string): string =>
  activity_type
    ? `/api/activities/activityStatus?activity_type=${activity_type}`
    : '/api/activities/activityStatus';

export const fetchActivityStatus = async (
  activity_type?: string
): Promise<ActivityStatusResponse> => {
  try {
    const { data } = await caseServiceApi.get<ActivityStatusResponse>(
      getActivityStatusUrl(activity_type)
    );
    return data;
  } catch (error) {
    console.error('Error fetching activity statuses:', error);
    throw error;
  }
};

export const useGetActivityStatus = (activity_type?: string) => {
  return useQuery<ActivityStatusResponse, Error>({
    queryKey: ['activity-statuses', activity_type],
    queryFn: () => fetchActivityStatus(activity_type),
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

// Export Activity List
export const ExportActivityList = async (
  params: ActivityListExportURLParams,
  activityType: ActivityType
): Promise<void> => {
  try {
    const filename = `${activityType}_activity_list.xlsx`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const response = await caseServiceApi.get<ExportAcivityListResponse>(
      getActivityExportListURL({ ...params, timezone })
    );

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
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};
