/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../../store/store';
import { AccountList } from '../../../../../../../consultant/types';
import { useAccounts } from '../../../../../../../consultant/services/account';
import { AllPermissions } from '../../../../../../../common-service';
import { getAccountColumns } from './columns';
import { ListTable } from '../../../../../../../components/table';

const AccountTable: React.FC<Record<string, any>> = ({
  appliedFilters,
  setTotalCount,
  order,
  setOrder,
  orderBy,
  setOrderBy,
  setPage,
  page,
  refreshAccountTrigger,
  expandChild,
  searchValue,
  onSelectionChange,
}) => {
  const apiOrder = order.toUpperCase() as 'ASC' | 'DESC';
  const [limit, setLimit] = useState<number>(100);
  const [accountsList, setAccountsList] = React.useState<AccountList[]>([]);

  const {
    data,
    isLoading: loading,
    isError,
  } = useAccounts(
    {
      page: page,
      limit: limit,
      sortBy: orderBy,
      sortOrder: apiOrder,
      filters: appliedFilters,
      search: searchValue,
    },
    refreshAccountTrigger
  );

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

  const totalItems = data?.count;

  useEffect(() => {
    if (data) {
      setTotalCount(data?.totalResult || 0);
      setAccountsList(data.accounts || []);
    }
  }, [data]);

  // Handle sorting
  const handleSortChange = (property: string, direction: 'asc' | 'desc') => {
    setOrderBy(property);
    setOrder(direction);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage + 1);
  };

  const handleRowsPerPageChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const accountColumns = getAccountColumns(permissionMap);

  const isSkeletonLoading = loading;

  const getRowId = (row: AccountList) => row.rid;

  const handleSelectionChange = (selectedIds: string[]) => {
    // Filter to get only child account IDs
    // Child IDs are from child_accounts array, excluding parent and grandchild (projects_by_fiscal_year) IDs
    const childIds = selectedIds.filter((id) => {
      // Check if this ID exists in any child_accounts array
      return accountsList.some((account) =>
        account.child_accounts?.some((child) => child.rid === id)
      );
    });
    
    onSelectionChange?.(childIds);
  };

  return (
    <div>
      <ListTable
        data={accountsList || []}
        columns={accountColumns}
        getRowId={getRowId}
        // component={'account'}
        // hoverHighlight={true}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 400px)',
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
        // Selection
        selectable={true}
        onSelectionChange={handleSelectionChange}
        // Pagination
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={limit}
        currentPage={(page ?? 1) - 1}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        // Actions
        actionWidth={60}
        actionDisplayMode='dropdown'
        actionMenuItems={[]}
        // State
        loading={isSkeletonLoading}
        error={isError ? 'Failed to load data' : undefined}
        // Sorting
        sortBy={orderBy}
        sortOrder={order}
        onSort={handleSortChange}
      />
    </div>
  );
};

export default AccountTable;
