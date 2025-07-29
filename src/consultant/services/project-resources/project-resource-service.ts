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
import {
  DetailURL,
  ProjectResourceExportURL,
  ProjectResourcesURL,
} from '../urls/project-resources-url';
import { baseUrl } from '../urls/resource-cost-skill-urls';
import { ProjectResourceExportParams } from '../../types';

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
export const exportProjectResoure = async (
  params: ProjectResourceExportParams
) => {
  try {
    const response = await resourceServiceApi.get(
      ProjectResourceExportURL(params)
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
    link.download = 'project_resource.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};
