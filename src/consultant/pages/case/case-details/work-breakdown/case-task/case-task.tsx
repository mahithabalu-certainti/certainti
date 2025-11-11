import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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
} from '../../../../../../components/table/types';

interface CaseTaskProps {
  refresh?: number;
  searchValue?: string;
}

const CaseTask: React.FC<CaseTaskProps> = ({ refresh, searchValue }) => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [searchParams] = useSearchParams();
  const { accountid } = useParams();
  const caseId = searchParams.get('case_rid') || '';
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  const isModalOpen = Boolean(columnAnchorEl);
  // const handleColumnVisibility = (
  //   event: React.MouseEvent<HTMLButtonElement>
  // ) => {
  //   setColumnAnchorEl(event.currentTarget);
  // };

  const { data, isLoading, isError } = useGetCaseTaskList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      search: searchValue,
      account_rid: accountid,
      case_rid: caseId,
    },
    refresh
  );

  const getRowId = (row: CaseTaskType) => row.rid;
  const caseTaskColumns = getCaseTaskListColumns();

  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
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
          rowsPerPageOptions={[25, 50, 100]}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          totalItems={data?.data.totalRecords || 0}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </div>
    </>
  );
};

export default CaseTask;
