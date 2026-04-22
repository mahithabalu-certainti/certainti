import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { api, resourceServiceApi } from '../../../api/api';
import {
  ProjectTaskApiResponse,
  ProjectTaskListType,
  ProjectResourcesListParams,
  ProjectResourceStatus,
  ProjectTaskListExportParams,
  ProjectTaskInput,
  createProjectTaskApiResponse,
  ProjectTaskDetailsApiResponse,
  ProjectTaskStatusApiResponse,
  ProjectTaskStatusPayload,
} from '../../types/project-task';
import {
  DetailURL,
  getProjectTaskExportURL,
  ProjectTaskURL,
} from '../urls/project-task-url';

export const mockData = {
  statusCode: 200,
  statusCodeValue: 'OK',
  statusMessage: 'OK',
  data: {
    count: 3,
    projectTask: [
      {
        id: '23423ufguy3gr2y3u',
        rid: '23423ufguy3gr2y3u',
        project_task_id: 'PTSK0001',
        resource_code: '122fef23',
        resource_name: 'John Doe',
        resource_org_name: 'Hubino',
        resource_role: 'Developer',
        status: ProjectResourceStatus['active'],
        country: 'USA',
        region: 'chicago',
        currency: 'YEN',
        cost: '122',
        effort: 1212,
      },
      {
        id: '23423ufguy3gr2y3u',
        rid: '23423ufguy3gr2y3u',
        project_task_id: 'PTSK0002',
        resource_code: '122fef23',
        resource_name: 'John Doe',
        resource_org_name: 'Hubino',
        resource_role: 'Developer',
        status: ProjectResourceStatus['active'],
        country: 'USA',
        region: 'chicago',
        currency: 'YEN',
        cost: '122',
        effort: 1212,
      },
      {
        id: '23423ufguy3gr2y3u',
        rid: '23423ufguy3gr2y3u',
        project_task_id: 'PTSK0003',
        resource_code: '122fef23',
        resource_name: 'John Doe',
        resource_org_name: 'Hubino',
        resource_role: 'Developer',
        status: ProjectResourceStatus['active'],
        country: 'USA',
        region: 'chicago',
        currency: 'YEN',
        cost: '122',
        effort: 1212,
      },
    ],
  },
};

export const resourceDetails = {
  statusCode: 200,
  statusCodeValue: 'OK',
  statusMessage: 'OK',
  data: {
    projectResourceDetails: {
      id: '2323432',
      project_resource_number: 'PRS0001',
      project_name: 'Project 1',
      project_id: '122fef23',
      resource_code: '122fef23',
      resource_full_name: 'John Doe',
      resource_org_name: 'Hubino',
      resource_role: 'Developer',
      status: ProjectResourceStatus['active'],
      country: 'USA',
      region: 'chicago',
      currency: 'YEN',
      resource_effective_from: '2023-01-01',
      resource_effective_enddate: '2023-01-01',
      designation: 'Developer',
      effort: 1212,
      cost: '122',
      financeEffort: 1212,
      description: 'Developer',
    },
  },
};

export const useProjectTask = (
  params: ProjectResourcesListParams,
  options?: UseQueryOptions<
    { projectTask: ProjectTaskListType[]; count: number },
    Error,
    { projectTask: ProjectTaskListType[]; count: number }
  >,
  refreshProjectsTrigger?: number
): UseQueryResult<
  { projectTask: ProjectTaskListType[]; count: number },
  Error
> => {
  return useQuery<
    { projectTask: ProjectTaskListType[]; count: number },
    Error,
    { projectTask: ProjectTaskListType[]; count: number }
  >({
    queryKey: ['projectTask', params, refreshProjectsTrigger],
    queryFn: async () => {
      const res = await fetchProjectTask(params);
      return {
        // projectTask: mockData.data.projectTask,
        // count: mockData.data.count,
        projectTask: res.data.tasks,
        count: res.data.totalCount,
      };
    },
    ...options,
    retry: 0,
    enabled: !!params.accountRid && !!params.projectRid,
  });
};

export const fetchProjectTask = async (
  params: ProjectResourcesListParams
): Promise<ProjectTaskApiResponse> => {
  const { data } = await resourceServiceApi.get<ProjectTaskApiResponse>(
    ProjectTaskURL(params)
  );
  return data;
};

export const fetchDetails = async (
  taskId: string,
  accountRid?: string
): Promise<ProjectTaskDetailsApiResponse> => {
  const response = await api.get<ProjectTaskDetailsApiResponse>(
    DetailURL(taskId, accountRid ?? '')
  );
  return response.data;
};

export const useProjectTaskDetail = (
  taskId: string,
  accountRid?: string,
  refreshTaskDetailPageTrigger?: number
) => {
  return useQuery<ProjectTaskDetailsApiResponse, Error>({
    queryKey: [
      'project-resource-detail',
      taskId,
      accountRid,
      refreshTaskDetailPageTrigger,
    ],
    queryFn: async () => {
      return fetchDetails(taskId, accountRid);
    },
    retry: 0,
    gcTime: 0,
    enabled: !!taskId && !!accountRid,
  });
};

export const useCreateProjectTask = (
  options?: UseMutationOptions<
    Partial<createProjectTaskApiResponse>,
    Error,
    Partial<ProjectTaskInput>
  >
): UseMutationResult<
  Partial<createProjectTaskApiResponse>,
  Error,
  Partial<ProjectTaskInput>
> => {
  return useMutation({
    mutationKey: ['create-project-task'],
    mutationFn: async (payload) => {
      const res = await resourceServiceApi.post(
        '/api/project_tasks/new',
        payload
      );
      return res.data;
    },
    ...options,
  });
};

export const useUpdateProjectTask = (
  options?: UseMutationOptions<
    Partial<createProjectTaskApiResponse>,
    Error,
    Partial<ProjectTaskInput>
  >
): UseMutationResult<
  Partial<createProjectTaskApiResponse>,
  Error,
  Partial<ProjectTaskInput>
> => {
  return useMutation({
    mutationKey: ['update-project-task'],
    mutationFn: async (payload) => {
      const res = await resourceServiceApi.put(
        '/api/project_tasks/update',
        payload
      );
      return res.data;
    },
    ...options,
  });
};

export const exportProjectTaskData = async (
  params: ProjectTaskListExportParams
) => {
  try {
    const response = await resourceServiceApi.get(
      getProjectTaskExportURL(params)
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
    link.download = 'project_task_records.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};

export const useUpdateProjectTaskStatus = (
  options?: UseMutationOptions<
    Partial<ProjectTaskStatusApiResponse>,
    Error,
    Partial<ProjectTaskStatusPayload>
  >
): UseMutationResult<
  Partial<ProjectTaskStatusApiResponse>,
  Error,
  Partial<ProjectTaskStatusPayload>
> => {
  return useMutation({
    mutationKey: ['update-projecttask-accept-status'],
    mutationFn: async (payload) => {
      // const res = await api.put(
      //   `${baseUrl}` + '/api/project_task/status/update',
      //   payload
      // );
      const res = await resourceServiceApi.put(
        'api/project_tasks/status/update',
        payload
      );
      return res.data;
    },
    ...options,
  });
};
