import React, { useEffect, useRef, useState } from 'react';
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

// Icon config: returns { icon component, bg color } per type
type IconConfig = {
  icon: React.ReactNode;
  bg: string;
};

// Normalises any entity_name variant (snake_case, mixed case, spaces) → lowercase snake_case
// e.g. "Project Task" → "project_task", "resource_skill" → "resource_skill"
const normaliseEntityKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

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
  auto_rd_assessment: 'manual_rd_assessment',
  scheduler_rd_assessment: 'manual_rd_assessment',
  // Dossier
  dossier: 'dossier',
};

// Per-entity-type color config: { bg, iconColor }
const ICON_COLOR_MAP: Record<string, { bg: string; iconColor: string }> = {
  account: { bg: '#E8F0FE', iconColor: '#0B5CAB' },
  project: { bg: '#EDF7EE', iconColor: '#2E7D32' },
  case: { bg: '#FFF3E0', iconColor: '#E65100' },
  call_log: { bg: '#F3E5F5', iconColor: '#7B1FA2' },
  meeting: { bg: '#E1F5FE', iconColor: '#0277BD' },
  attachment: { bg: '#FFF8E1', iconColor: '#F57F17' },
  email: { bg: '#FCE4EC', iconColor: '#C2185B' },
  task: { bg: '#F7F1FF', iconColor: '#AF78FF' },
  notes: { bg: '#E0F7FA', iconColor: '#00838F' },
  resource: { bg: '#CBD6E2', iconColor: '#0B5CAB' },
  financial: { bg: '#E8F5E9', iconColor: '#1B5E20' },
  interaction: { bg: '#FBE9E7', iconColor: '#BF360C' },
  historical_submission: { bg: '#EDE7F6', iconColor: '#4527A0' },
  checklist: { bg: '#E8EAF6', iconColor: '#283593' },
  timesheet: { bg: '#E3F2FD', iconColor: '#1565C0' },
  import: { bg: '#F1F8E9', iconColor: '#33691E' },
  project_task: { bg: '#FFF3E0', iconColor: '#BF360C' },
  technical_summary: { bg: '#DFE8FF', iconColor: '#1755E7' },
  settings: { bg: '#ECEFF1', iconColor: '#37474F' },
  case_team: { bg: '#E8F0FE', iconColor: '#1755E7' },
  manual_rd_assessment: { bg: '#FFEFEF', iconColor: '#fd7eb3ff' },
  dossier: { bg: '#E0F2F1', iconColor: '#00695C' },
};

// Generates an inline SVG icon for each timeline entity type.
// Accepts the normalised iconKey, size (px), and iconColor.
const getTimelineIcon = (
  iconKey: string,
  size = 14,
  color = 'currentColor'
): React.ReactNode => {
  const s = `${size}`;
  const base = {
    width: s,
    height: s,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: '1.8',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (iconKey) {
    case 'account':
      return (
        <svg
          width={s}
          height={s}
          viewBox='0 0 16 16'
          fill='none'
          stroke={color}
          strokeWidth='1.2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M5.33334 6.66536V10.6654M8.00001 7.9987V10.6654M10.6667 5.33203V10.6654' />
          <path d='M12.6667 2.66602H3.33333C2.59695 2.66602 2 3.26297 2 3.99935V11.9993C2 12.7357 2.59695 13.3327 3.33333 13.3327H12.6667C13.403 13.3327 14 12.7357 14 11.9993V3.99935C14 3.26297 13.403 2.66602 12.6667 2.66602Z' />
        </svg>
      );

    case 'project':
      return (
        <svg
          width={s}
          height={s}
          viewBox='0 0 16 16'
          fill='none'
          stroke={color}
          strokeWidth='1.2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M10.6667 2.66602H12C12.3536 2.66602 12.6928 2.80649 12.9428 3.05654C13.1928 3.30659 13.3333 3.64573 13.3333 3.99935V13.3327C13.3333 13.6863 13.1928 14.0254 12.9428 14.2755C12.6928 14.5255 12.3536 14.666 12 14.666H3.99999C3.64637 14.666 3.30723 14.5255 3.05718 14.2755C2.80713 14.0254 2.66666 13.6863 2.66666 13.3327V3.99935C2.66666 3.64573 2.80713 3.30659 3.05718 3.05654C3.30723 2.80649 3.64637 2.66602 3.99999 2.66602H5.33332' />
          <path d='M10 1.33398H6.00001C5.63182 1.33398 5.33334 1.63246 5.33334 2.00065V3.33398C5.33334 3.70217 5.63182 4.00065 6.00001 4.00065H10C10.3682 4.00065 10.6667 3.70217 10.6667 3.33398V2.00065C10.6667 1.63246 10.3682 1.33398 10 1.33398Z' />
        </svg>
      );

    case 'case':
      return (
        <svg
          width={s}
          height={s}
          viewBox='0 0 12 12'
          fill='none'
          stroke={color}
          strokeWidth='1.2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M9.61556 3.93384H2.38456C1.81405 3.93384 1.35156 4.52246 1.35156 5.24857V9.85011C1.35156 10.5762 1.81405 11.1648 2.38456 11.1648H9.61556C10.1861 11.1648 10.6486 10.5762 10.6486 9.85011V5.24857C10.6486 4.52246 10.1861 3.93384 9.61556 3.93384Z' />
          <path d='M3.41748 3.41746C3.41748 2.73254 3.68956 2.07567 4.17388 1.59136C4.65819 1.10704 5.31506 0.834961 5.99998 0.834961C6.6849 0.834961 7.34177 1.10704 7.82608 1.59136C8.3104 2.07567 8.58248 2.73254 8.58248 3.41746' />
        </svg>
      );
    case 'call_log':
      return (
        <svg {...base}>
          <path d='M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.88 1.18 2 2 0 012.88 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0122 16.92z' />
        </svg>
      );
    case 'meeting':
      return (
        <svg {...base}>
          <rect x='3' y='4' width='18' height='18' rx='2' />
          <path d='M16 2v4M8 2v4M3 10h18' />
          <circle cx='12' cy='16' r='1' />
        </svg>
      );
    case 'attachment':
      return (
        <svg
          width={s}
          height={s}
          viewBox='0 0 12 12'
          fill='none'
          stroke={color}
          strokeWidth='1.2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M2.40585 6.0086L1.50604 5.1082C1.02837 4.63053 0.76001 3.98266 0.76001 3.30712C0.76001 2.63159 1.02837 1.98372 1.50604 1.50604C1.98372 1.02837 2.63159 0.76001 3.30712 0.76001C3.98266 0.76001 4.63053 1.02837 5.1082 1.50604L10.5112 6.90899C10.9813 7.38823 11.2432 8.03369 11.24 8.70501C11.2368 9.37633 10.9686 10.0192 10.4939 10.4939C10.0192 10.9686 9.37633 11.2368 8.70501 11.24C8.03369 11.2432 7.38823 10.9813 6.90899 10.5112L4.88311 8.48468C4.59459 8.18415 4.43537 7.7825 4.43962 7.36591C4.44387 6.94933 4.61124 6.55101 4.90583 6.25642C5.20042 5.96184 5.59874 5.79446 6.01532 5.79021C6.43191 5.78597 6.83356 5.94518 7.13409 6.2337L8.25959 7.35919' />
        </svg>
      );
    case 'email':
      return (
        <svg {...base}>
          <rect x='2' y='4' width='20' height='16' rx='2' />
          <polyline points='2,4 12,13 22,4' />
        </svg>
      );
    case 'task':
      return (
        <svg
          width={s}
          height={s}
          viewBox='0 0 16 16'
          fill='none'
          stroke={color}
          strokeWidth='1.3'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M9.59961 12.8C9.59961 12.8 10.1996 12.8 10.7996 14C10.7996 14 12.7058 11 14.3996 10.4' />
          <path d='M5.7002 2L5.7494 2.2958C5.8694 3.014 5.9294 3.3734 6.1814 3.587C6.4322 3.8 6.7964 3.8 7.5248 3.8H8.675C9.4028 3.8 9.767 3.8 10.019 3.587C10.271 3.3734 10.331 3.014 10.4504 2.2958L10.5002 2M5.7002 10.4H8.1002M5.7002 7.4H10.5002' />
          <path d='M13 8.5V2H3V14H8' />
        </svg>
      );
    case 'notes':
      return (
        <svg
          width={s}
          height={s}
          viewBox='0 0 12 14'
          fill='none'
          stroke={color}
          strokeWidth='1.2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M7.23671 2.67188H10.3282C10.4094 2.67184 10.4898 2.6878 10.5648 2.71885C10.6399 2.7499 10.7081 2.79543 10.7655 2.85285C10.8229 2.91026 10.8685 2.97842 10.8996 3.05345C10.9307 3.12848 10.9467 3.20889 10.9467 3.2901V8.85505L7.23671 12.565H1.67175C1.59054 12.5651 1.51011 12.5491 1.43507 12.518C1.36003 12.487 1.29184 12.4415 1.2344 12.384C1.17696 12.3266 1.1314 12.2585 1.10031 12.1834C1.06922 12.1084 1.05322 12.028 1.05322 11.9468V3.2901C1.05322 3.20889 1.06922 3.12848 1.10031 3.05345C1.1314 2.97842 1.17696 2.91026 1.2344 2.85285C1.29184 2.79543 1.36003 2.7499 1.43507 2.71885C1.51011 2.6878 1.59054 2.67184 1.67175 2.67188H4.7632' />
          <path d='M7.23682 8.8551V12.5651L10.9468 8.8551H7.23682Z' />
          <path d='M7.2367 4.52679V2.05329C7.2367 1.71197 6.95979 1.43506 6.61817 1.43506H5.38171C5.21772 1.43506 5.06044 1.50018 4.94445 1.61612C4.82846 1.73205 4.76326 1.8893 4.76318 2.05329V4.52679C4.76318 4.86811 5.0401 5.14502 5.38171 5.14502H6.61817C6.95949 5.14502 7.2367 4.86811 7.2367 4.52679Z' />
        </svg>
      );
    case 'case_team':
      return (
        <svg
          width={s}
          height={s}
          viewBox='0 0 24 24'
          fill='none'
          stroke={color}
          strokeWidth='1.8'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M19.902 13.161a7.876 7.876 0 0 0-3.956-8.1c0-.021.006-.04.006-.061a3.952 3.952 0 0 0-7.904 0c0 .02.006.04.006.06a7.876 7.876 0 0 0-3.956 8.101 3.946 3.946 0 1 0 4.242 5.93 7.855 7.855 0 0 0 7.32 0 3.945 3.945 0 1 0 4.242-5.93z M12 2.051A2.948 2.948 0 1 1 9.052 5 2.951 2.951 0 0 1 12 2.052z M5 19.949A2.948 2.948 0 1 1 7.948 17 2.951 2.951 0 0 1 5 19.948z M8.75 18.189A3.896 3.896 0 0 0 8.952 17a3.952 3.952 0 0 0-3.868-3.944A7.1 7.1 0 0 1 4.996 12a6.977 6.977 0 0 1 3.232-5.885 3.926 3.926 0 0 0 7.544 0A6.977 6.977 0 0 1 19.004 12a7.1 7.1 0 0 1-.088 1.056A3.952 3.952 0 0 0 15.048 17a3.896 3.896 0 0 0 .202 1.188 7.13 7.13 0 0 1-6.5 0z M19 19.948A2.948 2.948 0 1 1 21.948 17 2.951 2.951 0 0 1 19 19.948z' />
        </svg>
      );
    case 'financial':
      return (
        <svg
          width={s}
          height={s}
          viewBox='0 0 12 12'
          fill='none'
          stroke={color}
          strokeWidth='1.2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M1 1.5V10C1 10.5523 1.44772 11 2 11H10.5' />
          <path d='M3.04175 7.20837L4.96266 5.28746C5.07206 5.1781 5.2204 5.11666 5.37508 5.11666C5.52976 5.11666 5.67811 5.1781 5.78750 5.28746L6.56683 6.06679C6.67622 6.17615 6.82457 6.23758 6.97925 6.23758C7.13393 6.23758 7.28227 6.17615 7.39166 6.06679L10.0417 3.41671L10.4197 3.03812M10.4197 3.03812C10.2932 2.91154 10.1182 2.83337 9.92508 2.83337H7.70842M10.4197 3.03812C10.5469 3.16529 10.6251 3.34029 10.6251 3.53337V5.75004' />
        </svg>
      );
    case 'interaction':
      return (
        <svg {...base}>
          <rect x='2' y='2' width='20' height='20' rx='2' />
          <path d='M7 9h10M17 9l-2-2M17 9l-2 2' />
          <path d='M17 15H7M7 15l2-2M7 15l2 2' />
        </svg>
      );
    case 'historical_submission':
      return (
        <svg
          width={s}
          height={s}
          viewBox='0 0 24 24'
          fill='none'
          stroke={color}
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M21 11v7.5 a2.5 2.5 0 0 1-2.5 2.5H5.5 a2.5 2.5 0 0 1-2.5-2.5V5.5 a2.5 2.5 0 0 1 2.5-2.5h7.5' />
          <path d='M12.5 11.5L20.5 3.5' />
          <path d='M16.5 3.5h4v4' />
        </svg>
      );
    case 'checklist':
      return (
        <svg
          width={s}
          height={s}
          viewBox='0 0 14 10'
          fill='none'
          stroke={color}
          strokeWidth='1.2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M9.75 1L11.95 3.28571M11.95 1L9.75 3.28571M12.5 6.71429L10.575 9L9.475 7.85714M7.55 1H1.5V3.28571H7.55V1ZM7.55 6.71429H1.5V9H7.55V6.71429Z' />
        </svg>
      );
    case 'timesheet':
      return (
        <svg
          width={s}
          height={s}
          viewBox='0 0 12 12'
          fill='none'
          stroke={color}
          strokeWidth='1.2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M5.99992 10.4792C8.4737 10.4792 10.4791 8.47382 10.4791 6.00004C10.4791 3.52627 8.4737 1.52087 5.99992 1.52087C3.52614 1.52087 1.52075 3.52627 1.52075 6.00004C1.52075 8.47382 3.52614 10.4792 5.99992 10.4792Z' />
          <path d='M6 6.3125C6.17259 6.3125 6.3125 6.17259 6.3125 6C6.3125 5.82741 6.17259 5.6875 6 5.6875C5.82741 5.6875 5.6875 5.82741 5.6875 6C5.6875 6.17259 5.82741 6.3125 6 6.3125Z' />
          <path d='M6.31235 6H10.479M5.77964 6.22021L2.83276 9.16708' />
        </svg>
      );
    case 'import':
      return (
        <svg
          width={s}
          height={s}
          viewBox='0 0 12 12'
          fill='none'
          stroke={color}
          strokeWidth='1.2'
          strokeLinecap='round'
        >
          <path d='M1.45459 8.72729V10C1.45459 10.5523 1.90231 11 2.45459 11H9.5455C10.0978 11 10.5455 10.5523 10.5455 10V8.72729' />
          <path d='M5.99993 1V7.36364M2.81812 4.18182L5.21058 7.25785C5.61094 7.77259 6.38893 7.77259 6.78929 7.25785L9.18175 4.18182' />
        </svg>
      );
    case 'project_task':
      return (
        <svg
          width={s}
          height={s}
          viewBox='0 0 16 16'
          fill='none'
          stroke={color}
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M10.6667 2.66602H12C12.3536 2.66602 12.6928 2.80649 12.9428 3.05654C13.1928 3.30659 13.3333 3.64573 13.3333 3.99935V13.3327C13.3333 13.6863 13.1928 14.0254 12.9428 14.2755C12.6928 14.5255 12.3536 14.666 12 14.666H3.99999C3.64637 14.666 3.30723 14.5255 3.05718 14.2755C2.80713 14.0254 2.66666 13.6863 2.66666 13.3327V3.99935C2.66666 3.64573 2.80713 3.30659 3.05718 3.05654C3.30723 2.80649 3.64637 2.66602 3.99999 2.66602H5.33332' />
          <path d='M10 1.33398H6.00001C5.63182 1.33398 5.33334 1.63246 5.33334 2.00065V3.33398C5.33334 3.70217 5.63182 4.00065 6.00001 4.00065H10C10.3682 4.00065 10.6667 3.70217 10.6667 3.33398V2.00065C10.6667 1.63246 10.3682 1.33398 10 1.33398Z' />
          <path d='M5.5 8.5L7.2 10.2L10.5 6.8' />
        </svg>
      );
    case 'technical_summary':
      return (
        <svg
          width={s}
          height={s}
          viewBox='0 0 12 14'
          fill='none'
          stroke={color}
          strokeWidth='1.2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M7.13302 1.33496H2.60102C2.30053 1.33496 2.01234 1.45433 1.79987 1.66681C1.58739 1.87929 1.46802 2.16747 1.46802 2.46796V11.532C1.46802 11.8325 1.58739 12.1206 1.79987 12.3331C2.01234 12.5456 2.30053 12.665 2.60102 12.665H9.39902C9.69951 12.665 9.98769 12.5456 10.2002 12.3331C10.4126 12.1206 10.532 11.8325 10.532 11.532V4.73396L7.13302 1.33496Z' />
          <path d='M7.13281 1.33496V4.73396H10.5318' />
          <path d='M8.26562 10.7766V8.41614' />
          <path d='M6 10.7765V6.99988' />
          <path d='M3.73389 10.7766V9.36035' />
        </svg>
      );
    case 'settings':
      return (
        <svg
          width={s}
          height={s}
          viewBox='0 0 16 16'
          fill='none'
          stroke={color}
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path
            d='M13.25 4.18038C13.4791 4.31068 13.6694 4.49969 13.8012 4.72795C13.933 4.9562 14.0016 5.21546 14 5.47904V10.335C14 10.8744 13.7047 11.3717 13.228 11.6337L8.728 14.4804C8.5049 14.6029 8.25451 14.6671 8 14.6671C7.74549 14.6671 7.4951 14.6029 7.272 14.4804L2.772 11.6337C2.53878 11.5063 2.34408 11.3185 2.20827 11.09C2.07247 10.8616 2.00053 10.6008 2 10.335V5.47838C2 4.93904 2.29533 4.44238 2.772 4.18038L7.272 1.52704C7.50169 1.4004 7.75971 1.33398 8.022 1.33398C8.28429 1.33398 8.54231 1.4004 8.772 1.52704L13.272 4.18038H13.25Z'
            strokeWidth='1.6'
          />
          <path
            d='M6 8.00039C6 8.53082 6.21071 9.03953 6.58579 9.4146C6.96086 9.78967 7.46957 10.0004 8 10.0004C8.53043 10.0004 9.03914 9.78967 9.41421 9.4146C9.78929 9.03953 10 8.53082 10 8.00039C10 7.46995 9.78929 6.96125 9.41421 6.58617C9.03914 6.2111 8.53043 6.00039 8 6.00039C7.46957 6.00039 6.96086 6.2111 6.58579 6.58617C6.21071 6.96125 6 7.46995 6 8.00039Z'
            strokeWidth='2'
          />
        </svg>
      );
    case 'manual_rd_assessment':
      return (
        <svg {...base}>
          <polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2' />
        </svg>
      );
    case 'dossier':
      return (
        <svg
          width={s}
          height={s}
          viewBox='0 0 16 16'
          fill='none'
          stroke={color}
          strokeWidth='1.2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M10.6667 2.66602H12C12.3536 2.66602 12.6928 2.80649 12.9428 3.05654C13.1928 3.30659 13.3333 3.64573 13.3333 3.99935V13.3327C13.3333 13.6863 13.1928 14.0254 12.9428 14.2755C12.6928 14.5255 12.3536 14.666 12 14.666H3.99999C3.64637 14.666 3.30723 14.5255 3.05718 14.2755C2.80713 14.0254 2.66666 13.6863 2.66666 13.3327V3.99935C2.66666 3.64573 2.80713 3.30659 3.05718 3.05654C3.30723 2.80649 3.64637 2.66602 3.99999 2.66602H5.33332' />
          <path d='M10 1.33398H6.00001C5.63182 1.33398 5.33334 1.63246 5.33334 2.00065V3.33398C5.33334 3.70217 5.63182 4.00065 6.00001 4.00065H10C10.3682 4.00065 10.6667 3.70217 10.6667 3.33398V2.00065C10.6667 1.63246 10.3682 1.33398 10 1.33398Z' />
          <path d='M8 7V11' />
          <path d='M6 9H10' />
        </svg>
      );

    default:
      return (
        <svg
          width={s}
          height={s}
          viewBox='0 0 16 16'
          fill='none'
          stroke={color}
          strokeWidth='1.2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M5.33334 6.66536V10.6654M8.00001 7.9987V10.6654M10.6667 5.33203V10.6654' />
          <path d='M12.6667 2.66602H3.33333C2.59695 2.66602 2 3.26297 2 3.99935V11.9993C2 12.7357 2.59695 13.3327 3.33333 13.3327H12.6667C13.403 13.3327 14 12.7357 14 11.9993V3.99935C14 3.26297 13.403 2.66602 12.6667 2.66602Z' />
        </svg>
      );
  }
};

const getTypeIconConfig = (
  entity_name: string,
  // kept for API compatibility — no longer drives the color
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _entitytype: string
): IconConfig => {
  const iconKey = ICON_KEY_MAP[normaliseEntityKey(entity_name)];
  const colors = ICON_COLOR_MAP[iconKey] ?? {
    bg: '#CBD6E2',
    iconColor: '#0B5CAB',
  };
  const { bg, iconColor } = colors;

  return {
    icon: getTimelineIcon(iconKey ?? 'default', 14, iconColor),
    bg,
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
                        {icon}
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
