import { useMutation, useQuery } from '@tanstack/react-query';
import { userServiceApi } from '../../../api/api';
import {
  ManageProfileApiResponse,
  UserListParams,
} from '../../types/manage-user';
import { getProfileExportUrl, getProfileListUrl } from '../urls';
import { generateFile } from '../helpers';
import { CommonProfileApiResponse, ProfileApiResponse } from '../../../common-service';
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Privilege as _Privilege,
  ProfileDetail,
  CommonProfilePermissionApiResponse,
  ProfilePermission,
} from '../../types/manage-profile';
import { profileDetailsMockData } from '../../mockdata';

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

export const useManageProfileList = (
  params: UserListParams = {},
  refreshProfileTrigger?: number
) => {
  return useQuery<ManageProfileApiResponse, Error>({
    queryKey: ['manageProfile', params, refreshProfileTrigger],
    queryFn: () => fetchManageProfileList(params),
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    retry: 0,
  });
};

export const exportProfileList = async (profileId: string) => {
  const url = getProfileExportUrl(profileId);
  const response = await userServiceApi.get(url);
  const base64Data = response.data?.data;
  generateFile(base64Data);
  return response; // Return the response to track completion
};

/**
 * Create detailed information for a profile
 * @returns Promise with user details
 */
export const createProfileDetails = async (
  body: Partial<ProfileDetail>
): Promise<CommonProfileApiResponse> => {
  try {
    const { data } = await userServiceApi.post<CommonProfileApiResponse>(
      getCreateProfileUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

/**
 * React Query mutation hook for create profile details
 * @returns UseMutationResult for create profile details
 */
export const useCreateProfileDetails = () => {
  return useMutation<CommonProfileApiResponse, Error, Partial<ProfileDetail>>({
    mutationFn: (body) => createProfileDetails({ ...body }),
  });
};

export const getCreateProfileUrl = (): string => {
  return `/api/user/profile/clone`;
};

/**
 * Create detailed information for a profile permission
 * @returns Promise with user details
 */
export const createProfilePermission = async (
  body: Partial<ProfilePermission>
): Promise<CommonProfilePermissionApiResponse> => {
  try {
    const { data } =
      await userServiceApi.put<CommonProfilePermissionApiResponse>(
        getCreateProfilePermissionUrl(),
        body
      );
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

/**
 * React Query mutation hook for create profile details
 * @returns UseMutationResult for create profile details
 */
export const useCreateProfilePermission = () => {
  return useMutation<
    CommonProfilePermissionApiResponse,
    Error,
    Partial<ProfilePermission>
  >({
    mutationFn: (body) => createProfilePermission({ ...body }),
  });
};

export const getCreateProfilePermissionUrl = (): string => {
  return `/api/user/profile/permissions`;
};

/**
 * get detailed information for a profile
 * @returns Promise with user details
 */
export const getProfileDetails = async (
  profileId: string
): Promise<ProfileApiResponse> => {
  try {
    // const { data } = await userServiceApi.get<ProfileApiResponse>(
    //   getProfileDetailsUrl(profileId)
    // );
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return profileDetailsMockData;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

/**
 * React Query hook for fetching profile details by ID
 * @param profileId - The ID of the profile to fetch
 * @returns UseQueryResult for profile details
 */
export const useGetProfileDetails = (profileId: string) => {
  return useQuery<ProfileApiResponse, Error>({
    queryKey: ['profileDetail', profileId], // Unique query key
    queryFn: () => getProfileDetails(profileId),
    enabled: !!profileId, // Only fetch if userId exists
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    retry: 0,
  });
};

export const getProfileDetailsUrl = (profileId: string): string => {
  return `/api/user/profile/${profileId}/permissions`;
};

/**
 * Update detailed information for a profile permission
 * @returns Promise with user details
 */
export const updateProfilePermission = async (
  body: Partial<ProfilePermission>
): Promise<CommonProfileApiResponse> => {
  try {
    const { data } = await userServiceApi.put<CommonProfileApiResponse>(
      updateProfilePermissionUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

/**
 * React Query mutation hook for update profile details
 * @returns UseMutationResult for update profile details
 */
export const useUpdateProfilePermission = () => {
  return useMutation<
    CommonProfileApiResponse,
    Error,
    Partial<ProfilePermission>
  >({
    mutationFn: (body) => updateProfilePermission({ ...body }),
  });
};

export const updateProfilePermissionUrl = (): string => {
  return `/api/user/profile/permissions/edit`;
};
