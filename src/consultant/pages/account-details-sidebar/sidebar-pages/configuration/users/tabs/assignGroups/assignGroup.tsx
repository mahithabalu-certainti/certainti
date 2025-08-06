import React, { useEffect, useMemo, useState } from 'react';
import { ListTable } from '../../../../../../../../components/table';
import { getConfigAssignGroupsColumns } from './column';
import { useParams } from 'react-router-dom';
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
  const { accountid } = useParams();
  const { successToast, errorToast } = useToast();
  const [tableParams, setTableParams] = useState<ConfigAssignGroupsListParms>({
    sortBy: 'group_name',
    sortOrder: 'ASC',
    entity_type: 'ACCOUNT',
    page: filterParams.page + 1,
    limit: 100,
    filters: filterParams.filters,
  });
  const [assignGroupList, setAssignGroupList] = useState<
    ConfigAssignGroupsList[]
  >([]);
  const [addedAccounts, setAddedAccounts] = useState<string[]>([]);

  const { data, isLoading, isError } = useConfigAssignGroupsList(
    accountid || '',
    tableParams,
    reFetchData
  );

  // Permission Management
  const { permission } = useSelector((state: RootState) => state.permission);
  const accountAssignGroupViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.MANAGE_ACCOUNT_ACCESS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    accountAssignGroupViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [accountAssignGroupViewEditFields]);

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
    setTableParams((prev) => ({
      ...prev,
      page: 1,
      filters: filterParams.filters,
    }));
  }, [filterParams.filters]);

  useEffect(() => {
    if (data?.groups?.length) {
      const accessibleUsers = data.groups.filter(
        (group) => group.has_access === true
      );
      setAddedAccounts(accessibleUsers.map((group) => group.rid));
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

  function buildUpdatedGroupsList(rowId: string, checked: boolean) {
    return assignGroupList.map((group) => ({
      rid: group.rid,
      is_enabled: group.rid === rowId ? checked : group.has_access,
      is_modified: group.rid === rowId,
    }));
  }

  const toggleProjects = (rowId: string, checked: boolean) => {
    const previousGroupList = [...assignGroupList];
    const updatedGroupList = assignGroupList.map((group) => {
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

    updateAssignGroupList.mutate(
      {
        groups: updatedGroups,
        account_rid: accountid,
        access_type: 'GROUP',
        entity_type: 'ACCOUNT',
      } as Partial<AssignUserAccess>,
      {
        onSuccess: () => {
          setAssignGroupList(updatedGroupList);
          successToast('Updated successfully');
        },
        onError: () => {
          setAssignGroupList(previousGroupList);
          errorToast('Failed to Update.');
        },
      }
    );
  };

  const disabledToggle =
    permissionMap?.['assign']?.read && !permissionMap?.['assign']?.edit;

  const hideToggle =
    !permissionMap?.['assign']?.read && !permissionMap?.['assign']?.edit;

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
      actionDisplayMode={hideToggle ? undefined : 'toggle'}
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
      actionColumnName='Add / Remove'
      disabledToggle={disabledToggle}
      toggleClick={toggleProjects}
      toggleData={addedAccounts}
      checkedToggleTooltip='Added'
      unCheckedToggleTooltip='Removed'
    />
  );
};

export default AssignGroups;
