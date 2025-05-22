import { TruncateWithTooltip } from '../../../../../components';
import { Project, ProjectList } from '../../../../types/project';

interface TableColumn {
  id: string;
  sortId: string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  render?: (value: any, row: any) => React.ReactNode;
}
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getProjectColumns = (
  onClick: (row: ProjectList) => void
): TableColumn[] => [
  {
    id: 'project_number',
    label: 'Project Number',
    sortable: true,
    sortId: 'project_number',
    width: '160px',
    render: (_value, row: ProjectList) => (
      <span
        className='cursor-pointer hover:!text-blue-600 hover:underline'
        onClick={() => onClick(row)}
      >
        {row.r_number}
      </span>
    ),
  },
  {
    id: 'project_code',
    label: 'Project code',
    sortable: true,
    sortId: 'project_code',
    width: '180px',
    render: (_value, row: Project) => (
      <TruncateWithTooltip text={String(row.project_code)}>
        {row.project_code}
      </TruncateWithTooltip>
    ),
  },
  {
    id: 'industry_name',
    label: 'Industry',
    sortable: true,
    sortId: 'industry',
    width: '150px',
    render: (_value, row: Project) => (
      <TruncateWithTooltip text={String(row.industry_name)}>
        {row.industry_name}
      </TruncateWithTooltip>
    ),
  },
  {
    id: 'project_startdate',
    label: 'Project Start Date',
    sortable: true,
    sortId: 'project_start_date',
    width: '180px',
    render: (_value, row: Project) => (
      <span>{formatDate(row.project_startdate)}</span>
    ),
  },
  {
    id: 'project_enddate',
    label: 'Project End Date',
    sortable: true,
    sortId: 'project_end_date',
    width: '180px',
    render: (_value, row: Project) => (
      <span>{formatDate(row.project_enddate)}</span>
    ),
  },

  {
    id: 'status',
    label: 'Status',
    sortable: true,
    sortId: 'status',
    width: '130px',
    render: (_value, row: Project) => (
      <span
        className={
          row.project_status === 'Active'
            ? '!text-[#199806]'
            : '!text-[#f44336]'
        }
      >
        {row.project_status}
      </span>
    ),
  },
];
