import { useEffect, useMemo, useState } from 'react';
import { mockInteractionHistory, mockPermissionMap } from './mock-response';
import {
  InteractionHistoryList,
  transformInteractionHistoryData,
} from './utils';
import { getInteractionHistoryListColumns } from './columns';
import SectionHeader from '../../../../components/details-section/section-header';
import { InteractionDetailIcon } from '../../../../assets';
import { InfoSection } from '../../../../components';
import { Box } from '@mui/material';
import { ListTable } from '../../../../components/table';

interface InteractionHistoryProps {
  accountInActive: boolean;
  handleBackClick: () => void;
}

const InteractionHistory: React.FC<InteractionHistoryProps> = ({
  handleBackClick,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('action');
  const [sortBy, setSortBy] = useState<'ASC' | 'DESC'>('ASC');
  const [totalItems, setTotalItems] = useState<number>(0);

  const actionData = useMemo(
    () => mockInteractionHistory?.data?.interactionHistoryDetails?.action || [],
    [mockInteractionHistory]
  );

  useEffect(() => {
    setTotalItems(actionData.length);
  }, [actionData]);

  const tableData: InteractionHistoryList[] = actionData.map((action) => ({
    rid: action.id.toString(),
    interaction_type: action.interaction_type,
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

  const transformedInteractionHistoryColumns = transformInteractionHistoryData(
    mockInteractionHistory,
    mockPermissionMap
  );

  return (
    <>
      <div className='border border-[#CBD6E2]'>
        <SectionHeader
          title='Interaction'
          //   subValue={data?.r_number || ''}
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
        <Box className='max-w-[100%] border-t border border-b-0 border-[#CBD6E2] rounded-bl-[2px] rounded-br-[2px] bg-white'>
          <InfoSection
            columns={transformedInteractionHistoryColumns}
            loading={false}
            singleLineView={false}
            className='!border-b-0'
          />
        </Box>
        <div className='p-1'></div>
        <div className='border border-[#CBD6E2]'>
          <ListTable
            data={tableData}
            columns={interactionHistoryColumns}
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
            loading={false}
            error={undefined}
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
