import {
  costDisplay,
  formatDateToYYYYMMDDWithTime,
} from '../../../../../../common-utils';
import { ListTableColumn } from '../../../../../../components/table/types';
import { CaseList } from '../../../../../types';

export const getCaseListColumns = (
  handleViewCaseDetails: (caseItem: CaseList) => void
): ListTableColumn<CaseList>[] => {
  return [
    {
      id: 'r_number',
      label: 'Case ID',
      width: 140,
      sortable: true,
      sticky: true,
      sortId: 'r_number',
      sx: {
        position: 'sticky',
        left: 0,
        background: '#fff',
        zIndex: 10,
        borderRight: '1px solid #CBD6E2 !important',
        borderBottom: '1px solid #CBD6E2 !important',
      },
      render: (row) => (
        <span
          className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
          onClick={() => handleViewCaseDetails(row)}
        >
          {row.r_number}
        </span>
      ),
    },
    {
      id: 'filing_type_name',
      label: 'Filing Type',
      width: 140,
      sortable: true,
      sortId: 'filing_type_name',
    },
    {
      id: 'case_name',
      label: 'Case Name',
      width: 180,
      sortable: true,
      sortId: 'case_name',
    },
    {
      id: 'fiscal_year',
      label: 'Fiscal Year',
      width: 120,
      sortable: true,
      sortId: 'fiscal_year',
      render: (row) => (row.fiscal_year ? `FY-${row.fiscal_year}` : '-'),
    },
    {
      id: 'country',
      label: 'Country',
      width: 140,
      sortable: true,
      sortId: 'country',
    },
    {
      id: 'case_owner_name',
      label: 'Case Owner',
      width: 180,
      sortable: true,
      sortId: 'case_owner_name',
    },
    {
      id: 'total_projects_cost',
      label: 'Total Case Project Cost',
      width: 180,
      sortable: true,
      sortId: 'total_projects_cost',
      sx: {
        textAlign: 'right',
      },
      render: (row) =>
        row.total_projects_cost ? costDisplay(row.total_projects_cost) : '-',
    },
    {
      id: 'total_qre_cost',
      label: 'Case Project QRE Cost',
      width: 180,
      sortable: true,
      sortId: 'total_qre_cost',
      sx: {
        textAlign: 'right',
      },
      render: (row) =>
        row.total_qre_cost ? costDisplay(row.total_qre_cost) : '-',
    },
    {
      id: 'total_project_rd_credits',
      label: 'Case Project RD Credit',
      width: 180,
      sortable: true,
      sortId: 'total_project_rd_credits',
      sx: {
        textAlign: 'right',
      },
      render: (row) =>
        row.total_project_rd_credits
          ? costDisplay(row.total_project_rd_credits)
          : '-',
    },
    {
      id: 'created_datetime',
      label: 'Created On',
      width: 160,
      sortable: true,
      sortId: 'created_datetime',
      render: (row) =>
        row.created_datetime
          ? formatDateToYYYYMMDDWithTime(row.created_datetime)
          : '-',
    },
    {
      id: 'submitted_on',
      label: 'Submitted On',
      width: 160,
      sortable: true,
      sortId: 'submitted_on',
      render: (row) =>
        row.submitted_on ? formatDateToYYYYMMDDWithTime(row.submitted_on) : '-',
    },
    {
      id: 'approved_on',
      label: 'Approved On',
      width: 160,
      sortable: true,
      sortId: 'approved_on',
      render: (row) =>
        row.approved_on ? formatDateToYYYYMMDDWithTime(row.approved_on) : '-',
    },
    {
      id: 'status_name',
      label: 'Status',
      width: 140,
      sortable: true,
      sortId: 'status_name',
    },
  ];
};
