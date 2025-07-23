import {
  costDisplay,
  getDateFormat,
  // formatDateToYYYYMMDDWithTime,
  valueDisplay,
} from '../../../../../common-utils';
import { ProjectTaskListType } from '../../../../types/project-task';
interface TableColumn<T> {
  id: string;
  sortId: string;
  label: string;
  sortable?: boolean;
  width: string | number;
  sticky?: boolean;
  sx?: React.CSSProperties;
  render?: (row: T) => React.ReactNode;
}
export const formatDateToYMD = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ''; // Handle invalid dates
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};
export const getProjectTaskColumns = (
  onClick: (row: ProjectTaskListType) => void // onClick: (row: Project) => void
): TableColumn<ProjectTaskListType>[] => [
    // {
    //   id: 'project_task_id',
    //   label: 'Project Task ID',
    //   sortable: true,
    //   sortId: 'project_task_id',
    //   width: 180,
    //   render: (row: ProjectTaskListType) => (
    //     <span
    //       className='cursor-pointer hover:!text-blue-600 hover:underline'
    //       onClick={() => onClick(row)}
    //     >
    //       {row.project_task_id}
    //     </span>
    //   ),
    // },
    {
      id: 'resource_code',
      label: 'Resource Code',
      sortable: true,
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
    },
    {
      id: 'resource_type_name',
      label: 'Resource Type',
      sortable: true,
      sortId: 'resource_type_name',
      width: 160,
    },
    {
      id: 'resource_role',
      label: 'Resource Role',
      sortable: true,
      sortId: 'resource_role',
      width: 160,
    },
    {
      id: 'start_date',
      label: 'Task Date',
      sortable: true,
      sortId: 'start_date',
      width: 160,
      render: (row: ProjectTaskListType) =>
        row.start_date ? getDateFormat(row.start_date) : '-',
    },
    // {
    //   id: 'fiscal_year',
    //   label: 'Fiscal Year',
    //   sortable: true,
    //   sortId: 'fiscal_year',
    //   width: 130,
    //   sx: {
    //     textAlign: 'left',
    //   },
    //   render: (row: ProjectTaskListType) => {
    //     const displayYear = row.fiscal_year ? `FY-${row.fiscal_year}` : '-';
    //     return displayYear;
    //   },
    // },

    // {
    //   id: 'start_date',
    //   label: 'Start Date',
    //   sortable: true,
    //   sortId: 'start_date',
    //   width: 190,
    //   render: (row: ProjectTaskListType) =>
    //     row.start_date ? formatDateToYYYYMMDDWithTime(row.start_date) : '-',
    // },
    // {
    //   id: 'end_date',
    //   label: 'End Date',
    //   sortable: true,
    //   sortId: 'end_date',
    //   width: 190,
    //   render: (row: ProjectTaskListType) =>
    //     row.end_date ? formatDateToYYYYMMDDWithTime(row.end_date) : '-',
    // },
    {
      id: 'total_cost_pro_task',
      label: 'Cost',
      sortable: true,
      sortId: 'total_cost_pro_task',
      width: 130,
      sx: {
        textAlign: 'right',
      },
      render: (row: ProjectTaskListType) =>
        row.total_cost_pro_task
          ? costDisplay(row.total_cost_pro_task, row.currency_symbol)
          : '-',
    },
    {
      id: 'total_hours_pro_task',
      label: 'Effort',
      sortable: true,
      sortId: 'total_hours_pro_task',
      width: 170,
      sx: {
        textAlign: 'right',
      },
      render: (row: ProjectTaskListType) =>
        row.total_hours_pro_task ? valueDisplay(row.total_hours_pro_task) : '-',
    },
    {
      id: 'task_type',
      label: 'Task Type',
      sortable: true,
      sortId: 'task_type',
      width: 200,
    },

    {
      id: 'description',
      label: 'Task Description',
      sortable: true,
      sortId: 'description',
      width: 200,
    },

    {
      id: 'comments',
      label: 'Comments',
      sortable: true,
      sortId: 'comments',
      width: 200,
    },
    {
      id: 'country',
      label: 'Country',
      sortable: true,
      sortId: 'country',
      width: 170,
    },
    {
      id: 'region',
      label: 'Region',
      sortable: true,
      sortId: 'region',
      width: 160,
    },
    {
      id: 'r_number',
      label: 'Task ID',
      sortable: true,
      sortId: 'r_number',
      width: 140,
    },
  ];
