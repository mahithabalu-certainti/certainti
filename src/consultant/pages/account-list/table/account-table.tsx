/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { generatePath, useNavigate } from 'react-router-dom';
import { reshapeGlobalFilter } from '../../../../common-utils';
import { ListTable, ManageColumnsPopover } from '../../../../components/table';
import { ACCOUNT, ACCOUNT_DETAILS } from '../../../../routes';
import { RootState } from '../../../../store/store';
import { useAccounts, useFetchColorCodes } from '../../../services/account';
import { FilterState } from '../../../types';
import { AccountList } from '../../../types/account';
import { processAccounts } from '../helpers';
import './styles.css';
import { getAccountColumns } from './columns';
import {
  ActionItem,
  CellEditData,
  FieldChangeValue,
  ShowHideTableColumn,
} from '../../../../components/table/types';
import { DeleteIcon, EditIcon } from '../../../../assets';
import { useMutation } from '@apollo/client';
import { UPDATE_ACCOUNT } from '../../../../api/graphql/queries/account-query';
import { useToast } from '../../../../hooks';
import { AllPermissions } from '../../../../common-service';

const AccountTable: React.FC<Record<string, any>> = ({
  appliedFilters,
  setTotalCount,
  order,
  setOrder,
  orderBy,
  setOrderBy,
  page,
  isAccountEditEnable,
  // isAccountDeleteEnable,
  // setPage
  refreshAccountTrigger,
  countryOptions,
  industryOptions,
  expandChild,
  setColumnAnchorEl,
  columnAnchorEl,
  searchValue,
}) => {
  const navigate = useNavigate();
  const { errorToast } = useToast();
  const apiOrder = order.toUpperCase() as 'ASC' | 'DESC';
  const { filters, fiscalYear } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);
  const [accountsList, setAccountsList] = React.useState<AccountList[]>([]);

  const {
    data,
    isLoading: loading,
    isError,
  } = useAccounts(
    {
      page: page,
      limit: 1000,
      sortBy: orderBy,
      sortOrder: apiOrder,
      filters: appliedFilters,
      search: searchValue,
      globalFilters: reshapeGlobalFilter(filters as FilterState),
      fiscalYear,
    },
    refreshAccountTrigger
  );
  const colorCodes = useFetchColorCodes();
  const [updateAccountMutation] = useMutation(UPDATE_ACCOUNT);

  //permissions
  const { permission } = useSelector((state: RootState) => state.permission);
  const accountViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.ACCOUNTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    accountViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [accountViewEditFields]);

  useEffect(() => {
    if (data) {
      setTotalCount(data?.totalResult || 0);
    }
  }, [data]);

  const colorCodesList = useMemo(() => {
    return (
      colorCodes.data?.data.colors?.map((item) => ({
        color: '#000000',
        bgColor: item.color_code,
      })) || []
    );
  }, [colorCodes.data?.data.colors]);

  const processedAccounts = useMemo(() => {
    if (!data?.accounts) return [];
    return processAccounts(data.accounts, colorCodesList);
  }, [data?.accounts, colorCodesList]);

  useEffect(() => {
    setAccountsList((prev) => {
      if (prev === processedAccounts) return prev;
      return processedAccounts;
    });
  }, [processedAccounts]);

  // Add this handler in the AccountTable component
  const handleAccountNameClick = (account: AccountList) => {
    const path = generatePath(ACCOUNT_DETAILS, {
      accountid: account.rid,
    });
    navigate(path, {
      state: { account },
    });
  };

  // Handler for edit and delete actions
  const handleEdit = (
    account: AccountList,
    fieldValue?: string,
    section?: string
  ) => {
    const sendState = fieldValue || section;
    navigate(
      ACCOUNT + '/edit/' + account.rid,
      sendState
        ? {
            state: {
              field: fieldValue || '',
              section: fieldValue ? '' : section,
            },
          }
        : undefined
    );
  };

  const handleDelete = (account: AccountList) => {
    console.log('Delete account', account.rid);
  };

  // Handle sorting
  const handleSortChange = (property: string, direction: 'asc' | 'desc') => {
    setOrderBy(property);
    setOrder(direction);
  };

  const accountColumns = useMemo(
    () =>
      getAccountColumns(
        handleAccountNameClick,
        countryOptions,
        industryOptions,
        handleEdit,
        permissionMap
      ),
    [countryOptions, industryOptions]
  );

  const isSkeletonLoading = loading || colorCodes.isLoading;

  const getRowId = (row: AccountList) => row.rid;

  const actionButtons: ActionItem<AccountList>[] = [
    {
      label: 'Edit',
      onClick: (row: AccountList) => handleEdit(row),
      icon: EditIcon,
      hide: !isAccountEditEnable,
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
    },
    {
      label: 'Delete',
      onClick: (row: AccountList) => handleDelete(row),
      icon: DeleteIcon,
      hide: true,
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
    },
  ];

  const handleSelectionChange = (selectedIds: string[]) => {
    console.log('Selected rows:', selectedIds);
  };

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousAccounts = [...accountsList];

    // Flags
    let hasIndustry = false;
    let hasIndustryOther = false;
    let hasCountry = false;

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (acc, item) => {
        const key = item.editId || item.columnId;
        acc[key] = item.value;

        if (item.columnId === 'industry') hasIndustry = true;
        if (item.columnId === 'industry_name_other') hasIndustryOther = true;
        if (item.columnId === 'country') hasCountry = true;

        return acc;
      },
      {
        account_rid: rowId,
      }
    );

    if (hasIndustry && !hasIndustryOther) {
      updateData['industry_name_other'] = '';
    }
    if (hasCountry) {
      updateData['region_rid'] = '';
    }

    try {
      const res = await updateAccountMutation({
        variables: {
          data: updateData,
        },
      });

      const result = res.data?.updateInlineAccountDetails;

      if (result?.statusCode === 200 && result?.data) {
        const updatedData = result.data;
        const updatedRid = updatedData.rid;

        if (updatedRid !== rowId) {
          errorToast('Account data did not match. Update canceled.');
          setAccountsList(previousAccounts);
          return;
        }

        const newAccountsList = accountsList.map((account) => {
          // Parent account
          if (account.rid === updatedRid) {
            return {
              ...account,
              ...updatedData,
              child_accounts: account.child_accounts,
            };
          }

          // Child account
          if (
            account.child_accounts?.some((child) => child.rid === updatedRid)
          ) {
            return {
              ...account,
              child_accounts: account.child_accounts.map((child) => {
                if (child.rid === updatedRid) {
                  return {
                    ...child,
                    ...updatedData,
                    projects_by_fiscal_year: child.projects_by_fiscal_year,
                  };
                }
                return child;
              }),
            };
          }

          return account;
        });

        setAccountsList(newAccountsList);
      } else {
        errorToast(result?.statusMessage || 'Failed to update field');
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update filed');
      setAccountsList(previousAccounts);
    }
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const RestrictedColumns = [
    {
      id: 'account_name',
      canHide: false,
      canDrag: false,
      // tooltip: 'Account name cannot be hidden or dragged',
    },
  ];

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen ? 'account-column-visibility-popover' : undefined;

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(Object.fromEntries(accountColumns.map((col) => [col.id, !col.hide])));
  const [columnOrder, setColumnOrder] = useState(
    accountColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => accountColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);

  return (
    <div className='border-t border-[#CBD6E2] h-full'>
      {/* Column Visibility Popover */}
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={accountColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <ListTable
        data={accountsList || []}
        columns={visibleColumns}
        getRowId={getRowId}
        component={'account'}
        hoverHighlight={true}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 132px)',
          overflow: 'auto',
        }}
        //Expansion
        expandAllParent={true}
        expandAllChild={expandChild}
        expandable={true}
        childrenKey='child_accounts'
        grandchildrenKey='projects_by_fiscal_year'
        maxNestingLevel={3}
        editDisableLevel={[2]}
        stickyHeader={true}
        stickyColumnsCount={2}
        parentBorder={false}
        // Selection
        hideHeaderSelect={true}
        selectable={true}
        onSelectionChange={handleSelectionChange}
        // Actions
        actionWidth={60}
        actionDisplayMode='dropdown'
        actionMenuItems={actionButtons}
        // State
        loading={isSkeletonLoading}
        error={isError ? 'Failed to load data' : undefined}
        // Sorting
        sortBy={orderBy}
        sortOrder={order}
        onSort={handleSortChange}
        onCellEdit={handleCellEdit}
      />
    </div>
  );
};

export default AccountTable;
