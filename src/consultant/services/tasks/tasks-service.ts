import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { resourceServiceApi } from '../../../api/api';
import {
  TaskListResponse,
  TasksListExportParams,
  TasksListURLParams,
} from '../../types/task';

export const fetchTasksList = async (
  params: TasksListURLParams
): Promise<TaskListResponse> => {
  const isMilestone = params.flag
    ? params.flag === 'milestone'
    : params.filters &&
      (params.filters as { attachment_level?: string }).attachment_level ===
        'milestone';

  const flag = isMilestone ? 'milestone' : 'activity';
  const baseUrl = isMilestone
    ? '/api/task/list/summaryMilestone'
    : '/api/task/list/summaryActivity';

  const filtersToSend: Record<
    string,
    object | string | string[] | number | undefined | unknown
  > = params.filters ? { ...params.filters } : {};

  const payload: Record<
    string,
    object | string | string[] | number | undefined | unknown
  > = {
    flag,
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  };

  if (params.fiscalYear) {
    payload.fiscalYear = params.fiscalYear;
  }
  if (filtersToSend && Object.keys(filtersToSend).length > 0) {
    payload.filters = JSON.stringify(filtersToSend);
  }
  if (params.globalFilters) {
    payload.globalFilters = params.globalFilters;
  }

  if (params.search) {
    payload.search = params.search;
  }

  const response = await resourceServiceApi.post<TaskListResponse>(
    baseUrl,
    payload
  );
  return response.data;
};

export const useTasksList = (
  params: TasksListURLParams,
  refreshTasks?: number
): UseQueryResult<TaskListResponse, Error> => {
  return useQuery<TaskListResponse, Error>({
    queryKey: ['tasksList', params, refreshTasks],
    queryFn: () => fetchTasksList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.isGlobal,
  });
};

export const useAllTasksList = (
  params: TasksListURLParams,
  refreshTrigger?: number
): UseQueryResult<TaskListResponse, Error> => {
  return useQuery<TaskListResponse, Error>({
    queryKey: ['allTasksList', params, refreshTrigger],
    queryFn: () => fetchTasksList(params),
    retry: 0,
    gcTime: 0,
  });
};

type ExportType = 'milestone' | 'activity';
export const exportTasksData = async (
  type: ExportType,
  params: TasksListExportParams
) => {
  let baseUrl = '';
  let filename = '';
  let flag = '';

  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Determine the base URL, flag, and filename based on type
  switch (type) {
    case 'milestone':
      baseUrl = '/api/task/list/summaryExportMilestone';
      flag = 'milestone';
      filename = 'milestone_tasks_records.xlsx';
      break;
    case 'activity':
      baseUrl = '/api/task/list/summaryExportActivity';
      flag = 'activity';
      filename = 'activity_tasks_records.xlsx';
      break;
    default:
      console.error('Invalid export type');
      return;
  }

  // Build the payload similar to fetchTasksList
  const filtersToSend: Record<
    string,
    object | string | string[] | number | undefined | unknown
  > = params.filters ? { ...params.filters } : {};

  const payload: Record<
    string,
    object | string | string[] | number | undefined | unknown
  > = {
    flag,
  };

  if (params.fiscalYear) {
    payload.fiscalYear = params.fiscalYear;
  }
  if (filtersToSend && Object.keys(filtersToSend).length > 0) {
    payload.filters = JSON.stringify(filtersToSend);
  }
  if (params.globalFilters) {
    payload.globalFilters = params.globalFilters;
  }
  if (params.sortBy) {
    payload.sortBy = params.sortBy;
  }
  if (params.sortOrder) {
    payload.sortOrder = params.sortOrder;
  }
  if (params.search) {
    payload.search = params.search;
  }
  if (systemTimezone) {
    payload.timezone = systemTimezone;
  }

  try {
    const response = await resourceServiceApi.post(baseUrl, payload);
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
