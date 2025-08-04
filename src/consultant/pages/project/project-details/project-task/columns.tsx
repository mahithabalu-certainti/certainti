import {
  costDisplay,
  getDateFormat,
  PROJECT_TASK_REGEX,
  valueDisplay,
} from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { SelectOption } from '../../../../types';
import { ProjectTaskListType } from '../../../../types/project-task';

export const formatDateToYMD = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};
export const getProjectTaskColumns = (
  onClick: (row: ProjectTaskListType) => void,
  memoizedProjectResourceCode: SelectOption[],
  permissionMapTaskTableColumn: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<ProjectTaskListType>[] => [
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
      editable:
        permissionMapTaskTableColumn?.['resource_code']?.read &&
        permissionMapTaskTableColumn?.['resource_code']?.edit,
      hide:
        !permissionMapTaskTableColumn?.['resource_code']?.read &&
        !permissionMapTaskTableColumn?.['resource_code']?.edit,
      field: {
        type: 'select',
        options: memoizedProjectResourceCode,
        required: true,
      },
      render: (row: ProjectTaskListType) => (
        <span
          className='cursor-pointer hover:!text-blue-600 hover:underline'
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
        !permissionMapTaskTableColumn?.['resource_name']?.read &&
        !permissionMapTaskTableColumn?.['resource_name']?.edit,
    },
    {
      id: 'resource_type_name',
      label: 'Resource Type',
      sortable: true,
      sortId: 'resource_type',
      width: 160,
      hide:
        !permissionMapTaskTableColumn?.['resource_type_name']?.read &&
        !permissionMapTaskTableColumn?.['resource_type_name']?.edit,
    },
    {
      id: 'resource_role',
      label: 'Resource Role',
      sortable: true,
      sortId: 'resource_role',
      width: 160,
      hide:
        !permissionMapTaskTableColumn?.['resource_role']?.read &&
        !permissionMapTaskTableColumn?.['resource_role']?.edit,
    },
    {
      id: 'start_date',
      label: 'Task Date',
      sortable: true,
      sortId: 'start_date',
      width: 160,
      hide:
        !permissionMapTaskTableColumn?.['start_date']?.read &&
        !permissionMapTaskTableColumn?.['start_date']?.edit,
      render: (row: ProjectTaskListType) =>
        row.start_date ? getDateFormat(row.start_date) : '-',
    },

    {
      id: 'total_cost_pro_task',
      label: 'Cost',
      sortable: true,
      editId: 'total_cost_pro_task',
      sortId: 'total_cost_pro_task',
      width: 130,
      sx: {
        textAlign: 'right',
      },
      editable:
        permissionMapTaskTableColumn?.['total_cost_pro_task']?.read &&
        permissionMapTaskTableColumn?.['total_cost_pro_task']?.edit,
      hide:
        !permissionMapTaskTableColumn?.['total_cost_pro_task']?.read &&
        !permissionMapTaskTableColumn?.['total_cost_pro_task']?.edit,
      field: {
        type: 'text',
        required: false,
        placeholder: 'Enter Cost',
        validation: [
          {
            regex: PROJECT_TASK_REGEX.COST_REGEX,
            errorMessage: 'Only positive numbers allowed, up to 16 digits and 2 decimal places',
          },
        ],
      },
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
      editable:
        permissionMapTaskTableColumn?.['total_hours_pro_task']?.read &&
        permissionMapTaskTableColumn?.['total_hours_pro_task']?.edit,
      hide:
        !permissionMapTaskTableColumn?.['total_hours_pro_task']?.read &&
        !permissionMapTaskTableColumn?.['total_hours_pro_task']?.edit,
      field: {
        type: 'text',
        required: false,
        placeholder: 'Enter an effort',
        validation: [
          {
            regex: PROJECT_TASK_REGEX.EFFORT,
            errorMessage: 'Only positive numbers allowed, up to 16 digits and 2 decimal places',
          },
        ],
      },
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
      editable:
        permissionMapTaskTableColumn?.['comments']?.read &&
        permissionMapTaskTableColumn?.['comments']?.edit,
      hide:
        !permissionMapTaskTableColumn?.['comments']?.read &&
        !permissionMapTaskTableColumn?.['comments']?.edit,
      field: {
        type: 'text',
        required: false,
        placeholder: 'Enter Comments',
        validation: [
          {
            regex: PROJECT_TASK_REGEX.DESCRIPTION,
            errorMessage: 'Maximum 2000 characters allowed',
          },
        ],
      },
    },
    {
      id: 'r_number',
      label: 'Project Task ID',
      sortable: true,
      sortId: 'r_number',
      width: 140,
      hide:
        !permissionMapTaskTableColumn?.['r_number']?.read &&
        !permissionMapTaskTableColumn?.['r_number']?.edit,
    },
  ];
