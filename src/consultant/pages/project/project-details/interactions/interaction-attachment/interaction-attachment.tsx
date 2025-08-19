import { useEffect, useState } from 'react';
import { getInteractionAttachmentListColumns } from './columns';
import SectionHeader from '../../../../../../components/details-section/section-header';
import { InteractionDetailIcon } from '../../../../../../assets';
import { ListTable } from '../../../../../../components/table';
import { useGetInteractionAttachmentList } from '../../../../../services/interactions/interaction-attachment-service';
import {
  InteractionAttachmentListParams,
  InteractionAttachmentType,
} from '../../../../../types';

interface InteractionAttachmentProps {
  handleBackClick: () => void;
  refresh?: number;
}

const InteractionAttachment: React.FC<InteractionAttachmentProps> = ({
  handleBackClick,
  refresh,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [tableParams, setTableParams] =
    useState<InteractionAttachmentListParams>({
      page: currentPage,
      limit: rowsPerPage,
    });

  const { data, isLoading, isError } = useGetInteractionAttachmentList(
    tableParams,
    refresh
  );

  const getRowId = (row: InteractionAttachmentType) => row.rid;
  const interactionAttachmentColumns = getInteractionAttachmentListColumns();

  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(1);
    setTableParams({ ...tableParams, limit: newPageSize, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setTableParams({ ...tableParams, page: newPage });
  };

  useEffect(() => {
    setTableParams({ page: currentPage, limit: rowsPerPage });
  }, [currentPage, rowsPerPage]);

  return (
    <>
      <div className='border border-[#CBD6E2]'>
        <SectionHeader
          title='Interaction Attachment'
          titleIcon={
            <InteractionDetailIcon
              alt='financial-header-icon'
              className={`w-7 h-7 p-1 bg-[#E25A32] rounded-[2px]`}
            />
          }
          className='rounded-tl-[2px] h-[40px] rounded-tr-[2px]'
          onBackClick={handleBackClick}
          showBackArrow={true}
          count={data?.data.total_records || 0}
          showItemCount={true}
        />
        <div className='border border-[#CBD6E2]'>
          <ListTable
            data={data?.data.attachments || []}
            columns={interactionAttachmentColumns}
            getRowId={getRowId}
            hoverHighlight={false}
            tableStyle={{
              borderBottom: '1px solid #CBD6E2',
              height: '100%',
              maxHeight: 'calc(100vh - 290px)',
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
            totalItems={data?.data.total_records || 0}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </div>
      </div>
    </>
  );
};

export default InteractionAttachment;
