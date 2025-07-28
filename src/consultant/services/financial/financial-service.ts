import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  FinancialSummaryApiResponse,
  FinancialSummaryBody,
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
    queryKey: [
      'projectFinancialSummary',
      params.account_rid,
      params.project_fiscal_rid,
      refreshSummary,
    ],
    queryFn: () => fetchProjectFinancialSummary(params),
    retry: 0,
    gcTime: 0,
    enabled:
      !!params.account_rid &&
      !!params.project_fiscal_rid &&
      !!params.fiscal_year,
  });
};

export const getFinancialSummary = async (
  body: FinancialSummaryBody
): Promise<FinancialSummaryApiResponse> => {
  try {
    const { data } = await resourceServiceApi.post<FinancialSummaryApiResponse>(
      '/api/financialHighlight/list',
      body
    );
    return data;
  } catch (error) {
    console.error('Error fetching highlights details:', error);
    throw error;
  }
};

export const useGetFinancialSummary = () => {
  return useMutation<FinancialSummaryApiResponse, Error, FinancialSummaryBody>({
    mutationFn: (body) => getFinancialSummary(body),
  });
};
