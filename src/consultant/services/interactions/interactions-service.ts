import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  InteractionDetails,
  InteractionFormPayload,
  InteractionDetailsResponse,
  InteractionList,
  InteractionListResponse,
  InteractionListURLParams,
} from '../../types';
import { interactionServiceApi } from '../../../api/api';
import { CommonApiResponse } from '../../../common-service';
import { getInteractionListUrl } from '../urls/interactions-url';

const getInteractionDetailsURL = (accountId: string, interactionId: string) => {
  return `/api/interactions/detail/${accountId}/${interactionId}`;
};

export const fetchInteractionList = async (
  params: InteractionListURLParams
): Promise<{ interactions: InteractionList[]; count: number }> => {
  const { data } = await interactionServiceApi.post<InteractionListResponse>(
    getInteractionListUrl(),
    params
  );
  return {
    interactions: data.data.interactions,
    count: data.data.totalCount,
  };
};

export const useInteractionList = (
  params: InteractionListURLParams,
  shouldFetchList: boolean,
  refreshInteractions?: number
): UseQueryResult<
  { interactions: InteractionList[]; count: number },
  Error
> => {
  return useQuery<{ interactions: InteractionList[]; count: number }, Error>({
    queryKey: ['interaction-list', params, refreshInteractions],
    queryFn: () => fetchInteractionList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.account_rid && !!params.fiscal_year && !!shouldFetchList,
  });
};

export const useGetAllInteractionList = (
  params: InteractionListURLParams,
  refreshTrigger?: number
): UseQueryResult<
  { interactions: InteractionList[]; count: number },
  Error
> => {
  return useQuery<{ interactions: InteractionList[]; count: number }, Error>({
    queryKey: ['all-interaction-list', params, refreshTrigger],
    queryFn: () => fetchInteractionList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.isGlobal,
  });
};

const fetchInteractionDetails = async (
  accountId: string,
  interactionId: string
): Promise<InteractionDetails> => {
  const response = await interactionServiceApi.get<InteractionDetailsResponse>(
    getInteractionDetailsURL(accountId, interactionId)
  );

  return response.data.data.interactionDetails;
};

export const useInteractionDetails = (
  accountId?: string,
  interactionId?: string
): UseQueryResult<InteractionDetails | undefined, Error> => {
  return useQuery<InteractionDetails | undefined, Error>({
    queryKey: ['interaction-details', accountId, interactionId],
    queryFn: () => fetchInteractionDetails(accountId!, interactionId!),
    retry: 0,
    gcTime: 0,
    enabled: !!interactionId && !!accountId,
  });
};

// Create & Edit
export const getCreateInteractionUrl = (): string => {
  return `/api/interactions/new`;
};

export const createInteraction = async (
  body: Partial<InteractionFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await interactionServiceApi.post<CommonApiResponse>(
      getCreateInteractionUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error create interaction:', error);
    throw error;
  }
};

export const useCreateInteraction = () => {
  return useMutation<CommonApiResponse, Error, Partial<InteractionFormPayload>>(
    {
      mutationFn: (body) => createInteraction({ ...body }),
    }
  );
};

export const getUpdateInteractionUrl = (): string => {
  return `/api/interactions/update`;
};

export const updateInteractionDetails = async (
  body: Partial<InteractionFormPayload>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await interactionServiceApi.put<CommonApiResponse>(
      getUpdateInteractionUrl(),
      body
    );
    return data;
  } catch (error) {
    console.error('Error updating interaction details:', error);
    throw error;
  }
};

export const useUpdateInteractionDetails = () => {
  return useMutation<CommonApiResponse, Error, Partial<InteractionFormPayload>>(
    {
      mutationFn: (body) => updateInteractionDetails({ ...body }),
    }
  );
};
