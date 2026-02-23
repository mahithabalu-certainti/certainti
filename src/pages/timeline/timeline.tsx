import React, { Suspense } from 'react';
import {
    NotesIcon,
    CallLogIcon,
    MeetingIcon,
    AttachmentIcon,
    SurveyIcon,
    TaskCreateIcon,
    NotesSideIcon,
} from '../../assets/icons';
import { useParams, useSearchParams } from 'react-router';
import { TimelineParams } from '../../consultant/types/timeline';
import { useTimelineList } from '../../consultant/services/timeline/timeline-service';
import TimelineSkeleton from '../../components/skeleton-component/timeskeleton';

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
// Icon config: returns { icon component, bg color, stroke color } per type
type IconConfig = {
    icon: React.ReactNode;
    bg: string;
};

// Mock Data
const mockTimelineData: TimelineGroup[] = [
    {
        dateLabel: 'Nov 21, 2024',
        items: [
            {
                rid: '1',
                date: '',
                time: '05:26 PM',
                entity_name: 'task',
                title: 'Task added Review Interaction questions',
                created_by_name: 'by Matthew Michaels',
                descriptions:
                    'Prepare a detailed and comprehensive quotation for the ABC Project, including all costs associated with materials, labor, services, and any other expenses.',
            },
            {
                rid: '2',
                date: '',
                time: '01:14 PM',
                entity_name: 'call',
                title: 'Call Logged',
                created_by_name: 'by Matthew Michaels',
            },
            {
                rid: '3',
                date: '',
                time: '09:41 AM',
                entity_name: 'meeting',
                title: 'Meeting – Project ID TT2P001 scheduled',
                created_by_name: 'by Matthew Michaels',
                descriptions:
                    "Subject: Let's discuss the pointers provided by Prabhu and come up with the template to capture the requirements / design recommendations.",
            },
            {
                rid: '4',
                date: '',
                time: '05:26 PM',
                entity_name: 'attachment',
                title: 'Attachment added for Email',
                created_by_name: 'by Matthew Michaels',
                linkText: 'Company Agreement.pdf',
            },
        ],
    },
    {
        dateLabel: 'Nov 20, 2024',
        items: [
            {
                rid: '5',
                date: '',
                time: '05:26 PM',
                entity_name: 'survey',
                title: 'Survey : Feedback on Email [Project/Design/Task] sent',
                created_by_name: 'by Matthew Michaels',
            },
            {
                rid: '6',
                date: '',
                time: '05:26 PM',
                entity_name: 'note',
                title: 'Note added',
                created_by_name: 'by Pooja Yelgati',
                descriptions: 'Key Deliverables for Project ID TT2P001',
            },
            {
                rid: '7',
                date: '',
                time: '05:26 PM',
                entity_name: 'contact',
                title: 'Contact added - Benjamin Samuel',
                created_by_name: 'by Matthew Michaels',
            },
        ],
    },
];

const getTypeIconConfig = (entity_name: string): IconConfig => {
    const iconStyle = { width: '10px', height: '10px' };
    const type = entity_name?.toLowerCase();
    switch (type) {
        case 'task':
        case 'project':
            return {
                icon: <TaskCreateIcon alt='task' style={iconStyle} />,
                bg: '#EBF3FD',
            };
        case 'call':
            return {
                icon: <CallLogIcon alt='call' style={iconStyle} />,
                bg: '#F0EBFD',
            };
        case 'meeting':
            return {
                icon: <MeetingIcon alt='meeting' style={iconStyle} />,
                bg: '#FEEBEB',
            };
        case 'attachment':
            return {
                icon: <AttachmentIcon alt='attachment' style={iconStyle} />,
                bg: '#EBF7FE',
            };
        case 'survey':
            return {
                icon: <SurveyIcon alt='survey' style={iconStyle} />,
                bg: '#FEEBF5',
            };
        case 'note':
            return {
                icon: <NotesSideIcon alt='note' style={iconStyle} />,
                bg: '#FEFAEB',
            };
        case 'contact':
        case 'resource':
        case 'resource cost':
            return {
                icon: <NotesIcon alt='contact' style={iconStyle} />,
                bg: '#EBEBFD',
            };
        default:
            return {
                icon: <NotesIcon alt='default' style={iconStyle} />,
                bg: '#F0F0F0',
            };
    }
};

// Width of time column (px) — keep in sync with the absolute line position
const TIME_COL_W = 62;
const DOT_COL_W = 24;
// The vertical line sits at the horizontal center of the dot column:
// TIME_COL_W + DOT_COL_W / 2 = 62 + 12 = 74px from group container left
const LINE_LEFT = TIME_COL_W + DOT_COL_W / 2;

const Timeline: React.FC<TimelineProps> = ({ entitytype }) => {
    const [searchParams] = useSearchParams();
    const { accountid } = useParams();
    const accountId = searchParams.get('accountID');

    const params: TimelineParams = {
        nextOffset: 1,
        limit: 10,
        account_rid: accountid || accountId || '',
        entityType: entitytype,
    };
    const isTimeLineView = searchParams.get('timelineview') === 'true';
    const { data, isLoading } = useTimelineList(params, isTimeLineView);

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

    const displayData: TimelineGroup[] = React.useMemo(() => {
        if (
            !data?.data?.timeLineEntries ||
            data.data.timeLineEntries.length === 0
        ) {
            return isLoading ? [] : mockTimelineData;
        }

        const groups: { [key: string]: TimelineItem[] } = {};

        data.data.timeLineEntries.forEach((item: any) => {
            const dateLabel = formatTimelineDate(item.created_datetime);
            const time = formatTimelineTime(item.created_datetime);

            const transformedItem: TimelineItem = {
                rid: item.rid,
                date: '',
                time: time,
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
    }, [data, isLoading]);

    if (isLoading) {
        return <TimelineSkeleton />;
    }

    return (
        <div style={{ padding: '12px 16px 8px 16px', background: '#fff' }}>
            {displayData.map((group, gIdx) => (
                <div
                    key={group.dateLabel}
                    style={{
                        marginBottom: gIdx < mockTimelineData.length - 1 ? '4px' : '8px',
                    }}
                >
                    {/* ── Date section divider: full-width horizontal line with badge on top ── */}
                    <div
                        style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '14px',
                            marginTop: gIdx === 0 ? 0 : '16px',
                        }}
                    >
                        {/* Badge sitting on top of the line — white bg punches through */}
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

                    {/* ── Items container (position:relative hosts the continuous vertical line) ── */}
                    <div style={{ position: 'relative' }}>
                        {/* Continuous straight vertical line for this group - starts from the date label area */}
                        <div
                            style={{
                                position: 'absolute',
                                left: `${LINE_LEFT}px`,
                                top: '-25px', // Start from above (near middle of date badge)
                                bottom: '8px', // End at last item dot
                                width: '1px',
                                background: '#CBD6E2',
                                zIndex: 0,
                            }}
                        />

                        {group.items.map((item, iIdx) => (
                            <div
                                key={item.rid}
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
                                            fontWeight: 700, // ← bold as in image
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
                                        zIndex: 1,
                                    }}
                                >
                                    {(() => {
                                        const { icon, bg } = getTypeIconConfig(item.entity_name);
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
                                                <Suspense
                                                    fallback={
                                                        <div
                                                            style={{
                                                                width: 10,
                                                                height: 10,
                                                                borderRadius: '50%',
                                                                background: '#CBD6E2',
                                                            }}
                                                        />
                                                    }
                                                >
                                                    {icon}
                                                </Suspense>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* ── Content column ── */}
                                <div style={{ flex: 1, paddingLeft: '6px' }}>
                                    {/* Title */}
                                    <div
                                        style={{
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            color: '#2D3E4F',
                                            lineHeight: '1.4',
                                        }}
                                    >
                                        {item.entity_name} {item.event_name} {item.descriptions}
                                    </div>

                                    {/* Subtitle — by user • date */}
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

                                    {/* {item.descriptions
                                        && (
                                            <div
                                                style={{
                                                    marginTop: '6px',
                                                    fontSize: '12px',
                                                    color: '#425A76',
                                                    lineHeight: '1.5',
                                                    padding: '5px 10px',
                                                    border: '1px solid #CBD6E2',
                                                    borderRadius: '2px',
                                                    background: '#F8FAFC',
                                                }}
                                            >
                                                {item.descriptions
                                                }
                                            </div>
                                        )}

                  
                                    {item.linkText && (
                                        <div
                                            style={{
                                                marginTop: '4px',
                                                fontSize: '12px',
                                                color: '#0BBFB7',
                                                cursor: 'pointer',
                                                textDecoration: 'underline',
                                            }}
                                        >
                                            {item.linkText}
                                        </div>
                                    )} */}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Timeline;
