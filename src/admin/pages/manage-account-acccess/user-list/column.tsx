import { ListTableColumn } from '../../../../components/table/types';
import { ManageAccountsUserList } from '../../../types/manage-account';

export const manageUserListColumns = (
  onClick: (row: ManageAccountsUserList) => void,
  addedAccounts: string[]
): ListTableColumn<ManageAccountsUserList>[] => [
  {
    id: 'first_name',
    sortId: 'first_name',
    label: 'User Name',
    width: 200,
    sortable: true,
    sticky: true,
    sx: {
      textAlign: 'left',
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2 !important',
      borderBottom: '1px solid #CBD6E2 !important',
    },
    render: (row: ManageAccountsUserList) => {
      const isAlreadyAdded =
        Array.isArray(addedAccounts) && addedAccounts.includes(row.rid);
      return (
        <span
          onClick={() => {
            if (isAlreadyAdded) onClick(row);
          }}
          className={
            isAlreadyAdded
              ? 'cursor-pointer no-underline hover:underline hover:text-[#1755E7]'
              : ''
          }
        >
          {row.first_name}
        </span>
      );
    },
  },
  {
    id: 'email',
    sortId: 'email',
    label: 'Email Address',
    width: 180,
    sortable: true,
  },
  {
    id: 'organization_name',
    sortId: 'organization_name',
    label: 'Organization Name',
    width: 300,
    sortable: true,
  },
];
