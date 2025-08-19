import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { InteractionListURLParams, responseInteractionList } from '../../types';
import { mockResponse } from '../../pages/project/project-details/interactions/response-history/mockresponse';

export const fetchInteractionList = async (
  params: InteractionListURLParams
): Promise<{ interactions: responseInteractionList[]; count: number }> => {
  console.log('interaction-params', params);
  await new Promise((resolve) => setTimeout(resolve, 3000));

  return {
    interactions: mockResponse.data.response_history,
    count: mockResponse.data.totalCount,
  };
};
export const useInteractionList = (
  params: InteractionListURLParams,
  shouldFetchList: boolean,
  refreshInteractions?: number
): UseQueryResult<
  { interactions: responseInteractionList[]; count: number },
  Error
> => {
  return useQuery<
    { interactions: responseInteractionList[]; count: number },
    Error
  >({
    queryKey: ['interaction-list', params, refreshInteractions],
    queryFn: () => fetchInteractionList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.account_rid && !!params.fiscal_year && !!shouldFetchList,
  });
};
