/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ListTable } from '../../../../components/table';
import { ProjectListParams } from '../../../../consultant/types/project';
import { manageAccountListColumns } from './column';
import { Suspense } from 'react';
import { AccountList } from '../../../../consultant/types';
import { useAccounts } from '../../../../consultant/services/account';
import { FilterType } from '../../../types';

interface AcoountTableProps {
  appliedFilters: Record<string, FilterType>;
  tableParams: ProjectListParams;
  setTableParams: React.Dispatch<React.SetStateAction<ProjectListParams>>;
  setAppliedFilters: React.Dispatch<
    React.SetStateAction<Record<string, FilterType>>
  >;
  disabled?: boolean;
  hide?: boolean;
}
export const ManageAccountTable: React.FC<AcoountTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  setAppliedFilters,
}) => {
  const navigate = useNavigate();
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
  const getRowId = (row: AccountList) => row.rid;
  const [searchParams] = useSearchParams();
  const handleAccountName = (account: AccountList) => {
    searchParams.set('accountid', account.rid || '');
    searchParams.set('accountname', account.account_name || '');
    searchParams.set('tabIndex', '0');
    navigate({ search: searchParams.toString() }, { replace: true });
    setAppliedFilters({});
  };
  const {
    data,
    isLoading: loading,
    isError,
  } = useAccounts(
    {
      page: tableParams.page,
      limit: tableParams.limit,
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
    }
    // refreshAccountTrigger
  );
  const totalCount = data?.count || 0;
  const projectColumns = manageAccountListColumns(handleAccountName);
  return (
    <div>
      <Suspense fallback={null}>
        <ListTable
          data={data?.accounts || []}
          columns={projectColumns}
          getRowId={getRowId}
          hoverHighlight={false}
          tableStyle={{
            height: '100%',
            maxHeight: 'calc(100vh - 180px)',
            overflow: 'auto',
          }}
          stickyHeader={true}
          stickyColumnsCount={10}
          selectable={true}
          expandAllParent={false}
          expandable={true}
          childrenKey='child_accounts'
          maxNestingLevel={2}
          onSelectionChange={(selectedIds) =>
            console.log('Selected:', selectedIds)
          }
          actionWidth={60}
          actionDisplayMode='icon'
          // actionMenuItems={actionButtons}
          loading={loading}
          error={isError ? 'Failed to load Accounts' : undefined}
          rowsPerPageOptions={[25, 50, 100]}
          rowsPerPage={tableParams.limit}
          currentPage={(tableParams.page ?? 1) - 1}
          totalItems={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          sortBy={tableParams.sortBy}
          sortOrder={tableParams.sortOrder}
          onSort={handleSort}
          component='Manage-Account-Access'
        />
      </Suspense>
    </div>
  );
};
