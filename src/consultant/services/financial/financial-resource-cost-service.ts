import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  ResourceCostFinancialHighlight,
  ResourceCostFinancialHighlightListParams,
  ResourceCostFinancialHighlightResponse,
} from '../../types';
import { resourceServiceApi } from '../../../api/api';

const getFinancialHighlightsListURL = (
  params: ResourceCostFinancialHighlightListParams
): string => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    search: params.search ?? '',
    sortBy: params.sortBy ?? 'project_name',
    sortOrder: params.sortOrder ?? 'ASC',
    accountNumber: params.accountNumber,
    fiscalYear: String(params.fiscalYear),
    account_rid: params.account_rid,
  });
  return `/api/resource_cost/financial-highlights/list?${query.toString()}`;
};

export const fetchResourceCostFinancialHighlights = async (
  params: ResourceCostFinancialHighlightListParams
): Promise<ResourceCostFinancialHighlight> => {
  const url = getFinancialHighlightsListURL(params);
  const response =
    await resourceServiceApi.get<ResourceCostFinancialHighlightResponse>(url);
  return response.data.data;
};

export const useResourceCostFinancialHighlights = (
  params: ResourceCostFinancialHighlightListParams,
  refreshKey?: number
): UseQueryResult<ResourceCostFinancialHighlight, Error> => {
  return useQuery<ResourceCostFinancialHighlight, Error>({
    queryKey: [
      'resourceCostFinancialHighlights',
      params.account_rid,
      params.fiscalYear,
      params.accountNumber,
      refreshKey,
    ],
    queryFn: () => fetchResourceCostFinancialHighlights(params),
    retry: 0,
    gcTime: 0,
    enabled:
      !!params.account_rid && !!params.fiscalYear && !!params.accountNumber,
  });
};
