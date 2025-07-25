import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { ProjectFinancialSummary } from '../../types';
import { mockProjectFinancialSummay } from '../../pages/project/project-details/financial-highlights/mock-response';

// const FinancialSummaryURL = (accountId: string, projectId: string) => {
//   return `/api/financial-summary/detail/${accountId}/${projectId}`;
// };

export const fetchProjectFinancialSummary = async (
  accountId: string,
  projectId: string
): Promise<ProjectFinancialSummary> => {
  //   const response =
  //     await resourceServiceApi.get<ProjectFinancialSummaryResponse>(
  //       FinancialSummaryURL(accountId, projectId)
  //     );
  //   return response.data.data
  console.log(accountId, projectId);
  return mockProjectFinancialSummay.data;
};

export const useProjectFinancialSummary = (
  accountId: string,
  projectId: string,
  refreshSummary?: number
): UseQueryResult<ProjectFinancialSummary, Error> => {
  return useQuery<ProjectFinancialSummary, Error>({
    queryKey: ['projectFinancialSummary', projectId, accountId, refreshSummary],
    queryFn: () => fetchProjectFinancialSummary(accountId, projectId),
    retry: 0,
    gcTime: 0,
    enabled: !!projectId && !!accountId,
  });
};
