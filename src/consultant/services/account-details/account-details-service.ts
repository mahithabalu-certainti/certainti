import { useQuery } from '@tanstack/react-query';
import { accountServiceApi } from '../../../api/api';
import { AccountDetailUrl } from '../urls';
import { AccountFieldsApiResponse } from '../../types';

/**
 * Fetches detailed information for a specific user
 * @param accountId - The ID of the user to fetch
 * @returns Promise with user details
 */
export const fetchAccountDetail = async (
  accountId: string
): Promise<AccountFieldsApiResponse> => {
  try {
    const response = await accountServiceApi.get<AccountFieldsApiResponse>(
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
export const useAccountDetail = (
  accountId: string,
  isAccountDetailsEnable?: boolean,
  refreshTrigger?: number
) => {
  return useQuery<AccountFieldsApiResponse, Error>({
    queryKey: ['accountDetail', accountId, refreshTrigger], // Unique query key
    queryFn: () => fetchAccountDetail(accountId),
    enabled: !!accountId && isAccountDetailsEnable, // Only fetch if userId exists
    gcTime: 0,
    retry: 0,
  });
};
