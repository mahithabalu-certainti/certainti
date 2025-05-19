import { useMutation, useQuery } from '@tanstack/react-query';
import { userServiceApi } from '../../../api/api';
import { CommonApiResponse } from '../../../common-service';
import {
  ManageUserApiResponse,
  ManageUserDetailApiResponse,
  UserDetail,
  UserListParams,
  UserProfileApiResponse,
  UserRolesApiResponse,
} from '../../types/manage-user';
import { getUserExportUrl, getUserListUrl } from '../urls';
const ORGANIZATION = import.meta.env.VITE_ORGANIZATION;

export const fetchManageUserList = async (params: UserListParams = {}) => {
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

  const url = getUserListUrl(queryParams);
  const response = await userServiceApi.get<ManageUserApiResponse>(url);
  return response.data;
};

export const useManageUserList = (params: UserListParams = {}) => {
  return useQuery<ManageUserApiResponse, Error>({
    queryKey: ['manageUsers', params],
    queryFn: () => fetchManageUserList(params),
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
  });
};

export const exportUserList = async (params: UserListParams = {}) => {
  const url = getUserExportUrl(params);
  const response = await userServiceApi.get(url);

  const base64Data = response.data?.data;

  if (!base64Data) {
    console.error('No base64 data found in the response.');
    return;
  }

  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // Trigger download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'user_records.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getUserDetailUrl = (userId: string): string => {
  return `/api/user/${userId}?organization=${ORGANIZATION}`;
};

/**
 * Fetches detailed information for a specific user
 * @param userId - The ID of the user to fetch
 * @returns Promise with user details
 */
export const fetchManageUserDetail = async (
  userId: string
): Promise<ManageUserDetailApiResponse> => {
  try {
    const { data } = await userServiceApi.get<ManageUserDetailApiResponse>(
      getUserDetailUrl(userId)
    );
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

/**
 * React Query hook for fetching user details (view only)
 * @param userId - The ID of the user to fetch
 * @returns UseQueryResult with user details and query state
 */
export const useManageUserDetail = (userId: string) => {
  return useQuery<ManageUserDetailApiResponse, Error>({
    queryKey: ['userDetail', userId], // Unique query key
    queryFn: () => fetchManageUserDetail(userId),
    enabled: !!userId, // Only fetch if userId exists
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    retry: 0,
  });
};

export const getUserProfileUrl = (): string => {
  return `/api/user/profiles`;
};

/**
 * Fetches detailed information for a all user profile
 * @returns Promise with user details
 */
export const fetchUserProfile = async (): Promise<UserProfileApiResponse> => {
  try {
    const { data } =
      await userServiceApi.get<UserProfileApiResponse>(getUserProfileUrl());
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

/**
 * React Query hook for fetching user details (view only)
 * @returns UseQueryResult with user details and query state
 */
export const useManageUserProfile = () => {
  return useQuery<UserProfileApiResponse, Error>({
    queryKey: ['userProfile'], // Unique query key
    queryFn: () => fetchUserProfile(),
    retry: 0,
  });
};

export const getUpdateUserUrl = (): string => {
  return `/api/user/update`;
};

/**
 * Update detailed information for a user
 * @returns Promise with user details
 */
export const updateUserDetails = async (
  body: Partial<UserDetail>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await userServiceApi.put<CommonApiResponse>(
      getUpdateUserUrl(),
      body
    );
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

/**
 * React Query mutation hook for updating user details
 * @returns UseMutationResult for updating user details
 */
export const useUpdateUserDetails = () => {
  return useMutation<CommonApiResponse, Error, Partial<UserDetail>>({
    mutationFn: (body) =>
      updateUserDetails({ ...body, organization: ORGANIZATION }),
  });
};

export const getCreateUserUrl = (): string => {
  return `/api/user/create`;
};

/**
 * Create detailed information for a user
 * @returns Promise with user details
 */
export const createUserDetails = async (
  body: Partial<UserDetail>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await userServiceApi.post<CommonApiResponse>(
      getCreateUserUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

/**
 * React Query mutation hook for create user details
 * @returns UseMutationResult for create user details
 */
export const useCreateUserDetails = () => {
  return useMutation<CommonApiResponse, Error, Partial<UserDetail>>({
    mutationFn: (body) =>
      createUserDetails({ ...body, organization: ORGANIZATION }),
  });
};

export const getUserRolesUrl = (): string => {
  return `/api/user/roles`;
};

/**
 * Fetches detailed information for a all user roles
 * @returns Promise with user details
 */
export const fetchUserRoles = async (): Promise<UserRolesApiResponse> => {
  try {
    const { data } =
      await userServiceApi.get<UserRolesApiResponse>(getUserRolesUrl());
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

/**
 * React Query hook for fetching user roles (view only)
 * @returns UseQueryResult with user details and query state
 */
export const useManageUserRole = () => {
  return useQuery<UserRolesApiResponse, Error>({
    queryKey: ['userRoles'], // Unique query key
    queryFn: () => fetchUserRoles(),
    retry: 0,
  });
};
