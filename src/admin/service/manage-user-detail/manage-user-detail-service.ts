import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
} from '@tanstack/react-query';
import { userServiceApi } from '../../../api/api';
import {
  ManageUserDetailApiResponse,
  UploadProfileResponse,
} from '../../types/admin-user-detail';
import { getUserDetailUrl } from '../urls';

/**
 * Fetches detailed information for a specific user
 * @param userId - The ID of the user to fetch
 * @returns Promise with user details
 */
export const fetchManageUserDetail = async (
  userId: string
): Promise<ManageUserDetailApiResponse> => {
  try {
    const response = await userServiceApi.get<ManageUserDetailApiResponse>(
      getUserDetailUrl(userId)
    );
    return response.data;
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
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 2, // Retry up to 2 times on failure
    refetchOnMount: 'always', // Refetch on mount
  });
};

const useApiMutationSericve = <T, V = void>(
  endpoint: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  options?: UseMutationOptions<T, Error, V>
): UseMutationResult<T, Error, V> => {
  return useMutation<T, Error, V>({
    mutationFn: async (data) => {
      const isFormData = data instanceof FormData;

      const response = await userServiceApi.request<T>({
        url: endpoint,
        method,
        data,
        headers: isFormData
          ? { 'Content-Type': 'multipart/form-data' }
          : { 'Content-Type': 'application/json' },
      });

      return response.data;
    },
    ...options,
  });
};

export const uploadProfileImageUrl = () => `/api/user/profile/upload`;

export const useUploadProfileImage = () => {
  return useApiMutationSericve<UploadProfileResponse, FormData>(
    uploadProfileImageUrl(),
    'post'
  );
};
