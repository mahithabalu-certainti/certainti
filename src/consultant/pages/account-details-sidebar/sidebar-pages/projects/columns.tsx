/* eslint-disable @typescript-eslint/no-explicit-any */
import { costDisplay } from '../../../../../common-utils';
import { ProjectList } from '../../../../types/project';
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
export const getProjectColumns = (
  onClick: (row: ProjectList) => void
): TableColumn<ProjectList>[] => [
  {
    // id: 'account_name',
    // label: 'Account Name',
    // sortable: true,
    // sortId: 'account_name',
    // width: 150,
    id: 'project_code',
    label: 'Project Code',
    sortable: true,
    sortId: 'project_code',
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
    render: (row: ProjectList) =>
      onClick ? (
        <span
          onClick={() => onClick(row)}
          className='cursor-pointer no-underline hover:underline hover:text-[#1755E7]'
        >
          {row.project_code}
        </span>
      ) : (
        row.project_code
      ),
  },
  {
    id: 'fiscal_year',
    label: 'Fiscal Year',
    sortable: true,
    sortId: 'fiscal_year',
    width: 130,
    sx: {
      textAlign: 'right',
    },
  },
  {
    id: 'project_client_group',
    label: 'Customer Group',
    sortable: true,
    sortId: 'project_client_group',
    width: 160,
  },
  {
    id: 'project_group',
    label: 'Project Group',
    sortable: true,
    sortId: 'project_group',
    width: 160,
  },
  // {
  //   id: 'project_code',
  //   label: 'Project Code',
  //   sortable: true,
  //   sortId: 'project_code',
  //   width: 160,
  // },
  {
    id: 'project_name',
    label: 'Project Name',
    sortable: true,
    sortId: 'project_name',
    width: 160,
  },
  {
    id: 'project_type',
    label: 'Project Type',
    sortable: true,
    sortId: 'project_type',
    width: 160,
  },
  {
    id: 'classification_name',
    label: 'Project Classification',
    sortable: true,
    sortId: 'classification_name',
    width: 170,
  },
  {
    id: 'total_effort',
    label: 'Project Effort (Hours)',
    sortable: true,
    sortId: 'total_effort',
    width: 170,
    sx: {
      textAlign: 'right',
    },
  },
  {
    id: 'total_cost',
    label: 'Project Cost',
    sortable: true,
    sortId: 'total_cost',
    width: 130,
    sx: {
      textAlign: 'right',
    },
    render: (row: ProjectList) =>
      row.total_cost ? costDisplay(row.total_cost) : '-',
  },
  {
    id: 'total_fte_cost',
    label: 'FTE Cost',
    sortable: true,
    sortId: 'total_fte_cost',
    width: 140,
    sx: {
      textAlign: 'right',
    },
    render: (row: ProjectList) =>
      row.total_fte_cost ? costDisplay(row.total_fte_cost) : '-',
  },
  {
    id: 'total_sub_con_cost',
    label: 'SubCon Cost',
    sortable: true,
    sortId: 'total_sub_con_cost',
    width: 140,
    sx: {
      textAlign: 'right',
    },
    render: (row: ProjectList) =>
      row.total_sub_con_cost ? costDisplay(row.total_sub_con_cost) : '-',
  },
  {
    id: 'total_non_labor_cost',
    label: 'Non-Labor Cost',
    sortable: true,
    sortId: 'total_non_labor_cost',
    width: 140,
    sx: {
      textAlign: 'right',
    },
    render: (row: ProjectList) =>
      row.total_non_labor_cost ? costDisplay(row.total_non_labor_cost) : '-',
  },
  {
    id: 'assessment_status',
    label: 'Assessment Status',
    sortable: true,
    sortId: 'assessment_status',
    width: 180,
  },
  {
    id: 'qre',
    label: 'QRE %',
    sortable: true,
    sortId: 'qre',
    width: 130,
    sx: {
      textAlign: 'right',
    },
    render: (row: ProjectList) => (row.qre ? costDisplay(row.qre) : '-'),
  },
  {
    id: 'qualified_research_expenditure',
    label: 'QRE',
    sortable: true,
    sortId: 'qualified_research_expenditure',
    width: 130,
    sx: {
      textAlign: 'right',
    },
    render: (row: ProjectList) =>
      row.qualified_research_expenditure
        ? costDisplay(row.qualified_research_expenditure)
        : '-',
  },
  {
    id: 'project_point_of_contact',
    label: 'Project Point of Contact',
    sortable: true,
    sortId: 'project_point_of_contact',
    width: 200,
  },
  {
    id: 'technical_point_of_contact',
    label: 'Technical Point of Contact',
    sortable: true,
    sortId: 'technical_point_of_contact',
    width: 210,
  },
  {
    id: 'comments',
    label: 'Comments',
    sortable: true,
    sortId: 'comments',
    width: 200,
  },
  {
    id: 'modified_datetime',
    label: 'Last Modified',
    sortable: true,
    sortId: 'modified_datetime',
    width: 130,
    render: (row: ProjectList) =>
      row.modified_datetime ? formatDateToYMD(row.modified_datetime) : '-',
  },
  {
    id: 'r_number',
    label: 'Project ID',
    sortable: true,
    sortId: 'r_number',
    width: 140,
  },
];
