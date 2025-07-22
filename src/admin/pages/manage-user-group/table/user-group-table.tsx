import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTable } from '../../../../components/table';
import { FilterCondition, UserListParams } from '../../../types/manage-user';
import { getUserGroupColumns } from './columns';
import { UserGroupList } from '../../../types';
import { MANAGE_USER_GROUP } from '../../../../routes/routes';
import {
  ActionItem,
  CellEditData,
  FieldChangeValue,
} from '../../../../components/table/types';
import { EditIcon } from '../../../../assets';
import { useMutation } from '@apollo/client';
import { userClient } from '../../../../api/graphql/clients/client';
import { useManageUserGroupList } from '../../../service';
import { UPDATE_USER_GROUP } from '../../../../api/graphql/queries/user-group-query';
import { useToast } from '../../../../hooks';

interface IUserTableProps {
  appliedFilters: Record<string, FilterCondition>;
  tableParams: UserListParams;
  isProfileViewEnable?: boolean;
  isProfileEditEnable?: boolean;
  isProfileDeleteEnable?: boolean;
  setTableParams: React.Dispatch<React.SetStateAction<UserListParams>>;
  onSelectionChange: (selectedIds: string[]) => void;
  refreshUserGroupTrigger?: number;
}

export const UserGroupTable: React.FC<IUserTableProps> = ({
  appliedFilters,
  tableParams,
  // isProfileViewEnable,
  isProfileEditEnable,
  // isProfileDeleteEnable,
  setTableParams,
  onSelectionChange,
  refreshUserGroupTrigger,
}) => {
  const navigate = useNavigate();
  const { errorToast } = useToast();
  const [userGroupList, setUserGroupList] = useState<UserGroupList[]>([]);
  const [userGroupUpdate] = useMutation(UPDATE_USER_GROUP, {
    client: userClient,
  });

  const { data, isPending, isError } = useManageUserGroupList(
    tableParams,
    refreshUserGroupTrigger
  );

  useEffect(() => {
    const reShape: UserGroupList[] =
      data?.data?.usergroup?.map((item) => {
        const { usergrouptype, is_consultant_only_group, ...rest } = item;
        return {
          ...rest,
          usergrouptype: usergrouptype.group_type_name,
          is_consultant_only_group: is_consultant_only_group ? 'Yes' : 'No',
          usergroup_type: usergrouptype.type
        };
      }) || [];
    setUserGroupList(reShape);
  }, [data?.data.usergroup]);

  useEffect(() => {
    setTableParams((prev) => ({
      ...prev,
      filters: appliedFilters,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  const totalItems = data?.data?.count || 0;

  const getRowId = (row: UserGroupList) => row.rid;

  const handleEdit = (row: UserGroupList) => {
    navigate(MANAGE_USER_GROUP + '/edit/' + row.rid);
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setTableParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder: apiOrder,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setTableParams((prev) => ({
      ...prev,
      page: newPage + 1,
    }));
  };

  const handleRowsPerPageChange = (newLimit: number) => {
    setTableParams((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }));
  };

  const actionButtons: ActionItem<UserGroupList>[] = [
    {
      label: 'Edit',
      onClick: (row: UserGroupList) => handleEdit(row),
      icon: EditIcon,
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
      hide: !isProfileEditEnable,
    },
  ];

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousGroupLists = [...userGroupList];
    // Find the matching user
    const matchedUser = userGroupList.find((user) => user.rid === rowId);
    if (!matchedUser) {
      return;
    }

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (res, item) => {
        const key = item.editId || item.columnId;
        res[key] = item.value;
        return res;
      },
      {
        group_rid: rowId,
      }
    );

    try {
      const res = await userGroupUpdate({
        variables: { input: updateData },
      });
      const result = res.data?.userGroupUpdate;
      if (result?.success === true && result.usergroup) {
        const updatedUserGroup = result.usergroup;
        setUserGroupList((prevGroupList) =>
          prevGroupList.map((groups) =>
            groups.rid === updatedUserGroup.rid
              ? {
                  ...groups,
                  group_name: updatedUserGroup.group_name,
                  modified_datetime: updatedUserGroup.modified_datetime,
                }
              : groups
          )
        );
      } else {
        errorToast(result?.message || 'Failed to update filed');
        setUserGroupList(previousGroupLists);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update filed');
      setUserGroupList(previousGroupLists);
    }
  };

  const profileColumns = getUserGroupColumns();

  return (
    <ListTable
      data={(userGroupList || []) as UserGroupList[]}
      columns={profileColumns}
      getRowId={getRowId}
      hoverHighlight={false}
      tableStyle={{
        height: '100%',
        maxHeight: 'calc(100vh - 195px)',
        overflow: 'auto',
      }}
      stickyHeader={true}
      stickyColumnsCount={2}
      selectable={false}
      onSelectionChange={onSelectionChange}
      actionWidth={60}
      actionDisplayMode='dropdown'
      actionMenuItems={actionButtons}
      loading={isPending}
      error={isError ? 'Failed to load User Groups' : undefined}
      rowsPerPageOptions={[25, 50, 100]}
      rowsPerPage={tableParams.limit}
      currentPage={(tableParams.page ?? 1) - 1}
      totalItems={totalItems}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      sortBy={tableParams.sortBy}
      sortOrder={tableParams.sortOrder}
      onSort={handleSort}
      onCellEdit={handleCellEdit}
    />
  );
};
