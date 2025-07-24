import React, { useEffect, useMemo, useState } from 'react';
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
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../../../store/store';
import { AllPermissions } from '../../../../../../../../common-service';

interface AssignGroupsProps {
  reFetchData: number;
  setCount: (value: number) => void;
  filterParams: ConfigAssignGroupsListParms;
}

const AssignGroups: React.FC<AssignGroupsProps> = ({
  reFetchData,
  filterParams,
  setCount,
}) => {
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
  const [, setAddedProjects] = useState<
    { rid: string; is_enabled: boolean; is_modified: boolean }[]
  >([]);
  const [addedAccounts, setAddedAccounts] = useState<string[]>([]);

  // Permission Management
  const { permission } = useSelector((state: RootState) => state.permission);
  const projectGroupViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.MANAGE_ACCOUNT_ACCESS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectGroupViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectGroupViewEditFields]);

  const { data, isLoading, isError } = useConfigAssignGroupsList(
    accountId,
    tableParams,
    reFetchData,
    projectid || ''
  );
  const updateAssignGroupList = useUpdateConfigAssignUserAccess('account');
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      const groupsData = data?.groups.map((group) => ({
        ...group,
        isDisabledToggle: group.type !== 'CUSTOM',
      }));
      setAssignGroupList(groupsData || []);
      setCount(data?.count || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (
      filterParams.sortBy ||
      (filterParams.filters && Object.keys(filterParams.filters).length)
    ) {
      setTableParams((prev) => ({
        ...prev,
        page: filterParams.page + 1,
        sortBy: filterParams.sortBy || 'group_name',
        sortOrder: filterParams.sortOrder,
        filters: filterParams.filters,
      }));
    }
  }, [filterParams]);

  useEffect(() => {
    if (data?.groups?.length) {
      const accessibleGroups = data.groups.filter(
        (group) => group.has_access === true
      );
      setAddedAccounts(accessibleGroups.map((group) => group.rid));
      setAddedProjects(
        accessibleGroups.map((group) => ({
          rid: group.rid,
          is_enabled: true,
          is_modified: true,
        }))
      );
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
      updateAssignGroupList.mutate(
        {
          groups: updatedProjects,
          account_rid: accountId,
          project_rid: projectid,
          access_type: 'GROUP',
          entity_type: 'PROJECT',
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
      return updatedProjects;
    });
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
      checkedToggleTooltip='Inclusion'
      disabledToggle={
        !(permissionMap?.['assign']?.read && permissionMap?.['assign']?.edit)
      }
      unCheckedToggleTooltip='Exclusion'
    />
  );
};

export default AssignGroups;
