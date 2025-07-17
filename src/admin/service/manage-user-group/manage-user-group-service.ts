import { useQuery } from '@tanstack/react-query';
import { userServiceApi } from '../../../api/api';
import { UserListParams } from '../../types/manage-user';
import { getUserGroupListUrl } from '../urls';
import { UserGroupApiResponse } from '../../types';

export const fetchManageUserGroupList = async (params: UserListParams = {}) => {
  const queryParams = {
    page: params.page || 1,
    limit: params.limit || 10,
    sortBy: params.sortBy || 'createdAt',
    sortOrder: params.sortOrder || 'DESC',
    filters: params.filters || {},
    ...(params.filters && { filters: params.filters }),
    ...(params.searchTerm && { search: params.searchTerm }),
  };

  const url = getUserGroupListUrl(queryParams);
  const response = await userServiceApi.get<UserGroupApiResponse>(url);
  return response.data;
};

export const useManageUserGroupList = (
  params: UserListParams = {},
  refreshProfileTrigger?: number
) => {
  return useQuery<UserGroupApiResponse, Error>({
    queryKey: ['manageProfile', params, refreshProfileTrigger],
    queryFn: () => fetchManageUserGroupList(params),
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    retry: 0,
  });
};
