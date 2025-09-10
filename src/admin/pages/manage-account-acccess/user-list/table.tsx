import { useNavigate, useSearchParams } from 'react-router-dom';
import { ListTable, ManageColumnsPopover } from '../../../../components/table';
import { manageUserListColumns } from './column';
import {
  useManageAccountAccessUserList,
  useUpdateAccountAccesseDetails,
} from '../../../service/manage-account-access/manage-account-service';
import {
  AccountAccessDetail,
  ManageAccountsUserList,
  ManageUserListParms,
} from '../../../types/manage-account';
import { useEffect, useState } from 'react';
import { useToast } from '../../../../hooks';
import { FilterType } from '../../../types';
import { clearFilters } from '../../../../components/filter-component/utils';
import {
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../components/table/types';

interface UserTableProps {
  isProfileViewEnable?: boolean;
  appliedFilters: Record<string, FilterType>;
  setAppliedFilters: React.Dispatch<
    React.SetStateAction<Record<string, FilterType>>
  >;
  disabled?: boolean;
  hide?: boolean;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
}
export const ManageAccountUserListTable: React.FC<UserTableProps> = ({
  appliedFilters,
  setAppliedFilters,
  disabled,
  hide,
  columnAnchorEl,
  setColumnAnchorEl,
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tableParams, setTableParams] = useState<ManageUserListParms>({
    sortBy: 'first_name',
    sortOrder: 'ASC',
    entity_type: 'ACCOUNT',
    page: 1,
    limit: 100,
  });
  const { successToast } = useToast();
  const [addedAccounts, setAddedAccounts] = useState<string[]>([]);
  const [, setAddedProjects] = useState<
    { rid: string; is_enabled: boolean; is_modified: boolean }[]
  >([]);
  const handlePageChange = (newPage: number) => {
    setTableParams((prev) => ({
      ...prev,
      page: newPage + 1,
    }));
  };
  const updateAccountAccessList = useUpdateAccountAccesseDetails();
  const commonSuccess = updateAccountAccessList.isSuccess;
  const accountId = searchParams.get('accountid') || '';
  const [userList, setUserList] = useState<ManageAccountsUserList[]>([]);
  const { data, isLoading, isError } = useManageAccountAccessUserList(
    {
      page: tableParams.page,
      limit: tableParams.limit,
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      entity_type: 'ACCOUNT',
      filters: appliedFilters,
    },
    accountId
  );
  const totalCount = data?.data?.count || 0;
  useEffect(() => {
    if (data) {
      const usersWithColor = (data?.data?.users || []).map((user) => ({
        ...user,
        isColorEnabled: user.has_access && user.is_grouped,
      }));
      setUserList(usersWithColor);
    }
  }, [data]);

  const handleBack = () => {
    searchParams.delete('accountList');
    searchParams.delete('username');
    searchParams.delete('groupname');
    navigate({ search: searchParams.toString() });
  };
  useEffect(() => {
    if (commonSuccess) {
      successToast('Updated successfully');
      handleBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonSuccess]);
  useEffect(() => {
    if (data?.data?.users?.length) {
      const accessibleUsers = data.data.users.filter(
        (user) => user.has_access === true
      );

      setAddedAccounts(accessibleUsers.map((user) => user.rid));

      setAddedProjects(
        accessibleUsers.map((user) => ({
          rid: user.rid,
          is_enabled: true,
          is_modified: true,
        }))
      );
    }
  }, [data?.data?.users]);

  const handleRowsPerPageChange = (newLimit: number) => {
    setTableParams((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }));
  };
  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setTableParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder: apiOrder,
    }));
  };
  const getRowId = (row: ManageAccountsUserList) => {
    return row.rid || '';
  };

  const handleAccountName = (user: ManageAccountsUserList) => {
    searchParams.set('accountList', user.rid);
    searchParams.delete('groupname');
    searchParams.set('username', user.first_name);
    setAppliedFilters({});
    clearFilters();
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const projectColumns = manageUserListColumns(
    handleAccountName,
    addedAccounts
  );

  function buildUpdatedGroupsList(rowId: string, checked: boolean) {
    return userList.map((group) => ({
      rid: group.rid,
      is_enabled: group.rid === rowId ? checked : group.has_access,
      is_modified: group.rid === rowId,
    }));
  }

  const toggleProjects = (rowId: string, checked: boolean) => {
    const previousGroupList = [...userList];
    const updatedGroupList = userList.map((group) => {
      if (group.rid === rowId) {
        return {
          ...group,
          has_access: checked,
        };
      }
      return group;
    });

    setAddedAccounts((prev) =>
      checked ? [...prev, rowId] : prev.filter((item) => item !== rowId)
    );

    const updatedGroups = buildUpdatedGroupsList(rowId, checked);

    updateAccountAccessList.mutate(
      {
        users: updatedGroups,
        account_rid: accountId,
        access_type: 'USER',
        entity_type: 'ACCOUNT',
      } as Partial<AccountAccessDetail>,
      {
        onSuccess: () => {
          setUserList(updatedGroupList);
          successToast('Updated successfully');
        },
        onError: () => {
          setUserList(previousGroupList);
          // errorToast('Failed to Update.');
        },
      }
    );
  };

  const RestrictedColumns = [
    {
      id: 'first_name',
      canHide: false,
      canDrag: false,
    },
  ];

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<ManageAccountsUserList>[]
  >(projectColumns.filter((col) => !col.hide));

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<ManageAccountsUserList>[]
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
    <div className='pt-1'>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={projectColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <ListTable
        data={userList || []}
        columns={visibleColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 180px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={2}
        selectable={false}
        onSelectionChange={(selectedIds) =>
          console.log('Selected:', selectedIds)
        }
        actionWidth={80}
        actionDisplayMode={hide ? undefined : 'toggle'}
        loading={isLoading}
        error={
          isError ? 'Failed to load Manage Account User Access' : undefined
        }
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={tableParams.limit}
        currentPage={(tableParams.page ?? 1) - 1}
        totalItems={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortBy={tableParams.sortBy}
        sortOrder={tableParams.sortOrder}
        onSort={handleSort}
        actionColumnName='Add / Remove'
        toggleClick={toggleProjects}
        toggleData={addedAccounts}
        disabledToggle={disabled}
        component='Manage-Account-User-Access'
        checkedToggleTooltip='Added'
        unCheckedToggleTooltip='Removed'
      />
    </div>
  );
};
