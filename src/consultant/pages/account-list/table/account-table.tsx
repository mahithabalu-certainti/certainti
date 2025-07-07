/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { generatePath, useNavigate } from 'react-router-dom';
import { reshapeGlobalFilter } from '../../../../common-utils';
import { ListTable } from '../../../../components/table';
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
} from '../../../../components/table/types';
import { DeleteIcon, EditIcon } from '../../../../assets';
import { useMutation } from '@apollo/client';
import { UPDATE_INLINE_ACCOUNT_DETAILS } from '../../../../api/graphql/queries/account-query';

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
}) => {
  const navigate = useNavigate();
  const apiOrder = order.toUpperCase() as 'ASC' | 'DESC';
  const { filters, fiscalYear } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);

  const {
    data: accountList,
    isLoading: loading,
    isError,
  } = useAccounts(
    {
      page: page,
      limit: 1000,
      sortBy: orderBy,
      sortOrder: apiOrder,
      filters: appliedFilters,
      globalFilters: reshapeGlobalFilter(filters as FilterState),
      fiscalYear,
    },
    refreshAccountTrigger
  );
  const colorCodes = useFetchColorCodes();

  useEffect(() => {
    if (accountList) {
      setTotalCount(accountList.count || 0);
    }
  }, [accountList]);

  const colorCodesList = useMemo(() => {
    return (
      colorCodes.data?.data.colors.map((item) => ({
        color: '#000000',
        bgColor: item.color_code,
      })) || []
    );
  }, [colorCodes]);

  // const processedAccounts = useMemo(() => {
  //   if (!accountList?.accounts) return [];
  //   return processAccounts(accountList.accounts, colorCodesList);
  // }, [accountList, colorCodesList]);

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
  const handleEdit = (account: AccountList) => {
    navigate(ACCOUNT + '/edit/' + account.rid);
  };

  const handleDelete = (account: AccountList) => {
    console.log('Delete account', account.rid);
  };

  // Handle sorting
  const handleSortChange = (property: string, direction: 'asc' | 'desc') => {
    setOrderBy(property);
    setOrder(direction);
  };

  const accountColumns = getAccountColumns(
    handleAccountNameClick,
    countryOptions,
    industryOptions
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

  const [processedAccounts, setProcessedAccounts] = React.useState<
    AccountList[]
  >([]);

  // keep this effect to initialize it when accountList changes
  useEffect(() => {
    if (accountList?.accounts) {
      setProcessedAccounts(
        processAccounts(accountList.accounts, colorCodesList)
      );
    }
  }, [accountList, colorCodesList]);

  const [updateInlineAccountMutation] = useMutation(
    UPDATE_INLINE_ACCOUNT_DETAILS
  );

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousAccounts = [...processedAccounts];

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (acc, item) => {
        const key = item.editId || item.columnId;
        acc[key] = item.value;
        return acc;
      },
      {
        account_rid: rowId,
      }
    );

    // Optimistically update UI
    const updatedAccounts = processedAccounts.map((account) => {
      if (account.rid === rowId) {
        const updatedFields = updates.reduce<Record<string, FieldChangeValue>>(
          (acc, item) => {
            acc[item.columnId] = item.value;
            return acc;
          },
          {}
        );
        return {
          ...account,
          ...updatedFields,
        };
      }
      return account;
    });

    setProcessedAccounts(updatedAccounts);

    try {
      const res = await updateInlineAccountMutation({
        variables: {
          data: updateData,
        },
      });
      console.log('Update success', res.data);
    } catch (error) {
      console.error('Update failed', error);
      setProcessedAccounts(previousAccounts);
    }
  };

  return (
    <div className='border-t border-[#CBD6E2] h-full'>
      <ListTable
        data={processedAccounts || []}
        columns={accountColumns}
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
        expandAllChild={false}
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
