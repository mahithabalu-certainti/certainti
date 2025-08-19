import React, { useState, useEffect, useMemo } from 'react';
import SectionHeader from '../../../../../../components/details-section/section-header';
import { InteractionDetailIcon } from '../../../../../../assets';
import { ListTable } from '../../../../../../components/table';
import { getInteractionHistoryListColumns } from './columns';
import { NewProjectData } from '../../../../../types/project';
import { InfoSection } from '../../../../../../components';
import { Box } from '@mui/material';
import {
  transformInteractionHistoryData,
  InteractionHistoryList,
} from './utils';
import { mockPermissionMap } from './mock-response';
import { useInteractionHistoryList } from '../../../../../services/interactions/interaction-history-service';
import { useSearchParams } from 'react-router-dom';

interface InteractionHistoryProps {
  accountInActive: boolean;
  handleBackClick: () => void;
  projectDetails: NewProjectData | null;
}

const InteractionHistory: React.FC<InteractionHistoryProps> = ({
  handleBackClick,
}) => {
  const [searchParams] = useSearchParams();
  const interactionHistoryId = searchParams.get('interaction_history_id') || '';
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('action');
  const [sortBy, setSortBy] = useState<'ASC' | 'DESC'>('ASC');
  const [totalItems, setTotalItems] = useState<number>(0);

  const {
    data: interactionHistoryData,
    isLoading,
    isError,
  } = useInteractionHistoryList(interactionHistoryId, !!interactionHistoryId);

  const actionData = useMemo(
    () => interactionHistoryData?.data?.interaction_history || [],
    [interactionHistoryData]
  );

  useEffect(() => {
    setTotalItems(actionData.length);
  }, [actionData]);

  const tableData: InteractionHistoryList[] = actionData.map((action) => ({
    rid: action.rid,
    action: action.action,
    date: action.date,
  }));

  const getRowId = (row: InteractionHistoryList) => row.rid;
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
      interactionHistoryData
        ? transformInteractionHistoryData(
            interactionHistoryData,
            mockPermissionMap
          )
        : [],
    [interactionHistoryData]
  );

  return (
    <>
      <div className='border border-[#CBD6E2]'>
        <SectionHeader
          title='Interaction History'
          subValue={interactionHistoryData?.data?.interaction_rnumber || ''}
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
            data={tableData}
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
            loadindRowCount={4}
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
