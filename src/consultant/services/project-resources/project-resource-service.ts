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
  ProjectResourcesListType,
  ProjectResourcesListParams,
  ProjectResourceStatus,
  ProjectResourceDetailsApiResponse,
  ProjectResourcePayload,
} from '../../types/project-resources';
import { DetailURL, ProjectResourcesURL } from '../urls/project-resources-url';

export const mockData = {
  statusCode: 200,
  statusCodeValue: 'OK',
  statusMessage: 'OK',
  data: {
    count: 3,
    projectResources: [
      {
        id: '23423ufguy3gr2y3u',
        rid: '23423ufguy3gr2y3u',
        project_resource_id: 'PRS0001',
        resource_code: '122fef23',
        resource_name: 'John Doe',
        resource_type: 'Full-Time',
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
        project_resource_id: 'PRS0001',
        resource_code: '122fef23',
        resource_name: 'John Doe',
        resource_type: 'Full-Time',
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
        project_resource_id: 'PRS0001',
        resource_code: '122fef23',
        resource_name: 'John Doe',
        resource_type: 'Full-Time',
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
      resource_type: 'Full-Time',
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

export const useProjectResources = (
  params: ProjectResourcesListParams,
  options?: UseQueryOptions<
    { projectResources: ProjectResourcesListType[]; count: number },
    Error,
    { projectResources: ProjectResourcesListType[]; count: number }
  >
): UseQueryResult<
  { projectResources: ProjectResourcesListType[]; count: number },
  Error
> => {
  return useQuery<
    { projectResources: ProjectResourcesListType[]; count: number },
    Error,
    { projectResources: ProjectResourcesListType[]; count: number }
  >({
    queryKey: ['projectResources', params],
    queryFn: async () => {
      // const res = await fetchProjectResources(params);
      return {
        projectResources: mockData.data.projectResources,
        count: mockData.data.count,
        // projectResources:
        //   res.data.projectResources || mockData.data.projectResources,
        // count: mockData.data.count || res.data.count,
      };
    },
    ...options,
    retry: 0,
    //   enabled: !!params.resourceRid && !!params.accountNumber,
  });
};

export const fetchProjectResources = async (
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

export const useProjectResourceDetail = (
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

export const useCreateProjectResource = (
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

export const useUpdateProjectResource = (
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
