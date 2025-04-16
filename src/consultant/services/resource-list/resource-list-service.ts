import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { mockResourcesList } from '../../mockdata/resource-list';
import { ResourceList, ResourceListURLParams } from '../../types/resource';

export const fetchAccounts = async () // params: ResourceListURLParams
: Promise<{ resource: ResourceList[]; count: number }> => {
  // const response = await accountServiceApi.get<ResourcesListResponse>(
  //   ResourceListURL(params)
  // );
  return {
    resource: mockResourcesList.data.resources,
    count: mockResourcesList.data.count,
  };
  // return {
  //   resources: response.data.data.resources,
  //   count: response.data.data.count,
  // };
};

export const useResourceList = (
  params?: ResourceListURLParams,
  options?: UseQueryOptions<{ resource: ResourceList[]; count: number }, Error>
): UseQueryResult<{ resource: ResourceList[]; count: number }, Error> => {
  return useQuery<{ resource: ResourceList[]; count: number }, Error>({
    queryKey: ['accounts', params],
    queryFn: () => fetchAccounts(),
    ...options,
  });
};
