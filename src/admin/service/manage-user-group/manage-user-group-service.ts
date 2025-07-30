import { useMutation, useQuery } from '@tanstack/react-query';
import { userServiceApi } from '../../../api/api';
import { UserListParams } from '../../types/manage-user';
import { getUserGroupListUrl } from '../urls';
import {
  ActiveUserForGroupApiResponse,
  FetchUsersByAccountBody,
  ProjectListByAccountsApiResponse,
  UserGroupApiResponse,
  UserGroupDetails,
  UserGroupDetailsApiResponse,
  UserGroupParam,
  UserGroupTypesApiResponse,
  UserGroupUpdateDetails,
} from '../../types';
import { buildQueryString, generateFile } from '../helpers';

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
  refreshUserGroupTrigger?: number
) => {
  return useQuery<UserGroupApiResponse, Error>({
    queryKey: ['manageUserGroup', params, refreshUserGroupTrigger],
    queryFn: () => fetchManageUserGroupList(params),
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    retry: 0,
    enabled: !!refreshUserGroupTrigger,
  });
};

export const getUserGroupExportUrl = (params: UserListParams = {}) => {
  const queryParams: Record<string, unknown> = {
    sortBy: params.sortBy || 'createdAt',
    sortOrder: params.sortOrder || 'DESC',
    filters: params.filters,
  };
  return `/api/user_group/export?${buildQueryString(queryParams)}`;
};

export const exportUserGroupList = async (params: UserListParams = {}) => {
  const url = getUserGroupExportUrl(params);
  const response = await userServiceApi.get(url);
  const base64Data = response.data?.data;
  generateFile(base64Data, 'user_group_records');
  return response; // Return the response to track completion
};

export const fetchUserGroupTypes = async (queryParams: UserGroupParam) => {
  const response = await userServiceApi.get<UserGroupTypesApiResponse>(
    `/api/user_group/groupType?${buildQueryString(queryParams)}`
  );
  return response.data;
};

export const useGetUserGroupTypes = (queryParams: UserGroupParam) => {
  return useQuery<UserGroupTypesApiResponse, Error>({
    queryKey: ['getUserGroupTypes'],
    queryFn: () => fetchUserGroupTypes(queryParams),
    retry: 0,
    staleTime: Infinity, // Cache data forever until manually invalidated
    gcTime: Infinity, // Never delete from cache
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};

export const fetchUsersByAccount = async (
  body: FetchUsersByAccountBody
): Promise<ActiveUserForGroupApiResponse> => {
  try {
    const { data } = await userServiceApi.post<ActiveUserForGroupApiResponse>(
      '/api/user_group/listUsers',
      body
    );
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

export const useGetUsersByAccount = () => {
  return useMutation<
    ActiveUserForGroupApiResponse,
    Error,
    FetchUsersByAccountBody
  >({
    mutationFn: (body) => fetchUsersByAccount(body),
  });
};

export const fetchProjectsByAccount = async (body: UserGroupParam) => {
  const response = await userServiceApi.post<ProjectListByAccountsApiResponse>(
    `/api/user_group/projects-of-accounts`,
    body
  );
  return response.data;
};

export const useGetprojectByAccount = () => {
  return useMutation<ProjectListByAccountsApiResponse, Error, UserGroupParam>({
    mutationFn: (body) => fetchProjectsByAccount(body),
  });
};

export const fetchUserGroupDetails = async (groupId: string) => {
  const response = await userServiceApi.get<UserGroupDetailsApiResponse>(
    `/api/user_group/list/${groupId}`
  );
  return response.data;
};

export const useGetUserGroupDetails = (groupId: string) => {
  return useQuery<UserGroupDetailsApiResponse, Error>({
    queryKey: ['getUserGroupDetails'],
    queryFn: () => fetchUserGroupDetails(groupId),
    retry: 0,
    enabled: !!groupId,
  });
};

export const createUserGroup = async (
  body: UserGroupDetails
): Promise<UserGroupApiResponse> => {
  try {
    const { data } = await userServiceApi.post<UserGroupApiResponse>(
      '/api/user_group/create',
      body
    );
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

export const useCreateUserGroup = () => {
  return useMutation<UserGroupApiResponse, Error, UserGroupDetails>({
    mutationFn: (body) => createUserGroup(body),
  });
};

export const updateUserGroup = async (
  body: UserGroupUpdateDetails
): Promise<UserGroupApiResponse> => {
  try {
    const { data } = await userServiceApi.post<UserGroupApiResponse>(
      '/api/user_group/update',
      body
    );
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

export const useUpdateUserGroup = () => {
  return useMutation<UserGroupApiResponse, Error, UserGroupUpdateDetails>({
    mutationFn: (body) => updateUserGroup(body),
  });
};
