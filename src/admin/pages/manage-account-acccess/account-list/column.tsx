import { ListTableColumn } from '../../../../components/table/types';
import { AccountList } from '../../../../consultant/types';

export const manageAccountListColumns = (
  onClick: (row: AccountList) => void
): ListTableColumn<AccountList>[] => [
  {
    id: 'account_name',
    label: 'Account Name',
    sortable: true,
    sortId: 'account_name',
    width: 200,
    sticky: true,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: AccountList) => {
      return onClick ? (
        <span
          onClick={() => onClick(row)}
          className={
            'cursor-pointer no-underline hover:underline hover:text-[#1755E7]'
          }
        >
          {row.account_name}
        </span>
      ) : (
        row.account_name
      );
    },
  },
  {
    id: 'industry',
    sortId: 'industry',
    label: 'Industry',
    width: 200,
    sortable: true,
    render: (row: AccountList) =>
      row?.industry_name_other
        ? `${row.industry?.industry_name} - ${row?.industry_name_other}`
        : row.industry?.industry_name,
  },
  {
    id: 'country',
    editId: 'country_rid',
    sortId: 'country',
    label: 'Country',
    width: 150,
    sortable: true,
    render: (row: AccountList) => row.country?.country_name || '-',
  },
  {
    id: 'rid',
    sortId: 'rid',
    label: 'Account ID',
    width: 310,
    sortable: true,
  },
];
