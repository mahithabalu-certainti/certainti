import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CaseTaskType,
  useGetCaseTaskList,
} from '../../../../../services/case-task/case-task-service';
import { getCaseTaskListColumns } from './columns';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../../components/table';
import {
  ListTableColumn,
  ShowHideTableColumn,
  SortOrder,
} from '../../../../../../components/table/types';
import {
  ConfigAssignGroupsListParms,
  ConfigAssignUserListParms,
} from '../../../../../types';
import { useToast } from '../../../../../../hooks';

interface CaseTaskProps {
  reFetchData: number;
  caseId?: string;
  setCount: (value: number) => void;
  filterParams: ConfigAssignGroupsListParms | ConfigAssignUserListParms;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue?: string;
}

const CaseTask: React.FC<CaseTaskProps> = ({
  reFetchData,
  caseId,
  setCount,
  filterParams,
  columnAnchorEl,
  setColumnAnchorEl,
  searchValue,
}) => {
  const [searchParams] = useSearchParams();
  const accountID = searchParams.get('accountID') || '';

  const { errorToast } = useToast();
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
  });

  const [sorting, setSorting] = useState({
    sort: 'task_name',
    sort_by: 'DESC' as 'ASC' | 'DESC',
  });

  const tableParams = {
    case_rid: caseId || '',
    account_rid: accountID,
    page: pagination.page,
    limit: pagination.limit,
    search: searchValue || '',
    sort: sorting.sort,
    sort_by: sorting.sort_by,
    filter: filterParams.filters as { [key: string]: unknown } | undefined,
  };

  const { data, isLoading, isError, error } = useGetCaseTaskList(
    tableParams,
    reFetchData
  );

  useEffect(() => {
    if (isError) {
      errorToast((error as Error)?.message || 'Failed to load case tasks.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError, error]);

  useEffect(() => {
    if (data) {
      setCount(data?.data?.total_result || 0);
    }
  }, [data, setCount]);
  const getRowId = (row: CaseTaskType) => row.rid;
  const caseTaskColumns = getCaseTaskListColumns();

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage + 1,
    }));
  };

  const handleRowsPerPageChange = (newLimit: number) => {
    setPagination({
      limit: newLimit,
      page: 1,
    });
  };

  const handleSort = (field: string, order: SortOrder) => {
    const apiSortOrder = order.toUpperCase() as 'ASC' | 'DESC';
    setSorting({
      sort: field,
      sort_by: apiSortOrder,
    });
  };

  const RestrictedColumns = [
    {
      id: 'task_name',
      canHide: false,
      canDrag: false,
    },
  ];

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<CaseTaskType>[]
  >(caseTaskColumns.filter((col) => !col.hide));

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<CaseTaskType>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };
  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'case-task-list-column-visibility-popover'
    : undefined;

  return (
    <>
      <div className='border-t border-[#CBD6E2]'>
        <ManageColumnsPopover
          anchorEl={columnAnchorEl}
          open={isModalOpen}
          popoverId={modalId}
          onClose={handlePopoverClose}
          columns={caseTaskColumns}
          onColumnsChange={handleColumnsChange}
          columnRestrictions={RestrictedColumns}
        />
        <ListTable
          data={data?.data.data || []}
          columns={visibleColumns}
          getRowId={getRowId}
          hoverHighlight={false}
          tableStyle={{
            height: '100%',
            maxHeight: 'calc(100vh - 330px)',
            overflow: 'auto',
          }}
          stickyHeader={true}
          stickyColumnsCount={1}
          selectable={false}
          actionWidth={80}
          loading={isLoading}
          loadindRowCount={4}
          error={isError ? 'Failed to load data' : undefined}
          rowsPerPageOptions={[5, 25, 50, 100]}
          rowsPerPage={tableParams.limit}
          currentPage={(tableParams.page ?? 1) - 1}
          totalItems={data?.data.total_result || 0}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          sortBy={tableParams.sort}
          sortOrder={tableParams.sort_by}
          onSort={handleSort}
        />
      </div>
    </>
  );
};

export default CaseTask;
