import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { resourceServiceApi } from '../../../api/api';
import {
  CostListParms,
  FinancialProjectCostList,
} from '../../types/account-financial';
import {
  getProjectCostListURL,
  getResourceCostListURL,
} from '../urls/account-financial-url';

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

export const fetchProjectCostList = async (
  accountId: string,
  fiscalYear: string,
  params: CostListParms
): Promise<{ costs: FinancialProjectCostList[]; count: number }> => {
  const url = getProjectCostListURL(accountId, fiscalYear, params);
  const response = await resourceServiceApi.get(url);
  return {
    costs: response.data.data.summaries,
    count: response.data.data.count,
  };
};
export const useProjectCostList = (
  accountId: string,
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
      fiscalYear,
      params,
      refreshTrigger,
    ],
    queryFn: () => fetchProjectCostList(accountId, fiscalYear, params),
    retry: 0,
    gcTime: 0,
    enabled: !!accountId && !!fiscalYear,
  });
};
