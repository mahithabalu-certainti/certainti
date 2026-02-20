import { useQuery } from "@tanstack/react-query";
import { accountServiceApi } from "../../../api/api";
import { TimelineListApiResponse, TimelineParams } from "../../types/timeline";

export const getTimelineListUrl = (
    nextOffset: string | number,
    limit: number,
    accountId: string,
    entityType: string
): string => {
    return `/api/accounts/fetchTimelines?entityType=${entityType}&nextOffset=${nextOffset}&limit=${limit}&accountId=${accountId}`;
};
export const fetchTimelineList = async (
    params: TimelineParams
) => {
    const url = getTimelineListUrl(params.nextOffset, params.limit, params.account_rid, params.entityType);
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
        enabled: !!params.account_rid && !!params.entityType && isTimeLineView,
    });
};