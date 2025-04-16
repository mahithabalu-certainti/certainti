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
} from '../../types/resourceSkill';
import { api } from '../../../api/api';
import { skillListURL } from '../urls/resource-cost-skill-urls';
import { skillLevel } from '../../pages/account-details/sidebar-pages/resources/resource-skill/resourceSkillType';

const mockData: ResourceSkillApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: '',
  data: {
    resourceSkill: [
      {
        rid: '0dcffd06-ea0f-4fbe-8909-71bee567ecef',
        r_number: 'RSK00001',
        eid: '',
        account_rid: '123e4567-e89b-12d3-a456-426614174000',
        resource_type: 'Full_time',
        resource_rid: '87ea3a23-2b7c-438e-a9ba-077fe8d9792f',
        resource_desc: 'Software developer',
        skill_rid: '96565c2a-8cde-47fb-a4aa-bb1274fc3a7c',
        start_date: '2023-10-10T00:00:00.000Z',
        skill_description: '2025-05-01',
        skill_level: 'Beginner' as skillLevel,
        fiscal_year: '2024',
        years_of_experience: '3.00',
        resource_ref_id: '1dgsgywe836e54',
        technical_weightage: '6.00',
        status: 'active',
        created_datetime: '2025-04-14T11:49:03.379Z',
        modified_datetime: '2025-04-14T11:49:03.379Z',
        created_by: null,
        modified_by: null,
        resource_number: '1',
        resource_full_name: 'Akash G',
        skill_name: 'Java',
      },
    ],
    count: 1,
  },
};

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
        // const res = await fetchResourceSkill(params);
        return {
          resourceSkill: mockData.data.resourceSkill,
          count: mockData.data.count,
        };
      },
      ...options,
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
      const res = await api.post('/api/resource_skill/create', payload);
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
      const res = await api.put('/api/resource_skill/update', payload);
      return res.data;
    },
    ...options,
  });
};
