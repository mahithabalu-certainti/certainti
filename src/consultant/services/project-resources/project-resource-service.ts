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
  ProjectResourcesApiResponse,
  ProjectResourcesListType,
  ProjectResourcesListParams,
  ProjectResourceDetailsApiResponse,
  ProjectResourceNewPayload,
} from '../../types/project-resources';
import { DetailURL, ProjectResourcesURL } from '../urls/project-resources-url';
import { baseUrl } from '../urls/resource-cost-skill-urls';

export const useProjectResources = (
  params: ProjectResourcesListParams,
  options?: UseQueryOptions<
    { projectResources: ProjectResourcesListType[]; count: number },
    Error,
    { projectResources: ProjectResourcesListType[]; count: number }
  >,
  refreshProjectsTrigger?: number
): UseQueryResult<
  { projectResources: ProjectResourcesListType[]; count: number },
  Error
> => {
  return useQuery<
    { projectResources: ProjectResourcesListType[]; count: number },
    Error,
    { projectResources: ProjectResourcesListType[]; count: number }
  >({
    queryKey: ['projectResources', params, refreshProjectsTrigger],
    queryFn: async () => {
      const res = await fetchProjectResources(params);
      return {
        projectResources: res.data.projectResources,
        count: res.data.count,
      };
    },
    ...options,
    retry: 0,
    enabled: !!params.projectid && !!params.accountNumber,
  });
};

export const fetchProjectResources = async (
  params: ProjectResourcesListParams
): Promise<ProjectResourcesApiResponse> => {
  try {
    const { data } = await resourceServiceApi.get<ProjectResourcesApiResponse>(
      ProjectResourcesURL(params)
    );
    return data;
  } catch (error) {
    console.error('Error fetching resource type:', error);
    throw error;
  }
};

export const fetchDetails = async (
  account_Id: string,
  resourceId: string
): Promise<ProjectResourceDetailsApiResponse> => {
  const response = await api.get<ProjectResourceDetailsApiResponse>(
    DetailURL(account_Id, resourceId ?? '')
  );
  return response.data;
};

export const useProjectResourceDetail = (
  account_Id: string,
  resourceId: string
) => {
  return useQuery<ProjectResourceDetailsApiResponse, Error>({
    queryKey: ['project-resource-detail', account_Id, resourceId],
    queryFn: async () => {
      return fetchDetails(account_Id, resourceId);
    },
    retry: 0,
    gcTime: 0,
    enabled: !!account_Id && !!resourceId,
  });
};

export const useCreateProjectResource = (
  options?: UseMutationOptions<
    Partial<ProjectResourceDetailsApiResponse>,
    Error,
    Partial<ProjectResourceNewPayload>
  >
): UseMutationResult<
  Partial<ProjectResourceDetailsApiResponse>,
  Error,
  Partial<ProjectResourceNewPayload>
> => {
  return useMutation({
    mutationKey: ['create-resource-skill'],
    mutationFn: async (payload) => {
      const res = await api.post(
        `${baseUrl}` + '/api/project_resources/new',
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
    Partial<ProjectResourceNewPayload>
  >
): UseMutationResult<
  Partial<ProjectResourceDetailsApiResponse>,
  Error,
  Partial<ProjectResourceNewPayload>
> => {
  return useMutation({
    mutationKey: ['update-resource-skill'],
    mutationFn: async (payload) => {
      const res = await api.put(
        `${baseUrl}` + '/api/project_resources/update',
        payload
      );
      return res.data;
    },
    ...options,
  });
};
