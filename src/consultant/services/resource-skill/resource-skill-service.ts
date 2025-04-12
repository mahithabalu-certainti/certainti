import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
// import api from '../../../api/api';
// import { skillListURL } from '../urls/resource-url';
import { ResourceSkillApiResponse, ResourceSkillList, ResourceSkillListParams } from '../../types/resourceSkill';
import { ResourceListURL } from '../urls';
import { api } from '../../../api/api';
// import { skillListURL } from '../urls';


export const useResourceSkill = (
  params: ResourceSkillListParams,
  options?: UseQueryOptions<
    { resourceSkill: ResourceSkillList[]; count: number },
    Error
  >
): UseQueryResult<{ resourceSkill: ResourceSkillList[]; count: number }, Error> => {
  return useQuery<{ resourceSkill: ResourceSkillList[]; count: number }, Error>({
    queryKey: ['resourceSkill', params],
    queryFn: async () => {
      const res = await fetchResourceSkill(params);
      return {
        resourceSkill: res.data.resourceSkill,
        count: res.data.totalRecords,
      };
    },
    ...options,
  });
};


export const fetchResourceSkill = async (
  params: ResourceSkillListParams
): Promise<ResourceSkillApiResponse> => {
  const { data } = await api.get<ResourceSkillApiResponse>(ResourceListURL(params));
  return data;
};
