import { ListTableColumn } from '../../../../../../../components/table/types';
import { CaseGlobalList } from '../../../../../../../consultant/types';
import { generateCaseNamePrefixValue } from '../helper';

export const getGlobalCaseListColumns = (
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
      render: (row) => row.r_number,
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
      hide:
        !permissionMap?.['filing_type_rid']?.edit &&
        !permissionMap?.['filing_type_rid']?.read,
    },
    {
      id: 'case_name',
      label: 'Case Name',
      width: 250,
      sortable: true,
      sortId: 'case_name',
      editId: 'case_name',
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
      width: 190,
      sortable: true,
      sortId: 'case_owner_name',
      editId: 'case_owner_rid',
      hide:
        !permissionMap?.['case_owner_rid']?.edit &&
        !permissionMap?.['case_owner_rid']?.read,
    },
  ];
};
