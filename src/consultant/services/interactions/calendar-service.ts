import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { interactionServiceApi } from '../../../api/api';

export interface CalendarMetadata {
  calendar_owner_email: string;
  mode: 'read_only';
  allowed_actions: {
    view_calendar: boolean;
    view_event_detail: boolean;
    view_join_link: boolean;
    cancel_invite: boolean;
    create_event: boolean;
    edit_event: boolean;
    delete_event: boolean;
  };
}

export interface CalendarEventSummary {
  event_id: string;
  subject: string;
  start: string | null;
  start_timezone: string | null;
  end: string | null;
  end_timezone: string | null;
  is_all_day: boolean;
  status: string;
  response_status: string;
  organizer_name: string;
  organizer_email: string;
  location_display_name: string;
  is_online_meeting: boolean;
  online_meeting_provider: string | null;
  has_join_link: boolean;
  join_link: string | null;
  join_link_source: string | null;
  web_link: string;
  can_cancel: boolean;
}

export interface CalendarEventDetail extends CalendarEventSummary {
  body_preview: string;
  body: {
    content_type: string;
    content: string;
  };
  attendees: {
    name: string;
    email: string;
    type: string;
    response_status: string;
  }[];
  created_datetime: string | null;
  modified_datetime: string | null;
  is_cancelled: boolean;
  importance: string;
  series_master_id: string | null;
  i_cal_u_id: string | null;
  transaction_id: string | null;
}

export interface CalendarEventsResponse {
  calendar_owner_email: string;
  range: {
    start_date: string;
    end_date: string;
  } | null;
  next_page_token: string | null;
  events: CalendarEventSummary[];
}

export interface CancelCalendarEventResponse {
  event_id: string;
  subject?: string;
  status: string;
  cancelled_by: string;
  already_cancelled: boolean;
}

export const fetchCalendarMetadata = async (
  accountRid: string
): Promise<CalendarMetadata> => {
  const { data } = await interactionServiceApi.get<{ data: CalendarMetadata }>(
    '/api/interactions/calendar/metadata',
    { params: { account_rid: accountRid } }
  );

  return data.data;
};

export const fetchCalendarEvents = async (params: {
  accountRid: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  pageToken?: string | null;
}): Promise<CalendarEventsResponse> => {
  const { data } = await interactionServiceApi.get<{ data: CalendarEventsResponse }>(
    '/api/interactions/calendar/events',
    {
      params: {
        account_rid: params.accountRid,
        start_date: params.startDate,
        end_date: params.endDate,
        search: params.search || undefined,
        limit: params.limit ?? 50,
        pageToken: params.pageToken || undefined,
      },
    }
  );

  return data.data;
};

export const fetchAllCalendarEvents = async (params: {
  accountRid: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
}): Promise<CalendarEventsResponse> => {
  const aggregatedEvents: CalendarEventSummary[] = [];
  let pageToken: string | null | undefined;
  let firstPageMetadata: Omit<CalendarEventsResponse, 'events' | 'next_page_token'> | null =
    null;

  do {
    const page = await fetchCalendarEvents({
      ...params,
      pageToken,
    });

    if (!firstPageMetadata) {
      firstPageMetadata = {
        calendar_owner_email: page.calendar_owner_email,
        range: page.range,
      };
    }

    aggregatedEvents.push(...page.events);
    pageToken = page.next_page_token;
  } while (pageToken);

  return {
    calendar_owner_email: firstPageMetadata?.calendar_owner_email || '',
    range: firstPageMetadata?.range || null,
    next_page_token: null,
    events: aggregatedEvents,
  };
};

export const fetchCalendarEventById = async (
  accountRid: string,
  eventId: string
): Promise<CalendarEventDetail> => {
  const { data } = await interactionServiceApi.get<{ data: CalendarEventDetail }>(
    `/api/interactions/calendar/events/${encodeURIComponent(eventId)}`,
    {
      params: {
        account_rid: accountRid,
      },
    }
  );

  return data.data;
};

export const postCancelCalendarEvent = async (params: {
  accountRid: string;
  eventId: string;
  comment?: string;
}): Promise<CancelCalendarEventResponse> => {
  const { data } = await interactionServiceApi.post<{
    data: CancelCalendarEventResponse;
  }>(`/api/interactions/calendar/events/${encodeURIComponent(params.eventId)}/cancel`, {
    account_rid: params.accountRid,
    comment: params.comment,
  });

  return data.data;
};

export const useCalendarMetadata = (accountRid: string) =>
  useQuery<CalendarMetadata, AxiosError>({
    queryKey: ['calendar-metadata', accountRid],
    queryFn: () => fetchCalendarMetadata(accountRid),
    enabled: Boolean(accountRid),
    retry: 0,
  });

export const useCalendarEvents = (params: {
  accountRid: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
}) =>
  useQuery<CalendarEventsResponse, AxiosError>({
    queryKey: ['calendar-events', params],
    queryFn: () => fetchAllCalendarEvents(params),
    enabled: Boolean(params.accountRid),
    retry: 0,
  });

export const useCalendarEventById = (accountRid: string, eventId?: string) =>
  useQuery<CalendarEventDetail, AxiosError>({
    queryKey: ['calendar-event-detail', accountRid, eventId],
    queryFn: () => fetchCalendarEventById(accountRid, eventId || ''),
    enabled: Boolean(accountRid && eventId),
    retry: 0,
  });

export const useCancelCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CancelCalendarEventResponse,
    AxiosError,
    { accountRid: string; eventId: string; comment?: string }
  >({
    mutationFn: postCancelCalendarEvent,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['calendar-events'],
      });
      queryClient.invalidateQueries({
        queryKey: ['calendar-event-detail', variables.accountRid, variables.eventId],
      });
    },
  });
};
