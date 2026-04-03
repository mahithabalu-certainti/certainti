import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import type { AxiosError } from 'axios';
import {
  useCalendarEventById,
  useCalendarEvents,
  useCalendarMetadata,
  useCancelCalendarEvent,
  type CalendarEventSummary,
} from '../../../../services/interactions/calendar-service';

type RangeMode = 'day' | 'week' | 'month';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Left-pads numeric date values for ISO-style date formatting.
 *
 * Input:
 * - `value`: numeric date or time segment.
 *
 * Output:
 * - Returns a two-character string.
 */
const pad = (value: number) => `${value}`.padStart(2, '0');

/**
 * Returns a copy of the supplied date pinned to the start of the day.
 *
 * Input:
 * - `date`: source date.
 *
 * Output:
 * - Returns a new date set to `00:00:00.000`.
 */
const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

/**
 * Returns a copy of the supplied date pinned to the end of the day.
 *
 * Input:
 * - `date`: source date.
 *
 * Output:
 * - Returns a new date set to `23:59:59.999`.
 */
const endOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

/**
 * Calculates the first day of the visible week for a date anchor.
 *
 * Input:
 * - `date`: source date.
 *
 * Output:
 * - Returns the week start date at local midnight.
 */
const startOfWeek = (date: Date) => {
  const next = startOfDay(date);
  next.setDate(next.getDate() - next.getDay());
  return next;
};

/**
 * Calculates the final day of the visible week for a date anchor.
 *
 * Input:
 * - `date`: source date.
 *
 * Output:
 * - Returns the week end date at local end-of-day.
 */
const endOfWeek = (date: Date) => {
  const next = startOfWeek(date);
  next.setDate(next.getDate() + 6);
  next.setHours(23, 59, 59, 999);
  return next;
};

/**
 * Calculates the first day of the visible month for a date anchor.
 *
 * Input:
 * - `date`: source date.
 *
 * Output:
 * - Returns the first day of the current month.
 */
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

/**
 * Calculates the final day of the visible month for a date anchor.
 *
 * Input:
 * - `date`: source date.
 *
 * Output:
 * - Returns the last day of the current month at local end-of-day.
 */
const endOfMonth = (date: Date) => {
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  next.setHours(23, 59, 59, 999);
  return next;
};

/**
 * Formats a `Date` object as `YYYY-MM-DD`.
 *
 * Input:
 * - `date`: source date.
 *
 * Output:
 * - Returns an ISO-like local date key used by the calendar UI.
 */
const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * Extracts the raw `YYYY-MM-DD` date portion from a calendar timestamp.
 *
 * Input:
 * - `value`: calendar event timestamp string.
 *
 * Output:
 * - Returns the date key when present, otherwise `null`.
 */
const getRawDateKey = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] || null;
};

/**
 * Safely parses an optional calendar timestamp.
 *
 * Input:
 * - `value`: calendar timestamp string.
 *
 * Output:
 * - Returns a valid `Date` instance or `null` when parsing fails.
 */
const parseDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Formats the time portion of a calendar event for list display.
 *
 * Input:
 * - `value`: calendar timestamp string.
 *
 * Output:
 * - Returns a localized time string or `All day`.
 */
const formatTime = (value?: string | null) => {
  if (!value) return 'All day';
  const match = value.match(/T(\d{2}):(\d{2})/);
  if (!match) return 'All day';
  const date = new Date(2026, 0, 1, Number(match[1]), Number(match[2]));
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * Formats a date heading used by the grouped calendar event list.
 *
 * Input:
 * - `isoDate`: date key in `YYYY-MM-DD` format.
 *
 * Output:
 * - Returns a human-readable heading with weekday, month, day, and year.
 */
const formatDateHeading = (isoDate: string) => {
  const parsed = new Date(`${isoDate}T00:00:00`);
  return parsed.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Formats a timestamp for the event details panel.
 *
 * Input:
 * - `value`: calendar timestamp string.
 *
 * Output:
 * - Returns a localized date-time string or `-` when unavailable.
 */
const formatDateTime = (value?: string | null) => {
  const parsed = parseDate(value);
  if (!parsed) return '-';
  return parsed.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * Removes HTML markup from calendar body content before previewing it in the UI.
 *
 * Input:
 * - `html`: raw HTML body content.
 *
 * Output:
 * - Returns a compact plain-text string.
 */
const stripHtml = (html?: string | null) =>
  (html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Maps the raw attendee response code to a readable label.
 *
 * Input:
 * - `status`: attendee response status from the backend.
 *
 * Output:
 * - Returns a UI-friendly response label.
 */
const responseLabel = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'accepted':
      return 'Accepted';
    case 'declined':
      return 'Declined';
    case 'tentativelyaccepted':
    case 'tentative':
      return 'Tentative';
    case 'notresponded':
      return 'Not responded';
    default:
      return status || 'Unknown';
  }
};

/**
 * Maps the attendee response code to the badge styling used in the UI.
 *
 * Input:
 * - `status`: attendee response status from the backend.
 *
 * Output:
 * - Returns the CSS utility classes for the response badge.
 */
const responseColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'accepted':
      return 'bg-[#E6F4EA] text-[#1E6A3A]';
    case 'declined':
      return 'bg-[#FCE8EA] text-[#B42318]';
    case 'tentativelyaccepted':
    case 'tentative':
      return 'bg-[#FEF3D6] text-[#8A6116]';
    default:
      return 'bg-[#F3F2F1] text-[#605E5C]';
  }
};

/**
 * Builds the visible range title for the current day, week, or month mode.
 *
 * Input:
 * - `mode`: current calendar range mode.
 * - `anchorDate`: selected anchor date.
 *
 * Output:
 * - Returns the heading text for the current calendar range.
 */
const rangeLabel = (mode: RangeMode, anchorDate: Date) => {
  if (mode === 'day') {
    return formatDateHeading(toIsoDate(anchorDate));
  }

  if (mode === 'week') {
    const start = startOfWeek(anchorDate);
    const end = endOfWeek(anchorDate);
    const startLabel = start.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
    const endLabel = end.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${startLabel} - ${endLabel}`;
  }

  return `${MONTH_NAMES[anchorDate.getMonth()]} ${anchorDate.getFullYear()}`;
};

const Calendar = () => {
  const { accountid } = useParams();
  const [rangeMode, setRangeMode] = useState<RangeMode>('month');
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date()));
  const [searchText, setSearchText] = useState('');
  const deferredSearch = useDeferredValue(searchText.trim());
  const [selectedEventId, setSelectedEventId] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelComment, setCancelComment] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [splitPercent, setSplitPercent] = useState(50);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ startX: number; startPercent: number } | null>(
    null
  );

  const {
    data: metadata,
    isLoading: isMetadataLoading,
    isError: isMetadataError,
    error: metadataError,
  } = useCalendarMetadata(accountid || '');

  const dateRange = useMemo(() => {
    if (rangeMode === 'day') {
      return {
        start: startOfDay(anchorDate).toISOString(),
        end: endOfDay(anchorDate).toISOString(),
      };
    }

    if (rangeMode === 'week') {
      return {
        start: startOfWeek(anchorDate).toISOString(),
        end: endOfWeek(anchorDate).toISOString(),
      };
    }

    return {
      start: startOfMonth(anchorDate).toISOString(),
      end: endOfMonth(anchorDate).toISOString(),
    };
  }, [anchorDate, rangeMode]);

  const {
    data: calendarEvents,
    isLoading: isEventsLoading,
    isError: isEventsError,
    error: eventsError,
  } = useCalendarEvents({
    accountRid: accountid || '',
    startDate: dateRange.start,
    endDate: dateRange.end,
    search: deferredSearch,
    limit: 300,
  });

  const events = useMemo(() => {
    const next = [...(calendarEvents?.events || [])];
    next.sort((a, b) => {
      const left = parseDate(a.start)?.getTime() || 0;
      const right = parseDate(b.start)?.getTime() || 0;
      return left - right;
    });
    return next;
  }, [calendarEvents]);

  useEffect(() => {
    if (selectedEventId && events.some((event) => event.event_id === selectedEventId)) {
      return;
    }
    setSelectedEventId(events[0]?.event_id || '');
  }, [events, selectedEventId]);

  const groupedEvents = useMemo(() => {
    const grouped = new Map<string, CalendarEventSummary[]>();

    events.forEach((event) => {
      const key =
        getRawDateKey(event.start) ||
        (parseDate(event.start) ? toIsoDate(parseDate(event.start) as Date) : null);

      if (!key) return;

      const current = grouped.get(key) || [];
      current.push(event);
      grouped.set(key, current);
    });

    return Array.from(grouped.entries()).map(([date, items]) => ({
      date,
      items,
    }));
  }, [events]);

  const {
    data: eventDetail,
    isLoading: isDetailLoading,
  } = useCalendarEventById(accountid || '', selectedEventId || undefined);

  const cancelMutation = useCancelCalendarEvent();

  const errorMessage =
    ((metadataError || eventsError) as AxiosError<{ message?: string }>)?.response?.data?.message ||
    'Unable to load the calendar for this account.';

  // Check if error is due to missing calendar configuration
  const isNoEmailConfigError = errorMessage?.toLowerCase().includes('calendar is not configured');

  const handleShift = (direction: -1 | 1) => {
    const next = new Date(anchorDate);
    if (rangeMode === 'day') {
      next.setDate(next.getDate() + direction);
    } else if (rangeMode === 'week') {
      next.setDate(next.getDate() + direction * 7);
    } else {
      next.setMonth(next.getMonth() + direction);
    }
    setAnchorDate(startOfDay(next));
  };

  const handleToday = () => {
    const today = startOfDay(new Date());
    setAnchorDate(today);
  };

  const handleCopyLink = async () => {
    if (!eventDetail?.join_link) return;
    try {
      await navigator.clipboard.writeText(eventDetail.join_link);
      setCopiedLink(true);
    } catch {
      setCopiedLink(false);
    }
  };

  useEffect(() => {
    if (!copiedLink) return;
    const timeout = window.setTimeout(() => setCopiedLink(false), 1500);
    return () => window.clearTimeout(timeout);
  }, [copiedLink]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStateRef.current || !containerRef.current) return;

      const bounds = containerRef.current.getBoundingClientRect();
      if (!bounds.width) return;

      const deltaX = event.clientX - dragStateRef.current.startX;
      const deltaPercent = (deltaX / bounds.width) * 100;
      const nextPercent = dragStateRef.current.startPercent + deltaPercent;

      setSplitPercent(Math.min(Math.max(nextPercent, 28), 72));
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const handleCancelInvite = async () => {
    if (!accountid || !selectedEventId) return;
    try {
      await cancelMutation.mutateAsync({
        accountRid: accountid,
        eventId: selectedEventId,
        comment: cancelComment || undefined,
      });
      setCancelDialogOpen(false);
      setCancelComment('');
    } catch {
      // Shown in UI
    }
  };

  const descriptionText =
    stripHtml(eventDetail?.body?.content) ||
    eventDetail?.body_preview ||
    'No additional description is available.';

  const selectedEventDateLabel = useMemo(() => {
    if (!eventDetail?.start) return '-';
    const rawDateKey = getRawDateKey(eventDetail.start);
    if (rawDateKey) return formatDateHeading(rawDateKey);
    const parsed = parseDate(eventDetail.start);
    return parsed ? formatDateHeading(toIsoDate(parsed)) : '-';
  }, [eventDetail?.start]);

  return (
    <div className='flex h-full min-h-[calc(100vh-11rem)] w-full overflow-hidden rounded-2xl border border-[#E1DFDD] bg-[#FAF9F8]'>
      <div className='flex min-w-0 flex-1 flex-col bg-white'>
        <div className='border-b border-[#E1DFDD] px-6 py-4'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div>
              <h1 className='text-[22px] font-semibold text-[#323130]'>Calendar</h1>
              <p className='mt-1 text-sm text-[#605E5C]'>
                {isMetadataLoading
                  ? 'Loading calendar owner...'
                  : metadata?.calendar_owner_email || 'Connected Microsoft 365 calendar'}
              </p>
            </div>

            <div className='flex flex-wrap items-center gap-3'>
              <div className='flex overflow-hidden rounded-lg border border-[#D2D0CE] bg-white'>
                {(['day', 'week', 'month'] as RangeMode[]).map((mode) => (
                  <button
                    key={mode}
                    type='button'
                    onClick={() => setRangeMode(mode)}
                    className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                      rangeMode === mode
                        ? 'bg-[#0F6CBD] text-white'
                        : 'text-[#323130] hover:bg-[#F3F2F1]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => handleShift(-1)}
                  className='rounded-lg border border-[#D2D0CE] px-3 py-2 text-sm font-medium text-[#323130] hover:bg-[#F3F2F1]'
                >
                  Prev
                </button>
                <button
                  type='button'
                  onClick={handleToday}
                  className='rounded-lg border border-[#D2D0CE] px-3 py-2 text-sm font-medium text-[#323130] hover:bg-[#F3F2F1]'
                >
                  Today
                </button>
                <button
                  type='button'
                  onClick={() => handleShift(1)}
                  className='rounded-lg border border-[#D2D0CE] px-3 py-2 text-sm font-medium text-[#323130] hover:bg-[#F3F2F1]'
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
            <p className='text-base font-semibold text-[#323130]'>
              {rangeLabel(rangeMode, anchorDate)}
            </p>

            <div className='flex w-full max-w-xl flex-wrap items-center justify-end gap-3'>
              <label className='mr-1 flex items-center gap-2 rounded-lg border border-[#D2D0CE] bg-white px-3 py-2 text-sm text-[#323130]'>
                <span className='text-xs font-semibold uppercase tracking-wide text-[#605E5C]'>
                  Date
                </span>
                <span className='text-[13px] font-medium text-[#323130]'>
                  {anchorDate.toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <input
                  type='date'
                  value={toIsoDate(anchorDate)}
                  onChange={(event) => {
                    if (!event.target.value) return;
                    const next = new Date(`${event.target.value}T00:00:00`);
                    if (Number.isNaN(next.getTime())) return;
                    setAnchorDate(startOfDay(next));
                  }}
                  className='w-[18px] cursor-pointer border-0 bg-transparent text-transparent outline-none'
                />
              </label>
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder='Search meetings'
                className='w-full max-w-xs rounded-lg border border-[#D2D0CE] px-3 py-2 text-sm text-[#323130] outline-none placeholder:text-[#8A8886] focus:border-[#0F6CBD]'
              />
            </div>
          </div>
        </div>

        {isMetadataError || isEventsError ? (
          isNoEmailConfigError ? (
            <div className='flex h-full flex-col'>
              <div className='flex items-center gap-3 bg-[#FFEBEE] px-4 py-3 border-b border-[#EF5350]'>
                <div className='h-5 w-5 rounded-full bg-[#D32F2F] flex items-center justify-center flex-shrink-0'>
                  <span className='text-white text-xs font-bold'>!</span>
                </div>
                <p className='text-[14px] font-medium text-[#B71C1C]'>
                  Calendar isn't configured for this account. Configure it in account settings.
                </p>
              </div>
              <div className='flex-1 bg-[#FAFAFA]' />
            </div>
          ) : (
            <div className='m-6 rounded-xl border border-[#F3D6D8] bg-[#FDF3F4] px-4 py-3 text-sm text-[#A4262C]'>
              {errorMessage}
            </div>
          )
        ) : (
          <div className='flex min-h-0 flex-1' ref={containerRef}>
          <div
            className='flex min-w-0 flex-col bg-[#FAF9F8]'
            style={{ flexBasis: `${splitPercent}%`, flexGrow: 0, flexShrink: 0 }}
          >
            {(isMetadataLoading || isEventsLoading) && !events.length ? (
              <div className='flex flex-1 items-center justify-center'>
                <CircularProgress size={26} />
              </div>
            ) : groupedEvents.length ? (
              <div className='min-h-0 flex-1 overflow-y-auto px-2 py-2'>
                <div className='space-y-3'>
                  {groupedEvents.map((group) => (
                    <section key={group.date}>
                      <div className='sticky top-0 z-10 mb-1 rounded-md bg-[#FAF9F8] py-1'>
                        <h2 className='text-[11px] font-semibold uppercase tracking-wide text-[#605E5C]'>
                          {formatDateHeading(group.date)}
                        </h2>
                      </div>

                      <div className='space-y-1.5'>
                        {group.items.map((event) => {
                          const isSelected = event.event_id === selectedEventId;
                          return (
                            <button
                              key={event.event_id}
                              type='button'
                              onClick={() => setSelectedEventId(event.event_id)}
                              className={`flex w-full flex-col rounded-lg border px-2.5 py-2 text-left transition-all ${
                                isSelected
                                  ? 'border-[#B7D7F0] bg-[#F6FAFD] shadow-[0_4px_12px_rgba(15,108,189,0.08)]'
                                  : 'border-[#E1DFDD] bg-white hover:border-[#D6E6F5] hover:bg-[#FCFCFC]'
                              }`}
                            >
                              <div className='flex flex-wrap items-start justify-between gap-1.5'>
                                <div className='min-w-0 flex-1'>
                                  <div className='flex flex-wrap items-center gap-1'>
                                    <p className='line-clamp-1 text-[13px] font-semibold leading-5 text-[#323130]'>
                                      {event.subject}
                                    </p>
                                    <span
                                      className={`rounded-full px-1.5 py-[2px] text-[9px] font-semibold ${responseColor(
                                        event.response_status
                                      )}`}
                                    >
                                      {responseLabel(event.response_status)}
                                    </span>
                                  </div>

                                  <div className='mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] leading-4 text-[#605E5C]'>
                                    <span>
                                      {event.is_all_day
                                        ? 'All day'
                                        : `${formatTime(event.start)} - ${formatTime(event.end)}`}
                                    </span>
                                    <span className='line-clamp-1'>
                                      {event.organizer_name || event.organizer_email || 'Organizer unavailable'}
                                    </span>
                                    {event.location_display_name ? (
                                      <span className='line-clamp-1'>{event.location_display_name}</span>
                                    ) : null}
                                  </div>
                                </div>

                                <div className='flex flex-wrap items-center gap-1'>
                                  {event.has_join_link ? (
                                    <span className='rounded-full bg-[#EEF3F8] px-1.5 py-[2px] text-[9px] font-semibold text-[#35526B]'>
                                      Online
                                    </span>
                                  ) : null}
                                  {event.can_cancel ? (
                                    <span className='rounded-full bg-[#F3F2F1] px-1.5 py-[2px] text-[9px] font-semibold text-[#605E5C]'>
                                      Cancel
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            ) : (
              <div className='flex flex-1 items-center justify-center px-8 text-center text-sm text-[#605E5C]'>
                No meetings were found for this calendar range.
              </div>
            )}
          </div>

          <div
            role='separator'
            aria-orientation='vertical'
            aria-label='Resize calendar panels'
            tabIndex={0}
            onPointerDown={(event) => {
              dragStateRef.current = {
                startX: event.clientX,
                startPercent: splitPercent,
              };
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') {
                setSplitPercent((current) => Math.max(current - 2, 28));
              }
              if (event.key === 'ArrowRight') {
                setSplitPercent((current) => Math.min(current + 2, 72));
              }
            }}
            className='group relative w-2 cursor-col-resize bg-[#F3F2F1] transition-colors hover:bg-[#D2D0CE] focus:bg-[#D2D0CE] focus:outline-none'
          >
            <div className='absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 rounded-full bg-[#C8C6C4] group-hover:bg-[#8A8886] group-focus:bg-[#8A8886]' />
          </div>

          <aside
            className='flex min-w-0 flex-1 flex-col bg-white'
            style={{ flexBasis: `${100 - splitPercent}%` }}
          >
            <div className='border-b border-[#E1DFDD] px-4 py-3'>
              <p className='text-[11px] font-semibold uppercase tracking-wider text-[#605E5C]'>
                Event details
              </p>
            </div>

            {isDetailLoading ? (
              <div className='flex flex-1 items-center justify-center'>
                <CircularProgress size={24} />
              </div>
            ) : eventDetail ? (
              <div className='min-h-0 flex-1 overflow-y-auto px-4 py-4'>
                <div className='space-y-4'>
                  <div>
                    <h3 className='text-lg font-semibold leading-6 text-[#323130]'>
                      {eventDetail.subject}
                    </h3>
                    <div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
                      <span
                        className={`rounded-full px-2 py-[3px] text-[10px] font-semibold ${responseColor(
                          eventDetail.response_status
                        )}`}
                      >
                        {responseLabel(eventDetail.response_status)}
                      </span>
                      {eventDetail.is_online_meeting ? (
                        <span className='rounded-full bg-[#EEF3F8] px-2 py-[3px] text-[10px] font-semibold text-[#35526B]'>
                          {eventDetail.online_meeting_provider || 'Online meeting'}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-2 rounded-xl border border-[#E1DFDD] bg-[#FAF9F8] p-3'>
                    <div className='rounded-lg bg-white px-3 py-2'>
                      <p className='text-[10px] font-semibold uppercase tracking-wide text-[#605E5C]'>
                        Date
                      </p>
                      <p className='mt-1 text-[13px] font-medium leading-5 text-[#323130]'>
                        {selectedEventDateLabel}
                      </p>
                    </div>

                    <div className='rounded-lg bg-white px-3 py-2'>
                      <p className='text-[10px] font-semibold uppercase tracking-wide text-[#605E5C]'>
                        Starts
                      </p>
                      <p className='mt-1 text-[13px] leading-5 text-[#323130]'>
                        {formatDateTime(eventDetail.start)}
                      </p>
                    </div>

                    <div className='rounded-lg bg-white px-3 py-2'>
                      <p className='text-[10px] font-semibold uppercase tracking-wide text-[#605E5C]'>
                        Ends
                      </p>
                      <p className='mt-1 text-[13px] leading-5 text-[#323130]'>
                        {formatDateTime(eventDetail.end)}
                      </p>
                    </div>

                    <div className='rounded-lg bg-white px-3 py-2'>
                      <p className='text-[10px] font-semibold uppercase tracking-wide text-[#605E5C]'>
                        Organizer
                      </p>
                      <p className='mt-1 text-[13px] leading-5 text-[#323130]'>
                        {eventDetail.organizer_name || eventDetail.organizer_email || '-'}
                      </p>
                    </div>

                    {eventDetail.location_display_name ? (
                      <div className='col-span-2 rounded-lg bg-white px-3 py-2'>
                        <p className='text-[10px] font-semibold uppercase tracking-wide text-[#605E5C]'>
                          Location
                        </p>
                        <p className='mt-1 text-[13px] leading-5 text-[#323130]'>
                          {eventDetail.location_display_name}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <p className='text-[10px] font-semibold uppercase tracking-wide text-[#605E5C]'>
                      Description
                    </p>
                    <p className='mt-1.5 text-[13px] leading-5 text-[#323130]'>
                      {descriptionText}
                    </p>
                  </div>

                  {eventDetail.attendees?.length ? (
                    <div>
                      <p className='text-[10px] font-semibold uppercase tracking-wide text-[#605E5C]'>
                        Attendees
                      </p>
                      <div className='mt-1.5 space-y-1.5'>
                        {eventDetail.attendees.map((attendee) => (
                          <div
                            key={`${attendee.email}-${attendee.type}`}
                            className='rounded-lg border border-[#E1DFDD] px-2.5 py-2'
                          >
                            <p className='text-[13px] font-medium text-[#323130]'>
                              {attendee.name || attendee.email}
                            </p>
                            <p className='text-[11px] text-[#605E5C]'>{attendee.email}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {eventDetail.join_link ? (
                    <div className='rounded-xl border border-[#D6E6F5] bg-[#F6FAFD] p-3'>
                      <p className='text-[10px] font-semibold uppercase tracking-wide text-[#0F548C]'>
                        Meeting link
                      </p>
                      <a
                        href={eventDetail.join_link}
                        target='_blank'
                        rel='noreferrer'
                        className='mt-1.5 block break-all text-[13px] font-medium text-[#0F6CBD] underline'
                      >
                        {eventDetail.join_link}
                      </a>

                      <div className='mt-2.5 flex gap-2'>
                        <button
                          type='button'
                          onClick={handleCopyLink}
                          className='rounded-lg border border-[#0F6CBD] px-3 py-1.5 text-[12px] font-medium text-[#0F6CBD] hover:bg-[#EEF4FB]'
                        >
                          {copiedLink ? 'Copied' : 'Copy link'}
                        </button>
                        <a
                          href={eventDetail.join_link}
                          target='_blank'
                          rel='noreferrer'
                          className='rounded-lg bg-[#0F6CBD] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#0C5DA5]'
                        >
                          Open meeting
                        </a>
                      </div>
                    </div>
                  ) : null}

                  {metadata?.allowed_actions.cancel_invite && eventDetail.can_cancel ? (
                    <div>
                      <button
                        type='button'
                        onClick={() => setCancelDialogOpen(true)}
                        className='w-full rounded-lg border border-[#A4262C] px-4 py-2.5 text-[12px] font-semibold text-[#A4262C] hover:bg-[#FDF3F4]'
                      >
                        Cancel invite
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className='flex flex-1 items-center justify-center px-8 text-center text-sm text-[#605E5C]'>
                Select a meeting to see its details.
              </div>
            )}
          </aside>
        </div>
        )}
      </div>

      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Cancel meeting invite</DialogTitle>
        <DialogContent>
          <p className='mb-4 text-sm text-[#605E5C]'>
            This will cancel the invite from the connected Microsoft 365 calendar and
            notify the attendees.
          </p>
          <textarea
            value={cancelComment}
            onChange={(event) => setCancelComment(event.target.value)}
            rows={4}
            placeholder='Optional cancellation note'
            className='w-full rounded-lg border border-[#D2D0CE] px-3 py-2 text-sm outline-none focus:border-[#0078D4]'
          />

        </DialogContent>
        <DialogActions>
          <button
            type='button'
            onClick={() => setCancelDialogOpen(false)}
            className='rounded-lg px-4 py-2 text-sm font-medium text-[#323130] hover:bg-[#F3F2F1]'
          >
            Close
          </button>
          <button
            type='button'
            onClick={handleCancelInvite}
            disabled={cancelMutation.isPending}
            className='rounded-lg bg-[#A4262C] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60'
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel invite'}
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Calendar;
