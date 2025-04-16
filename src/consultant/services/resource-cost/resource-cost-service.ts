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
} from '../../types/resourceCost';
// import { useApiMutation } from '../../../api/mutation';
import { api } from '../../../api/api';
import { costListURL } from '../urls/resource-cost-skill-urls';

const mockData: ResourceCostApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: '',
  data: {
    resourceCost: [
      {
        rid: '0a8724f4-6539-4d5b-978c-e1d798623491',
        status: 'active',
        created_datetime: '2025-04-12T06:38:26.796Z',
        modified_datetime: '2025-04-12T06:38:26.796Z',
        eid: '',
        account_rid: '123e4567-e89b-12d3-a456-426614174000',
        resource_type: 'Full-time',
        resource_rid: '87ea3a23-2b7c-438e-a9ba-077fe8d9792f',
        resource_ref_id: '1dgsgywe836e54',
        effective_date: '2023-10-10T00:00:00.000Z',
        end_date: '2025-05-01T00:00:00.000Z',
        annual_cost: '500000.00',
        semi_annual_cost: null,
        monthly_cost: null,
        weekly_cost: null,
        bi_weekly_cost: null,
        daily_cost: null,
        hourly_cost: null,
        currency: 'INR',
        currency_rid: 'c8eb857d-b3e5-4e07-9704-8e420fea3d6c',
        fiscal_year: '2024',
        r_number: 'RC00005',
        created_by: null,
        modified_by: null,
      },
    ],
    count: 1,
  },
};

export const useResourceCost = (
  params: ResourceCostListParams,
  options?: UseQueryOptions<
    { resourceCost: ResourceCostList[]; count: number },
    Error
  >
): UseQueryResult<
  { resourceCost: ResourceCostList[]; count: number },
  Error
> => {
  return useQuery<{ resourceCost: ResourceCostList[]; count: number }, Error>({
    queryKey: ['resourceCost', params],
    queryFn: async () => {
      // const res = await fetchResourceCost(params);
      // console.log('Resource Cost List:', res);
      return {
        resourceCost: mockData.data.resourceCost,
        count: mockData.data.count,
      };
    },
    ...options,
  });
};

export const fetchResourceCost = async (
  params: ResourceCostListParams
): Promise<ResourceCostApiResponse> => {
  const { data } = await api.get<ResourceCostApiResponse>(costListURL(params));
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
      const res = await api.post('/api/resource_cost/create', payload);
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
      const res = await api.put('/api/resource_cost/update', payload);
      return res.data;
    },
    ...options,
  });
};
