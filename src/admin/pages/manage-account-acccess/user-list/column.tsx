import { ListTableColumn } from '../../../../components/table/types';
import {
  ManageAccountList,
  ManageAccountsUserList,
} from '../../../types/manage-account';

export const manageUserListColumns = (
  onClick: (row: ManageAccountsUserList) => void
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
    id: 'organization_name',
    sortId: 'organization_name',
    label: 'Organization Name',
    width: 300,
    sortable: true,
  },
];
