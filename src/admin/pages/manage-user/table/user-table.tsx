/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTable } from '../../../../components/table';
import { ADMIN_MANAGE_USER } from '../../../../routes';
import { useManageUserList } from '../../../service/manage-user/manage-user-service';
import { ManageUser, User, UserListParams } from '../../../types/manage-user';
import { userColumns } from './columns';
import { ActionItem } from '../../../../components/table/types';
import { editIcon, eyeIcon } from '../../../../assets';

interface IUserTableProps {
  appliedFilters: Record<string, any>;
  tableParams: UserListParams;
  isUserEditEnable?: boolean;
  isUserViewEnable?: boolean;
  setTableParams: React.Dispatch<React.SetStateAction<UserListParams>>;
  onSelectionChange: (selectedIds: string[]) => void;
}

export const UserTable: React.FC<IUserTableProps> = ({
  appliedFilters,
  tableParams,
  isUserEditEnable,
  isUserViewEnable,
  setTableParams,
  onSelectionChange,
}) => {
  const [users, setUsers] = useState<ManageUser[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setTableParams((prev) => ({
      ...prev,
      page: 1,
      filters: appliedFilters,
    }));
  }, [appliedFilters]);

  const { data, isLoading, isError } = useManageUserList(tableParams);
  const totalItems = data?.data?.count || 0;

  const convertUserListData = (data: User[]): ManageUser[] => {
    if (!data) return [];

    return data.map((item) => {
      // Convert status to match the expected type
      const originalStatus = item.status?.toLowerCase();
      const convertedStatus =
        originalStatus === 'active' ? 'Active' : 'Inactive';

      return {
        id: item.rid,
        username: item.first_name,
        fullName: item.full_name,
        email: item.email,
        profile: item.profile.profile_name,
        status: convertedStatus,
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

  const actionButtons: ActionItem<ManageUser>[] = [
    {
      label: 'View',
      onClick: (row: ManageUser) => handleView(row),
      icon: eyeIcon,
      hide: !isUserViewEnable,
    },
    {
      label: 'Edit',
      onClick: (row: ManageUser) => handleEdit(row),
      icon: editIcon,
      hide: !isUserEditEnable,
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
    },
  ];

  return (
    <ListTable
      data={users}
      columns={userColumns}
      getRowId={getRowId}
      hoverHighlight={true}
      tableStyle={{
        maxHeight: 'calc(95vh - 200px)',
        overflow: 'auto',
      }}
      stickyHeader={true}
      stickyColumnsCount={2}
      // Selection
      selectable={true}
      onSelectionChange={onSelectionChange}
      // Actions
      actionWidth={100}
      actionDisplayMode='icon'
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
    />
  );
};
