/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import { useAttachmentList } from '../../../../../services/attachments/attachments-service';
import { AttachmentList } from '../../../../../types/attachment';
import { getResourceAttachmentColumns } from './column';
import { ListTable } from '../../../../../../components/table';
import { useParams } from 'react-router-dom';

interface ResourceSkillTableProps {
  fiscalYear?: number;
  appliedFilters?: Record<string, any>;
  resourceRid: string;
  order: 'ASC' | 'DESC';
  setOrder: (order: 'ASC' | 'DESC') => void;
  orderBy: string;
  setOrderBy: (field: keyof AttachmentList) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  refreshAttachments?: number;
  setCount?: (count: number) => void;
}
const ResourceAttachmentsTable: React.FC<ResourceSkillTableProps> = ({
  appliedFilters,
  resourceRid,
  currentPage,
  setCurrentPage,
  order,
  setOrder,
  orderBy,
  setOrderBy,
  refreshAttachments,
  setCount,
}) => {
  const { accountid } = useParams();
  const [rowsPerPage, setRowsPerPage] = useState<number>(100);
  const [attachmentList, setAttachmentList] = useState<AttachmentList[]>([]);

  const { data, isLoading, isError } = useAttachmentList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: orderBy,
      sortOrder: order,
      filters: appliedFilters,
      attachmentLevel: 'resource',
      accountRid: accountid,
      entityId: resourceRid || '',
    },
    refreshAttachments
  );

  useEffect(() => {
    if (setCount) {
      setCount(data?.count || 0);
    }
  }, [data, setCount]);

  useEffect(() => {
    if (data?.attachments) {
      setAttachmentList(data.attachments);
    }
  }, [data]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // handles page limit change
  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(0);
  };

  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    setOrder(apiOrder);
    setOrderBy(property as keyof AttachmentList);
  };

  const attachmentColumns = getResourceAttachmentColumns();
  const getRowId = (row: AttachmentList) => row.rid;

  return (
    <div>
      <ListTable
        data={attachmentList}
        columns={attachmentColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          borderBottom: '1px solid #CBD6E2',
          height: '100%',
          maxHeight: 'calc(100vh - 410px)',
          overflow: 'auto',
        }}
        stickyHeader={false}
        stickyColumnsCount={1}
        selectable={false}
        actionWidth={80}
        actionDisplayMode='dropdown'
        actionMenuItems={[]}
        loading={isLoading}
        error={isError ? 'Failed to load Attachment data' : undefined}
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        totalItems={0}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortBy={orderBy}
        sortOrder={order.toUpperCase() as 'ASC' | 'DESC'}
        onSort={handleSortRequest}
      />
    </div>
  );
};

export default ResourceAttachmentsTable;
