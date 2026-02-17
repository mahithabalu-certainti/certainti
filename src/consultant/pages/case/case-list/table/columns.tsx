import {
  costDisplay,
  formatDateToYYYYMMDDWithTime,
  REGEX_PATTERNS,
} from '../../../../../common-utils';
import {
  DependencyRowData,
  ListTableColumn,
} from '../../../../../components/table/types';
import { CaseGlobalList } from '../../../../types';
import { generateCaseNamePrefixValue } from '../../helper';

export const getGlobalCaseListColumns = (
  handleViewCaseDetails: (caseItem: CaseGlobalList) => void,
  caseOwnersOptions: { value: string; label: string }[],
  caseFilingTypesOptions: { value: string; label: string }[],
  permissionMap?: Record<string, { read: boolean; edit: boolean }>,
  accountPermissionMap?: Record<string, { read: boolean; edit: boolean }>
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
      hide:
        !accountPermissionMap?.['account_name']?.read &&
        !accountPermissionMap?.['account_name']?.edit,
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
      conditionallyEdit: [
        { key: 'account_status_name', matchValue: ['Active'] },
      ],
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
        permissionMap?.['case_name']?.read,
      hide:
        !permissionMap?.['case_name']?.edit &&
        !permissionMap?.['case_name']?.read,
      render: (row) =>
        row.case_name && row.account_name && row.country_code
          ? generateCaseNamePrefixValue(
              row.account_name,
              row.country_code,
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
      conditionallyEdit: [
        { key: 'account_status_name', matchValue: ['Active'] },
        {
          key: 'status_name',
          matchValue: ['Submitted', 'On Hold', 'In Progress', 'Audit Review'],
        },
      ],
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
      hide:
        !accountPermissionMap?.['country_rid']?.read &&
        !accountPermissionMap?.['country_rid']?.edit,
    },
    {
      id: 'case_owner_name',
      label: 'Case Owner',
      width: 190,
      sortable: true,
      sortId: 'case_owner_name',
      editId: 'case_owner_rid',
      editable:
        permissionMap?.['case_owner_rid']?.edit &&
        permissionMap?.['case_owner_rid']?.read,
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
      conditionallyEdit: [
        { key: 'account_status_name', matchValue: ['Active'] },
        {
          key: 'status_name',
          matchValue: ['Submitted', 'On Hold', 'In Progress', 'Audit Review'],
        },
      ],
    },
    {
      id: 'case_total_project_cost',
      label: 'Total Project Cost',
      width: 190,
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
      label: 'Total QRE',
      width: 190,
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
      label: 'Total RD Credits',
      width: 190,
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
      id: 'case_total_projects',
      label: 'No. of Projects',
      width: 160,
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
      id: 'case_total_qualified_projects',
      label: 'No. of Qualified Projects',
      width: 190,
      sortable: true,
      sortId: 'case_total_qualified_projects',
      sx: {
        textAlign: 'right',
      },
      hide:
        !permissionMap?.['case_total_qualified_projects']?.edit &&
        !permissionMap?.['case_total_qualified_projects']?.read,
    },
    {
      id: 'created_datetime',
      label: 'Created On',
      width: 200,
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
      width: 200,
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
      width: 200,
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
