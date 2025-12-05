import { costDisplay } from '../../../../../common-utils';
import {
  ListTableColumn,
  RowData,
} from '../../../../../components/table/types';

export interface CaseProjectTaskRow extends RowData {
  rid: string;
  project_code: string;
  project_name: string;
  resource_code: string;
  resource_name: string;
  task_name: string;
  resource_type: string;
  project_resource_role: string;
  task_type: string;
  classification_type: string;
  start_date: string;
  end_date: string;
  cost: number;
  effort_hours: number;
  status: string;
  comments: string;
  project_task_id: string;
}

export const getCaseProjectTaskColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  onClick: (row: CaseProjectTaskRow) => void
): ListTableColumn<CaseProjectTaskRow>[] => [
  {
    id: 'project_code',
    sortId: 'project_code',
    label: 'Project Code',
    width: 180,
    sortable: true,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: CaseProjectTaskRow) => {
      return (
        <span
          onClick={() => onClick(row)}
          className={
            'cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
          }
        >
          {row.project_code}
        </span>
      );
    },
  },
  {
    id: 'project_name',
    sortId: 'project_name',
    label: 'Project Name',
    width: 200,
    sortable: true,
  },
  {
    id: 'resource_code',
    sortId: 'resource_code',
    label: 'Resource Code',
    width: 160,
    sortable: true,
  },
  {
    id: 'resource_orgname',
    sortId: 'resource_orgname',
    label: 'Resource Name',
    width: 180,
    sortable: true,
  },
  {
    id: 'task_name',
    sortId: 'task_name',
    label: 'Task Name',
    width: 160,
    sortable: true,
  },
  {
    id: 'resource_type_name',
    sortId: 'resource_type',
    label: 'Resource Type',
    width: 160,
    sortable: true,
  },
  {
    id: 'resource_role',
    sortId: 'project_resource_role',
    label: 'Project Resource Role',
    width: 200,
    sortable: true,
  },
  {
    id: 'task_type_name',
    sortId: 'task_type',
    label: 'Task Type',
    width: 160,
    sortable: true,
  },
  {
    id: 'task_classification_name',
    sortId: 'classification_type',
    label: 'Classification Type',
    width: 180,
    sortable: true,
  },
  {
    id: 'start_date',
    sortId: 'start_date',
    label: 'Start Date',
    width: 140,
    sortable: true,
  },
  {
    id: 'end_date',
    sortId: 'end_date',
    label: 'End Date',
    width: 140,
    sortable: true,
  },
  {
    id: 'total_cost_pro_task',
    sortId: 'cost',
    label: 'Cost',
    width: 140,
    sortable: true,
    render: (row) => costDisplay(row.cost),
  },
  {
    id: 'total_hours_pro_task',
    sortId: 'effort_hours',
    label: 'Effort in Hrs',
    width: 160,
    sortable: true,
  },
  {
    id: 'status_name',
    sortId: 'status',
    label: 'Status',
    width: 140,
    sortable: true,
  },
  {
    id: 'comments',
    sortId: 'comments',
    label: 'Comments',
    width: 200,
    sortable: true,
  },
  {
    id: 'r_number',
    sortId: 'project_task_id',
    label: 'Project Task ID',
    width: 200,
    sortable: true,
  },
];
