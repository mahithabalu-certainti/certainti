/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '../../../../components/table';
import { ADMIN_MANAGE_USER } from '../../../../routes';
import { Profile, UserListParams } from '../../../types/manage-user';
import { profileColumns } from './';
import { ManageProfile } from '../../../types';
import { useManageProfileList } from '../../../service';

interface IUserTableProps {
  appliedFilters: Record<string, any>;
  tableParams: UserListParams;
  setTableParams: React.Dispatch<React.SetStateAction<UserListParams>>;
}

export const ProfileTable: React.FC<IUserTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
}) => {
  const [users, setUsers] = useState<ManageProfile[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setTableParams((prev) => ({
      ...prev,
      filters: appliedFilters,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [appliedFilters]);

  const { data, isLoading, isError } = useManageProfileList(tableParams);
  const totalItems = data?.data?.count || 0;

  const convertUserListData = (data: Profile[]): ManageProfile[] => {
    if (!data) return [];
    return data.map((item) => {
      return {
        id: item.rid,
        createdBy: item.createdBy,
        createdOn: item.createdOn,
        profileName: item.profileName,
      };
    });
  };

  useEffect(() => {
    if (data?.data) {
      setUsers(convertUserListData(data?.data?.profile));
    }
  }, [data?.data]);

  const getRowId = (row: ManageProfile) => row.id;

  const handleEdit = (row: ManageProfile) => {
    navigate(ADMIN_MANAGE_USER + '/edit/' + row.id, {
      state: { user: row },
    });
  };

  const handleView = (row: ManageProfile) => {
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
      columns={profileColumns}
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
