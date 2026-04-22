import { useQuery } from '@tanstack/react-query';
import {
  InteractionAttachmentApiResponse,
  InteractionAttachmentListParams,
} from '../../types';
import { interactionServiceApi } from '../../../api/api';
import { getInteractionAttachmentListUrl } from '../urls/interactions-url';

export const fetchInteractionAttachmentList = async (
  params: InteractionAttachmentListParams
): Promise<InteractionAttachmentApiResponse> => {
  const { data } =
    await interactionServiceApi.post<InteractionAttachmentApiResponse>(
      getInteractionAttachmentListUrl(),
      params
    );
  return data;
};

export const useGetInteractionAttachmentList = (
  params: InteractionAttachmentListParams = {},
  refreshTrigger?: number
) => {
  return useQuery<InteractionAttachmentApiResponse, Error>({
    queryKey: ['interactionAttachment', params, refreshTrigger],
    queryFn: () => fetchInteractionAttachmentList(params),
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    retry: 0,
    enabled: !!params.interaction_rid,
  });
};
