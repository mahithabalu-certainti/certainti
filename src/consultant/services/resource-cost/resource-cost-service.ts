import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import {
  ResourceCostApiResponse,
  ResourceCostList,
  ResourceCostListParams,
} from '../../types/resourceCost';
// import { useApiMutation } from '../../../api/mutation';
import { api } from '../../../api/api';
import { ResourceListURL  } from '../urls';

const mockData: ResourceCostApiResponse = {
  statusCode: 200,
  statusCodeValue: 'Success',
  statusMessage: '',
  data: {
    resourceCost: [
      {
        id: 'c89b9502-c467-4eed-8ceb-4e8feefb4656',
        resource_cost_number: 'RC1000',
        resource_ref_id: '1',
        currency: 'USD',
        start_date: '2025-04-05',
        end_date: '2025-04-06',
        annual_compensation: '10000.00',
        monthly_compensation: null,
        semi_annual_compensation:  null,
        bi_weekly_compensation: null,
        weekly_compensation: null,
        daily_compensation: null,
        hourly_compensation: null,
        status: 'Active',
        created_at: '2025-04-07T07:14:47.782Z',
        updated_at: '2025-04-07T07:14:47.782Z',
        created_by: '',
        updated_by: '',
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
  const { data } = await api.get<ResourceCostApiResponse>(ResourceListURL(params));
  return data;
};

// export const useCreateResourceCost = () => {
//   return useApiMutation<unknown, Partial<NewCostData>>(
//     createResourceCost,
//     'post'
//   );
// };

// export const useUpdateResourceCost = () => {
//   return useApiMutation<unknown, Partial<NewCostData>>(
//     updateResourceCost,
//     'put'
//   );
// };