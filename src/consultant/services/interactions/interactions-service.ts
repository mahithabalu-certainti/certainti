import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  InteractionDetails,
  //   InteractionDetailsResponse,
  InteractionList,
  InteractionListURLParams,
} from '../../types';
import {
  mockInteractionDetailsMap,
  mockInteractionList,
} from '../../pages/project/project-details/interactions/mock-response';
// import { resourceServiceApi } from '../../../api/api';

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
    count: mockInteractionList.data.count,
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
    queryKey: ['interactionList', params, refreshInteractions],
    queryFn: () => fetchInteractionList(params),
    retry: 0,
    gcTime: 0,
    enabled: !!params.accountRid && !!shouldFetchList,
  });
};

const fetchInteractionDetails = async (
  projectid: string,
  interactionId: string
): Promise<InteractionDetails> => {
  //   const response = await resourceServiceApi.get<InteractionDetailsResponse>(
  //     getInteractionDetailsURL(projectid, interactionId)
  //   );

  //   return response.data.data.interactions;
  console.log('projectid', projectid);
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const interaction = mockInteractionDetailsMap[interactionId];
  if (!interaction) throw new Error('Interaction not found');

  return interaction;
};

export const useInteractionDetails = (
  projectid?: string,
  interactionId?: string
): UseQueryResult<InteractionDetails | undefined, Error> => {
  return useQuery<InteractionDetails | undefined, Error>({
    queryKey: ['interaction-details', projectid, interactionId],
    queryFn: () => fetchInteractionDetails(projectid!, interactionId!),
    retry: 0,
    gcTime: 0,
    enabled: !!interactionId && !!projectid,
  });
};
