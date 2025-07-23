import { ListTableColumn } from '../../../../components/table/types';
import { ManageAccountList } from '../../../types/manage-account';

export const manageAccountListColumns = (
  onClick: (row: ManageAccountList) => void
): ListTableColumn<ManageAccountList>[] => [
  {
    id: 'account_name',
    label: 'Account Name',
    sortable: true,
    sortId: 'account_name',
    width: '93%',
    sticky: true,
    sx: {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: ManageAccountList) => {
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
];
