import React, { useEffect, useMemo, useState } from 'react';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../../../../components/table';
import { getConfigAssignUsersColumns } from './column';
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
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../../../store/store';
import { AllPermissions } from '../../../../../../../../common-service';
import {
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../../../../components/table/types';

interface AssignUserProps {
  reFetchData: number;
  setCount: (value: number) => void;
  filterParams: ConfigAssignUserListParms;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue?: string;
}

const AssignUsers: React.FC<AssignUserProps> = ({
  reFetchData,
  filterParams,
  setCount,
  columnAnchorEl,
  setColumnAnchorEl,
  searchValue,
}) => {
  const { projectid } = useParams();
  const [searchParams] = useSearchParams();
  const { successToast, errorToast } = useToast();
  const accountId = searchParams.get('accountID') || '';
  const [tableParams, setTableParams] = useState<ConfigAssignUserListParms>({
    sortBy: 'first_name',
    sortOrder: 'ASC',
    entity_type: 'PROJECT',
    page: filterParams.page + 1,
    limit: 100,
    filters: filterParams.filters,
    search: searchValue,
  });
  const [assignUserList, setAssignUserList] = useState<ConfigAssignUserList[]>(
    []
  );
  const [addedAccounts, setAddedAccounts] = useState<string[]>([]);

  // Permission Management
  const { permission } = useSelector((state: RootState) => state.permission);
  const projectUsersAssignViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.MANAGE_ACCOUNT_ACCESS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectUsersAssignViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectUsersAssignViewEditFields]);

  const { data, isLoading, isError } = useConfigAssignUsersList(
    accountId,
    tableParams,
    reFetchData,
    projectid || ''
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
    setTableParams((prev) => ({
      ...prev,
      page: 1,
      filters: filterParams.filters,
      search: searchValue,
    }));
  }, [filterParams.filters, searchValue]);

  useEffect(() => {
    if (data?.users?.length) {
      const accessibleUsers = data.users.filter(
        (user) => user.has_access === true
      );
      setAddedAccounts(accessibleUsers.map((user) => user.rid));
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

  function buildUpdatedUsersList(rowId: string, checked: boolean) {
    return assignUserList.map((user) => ({
      rid: user.rid,
      is_enabled: user.rid === rowId ? checked : user.has_access,
      is_modified: user.rid === rowId,
    }));
  }

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

    const updatedProjects = buildUpdatedUsersList(rowId, checked);

    updateAssignUserList.mutate(
      {
        users: updatedProjects,
        account_rid: accountId,
        project_rid: projectid,
        access_type: 'USER',
        entity_type: 'PROJECT',
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

  const disabledToggle =
    permissionMap?.['assign']?.read && !permissionMap?.['assign']?.edit;

  const hideToggle =
    !permissionMap?.['assign']?.read && !permissionMap?.['assign']?.edit;

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<ConfigAssignUserList>[]
  >(getConfigAssignUsersColumns().filter((col) => !col.hide));

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<ConfigAssignUserList>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'interaction-column-visibility-popover'
    : undefined;

  const RestrictedColumns = [
    {
      id: 'first_name',
      canHide: false,
      canDrag: false,
    },
  ];

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={getConfigAssignUsersColumns()}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <ListTable
        data={assignUserList}
        columns={visibleColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 420px)',
          overflow: 'auto',
          paddingTop: '2px',
        }}
        stickyHeader={true}
        stickyColumnsCount={1}
        selectable={false}
        actionWidth={80}
        actionDisplayMode={hideToggle ? undefined : 'toggle'}
        actionMenuItems={[]}
        loading={isLoading}
        error={isError ? 'Failed to load user data' : ''}
        rowsPerPageOptions={[25, 50, 100]}
        loadindRowCount={7}
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
        disabledToggle={disabledToggle}
        checkedToggleTooltip='Inclusion'
        unCheckedToggleTooltip='Exclusion'
      />
    </>
  );
};

export default AssignUsers;
