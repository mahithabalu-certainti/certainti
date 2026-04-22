import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import {
  ResourceSkillApiResponse,
  ResourceSkillList,
  ResourceSkillListParams,
  ResourceSkillPayload,
} from '../../types/resource-skill';
import { accountServiceApi, api } from '../../../api/api';
import {
  baseUrl,
  fetchResourceSkillByIdUrl,
  skillListURL,
} from '../urls/resource-cost-skill-urls';
import { SkillSubTypeUrl, SKILLTYPEURL } from '../urls';
import {
  GetSkillLevelApiResponse,
  SKillSubTypeApiResponse,
  SkillTypeApiResponse,
} from '../../types/resource';

export const useResourceSkill = (
  params: ResourceSkillListParams,
  options?: UseQueryOptions<
    { resourceSkill: ResourceSkillList[]; count: number },
    Error
  >,
  refreshSkillTrigger?: number
): UseQueryResult<
  { resourceSkill: ResourceSkillList[]; count: number },
  Error
> => {
  return useQuery<{ resourceSkill: ResourceSkillList[]; count: number }, Error>(
    {
      queryKey: ['resourceSkill', params, refreshSkillTrigger],
      queryFn: async () => {
        const res = await fetchResourceSkill(params);
        return {
          resourceSkill: res.data.resourceSkill,
          count: res.data.count,
        };
      },
      ...options,
      retry: 0,
      enabled: !!params.accountNumber && !!params.resourceRid,
    }
  );
};

export const fetchResourceSkill = async (
  params: ResourceSkillListParams
): Promise<ResourceSkillApiResponse> => {
  const { data } = await api.get<ResourceSkillApiResponse>(
    skillListURL(params)
  );
  return data;
};

export const useFetchResourceSkillById = (
  params: ResourceSkillListParams,
  options?: UseQueryOptions
): UseQueryResult => {
  return useQuery({
    queryKey: ['resource-skill-byId', params],
    queryFn: async () => {
      const res = await fetchResourceSkillById(params);
      return res.data;
    },
    enabled: !!params.rid,
    ...options,
  });
};

export const fetchResourceSkillById = async (
  params: Partial<ResourceSkillListParams>
): Promise<ResourceSkillApiResponse> => {
  const { data } = await api.get<ResourceSkillApiResponse>(
    fetchResourceSkillByIdUrl(params)
  );
  return data;
};

export const useCreateResourceSkill = (
  options?: UseMutationOptions<
    Partial<ResourceSkillApiResponse>,
    Error,
    Partial<ResourceSkillPayload>
  >
): UseMutationResult<
  Partial<ResourceSkillApiResponse>,
  Error,
  Partial<ResourceSkillPayload>
> => {
  return useMutation({
    mutationKey: ['create-resource-skill'],
    mutationFn: async (payload) => {
      const res = await api.post(
        `${baseUrl}` + '/api/resource_skill/create',
        payload
      );
      return res.data;
    },
    ...options,
  });
};

export const useUpdateResourceSkill = (
  options?: UseMutationOptions<
    Partial<ResourceSkillApiResponse>,
    Error,
    Partial<ResourceSkillPayload>
  >
): UseMutationResult<
  Partial<ResourceSkillApiResponse>,
  Error,
  Partial<ResourceSkillPayload>
> => {
  return useMutation({
    mutationKey: ['update-resource-skill'],
    mutationFn: async (payload) => {
      const res = await api.put(
        `${baseUrl}` + '/api/resource_skill/update',
        payload
      );
      return res.data;
    },
    ...options,
  });
};

export const fetchSkillType = async (): Promise<SkillTypeApiResponse> => {
  const { data } = await api.get<SkillTypeApiResponse>(SKILLTYPEURL);
  return data;
};

export const useFetchResourceSkillType = (enabled: boolean): UseQueryResult => {
  return useQuery({
    queryKey: ['resource-skill-Type'],
    queryFn: async () => {
      const res = await fetchSkillType();
      return res.data;
    },
    retry: 0,
    enabled,
    staleTime: Infinity, // Cache data forever until manually invalidated
    gcTime: Infinity, // Never delete from cache
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};

export const fetchSkillSubType = async (
  skillType: string[] | null
): Promise<SKillSubTypeApiResponse> => {
  const { data } = await api.get<SKillSubTypeApiResponse>(
    SkillSubTypeUrl(skillType)
  );
  return data;
};

export const useFetchResourceSkillSubType = (
  params: string[] | null
): UseQueryResult => {
  return useQuery({
    queryKey: ['resource-skill-Type', params],
    queryFn: async () => {
      const res = await fetchSkillSubType(params);
      return res.data;
    },
    enabled: !!params && params.length > 0,
    retry: 0,
  });
};

export const getSkillLevelUrl = (): string => {
  return `/api/accounts/skillLevel`;
};

export const fetchSkillLevel = async (): Promise<GetSkillLevelApiResponse> => {
  try {
    const { data } =
      await accountServiceApi.get<GetSkillLevelApiResponse>(getSkillLevelUrl());
    return data;
  } catch (error) {
    console.error('Error fetching skill levels:', error);
    throw error;
  }
};

export const useGetSkillLevel = () => {
  return useQuery<GetSkillLevelApiResponse, Error>({
    queryKey: ['getSkillLevel'],
    queryFn: () => fetchSkillLevel(),
    retry: 0,
    staleTime: Infinity, // Cache data forever until manually invalidated
    gcTime: Infinity, // Never delete from cache
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};
