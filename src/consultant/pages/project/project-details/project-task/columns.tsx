import {
  costDisplay,
  formatDateToYYYYMMDDWithTime,
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
  {
    id: 'project_task_id',
    label: 'Project Task ID',
    sortable: true,
    sortId: 'project_task_id',
    width: 180,
    render: (row: ProjectTaskListType) => (
      <span
        className='cursor-pointer hover:!text-blue-600 hover:underline'
        onClick={() => onClick(row)}
      >
        {row.project_task_id}
      </span>
    ),
  },
  {
    id: 'resource_code',
    label: 'Resource Code',
    sortable: true,
    sortId: 'resource_code',
    width: 160,
  },
  {
    id: 'project_resource_code',
    label: 'Project Resource Code',
    sortable: true,
    sortId: 'project_resource_code',
    width: 160,
  },
  {
    id: 'fiscal_year',
    label: 'Fiscal Year',
    sortable: true,
    sortId: 'fiscal_year',
    width: 130,
    sx: {
      textAlign: 'left',
    },
    render: (row: ProjectTaskListType) => {
      const displayYear = row.fiscal_year ? `FY-${row.fiscal_year}` : '-';
      return displayYear;
    },
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
    id: 'currency',
    label: 'Currency',
    sortable: true,
    sortId: 'currency',
    width: 160,
  },
  {
    id: 'start_date',
    label: 'Start Date',
    sortable: true,
    sortId: 'start_date',
    width: 190,
    render: (row: ProjectTaskListType) =>
      row.start_date ? formatDateToYYYYMMDDWithTime(row.start_date) : '-',
  },
  {
    id: 'end_date',
    label: 'End Date',
    sortable: true,
    sortId: 'end_date',
    width: 190,
    render: (row: ProjectTaskListType) =>
      row.end_date ? formatDateToYYYYMMDDWithTime(row.end_date) : '-',
  },
  {
    id: 'effort',
    label: 'Effort',
    sortable: true,
    sortId: 'effort',
    width: 170,
    sx: {
      textAlign: 'right',
    },
    render: (row: ProjectTaskListType) =>
      row.effort ? valueDisplay(row.effort) : '-',
  },
  {
    id: 'cost',
    label: 'Cost',
    sortable: true,
    sortId: 'cost',
    width: 130,
    sx: {
      textAlign: 'right',
    },
    render: (row: ProjectTaskListType) =>
      row.cost ? costDisplay(row.cost, row.currency_symbol) : '-',
  },
  {
    id: 'comment',
    label: 'Comments',
    sortable: true,
    sortId: 'comment',
    width: 200,
  },

  {
    id: 'rd_number',
    label: 'Record ID',
    sortable: true,
    sortId: 'rd_number',
    width: 140,
  },
];
