import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTable } from '../../../../components/table';
import { ADMIN_MANAGE_USER } from '../../../../routes';
import { useManageUserList } from '../../../service/manage-user/manage-user-service';
import {
  FilterCondition,
  ManageUser,
  User,
  UserListParams,
} from '../../../types/manage-user';
import { getUserColumns } from './columns';
import {
  ActionItem,
  CellEditData,
  FieldChangeValue,
} from '../../../../components/table/types';
import { EditIcon, EyeIcon } from '../../../../assets';
import { useGetStatus } from '../../../../common-service';
import { UPDATE_USER } from '../../../../api/graphql/queries/user-query';
import { displayValueForInline } from '../../../../common-utils';
import { useMutation } from '@apollo/client';
import { userClient } from '../../../../api/graphql/clients/client';
import { useToast } from '../../../../hooks';

interface IUserTableProps {
  appliedFilters: Record<string, FilterCondition>;
  tableParams: UserListParams;
  isUserEditEnable?: boolean;
  isUserViewEnable?: boolean;
  setTableParams: React.Dispatch<React.SetStateAction<UserListParams>>;
  onSelectionChange: (selectedIds: string[]) => void;
  refreshUserTrigger?: number;
  profileOptions: { label: string; value: string }[];
  roleOptions: { label: string; value: string }[];
}

export const UserTable: React.FC<IUserTableProps> = ({
  appliedFilters,
  tableParams,
  isUserEditEnable,
  isUserViewEnable,
  setTableParams,
  onSelectionChange,
  refreshUserTrigger,
  profileOptions,
  roleOptions,
}) => {
  const [users, setUsers] = useState<ManageUser[]>([]);
  const navigate = useNavigate();
  const { errorToast } = useToast();
  const [updateUserMutation] = useMutation(UPDATE_USER, { client: userClient });

  useEffect(() => {
    setTableParams((prev) => ({
      ...prev,
      page: 1,
      filters: appliedFilters,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  const { data, isLoading, isError } = useManageUserList(
    tableParams,
    refreshUserTrigger
  );
  const totalItems = data?.data?.count || 0;
  const statusOptions = useGetStatus();

  const memoizedStatus = useMemo(
    () =>
      statusOptions?.data?.data?.status.map((status) => ({
        label: status.status_name,
        value: status.status_name,
      })) || [],
    [statusOptions?.data?.data?.status]
  );

  const convertUserListData = (data: User[]): ManageUser[] => {
    if (!data) return [];

    return data.map((item) => {
      return {
        id: item.rid,
        username: item.first_name,
        fullName: item.full_name,
        azure_id: item.azure_id,
        email: item.email,
        profile: item.profile.profile_name,
        profile_rid: item.profile.rid,
        status: item.status?.status_name,
        status_rid: item.status_rid,
        role: item.business_teams.business_teams,
        role_rid: item.business_teams.rid,
        created_datetime: item.created_datetime,
        modified_datetime: item.modified_datetime,
      };
    });
  };

  useEffect(() => {
    if (data?.data) {
      setUsers(convertUserListData(data?.data?.users));
    }
  }, [data?.data]);

  const getRowId = (row: ManageUser) => row.id;

  const handleEdit = (row: ManageUser) => {
    navigate(ADMIN_MANAGE_USER + '/edit/' + row.id, {
      state: { user: row },
    });
  };

  const handleView = (row: ManageUser) => {
    navigate(`/admin/manage-user/${row.id}`, {
      state: { user: row },
    });
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

  const userColumns = getUserColumns(
    handleView,
    profileOptions,
    roleOptions,
    memoizedStatus
  );

  const actionButtons: ActionItem<ManageUser>[] = [
    {
      label: 'View',
      onClick: (row: ManageUser) => handleView(row),
      icon: EyeIcon,
      hide: !isUserViewEnable,
    },
    {
      label: 'Edit',
      onClick: (row: ManageUser) => handleEdit(row),
      icon: EditIcon,
      hide: !isUserEditEnable,
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
    },
  ];

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousUsers = [...users];
    // Find the matching user
    const matchedUser = users.find((user) => user.id === rowId);
    if (!matchedUser) {
      return;
    }

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (usr, item) => {
        const key = item.editId || item.columnId;
        usr[key] = item.value;
        return usr;
      },
      {
        rid: rowId,
        azure_id: matchedUser.azure_id,
      }
    );

    const updatedUser = users?.map((user) => {
      if (user.id === rowId) {
        const updatedFields = updates.reduce<Record<string, FieldChangeValue>>(
          (res, item) => {
            const displayValue = displayValueForInline(
              item.columnId,
              item.value,
              {
                profile: profileOptions,
                role: roleOptions,
                status: memoizedStatus,
              }
            );
            res[item.columnId] = displayValue;

            if (item.editId && item.editId !== item.columnId) {
              res[item.editId] = item.value;
            }
            return res;
          },
          {}
        );
        return {
          ...user,
          ...updatedFields,
        };
      }
      return user;
    });
    setUsers(updatedUser);

    try {
      const res = await updateUserMutation({
        variables: { input: updateData },
      });
      const result = res.data?.updateUser;
      if (result?.success === true) {
        console.log('Update success');
      } else {
        errorToast(result?.message || 'Failed to update filed');
        setUsers(previousUsers);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update filed');
      setUsers(previousUsers);
    }
  };

  return (
    <ListTable
      data={users}
      columns={userColumns}
      getRowId={getRowId}
      hoverHighlight={true}
      tableStyle={{
        height: '100%',
        maxHeight: 'calc(100vh - 195px)',
        overflow: 'auto',
      }}
      stickyHeader={true}
      stickyColumnsCount={2}
      // Selection
      selectable={true}
      onSelectionChange={onSelectionChange}
      // Actions
      actionWidth={60}
      actionDisplayMode='dropdown'
      actionMenuItems={actionButtons}
      // State
      loading={isLoading}
      error={isError ? 'Failed to load users' : undefined}
      // Pagination
      rowsPerPageOptions={[25, 50, 100]}
      rowsPerPage={tableParams.limit}
      currentPage={(tableParams.page ?? 1) - 1}
      totalItems={totalItems}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      // Sorting
      sortBy={tableParams.sortBy}
      sortOrder={tableParams.sortOrder}
      onSort={handleSort}
      onCellEdit={handleCellEdit}
    />
  );
};
