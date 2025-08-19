import { useQuery } from '@tanstack/react-query';
import { interactionAttachmentList } from '../../mockdata/interaction-attachment-list';
import {
  InteractionAttachmentApiResponse,
  InteractionAttachmentListParams,
} from '../../types';

export const fetchInteractionAttachmentList = async () =>
  // params: InteractionAttachmentListParams = {}
  {
    // const queryParams = {
    //   page: params.page || 1,
    //   limit: params.limit || 10,
    //   sortBy: params.sortBy || 'createdAt',
    //   sortOrder: params.sortOrder || 'DESC',
    //   filters: params.filters || {},
    //   ...(params.filters && { filters: params.filters }),
    //   ...(params.searchTerm && { search: params.searchTerm }),
    // };

    // const url = getProfileListUrl(queryParams);
    // const response = await userServiceApi.get<InteractionAttachmentApiResponse>(url);
    // return response.data;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return interactionAttachmentList;
  };

export const useGetInteractionAttachmentList = (
  params: InteractionAttachmentListParams = {},
  refreshTrigger?: number
) => {
  return useQuery<InteractionAttachmentApiResponse, Error>({
    queryKey: ['interactionAttachment', params, refreshTrigger],
    queryFn: () => fetchInteractionAttachmentList(),
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    retry: 0,
  });
};
