import { ListTableColumn } from '../../../../../../components/table/types';
import { CaseTaskType } from '../../../../../services/case-task/case-task-service';

export const getCaseTaskListColumns = (): ListTableColumn<CaseTaskType>[] => [
  {
    id: 'task_name',
    sortId: 'task_name',
    label: 'Task Name',
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
  },
  {
    id: 'assigned_to',
    sortId: 'assigned_to',
    label: 'Assigned To',
    width: 120,
    render: (row: CaseTaskType) => row.assigned_to || '-',
  },
  {
    id: 'effective_start_datetime',
    sortId: 'effective_start_datetime',
    label: 'Start Date',
    width: 120,
    render: (row: CaseTaskType) => row.effective_start_datetime || '-',
  },
  {
    id: 'effective_end_datetime',
    sortId: 'effective_end_datetime',
    label: 'End Date',
    width: 120,
    render: (row: CaseTaskType) => row.effective_end_datetime || '-',
  },
  {
    id: 'task_status_name',
    sortId: 'task_status_name',
    label: 'Status',
    width: 100,
    render: (row: CaseTaskType) => row.task_status_name || '-',
  },
];
