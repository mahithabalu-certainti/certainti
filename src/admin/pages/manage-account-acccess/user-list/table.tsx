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
  ManageUserListParms,
} from '../../../types/manage-account';
import { useEffect, useRef, useState } from 'react';

interface UserTableProps {
  isProfileViewEnable?: boolean;
}
export const ManageAccountUserListTable: React.FC<UserTableProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tableParams, setTableParams] = useState<ManageUserListParms>({
    sortBy: 'frist_name',
    sortOrder: 'DESC',
    entity_type: 'Account',
    page: 1,
    limit: 100,
  });
  const [addedAccounts, setAddedAccounts] = useState<string[]>([]);
  const [addedProjects, setAddedProjects] = useState<
    { rid: string; is_enabled: boolean; is_modified: boolean }[]
  >([]);
  const handlePageChange = (newPage: number) => {
    setTableParams((prev) => ({
      ...prev,
      page: newPage + 1,
    }));
  };
  const updateAccountAccessList = useUpdateAccountAccesseDetails();
  // const commonSuccess = updateAccountAccessList.isSuccess;
  const accountId = searchParams.get('userid');

  const handleSubmit = () => {
    const constructData = {
      users: addedProjects,
      account_rid: accountId,
      access_type: 'USER',
    } as Partial<AccountAccessDetail>;
    updateAccountAccessList.mutate(constructData);
  };
  const { data, isLoading, isError } =
    useManageAccountAccessUserList(tableParams);
  const userListData = data?.data?.users ?? [];
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (hasMountedRef.current) {
      handleSubmit();
    } else {
      hasMountedRef.current = true;
    }
  }, [addedProjects]);
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
  const getRowId = (row: any) => {
    return row.rid || '';
  };

  const handleAccountName = (project: any) => {
    searchParams.set('accountList', project.rid);
    searchParams.set('type', 'user');
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const projectColumns = manageUserListColumns(handleAccountName);

  const toggleProjects = (rowId: string, checked: boolean) => {
    if (checked) {
      setAddedAccounts((prev) => [...prev, rowId]);
      setAddedProjects((prev) => {
        const alreadyExists = prev.some((item) => item.rid === rowId);
        if (!alreadyExists) {
          return [
            ...prev,
            {
              rid: rowId,
              is_enabled: true,
              is_modified: true,
            },
          ];
        }
        return prev;
      });
    } else {
      setAddedAccounts((prev) => prev.filter((item) => item !== rowId));

      setAddedProjects((prev) => prev.filter((item) => item.rid !== rowId));
    }
  };
  return (
    <div className='pt-1'>
      <ListTable
        data={userListData || []}
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
        error={isError ? 'Failed to load Manage Account Access' : undefined}
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
