import { useQuery } from '@tanstack/react-query';
import { userServiceApi } from '../../../api/api';
import {
  ManageProfileApiResponse,
  UserListParams,
} from '../../types/manage-user';
import { getProfileExportUrl, getProfileListUrl } from '../urls';
import { generateFile } from '../helpers';

export const fetchManageProfileList = async (params: UserListParams = {}) => {
  const queryParams = {
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
  return response.data;
  // await new Promise((resolve) => setTimeout(resolve, 1000));
  // return manageProfileMockData
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

export const exportProfileList = async (params: UserListParams = {}) => {
  const url = getProfileExportUrl(params);
  const response = await userServiceApi.get(url);
  const base64Data = response.data?.data;
  generateFile(base64Data);
  return response; // Return the response to track completion
};
