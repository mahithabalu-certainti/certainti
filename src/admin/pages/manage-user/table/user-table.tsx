/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '../../../../components/table';
import { ADMIN_MANAGE_USER } from '../../../../routes';
import { useManageUserList } from '../../../service/manage-user/manage-user-service';
import { ManageUser, User, UserListParams } from '../../../types/manage-user';
import { userColumns } from './columns';

export const UserTable: React.FC<Record<string, any>> = (appliedFilters) => {
  const [users, setUsers] = useState<ManageUser[]>([]);
  const navigate = useNavigate();
  const [tableParams, setTableParams] = useState<UserListParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'ASC',
  });

  useEffect(() => {
    setTableParams((prev) => ({
      ...prev,
      filters: appliedFilters.appliedFilters,
      search: appliedFilters.searchTerm,
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
  }, [data]);

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

  const handleSort = (sortBy: string, sortOrder: 'ASC' | 'DESC') => {
    setTableParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder,
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

  return (
    <Table
      data={users}
      columns={userColumns}
      getRowId={getRowId}
      // Selection
      selectable={true}
      onSelectionChange={(selectedIds) => console.log('Selected:', selectedIds)}
      // Actions
      onEdit={handleEdit}
      onView={handleView}
      // State
      loading={isLoading}
      error={isError ? 'Failed to load users' : undefined}
      // Pagination
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
