import { ListTableColumn } from '../../../../components/table/types';
import { ManageAccountsGroupList } from '../../../types/manage-account';

export const manageUserGroupColumns = (
  onClick: (row: ManageAccountsGroupList) => void,
  addedAccounts: string[]
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
        const isDisabled = row.isDisabledToggle;
        const isAlreadyAdded =
          Array.isArray(addedAccounts) && addedAccounts.includes(row.rid);

        return (
          <span
            onClick={() => {
              if (!isDisabled && isAlreadyAdded) onClick(row);
            }}
            className={
              !isDisabled && isAlreadyAdded
                ? 'cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
                : ''
            }
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
