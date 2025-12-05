import React, { useState, useEffect, useMemo } from 'react';
import SectionHeader from '../../../../../../components/details-section/section-header';
import { InteractionDetailIcon } from '../../../../../../assets';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../../components/table';
import { getInteractionHistoryListColumns } from './columns';
import { InfoSection } from '../../../../../../components';
import { Box } from '@mui/material';
import {
  InteractionHistoryAction,
  InteractionHistoryList,
  transformInteractionHistoryData,
} from './utils';

import { useInteractionHistoryList } from '../../../../../services/interactions/interaction-history-service';
import { useParams, useSearchParams } from 'react-router-dom';
import { AttachmentsListExportParams } from '../../../../../types/attachment';
import {
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../../components/table/types';
import { BUTTON_STYLES } from '../../../../../../admin/pages/manage-user-detail/styles';
interface InteractionHistoryProps {
  handleBackClick: () => void;
  refresh?: number;
  appliedFilters: Record<string, string | number | boolean | string[]>;
  setInteractionsParams: React.Dispatch<
    React.SetStateAction<AttachmentsListExportParams>
  >;
}

const InteractionHistory: React.FC<InteractionHistoryProps> = ({
  handleBackClick,
  refresh,
  appliedFilters,
  setInteractionsParams,
}) => {
  const [searchParams] = useSearchParams();
  const { accountid } = useParams();
  const interactionHistoryId = searchParams.get('interaction_history_id') || '';
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('date');
  const [sortBy, setSortBy] = useState<'ASC' | 'DESC'>('ASC');
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  const isModalOpen = Boolean(columnAnchorEl);
  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const {
    data: interactionHistoryData,
    isLoading,
    isError,
  } = useInteractionHistoryList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sort: sortField,
      sort_by: sortBy.toLowerCase() as 'asc' | 'desc',
      filters: appliedFilters,
      account_rid: accountid || '',
      interaction_rid: interactionHistoryId,
    },
    refresh
  );

  const totalItems = interactionHistoryData?.data?.total_records || 0;

  const actionData = useMemo(
    () => interactionHistoryData?.data?.data?.interaction_history || [],
    [interactionHistoryData]
  );

  useEffect(() => {
    const updatedParams = {
      sortBy: sortField,
      filters: appliedFilters,
      page: currentPage,
      sortOrder: sortBy,
      limit: rowsPerPage,
    };
    setInteractionsParams(updatedParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, appliedFilters, currentPage, rowsPerPage, sortBy]);

  const getRowId = (row: InteractionHistoryAction) => row.rid;
  const interactionHistoryColumns = getInteractionHistoryListColumns();

  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    setSortBy(apiOrder);
    setSortField(property);
  };

  const transformedInteractionHistoryColumns = useMemo(
    () =>
      interactionHistoryData?.data
        ? transformInteractionHistoryData(interactionHistoryData.data)
        : [],
    [interactionHistoryData]
  );

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

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<InteractionHistoryList>[]
  >(interactionHistoryColumns.filter((col) => !col.hide));

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter(
        (col) => !col.hide
      ) as ListTableColumn<InteractionHistoryList>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const modalId = isModalOpen
    ? 'account-attachment-list-column-visibility-popover'
    : undefined;

  return (
    <>
      <div className='border border-[#CBD6E2]'>
        <SectionHeader
          title='Interaction History'
          titleIcon={
            <InteractionDetailIcon
              alt='financial-header-icon'
              className={`w-7 h-7 p-1 bg-[#E25A32] rounded-[2px]`}
            />
          }
          className='rounded-tl-[2px] h-[40px] rounded-tr-[2px]'
          count={totalItems}
          showItemCount={true}
          buttons={headerButtons}
        />
        <Box className='border-t border-b-0 border-[#CBD6E2] rounded-bl-[2px] rounded-br-[2px] bg-white'>
          <InfoSection
            columns={transformedInteractionHistoryColumns}
            loading={isLoading}
            singleLineView={true}
            className='!border-b-0'
          />
        </Box>
        <div className='border-t border-[#CBD6E2]'>
          <ManageColumnsPopover
            anchorEl={columnAnchorEl}
            open={isModalOpen}
            popoverId={modalId}
            onClose={handlePopoverClose}
            columns={interactionHistoryColumns}
            onColumnsChange={handleColumnsChange}
          />
          <ListTable
            data={actionData}
            columns={visibleColumns}
            getRowId={getRowId}
            hoverHighlight={false}
            tableStyle={{
              height: '100%',
              maxHeight: 'calc(100vh - 360px)',
              overflow: 'auto',
            }}
            stickyHeader={true}
            stickyColumnsCount={1}
            selectable={false}
            actionWidth={80}
            loading={isLoading}
            loadingRowCount={2}
            error={isError ? 'Failed to load data' : undefined}
            rowsPerPageOptions={[25, 50, 100]}
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            sortBy={sortField}
            sortOrder={sortBy}
            onSort={handleSortRequest}
          />
        </div>
      </div>
    </>
  );
};

export default InteractionHistory;
