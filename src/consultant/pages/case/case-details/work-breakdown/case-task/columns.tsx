import { ListTableColumn } from '../../../../../../components/table/types';
import { CaseTaskType } from '../../../../../services/case-task/case-task-service';
import dayjs from 'dayjs';

export const getCaseTaskListColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<CaseTaskType>[] => [
  {
    id: 'task_name',
    sortId: 'task_name',
    label: 'Task Name',
    sortable: true,
    width: 120,
    sticky: true,
    render: (row: CaseTaskType) => row.task_name || '-',
    sx: {
      position: 'sticky',
      left: 32,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    hide:
      !permissionMap['task_name']?.read && !permissionMap['task_name']?.edit,
  },
  {
    id: 'assigned_to_name',
    sortId: 'assigned_to_name',
    label: 'Assigned To',
    sortable: true,
    width: 120,
    render: (row: CaseTaskType) => row.assigned_to_name || '-',
    hide:
      !permissionMap['assigned_to']?.read &&
      !permissionMap['assigned_to']?.edit,
  },
  {
    id: 'role_name',
    sortId: 'role_name',
    label: 'Role To Be Assigned',
    sortable: true,
    width: 180,
    render: (row: CaseTaskType) => row.role_name || '-',
    // hide:
    //   !permissionMap['role_rid']?.read && !permissionMap['role_rid']?.edit,
  },
  {
    id: 'effective_start_datetime',
    sortId: 'effective_start_datetime',
    label: 'Start Date',
    sortable: true,
    width: 120,
    render: (row: CaseTaskType) =>
      row.effective_start_datetime
        ? dayjs(row.effective_start_datetime).format('YYYY-MMM-DD')
        : '',

    hide:
      !permissionMap['effective_start_datetime']?.read &&
      !permissionMap['effective_start_datetime']?.edit,
  },
  {
    id: 'effective_end_datetime',
    sortId: 'effective_end_datetime',
    label: 'Due Date',
    sortable: true,
    width: 120,
    render: (row: CaseTaskType) =>
      row.effective_end_datetime
        ? dayjs(row.effective_end_datetime).format('YYYY-MMM-DD')
        : '',
    hide:
      !permissionMap['effective_end_datetime']?.read &&
      !permissionMap['effective_end_datetime']?.edit,
  },
  {
    id: 'task_status_name',
    sortId: 'task_status_name',
    label: 'Status',
    sortable: true,
    width: 100,
    render: (row: CaseTaskType) => row.task_status_name || '-',
    hide:
      !permissionMap['status_rid']?.read && !permissionMap['status_rid']?.edit,
  },
];
