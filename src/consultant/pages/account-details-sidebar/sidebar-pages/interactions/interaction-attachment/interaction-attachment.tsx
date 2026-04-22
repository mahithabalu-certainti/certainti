import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { InteractionAttachmentType } from '../../../../../types';
import { useGetInteractionAttachmentList } from '../../../../../services/interactions/interaction-attachment-service';
import { getInteractionAttachmentListColumns } from './columns';
import SectionHeader from '../../../../../../components/details-section/section-header';
import { InteractionDetailIcon } from '../../../../../../assets';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../../components/table';
import { BUTTON_STYLES } from '../../../../../../admin/pages/manage-user-detail/styles';
import {
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../../components/table/types';

interface InteractionAttachmentProps {
  handleBackClick: () => void;
  refresh?: number;
  searchValue?: string;
}

const InteractionAttachment: React.FC<InteractionAttachmentProps> = ({
  handleBackClick,
  refresh,
  searchValue,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [searchParams] = useSearchParams();
  const { accountid } = useParams();
  const interactionId = searchParams.get('interaction_rid') || '';
  const interactionNumber = searchParams.get('interaction_number') || '';
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  const isModalOpen = Boolean(columnAnchorEl);
  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const { data, isLoading, isError } = useGetInteractionAttachmentList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      search: searchValue,
      account_rid: accountid,
      interaction_rid: interactionId || '',
    },
    refresh
  );

  const handleDownload = (documentUrl: string) => {
    if (!documentUrl) return;

    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRowId = (row: InteractionAttachmentType) => row.rid;
  const interactionAttachmentColumns =
    getInteractionAttachmentListColumns(handleDownload);

  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const headerButtons = [
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { ...BUTTON_STYLES, width: '125px', minWidth: '125px' },
      hide: false,
    },
    {
      label: 'Back To Interactions',
      variant: 'contained' as const,
      onClick: () => handleBackClick(),
      sx: { width: '140px', minWidth: '140px' },
    },
  ];

  const RestrictedColumns = [
    {
      id: 'question_rnumber',
      canHide: false,
      canDrag: false,
    },
  ];

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<InteractionAttachmentType>[]
  >(interactionAttachmentColumns.filter((col) => !col.hide));

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<InteractionAttachmentType>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const modalId = isModalOpen
    ? 'account-interaction-attachment-list-column-visibility-popover'
    : undefined;

  return (
    <>
      <div className='border border-[#CBD6E2]'>
        <SectionHeader
          title='Interaction Attachment'
          subValue={interactionNumber || ''}
          titleIcon={
            <InteractionDetailIcon
              alt='financial-header-icon'
              className={`w-7 h-7 p-1 bg-[#E25A32] rounded-[2px]`}
            />
          }
          className='rounded-tl-[2px] h-[40px] rounded-tr-[2px]'
          count={data?.data.totalRecords || 0}
          showItemCount={true}
          buttons={headerButtons}
        />
        <div className='border-t border-[#CBD6E2]'>
          <ManageColumnsPopover
            anchorEl={columnAnchorEl}
            open={isModalOpen}
            popoverId={modalId}
            onClose={handlePopoverClose}
            columns={interactionAttachmentColumns}
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
            loadingRowCount={4}
            error={isError ? 'Failed to load data' : undefined}
            rowsPerPageOptions={[25, 50, 100]}
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            totalItems={data?.data.totalRecords || 0}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </div>
      </div>
    </>
  );
};

export default InteractionAttachment;
