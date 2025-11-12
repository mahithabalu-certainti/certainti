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

export const getCaseProjectTaskColumns =
  (): ListTableColumn<CaseProjectTaskRow>[] => [
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
      id: 'resource_name',
      sortId: 'resource_name',
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
      id: 'resource_type',
      sortId: 'resource_type',
      label: 'Resource Type',
      width: 160,
      sortable: true,
    },
    {
      id: 'project_resource_role',
      sortId: 'project_resource_role',
      label: 'Project Resource Role',
      width: 200,
      sortable: true,
    },
    {
      id: 'task_type',
      sortId: 'task_type',
      label: 'Task Type',
      width: 160,
      sortable: true,
    },
    {
      id: 'classification_type',
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
      id: 'cost',
      sortId: 'cost',
      label: 'Cost',
      width: 140,
      sortable: true,
      render: (row) => costDisplay(row.cost),
    },
    {
      id: 'effort_hours',
      sortId: 'effort_hours',
      label: 'Effort in Hrs',
      width: 160,
      sortable: true,
    },
    {
      id: 'status',
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
      id: 'project_task_id',
      sortId: 'project_task_id',
      label: 'Project Task ID',
      width: 200,
      sortable: true,
    },
  ];
