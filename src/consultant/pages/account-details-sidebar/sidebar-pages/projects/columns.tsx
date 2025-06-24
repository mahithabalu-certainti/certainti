import {
  costDisplay,
  formatDateToYYYYMMDDWithTime,
  valueDisplay,
} from '../../../../../common-utils';
import { Project } from '../../../../../components/table/types';
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
  onClick: (row: Project) => void
): TableColumn<Project>[] => [
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
    render: (row: Project) =>
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
  // {
  //   id: 'project_code',
  //   label: 'Project Code',
  //   sortable: true,
  //   sortId: 'project_code',
  //   width: 160,
  // },
  {
    id: 'project_name',
    label: 'Name',
    sortable: true,
    sortId: 'project_name',
    width: 160,
  },
  {
    id: 'project_type_name',
    label: 'Project Type',
    sortable: true,
    sortId: 'project_type_rid',
    width: 160,
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
    id: 'classification_name',
    label: 'Project Classification',
    sortable: true,
    sortId: 'classification_name',
    width: 170,
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
  {
    id: 'total_effort',
    label: 'Project Effort (Hours)',
    sortable: true,
    sortId: 'total_effort',
    width: 170,
    sx: {
      textAlign: 'right',
    },
    render: (row: Project) =>
      row.total_effort ? valueDisplay(row.total_effort) : '-',
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
    render: (row: Project) =>
      row.total_cost ? costDisplay(row.total_cost, row.currency_symbol) : '-',
  },
  {
    id: 'total_cost_fte',
    label: 'FTE Cost',
    sortable: true,
    sortId: 'total_cost_fte',
    width: 140,
    sx: {
      textAlign: 'right',
    },
    render: (row: Project) =>
      row.total_cost_fte
        ? costDisplay(row.total_cost_fte, row.currency_symbol)
        : '-',
  },
  {
    id: 'total_cost_subcon',
    label: 'SubCon Cost',
    sortable: true,
    sortId: 'total_cost_subcon',
    width: 140,
    sx: {
      textAlign: 'right',
    },
    render: (row: Project) =>
      row.total_cost_subcon
        ? costDisplay(row.total_cost_subcon, row.currency_symbol)
        : '-',
  },
  {
    id: 'total_cost_nonlabor',
    label: 'Non-Labor Cost',
    sortable: true,
    sortId: 'total_cost_nonlabor',
    width: 140,
    sx: {
      textAlign: 'right',
    },
    render: (row: Project) =>
      row.total_cost_nonlabor
        ? costDisplay(row.total_cost_nonlabor, row.currency_symbol)
        : '-',
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
    render: (row: Project) => (row.qre ? row.qre : '-'),
  },
  {
    id: 'qre_final',
    label: 'QRE',
    sortable: true,
    sortId: 'qre_final',
    width: 130,
    sx: {
      textAlign: 'right',
    },
    render: (row: Project) =>
      row.qre_final ? costDisplay(row.qre_final, row.currency_symbol) : '-',
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
    width: 190,
    render: (row: Project) =>
      row.modified_datetime
        ? formatDateToYYYYMMDDWithTime(row.modified_datetime)
        : '-',
  },
  {
    id: 'r_number',
    label: 'Project ID',
    sortable: true,
    sortId: 'r_number',
    width: 140,
  },
];
