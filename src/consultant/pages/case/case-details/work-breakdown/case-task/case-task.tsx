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
} from '../../../../../../components/table/types';
import {
  ConfigAssignGroupsListParms,
  ConfigAssignUserListParms,
} from '../../../../../types';
// import { useToast } from '../../../../../../hooks';

interface CaseTaskProps {
  reFetchData: number;
  // setCount: (value: number) => void;
  filterParams: ConfigAssignGroupsListParms | ConfigAssignUserListParms;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue?: string;
}

const CaseTask: React.FC<CaseTaskProps> = ({
  reFetchData,
  // setCount,
  filterParams,
  columnAnchorEl,
  setColumnAnchorEl,
  searchValue,
}) => {
  // const { accountid } = useParams();
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get('case_rid') || '';
  // const { successToast, errorToast } = useToast();
  const [tableParams, setTableParams] = useState({
    sortBy: 'first_name',
    sortOrder: 'ASC',
    // entity_type: 'ACCOUNT',
    page: filterParams.page + 1,
    limit: 100,
    search: searchValue,
    filters: filterParams.filters,
    case_rid: caseId,
  });

  const { data, isLoading, isError } = useGetCaseTaskList(
    // accountid || '',
    tableParams,
    reFetchData
  );

  useEffect(() => {
    setTableParams((prev) => ({
      ...prev,
      page: 1,
      filters: filterParams.filters,
      search: searchValue,
    }));
  }, [filterParams.filters, searchValue]);

  const getRowId = (row: CaseTaskType) => row.rid;
  const caseTaskColumns = getCaseTaskListColumns();

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
          rowsPerPageOptions={[25, 50, 100]}
          rowsPerPage={tableParams.limit}
          currentPage={(tableParams.page ?? 1) - 1}
          totalItems={data?.data.totalRecords || 0}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </div>
    </>
  );
};

export default CaseTask;
