// import {
//   useQuery,
//   UseQueryOptions,
//   UseQueryResult,
// } from '@tanstack/react-query';
// import { accountServiceApi } from '../../../api/api';
// import {
//   ResourceList,
//   ResourceListURLParams,
//   ResourcesListResponse,
// } from '../../types/resource';
// import { ResourceListURL } from '../urls/resource-url';

// export const fetchAccounts = async (
//   params: ResourceListURLParams
// ): Promise<{ accounts: ResourceList[]; count: number }> => {
//   const response = await accountServiceApi.get<ResourcesListResponse>(
//     ResourceListURL(params)
//   );
//   return {
//     resources: response.data.data.resources,
//     count: response.data.data.count,
//   };
// };

// export const useAccounts = (
//   params: ResourceListURLParams,
//   options?: UseQueryOptions<{ accounts: ResourceList[]; count: number }, Error>
// ): UseQueryResult<{ accounts: ResourceList[]; count: number }, Error> => {
//   return useQuery<{ accounts: ResourceList[]; count: number }, Error>({
//     queryKey: ['accounts', params],
//     queryFn: () => fetchAccounts(params),
//     ...options,
//   });
// };
