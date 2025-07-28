import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  ProjectFinancialSummary,
  ProjectFinancialSummaryListParams,
  ProjectFinancialSummaryResponse,
} from '../../types';
import { resourceServiceApi } from '../../../api/api';

const FinancialSummaryURL = () => {
  return `/api/financialHighlight/project`;
};

export const fetchProjectFinancialSummary = async (
  params: ProjectFinancialSummaryListParams
): Promise<ProjectFinancialSummary> => {
  const response =
    await resourceServiceApi.post<ProjectFinancialSummaryResponse>(
      FinancialSummaryURL(),
      params
    );
  return response.data.data;
};

export const useProjectFinancialSummary = (
  params: ProjectFinancialSummaryListParams,
  refreshSummary?: number
): UseQueryResult<ProjectFinancialSummary, Error> => {
  return useQuery<ProjectFinancialSummary, Error>({
    queryKey: ['projectFinancialSummary', params, refreshSummary],
    queryFn: () => fetchProjectFinancialSummary(params),
    retry: 0,
    gcTime: 0,
    enabled:
      !!params.account_rid &&
      !!params.project_fiscal_rid &&
      !!params.fiscal_year,
  });
};
