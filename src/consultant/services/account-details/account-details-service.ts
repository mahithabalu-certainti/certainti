/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import { accountServiceApi } from '../../../api/api';
import { AccountDetailUrl } from '../urls';

/**
 * Fetches detailed information for a specific user
 * @param accountId - The ID of the user to fetch
 * @returns Promise with user details
 */
export const fetchAccountDetail = async (accountId: string): Promise<any> => {
  try {
    const response = await accountServiceApi.get<any>(
      AccountDetailUrl(accountId)
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

/**
 * React Query hook for fetching user details (view only)
 * @param accountId - The ID of the user to fetch
 * @returns UseQueryResult with user details and query state
 */
export const useAccountDetail = (accountId: string, isAccountDetailsEnable?: boolean) => {
  return useQuery<any, Error>({
    queryKey: ['accountDetail', accountId], // Unique query key
    queryFn: () => fetchAccountDetail(accountId),
    enabled: !!accountId && isAccountDetailsEnable, // Only fetch if userId exists
    gcTime: 0, // 5 minutes cache
    retry: 0, // Retry up to 2 times on failure
  });
};
