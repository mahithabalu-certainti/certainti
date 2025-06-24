import { useQuery } from '@tanstack/react-query';
import { accountServiceApi, userServiceApi } from '../api/api';
import {
  GetAllCountriesApiResponse,
  GetCurrentUserRoleApiResponse,
  GetStatusApiResponse,
} from './';

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
    retry: 0,
    staleTime: Infinity, // Cache data forever until manually invalidated
    gcTime: Infinity, // Never delete from cache
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch on reconnect
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
  userId: string,
  idToken: string
): Promise<GetCurrentUserRoleApiResponse> => {
  try {
    const { data } = await userServiceApi.get<GetCurrentUserRoleApiResponse>(
      getCurrentUserRoleUrl(userId),
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

export const getStatusUrl = (): string => {
  return `/api/accounts/status`;
};

export const fetchStatus = async (): Promise<GetStatusApiResponse> => {
  try {
    const { data } =
      await accountServiceApi.get<GetStatusApiResponse>(getStatusUrl());
    return data;
  } catch (error) {
    console.error('Error fetching status list:', error);
    throw error;
  }
};

export const useGetStatus = () => {
  return useQuery<GetStatusApiResponse, Error>({
    queryKey: ['getStatus'],
    queryFn: () => fetchStatus(),
    retry: 0,
    staleTime: Infinity, // Cache data forever until manually invalidated
    gcTime: Infinity, // Never delete from cache
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};
