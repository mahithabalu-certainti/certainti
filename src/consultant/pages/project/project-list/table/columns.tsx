import { costDisplay } from '../../../../../common-utils';
import { ProjectTableColumn, ProjectList } from '../../../../types/project';
import { formatDateToYYYYMMDD } from '../../../account-details-sidebar/sidebar-pages/resources/utils';

export const getAllProjectListColumns = (
  onClick: (row: ProjectList) => void
): ProjectTableColumn<ProjectList>[] => [
  {
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
    id: 'project_name',
    label: 'Name',
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
    id: 'account_name',
    label: 'Account Name',
    sortable: true,
    sortId: 'account_name',
    width: 150,
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
      row.total_cost ? costDisplay(row.total_cost, row.currency_symbol) : '-',
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
      row.total_fte_cost
        ? costDisplay(row.total_fte_cost, row.currency_symbol)
        : '-',
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
      row.total_sub_con_cost
        ? costDisplay(row.total_sub_con_cost, row.currency_symbol)
        : '-',
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
      row.total_non_labor_cost
        ? costDisplay(row.total_non_labor_cost, row.currency_symbol)
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
    render: (row: ProjectList) =>
      row.qre ? costDisplay(row.qre, row.currency_symbol) : '-',
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
        ? costDisplay(row.qualified_research_expenditure, row.currency_symbol)
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
    width: 190,
    render: (row: ProjectList) =>
      row.modified_datetime ? formatDateToYYYYMMDD(row.modified_datetime) : '-',
  },
  {
    id: 'r_number',
    label: 'Project ID',
    sortable: true,
    sortId: 'r_number',
    width: 140,
  },
];

// export const getAllProjectListColumns = (
//   onClick: (row: ProjectList) => void
// ): ProjectTableColumn<ProjectList>[] => [
//   {
//     id: 'project_code',
//     label: 'Project Code',
//     sortable: true,
//     sortId: 'project_code',
//     width: 160,
//     sticky: true,
//     sx: {
//       position: 'sticky',
//       left: 0,
//       background: '#fff',
//       zIndex: 10,
//       borderRight: '1px solid #CBD6E2 !important',
//       borderBottom: '1px solid #CBD6E2 !important',
//     },
//     render: (row: ProjectList) =>
//       onClick ? (
//         <span
//           onClick={() => onClick(row)}
//           className='cursor-pointer no-underline hover:underline hover:text-[#1755E7]'
//         >
//           {row.project_code}
//         </span>
//       ) : (
//         row.project_code
//       ),
//   },
//   {
//     id: 'project_name',
//     label: 'Project Name',
//     sortable: true,
//     sortId: 'project_name',
//     width: 160,
//   },
//   {
//     id: 'fiscal_year',
//     label: 'Fiscal Year',
//     sortable: true,
//     sortId: 'fiscal_year',
//     width: 130,
//   },
//   {
//     id: 'account_name',
//     label: 'Account Name',
//     sortable: true,
//     sortId: 'account_name',
//     width: 150,
//   },
//   {
//     id: 'industry_name',
//     label: 'Industry',
//     sortable: true,
//     sortId: 'industry_name',
//     width: 160,
//   },
//   {
//     id: 'program_name',
//     label: 'Program Name',
//     sortable: true,
//     sortId: 'program_name',
//     width: 180,
//   },
//   {
//     id: 'project_startdate',
//     label: 'Start Date',
//     sortable: true,
//     sortId: 'project_startdate',
//     width: 140,
//   },
//   {
//     id: 'project_enddate',
//     label: 'End Date',
//     sortable: true,
//     sortId: 'project_enddate',
//     width: 140,
//   },
//   {
//     id: 'qualified_research_expenditure',
//     label: 'Qualified Research Expenditure',
//     sortable: true,
//     sortId: 'qualified_research_expenditure',
//     width: 250,
//   },
//   {
//     id: 'is_rd_qualified',
//     label: 'Is RD Qualified ?',
//     sortable: true,
//     sortId: 'is_rd_qualified',
//     width: 160,
//   },
//   {
//     id: 'qre',
//     label: 'QRE %',
//     sortable: true,
//     sortId: 'qre',
//     width: 130,
//   },
//   {
//     id: 'total_cost',
//     label: 'Cost',
//     sortable: true,
//     sortId: 'total_cost',
//     width: 130,
//   },
//   {
//     id: 'total_effort',
//     label: 'Effort in hrs',
//     sortable: true,
//     sortId: 'total_effort',
//     width: 130,
//   },
//   {
//     id: 'total_fte',
//     label: 'No of FTE',
//     sortable: true,
//     sortId: 'total_fte',
//     width: 130,
//   },
//   {
//     id: 'total_fte_cost',
//     label: 'FTE Cost',
//     sortable: true,
//     sortId: 'total_fte_cost',
//     width: 140,
//   },
//   {
//     id: 'total_sub_con',
//     label: 'No of Sub Con',
//     sortable: true,
//     sortId: 'total_sub_con',
//     width: 140,
//   },
//   {
//     id: 'total_sub_con_cost',
//     label: 'Sub Con Cost',
//     sortable: true,
//     sortId: 'total_sub_con_cost',
//     width: 140,
//   },
//   {
//     id: 'total_non_labor_cost',
//     label: 'Non labor Cost',
//     sortable: true,
//     sortId: 'total_non_labor_cost',
//     width: 140,
//   },
//   {
//     id: 'comments',
//     label: 'Comments',
//     sortable: true,
//     sortId: 'comments',
//     width: 200,
//   },
//   {
//     id: 'country_name',
//     label: 'Country',
//     sortable: true,
//     sortId: 'country_name',
//     width: 160,
//   },
//   {
//     id: 'region_name',
//     label: 'Region',
//     sortable: true,
//     sortId: 'region_name',
//     width: 160,
//   },
//   {
//     id: 'currency_code',
//     label: 'Currency Code',
//     sortable: true,
//     sortId: 'currency_code',
//     width: 130,
//   },
//   {
//     id: 'project_status',
//     label: 'Status',
//     sortable: true,
//     sortId: 'project_status',
//     width: 130,
//   },
//   {
//     id: 'project_point_of_contact',
//     label: 'Project POC',
//     sortable: true,
//     sortId: 'project_point_of_contact',
//     width: 180,
//   },
//   {
//     id: 'financial_consultant',
//     label: 'Financial Consultant',
//     sortable: true,
//     sortId: 'financial_consultant',
//     width: 180,
//   },
//   {
//     id: 'technical_consultant',
//     label: 'Technical Consultant',
//     sortable: true,
//     sortId: 'technical_consultant',
//     width: 180,
//   },
//   {
//     id: 'r_number',
//     label: 'Project ID',
//     sortable: true,
//     sortId: 'r_number',
//     width: 140,
//   },
// ];
