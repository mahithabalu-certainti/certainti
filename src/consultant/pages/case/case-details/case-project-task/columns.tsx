import { costDisplay, getDateFormat } from '../../../../../common-utils';
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
  total_cost_pro_task: string;
  currency_symbol: string;
  classification_type: string;
  start_date: string;
  end_date: string;
  cost: number;
  effort_hours: number;
  status: string;
  comments: string;
  project_task_id: string;
  status_name: string;
}

export const getCaseProjectTaskColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  projectPermissionMap: Record<string, { read: boolean; edit: boolean }>,
  onClick: (row: CaseProjectTaskRow) => void
): ListTableColumn<CaseProjectTaskRow>[] => [
    {
      id: 'resource_code',
      sortId: 'resource_code',
      label: 'Resource Code',
      width: 160,
      sortable: true,
      hide:
        !permissionMap?.['resource_code']?.read &&
        !permissionMap?.['resource_code']?.edit,

      render: (row: CaseProjectTaskRow) => {
        return (
          <span
            onClick={() => onClick(row)}
            className={
              'cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
            }
          >
            {row.resource_code}
          </span>
        );
      },
    },
    {
      id: 'resource_name',
      sortId: 'resource_name',
      label: 'Resource Name',
      width: 180,
      sortable: true,
      hide:
        !permissionMap?.['resource_name']?.read &&
        !permissionMap?.['resource_name']?.edit,
    },
    {
      id: 'project_code',
      sortId: 'project_code',
      label: 'Project Code',
      width: 180,
      sortable: true,
      sticky: true,
      sx: {
        position: 'sticky',
        left: 0,
        background: '#fff',
        zIndex: 10,
        borderRight: '1px solid #CBD6E2',
        borderBottom: '1px solid #CBD6E2 !important',
      },

      hide:
        !projectPermissionMap?.['project_code']?.read &&
        !projectPermissionMap?.['project_code']?.edit,
    },
    {
      id: 'project_name',
      sortId: 'project_name',
      label: 'Project Name',
      width: 200,
      sortable: true,
      hide:
        !projectPermissionMap?.['project_name']?.read &&
        !projectPermissionMap?.['project_name']?.edit,
    },

    {
      id: 'task_name',
      sortId: 'task_name',
      label: 'Task Name',
      width: 160,
      sortable: true,
      hide:
        !permissionMap?.['task_name']?.read &&
        !permissionMap?.['task_name']?.edit,
    },
    {
      id: 'resource_type_name',
      sortId: 'resource_type',
      label: 'Resource Type',
      width: 160,
      sortable: true,
      hide:
        !permissionMap?.['resource_type_name']?.read &&
        !permissionMap?.['resource_type_name']?.edit,
    },
    {
      id: 'project_resource_role',
      sortId: 'project_resource_role',
      label: 'Project Resource Role',
      width: 200,
      sortable: true,
      hide:
        !permissionMap?.['project_resource_role']?.read &&
        !permissionMap?.['project_resource_role']?.edit,
    },
    {
      id: 'task_type_name',
      sortId: 'task_type_name',
      label: 'Task Type',
      width: 160,
      sortable: true,
      hide:
        !permissionMap?.['task_type_rid']?.read &&
        !permissionMap?.['task_type_rid']?.edit,
    },
    {
      id: 'task_classification_name',
      sortId: 'task_classification_name',
      label: 'Classification Type',
      width: 180,
      sortable: true,
      hide:
        !permissionMap?.['task_classification_rid']?.read &&
        !permissionMap?.['task_classification_rid']?.edit,
    },
    {
      id: 'start_date',
      sortId: 'start_date',
      label: 'Start Date',
      width: 140,
      sortable: true,
      hide:
        !permissionMap?.['start_date']?.read &&
        !permissionMap?.['start_date']?.edit,
      render: (row) => getDateFormat(row.start_date),
    },
    {
      id: 'end_date',
      sortId: 'end_date',
      label: 'End Date',
      width: 140,
      sortable: true,
      hide:
        !permissionMap?.['end_date']?.read && !permissionMap?.['end_date']?.edit,
      render: (row) => getDateFormat(row.end_date),
    },
    {
      id: 'total_cost_pro_task',
      sortId: 'total_cost_pro_task',
      label: 'Cost',
      width: 140,
      sortable: true,
      render: (row) => costDisplay(row.total_cost_pro_task, row.currency_symbol),
      hide:
        !permissionMap?.['total_cost_pro_task']?.read &&
        !permissionMap?.['total_cost_pro_task']?.edit,
    },
    {
      id: 'total_hours_pro_task',
      sortId: 'total_hours_pro_task',
      label: 'Effort in Hrs',
      width: 160,
      sortable: true,
      hide:
        !permissionMap?.['total_cost_pro_task']?.read &&
        !permissionMap?.['total_cost_pro_task']?.edit,
    },
    {
      id: 'status_name',
      sortId: 'status_rid',
      label: 'Status',
      width: 130,
      sortable: true,
      hide:
        !permissionMap?.['status_action']?.edit &&
        !permissionMap?.['status_action']?.read,
      render: (row: CaseProjectTaskRow) => (
        <span
          className={`${row.status_name === 'Active'
            ? 'text-[#199806]'
            : row.status_name === 'In-Active'
              ? 'text-[#f44336] '
              : ''
            }`}
        >
          {row.status_name || '-'}
        </span>
      ),
    },
    {
      id: 'comments',
      sortId: 'comments',
      label: 'Comments',
      width: 200,
      sortable: true,
      hide:
        !permissionMap?.['comments']?.read && !permissionMap?.['comments']?.edit,
    },
    {
      id: 'r_number',
      sortId: 'r_number',
      label: 'Project Task ID',
      width: 200,
      sortable: true,
      hide:
        !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
    },
  ];
