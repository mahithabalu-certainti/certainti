import {
  costDisplay,
  formatDateToYYYYMMDDWithTime,
} from '../../../../../common-utils';
import { ListTableColumn } from '../../../../../components/table/types';
import { CaseGlobalList } from '../../../../types';

export const getGlobalCaseListColumns = (
  handleViewCaseDetails: (caseItem: CaseGlobalList) => void,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<CaseGlobalList>[] => {
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
      hide:
        !permissionMap?.['r_number']?.edit &&
        !permissionMap?.['r_number']?.read,
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
      id: 'account_name',
      label: 'Account Name',
      width: 180,
      sortable: true,
      sortId: 'account_name',
      // hide:
      //   !permissionMap?.['account_name']?.edit &&
      //   !permissionMap?.['account_name']?.read,
    },
    {
      id: 'filing_type_name',
      label: 'Filing Type',
      width: 120,
      sortable: true,
      sortId: 'filing_type_name',
      hide:
        !permissionMap?.['filing_type_rid']?.edit &&
        !permissionMap?.['filing_type_rid']?.read,
    },
    {
      id: 'case_name',
      label: 'Case Name',
      width: 200,
      sortable: true,
      sortId: 'case_name',
      hide:
        !permissionMap?.['case_name']?.edit &&
        !permissionMap?.['case_name']?.read,
    },
    {
      id: 'fiscal_year',
      label: 'Fiscal Year',
      width: 110,
      sortable: true,
      sortId: 'fiscal_year',
      render: (row) => (row.fiscal_year ? `FY-${row.fiscal_year}` : '-'),
      hide:
        !permissionMap?.['fiscal_year']?.edit &&
        !permissionMap?.['fiscal_year']?.read,
    },
    {
      id: 'country_name',
      label: 'Country',
      width: 180,
      sortable: true,
      sortId: 'country_name',
      // hide:
      //   !permissionMap?.['country_rid']?.edit &&
      //   !permissionMap?.['country_rid']?.read,
    },
    {
      id: 'case_owner_name',
      label: 'Case Owner',
      width: 180,
      sortable: true,
      sortId: 'case_owner_name',
      hide:
        !permissionMap?.['case_owner_rid']?.edit &&
        !permissionMap?.['case_owner_rid']?.read,
    },
    {
      id: 'case_total_project_cost',
      label: 'Total Case Project Cost',
      width: 180,
      sortable: true,
      sortId: 'case_total_project_cost',
      sx: {
        textAlign: 'right',
      },
      hide:
        !permissionMap?.['case_total_project_cost']?.edit &&
        !permissionMap?.['case_total_project_cost']?.read,
      render: (row) =>
        row.case_total_project_cost
          ? costDisplay(row.case_total_project_cost, row?.currency_symbol)
          : '-',
    },
    {
      id: 'case_total_qre_cost',
      label: 'Case Project QRE Cost',
      width: 180,
      sortable: true,
      sortId: 'case_total_qre_cost',
      sx: {
        textAlign: 'right',
      },
      hide:
        !permissionMap?.['case_total_qre_cost']?.edit &&
        !permissionMap?.['case_total_qre_cost']?.read,
      render: (row) =>
        row.case_total_qre_cost
          ? costDisplay(row.case_total_qre_cost, row?.currency_symbol)
          : '-',
    },
    {
      id: 'case_total_rd_cost',
      label: 'Case Project RD Credit',
      width: 180,
      sortable: true,
      sortId: 'case_total_rd_cost',
      sx: {
        textAlign: 'right',
      },
      hide:
        !permissionMap?.['case_total_rd_cost']?.edit &&
        !permissionMap?.['case_total_rd_cost']?.read,
      render: (row) =>
        row.case_total_rd_cost
          ? costDisplay(row.case_total_rd_cost, row?.currency_symbol)
          : '-',
    },
    {
      id: 'created_datetime',
      label: 'Created On',
      width: 190,
      sortable: true,
      sortId: 'created_datetime',
      hide:
        !permissionMap?.['created_datetime']?.edit &&
        !permissionMap?.['created_datetime']?.read,

      render: (row) =>
        row.created_datetime
          ? formatDateToYYYYMMDDWithTime(row.created_datetime)
          : '-',
    },
    {
      id: 'submitted_datetime',
      label: 'Submitted On',
      width: 190,
      sortable: true,
      sortId: 'submitted_datetime',
      hide:
        !permissionMap?.['submitted_datetime']?.edit &&
        !permissionMap?.['submitted_datetime']?.read,
      render: (row) =>
        row.submitted_datetime
          ? formatDateToYYYYMMDDWithTime(row.submitted_datetime)
          : '-',
    },
    {
      id: 'approved_datetime',
      label: 'Approved On',
      width: 190,
      sortable: true,
      sortId: 'approved_datetime',
      hide:
        !permissionMap?.['approved_datetime']?.edit &&
        !permissionMap?.['approved_datetime']?.read,
      render: (row) =>
        row.approved_datetime
          ? formatDateToYYYYMMDDWithTime(row.approved_datetime)
          : '-',
    },
    {
      id: 'status_name',
      label: 'Status',
      width: 100,
      sortable: true,
      sortId: 'status_name',
      hide:
        !permissionMap?.['status_rid']?.edit &&
        !permissionMap?.['status_rid']?.read,
    },
  ];
};
