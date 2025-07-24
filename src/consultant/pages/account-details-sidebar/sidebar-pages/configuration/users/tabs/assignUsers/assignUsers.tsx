import { useParams } from 'react-router-dom';
import { useToast } from '../../../../../../../../hooks';
import { useEffect, useMemo, useState } from 'react';
import {
  AssignUserAccess,
  ConfigAssignUserList,
  ConfigAssignUserListParms,
} from '../../../../../../../types';
import {
  useConfigAssignUsersList,
  useUpdateConfigAssignUserAccess,
} from '../../../../../../../services/configuration/user-config-service';
import { getAccountAssignUsersColumns } from './column';
import { ListTable } from '../../../../../../../../components/table';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../../../store/store';
import { AllPermissions } from '../../../../../../../../common-service';

interface AssignUserProps {
  reFetchData: number;
  setCount: (value: number) => void;
  filterParams: ConfigAssignUserListParms;
}

const AssignUsers: React.FC<AssignUserProps> = ({
  reFetchData,
  filterParams,
  setCount,
}) => {
  const { accountid } = useParams();
  const { successToast, errorToast } = useToast();
  const [tableParams, setTableParams] = useState<ConfigAssignUserListParms>({
    sortBy: 'first_name',
    sortOrder: 'ASC',
    entity_type: 'ACCOUNT',
    page: 1,
    limit: 100,
  });
  const [assignUserList, setAssignUserList] = useState<ConfigAssignUserList[]>(
    []
  );
  const [addedAccounts, setAddedAccounts] = useState<string[]>([]);
  const [, setAddedProjects] = useState<
    { rid: string; is_enabled: boolean; is_modified: boolean }[]
  >([]);

  // Permission Management
  const { permission } = useSelector((state: RootState) => state.permission);
  const accountUsersViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.MANAGE_ACCOUNT_ACCESS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    accountUsersViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [accountUsersViewEditFields]);

  const { data, isLoading, isError } = useConfigAssignUsersList(
    accountid || '',
    tableParams,
    reFetchData
  );
  const updateAssignUserList = useUpdateConfigAssignUserAccess('account');
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      const userData = data?.users.map((user) => ({
        ...user,
        isColorEnabled: user.has_access && user.is_grouped,
      }));
      setAssignUserList(userData);
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
        sortBy: filterParams.sortBy || 'first_name',
        sortOrder: filterParams.sortOrder,
        filters: filterParams.filters,
      }));
    }
  }, [filterParams]);

  useEffect(() => {
    if (data?.users?.length) {
      const accessibleUsers = data.users.filter(
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
      updateAssignUserList.mutate(
        {
          users: updatedProjects,
          account_rid: accountid,
          access_type: 'USER',
          entity_type: 'ACCOUNT',
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

      return updatedProjects;
    });
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
      actionColumnName='Assign'
      disabledToggle={
        !(permissionMap?.['assign']?.read && permissionMap?.['assign']?.edit)
      }
      toggleClick={toggleProjects}
      toggleData={addedAccounts}
    />
  );
};

export default AssignUsers;
