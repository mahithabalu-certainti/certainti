/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTable } from '../../../../components/table';
import { UserListParams } from '../../../types/manage-user';
import { profileColumns } from './';
import { ManageProfile, ManageProfileList } from '../../../types';
import { useManageProfileList } from '../../../service';
import { MANAGE_PROFILE } from '../../../../routes/routes';
import { ActionItem } from '../../../../components/table/types';
import { deleteIcon, editIcon } from '../../../../assets';

interface IUserTableProps {
  appliedFilters: Record<string, any>;
  tableParams: UserListParams;
  isProfileViewEnable?: boolean;
  isProfileEditEnable?: boolean;
  isProfileDeleteEnable?: boolean;
  setTableParams: React.Dispatch<React.SetStateAction<UserListParams>>;
  onSelectionChange: (selectedIds: string[]) => void;
}

export const ProfileTable: React.FC<IUserTableProps> = ({
  appliedFilters,
  tableParams,
  isProfileViewEnable,
  isProfileEditEnable,
  isProfileDeleteEnable,
  setTableParams,
  onSelectionChange,
}) => {
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

  const convertUserListData = (data: ManageProfileList): ManageProfile => {
    if (!data) return {} as ManageProfile;
    return {
      id: data?.rid,
      createdBy: data?.created_by || '',
      createdOn: data?.created_datetime,
      profileName: data?.profile_name,
    };
  };

  const getRowId = (row: ManageProfileList) => row.rid;

  const handleEdit = (row: ManageProfileList) => {
    const data = convertUserListData(row);
    navigate(MANAGE_PROFILE + '/edit/' + data.id, {
      state: { user: data },
    });
  };
  const handleView = (row: ManageProfileList) => {
    const data = convertUserListData(row);
    navigate(MANAGE_PROFILE + '/view/' + data.id, {
      state: { user: data },
    });
  };
  const handleDelete = (row: ManageProfileList) => {
    // navigate(`/admin/manage-user/${row.id}`, {
    //   state: { user: row },
    // });
    console.log('trigger row delete:', row);
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

  const actionButtons: ActionItem<ManageProfileList>[] = [
    {
      label: 'View',
      onClick: (row: ManageProfileList) => handleView(row),
      hide: !isProfileViewEnable,
    },
    {
      label: 'Edit',
      onClick: (row: ManageProfileList) => handleEdit(row),
      icon: editIcon,
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
      hide: !isProfileEditEnable,
    },
    {
      label: 'Delete',
      onClick: (row: ManageProfileList) => handleDelete(row),
      icon: deleteIcon,
      hide: !isProfileDeleteEnable,
    },
  ];

  return (
    <ListTable
      data={data?.data?.profiles as any}
      columns={profileColumns}
      getRowId={getRowId}
      hoverHighlight={false}
      tableStyle={{ overflowY: 'hidden' }}
      stickyHeader={false}
      stickyColumnsCount={2}
      selectable={true}
      onSelectionChange={onSelectionChange}
      actionWidth={60}
      actionDisplayMode='dropdown'
      actionMenuItems={actionButtons}
      loading={isLoading}
      error={isError ? 'Failed to load profiles' : undefined}
      rowsPerPageOptions={[25, 50, 100]}
      rowsPerPage={tableParams.limit}
      currentPage={(tableParams.page ?? 1) - 1}
      totalItems={totalItems}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      sortBy={tableParams.sortBy}
      sortOrder={tableParams.sortOrder}
      onSort={handleSort}
    />
  );
};
