import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import {
  ResourceCostApiResponse,
  ResourceCostList,
  ResourceCostListParams,
  ResourceCostPayload,
  ResourceCostStatusApiResponse,
  ResourceStatusPayload,
} from '../../types/resource-cost';
// import { useApiMutation } from '../../../api/mutation';
import { api } from '../../../api/api';
import {
  baseUrl,
  costListURL,
  fetchResourceCostByIdUrl,
} from '../urls/resource-cost-skill-urls';

export const useResourceCost = (
  params: ResourceCostListParams,
  options?: UseQueryOptions<
    { resourceCost: ResourceCostList[]; count: number },
    Error
  >,
  refreshCostTrigger?: number
): UseQueryResult<
  { resourceCost: ResourceCostList[]; count: number },
  Error
> => {
  return useQuery<{ resourceCost: ResourceCostList[]; count: number }, Error>({
    queryKey: ['resourceCost', params, refreshCostTrigger],
    queryFn: async () => {
      const res = await fetchResourceCost(params);
      return {
        resourceCost: res.data.resourceCost,
        count: res.data.count,
      };
    },
    ...options,
    retry: 0,
    enabled: !!params.resourceRid && !!params.accountNumber,
  });
};

export const fetchResourceCost = async (
  params: ResourceCostListParams
): Promise<ResourceCostApiResponse> => {
  const { data } = await api.get<ResourceCostApiResponse>(costListURL(params));
  return data;
};

export const useFetchResourceCostById = (
  params: ResourceCostListParams
): UseQueryResult => {
  return useQuery({
    queryKey: ['resource-cost-byId', params],
    queryFn: async () => {
      const res = await fetchResourceCostById(params);
      return res.data;
    },
    enabled: !!params.id,
    retry: 0,
    refetchOnWindowFocus: false,
    gcTime: 0,
    staleTime: 0,
  });
};

export const fetchResourceCostById = async (
  params: ResourceCostListParams
): Promise<ResourceCostApiResponse> => {
  const { data } = await api.get<ResourceCostApiResponse>(
    fetchResourceCostByIdUrl(params)
  );
  return data;
};

export const useCreateResourceCost = (
  options?: UseMutationOptions<
    Partial<ResourceCostApiResponse>,
    Error,
    Partial<ResourceCostPayload>
  >
): UseMutationResult<
  Partial<ResourceCostApiResponse>,
  Error,
  Partial<ResourceCostPayload>
> => {
  return useMutation({
    mutationKey: ['create-resource-cost'],
    mutationFn: async (payload) => {
      const res = await api.post(
        `${baseUrl}` + '/api/resource_cost/create',
        payload
      );
      return res.data;
    },
    ...options,
  });
};

export const useUpdateResourceCost = (
  options?: UseMutationOptions<
    Partial<ResourceCostApiResponse>,
    Error,
    Partial<ResourceCostPayload>
  >
): UseMutationResult<
  Partial<ResourceCostApiResponse>,
  Error,
  Partial<ResourceCostPayload>
> => {
  return useMutation({
    mutationKey: ['update-resource-cost'],
    mutationFn: async (payload) => {
      const res = await api.put(
        `${baseUrl}` + '/api/resource_cost/update',
        payload
      );
      return res.data;
    },
    ...options,
  });
};
export const useUpdateCostAccept = (
  options?: UseMutationOptions<
    Partial<ResourceCostStatusApiResponse>,
    Error,
    Partial<ResourceStatusPayload>
  >
): UseMutationResult<
  Partial<ResourceCostStatusApiResponse>,
  Error,
  Partial<ResourceStatusPayload>
> => {
  return useMutation({
    mutationKey: ['update-resourcecost-accept-status'],
    mutationFn: async (payload) => {
      const res = await api.put(
        `${baseUrl}` + '/api/resource_cost/status/update',
        payload
      );
      return res.data;
    },
    ...options,
  });
};
