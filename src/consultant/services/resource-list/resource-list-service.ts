import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { accountServiceApi, api } from '../../../api/api';
import {
  GetResourceStatusApiResponse,
  GetResourceTypeApiResponse,
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

export const getResourceStatusUrl = (): string => {
  return `/api/accounts/resourceStatus`;
};

export const fetchResourceStatus =
  async (): Promise<GetResourceStatusApiResponse> => {
    try {
      const { data } =
        await accountServiceApi.get<GetResourceStatusApiResponse>(
          getResourceStatusUrl()
        );
      return data;
    } catch (error) {
      console.error('Error fetching resource status:', error);
      throw error;
    }
  };

export const useGetResourceStatus = () => {
  return useQuery<GetResourceStatusApiResponse, Error>({
    queryKey: ['getResourceStatus'],
    queryFn: () => fetchResourceStatus(),
    retry: 0,
    staleTime: Infinity, // Cache data forever until manually invalidated
    gcTime: Infinity, // Never delete from cache
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};

export const getResourceTypeUrl = (): string => {
  return `/api/accounts/resouceType`;
};

export const fetchResourceType =
  async (): Promise<GetResourceTypeApiResponse> => {
    try {
      const { data } =
        await accountServiceApi.get<GetResourceTypeApiResponse>(
          getResourceTypeUrl()
        );
      return data;
    } catch (error) {
      console.error('Error fetching resource type:', error);
      throw error;
    }
  };

export const useGetResourceType = () => {
  return useQuery<GetResourceTypeApiResponse, Error>({
    queryKey: ['getResourceType'],
    queryFn: () => fetchResourceType(),
    retry: 0,
    staleTime: Infinity, // Cache data forever until manually invalidated
    gcTime: Infinity, // Never delete from cache
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};
