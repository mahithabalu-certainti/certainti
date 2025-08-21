import React, { useState, useEffect, useMemo } from 'react';
import SectionHeader from '../../../../../../components/details-section/section-header';
import { InteractionDetailIcon } from '../../../../../../assets';
import { ListTable } from '../../../../../../components/table';
import { getInteractionHistoryListColumns } from './columns';
import { InfoSection } from '../../../../../../components';
import { Box } from '@mui/material';
import {
  InteractionHistoryAction,
  transformInteractionHistoryData,
} from './utils';
import { useInteractionHistoryList } from '../../../../../services/interactions/interaction-history-service';
import { useSearchParams } from 'react-router-dom';
import { AttachmentsListExportParams } from '../../../../../types/attachment';

interface InteractionHistoryProps {
  accountInActive: boolean;
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
  const interactionHistoryId = searchParams.get('interaction_history_id') || '';
  const accountId = searchParams.get('accountID') || '';
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('status_name');
  const [sortBy, setSortBy] = useState<'ASC' | 'DESC'>('ASC');
  const [totalItems, setTotalItems] = useState<number>(0);

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
      account_rid: accountId || '',
      interaction_rid: interactionHistoryId,
    },
    refresh
  );

  const actionData = useMemo(
    () => interactionHistoryData?.data?.data?.interaction_history || [],
    [interactionHistoryData]
  );

  useEffect(() => {
    setTotalItems(actionData.length);
  }, [actionData]);

  useEffect(() => {
    const updatedParams = {
      sortBy: sortField,
      filters: appliedFilters,
      page: currentPage,
      sortOrder: sortBy,
      limit: rowsPerPage,
    };
    setInteractionsParams(updatedParams);
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

  return (
    <>
      <div className='border border-[#CBD6E2]'>
        <SectionHeader
          title='Interaction History'
          subValue={
            interactionHistoryData?.data?.data?.interaction_rnumber || ''
          }
          titleIcon={
            <InteractionDetailIcon
              alt='financial-header-icon'
              className={`w-7 h-7 p-1 bg-[#E25A32] rounded-[2px]`}
            />
          }
          className='rounded-tl-[2px] h-[40px] rounded-tr-[2px]'
          onBackClick={handleBackClick}
          showBackArrow={true}
          count={totalItems}
          showItemCount={true}
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
          <ListTable
            data={actionData}
            columns={interactionHistoryColumns}
            getRowId={getRowId}
            hoverHighlight={false}
            tableStyle={{
              height: '100%',
              maxHeight: 'calc(100vh - 290px)',
              overflow: 'auto',
            }}
            stickyHeader={true}
            stickyColumnsCount={1}
            selectable={false}
            actionWidth={80}
            loading={isLoading}
            loadindRowCount={2}
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
