import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  InteractionDetails,
  InteractionFormData,
  //   InteractionDetailsResponse,
  InteractionList,
  InteractionListURLParams,
} from '../../types';
import {
  mockInteractionDetailsMap,
  mockInteractionList,
} from '../../pages/project/project-details/interactions/mock-response';
import { resourceServiceApi } from '../../../api/api';
import { CommonApiResponse } from '../../../common-service';

// const getInteractionDetailsURL = (projectid: string, interactionId: string) => {
//   return `/api/interaction/list/${projectid}/${interactionId}`;
// };

export const fetchInteractionList = async (
  params: InteractionListURLParams
): Promise<{ interactions: InteractionList[]; count: number }> => {
  console.log('interaction-params', params);
  await new Promise((resolve) => setTimeout(resolve, 3000));

  return {
    interactions: mockInteractionList.data.interactions,
    count: mockInteractionList.data.totalRecords,
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
    enabled:
      !!params.account_rid &&
      params.fiscal_year !== undefined &&
      params.fiscal_year !== null &&
      !!shouldFetchList,
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
  //   const response = await resourceServiceApi.get<InteractionDetailsResponse>(
  //     getInteractionDetailsURL(accountId, interactionId)
  //   );

  //   return response.data.data.interactions;
  console.log('accountId', accountId);
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const interaction = mockInteractionDetailsMap[interactionId];
  if (!interaction) throw new Error('Interaction not found');

  return interaction;
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
  return `/api/interaction/create`;
};

export const createInteraction = async (
  body: Partial<InteractionFormData>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await resourceServiceApi.post<CommonApiResponse>(
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
  return useMutation<CommonApiResponse, Error, Partial<InteractionFormData>>({
    mutationFn: (body) => createInteraction({ ...body }),
  });
};

export const getUpdateInteractionUrl = (): string => {
  return `/api/interaction/update`;
};

export const updateInteractionDetails = async (
  body: Partial<InteractionFormData>
): Promise<CommonApiResponse> => {
  try {
    const { data } = await resourceServiceApi.put<CommonApiResponse>(
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
  return useMutation<CommonApiResponse, Error, Partial<InteractionFormData>>({
    mutationFn: (body) => updateInteractionDetails({ ...body }),
  });
};
