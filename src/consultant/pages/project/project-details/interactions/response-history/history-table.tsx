import React, { useEffect, useState } from 'react';
import { getInteractionListColumns } from './columns';
import { responseInteractionList } from '../../../../../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ListTable } from '../../../../../../components/table';
import { mockResponse } from './mockresponse';
import { useInteractionDetails } from '../../../../../services/interactions/interactions-service';
import {
  InfoSection,
  InteractionQuestions,
} from '../../../../../../components';
import { DisplayColumn, transformInteractionData } from './ultils';

interface HistoryTableProps {
  loading?: boolean;
  isError?: boolean;
}

const HistoryTable: React.FC<HistoryTableProps> = ({ isError }) => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('r_number');
  const [sortBy, setSortBy] = useState<'ASC' | 'DESC'>('ASC');
  const [accountDetails, setAccountDetails] = useState<DisplayColumn[]>([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const accountId = searchParams.get('accountID') || '';
  const interactionId = searchParams.get('interaction_id') || undefined;
  const interactionResponseId =
    searchParams.get('interactionResponse_id') || undefined;
  const { data } = useInteractionDetails(accountId, interactionId);
  useEffect(() => {
    if (mockResponse?.data?.response_history) {
      setAccountDetails(
        transformInteractionData(mockResponse?.data?.response_history)
      );
    }
  }, [data]);
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };
  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(1);
  };
  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    setSortBy(apiOrder);
    setSortField(property);
  };
  const handleViewInteraction = (rowId: string) => {
    if (rowId) {
      searchParams.set('interactionResponse_id', rowId);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };
  const handleSelectionChange = (selectedIds: string[]) => {
    console.log(selectedIds);
  };
  const getRowId = (row: responseInteractionList) => row.rid;
  const interactionColumns = getInteractionListColumns(handleViewInteraction);
  return (
    <div className='border border-[#CBD6E2]'>
      {interactionResponseId ? (
        <>
          <InfoSection
            columns={accountDetails}
            loading={false}
            error={isError}
            singleLineView={true}
          />
          {data?.questions && data?.questions.length > 0 && (
            <InteractionQuestions
              questions={data?.questions}
              globalAttachments={data?.global_attachments}
              isEditEnable={false}
              // handleResponseHistory={handleResponseHistory}
            />
          )}
        </>
      ) : (
        <ListTable
          data={mockResponse?.data?.response_history || []}
          columns={interactionColumns}
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
          selectable={true}
          onSelectionChange={handleSelectionChange}
          actionWidth={80}
          actionDisplayMode='dropdown'
          actionMenuItems={[]}
          loading={false}
          error={isError ? 'error occurs' : undefined}
          rowsPerPageOptions={[25, 50, 100]}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          totalItems={10}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          sortBy={sortField}
          sortOrder={sortBy}
          onSort={handleSortRequest}
        />
      )}
    </div>
  );
};

export default HistoryTable;
