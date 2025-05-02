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
import { api } from '../../../api/api';
import {
  baseUrl,
  fetchResourceSkillByIdUrl,
  skillListURL,
} from '../urls/resource-cost-skill-urls';

export const useResourceSkill = (
  params: ResourceSkillListParams,
  options?: UseQueryOptions<
    { resourceSkill: ResourceSkillList[]; count: number },
    Error
  >
): UseQueryResult<
  { resourceSkill: ResourceSkillList[]; count: number },
  Error
> => {
  return useQuery<{ resourceSkill: ResourceSkillList[]; count: number }, Error>(
    {
      queryKey: ['resourceSkill', params],
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
