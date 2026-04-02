import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import type { AxiosError } from 'axios';
import {
  useCalendarEventById,
  useCalendarEvents,
  useCalendarMetadata,
  useCancelCalendarEvent,
  type CalendarEventSummary,
} from '../../../../services/interactions/calendar-service';

type CalendarViewMode = 'day' | 'week' | 'month';

type CalendarCell = {
  key: string;
  date: Date;
  isoDate: string;
  isCurrentMonth: boolean;
  isToday: boolean;
};

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 48; // px per hour in time grid

const pad = (v: number) => `${v}`.padStart(2, '0');
const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const getRawDateKey = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] || null;
};

const getRawMinutes = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/T(\d{2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const getEventDateKey = (value?: string | null) => {
  return getRawDateKey(value);
};

const getEventMinutes = (value?: string | null) => {
  return getRawMinutes(value);
};

const parseDate = (v?: string | null) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const startOfDay = (d: Date) => { const n = new Date(d); n.setHours(0, 0, 0, 0); return n; };
const endOfDay = (d: Date) => { const n = new Date(d); n.setHours(23, 59, 59, 999); return n; };
const startOfWeek = (d: Date) => { const n = startOfDay(d); n.setDate(n.getDate() - n.getDay()); return n; };
const endOfWeek = (d: Date) => { const n = startOfWeek(d); n.setDate(n.getDate() + 6); n.setHours(23, 59, 59, 999); return n; };
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const startOfCalGrid = (d: Date) => {
  const f = startOfMonth(d);
  return new Date(f.getFullYear(), f.getMonth(), f.getDate() - f.getDay());
};
const endOfCalGrid = (d: Date) => {
  const l = endOfMonth(d);
  return new Date(l.getFullYear(), l.getMonth(), l.getDate() + (6 - l.getDay()));
};

const formatHour = (h: number) => {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
};

const formatTime = (v?: string | null, timeZone?: string | null) => {
  const rawMinutes = getEventMinutes(v);
  if (rawMinutes === null) {
    const d = parseDate(v);
    if (!d) return 'All day';
    return d.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timeZone || undefined,
    });
  }
  const hours = Math.floor(rawMinutes / 60);
  const minutes = rawMinutes % 60;
  const date = new Date(2026, 0, 1, hours, minutes);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const formatDateTime = (v?: string | null, timeZone?: string | null) => {
  const d = parseDate(v);
  if (!d) return '-';
  return d.toLocaleString([], {
    weekday: 'short', month: 'short', day: 'numeric',
    year: 'numeric', hour: 'numeric', minute: '2-digit',
    timeZone: timeZone || undefined,
  });
};

const formatMonthYear = (d: Date) => `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

const createMonthCells = (month: Date): CalendarCell[] => {
  const todayIso = toIsoDate(new Date());
  const cursor = new Date(startOfCalGrid(month));
  const end = endOfCalGrid(month);
  const cells: CalendarCell[] = [];
  while (cursor <= end) {
    const c = new Date(cursor);
    cells.push({
      key: c.toISOString(),
      date: c,
      isoDate: toIsoDate(c),
      isCurrentMonth: c.getMonth() === month.getMonth(),
      isToday: toIsoDate(c) === todayIso,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
};

const createWeekCells = (anchor: Date): CalendarCell[] => {
  const todayIso = toIsoDate(new Date());
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return {
      key: d.toISOString(),
      date: d,
      isoDate: toIsoDate(d),
      isCurrentMonth: true,
      isToday: toIsoDate(d) === todayIso,
    };
  });
};

type TimeSlot = { top: number; height: number; startMins: number; endMins: number };

const getTimeSlot = (
  start: string | null,
  end: string | null
): TimeSlot | null => {
  const startMins = getEventMinutes(start);
  if (startMins === null) return null;
  const parsedEndMins = getEventMinutes(end);
  const endMins = Math.max(parsedEndMins ?? startMins + 30, startMins + 30);
  return {
    top: (startMins / 60) * HOUR_HEIGHT,
    height: ((endMins - startMins) / 60) * HOUR_HEIGHT,
    startMins,
    endMins,
  };
};

type ColumnInfo = { col: number; totalCols: number };

const assignColumns = (events: CalendarEventSummary[]): Map<string, ColumnInfo> => {
  const result = new Map<string, ColumnInfo>();
  const timed = events.filter(e => !e.is_all_day);
  const sorted = [...timed].sort(
    (a, b) => (parseDate(a.start)?.getTime() || 0) - (parseDate(b.start)?.getTime() || 0),
  );
  const colEnds: number[] = [];
  const tempAssign = new Map<string, number>();
  sorted.forEach(event => {
    const slot = getTimeSlot(event.start, event.end);
    if (!slot) return;
    let col = 0;
    while (colEnds[col] !== undefined && colEnds[col] > slot.startMins) col++;
    colEnds[col] = slot.endMins;
    tempAssign.set(event.event_id, col);
  });
  const totalCols = Math.max(colEnds.length, 1);
  tempAssign.forEach((col, id) => result.set(id, { col, totalCols }));
  return result;
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconChevronLeft = () => (
  <svg width='16' height='16' viewBox='0 0 16 16' fill='none'>
    <path d='M10 3L5 8L10 13' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
  </svg>
);

const IconChevronRight = () => (
  <svg width='16' height='16' viewBox='0 0 16 16' fill='none'>
    <path d='M6 3L11 8L6 13' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
  </svg>
);

const IconSearch = () => (
  <svg width='14' height='14' viewBox='0 0 16 16' fill='none'>
    <circle cx='6.5' cy='6.5' r='4.5' stroke='currentColor' strokeWidth='1.5' />
    <path d='M10 10L14 14' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
  </svg>
);

const IconVideo = () => (
  <svg width='12' height='12' viewBox='0 0 16 16' fill='none'>
    <rect x='1' y='4' width='10' height='8' rx='1.5' stroke='currentColor' strokeWidth='1.5' />
    <path d='M11 7L15 5V11L11 9V7Z' stroke='currentColor' strokeWidth='1.5' strokeLinejoin='round' />
  </svg>
);

const IconLocation = () => (
  <svg width='12' height='12' viewBox='0 0 16 16' fill='none'>
    <path d='M8 1C5.79 1 4 2.79 4 5C4 8.25 8 15 8 15C8 15 12 8.25 12 5C12 2.79 10.21 1 8 1ZM8 7C6.9 7 6 6.1 6 5C6 3.9 6.9 3 8 3C9.1 3 10 3.9 10 5C10 6.1 9.1 7 8 7Z' fill='currentColor' />
  </svg>
);

const IconClock = () => (
  <svg width='12' height='12' viewBox='0 0 16 16' fill='none'>
    <circle cx='8' cy='8' r='6.5' stroke='currentColor' strokeWidth='1.5' />
    <path d='M8 4.5V8.5L10.5 10' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
  </svg>
);

const IconPerson = () => (
  <svg width='12' height='12' viewBox='0 0 16 16' fill='none'>
    <circle cx='8' cy='5' r='3' stroke='currentColor' strokeWidth='1.5' />
    <path d='M2.5 14C2.5 11.5 5 9.5 8 9.5C11 9.5 13.5 11.5 13.5 14' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
  </svg>
);

const IconX = () => (
  <svg width='14' height='14' viewBox='0 0 16 16' fill='none'>
    <path d='M3 3L13 13M13 3L3 13' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
  </svg>
);

const IconCopy = () => (
  <svg width='13' height='13' viewBox='0 0 16 16' fill='none'>
    <rect x='5' y='5' width='9' height='9' rx='1.5' stroke='currentColor' strokeWidth='1.5' />
    <path d='M11 5V3C11 2.448 10.552 2 10 2H3C2.448 2 2 2.448 2 3V10C2 10.552 2.448 11 3 11H5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
  </svg>
);

// ─── Response status badge color ─────────────────────────────────────────────

const responseColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'accepted': return 'text-[#107C10] bg-[#DFF6DD]';
    case 'declined': return 'text-[#A80000] bg-[#FDE7E9]';
    case 'tentativelyaccepted':
    case 'tentative': return 'text-[#7A6400] bg-[#FFF4CE]';
    default: return 'text-[#605E5C] bg-[#F3F2F1]';
  }
};

const responseLabel = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'accepted': return 'Accepted';
    case 'declined': return 'Declined';
    case 'tentativelyaccepted':
    case 'tentative': return 'Tentative';
    case 'notresponded': return 'Not responded';
    default: return status || 'Unknown';
  }
};

// ─── Calendar ─────────────────────────────────────────────────────────────────

const Calendar = () => {
  const { accountid } = useParams();

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [searchText, setSearchText] = useState('');
  const deferredSearch = useDeferredValue(searchText.trim());
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [selectedEventId, setSelectedEventId] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelComment, setCancelComment] = useState('');
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [copiedLink, setCopiedLink] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [leftWidth, setLeftWidth] = useState(220);
  const [rightWidth, setRightWidth] = useState(320);
  const timeGridRef = useRef<HTMLDivElement>(null);
  const leftDragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const rightDragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  // Update current time line every minute
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Drag-resize both panels
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (leftDragRef.current) {
        const next = leftDragRef.current.startWidth + (e.clientX - leftDragRef.current.startX);
        setLeftWidth(Math.min(Math.max(next, 160), 360));
      }
      if (rightDragRef.current) {
        const next = rightDragRef.current.startWidth - (e.clientX - rightDragRef.current.startX);
        setRightWidth(Math.min(Math.max(next, 240), 520));
      }
    };
    const onUp = () => {
      leftDragRef.current = null;
      rightDragRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  // Auto-scroll time grid to current time
  useEffect(() => {
    if (viewMode === 'month') return;
    const ref = timeGridRef.current;
    if (!ref) return;
    const now = new Date();
    const scrollTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT - 120;
    ref.scrollTop = Math.max(0, scrollTop);
  }, [viewMode]);

  const {
    data: metadata,
    isLoading: isMetadataLoading,
    isError: isMetadataError,
    error: metadataError,
  } = useCalendarMetadata(accountid || '');

  const dateRange = useMemo(() => {
    if (viewMode === 'day') {
      return { start: startOfDay(anchorDate).toISOString(), end: endOfDay(anchorDate).toISOString() };
    }
    if (viewMode === 'week') {
      return { start: startOfWeek(anchorDate).toISOString(), end: endOfWeek(anchorDate).toISOString() };
    }
    const s = new Date(startOfCalGrid(anchorDate)); s.setHours(0, 0, 0, 0);
    const e = new Date(endOfCalGrid(anchorDate)); e.setHours(23, 59, 59, 999);
    return { start: s.toISOString(), end: e.toISOString() };
  }, [anchorDate, viewMode]);

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

  const events = useMemo(() => calendarEvents?.events || [], [calendarEvents]);
  const monthCells = useMemo(() => createMonthCells(anchorDate), [anchorDate]);
  const weekCells = useMemo(() => createWeekCells(anchorDate), [anchorDate]);

  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEventSummary[]>();
    events.forEach(event => {
      const key =
        getEventDateKey(event.start) ||
        (parseDate(event.start) ? toIsoDate(parseDate(event.start) as Date) : null);
      if (!key) return;
      const arr = grouped.get(key) || [];
      arr.push(event);
      grouped.set(key, arr);
    });
    grouped.forEach(arr =>
      arr.sort((a, b) => (parseDate(a.start)?.getTime() || 0) - (parseDate(b.start)?.getTime() || 0)),
    );
    return grouped;
  }, [events]);

  const selectedDateEvents = useMemo(
    () => eventsByDate.get(selectedDate) || [],
    [eventsByDate, selectedDate],
  );

  useEffect(() => {
    if (selectedEventId && events.some(e => e.event_id === selectedEventId)) return;
    setSelectedEventId(selectedDateEvents[0]?.event_id || events[0]?.event_id || '');
  }, [events, selectedDateEvents, selectedEventId]);

  const {
    data: eventDetail,
    isLoading: isDetailLoading,
  } = useCalendarEventById(accountid || '', selectedEventId || undefined);

  const cancelMutation = useCancelCalendarEvent();

  const errorMessage =
    ((metadataError || eventsError) as AxiosError<{ message?: string }>)?.response?.data?.message ||
    (metadataError || eventsError)?.message ||
    'Unable to load the calendar for this account.';

  const cancelErrorMessage =
    (cancelMutation.error as AxiosError<{ message?: string }> | null)?.response?.data?.message ||
    cancelMutation.error?.message ||
    'Unable to cancel the invite.';

  const currentLabel = useMemo(() => {
    if (viewMode === 'day') {
      const d = parseDate(selectedDate) || anchorDate;
      return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    if (viewMode === 'week') {
      const s = startOfWeek(anchorDate);
      const e = endOfWeek(anchorDate);
      const sLabel = s.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const eLabel = e.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      return `${sLabel} – ${eLabel}`;
    }
    return formatMonthYear(anchorDate);
  }, [anchorDate, selectedDate, viewMode]);

  const jumpToToday = () => {
    const today = new Date();
    setAnchorDate(startOfDay(today));
    setSelectedDate(toIsoDate(today));
  };

  const shiftRange = (dir: -1 | 1) => {
    const next = new Date(anchorDate);
    if (viewMode === 'day') {
      next.setDate(next.getDate() + dir);
      // Keep selectedDate in sync so the day grid and right panel show the right day
      setSelectedDate(toIsoDate(next));
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + dir * 7);
    } else {
      next.setMonth(next.getMonth() + dir);
    }
    setAnchorDate(startOfDay(next));
  };

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
      // rendered in UI
    }
  };

  // ─── Event color ────────────────────────────────────────────────────────────

  const eventColors = (event: CalendarEventSummary, selected: boolean) => {
    if (selected) return { bg: '#0078D4', border: '#005A9E', text: '#FFFFFF', dot: '#FFFFFF' };
    if (event.has_join_link) return { bg: '#EDE9F4', border: '#6264A7', text: '#3B3A9A', dot: '#6264A7' };
    return { bg: '#EBF3FC', border: '#0078D4', text: '#0F4A8A', dot: '#0078D4' };
  };

  // ─── Renders ────────────────────────────────────────────────────────────────

  const renderMonthView = () => (
    <div className='flex h-full min-h-0 flex-col'>
      {/* Weekday header */}
      <div className='grid grid-cols-7 border-b border-[#E1DFDD]'>
        {WEEKDAY_SHORT.map(day => (
          <div
            key={day}
            className='py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-[#605E5C]'
          >
            {day}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className='grid min-h-0 flex-1 grid-cols-7 grid-rows-6'>
        {monthCells.map(cell => {
          const cellEvents = eventsByDate.get(cell.isoDate) || [];
          const isSelected = cell.isoDate === selectedDate;

          return (
            <button
              key={cell.key}
              type='button'
              onClick={() => {
                setSelectedDate(cell.isoDate);
                setAnchorDate(startOfDay(cell.date));
                setSelectedEventId(cellEvents[0]?.event_id || '');
              }}
              className={`group flex min-h-[80px] flex-col overflow-hidden border-b border-r border-[#E1DFDD] p-1 text-left transition-colors ${
                isSelected ? 'bg-[#F0F6FF]' : cell.isCurrentMonth ? 'bg-white hover:bg-[#FAF9F8]' : 'bg-[#FAF9F8] hover:bg-[#F3F2F1]'
              }`}
            >
              {/* Date number */}
              <div className='mb-1 flex items-center justify-between px-1'>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-medium transition-colors ${
                    cell.isToday
                      ? 'bg-[#0078D4] text-white font-semibold'
                      : isSelected
                        ? 'bg-[#DEECF9] text-[#0078D4] font-semibold'
                        : cell.isCurrentMonth
                          ? 'text-[#323130] group-hover:bg-[#EDEBE9]'
                          : 'text-[#A19F9D]'
                  }`}
                >
                  {cell.date.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className='flex min-h-0 flex-1 flex-col gap-[2px] overflow-hidden'>
                {cellEvents.slice(0, 3).map(event => {
                  const isSelEvent = event.event_id === selectedEventId;
                  const colors = eventColors(event, isSelEvent);
                  return (
                    <div
                      key={event.event_id}
                      role='button'
                      tabIndex={0}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedDate(cell.isoDate);
                        setSelectedEventId(event.event_id); setRightCollapsed(false);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          setSelectedDate(cell.isoDate);
                          setSelectedEventId(event.event_id); setRightCollapsed(false);
                        }
                      }}
                      className='flex min-w-0 cursor-pointer items-center gap-1 rounded px-1.5 py-[2px]'
                      style={{ backgroundColor: colors.bg, borderLeft: `3px solid ${colors.border}` }}
                    >
                      {event.has_join_link ? (
                        <span style={{ color: colors.dot }} className='flex-shrink-0'>
                          <IconVideo />
                        </span>
                      ) : null}
                      <span
                        className='truncate text-[11px] font-medium'
                        style={{ color: colors.text }}
                      >
                        {event.is_all_day ? '' : `${formatTime(event.start, event.start_timezone)} `}
                        {event.subject}
                      </span>
                    </div>
                  );
                })}
                {cellEvents.length > 3 ? (
                  <div className='px-1.5 text-[11px] font-medium text-[#0078D4]'>
                    +{cellEvents.length - 3} more
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderTimeGrid = (cells: CalendarCell[]) => {
    const todayIso = toIsoDate(new Date());
    const currentTimeMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const currentTimeTop = (currentTimeMins / 60) * HOUR_HEIGHT;

    return (
      <div className='flex h-full min-h-0 flex-col'>
        {/* All-day row */}
        <div className='flex flex-shrink-0 border-b border-[#E1DFDD]'>
          <div className='w-14 flex-shrink-0 border-r border-[#E1DFDD] bg-white py-1 pr-2 text-right text-[10px] text-[#605E5C]'>
            All day
          </div>
          {cells.map(cell => {
            const allDayEvents = (eventsByDate.get(cell.isoDate) || []).filter(e => e.is_all_day);
            return (
              <div
                key={cell.key}
                className={`flex-1 min-w-0 border-r border-[#E1DFDD] p-1 ${cell.isToday ? 'bg-[#F0F6FF]' : 'bg-white'}`}
              >
                {allDayEvents.map(event => {
                  const colors = eventColors(event, event.event_id === selectedEventId);
                  return (
                    <div
                      key={event.event_id}
                      role='button'
                      tabIndex={0}
                      onClick={() => { setSelectedDate(cell.isoDate); setSelectedEventId(event.event_id); setRightCollapsed(false); }}
                      onKeyDown={e => { if (e.key === 'Enter') { setSelectedDate(cell.isoDate); setSelectedEventId(event.event_id); setRightCollapsed(false); } }}
                      className='mb-[2px] cursor-pointer truncate rounded px-1.5 py-[2px] text-[11px] font-medium'
                      style={{ backgroundColor: colors.bg, borderLeft: `3px solid ${colors.border}`, color: colors.text }}
                    >
                      {event.subject}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Day column headers */}
        <div className='flex flex-shrink-0 border-b border-[#E1DFDD]'>
          <div className='w-14 flex-shrink-0 border-r border-[#E1DFDD] bg-white' />
          {cells.map(cell => (
            <div
              key={cell.key}
              className={`flex flex-1 cursor-pointer flex-col items-center justify-center py-2 transition-colors hover:bg-[#FAF9F8] ${
                cell.isToday ? 'bg-[#F0F6FF]' : 'bg-white'
              }`}
              role='button'
              tabIndex={0}
              onClick={() => { setSelectedDate(cell.isoDate); setAnchorDate(startOfDay(cell.date)); }}
              onKeyDown={e => { if (e.key === 'Enter') { setSelectedDate(cell.isoDate); setAnchorDate(startOfDay(cell.date)); } }}
            >
              <span className={`text-[11px] font-medium uppercase tracking-wider ${cell.isToday ? 'text-[#0078D4]' : 'text-[#605E5C]'}`}>
                {WEEKDAY_SHORT[cell.date.getDay()]}
              </span>
              <span
                className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-[15px] font-semibold ${
                  cell.isToday ? 'bg-[#0078D4] text-white' : 'text-[#323130]'
                }`}
              >
                {cell.date.getDate()}
              </span>
            </div>
          ))}
        </div>

        {/* Scrollable time grid */}
        <div className='min-h-0 flex-1 overflow-y-auto' ref={timeGridRef}>
          <div
            className='relative flex'
            style={{ height: 24 * HOUR_HEIGHT }}
          >
            {/* Hour labels */}
            <div className='w-14 flex-shrink-0 border-r border-[#E1DFDD] bg-white'>
              {HOUR_LABELS.map(h => (
                <div
                  key={h}
                  className='flex items-start justify-end pr-2 text-[10px] text-[#605E5C]'
                  style={{ height: HOUR_HEIGHT, marginTop: h === 0 ? -6 : 0 }}
                >
                  {h === 0 ? '' : formatHour(h)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {cells.map(cell => {
              const timedEvents = (eventsByDate.get(cell.isoDate) || []).filter(e => !e.is_all_day);
              const assignments = assignColumns(timedEvents);
              const showTimeLine = cell.isoDate === todayIso;

              return (
                <div
                  key={cell.key}
                  className={`relative flex-1 min-w-0 border-r border-[#E1DFDD] ${cell.isToday ? 'bg-[#FAFCFF]' : 'bg-white'}`}
                >
                  {/* Hour lines */}
                  {HOUR_LABELS.map(h => (
                    <div
                      key={h}
                      className='border-b border-[#E1DFDD] pointer-events-none'
                      style={{ height: HOUR_HEIGHT }}
                    />
                  ))}

                  {/* Current time line */}
                  {showTimeLine ? (
                    <div
                      className='pointer-events-none absolute left-0 right-0 z-10 flex items-center'
                      style={{ top: currentTimeTop - 1 }}
                    >
                      <div className='h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#D13438]' style={{ marginLeft: -5 }} />
                      <div className='h-[2px] flex-1 bg-[#D13438]' />
                    </div>
                  ) : null}

                  {/* Events */}
                  {timedEvents.map(event => {
                    const slot = getTimeSlot(event.start, event.end);
                    if (!slot) return null;
                    const info = assignments.get(event.event_id);
                    const col = info?.col ?? 0;
                    const colTotal = info?.totalCols ?? 1;
                    const widthPct = 92 / colTotal;
                    const leftPct = col * widthPct;
                    const isSelected = event.event_id === selectedEventId;
                    const colors = eventColors(event, isSelected);

                    return (
                      <button
                        key={event.event_id}
                        type='button'
                        onClick={() => { setSelectedDate(cell.isoDate); setSelectedEventId(event.event_id); setRightCollapsed(false); }}
                        className='absolute overflow-hidden rounded px-1.5 py-1 text-left shadow-sm transition-opacity hover:opacity-90'
                        style={{
                          top: slot.top + 1,
                          height: Math.max(slot.height - 2, 18),
                          left: `${leftPct + 2}%`,
                          width: `${widthPct - 1}%`,
                          backgroundColor: colors.bg,
                          borderLeft: `3px solid ${colors.border}`,
                          zIndex: isSelected ? 5 : 2,
                        }}
                      >
                        <p className='truncate text-[11px] font-semibold leading-tight' style={{ color: colors.text }}>
                          {event.subject}
                        </p>
                        {slot.height >= 32 ? (
                          <p className='mt-0.5 truncate text-[10px] leading-tight opacity-80' style={{ color: colors.text }}>
                            {formatTime(event.start, event.start_timezone)}
                            {event.has_join_link ? ' · Teams' : ''}
                          </p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderEventDetail = () => {
    if (!selectedEventId) return (
      <div className='flex h-full flex-col items-center justify-center gap-3 p-6 text-center'>
        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F2F1]'>
          <svg width='22' height='22' viewBox='0 0 22 22' fill='none'>
            <rect x='3' y='5' width='16' height='14' rx='2' stroke='#605E5C' strokeWidth='1.5' />
            <path d='M7 3V5M15 3V5M3 9H19' stroke='#605E5C' strokeWidth='1.5' strokeLinecap='round' />
          </svg>
        </div>
        <p className='text-[13px] text-[#605E5C]'>Select a meeting to view details</p>
      </div>
    );

    if (isDetailLoading) return (
      <div className='flex h-full items-center justify-center'>
        <CircularProgress size={24} sx={{ color: '#0078D4' }} />
      </div>
    );

    if (!eventDetail) return null;

    return (
      <div className='flex h-full flex-col overflow-y-auto'>
        {/* Detail header */}
        <div className='border-b border-[#E1DFDD] bg-white px-4 py-3'>
          <div className='mb-2 flex items-start justify-between gap-2'>
            <h2 className='flex-1 text-[16px] font-semibold leading-tight text-[#323130]'>
              {eventDetail.subject}
            </h2>
            <button
              type='button'
              onClick={() => setRightCollapsed(true)}
              className='flex-shrink-0 rounded p-0.5 text-[#605E5C] hover:bg-[#F3F2F1] hover:text-[#323130]'
            >
              <IconX />
            </button>
          </div>

          {/* Time */}
          <div className='flex items-center gap-1.5 text-[12px] text-[#605E5C]'>
            <IconClock />
            <span>
              {eventDetail.is_all_day
                ? 'All day'
                : `${formatDateTime(eventDetail.start, eventDetail.start_timezone)} – ${formatTime(eventDetail.end, eventDetail.end_timezone)}`}
            </span>
          </div>

          {/* Location */}
          {eventDetail.location_display_name ? (
            <div className='mt-1 flex items-center gap-1.5 text-[12px] text-[#605E5C]'>
              <IconLocation />
              <span>{eventDetail.location_display_name}</span>
            </div>
          ) : null}

          {/* Status badges */}
          <div className='mt-2 flex flex-wrap gap-1.5'>
            {eventDetail.is_cancelled ? (
              <span className='rounded px-2 py-0.5 text-[11px] font-medium text-[#A80000] bg-[#FDE7E9]'>
                Cancelled
              </span>
            ) : null}
            <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${responseColor(eventDetail.response_status)}`}>
              {responseLabel(eventDetail.response_status)}
            </span>
            {eventDetail.has_join_link ? (
              <span className='flex items-center gap-1 rounded bg-[#EDE9F4] px-2 py-0.5 text-[11px] font-medium text-[#3B3A9A]'>
                <IconVideo />
                Teams
              </span>
            ) : null}
          </div>

          {/* Action buttons */}
          <div className='mt-3 flex flex-wrap gap-2'>
            {eventDetail.join_link ? (
              <>
                <a
                  href={eventDetail.join_link}
                  target='_blank'
                  rel='noreferrer'
                  className='flex items-center gap-1.5 rounded bg-[#6264A7] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#4F52AA] transition-colors'
                >
                  <IconVideo />
                  Join Teams Meeting
                </a>
                <button
                  type='button'
                  onClick={() => {
                    navigator.clipboard.writeText(eventDetail.join_link!).then(() => {
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    });
                  }}
                  className='flex items-center gap-1.5 rounded border border-[#C8C6C4] bg-white px-3 py-1.5 text-[12px] font-medium text-[#323130] hover:bg-[#F3F2F1] transition-colors'
                >
                  <IconCopy />
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </>
            ) : null}
            {metadata?.allowed_actions.cancel_invite && eventDetail.can_cancel ? (
              <button
                type='button'
                onClick={() => setCancelDialogOpen(true)}
                className='rounded border border-[#D13438] px-3 py-1.5 text-[12px] font-medium text-[#D13438] hover:bg-[#FDE7E9] transition-colors'
              >
                Cancel Invite
              </button>
            ) : null}
          </div>
        </div>

        {/* Detail body */}
        <div className='flex-1 space-y-3 bg-[#FAF9F8] p-4'>
          {/* Organizer */}
          <div className='rounded-lg bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)]'>
            <div className='mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#605E5C]'>
              <IconPerson />
              Organizer
            </div>
            <p className='text-[13px] font-semibold text-[#323130]'>{eventDetail.organizer_name || eventDetail.organizer_email}</p>
            {eventDetail.organizer_name ? (
              <p className='mt-0.5 text-[12px] text-[#605E5C]'>{eventDetail.organizer_email}</p>
            ) : null}
          </div>

          {/* Attendees */}
          {eventDetail.attendees.length > 0 ? (
            <div className='rounded-lg bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)]'>
              <div className='mb-2 flex items-center justify-between'>
                <div className='flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#605E5C]'>
                  <IconPerson />
                  Attendees
                </div>
                <span className='text-[11px] text-[#605E5C]'>{eventDetail.attendees.length}</span>
              </div>
              <div className='space-y-2'>
                {eventDetail.attendees.map(att => (
                  <div
                    key={`${att.email}-${att.type}`}
                    className='flex items-center justify-between gap-2'
                  >
                    <div className='flex min-w-0 items-center gap-2'>
                      <div className='flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#EBF3FC] text-[11px] font-semibold text-[#0078D4]'>
                        {(att.name || att.email).charAt(0).toUpperCase()}
                      </div>
                      <div className='min-w-0'>
                        <p className='truncate text-[12px] font-medium text-[#323130]'>
                          {att.name || att.email}
                        </p>
                        {att.name ? (
                          <p className='truncate text-[11px] text-[#605E5C]'>{att.email}</p>
                        ) : null}
                      </div>
                    </div>
                    <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${responseColor(att.response_status)}`}>
                      {responseLabel(att.response_status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Body preview */}
          {eventDetail.body_preview ? (
            <div className='rounded-lg bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)]'>
              <div className='mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#605E5C]'>
                Description
              </div>
              <p className='whitespace-pre-wrap text-[12px] leading-relaxed text-[#323130]'>
                {eventDetail.body_preview}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  // ─── Root render ────────────────────────────────────────────────────────────

  return (
    <div className='flex h-[calc(100vh-220px)] min-h-[680px] overflow-hidden rounded-lg border border-[#E1DFDD] bg-white font-[system-ui,_-apple-system,_sans-serif] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'>

      {/* ── Left mini-calendar panel ── */}
      {leftCollapsed ? (
        <div className='flex w-8 flex-shrink-0 flex-col items-center border-r border-[#E1DFDD] bg-[#FAF9F8] pt-2'>
          <button
            type='button'
            title='Expand navigation panel'
            onClick={() => setLeftCollapsed(false)}
            className='flex h-6 w-6 items-center justify-center rounded text-[#605E5C] hover:bg-[#EDEBE9] hover:text-[#323130]'
          >
            <IconChevronRight />
          </button>
        </div>
      ) : (
        <div
          className='relative flex flex-shrink-0 flex-col overflow-y-auto border-r border-[#E1DFDD] bg-[#FAF9F8]'
          style={{ width: leftWidth }}
        >
          {/* Drag handle — right edge */}
          <div
            className='absolute right-0 top-0 z-10 h-full w-1 cursor-col-resize transition-colors hover:bg-[#0078D4]/30'
            onPointerDown={e => {
              leftDragRef.current = { startX: e.clientX, startWidth: leftWidth };
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            }}
          />

          {/* Mini calendar */}
          <div className='p-3'>
            <div className='mb-2 flex items-center justify-between'>
              <span className='truncate text-[13px] font-semibold text-[#323130]'>
                {formatMonthYear(anchorDate)}
              </span>
              <div className='flex flex-shrink-0 items-center gap-0.5'>
                <button
                  type='button'
                  onClick={() => shiftRange(-1)}
                  className='flex h-6 w-6 items-center justify-center rounded text-[#605E5C] hover:bg-[#EDEBE9]'
                >
                  <IconChevronLeft />
                </button>
                <button
                  type='button'
                  onClick={() => shiftRange(1)}
                  className='flex h-6 w-6 items-center justify-center rounded text-[#605E5C] hover:bg-[#EDEBE9]'
                >
                  <IconChevronRight />
                </button>
                <button
                  type='button'
                  title='Collapse panel'
                  onClick={() => setLeftCollapsed(true)}
                  className='ml-0.5 flex h-6 w-6 items-center justify-center rounded text-[#605E5C] hover:bg-[#EDEBE9]'
                >
                  <IconChevronLeft />
                </button>
              </div>
            </div>

            {/* Mini weekday headers */}
            <div className='mb-1 grid grid-cols-7'>
              {WEEKDAY_SHORT.map(d => (
                <div key={d} className='py-1 text-center text-[10px] font-semibold uppercase text-[#A19F9D]'>
                  {d[0]}
                </div>
              ))}
            </div>

            {/* Mini date cells */}
            <div className='grid grid-cols-7 gap-y-[2px]'>
              {monthCells.map(cell => {
                const hasEvents = eventsByDate.has(cell.isoDate);
                const isSelected = cell.isoDate === selectedDate;
                return (
                  <button
                    key={cell.key}
                    type='button'
                    onClick={() => {
                      setSelectedDate(cell.isoDate);
                      setAnchorDate(startOfDay(cell.date));
                      setSelectedEventId(eventsByDate.get(cell.isoDate)?.[0]?.event_id || '');
                    }}
                    className={`relative mx-auto flex h-[26px] w-[26px] items-center justify-center rounded-full text-[12px] font-medium transition-colors ${
                      isSelected
                        ? 'bg-[#0078D4] text-white'
                        : cell.isToday
                          ? 'font-bold text-[#0078D4]'
                          : cell.isCurrentMonth
                            ? 'text-[#323130] hover:bg-[#EDEBE9]'
                            : 'text-[#A19F9D] hover:bg-[#EDEBE9]'
                    }`}
                  >
                    {cell.date.getDate()}
                    {hasEvents && !isSelected ? (
                      <span className='absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#0078D4]' />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className='mx-3 border-t border-[#E1DFDD]' />

          {/* My Calendars */}
          <div className='p-3'>
            <p className='mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#A19F9D]'>
              My Calendars
            </p>
            <div className='flex items-center gap-2 rounded px-2 py-1.5 hover:bg-[#EDEBE9]'>
              <span className='h-2.5 w-2.5 flex-shrink-0 rounded-sm bg-[#0078D4]' />
              <span className='truncate text-[12px] text-[#323130]'>
                {metadata?.calendar_owner_email || 'Calendar'}
              </span>
            </div>
          </div>

          {/* Metadata info */}
          {metadata?.calendar_owner_email ? (
            <>
              <div className='mx-3 border-t border-[#E1DFDD]' />
              <div className='p-3'>
                <p className='text-[10px] font-semibold uppercase tracking-wider text-[#A19F9D]'>Mailbox</p>
                <p className='mt-1 break-all text-[11px] text-[#605E5C]'>{metadata.calendar_owner_email}</p>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ── Main area ── */}
      <div className='flex min-w-0 flex-1 flex-col'>

        {/* Toolbar */}
        <div className='flex flex-shrink-0 items-center gap-2 border-b border-[#E1DFDD] bg-white px-4 py-2.5'>
          <button
            type='button'
            onClick={jumpToToday}
            className='rounded border border-[#8A8886] px-3 py-1 text-[13px] font-medium text-[#323130] hover:bg-[#F3F2F1] transition-colors'
          >
            Today
          </button>

          <div className='flex items-center'>
            <button
              type='button'
              onClick={() => shiftRange(-1)}
              className='flex h-7 w-7 items-center justify-center rounded text-[#323130] hover:bg-[#F3F2F1] transition-colors'
            >
              <IconChevronLeft />
            </button>
            <button
              type='button'
              onClick={() => shiftRange(1)}
              className='flex h-7 w-7 items-center justify-center rounded text-[#323130] hover:bg-[#F3F2F1] transition-colors'
            >
              <IconChevronRight />
            </button>
          </div>

          <span className='text-[18px] font-semibold text-[#323130]'>{currentLabel}</span>

          <div className='flex-1' />

          {/* Search */}
          <div className='relative'>
            <span className='pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A19F9D]'>
              <IconSearch />
            </span>
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder='Search'
              className='h-[30px] w-[180px] rounded border border-[#C8C6C4] bg-white pl-7 pr-3 text-[13px] text-[#323130] outline-none placeholder:text-[#A19F9D] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]'
            />
          </div>

          {/* View switcher */}
          <div className='flex overflow-hidden rounded border border-[#C8C6C4]'>
            {(['day', 'week', 'month'] as CalendarViewMode[]).map((mode, idx) => (
              <button
                key={mode}
                type='button'
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-[12px] font-medium capitalize transition-colors ${
                  idx > 0 ? 'border-l border-[#C8C6C4]' : ''
                } ${
                  viewMode === mode
                    ? 'bg-[#0078D4] text-white'
                    : 'bg-white text-[#323130] hover:bg-[#F3F2F1]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / error states */}
        {isMetadataLoading ? (
          <div className='flex flex-1 items-center justify-center'>
            <CircularProgress size={28} sx={{ color: '#0078D4' }} />
          </div>
        ) : isMetadataError || isEventsError ? (
          <div className='flex flex-1 items-center justify-center px-6 text-center text-[14px] text-[#A80000]'>
            {errorMessage}
          </div>
        ) : (
          <div className='flex min-h-0 flex-1 overflow-hidden'>
            {/* Calendar grid area */}
            <div className='relative min-w-0 flex-1 overflow-hidden'>
              {isEventsLoading ? (
                <div className='absolute inset-0 z-20 flex items-center justify-center bg-white/70'>
                  <CircularProgress size={24} sx={{ color: '#0078D4' }} />
                </div>
              ) : null}

              {viewMode === 'month' ? renderMonthView() : null}
              {viewMode === 'week' ? renderTimeGrid(weekCells) : null}
              {viewMode === 'day' ? renderTimeGrid([{
                key: anchorDate.toISOString(),
                date: anchorDate,
                isoDate: toIsoDate(anchorDate),
                isCurrentMonth: true,
                isToday: toIsoDate(anchorDate) === toIsoDate(new Date()),
              }]) : null}
            </div>

            {/* Event detail panel */}
            {rightCollapsed ? (
              <div className='flex w-8 flex-shrink-0 flex-col items-center border-l border-[#E1DFDD] bg-white pt-2'>
                <button
                  type='button'
                  title='Expand detail panel'
                  onClick={() => setRightCollapsed(false)}
                  className='flex h-6 w-6 items-center justify-center rounded text-[#605E5C] hover:bg-[#F3F2F1] hover:text-[#323130]'
                >
                  <IconChevronLeft />
                </button>
              </div>
            ) : (
              <div
                className='relative flex flex-shrink-0 flex-col overflow-hidden border-l border-[#E1DFDD] bg-white'
                style={{ width: rightWidth }}
              >
                {/* Drag handle — left edge */}
                <div
                  className='absolute left-0 top-0 z-10 h-full w-1 cursor-col-resize transition-colors hover:bg-[#0078D4]/30'
                  onPointerDown={e => {
                    rightDragRef.current = { startX: e.clientX, startWidth: rightWidth };
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  }}
                />
                {renderEventDetail()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Cancel dialog ── */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 600, color: '#323130', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          Cancel Meeting Invite
        </DialogTitle>
        <DialogContent>
          <p className='mb-3 text-[13px] text-[#605E5C]'>
            This will cancel the invite from the connected Microsoft 365 calendar. A cancellation notice will be sent to all attendees.
          </p>
          <textarea
            value={cancelComment}
            onChange={e => setCancelComment(e.target.value)}
            placeholder='Optional cancellation message to attendees...'
            className='min-h-[100px] w-full rounded border border-[#C8C6C4] px-3 py-2.5 text-[13px] text-[#323130] outline-none placeholder:text-[#A19F9D] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]'
          />
          {cancelMutation.isError ? (
            <p className='mt-3 text-[13px] text-[#A80000]'>{cancelErrorMessage}</p>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ padding: '0 24px 20px', gap: '8px' }}>
          <button
            type='button'
            onClick={() => setCancelDialogOpen(false)}
            className='rounded border border-[#C8C6C4] px-4 py-1.5 text-[13px] font-medium text-[#323130] hover:bg-[#F3F2F1] transition-colors'
          >
            Close
          </button>
          <button
            type='button'
            onClick={handleCancelInvite}
            disabled={cancelMutation.isPending}
            className='rounded bg-[#D13438] px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-[#A80000] disabled:opacity-60 transition-colors'
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Invite'}
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Calendar;
