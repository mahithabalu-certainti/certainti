import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTable, ManageColumnsPopover } from '../../../../components/table';
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
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../components/table/types';
import { EditIcon, EyeIcon } from '../../../../assets';
import { AllPermissions, useGetStatus } from '../../../../common-service';
import { UPDATE_USER } from '../../../../api/graphql/queries/user-query';
import { useMutation } from '@apollo/client';
import { userClient } from '../../../../api/graphql/clients/client';
import { useToast } from '../../../../hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';

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
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue: string;
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
  columnAnchorEl,
  setColumnAnchorEl,
  searchValue,
}) => {
  const [users, setUsers] = useState<ManageUser[]>([]);
  const navigate = useNavigate();
  const { errorToast } = useToast();
  const [updateUserMutation] = useMutation(UPDATE_USER, { client: userClient });

  //permissions
  const { permission } = useSelector((state: RootState) => state.permission);
  const userViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.USER_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    userViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [userViewEditFields]);

  useEffect(() => {
    setTableParams((prev) => ({
      ...prev,
      page: 1,
      filters: appliedFilters,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  useEffect(() => {
    setTableParams((prev) => ({
      ...prev,
      search: searchValue,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

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
        value: status.rid,
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

  const convertSingleUserData = (item: User): ManageUser => ({
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
  });

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
    memoizedStatus,
    permissionMap
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

    try {
      const res = await updateUserMutation({
        variables: { input: updateData },
      });
      const result = res.data?.updateUser;
      if (result?.success === true && result.user) {
        const updatedUser = convertSingleUserData(result.user);
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === updatedUser.id ? updatedUser : user
          )
        );
      } else {
        errorToast(result?.message || 'Failed to update field');
        setUsers(previousUsers);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update field');
      setUsers(previousUsers);
    }
  };

  const RestrictedColumns = [
    {
      id: 'username',
      canHide: false,
      canDrag: false,
    },
  ];

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<ManageUser>[]
  >(userColumns.filter((col) => !col.hide));

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter((col) => !col.hide) as ListTableColumn<ManageUser>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'interaction-column-visibility-popover'
    : undefined;

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={userColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <ListTable
        data={users}
        columns={visibleColumns}
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
    </>
  );
};
