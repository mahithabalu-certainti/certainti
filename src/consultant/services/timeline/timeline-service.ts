import { useQuery } from '@tanstack/react-query';
import { accountServiceApi } from '../../../api/api';
import { TimelineListApiResponse, TimelineParams } from '../../types/timeline';

export const getTimelineListUrl = (params: TimelineParams): string => {
  const queryParams = new URLSearchParams({
    entityType: params.entityType,
    nextOffset: String(params.nextOffset),
    limit: String(params.limit),
  });

  if (params.account_rid) {
    queryParams.append('accountId', params.account_rid);
  }

  if (params.entityType === 'project' && params.project_rid) {
    queryParams.append('projectId', params.project_rid);
  } else if (params.entityType === 'case' && params.case_rid) {
    queryParams.append('caseId', params.case_rid);
  }

  return `/api/accounts/fetchTimelines?${queryParams.toString()}`;
};
export const fetchTimelineList = async (params: TimelineParams) => {
  const url = getTimelineListUrl(params);
  const response = await accountServiceApi.get<TimelineListApiResponse>(url);
  return response.data;
};

export const useTimelineList = (
  params: TimelineParams,
  isTimeLineView?: boolean,
  refreshTrigger?: number
) => {
  return useQuery<TimelineListApiResponse, Error>({
    queryKey: ['timeline-list', params, refreshTrigger],
    queryFn: () => fetchTimelineList(params),
    staleTime: 0, // No cache
    gcTime: 0, // Immediately remove from cache
    enabled: !!params.account_rid && !!params.entityType && !!isTimeLineView,
  });
};
