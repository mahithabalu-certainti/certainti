import { useQuery } from '@tanstack/react-query';
import { mockInteractionHistory } from '../../pages/project/project-details/interactions/interaction-history/mock-response';
import { InteractionHistoryData } from '../../pages/account-details-sidebar/sidebar-pages/interactions/interaction-history/utils';

export const useInteractionHistoryList = (
  interactionHistoryId: string,
  enabled: boolean
) => {
  return useQuery<InteractionHistoryData, Error>({
    queryKey: ['interactionHistory', interactionHistoryId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return mockInteractionHistory;
    },
    enabled: enabled,
  });
};
