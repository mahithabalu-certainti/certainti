/* eslint-disable @typescript-eslint/no-explicit-any */
import { ListTableColumn } from '../../../../components/table/types';
import {
  ManageAccountList,
  ManageAccountsUserList,
} from '../../../types/manage-account';

export const manageUserListColumns = (
  onClick: (row: ManageAccountsUserList) => void
): ListTableColumn<any>[] => [
  {
    id: 'first_name',
    sortId: 'first_name',
    label: 'User List Names',
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
    render: (row: ManageAccountList) => {
      return (
        <span
          style={{
            color: '#2D3E4F',
            fontWeight: 500,
            cursor: 'pointer',
          }}
          onClick={() => onClick(row as unknown as ManageAccountsUserList)}
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
    id: 'org_id',
    sortId: 'org_id',
    label: 'Organization Name',
    width: 300,
    sortable: true,
  },
];
