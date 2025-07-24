import React, { useEffect, useState } from 'react';
import { ListTable } from '../../../../../../../../components/table';
import { getConfigAssignGroupsColumns } from './column';
import { useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '../../../../../../../../hooks';
import {
  AssignUserAccess,
  ConfigAssignGroupsList,
  ConfigAssignGroupsListParms,
} from '../../../../../../../types';
import {
  useConfigAssignGroupsList,
  useUpdateConfigAssignUserAccess,
} from '../../../../../../../services/configuration/user-config-service';

const AssignGroups: React.FC = () => {
  const { projectid } = useParams();
  const [searchParams] = useSearchParams();
  const { successToast, errorToast } = useToast();
  const accountId = searchParams.get('accountID') || '';
  const [tableParams, setTableParams] = useState<ConfigAssignGroupsListParms>({
    sortBy: 'group_name',
    sortOrder: 'ASC',
    entity_type: 'PROJECT',
    page: 1,
    limit: 100,
  });
  const [assignGroupList, setAssignGroupList] = useState<
    ConfigAssignGroupsList[]
  >([]);
  const [addedAccounts, setAddedAccounts] = useState<string[]>([]);
  const [addedProjects, setAddedProjects] = useState<Record<string, boolean>>(
    {}
  );

  const { data, isLoading, isError } = useConfigAssignGroupsList(
    accountId,
    projectid || '',
    tableParams
  );
  const updateAssignUserList = useUpdateConfigAssignUserAccess('project');
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      const groupsData = data?.groups.map((group) => ({
        ...group,
        isDisabledToggle: group.type !== 'CUSTOM',
      }));

      setAssignGroupList(groupsData || []);
    }
  }, [data]);

  useEffect(() => {
    if (data?.groups?.length) {
      const accessibleUsers = data.groups.filter(
        (group) => group.has_access === true
      );
      setAddedAccounts(accessibleUsers.map((group) => group.rid));
      const initialProjects: Record<string, boolean> = {};
      accessibleUsers.forEach((group) => {
        initialProjects[group.rid] = true;
      });

      setAddedProjects(initialProjects);
    }
  }, [data?.groups]);

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

  const getRowId = (row: ConfigAssignGroupsList) => row.rid;

  const toggleProjects = (rowId: string, checked: boolean) => {
    const previousUserList = [...assignGroupList];
    const updatedUserList = assignGroupList.map((group) => {
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
          setAssignGroupList(updatedUserList);
          successToast('Updated successfully');
        },
        onError: () => {
          setAssignGroupList(previousUserList);
          errorToast('Failed to Update.');
        },
      }
    );
  };

  return (
    <ListTable
      data={assignGroupList}
      columns={getConfigAssignGroupsColumns()}
      getRowId={getRowId}
      hoverHighlight={false}
      tableStyle={{
        height: '100%',
        maxHeight: 'calc(100vh - 320px)',
        overflow: 'auto',
        paddingTop: '2px',
      }}
      stickyHeader={true}
      stickyColumnsCount={1}
      selectable={false}
      actionWidth={200}
      actionDisplayMode='toggle'
      actionMenuItems={[]}
      loading={isLoading}
      error={isError ? 'Failed to load group data' : ''}
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

export default AssignGroups;
