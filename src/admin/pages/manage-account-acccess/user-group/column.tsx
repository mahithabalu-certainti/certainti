import { ListTableColumn } from '../../../../components/table/types';
import { ManageAccountsGroupList } from '../../../types/manage-account';

export const manageUserGroupColumns = (
  onClick: (row: ManageAccountsGroupList) => void
): ListTableColumn<ManageAccountsGroupList>[] => [
  {
    id: 'group_name',
    editId: 'group_name',
    sortId: 'group_name',
    label: 'Group Names',
    width: '45%',
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
    render: (row: ManageAccountsGroupList) => {
      return (
        <span
          style={{
            color: '#2D3E4F',
            fontWeight: 500,
            cursor: 'pointer',
          }}
          onClick={() => onClick(row)}
        >
          {row.group_name}
        </span>
      );
    },
  },
  {
    id: 'user_count',
    sortId: 'user_count',
    label: 'Number of Users',
    width: '43%',
    sortable: true,
  },
];
