/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ListTable, ManageColumnsPopover } from '../../../../components/table';
import { ProjectListParams } from '../../../../consultant/types/project';
import { manageAccountListColumns } from './column';
import { Suspense, useState } from 'react';
import { AccountList } from '../../../../consultant/types';
import { useAccounts } from '../../../../consultant/services/account';
import { FilterType } from '../../../types';
import { clearFilters } from '../../../../components/filter-component/utils';
import {
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../components/table/types';

interface AcoountTableProps {
  appliedFilters: Record<string, FilterType>;
  tableParams: ProjectListParams;
  setTableParams: React.Dispatch<React.SetStateAction<ProjectListParams>>;
  setAppliedFilters: React.Dispatch<
    React.SetStateAction<Record<string, FilterType>>
  >;
  disabled?: boolean;
  hide?: boolean;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue?: string;
  onSearchReset?: () => void;
}
export const ManageAccountTable: React.FC<AcoountTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  setAppliedFilters,
  columnAnchorEl,
  setColumnAnchorEl,
  searchValue,
  onSearchReset,
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
    clearFilters();
    onSearchReset?.();
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
      search: searchValue,
    }
    // refreshAccountTrigger
  );
  const totalCount = data?.count || 0;
  const projectColumns = manageAccountListColumns(handleAccountName);

  const RestrictedColumns = [
    {
      id: 'account_name',
      canHide: false,
      canDrag: false,
    },
  ];

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<AccountList>[]
  >(projectColumns.filter((col) => !col.hide));

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<AccountList>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'interaction-column-visibility-popover'
    : undefined;
  return (
    <div>
      <Suspense fallback={null}>
        <ManageColumnsPopover
          anchorEl={columnAnchorEl}
          open={isModalOpen}
          popoverId={modalId}
          onClose={handlePopoverClose}
          columns={projectColumns}
          onColumnsChange={handleColumnsChange}
          columnRestrictions={RestrictedColumns}
        />
        <ListTable
          data={data?.accounts || []}
          columns={visibleColumns}
          getRowId={getRowId}
          hoverHighlight={false}
          tableStyle={{
            height: '100%',
            maxHeight: 'calc(100vh - 180px)',
            overflow: 'auto',
          }}
          stickyHeader={true}
          stickyColumnsCount={1}
          selectable={false}
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
