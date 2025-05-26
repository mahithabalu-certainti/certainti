/* eslint-disable @typescript-eslint/no-explicit-any */
import { TruncateWithTooltip } from '../../../../../components';
import { ProjectColumn, ProjectList } from '../../../../types/project';
const renderWithTooltip = (value: any) => {
  const displayValue = (value ?? value === 0) ? String(value) : 'NA';
  return (
    <TruncateWithTooltip text={displayValue}>
      {displayValue}
    </TruncateWithTooltip>
  );
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'NA';
  const date = new Date(dateString);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
export const getProjectColumns = (
  onClick: (row: ProjectList) => void
): ProjectColumn<ProjectList>[] => [
  {
    id: 'r_number',
    header: 'Project ID',
    sortable: true,
    sort: 'r_number',
    width: '160px',
    render: (row: ProjectList) => (
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
    header: 'Project Code',
    sortable: true,
    sort: 'project_code',
    width: '180px',
    render: (row) => renderWithTooltip(row.project_code),
  },
  {
    id: 'name',
    header: 'Project Name',
    sortable: true,
    sort: 'name',
    width: '130px',
    render: (row) => renderWithTooltip(row.name),
  },
  {
    id: 'fiscal_year',
    header: 'Fiscal Year',
    sortable: true,
    sort: 'fiscal_year',
    width: '130px',
    render: (row) => renderWithTooltip(row.fiscal_year),
  },
  {
    id: 'account_name',
    header: 'Account Name',
    sortable: true,
    sort: 'account_name',
    width: '150px',
    render: (row) => renderWithTooltip(row.account_name),
  },
  {
    id: 'industry_name',
    header: 'Industry',
    sortable: true,
    sort: 'industry_name',
    width: '150px',
    render: (row) => renderWithTooltip(row.industry_name),
  },
  {
    id: 'program_name',
    header: 'Program Name',
    sortable: true,
    sort: 'program_name',
    width: '130px',
    render: (row) => renderWithTooltip(row.program_name),
  },
  {
    id: 'project_startdate',
    header: 'Start Date',
    sortable: true,
    sort: 'project_startdate',
    width: '180px',
    render: (row) => renderWithTooltip(formatDate(row.project_startdate)),
  },
  {
    id: 'project_enddate',
    header: 'End Date',
    sortable: true,
    sort: 'project_enddate',
    width: '180px',
    render: (row) => renderWithTooltip(formatDate(row.project_enddate)),
  },
  {
    id: 'qualified_research_expenditure',
    header: 'Qualified Research Expenditure',
    sortable: true,
    sort: 'qualified_research_expenditure',
    width: '200px',
    render: (row) => renderWithTooltip(row.qualified_research_expenditure),
  },
  {
    id: 'is_rd_qualified',
    header: 'Is RD Qualified ?',
    sortable: true,
    sort: 'is_rd_qualified',
    width: '130px',
    render: (row) => renderWithTooltip(row.is_rd_qualified),
  },
  {
    id: 'qre',
    header: 'QRE %',
    sortable: true,
    sort: 'qre',
    width: '130px',
    render: (row) => renderWithTooltip(row.qre),
  },
  {
    id: 'total_cost',
    header: 'Cost',
    sortable: true,
    sort: 'total_cost',
    width: '130px',
    render: (row) => renderWithTooltip(row.total_cost),
  },
  {
    id: 'total_effort',
    header: 'Effort in hrs',
    sortable: true,
    sort: 'total_effort',
    width: '130px',
    render: (row) => renderWithTooltip(row.total_effort),
  },
  {
    id: 'total_fte',
    header: 'No of FTE',
    sortable: true,
    sort: 'total_fte',
    width: '130px',
    render: (row) => renderWithTooltip(row.total_fte),
  },
  {
    id: 'total_fte_cost',
    header: 'FTE Cost',
    sortable: true,
    sort: 'total_fte_cost',
    width: '150px',
    render: (row) => renderWithTooltip(row.total_fte_cost),
  },
  {
    id: 'total_sub_con',
    header: 'No of Sub Con',
    sortable: true,
    sort: 'total_sub_con',
    width: '180px',
    render: (row) => renderWithTooltip(row.total_sub_con),
  },
  {
    id: 'total_sub_con_cost',
    header: 'Sub Con Cost',
    sortable: true,
    sort: 'total_sub_con_cost',
    width: '200px',
    render: (row) => renderWithTooltip(row.total_sub_con_cost),
  },
  {
    id: 'total_non_labor_cost',
    header: 'Non labor Cost',
    sortable: true,
    sort: 'total_non_labor_cost',
    width: '180px',
    render: (row) => renderWithTooltip(row.total_non_labor_cost),
  },
  {
    id: 'comments',
    header: 'Comments',
    sortable: true,
    sort: 'comments',
    width: '200px',
    render: (row) => renderWithTooltip(row.comments),
  },
  {
    id: 'country_name',
    header: 'Country',
    sortable: true,
    sort: 'country_name',
    width: '130px',
    render: (row) => renderWithTooltip(row.country_name),
  },
  {
    id: 'region_name',
    header: 'Region',
    sortable: true,
    sort: 'region_name',
    width: '130px',
    render: (row) => renderWithTooltip(row.region_name),
  },
  {
    id: 'currency_code',
    header: 'Currency Code',
    sortable: true,
    sort: 'currency_code',
    width: '130px',
    render: (row) => renderWithTooltip(row.currency_code),
  },
  {
    id: 'project_status',
    header: 'Status',
    sortable: true,
    sort: 'project_status',
    width: '130px',
    render: (row) => (
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
    header: 'Project POC',
    sortable: true,
    sort: 'project_point_of_contact',
    width: '180px',
    render: (row) => renderWithTooltip(row.project_point_of_contact),
  },
  {
    id: 'financial_consultant',
    header: 'Financial Consultant',
    sortable: true,
    sort: 'financial_consultant',
    width: '180px',
    render: (row) => renderWithTooltip(row.financial_consultant),
  },
  {
    id: 'technical_consultant',
    header: 'Technical Consultant',
    sortable: true,
    sort: 'technical_consultant',
    width: '180px',
    render: (row) => renderWithTooltip(row.technical_consultant),
  },
];
