import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { resourceServiceApi } from '../../../api/api';
import { TasksExportListURL } from '../urls/tasks-url';
import {
  TaskListResponse,
  TasksListExportParams,
  TasksListURLParams,
} from '../../types/task';

export const fetchTasksList = async (
  params: TasksListURLParams
): Promise<TaskListResponse> => {
  const isMilestone =
    params.filters &&
    (params.filters as { attachment_level?: string }).attachment_level ===
      'milestone';

  const flag = isMilestone ? 'milestone' : 'activity';
  const baseUrl = isMilestone
    ? '/api/task/list/summaryMilestone'
    : '/api/task/list/summaryActivity';

  let filtersToSend = params.filters ? { ...params.filters } : {};
  const { attachment_level, ...rest } = filtersToSend as {
    attachment_level?: string;
  };
  filtersToSend = rest;

  const payload: Record<string, any> = {
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
    payload.globalFilters = JSON.stringify(params.globalFilters);
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

type ExportType = 'tasks' | 'all_tasks' | 'milestone' | 'activity';
export const exportTasksData = async (
  type: ExportType,
  params: TasksListExportParams
) => {
  let url = '';
  let filename = '';

  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  switch (type) {
    case 'tasks':
      url = TasksExportListURL({ ...params, timezone: systemTimezone });
      filename = 'tasks_records.xlsx';
      break;
    case 'all_tasks':
      url = TasksExportListURL({ ...params, timezone: systemTimezone });
      filename = 'all_tasks_records.xlsx';
      break;
    case 'milestone':
      url = TasksExportListURL({
        ...params,
        timezone: systemTimezone,
        filters: { ...params.filters, attachment_level: 'milestone' },
      });
      filename = 'milestone_tasks_records.xlsx';
      break;
    case 'activity':
      url = TasksExportListURL({
        ...params,
        timezone: systemTimezone,
        filters: { ...params.filters, attachment_level: 'activity' },
      });
      filename = 'activity_tasks_records.xlsx';
      break;
    default:
      console.error('Invalid export type');
      return;
  }

  try {
    const response = await resourceServiceApi.get(url);
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
