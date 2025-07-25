/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useSearchParams } from 'react-router-dom';
import { manageUserGroupColumns } from './column';
import {
  useManageAccountAccessGroupList,
  useUpdateAccountAccesseDetails,
} from '../../../service/manage-account-access/manage-account-service';
import { ListTable } from '../../../../components/table';
import { useEffect, useState } from 'react';
import {
  AccountAccessDetail,
  ManageAccountsGroupList,
  ManageUserListParms,
} from '../../../types/manage-account';
import { useToast } from '../../../../hooks';
import { FilterType } from '../../../types';
interface UserTableProps {
  isProfileViewEnable?: boolean;
  appliedFilters: Record<string, FilterType>;
  setAppliedFilters: React.Dispatch<
    React.SetStateAction<Record<string, FilterType>>
  >;
  disabled?: boolean;
  hide?: boolean;
}
export const ManageAccountUserGroupTable: React.FC<UserTableProps> = ({
  appliedFilters,
  setAppliedFilters,
  disabled,
  hide,
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tableParams, setTableParams] = useState<ManageUserListParms>({
    sortBy: 'frist_name',
    sortOrder: 'ASC',
    entity_type: 'Account',
    page: 1,
    limit: 100,
  });

  const [addedAccounts, setAddedAccounts] = useState<string[]>([]);
  const [, setAddedProjects] = useState<
    { rid: string; is_enabled: boolean; is_modified: boolean }[]
  >([]);
  const [groupList, setGroupList] = useState<ManageAccountsGroupList[]>([]);
  const updateAccountAccessList = useUpdateAccountAccesseDetails();
  const commonSuccess = updateAccountAccessList.isSuccess;
  const accountId = searchParams.get('accountid') || '';
  const { successToast } = useToast();
  const { data, isLoading, isError } = useManageAccountAccessGroupList(
    {
      page: tableParams.page,
      limit: tableParams.limit,
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      entity_type: 'Account',
      filters: appliedFilters,
    },
    accountId
  );
  const totalItems = data?.data?.count;
  const handleBack = () => {
    searchParams.delete('accountList');
    searchParams.delete('username');
    searchParams.delete('groupname');
    navigate({ search: searchParams.toString() });
    setAppliedFilters({});
  };
  useEffect(() => {
    if (data) {
      const usedisableToggle = (data?.data?.groups || []).map((group) => ({
        ...group,
        isDisabledToggle: group.type !== 'CUSTOM',
      }));

      setGroupList(usedisableToggle || []);
    }
  }, [data]);
  useEffect(() => {
    if (commonSuccess) {
      successToast('group updated successfully');
      handleBack();
    }
  }, [commonSuccess]);
  useEffect(() => {
    if (data?.data?.groups?.length) {
      const accessibleUsers = data.data.groups.filter(
        (group) => group.has_access
      );

      setAddedAccounts(accessibleUsers.map((group) => group.rid));

      setAddedProjects(
        accessibleUsers.map((group) => ({
          rid: group.rid,
          is_enabled: true,
          is_modified: true,
        }))
      );
    }
  }, [data?.data?.groups]);

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

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setTableParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder: apiOrder,
    }));
  };

  const getRowId = (row: ManageAccountsGroupList) => row.rid || '';

  const handleAccountName = (group: ManageAccountsGroupList) => {
    searchParams.set('accountList', group.rid);
    searchParams.delete('username');
    searchParams.set('groupname', group.group_name);
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const toggleProjects = (rowId: string, checked: boolean) => {
    setAddedAccounts((prev) =>
      checked ? [...prev, rowId] : prev.filter((item) => item !== rowId)
    );
    setAddedProjects((prev) => {
      const updatedProjects = [...prev];
      const existingIndex = prev.findIndex((item) => item.rid === rowId);

      if (existingIndex !== -1) {
        updatedProjects[existingIndex] = {
          ...updatedProjects[existingIndex],
          is_enabled: checked,
          is_modified: true,
        };
      } else if (checked) {
        updatedProjects.push({
          rid: rowId,
          is_enabled: true,
          is_modified: true,
        });
      }
      updateAccountAccessList.mutate({
        groups: updatedProjects,
        account_rid: accountId,
        access_type: 'GROUP',
        entity_type: 'ACCOUNT',
      } as Partial<AccountAccessDetail>);

      return updatedProjects;
    });
  };
  const projectColumns = manageUserGroupColumns(
    handleAccountName,
    addedAccounts
  );

  return (
    <div className='pt-1'>
      <ListTable
        data={groupList || []}
        columns={projectColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 180px)',
          overflow: 'auto',
        }}
        stickyHeader
        stickyColumnsCount={1}
        selectable={false}
        onSelectionChange={(selectedIds) =>
          console.log('Selected:', selectedIds)
        }
        actionWidth={80}
        actionDisplayMode={hide ? undefined : 'toggle'}
        loading={isLoading}
        error={
          isError ? 'Failed to load Manage Account Groups Access' : undefined
        }
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={tableParams.limit}
        currentPage={(tableParams.page ?? 1) - 1}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortBy={tableParams.sortBy}
        sortOrder={tableParams.sortOrder}
        onSort={handleSort}
        component='Manage-Account-Group-Access'
        actionColumnName='Add/Remove'
        toggleClick={toggleProjects}
        toggleData={addedAccounts}
        disabledToggle={disabled}
        checkedToggleTooltip='Added'
        unCheckedToggleTooltip='Removed'
      />
    </div>
  );
};
