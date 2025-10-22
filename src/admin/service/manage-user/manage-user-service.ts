import { useMutation, useQuery } from '@tanstack/react-query';
import { accountServiceApi, userServiceApi } from '../../../api/api';
import {
  CommonApiResponse,
  UpdateExtendedPermission,
} from '../../../common-service';
import {
  ManageUserApiResponse,
  ManageUserDetailApiResponse,
  UserDetail,
  UserListParams,
  UserProfileApiResponse,
  UserRolesApiResponse,
  UserPermissionApiResponse,
  OrgNameApiResponse,
  UpdateUserResponse,
} from '../../types/manage-user';
import {
  getUserExportUrl,
  getUserListUrl,
  getUserProfileListURL,
} from '../urls';
import { generateFile } from '../helpers';
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
    ...(params.search && { search: params.search }),
  };

  const url = getUserListUrl(queryParams);
  const response = await userServiceApi.get<ManageUserApiResponse>(url);
  return response.data;
};

export const useManageUserList = (
  params: UserListParams = {},
  refreshUserTrigger?: number
) => {
  return useQuery<ManageUserApiResponse, Error>({
    queryKey: ['manageUsers', params, refreshUserTrigger],
    queryFn: () => fetchManageUserList(params),
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    // enabled: !!refreshUserTrigger,
  });
};

export const exportUserList = async (params: UserListParams = {}) => {
  const url = getUserExportUrl(params);
  const response = await userServiceApi.get(url);
  const base64Data = response.data?.data;
  generateFile(base64Data, 'User_Details');
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
    retry: 0,
    refetchOnWindowFocus: false,
    gcTime: 0,
    staleTime: 0,
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
): Promise<UpdateUserResponse> => {
  try {
    const { data } = await userServiceApi.put<UpdateUserResponse>(
      getUpdateUserUrl(),
      body
    );
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
  return useMutation<UpdateUserResponse, Error, Partial<UserDetail>>({
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

/**
 * Assign permission to user
 * @returns Promise with user details
 */
export const extendedPermissionToUser = async (
  userId: string
): Promise<UserPermissionApiResponse> => {
  try {
    const { data } = await userServiceApi.get<UserPermissionApiResponse>(
      getUserExtendedPermissionUrl(userId)
    );
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

/**
 * React Query hook for extended permission to user by userId
 * @param userId - The ID of the user to fetch
 * @returns UseQueryResult for profile details
 */

export const useExtendedPermissionToUser = (userId: string) => {
  return useQuery<UserPermissionApiResponse, Error>({
    queryKey: ['extendedPermission', userId], // Unique query key
    queryFn: () => extendedPermissionToUser(userId),
    enabled: !!userId, // Only fetch if userId exists
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    retry: 0,
  });
};

export const getUserExtendedPermissionUrl = (userId: string): string => {
  return `/api/user/${userId}/permission/extended`;
};

export const getExtendedPermissionUrl = (): string => {
  return `/api/user/permission/extended/edit`;
};

export const updateExtendedPermission = async (
  body: Partial<UpdateExtendedPermission>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await userServiceApi.put<CommonApiResponse>(
      getExtendedPermissionUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

export const useUpdateExtendedPermission = () => {
  return useMutation<
    CommonApiResponse,
    Error,
    Partial<UpdateExtendedPermission>
  >({
    mutationFn: (body) => updateExtendedPermission(body),
  });
};

export const getOrgNameUrl = (): string => {
  return `/api/accounts/listOrgAccounts`;
};

/**
 * Fetches informatio about the organasation name
 * @returns Promise with org details
 */

export const fetchOrgNames = async (): Promise<OrgNameApiResponse> => {
  try {
    const { data } =
      await accountServiceApi.get<OrgNameApiResponse>(getOrgNameUrl());
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

/**
 * React Query hook for fetching organasation name (view only)
 * @returns UseQueryResult with org name list and query state
 */
export const useFetchOrgNames = () => {
  return useQuery<OrgNameApiResponse, Error>({
    queryKey: ['org-name-lists'], // Unique query key
    queryFn: () => fetchOrgNames(),
    retry: 0,
  });
};

export const fetchUserProfileList =
  async (): Promise<UserProfileApiResponse> => {
    try {
      const { data } = await userServiceApi.get<UserProfileApiResponse>(
        getUserProfileListURL()
      );
      return data;
    } catch (error) {
      console.error('Error fetching user profile list:', error);
      throw error;
    }
  };

export const useGetUserProfileList = () => {
  return useQuery<UserProfileApiResponse, Error>({
    queryKey: ['user-profile-list'],
    queryFn: () => fetchUserProfileList(),
    retry: 0,
  });
};
