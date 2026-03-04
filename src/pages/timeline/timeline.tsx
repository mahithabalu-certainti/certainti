import React, { Suspense, useEffect, useRef, useState } from 'react';
import {
  CallLogIcon,
  TaskCreateIcon,
  NotesSideIcon,
  AccountDeatilsIcon,
  ProjectsSideIcon,
  CasesIcon,
  AttachmentsSideIcon,
  DraftEmailIcon,
  ResourcesIcon,
  FinancialIcon,
  InteractionsIcon,
  HistorySubmissionIcon,
  ChecklistIcon,
  TimeSheetIcon,
  ImportsIcon,
  SettingIcon,
  ProjectTaskIcon,
  TechSummaryIcon,
  MeetingIcon,
  CaseTeamIcon,
  DossierIcon,
  ActionsIcon,
} from '../../assets/icons';
import { useParams, useSearchParams } from 'react-router';
import { TimelineParams } from '../../consultant/types/timeline';
import { useTimelineList } from '../../consultant/services/timeline/timeline-service';
import TimelineSkeleton from '../../components/skeleton-component/timeskeleton';
import { ColorCode } from '../../consultant/types';

type TimelineItem = {
  rid: string;
  date: string;
  time: string;
  entity_name: string;
  title: string;
  created_by_name?: string;
  descriptions?: string;
  event_name?: string;
  linkText?: string;
};

type TimelineProps = {
  entitytype: string;
};

type TimelineGroup = {
  dateLabel: string;
  items: TimelineItem[];
};

// Icon config: returns { icon component, bg color } per type
type IconConfig = {
  icon: React.ReactNode;
  bg: string;
};

// Normalises any entity_name variant (snake_case, mixed case, spaces) → lowercase snake_case
// e.g. "Project Task" → "project_task", "resource_skill" → "resource_skill"
const normaliseEntityKey = (value: string): string =>
  value.trim().toLowerCase().replace(/[\s-]+/g, '_');

// Icon lookup map: normalised snake_case key → icon component name
const ICON_KEY_MAP: Record<string, string> = {
  // Account
  account: 'account',
  // Project variants
  project: 'project',
  // Case variants
  case: 'case',
  // Call log variants
  call_log: 'call_log',
  // Meeting
  meeting: 'meeting',
  // Attachment
  attachment: 'attachment',
  // Email variants
  email: 'email',
  case_review_project_email: 'email',
  // Task / Tag / Comments
  task: 'task',
  tag: 'task',
  comments: 'task',
  // Notes
  notes: 'notes',
  // Resource variants (all map to same icon)
  resource: 'resource',
  project_resource: 'resource',
  project_resources: 'resource',
  resource_skill: 'resource',
  resource_cost: 'resource',
  // Financial
  financial_working: 'financial',
  // Interaction
  interaction: 'interaction',
  // Historical Submission
  historical_submission: 'historical_submission',
  // Checklist variants
  checklist: 'checklist',
  checklists: 'checklist',
  // Timesheet
  timesheet: 'timesheet',
  // Import
  import: 'import',
  // Project Task variants
  project_task: 'project_task',
  // Technical Summary
  technical_summary: 'technical_summary',
  tech_summary: 'technical_summary',
  // Settings
  settings: 'settings',
  // Case Team
  case_team: 'case_team',
  // Manual RD Assessment
  manual_rd_assessment: 'manual_rd_assessment',
  // Dossier
  dossier: 'dossier',
};

const getTypeIconConfig = (
  entity_name: string,
  entitytype: string
): IconConfig => {
  const bgColor =
    entitytype === 'account'
      ? ColorCode.accountBgColor
      : entitytype === 'project'
        ? ColorCode.projectBgColor
        : ColorCode.caseBgColor;

  const cls = `[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`;
  const iconKey = ICON_KEY_MAP[normaliseEntityKey(entity_name)];

  const iconMap: Record<string, React.ReactNode> = {
    account: <AccountDeatilsIcon alt='account' className='[&>path]:stroke-white w-[14px] h-[14px]' />,
    project: <ProjectsSideIcon alt='project' className={cls} />,
    case: <CasesIcon alt='case' className={cls} />,
    call_log: <CallLogIcon alt='call' className={cls} />,
    meeting: <MeetingIcon alt='meeting' className={cls} />,
    attachment: <AttachmentsSideIcon alt='attachment' className={cls} />,
    email: <DraftEmailIcon alt='email' className={cls} />,
    task: <TaskCreateIcon alt='task' className={cls} />,
    notes: <NotesSideIcon alt='note' className={cls} />,
    resource: <ResourcesIcon alt='resource' className={cls} />,
    financial: <FinancialIcon alt='financial' className={cls} />,
    interaction: <InteractionsIcon alt='interactions' className={cls} />,
    historical_submission: <HistorySubmissionIcon alt='history' className={cls} />,
    checklist: <ChecklistIcon alt='checklist' className={cls} />,
    timesheet: <TimeSheetIcon alt='timesheet' className={cls} />,
    import: <ImportsIcon alt='imports' className={cls} />,
    project_task: <ProjectTaskIcon alt='project-task' className={cls} />,
    technical_summary: <TechSummaryIcon alt='tech-summary' className={cls} />,
    settings: <SettingIcon alt='setting' className={cls} />,
    case_team: <CaseTeamIcon alt='case-team' className={cls} />,
    manual_rd_assessment: <ActionsIcon alt='rd-assessment' className={cls} />,
    dossier: <DossierIcon alt='dossier' className={cls} />,
  };

  return {
    icon: iconMap[iconKey] ?? <AccountDeatilsIcon alt='default' className={cls} />,
    bg: bgColor,
  };
};

/**
 * Converts any entity_name from the API into a human-readable Title Case label.
 * - snake_case  → "Snake Case"   (e.g. "call_log"   → "Call Log")
 * - Mixed space → "Title Case"   (e.g. "Case team"  → "Case Team")
 * - Already readable strings are returned as-is (e.g. "Meeting" → "Meeting")
 */
const formatEntityName = (entity_name: string): string => {
  if (!entity_name) return entity_name;
  // Normalise: replace spaces/hyphens with underscores, then split and capitalise
  return entity_name
    .replace(/[-\s]+/g, '_')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Width of time column (px) — keep in sync with the absolute line position
const TIME_COL_W = 62;
const DOT_COL_W = 24;
// The vertical line sits at the horizontal center of the dot column:
// TIME_COL_W + DOT_COL_W / 2 = 62 + 12 = 74px from group container left
const LINE_LEFT = TIME_COL_W + DOT_COL_W / 2;

const formatTimelineDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTimelineTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Merge new API items into accumulated grouped data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformEntries = (entries: any[]): TimelineGroup[] => {
  const groups: { [key: string]: TimelineItem[] } = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entries.forEach((item: any) => {
    const dateLabel = formatTimelineDate(item.created_datetime);
    const time = formatTimelineTime(item.created_datetime);

    const transformedItem: TimelineItem = {
      rid: item.rid,
      date: '',
      time,
      entity_name: item.entity_name,
      title: `${item.entity_name} ${item.event_name} (${item.r_number || ''})`,
      created_by_name: item.created_by_name
        ? `by ${item.created_by_name}`
        : undefined,
      descriptions: item.descriptions,
      event_name: item.event_name,
    };

    if (!groups[dateLabel]) {
      groups[dateLabel] = [];
    }
    groups[dateLabel].push(transformedItem);
  });

  return Object.keys(groups).map((dateLabel) => ({
    dateLabel,
    items: groups[dateLabel],
  }));
};

const Timeline: React.FC<TimelineProps> = ({ entitytype }) => {
  const [searchParams] = useSearchParams();
  const { accountid, projectid, caseId } = useParams();
  const accountId = searchParams.get('accountID');
  const isTimeLineView = searchParams.get('timelineview') === 'true';

  // ── Pagination state ──────────────────────────────────────────────
  // nextOffset from the API is a number (e.g. 11), so store as number | null
  const [currentOffset, setCurrentOffset] = useState<number>(0);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [localItems, setLocalItems] = useState<TimelineGroup[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Use a ref to know whether the incoming data is the first page
  const isFirstPageRef = useRef(true);

  const params: TimelineParams = {
    nextOffset: currentOffset,
    limit: 25,
    account_rid: accountid || accountId || '',
    project_rid: entitytype === 'project' ? projectid : undefined,
    case_rid: entitytype === 'case' ? caseId : undefined,
    entityType: entitytype,
  };

  const { data, isLoading } = useTimelineList(params, isTimeLineView);

  // ── Accumulate pages into localItems ──────────────────────────────
  useEffect(() => {
    if (data?.data?.timeLineEntries) {
      const newGroups = transformEntries(data.data.timeLineEntries);

      if (isFirstPageRef.current) {
        // First page — replace all items
        setLocalItems(newGroups);
        isFirstPageRef.current = false;
      } else {
        // Subsequent pages — merge into existing groups
        setLocalItems((prev) => {
          const merged = [...prev];
          newGroups.forEach((newGroup) => {
            const existingGroup = merged.find(
              (g) => g.dateLabel === newGroup.dateLabel
            );
            if (existingGroup) {
              existingGroup.items = [...existingGroup.items, ...newGroup.items];
            } else {
              merged.push(newGroup);
            }
          });
          return merged;
        });
      }

      // API returns nextOffset as a number; null / undefined means no more pages
      const rawNext = data.data.nextOffset;
      setNextOffset(rawNext != null ? Number(rawNext) : null);
    }
  }, [data]);

  // ── Infinite scroll handler ───────────────────────────────────────
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;

    // Trigger load when within 100px of bottom, there is a next page, and not already loading
    if (
      scrollHeight - scrollTop <= clientHeight + 100 &&
      nextOffset !== null &&
      !isLoading
    ) {
      setCurrentOffset(nextOffset);
    }
  };

  // ── Initial skeleton (first load only) ───────────────────────────
  if (isLoading && localItems.length === 0) {
    return <TimelineSkeleton />;
  }

  // ── No data ──────────────────────────────────────────────────────
  if (!isLoading && localItems.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '120px',
          color: '#7D98B6',
          fontSize: '13px',
          fontWeight: 500,
        }}
      >
        No data available
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      style={{
        padding: '12px 16px 8px 16px',
        background: '#fff',
        overflowY: 'auto',
        // Concrete height is required so the div actually creates a scroll region.
        // '100%' doesn't work when the parent has no fixed height.
        maxHeight: 'calc(100vh - 260px)',
      }}
    >
      {/* Single continuous vertical line spanning all groups */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: `${LINE_LEFT}px`,
            top: '0px',
            bottom: '0px',
            width: '1px',
            background: '#CBD6E2',
            zIndex: 0,
          }}
        />

        {localItems.map((group, gIdx) => (
          <div
            key={group.dateLabel}
            style={{
              marginBottom: gIdx < localItems.length - 1 ? '4px' : '8px',
            }}
          >
            {/* ── Date section divider: date badge ── */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                marginBottom: '14px',
                marginTop: gIdx === 0 ? 0 : '16px',
              }}
            >
              <span
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#EEF2F7',
                  color: '#425A76',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '3px',
                  border: '1px solid #CBD6E2',
                  zIndex: 1,
                }}
              >
                {/* calendar icon */}
                <svg
                  width='11'
                  height='11'
                  viewBox='0 0 14 14'
                  fill='none'
                  style={{ marginTop: '-1px' }}
                >
                  <rect
                    x='1'
                    y='2.5'
                    width='12'
                    height='10.5'
                    rx='1.5'
                    stroke='#425A76'
                    strokeWidth='1.2'
                  />
                  <path d='M1 5.5h12' stroke='#425A76' strokeWidth='1.2' />
                  <path
                    d='M4.5 1v3M9.5 1v3'
                    stroke='#425A76'
                    strokeWidth='1.2'
                    strokeLinecap='round'
                  />
                </svg>
                {group.dateLabel}
              </span>
            </div>

            {/* ── Items ── */}
            {group.items.map((item, iIdx) => (
              <div
                key={`${item.rid}-${iIdx}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  paddingBottom: iIdx < group.items.length - 1 ? '14px' : '4px',
                  position: 'relative',
                }}
              >
                {/* ── Time column (left of line) ── */}
                <div
                  style={{
                    width: `${TIME_COL_W}px`,
                    flexShrink: 0,
                    textAlign: 'right',
                    paddingRight: '10px',
                    paddingTop: '1px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#2D3E4F',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.time}
                  </span>
                </div>

                {/* ── Icon column (on top of the vertical line) ── */}
                <div
                  style={{
                    width: `${DOT_COL_W}px`,
                    flexShrink: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    paddingTop: '0px',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {(() => {
                    const { icon, bg } = getTypeIconConfig(
                      item.entity_name,
                      entitytype
                    );
                    return (
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '4px',
                          background: bg,
                          border: '1px solid #CBD6E2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxSizing: 'border-box',
                        }}
                      >
                        <Suspense fallback={null}>{icon}</Suspense>
                      </div>
                    );
                  })()}
                </div>

                {/* ── Content column ── */}
                <div style={{ flex: 1, paddingLeft: '6px' }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#2D3E4F',
                      lineHeight: '1.4',
                    }}
                  >
                    {formatEntityName(item.entity_name)} {item.event_name}{' '}
                    {item.descriptions}
                  </div>

                  {item.created_by_name && (
                    <div
                      style={{
                        marginTop: '2px',
                        fontSize: '11px',
                        color: '#425A76',
                        lineHeight: '1.4',
                      }}
                    >
                      {item.created_by_name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Load-more skeleton (3 rows, no outer padding) ── */}
      {isLoading && localItems.length > 0 && (
        <TimelineSkeleton count={3} inline={true} />
      )}
    </div>
  );
};

export default Timeline;
