import { ListTableColumn } from '../../../../../../../components/table/types';
import { AccountList } from '../../../../../../../consultant/types';

export const getAccountColumns = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): ListTableColumn<AccountList>[] => [
  {
    id: 'account_name',
    editId: 'account_name',
    sortId: 'account_name',
    label: 'Account Name',
    width: 250,
    sortable: true,
    sticky: true,
    hide:
      !permissionMap?.['account_name']?.read &&
      !permissionMap?.['account_name']?.edit,
    sx: {
      position: 'sticky',
      left: '32px',
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row) => (
      <span className='!text-[13px] !font-semibold !text-[#425A76]'>
        {row.account_name}
      </span>
    ),
  },
  {
    id: 'industry',
    editId: 'industry_rid',
    sortId: 'industry',
    label: 'Industry',
    width: 200,
    sortable: true,
    hide:
      !permissionMap?.['industry_rid']?.read &&
      !permissionMap?.['industry_rid']?.edit,
    render: (row: AccountList) =>
      row.industry_name_other
        ? `${row.industry?.industry_name} - ${row.industry_name_other}`
        : row.industry?.industry_name,
  },
  {
    id: 'country',
    editId: 'country_rid',
    sortId: 'country',
    label: 'Country',
    width: 150,
    sortable: true,
    hide:
      !permissionMap?.['country_rid']?.read &&
      !permissionMap?.['country_rid']?.edit,
    render: (row: AccountList) => row.country?.country_name || '-',
  },
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Account ID',
    width: 120,
    sortable: true,
    hide:
      !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
  },
];
