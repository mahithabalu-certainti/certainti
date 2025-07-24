/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ListTable } from '../../../../components/table';
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

interface UserTableProps {
  isProfileViewEnable?: boolean;
}
export const ManageAccountUserListTable: React.FC<UserTableProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tableParams, setTableParams] = useState<ManageUserListParms>({
    sortBy: 'first_name',
    sortOrder: 'DESC',
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
    tableParams,
    accountId
  );
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
      successToast('user updated successfully');
      handleBack();
    }
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
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const projectColumns = manageUserListColumns(handleAccountName);

  const toggleProjects = (rowId: string, checked: boolean) => {
    const previousUserList = [...userList];
    const updatedUserList = userList.map((user) => {
      if (user.rid === rowId) {
        const newHasAccess = checked;
        const newToggleBgColor = newHasAccess && user.is_grouped;
        return {
          ...user,
          has_access: newHasAccess,
          isColorEnabled: newToggleBgColor,
        };
      }
      return user;
    });

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
      updateAccountAccessList.mutate(
        {
          users: updatedProjects,
          account_rid: accountId,
          access_type: 'USER',
        } as Partial<AccountAccessDetail>,
        {
          onSuccess: () => {
            setUserList(updatedUserList);
          },
          onError: () => {
            setUserList(previousUserList);
          },
        }
      );

      return updatedProjects;
    });
  };

  console.log('addedProjects', userList);
  return (
    <div className='pt-1'>
      <ListTable
        data={userList || []}
        columns={projectColumns}
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
        actionDisplayMode='toggle'
        loading={isLoading}
        error={
          isError ? 'Failed to load Manage Account User Access' : undefined
        }
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={tableParams.limit}
        currentPage={(tableParams.page ?? 1) - 1}
        totalItems={10}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortBy={tableParams.sortBy}
        sortOrder={tableParams.sortOrder}
        onSort={handleSort}
        actionColumnName='Add/Remove'
        toggleClick={toggleProjects}
        toggleData={addedAccounts}
        component='Account-User-Access'
      />
    </div>
  );
};
