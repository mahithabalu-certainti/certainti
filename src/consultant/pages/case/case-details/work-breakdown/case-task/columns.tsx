import { ListTableColumn } from '../../../../../../components/table/types';
import { CaseTaskType } from '../../../../../services/case-task/case-task-service';

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
      hide: !permissionMap['task_name']?.read && !permissionMap['task_name']?.edit,
    },
    {
      id: 'assigned_to_name',
      sortId: 'assigned_to_name',
      label: 'Assigned To',
      sortable: true,
      width: 120,
      render: (row: CaseTaskType) => row.assigned_to_name || '-',
      hide:
        !permissionMap['assigned_to']?.read && !permissionMap['assigned_to']?.edit,
    },
    {
      id: 'effective_start_datetime',
      sortId: 'effective_start_datetime',
      label: 'Start Date',
      sortable: true,
      width: 120,
      render: (row: CaseTaskType) => row.effective_start_datetime || '-',
      hide:
        !permissionMap['effective_start_datetime']?.read &&
        !permissionMap['effective_start_datetime']?.edit,
    },
    {
      id: 'effective_end_datetime',
      sortId: 'effective_end_datetime',
      label: 'End Date',
      sortable: true,
      width: 120,
      render: (row: CaseTaskType) => row.effective_end_datetime || '-',
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
        !permissionMap['status_rid']?.read &&
        !permissionMap['status_rid']?.edit,
    },
  ];
