import { useQuery } from '@tanstack/react-query';
import {
  InteractionHistoryRequest,
  InteractionHistoryResponse,
} from '../../types/interaction';
import { interactionServiceApi } from '../../../api/api';
import { getInteractionHistoryUrl } from '../urls';

export const getInteractionHistory = async (
  payload: InteractionHistoryRequest
): Promise<InteractionHistoryResponse> => {
  const response = await interactionServiceApi.post(
    getInteractionHistoryUrl(),
    payload
  );
  return response.data;
};

export const useInteractionHistoryList = (
  payload: InteractionHistoryRequest,
  refreshTrigger?: number
) => {
  return useQuery<InteractionHistoryResponse, Error>({
    queryKey: ['interactionHistory', payload, refreshTrigger],
    queryFn: () => getInteractionHistory(payload),
    enabled: !!payload.account_rid && !!payload.interaction_rid,
    staleTime: 0,
    gcTime: 0,
  });
};
