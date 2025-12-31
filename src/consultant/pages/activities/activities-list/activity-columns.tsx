import {
  formatDateToYYYYMMDDWithTime,
  formatDateToYyyyMmmDd,
  formatTimeToAMPM,
} from '../../../../common-utils';
import { ListTableColumn } from '../../../../components/table/types';
import { ActivityList, ActivityType } from '../../../types';

export const shouldHideColumn = (
  field: string,
  permissionMaps: Record<string, { read: boolean; edit: boolean }>[]
): boolean => {
  // hide = every module says (read=false && edit=false)
  return permissionMaps.every((map) => !map[field]?.read && !map[field]?.edit);
};

export const getActivityAllActivityListColumns = (
  handleViewActivity: (rowId: string, activityType: ActivityType) => void,
  permissionMaps: Record<string, { read: boolean; edit: boolean }>[]
): ListTableColumn<ActivityList>[] => [
  {
    id: 'r_number',
    label: 'Activity ID',
    sortable: true,
    sortId: 'r_number',
    width: 140,
    sticky: true,
    hide: shouldHideColumn('r_number', permissionMaps),
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row) =>
      handleViewActivity ? (
        <span
          onClick={() =>
            handleViewActivity(row.rid, row.activity_type as ActivityType)
          }
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        >
          {row.r_number}
        </span>
      ) : (
        <span>{row.r_number}</span>
      ),
  },
  {
    id: 'activity_type',
    label: 'Activity Type',
    sortable: true,
    sortId: 'activity_type',
    width: 160,
    hide: shouldHideColumn('activity_type', permissionMaps),
    render: (row) =>
      row?.activity_type?.toLowerCase() === 'call'
        ? 'Call Log'
        : row?.activity_type,
  },
  {
    id: 'created_by_name',
    label: 'Created By',
    sortable: true,
    sortId: 'created_by_name',
    width: 160,
    hide: shouldHideColumn('created_by_name', permissionMaps),
  },
  {
    id: 'status_name',
    label: 'Status',
    sortable: true,
    sortId: 'status_name',
    width: 160,
    hide: shouldHideColumn('status_rid', permissionMaps),
  },
  {
    id: 'attachment_level',
    sortId: 'attachment_level',
    label: 'Related Entity',
    width: 140,
    sortable: true,
    hide: shouldHideColumn('attachment_level', permissionMaps),
  },
  {
    id: 'attached_to',
    label: 'Related To Name',
    sortable: true,
    sortId: 'attached_to',
    width: 180,
    hide: shouldHideColumn('attached_to', permissionMaps),
  },
  {
    id: 'effective_end_datetime',
    label: 'Due Date',
    sortable: true,
    sortId: 'effective_end_datetime',
    width: 200,
    hide: shouldHideColumn('effective_end_datetime', permissionMaps),
    render: (row) =>
      row?.activity_type?.toLowerCase() === 'task'
        ? formatDateToYyyyMmmDd(row.effective_end_datetime || '')
        : '-',
  },
];

export const getActivityCallLogListColumns = (
  handleViewActivity: (rowId: string, activityType: ActivityType) => void,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<ActivityList>[] => [
  {
    id: 'r_number',
    label: 'Call ID',
    sortable: true,
    sortId: 'r_number',
    width: 140,
    sticky: true,
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row) =>
      handleViewActivity ? (
        <span
          onClick={() => handleViewActivity(row.rid, 'call')}
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        >
          {row.r_number}
        </span>
      ) : (
        <span>{row.r_number}</span>
      ),
  },
  {
    id: 'call_platform',
    label: 'Call Platform',
    sortable: true,
    sortId: 'call_platform',
    width: 160,
    hide:
      !permissionMap?.['call_platform']?.edit &&
      !permissionMap?.['call_platform']?.read,
  },
  {
    id: 'attachment_level',
    sortId: 'attachment_level',
    label: 'Related Entity',
    width: 140,
    sortable: true,
    hide:
      !permissionMap?.['attachment_level']?.edit &&
      !permissionMap?.['attachment_level']?.read,
  },
  {
    id: 'attached_to',
    label: 'Related To Name',
    sortable: true,
    sortId: 'attached_to',
    width: 180,
    hide:
      !permissionMap?.['attached_to']?.edit &&
      !permissionMap?.['attached_to']?.read,
  },
  {
    id: 'status_name',
    label: 'Call Status',
    sortable: true,
    sortId: 'status_name',
    width: 160,
    hide:
      !permissionMap?.['status_rid']?.edit &&
      !permissionMap?.['status_rid']?.read,
  },
  {
    id: 'effective_start_datetime',
    label: 'Call Start Date',
    sortable: true,
    sortId: 'effective_start_datetime',
    width: 200,
    render: (row) => formatDateToYYYYMMDDWithTime(row.effective_start_datetime),
    hide:
      !permissionMap?.['effective_start_datetime']?.edit &&
      !permissionMap?.['effective_start_datetime']?.read,
  },
  {
    id: 'effective_end_datetime',
    label: 'Call End Date',
    sortable: true,
    sortId: 'effective_end_datetime',
    width: 200,
    render: (row) => formatDateToYYYYMMDDWithTime(row.effective_end_datetime),
    hide:
      !permissionMap?.['effective_end_datetime']?.edit &&
      !permissionMap?.['effective_end_datetime']?.read,
  },
  {
    id: 'created_by_name',
    label: 'Created By',
    sortable: true,
    sortId: 'created_by_name',
    width: 160,
    hide:
      !permissionMap?.['created_by_name']?.edit &&
      !permissionMap?.['created_by_name']?.read,
  },
  {
    id: 'created_datetime',
    label: 'Created On',
    sortable: true,
    sortId: 'created_datetime',
    width: 200,
    render: (row) => formatDateToYYYYMMDDWithTime(row.created_datetime),
    hide:
      !permissionMap?.['created_datetime']?.edit &&
      !permissionMap?.['created_datetime']?.read,
  },
];

export const getActivityEmailListColumns = (
  handleViewActivity: (rowId: string, activityType: ActivityType) => void,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<ActivityList>[] => [
  {
    id: 'r_number',
    label: 'Email ID',
    sortable: true,
    sortId: 'r_number',
    width: 140,
    sticky: true,
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row) =>
      handleViewActivity ? (
        <span
          onClick={() => handleViewActivity(row.rid, 'email')}
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        >
          {row.r_number}
        </span>
      ) : (
        <span>{row.r_number}</span>
      ),
  },
  {
    id: 'status_name',
    label: 'Email Status',
    sortable: true,
    sortId: 'status_name',
    width: 160,
    hide:
      !permissionMap?.['status_rid']?.edit &&
      !permissionMap?.['status_rid']?.read,
  },
  {
    id: 'attachment_level',
    sortId: 'attachment_level',
    label: 'Related Entity',
    width: 140,
    sortable: true,
    hide:
      !permissionMap?.['attachment_level']?.edit &&
      !permissionMap?.['attachment_level']?.read,
  },
  {
    id: 'attached_to',
    label: 'Related To Name',
    sortable: true,
    sortId: 'attached_to',
    width: 180,
    hide:
      !permissionMap?.['attached_to']?.edit &&
      !permissionMap?.['attached_to']?.read,
  },
  {
    id: 'created_by_name',
    label: 'Created By',
    sortable: true,
    sortId: 'created_by_name',
    width: 160,
    hide:
      !permissionMap?.['created_by_name']?.edit &&
      !permissionMap?.['created_by_name']?.read,
  },
  {
    id: 'created_datetime',
    label: 'Created On',
    sortable: true,
    sortId: 'created_datetime',
    width: 200,
    render: (row) => formatDateToYYYYMMDDWithTime(row.created_datetime),
    hide:
      !permissionMap?.['created_datetime']?.edit &&
      !permissionMap?.['created_datetime']?.read,
  },
  {
    id: 'to_email',
    label: 'Email To',
    sortable: false,
    sortId: 'to_email',
    width: 180,
    hide:
      !permissionMap?.['to_email']?.edit && !permissionMap?.['to_email']?.read,
    render(row) {
      return Array.isArray(row.to_email) && row.to_email.length > 0 ? (
        <span>{row.to_email.join(', ')}</span>
      ) : (
        '-'
      );
    },
  },
  {
    id: 'subject',
    label: 'Email Subject',
    sortable: true,
    sortId: 'subject',
    width: 200,
    hide:
      !permissionMap?.['subject']?.edit && !permissionMap?.['subject']?.read,
  },
];

export const getActivityMeetingListColumns = (
  handleViewActivity: (rowId: string, activityType: ActivityType) => void,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<ActivityList>[] => [
  {
    id: 'r_number',
    label: 'Meeting ID',
    sortable: true,
    sortId: 'r_number',
    width: 140,
    sticky: true,
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row) =>
      handleViewActivity ? (
        <span
          onClick={() => handleViewActivity(row.rid, 'meeting')}
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        >
          {row.r_number}
        </span>
      ) : (
        <span>{row.r_number}</span>
      ),
  },
  {
    id: 'status_name',
    label: 'Meeting Status',
    sortable: true,
    sortId: 'status_name',
    width: 160,
    hide:
      !permissionMap?.['status_rid']?.edit &&
      !permissionMap?.['status_rid']?.read,
  },
  {
    id: 'created_datetime',
    label: 'Created On',
    sortable: true,
    sortId: 'created_datetime',
    width: 200,
    render: (row) => formatDateToYYYYMMDDWithTime(row.created_datetime),
    hide:
      !permissionMap?.['created_datetime']?.edit &&
      !permissionMap?.['created_datetime']?.read,
  },
  {
    id: 'invited_by',
    label: 'Invited By',
    sortable: true,
    sortId: 'invited_by',
    width: 160,
    hide:
      !permissionMap?.['invited_by']?.edit &&
      !permissionMap?.['invited_by']?.read,
  },
  {
    id: 'effective_start_time',
    label: 'Meeting Start Time',
    sortable: true,
    sortId: 'effective_start_time',
    width: 160,
    render: (row) => formatTimeToAMPM(row.effective_start_time),
    hide:
      !permissionMap?.['effective_start_time']?.edit &&
      !permissionMap?.['effective_start_time']?.read,
  },
  {
    id: 'effective_end_time',
    label: 'Meeting End Time',
    sortable: true,
    sortId: 'effective_end_time',
    width: 160,
    render: (row) => formatTimeToAMPM(row.effective_end_time),
    hide:
      !permissionMap?.['effective_start_time']?.edit &&
      !permissionMap?.['effective_start_time']?.read,
  },
  {
    id: 'attachment_level',
    sortId: 'attachment_level',
    label: 'Related Entity',
    width: 140,
    sortable: true,
    hide:
      !permissionMap?.['attachment_level']?.edit &&
      !permissionMap?.['attachment_level']?.read,
  },
  {
    id: 'attached_to',
    label: 'Related To Name',
    sortable: true,
    sortId: 'attached_to',
    width: 180,
    hide:
      !permissionMap?.['attached_to']?.edit &&
      !permissionMap?.['attached_to']?.read,
  },
];

export const getActivityTaskListColumns = (
  handleViewActivity: (rowId: string, activityType: ActivityType) => void,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<ActivityList>[] => [
  {
    id: 'r_number',
    label: 'Activity ID',
    sortable: true,
    sortId: 'r_number',
    width: 140,
    sticky: true,
    hide: !permissionMap['r_number']?.read && !permissionMap['r_number']?.edit,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row) =>
      handleViewActivity ? (
        <span
          onClick={() => handleViewActivity(row.rid, 'task')}
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
        >
          {row.r_number}
        </span>
      ) : (
        <span>{row.r_number}</span>
      ),
  },
  {
    id: 'task_name',
    label: 'Activity Name',
    sortable: true,
    sortId: 'task_name',
    width: 160,
    hide:
      !permissionMap['task_name']?.read && !permissionMap['task_name']?.edit,
  },
  {
    id: 'status_name',
    label: 'Task Status',
    sortable: true,
    sortId: 'status_name',
    width: 160,
    hide:
      !permissionMap['status_rid']?.read && !permissionMap['status_rid']?.edit,
  },
  {
    id: 'attachment_level',
    sortId: 'attachment_level',
    label: 'Related Entity',
    width: 140,
    sortable: true,
    hide:
      !permissionMap?.['attachment_level']?.edit &&
      !permissionMap?.['attachment_level']?.read,
  },
  {
    id: 'attached_to',
    label: 'Related To Name',
    sortable: true,
    sortId: 'attached_to',
    width: 180,
    hide:
      !permissionMap['attached_to']?.read &&
      !permissionMap['attached_to']?.edit,
  },
  {
    id: 'created_by_name',
    label: 'Created By',
    sortable: true,
    sortId: 'created_by_name',
    width: 160,
    hide:
      !permissionMap['created_by_name']?.read &&
      !permissionMap['created_by_name']?.edit,
  },
  {
    id: 'created_datetime',
    label: 'Created On',
    sortable: true,
    sortId: 'created_datetime',
    width: 200,
    render: (row) => formatDateToYYYYMMDDWithTime(row.created_datetime),
    hide:
      !permissionMap['created_datetime']?.read &&
      !permissionMap['created_datetime']?.edit,
  },
  {
    id: 'description',
    editId: 'description',
    sortId: 'description',
    label: 'Description',
    width: 200,
    sortable: true,
    hide:
      !permissionMap['description']?.read &&
      !permissionMap['description']?.edit,
  },
  {
    id: 'effective_end_datetime',
    label: 'Due Date',
    sortable: true,
    sortId: 'effective_end_datetime',
    width: 200,
    render: (row) => formatDateToYyyyMmmDd(row?.effective_end_datetime || ''),
    hide:
      !permissionMap?.['effective_end_datetime']?.edit &&
      !permissionMap?.['effective_end_datetime']?.read,
  },
  {
    id: 'assigned_to_name',
    label: 'Assigned To',
    sortable: true,
    sortId: 'assigned_to_name',
    width: 160,
    hide:
      !permissionMap?.['assigned_to']?.edit &&
      !permissionMap?.['assigned_to']?.read,
  },
];
