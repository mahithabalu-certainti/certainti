import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { api } from '../../../api/api';
import {
  ProjectResourcesApiResponse,
  ProjectTaskListType,
  ProjectResourcesListParams,
  ProjectResourceStatus,
  ProjectResourceDetailsApiResponse,
  ProjectResourcePayload,
  //   ProjectTaskDetailsType,
} from '../../types/project-task';
import { DetailURL, ProjectResourcesURL } from '../urls/project-task-url';

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

const resourceDetails = {
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
  >
): UseQueryResult<
  { projectTask: ProjectTaskListType[]; count: number },
  Error
> => {
  return useQuery<
    { projectTask: ProjectTaskListType[]; count: number },
    Error,
    { projectTask: ProjectTaskListType[]; count: number }
  >({
    queryKey: ['projectTask', params],
    queryFn: async () => {
      // const res = await fetchProjectTask(params);
      return {
        projectTask: mockData.data.projectTask,
        count: mockData.data.count,
        // projectTask:
        //   res.data.projectTask || mockData.data.projectTask,
        // count: mockData.data.count || res.data.count,
      };
    },
    ...options,
    retry: 0,
    //   enabled: !!params.resourceRid && !!params.accountNumber,
  });
};

export const fetchProjectTask = async (
  params: ProjectResourcesListParams
): Promise<ProjectResourcesApiResponse> => {
  const { data } = await api.get<ProjectResourcesApiResponse>(
    ProjectResourcesURL(params)
  );
  return data;
};

export const fetchDetails = async (
  resourceId: string,
  projectNumber?: string
): Promise<ProjectResourceDetailsApiResponse> => {
  const response = await api.get<ProjectResourceDetailsApiResponse>(
    DetailURL(resourceId, projectNumber ?? '')
  );
  return response.data;
};

export const useProjectTaskDetail = (
  resourceId: string,
  accountNumber?: string
) => {
  return useQuery<ProjectResourceDetailsApiResponse, Error>({
    queryKey: ['project-resource-detail', resourceId, accountNumber],
    queryFn: async () => {
      // fetchDetails(resourceId, accountNumber)
      return {
        ...resourceDetails,
      };
    },
    retry: 0,
    gcTime: 0,
    enabled: !!resourceId,
  });
};

export const useCreateProjectTask = (
  options?: UseMutationOptions<
    Partial<ProjectResourceDetailsApiResponse>,
    Error,
    Partial<ProjectResourcePayload>
  >
): UseMutationResult<
  Partial<ProjectResourceDetailsApiResponse>,
  Error,
  Partial<ProjectResourcePayload>
> => {
  return useMutation({
    mutationKey: ['create-resource-skill'],
    mutationFn: async (payload) => {
      const res = await api.post(
        '/api/project_resource/create',
        // `${baseUrl}` + '/api/project_resource/create',
        payload
      );
      return res.data;
    },
    ...options,
  });
};

export const useUpdateProjectTask = (
  options?: UseMutationOptions<
    Partial<ProjectResourceDetailsApiResponse>,
    Error,
    Partial<ProjectResourcePayload>
  >
): UseMutationResult<
  Partial<ProjectResourceDetailsApiResponse>,
  Error,
  Partial<ProjectResourcePayload>
> => {
  return useMutation({
    mutationKey: ['update-resource-skill'],
    mutationFn: async (payload) => {
      const res = await api.put(
        '/api/project_resource/update',
        // `${baseUrl}` + '/api/project_resource/update',
        payload
      );
      return res.data;
    },
    ...options,
  });
};
