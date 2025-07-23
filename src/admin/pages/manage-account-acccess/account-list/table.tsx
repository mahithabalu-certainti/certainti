/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ManageGroup } from '../../../../assets';
import { ListTable } from '../../../../components/table';
import { ActionItem } from '../../../../components/table/types';
import { ProjectListParams } from '../../../../consultant/types/project';
import { manageAccountListColumns } from './column';
import { Suspense, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAccountsThunk } from '../../../../store/slices';
import { RootState } from '../../../../store/store';
import { ManageAccountList } from '../../../types/manage-account';
import { AccountList } from '../../../../consultant/types';

interface AcoountTableProps {
  tableParams: ProjectListParams;
  setTableParams: React.Dispatch<React.SetStateAction<ProjectListParams>>;
}
export const ManageAccountTable: React.FC<AcoountTableProps> = ({
  tableParams,
  setTableParams,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const actionButtons: ActionItem<AccountList>[] = [
    {
      label: 'Edit',
      onClick: () => () => console.log('Edit row'),
      icon: ManageGroup,
      iconStyle: {
        height: '15px',
        width: '24px',
      },
      hide: false,
    },
  ];
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
  const getRowId = (row: ManageAccountList) => {
    return row.rid || '';
  };
  const [searchParams] = useSearchParams();
  const handleAccountName = (account: ManageAccountList) => {
    searchParams.set('userid', account.rid || '');
    navigate({ search: searchParams.toString() }, { replace: true });
  };
  const { accounts, loading, error, count } = useSelector(
    (state: RootState) => state.account
  );

  useEffect(() => {
    dispatch(fetchAccountsThunk() as any);
  }, []);
  const projectColumns = manageAccountListColumns(handleAccountName);
  return (
    <div>
      <Suspense fallback={null}>
        <ListTable
          data={accounts || []}
          columns={projectColumns}
          getRowId={getRowId}
          hoverHighlight={false}
          tableStyle={{
            height: '100%',
            maxHeight: 'calc(100vh - 180px)',
            overflow: 'auto',
          }}
          stickyHeader={true}
          stickyColumnsCount={count}
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
          actionMenuItems={actionButtons}
          loading={loading}
          error={error ? 'Failed to load Accounts' : undefined}
          rowsPerPageOptions={[25, 50, 100]}
          rowsPerPage={tableParams.limit}
          currentPage={(tableParams.page ?? 1) - 1}
          totalItems={10}
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
