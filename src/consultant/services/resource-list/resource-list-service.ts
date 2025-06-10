import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '../../../api/api';
import {
  ResourceList,
  ResourceListURLParams,
  ResourcesListResponse,
} from '../../types/resource';
import { ResourceListURL } from '../urls';

export const fetchResourceList = async (
  params: ResourceListURLParams
): Promise<{ resource: ResourceList[]; count: number }> => {
  const response = await api.get<ResourcesListResponse>(
    ResourceListURL(params)
  );
  return {
    resource: response.data.data.resources,
    count: response.data.data.count,
  };
};

export const useResourceList = (
  params: ResourceListURLParams,
  isResourceViewAllEnable?: boolean,
  refreshTrigger?: number
): UseQueryResult<{ resource: ResourceList[]; count: number }, Error> => {
  return useQuery<{ resource: ResourceList[]; count: number }, Error>({
    queryKey: ['resourceList', params, refreshTrigger],
    queryFn: () => fetchResourceList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.accountNumber && isResourceViewAllEnable,
  });
};
