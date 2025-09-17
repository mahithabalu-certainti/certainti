import {
  valueDisplay,
  costDisplay,
  getDateFormat,
} from '../../../../../../../common-utils';
import { ListTableColumn } from '../../../../../../../components/table/types';
import { ProjectTaskListType } from '../../../../../../types/project-task';

export const getProjectTaskColumns = (
  onClick: (row: ProjectTaskListType) => void,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<ProjectTaskListType>[] => {
  return [
    {
      id: 'resource_code',
      label: 'Resource Code',
      sortable: true,
      editId: 'resource_code',
      sortId: 'resource_code',
      width: 160,
      sticky: true,
      sx: {
        position: 'sticky',
        left: 0,
        background: '#fff',
        zIndex: 10,
        borderRight: '1px solid #CBD6E2 !important',
        borderBottom: '1px solid #CBD6E2 !important',
      },
      hide:
        !permissionMap?.['resource_code']?.read &&
        !permissionMap?.['resource_code']?.edit,
      render: (row: ProjectTaskListType) => (
        <span
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
          onClick={() => onClick(row)}
        >
          {row.resource_code}
        </span>
      ),
    },
    {
      id: 'resource_name',
      label: 'Resource Name',
      sortable: true,
      sortId: 'resource_name',
      width: 160,
      hide:
        !permissionMap?.['resource_name']?.read &&
        !permissionMap?.['resource_name']?.edit,
    },
    {
      id: 'resource_type_name',
      label: 'Resource Type',
      sortable: true,
      sortId: 'resource_type',
      width: 160,
      hide:
        !permissionMap?.['resource_type_name']?.read &&
        !permissionMap?.['resource_type_name']?.edit,
    },
    {
      id: 'resource_role',
      label: 'Resource Role',
      sortable: true,
      sortId: 'resource_role',
      width: 160,
      hide:
        !permissionMap?.['resource_role']?.read &&
        !permissionMap?.['resource_role']?.edit,
    },
    {
      id: 'start_date',
      label: 'Start Date',
      sortable: true,
      sortId: 'start_date',
      width: 160,
      hide:
        !permissionMap?.['start_date']?.read &&
        !permissionMap?.['start_date']?.edit,
      render: (row: ProjectTaskListType) =>
        row.start_date ? getDateFormat(row.start_date) : '-',
    },
    {
      id: 'end_date',
      label: 'End Date',
      sortable: true,
      sortId: 'end_date',
      width: 160,
      hide:
        !permissionMap?.['end_date']?.read &&
        !permissionMap?.['end_date']?.edit,
      render: (row: ProjectTaskListType) =>
        row.end_date ? getDateFormat(row.end_date) : '-',
    },
    {
      id: 'total_cost_pro_task',
      label: 'Cost',
      sortable: true,
      sortId: 'total_cost_pro_task',
      width: 130,
      sx: {
        textAlign: 'right',
      },
      hide:
        !permissionMap?.['total_cost_pro_task']?.read &&
        !permissionMap?.['total_cost_pro_task']?.edit,
      render: (row: ProjectTaskListType) =>
        row.total_cost_pro_task
          ? costDisplay(row.total_cost_pro_task, row.currency_symbol)
          : '-',
    },
    {
      id: 'total_hours_pro_task',
      label: 'Effort in Hrs',
      sortable: true,
      editId: 'total_hours_pro_task',
      sortId: 'total_hours_pro_task',
      width: 170,
      sx: {
        textAlign: 'right',
      },
      hide:
        !permissionMap?.['total_hours_pro_task']?.read &&
        !permissionMap?.['total_hours_pro_task']?.edit,
      render: (row: ProjectTaskListType) =>
        row.total_hours_pro_task ? valueDisplay(row.total_hours_pro_task) : '-',
    },
    {
      id: 'comments',
      label: 'Comments',
      editId: 'comments',
      sortable: true,
      sortId: 'comments',
      width: 200,
      hide:
        !permissionMap?.['comments']?.read &&
        !permissionMap?.['comments']?.edit,
    },
    {
      id: 'r_number',
      label: 'Project Task ID',
      sortable: true,
      sortId: 'r_number',
      width: 140,
      hide:
        !permissionMap?.['r_number']?.read &&
        !permissionMap?.['r_number']?.edit,
    },
  ];
};
