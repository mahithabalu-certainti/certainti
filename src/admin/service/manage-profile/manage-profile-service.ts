import { useQuery } from '@tanstack/react-query';
import { userServiceApi } from '../../../api/api';
import {
  ManageProfileApiResponse,
  UserListParams,
} from '../../types/manage-user';
import { getProfileListUrl } from '../urls';
// import { manageProfileMockData } from '../../mockdata';

const ORGANIZATION = import.meta.env.VITE_ORGANIZATION;

export const fetchManageProfileList = async (params: UserListParams = {}) => {
  const queryParams = {
    organization: ORGANIZATION,
    page: params.page || 1,
    limit: params.limit || 10,
    sortBy: params.sortBy || 'createdAt',
    sortOrder: params.sortOrder || 'DESC',
    filters: params.filters || {},
    ...(params.filters && { filters: params.filters }),
    ...(params.searchTerm && { search: params.searchTerm }),
  };

  const url = getProfileListUrl(queryParams);
  const response = await userServiceApi.get<ManageProfileApiResponse>(url);
  // await new Promise((resolve) => setTimeout(resolve, 1000));
  return response.data;
};

export const useManageProfileList = (params: UserListParams = {}) => {
  return useQuery<ManageProfileApiResponse, Error>({
    queryKey: ['manageProfile', params],
    queryFn: () => fetchManageProfileList(params),
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    retry: 0,
  });
};
