import { useQuery } from '@tanstack/react-query';
import { resourceServiceApi } from '../../../api/api';
import { QrePercentHistoryURL } from '../urls/qre-percent-history-url';
import {
  QrePercentHistoryParams,
  QrePercentHistoryResponse,
} from '../../types/qre-percent-history';

export const fetchQrePercentHistory = async (
  params: QrePercentHistoryParams
): Promise<QrePercentHistoryResponse> => {
  const { data } =
    await resourceServiceApi.post<QrePercentHistoryResponse>(
      QrePercentHistoryURL(),
      params
    );
  return data;
};

export const useGetQrePercentHistory = (
  params: QrePercentHistoryParams,
  refreshTrigger?: number
) => {
  return useQuery<QrePercentHistoryResponse, Error>({
    queryKey: ['qrePercentHistory', params, refreshTrigger],
    queryFn: () => fetchQrePercentHistory(params),
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    retry: 0,
    enabled: !!params.account_rid,
  });
};
