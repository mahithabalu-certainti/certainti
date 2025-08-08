/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import { ProjectDetailUrl } from '../urls';
import { resourceServiceApi } from '../../../api/api';

/**
 * Fetches detailed information for a specific project
 * @param projectId - The ID of the project
 * @param accountId - The account ID associated with the project
 * @returns Project detail object
 */
export const fetchProjectDetail = async (
  projectId: string,
  accountId: string
): Promise<any> => {
  try {
    const response = await resourceServiceApi.get<any>(
      ProjectDetailUrl(projectId, accountId)
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching project details:', error);
    throw error;
  }
};

/**
 * React Query hook for fetching project details
 * @param projectId - The ID of the project
 * @param accountId - The account ID
 * @returns React Query result containing the project detail and query status
 */
export const useProjectDetail = (
  projectId: string,
  accountId: string,
  refreshTrigger?: number
) => {
  return useQuery<any, Error>({
    queryKey: ['projectDetail', projectId, accountId, refreshTrigger],
    queryFn: () => fetchProjectDetail(projectId, accountId),
    enabled: !!projectId && !!accountId,
    gcTime: 0,
    retry: 2,
  });
};
