import { useQuery, UseQueryResult } from '@tanstack/react-query';

import {
  InteractionDetails,
  InteractionDetailsResponse,
  InteractionListURLParams,
  ResponseInteractionList,
  ResponseInteractionListResponse,
  ResponseListURLParams,
} from '../../types';
// import { mockResponse } from '../../pages/project/project-details/interactions/response-history/mockresponse';
import { interactionServiceApi } from '../../../api/api';
import {
  getInteractionResponseHistoryDetailsURL,
  getInteractionResponseHistroyListUrl,
} from '../urls';

export const fetchInteractionList = async (
  params: InteractionListURLParams
): Promise<{ interactions: ResponseInteractionList[]; count: number }> => {
  // console.log('interaction-params', params);
  // await new Promise((resolve) => setTimeout(resolve, 3000));
  const { data } =
    await interactionServiceApi.post<ResponseInteractionListResponse>(
      getInteractionResponseHistroyListUrl(),
      params
    );

  return {
    interactions: data.data.response_history,
    count: data.data.totalCount,
  };
};
export const useInteractionResponseHistoryList = (
  params: InteractionListURLParams
  // shouldFetchList: boolean,
  // refreshInteractions?: number
): UseQueryResult<
  { interactions: ResponseInteractionList[]; count: number },
  Error
> => {
  return useQuery<
    { interactions: ResponseInteractionList[]; count: number },
    Error
  >({
    queryKey: ['interaction-list', params],
    queryFn: () => fetchInteractionList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.account_rid && !!params.fiscal_year,
  });
};

const fetchResponseInteractionDetails = async (
  params: ResponseListURLParams
): Promise<InteractionDetails> => {
  const response = await interactionServiceApi.post<InteractionDetailsResponse>(
    getInteractionResponseHistoryDetailsURL(),
    params
  );
  // return {
  //   interactions: response.data.response_history,
  //   count: response.data.totalCount,
  // };
  return response.data.data.interactionDetails;
};

export const useResponseInteractionDetails = (
  params: ResponseListURLParams
): UseQueryResult<InteractionDetails | undefined, Error> => {
  return useQuery<InteractionDetails | undefined, Error>({
    queryKey: ['response-interaction-details', params],
    queryFn: () => fetchResponseInteractionDetails(params),
    retry: 0,
    gcTime: 0,
    enabled:
      !!params.account_rid && !!params.interaction_rid && !!params.version,
  });
};
