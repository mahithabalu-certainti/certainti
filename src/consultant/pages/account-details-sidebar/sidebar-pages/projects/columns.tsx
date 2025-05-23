/* eslint-disable @typescript-eslint/no-explicit-any */
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
  if (!dateString) return 'NA';
  const date = new Date(dateString);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const renderWithTooltip = (value: any) => {
  const displayValue = (value ?? value === 0) ? String(value) : 'NA';
  return (
    <TruncateWithTooltip text={displayValue}>
      {displayValue}
    </TruncateWithTooltip>
  );
};

export const getProjectColumns = (
  onClick: (row: ProjectList) => void
): TableColumn[] => [
  {
    id: 'r_number',
    label: 'Project ID',
    sortable: true,
    sortId: 'r_number',
    width: '160px',
    render: (_value, row: ProjectList) => (
      <span
        className='cursor-pointer hover:!text-blue-600 hover:underline'
        onClick={() => onClick(row)}
      >
        {row.r_number || 'NA'}
      </span>
    ),
  },
  {
    id: 'project_code',
    label: 'Project Code',
    sortable: true,
    sortId: 'project_code',
    width: '180px',
    render: (_v, row) => renderWithTooltip(row.project_code),
  },
  {
    id: 'name',
    label: 'Project Name',
    sortable: true,
    sortId: 'name',
    width: '130px',
    render: (_v, row) => renderWithTooltip(row.name),
  },
  {
    id: 'fiscal_year',
    label: 'Fiscal Year',
    sortable: true,
    sortId: 'fiscal_year',
    width: '130px',
    render: (_v, row) => renderWithTooltip(row.fiscal_year),
  },
  {
    id: 'account_name',
    label: 'Account Name',
    sortable: true,
    sortId: 'account_name',
    width: '150px',
    render: (_v, row) => renderWithTooltip(row.account_name),
  },
  {
    id: 'industry_name',
    label: 'Industry',
    sortable: true,
    sortId: 'industry_name',
    width: '150px',
    render: (_v, row) => renderWithTooltip(row.industry_name),
  },
  {
    id: 'program_name',
    label: 'Program Name',
    sortable: true,
    sortId: 'program_name',
    width: '130px',
    render: (_v, row) => renderWithTooltip(row.program_name),
  },
  {
    id: 'project_startdate',
    label: 'Start Date',
    sortable: true,
    sortId: 'project_startdate',
    width: '180px',
    render: (_v, row) => renderWithTooltip(formatDate(row.project_startdate)),
  },
  {
    id: 'project_enddate',
    label: 'End Date',
    sortable: true,
    sortId: 'project_enddate',
    width: '180px',
    render: (_v, row) => renderWithTooltip(formatDate(row.project_enddate)),
  },
  {
    id: 'qualified_research_expenditure',
    label: 'Qualified Research Expenditure',
    sortable: true,
    sortId: 'qualified_research_expenditure',
    width: '200px',
    render: (_v, row) => renderWithTooltip(row.qualified_research_expenditure),
  },
  {
    id: 'is_rd_qualified',
    label: 'Is RD Qualified ?',
    sortable: true,
    sortId: 'is_rd_qualified',
    width: '130px',
    render: (_v, row) => renderWithTooltip(row.is_rd_qualified),
  },
  {
    id: 'qre',
    label: 'QRE %',
    sortable: true,
    sortId: 'qre',
    width: '130px',
    render: (_v, row) => renderWithTooltip(row.qre),
  },
  {
    id: 'total_cost',
    label: 'Cost',
    sortable: true,
    sortId: 'total_cost',
    width: '130px',
    render: (_v, row) => renderWithTooltip(row.total_cost),
  },
  {
    id: 'total_effort',
    label: 'Effort in hrs',
    sortable: true,
    sortId: 'total_effort',
    width: '130px',
    render: (_v, row) => renderWithTooltip(row.total_effort),
  },
  {
    id: 'total_fte',
    label: 'No of FTE',
    sortable: true,
    sortId: 'total_fte',
    width: '130px',
    render: (_v, row) => renderWithTooltip(row.total_fte),
  },
  {
    id: 'total_fte_cost',
    label: 'FTE Cost',
    sortable: true,
    sortId: 'total_fte_cost',
    width: '150px',
    render: (_v, row) => renderWithTooltip(row.total_fte_cost),
  },
  {
    id: 'total_sub_con',
    label: 'No of Sub Con',
    sortable: true,
    sortId: 'total_sub_con',
    width: '180px',
    render: (_v, row) => renderWithTooltip(row.total_sub_con),
  },
  {
    id: 'total_sub_con_cost',
    label: 'Sub Con Cost',
    sortable: true,
    sortId: 'total_sub_con_cost',
    width: '200px',
    render: (_v, row) => renderWithTooltip(row.total_sub_con_cost),
  },
  {
    id: 'total_non_labor_cost',
    label: 'Non labor Cost',
    sortable: true,
    sortId: 'total_non_labor_cost',
    width: '180px',
    render: (_v, row) => renderWithTooltip(row.total_non_labor_cost),
  },
  {
    id: 'comments',
    label: 'Comments',
    sortable: true,
    sortId: 'comments',
    width: '200px',
    render: (_v, row) => renderWithTooltip(row.comments),
  },
  {
    id: 'country_name',
    label: 'Country',
    sortable: true,
    sortId: 'country_name',
    width: '130px',
    render: (_v, row) => renderWithTooltip(row.country_name),
  },
  {
    id: 'region_name',
    label: 'Region',
    sortable: true,
    sortId: 'region_name',
    width: '130px',
    render: (_v, row) => renderWithTooltip(row.region_name),
  },
  {
    id: 'currency_code',
    label: 'Currency Code',
    sortable: true,
    sortId: 'currency_code',
    width: '130px',
    render: (_v, row) => renderWithTooltip(row.currency_code),
  },
  {
    id: 'project_status',
    label: 'Status',
    sortable: true,
    sortId: 'project_status',
    width: '130px',
    render: (_value, row: Project) => (
      <span
        className={
          row.project_status === 'Active'
            ? '!text-[#199806]'
            : '!text-[#f44336]'
        }
      >
        {row.project_status || 'NA'}
      </span>
    ),
  },
  {
    id: 'project_point_of_contact',
    label: 'Project POC',
    sortable: true,
    sortId: 'project_point_of_contact',
    width: '180px',
    render: (_v, row) => renderWithTooltip(row.project_point_of_contact),
  },
  {
    id: 'financial_consultant',
    label: 'Financial Consultant',
    sortable: true,
    sortId: 'financial_consultant',
    width: '180px',
    render: (_v, row) => renderWithTooltip(row.financial_consultant),
  },
  {
    id: 'technical_consultant',
    label: 'Technical Consultant',
    sortable: true,
    sortId: 'technical_consultant',
    width: '180px',
    render: (_v, row) => renderWithTooltip(row.technical_consultant),
  },
];
