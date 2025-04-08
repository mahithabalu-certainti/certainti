import { useQuery } from '@tanstack/react-query';
import { accountServiceApi, userServiceApi } from '../api/api';
import { GetAllCountriesApiResponse, GetCurrentUserRoleApiResponse } from './';

export const getAllCountriesUrl = (): string => {
  return `/api/accounts/country`;
};

/**
 * Fetches detailed information for a all country
 * @returns Promise with user details
 */
export const fetchAllCountries =
  async (): Promise<GetAllCountriesApiResponse> => {
    try {
      const { data } =
        await accountServiceApi.get<GetAllCountriesApiResponse>(
          getAllCountriesUrl()
        );
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      return data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  };

/**
 * React Query hook for fetching country list (view only)
 * @returns UseQueryResult with user details and query state
 */
export const useGetAllCountries = () => {
  return useQuery<GetAllCountriesApiResponse, Error>({
    queryKey: ['getAllCountry'], // Unique query key
    queryFn: () => fetchAllCountries(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 0,
  });
};

export const getCurrentUserRoleUrl = (id: string): string => {
  return `/api/user/${id}/permission`;
};

/**
 * Fetches current user Role (view only)
 * @returns Promise with user details
 */
export const fetchCurrentUserRole = async (
  userId: string
): Promise<GetCurrentUserRoleApiResponse> => {
  try {
    const { data } = await userServiceApi.get<GetCurrentUserRoleApiResponse>(
      getCurrentUserRoleUrl(userId)
    );
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};
