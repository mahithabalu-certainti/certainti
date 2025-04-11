/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import { accountServiceApi } from '../../../api/api';
import { AccountDetailUrl } from '../urls';

export const fetchResourceDetail = async (resourceId: string): Promise<any> => {
  try {
    const response = await accountServiceApi.get<any>(
      AccountDetailUrl(resourceId)
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

export const useResourceDetail = (resourceId: string) => {
  return useQuery<any, Error>({
    queryKey: ['resourceDetail', resourceId], // Unique query key
    queryFn: () => fetchResourceDetail(resourceId),
    enabled: !!resourceId, // Only fetch if userId exists
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 2, // Retry up to 2 times on failure
  });
};
