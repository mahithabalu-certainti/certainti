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
import { ActionItem, CellEditData } from '../../../../components/table/types';
import { EditIcon, EyeIcon } from '../../../../assets';
import { useGetStatus } from '../../../../common-service';

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
        email: item.email,
        profile: item.profile.profile_name,
        status: item.status?.status_name,
        role: item.business_teams.business_teams,
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
    console.log(rowId, updates);
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
