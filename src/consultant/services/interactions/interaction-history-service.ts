import { useQuery } from '@tanstack/react-query';
import { mockInteractionHistory } from '../../pages/project/project-details/interactions/interaction-history/mock-response';
import { InteractionHistoryData } from '../../pages/project/project-details/interactions/interaction-history/utils';

export const useInteractionHistoryList = (
  interactionHistoryId: string,
  enabled: boolean,
  refreshTrigger?: number
) => {
  return useQuery<InteractionHistoryData, Error>({
    queryKey: ['interactionHistory', interactionHistoryId, refreshTrigger],
    queryFn: async () => {
      // a mock async function
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return mockInteractionHistory;
    },
    enabled: enabled,
    staleTime: 0,
    gcTime: 0,
  });
};
