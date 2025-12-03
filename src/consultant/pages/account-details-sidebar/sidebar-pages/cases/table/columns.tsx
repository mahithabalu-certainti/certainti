import {
  costDisplay,
  formatDateToYYYYMMDDWithTime,
  REGEX_PATTERNS,
} from '../../../../../../common-utils';
import {
  DependencyRowData,
  ListTableColumn,
} from '../../../../../../components/table/types';
import { CaseList } from '../../../../../types';
import { generateCaseNamePrefixValue } from '../../../../case/helper';

export const getCaseListColumns = (
  handleViewCaseDetails: (caseItem: CaseList) => void,
  caseOwnersOptions: { value: string; label: string }[],
  caseFilingTypesOptions: { value: string; label: string }[],
  accountInActive: boolean,
  accountData: {
    accountId: string;
    account_name: string;
    account_number: string;
    country_rid: string;
    country_code: string;
  },
  currencySymbol?: string,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
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
      id: 'filing_type_name',
      label: 'Filing Type',
      width: 160,
      sortable: true,
      sortId: 'filing_type_name',
      editId: 'filing_type_rid',
      editable: false,
      hide:
        !permissionMap?.['filing_type_rid']?.edit &&
        !permissionMap?.['filing_type_rid']?.read,
      field: {
        type: 'select',
        required: true,
        placeholder: 'Choose Filing Type',
        options: caseFilingTypesOptions,
        getFieldData: (rowData: DependencyRowData) => {
          return String(rowData.filing_type_rid || '');
        },
      },
    },
    {
      id: 'case_name',
      label: 'Case Name',
      width: 250,
      sortable: true,
      sortId: 'case_name',
      editId: 'case_name',
      editable:
        permissionMap?.['case_name']?.edit &&
        permissionMap?.['case_name']?.read &&
        !accountInActive,
      hide:
        !permissionMap?.['case_name']?.edit &&
        !permissionMap?.['case_name']?.read,
      render: (row) =>
        row.case_name && accountData.account_name && accountData.country_code
          ? generateCaseNamePrefixValue(
              accountData.account_name,
              accountData.country_code,
              row.fiscal_year.toString()
            ) + row.case_name
          : '-',
      field: {
        type: 'text',
        required: true,
        placeholder: 'Enter Case Name',
        validation: [
          {
            regex: REGEX_PATTERNS.MIN_3,
            errorMessage: 'Case Name must be more than 2 characters long',
          },
          {
            regex: REGEX_PATTERNS.MAX_255,
            errorMessage: 'Case Name must be within 255 characters',
          },
        ],
      },
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
      id: 'case_owner_name',
      label: 'Case Owner',
      width: 180,
      sortable: true,
      sortId: 'case_owner_name',
      editId: 'case_owner_rid',
      editable:
        permissionMap?.['case_owner_rid']?.edit &&
        permissionMap?.['case_owner_rid']?.read &&
        !accountInActive,
      hide:
        !permissionMap?.['case_owner_rid']?.edit &&
        !permissionMap?.['case_owner_rid']?.read,
      field: {
        type: 'select',
        required: true,
        placeholder: 'Choose Case Owner',
        options: caseOwnersOptions,
        getFieldData: (rowData: DependencyRowData) => {
          return String(rowData.case_owner_rid || '');
        },
      },
    },
    {
      id: 'case_total_projects',
      label: 'Total Assigned Project',
      width: 200,
      sortable: true,
      sortId: 'case_total_projects',
      sx: {
        textAlign: 'right',
      },
      hide:
        !permissionMap?.['case_total_projects']?.edit &&
        !permissionMap?.['case_total_projects']?.read,
    },
    {
      id: 'case_total_project_cost',
      label: 'Total Assigned Project Cost',
      width: 220,
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
          ? costDisplay(row.case_total_project_cost, currencySymbol)
          : '-',
    },
    {
      id: 'case_total_qualified_projects',
      label: 'Total Qualified Project',
      width: 200,
      sortable: true,
      sortId: 'case_total_qualified_projects',
      sx: {
        textAlign: 'right',
      },
      hide:
        !permissionMap?.['case_total_projects']?.edit &&
        !permissionMap?.['case_total_projects']?.read,
    },
    {
      id: 'case_total_qualified_projects_cost',
      label: 'Total Qualified Project Cost',
      width: 220,
      sortable: true,
      sortId: 'case_total_qualified_projects_cost',
      sx: {
        textAlign: 'right',
      },
      hide:
        !permissionMap?.['case_total_qualified_project_cost']?.edit &&
        !permissionMap?.['case_total_qualified_project_cost']?.read,
      render: (row) =>
        row.case_total_qualified_projects_cost
          ? costDisplay(row.case_total_qualified_projects_cost, currencySymbol)
          : '-',
    },
    {
      id: 'case_total_qre_cost',
      label: 'Total QRE',
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
          ? costDisplay(row.case_total_qre_cost, currencySymbol)
          : '-',
    },
    {
      id: 'case_total_rd_cost',
      label: 'Total RD Credits',
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
          ? costDisplay(row.case_total_rd_cost, currencySymbol)
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
