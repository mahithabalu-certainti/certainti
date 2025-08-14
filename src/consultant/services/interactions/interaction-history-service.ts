import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { InteractionHistoryData } from '../../pages/project/project-details/interactions/interaction-history/utils';
import { mockInteractionHistory } from '../../pages/project/project-details/interactions/interaction-history/mock-response';

export const fetchInteractionHistory = async (
  interactionId: string
): Promise<InteractionHistoryData> => {
  console.log('interaction-history-params', interactionId);
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return mockInteractionHistory;
};

export const useInteractionHistory = (
  interactionId: string
): UseQueryResult<InteractionHistoryData, Error> => {
  return useQuery<InteractionHistoryData, Error>({
    queryKey: ['interaction-history', interactionId],
    queryFn: () => fetchInteractionHistory(interactionId),
    retry: 0,
    gcTime: 0,
    enabled: !!interactionId,
  });
};
