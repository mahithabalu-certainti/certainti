import { ListTableColumn } from '../../../../components/table/types';
import { ActivityList, ActivityType } from '../../../types';

export const getActivityAllActivityListColumns = (
  handleViewActivity: (rowId: string, activityType: ActivityType) => void
): ListTableColumn<ActivityList>[] => [
  {
    id: 'r_number',
    label: 'Activity ID',
    sortable: true,
    sortId: 'r_number',
    width: 140,
    sticky: true,
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
  },
  {
    id: 'created_by_name',
    label: 'Created By',
    sortable: true,
    sortId: 'created_by_name',
    width: 160,
  },
  {
    id: 'status_name',
    label: 'Status',
    sortable: true,
    sortId: 'status_name',
    width: 160,
  },
  {
    id: 'attached_to',
    label: 'Related To',
    sortable: true,
    sortId: 'attached_to',
    width: 180,
  },
  {
    id: 'due_date',
    label: 'Due Date',
    sortable: true,
    sortId: 'due_date',
    width: 160,
  },
];

export const getActivityCallLogListColumns = (
  handleViewActivity: (rowId: string, activityType: ActivityType) => void
): ListTableColumn<ActivityList>[] => [
  {
    id: 'r_number',
    label: 'Call ID',
    sortable: true,
    sortId: 'r_number',
    width: 140,
    sticky: true,
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
    id: 'activity_type',
    label: 'Call Type',
    sortable: true,
    sortId: 'activity_type',
    width: 160,
  },
  {
    id: 'attached_to',
    label: 'Related To',
    sortable: true,
    sortId: 'attached_to',
    width: 180,
  },
  {
    id: 'status_name',
    label: 'Call Status',
    sortable: true,
    sortId: 'status_name',
    width: 160,
  },
];

export const getActivityEmailListColumns = (
  handleViewActivity: (rowId: string, activityType: ActivityType) => void
): ListTableColumn<ActivityList>[] => [
  {
    id: 'r_number',
    label: 'Email ID',
    sortable: true,
    sortId: 'r_number',
    width: 140,
    sticky: true,
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
  },
  {
    id: 'created_datetime',
    label: 'Created On',
    sortable: true,
    sortId: 'created_datetime',
    width: 160,
  },
  {
    id: 'attached_to',
    label: 'Related To',
    sortable: true,
    sortId: 'attached_to',
    width: 180,
  },
];

export const getActivityMeetingListColumns = (
  handleViewActivity: (rowId: string, activityType: ActivityType) => void
): ListTableColumn<ActivityList>[] => [
  {
    id: 'r_number',
    label: 'Meeting ID',
    sortable: true,
    sortId: 'r_number',
    width: 140,
    sticky: true,
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
  },
  {
    id: 'created_datetime',
    label: 'Created On',
    sortable: true,
    sortId: 'created_datetime',
    width: 160,
  },
  {
    id: 'invited_by',
    label: 'Invited By',
    sortable: true,
    sortId: 'invited_by',
    width: 160,
  },
  {
    id: 'attached_to',
    label: 'Related To',
    sortable: true,
    sortId: 'attached_to',
    width: 180,
  },
];

export const getActivityTaskListColumns = (
  handleViewActivity: (rowId: string, activityType: ActivityType) => void
  // permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<ActivityList>[] => [
  {
    id: 'r_number',
    label: 'Task ID',
    sortable: true,
    sortId: 'r_number',
    width: 140,
    sticky: true,
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
    id: 'created_by_name',
    label: 'Created By',
    sortable: true,
    sortId: 'created_by_name',
    width: 160,
  },
  {
    id: 'status_name',
    label: 'Task Status',
    sortable: true,
    sortId: 'status_name',
    width: 160,
  },
  {
    id: 'attached_to',
    label: 'Related To',
    sortable: true,
    sortId: 'attached_to',
    width: 180,
  },
  {
    id: 'due_date',
    label: 'Due Date',
    sortable: true,
    sortId: 'due_date',
    width: 160,
  },
];
