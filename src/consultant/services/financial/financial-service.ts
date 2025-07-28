import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  FinancialProjectCostList,
  CostListParms,
  ProjectFinancialSummary,
  ProjectFinancialSummaryListParams,
  ProjectFinancialSummaryResponse,
} from '../../types';
import { resourceServiceApi } from '../../../api/api';
import { getResourceCostListURL } from '../urls/account-financial-url';

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

export const fetchResourceCostList = async (
  accountId: string,
  accountNumber: string,
  fiscalYear: string,
  params: CostListParms
): Promise<{ costs: FinancialProjectCostList[]; count: number }> => {
  const url = getResourceCostListURL(
    accountId,
    accountNumber,
    fiscalYear,
    params
  );
  const response = await resourceServiceApi.get(url);
  return {
    costs: response.data.data.projectResourceFiscal,
    count: response.data.data.count,
  };
};
export const useResourceCostList = (
  accountId: string,
  accountNumber: string,
  fiscalYear: string,
  params: CostListParms,
  refreshTrigger?: number
): UseQueryResult<
  { costs: FinancialProjectCostList[]; count: number },
  Error
> => {
  return useQuery<{ costs: FinancialProjectCostList[]; count: number }, Error>({
    queryKey: [
      'projectCostList',
      accountId,
      accountNumber,
      fiscalYear,
      params,
      refreshTrigger,
    ],
    queryFn: () =>
      fetchResourceCostList(accountId, accountNumber, fiscalYear, params),
    retry: 0,
    gcTime: 0,
    enabled: !!accountId && !!accountNumber && !!fiscalYear,
  });
};
