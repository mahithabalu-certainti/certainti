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

export const ManageAccountUserGroupTable: React.FC = () => {
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

  const updateAccountAccessList = useUpdateAccountAccesseDetails();
  const accountId = searchParams.get('userid');

  const { data, isLoading, isError } =
    useManageAccountAccessGroupList(tableParams);

  const groupListData = data?.data?.groups || [];
  const totalItems = data?.data?.count;

  const handleSubmit = () => {
    const constructData = {
      groups: addedProjects,
      account_rid: accountId,
      access_type: 'GROUP',
    } as Partial<AccountAccessDetail>;
    updateAccountAccessList.mutate(constructData);
  };

  useEffect(() => {
    handleSubmit();
  }, [addedProjects]);

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

  const handleAccountName = (project: ManageAccountsGroupList) => {
    searchParams.set('accountList', project.rid);
    searchParams.set('type', 'group');
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const toggleProjects = (rowId: string, checked: boolean) => {
    setAddedAccounts((prev) =>
      checked ? [...prev, rowId] : prev.filter((item) => item !== rowId)
    );

    setAddedProjects((prev) => {
      const existingIndex = prev.findIndex((item) => item.rid === rowId);

      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          is_enabled: checked,
          is_modified: true,
        };
        return updated;
      } else if (checked) {
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
  };

  const projectColumns = manageUserGroupColumns(handleAccountName);

  return (
    <div className='pt-1'>
      <ListTable
        data={groupListData || []}
        columns={projectColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 180px)',
          overflow: 'auto',
        }}
        stickyHeader
        stickyColumnsCount={2}
        selectable
        onSelectionChange={(selectedIds) =>
          console.log('Selected:', selectedIds)
        }
        actionWidth={80}
        actionDisplayMode='toggle'
        loading={isLoading}
        error={isError ? 'Failed to load Account Groups' : undefined}
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={tableParams.limit}
        currentPage={(tableParams.page ?? 1) - 1}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortBy={tableParams.sortBy}
        sortOrder={tableParams.sortOrder}
        onSort={handleSort}
        component='Account-Access'
        actionColumnName='Add/Remove'
        toggleClick={toggleProjects}
        toggleData={addedAccounts}
      />
    </div>
  );
};
