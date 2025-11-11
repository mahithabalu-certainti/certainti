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
    id: 'start_date',
    sortId: 'start_date',
    label: 'Start Date',
    width: 120,
    render: (row: CaseTaskType) => row.start_date || '-',
  },
  {
    id: 'due_date',
    sortId: 'due_date',
    label: 'Due Date',
    width: 120,
    render: (row: CaseTaskType) => row.due_date || '-',
  },
  {
    id: 'status',
    sortId: 'status',
    label: 'Status',
    width: 100,
    render: (row: CaseTaskType) => row.status || '-',
  },
];
