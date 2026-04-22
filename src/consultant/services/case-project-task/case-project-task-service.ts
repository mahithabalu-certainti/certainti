import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { caseServiceApi } from '../../../api/api';
import {
  CaseProjectTaskListResponse,
  CaseProjectTaskListUIResponse,
  CaseProjectTaskListURLParams,
} from '../../types/case-project-task';
import { CaseProjectTasksURL } from './case-project-task-url';
import {
  ExportCaseListResponse,
  ProjectResourcesListParams,
} from '../../types';
import { ProjectTaskDetailsApiResponse } from '../../types/project-task';

export const fetchCaseProjectTaskList = async (
  params: CaseProjectTaskListURLParams
): Promise<CaseProjectTaskListUIResponse> => {
  const response = await caseServiceApi.get<CaseProjectTaskListResponse>(
    CaseProjectTasksURL(params)
  );
  return {
    tasks: response.data.data.tasks,
    count: response.data.data.totalCount,
  };
};

export const useCaseProjectTaskList = (
  params: CaseProjectTaskListURLParams,
  refreshAttachments?: number
): UseQueryResult<CaseProjectTaskListUIResponse, Error> => {
  return useQuery<CaseProjectTaskListUIResponse, Error>({
    queryKey: ['caseProjectTaskList', params, refreshAttachments],
    queryFn: () => fetchCaseProjectTaskList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.case_rid && !!params.accountRid,
  });
};

export const getCaseExportListURL = (
  { sortBy, sortOrder, filters, search }: ProjectResourcesListParams,
  accountRid?: string,
  caseRid?: string
): string => {
  const baseUrl = `/api/caseProjectTask/list/export`;

  const searchParams = new URLSearchParams();

  // Add accountRid and caseRid as query parameters
  if (accountRid) searchParams.set('accountRid', accountRid);
  if (caseRid) searchParams.set('caseRid', caseRid);

  if (filters && Object.keys(filters).length > 0) {
    searchParams.set('filters', JSON.stringify(filters));
  }
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);
  if (search) {
    searchParams.set('search', search);
  }

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};
export const ExportCaseProjectTasktList = async (
  params: ProjectResourcesListParams,
  accountId?: string,
  caseId?: string
): Promise<void> => {
  try {
    const filename = `cases_projects_task_list.xlsx`;

    const response = await caseServiceApi.get<ExportCaseListResponse>(
      getCaseExportListURL({ ...params }, accountId, caseId)
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

export const TaskDetailURL = (taskId: string, accountRid: string) => {
  return `/api/caseProjectTask/detail?accountRid=${accountRid}&taskRid=${taskId}`;
};

export const fetchCaseProjectTaskDetails = async (
  taskId: string,
  accountRid?: string
): Promise<ProjectTaskDetailsApiResponse> => {
  const response = await caseServiceApi.get<ProjectTaskDetailsApiResponse>(
    TaskDetailURL(taskId, accountRid ?? '')
  );
  return response.data;
};

export const useCaseProjectTaskDetail = (
  taskId: string,
  accountRid?: string
) => {
  return useQuery<ProjectTaskDetailsApiResponse, Error>({
    queryKey: ['project-resource-detail', taskId, accountRid],
    queryFn: async () => {
      return fetchCaseProjectTaskDetails(taskId, accountRid);
    },
    retry: 0,
    gcTime: 0,
    enabled: !!taskId && !!accountRid,
  });
};
