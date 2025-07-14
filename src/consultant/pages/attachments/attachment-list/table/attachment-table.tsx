import { useSelector } from 'react-redux';
import {
  AttachmentList,
  AttachmentsListURLParams,
} from '../../../../types/attachment';
import { RootState } from '../../../../../store/store';
import { useEffect, useState } from 'react';
import { useAllAttachmentList } from '../../../../services/attachments/attachments-service';
import { getAllAttachmentColumns } from './columns';
import { CellEditData } from '../../../../../components/table/types';
import { ListTable } from '../../../../../components/table';
import { reshapeGlobalFilter } from '../../../../../common-utils';
import { FilterState } from '../../../../types';

interface IAttachmentTableProps {
  appliedFilters: Record<string, string | number | boolean>;
  tableParams: AttachmentsListURLParams;
  setTableParams: React.Dispatch<
    React.SetStateAction<AttachmentsListURLParams>
  >;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  refreshTrigger?: number;
}

export const AttachmentTable: React.FC<IAttachmentTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  setTotalCount,
  refreshTrigger,
}) => {
  const { fiscalYear, filters } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);
  const [attachmentList, setAttachmentList] = useState<AttachmentList[]>([]);

  useEffect(() => {
    const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

    if (
      tableParams.fiscalYear === newFiscalYear &&
      JSON.stringify(tableParams.filters) === JSON.stringify(appliedFilters)
    ) {
      return;
    }

    setTableParams((prev) => ({
      ...prev,
      page: 1,
      filters: appliedFilters,
      fiscalYear: newFiscalYear,
      globalFilters: reshapeGlobalFilter(filters as FilterState),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, fiscalYear, filters]);

  const { data, isLoading, isError } = useAllAttachmentList(
    tableParams,
    refreshTrigger
  );
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setTotalCount(data?.count || 0);
      setAttachmentList(data.attachments || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

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

  const getRowId = (row: AttachmentList) => row.rid;

  const attachmentsColumns = getAllAttachmentColumns();

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    console.log(rowId, updates);
  };

  return (
    <ListTable
      data={attachmentList || []}
      columns={attachmentsColumns}
      getRowId={getRowId}
      hoverHighlight={false}
      tableStyle={{
        height: '100%',
        maxHeight: 'calc(100vh - 180px)',
        overflow: 'auto',
      }}
      stickyHeader={true}
      stickyColumnsCount={2}
      selectable={true}
      onSelectionChange={(selectedIds) => console.log('Selected:', selectedIds)}
      actionWidth={60}
      actionDisplayMode='dropdown'
      actionMenuItems={[]}
      loading={isLoading}
      error={isError ? 'Failed to load Attachment data' : undefined}
      rowsPerPageOptions={[25, 50, 100]}
      rowsPerPage={tableParams.limit}
      currentPage={(tableParams.page ?? 1) - 1}
      totalItems={totalItems}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      sortBy={tableParams.sortBy}
      sortOrder={tableParams.sortOrder}
      onSort={handleSort}
      onCellEdit={handleCellEdit}
    />
  );
};
