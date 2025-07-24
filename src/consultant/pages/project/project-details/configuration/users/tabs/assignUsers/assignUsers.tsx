import React, { useEffect, useState } from 'react';
import { ListTable } from '../../../../../../../../components/table';
import { getAccountAssignUsersColumns } from './column';
import {
  AssignUserAccess,
  ConfigAssignUserList,
  ConfigAssignUserListParms,
} from '../../../../../../../types';
import {
  useConfigAssignUsersList,
  useUpdateConfigAssignUserAccess,
} from '../../../../../../../services/configuration/user-config-service';
import { useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '../../../../../../../../hooks';

const AssignUsers: React.FC = () => {
  const { projectid } = useParams();
  const [searchParams] = useSearchParams();
  const { successToast, errorToast } = useToast();
  const accountId = searchParams.get('accountID') || '';
  const [tableParams, setTableParams] = useState<ConfigAssignUserListParms>({
    sortBy: 'first_name',
    sortOrder: 'ASC',
    entity_type: 'PROJECT',
    page: 1,
    limit: 100,
  });
  const [assignUserList, setAssignUserList] = useState<ConfigAssignUserList[]>(
    []
  );
  const [addedAccounts, setAddedAccounts] = useState<string[]>([]);
  const [addedProjects, setAddedProjects] = useState<Record<string, boolean>>(
    {}
  );

  const { data, isLoading, isError } = useConfigAssignUsersList(
    accountId,
    projectid || '',
    tableParams
  );
  const updateAssignUserList = useUpdateConfigAssignUserAccess('project');
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      const userData = data?.users.map((user) => ({
        ...user,
        isColorEnabled: user.has_access && user.is_grouped,
      }));
      setAssignUserList(userData);
    }
  }, [data]);

  useEffect(() => {
    if (data?.users?.length) {
      const accessibleUsers = data.users.filter(
        (user) => user.has_access === true
      );
      setAddedAccounts(accessibleUsers.map((user) => user.rid));
      const initialProjects: Record<string, boolean> = {};
      accessibleUsers.forEach((user) => {
        initialProjects[user.rid] = true;
      });

      setAddedProjects(initialProjects);
    }
  }, [data?.users]);

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

  const getRowId = (row: ConfigAssignUserList) => row.rid;

  const toggleProjects = (rowId: string, checked: boolean) => {
    const previousUserList = [...assignUserList];
    const updatedUserList = assignUserList.map((user) => {
      if (user.rid === rowId) {
        const newHasAccess = checked;
        const updatedColor = newHasAccess && user.is_grouped;
        return {
          ...user,
          has_access: newHasAccess,
          isColorEnabled: updatedColor,
        };
      }
      return user;
    });

    setAddedAccounts((prev) =>
      checked ? [...prev, rowId] : prev.filter((item) => item !== rowId)
    );
    const updatedProjects = {
      ...addedProjects,
      [rowId]: checked,
    };

    setAddedProjects(updatedProjects);
    updateAssignUserList.mutate(
      {
        projects: updatedProjects,
        account_rid: accountId,
        user_rid: rowId,
      } as Partial<AssignUserAccess>,
      {
        onSuccess: () => {
          setAssignUserList(updatedUserList);
          successToast('Updated successfully');
        },
        onError: () => {
          setAssignUserList(previousUserList);
          errorToast('Failed to Update.');
        },
      }
    );
  };

  return (
    <ListTable
      data={assignUserList}
      columns={getAccountAssignUsersColumns()}
      getRowId={getRowId}
      hoverHighlight={false}
      tableStyle={{
        height: '100%',
        maxHeight: 'calc(100vh - 290px)',
        overflow: 'auto',
        paddingTop: '2px',
      }}
      stickyHeader={true}
      stickyColumnsCount={1}
      selectable={false}
      actionWidth={120}
      actionDisplayMode='toggle'
      actionMenuItems={[]}
      loading={isLoading}
      error={isError ? 'Failed to load user data' : ''}
      rowsPerPageOptions={[25, 50, 100]}
      rowsPerPage={tableParams.limit}
      currentPage={(tableParams.page ?? 1) - 1}
      totalItems={totalItems}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      sortBy={tableParams.sortBy}
      sortOrder={tableParams.sortOrder}
      onSort={handleSort}
      actionColumnName='Exclusion / Inclusion'
      toggleClick={toggleProjects}
      toggleData={addedAccounts}
    />
  );
};

export default AssignUsers;
