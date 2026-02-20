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

type TimelineItem = {
    id: string;
    date: string;
    time: string;
    type: 'task' | 'call' | 'meeting' | 'attachment' | 'survey' | 'note' | 'contact';
    title: string;
    subtitle?: string;
    description?: string;
    linkText?: string;
};

type TimelineProps = {
    entitytype: string
}

type TimelineGroup = {
    dateLabel: string;
    items: TimelineItem[];
};

// Mock Data
const mockTimelineData: TimelineGroup[] = [
    {
        dateLabel: 'Nov 21, 2024',
        items: [
            {
                id: '1',
                date: '',
                time: '05:26 PM',
                type: 'task',
                title: 'Task added Review Interaction questions',
                subtitle: 'by Matthew Michaels',
                description:
                    'Prepare a detailed and comprehensive quotation for the ABC Project, including all costs associated with materials, labor, services, and any other expenses.',
            },
            {
                id: '2',
                date: '',
                time: '01:14 PM',
                type: 'call',
                title: 'Call Logged',
                subtitle: 'by Matthew Michaels',
            },
            {
                id: '3',
                date: '',
                time: '09:41 AM',
                type: 'meeting',
                title: 'Meeting – Project ID TT2P001 scheduled',
                subtitle: 'by Matthew Michaels',
                description:
                    "Subject: Let's discuss the pointers provided by Prabhu and come up with the template to capture the requirements / design recommendations.",
            },
            {
                id: '4',
                date: '',
                time: '05:26 PM',
                type: 'attachment',
                title: 'Attachment added for Email',
                subtitle: 'by Matthew Michaels',
                linkText: 'Company Agreement.pdf',
            },
        ],
    },
    {
        dateLabel: 'Nov 20, 2024',
        items: [
            {
                id: '5',
                date: '',
                time: '05:26 PM',
                type: 'survey',
                title: 'Survey : Feedback on Email [Project/Design/Task] sent',
                subtitle: 'by Matthew Michaels',
            },
            {
                id: '6',
                date: '',
                time: '05:26 PM',
                type: 'note',
                title: 'Note added',
                subtitle: 'by Pooja Yelgati',
                description: 'Key Deliverables for Project ID TT2P001',
            },
            {
                id: '7',
                date: '',
                time: '05:26 PM',
                type: 'contact',
                title: 'Contact added - Benjamin Samuel',
                subtitle: 'by Matthew Michaels',
            },
        ],
    },
];

// Icon config: returns { icon component, bg color, stroke color } per type
type IconConfig = {
    icon: React.ReactNode;
    bg: string;
};

const getTypeIconConfig = (type: TimelineItem['type']): IconConfig => {
    const iconStyle = { width: '10px', height: '10px' };
    switch (type) {
        case 'task':
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
    console
    const accountRid = searchParams.get('account_rid');
    const params: TimelineParams = {
        nextOffset: 1,
        limit: 10,
        account_rid: accountid ?? '',
        entityType: entitytype,
    };
    const isTimeLineView = searchParams.get('timelineview') === 'true'
    const { data, isLoading, error } = useTimelineList(params, isTimeLineView);
    return (
        <div style={{ padding: '12px 16px 8px 16px', background: '#fff' }}>
            {mockTimelineData.map((group, gIdx) => (
                <div
                    key={group.dateLabel}
                    style={{ marginBottom: gIdx < mockTimelineData.length - 1 ? '4px' : '8px' }}
                >
                    {/* ── Date section divider: full-width horizontal line with badge on top ── */}
                    <div
                        style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '14px',
                            marginTop: gIdx === 0 ? 0 : '8px',
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
                            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" style={{ marginTop: '-1px' }}>
                                <rect x="1" y="2.5" width="12" height="10.5" rx="1.5" stroke="#425A76" strokeWidth="1.2" />
                                <path d="M1 5.5h12" stroke="#425A76" strokeWidth="1.2" />
                                <path d="M4.5 1v3M9.5 1v3" stroke="#425A76" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                            {group.dateLabel}
                        </span>
                    </div>

                    {/* ── Items container (position:relative hosts the continuous vertical line) ── */}
                    <div style={{ position: 'relative' }}>

                        {/* Continuous straight vertical line for this group */}
                        <div
                            style={{
                                position: 'absolute',
                                left: `${LINE_LEFT}px`,
                                top: '8px',       // align with center of first dot
                                bottom: '8px',    // align with center of last dot
                                width: '1px',
                                background: '#CBD6E2',
                                zIndex: 0,
                            }}
                        />

                        {group.items.map((item, iIdx) => (
                            <div
                                key={item.id}
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
                                            fontWeight: 700,          // ← bold as in image
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
                                        const { icon, bg } = getTypeIconConfig(item.type);
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
                                                <Suspense fallback={<div style={{ width: 10, height: 10, borderRadius: '50%', background: '#CBD6E2' }} />}>
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
                                        {item.title}
                                    </div>

                                    {/* Subtitle — by user • date */}
                                    {item.subtitle && (
                                        <div
                                            style={{
                                                marginTop: '2px',
                                                fontSize: '11px',
                                                color: '#425A76',
                                                lineHeight: '1.4',
                                            }}
                                        >
                                            {item.subtitle}
                                        </div>
                                    )}

                                    {/* Description — border ONLY here */}
                                    {item.description && (
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
                                            {item.description}
                                        </div>
                                    )}

                                    {/* Link text */}
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
                                    )}
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
