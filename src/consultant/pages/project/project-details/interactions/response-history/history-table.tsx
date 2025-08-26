/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { getInteractionListColumns } from './columns';
import {
  InteractionHistoryResponse,
  ResponseInteractionList,
} from '../../../../../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ListTable } from '../../../../../../components/table';
import {
  InfoSection,
  InteractionQuestions,
} from '../../../../../../components';
import { DisplayColumn, transformInteractionData } from './ultils';
import {
  useInteractionResponseHistoryList,
  useResponseInteractionDetails,
} from '../../../../../services/interactions/response-interaction-service';
import DetailsSectionSkeleton from '../../../../../../components/skeleton-component/detailsskeleton';

interface HistoryTableProps {
  loading?: boolean;
  isError?: boolean;
  setCount: (value: number) => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({ setCount }) => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('response_source');
  const [sortBy, setSortBy] = useState<'ASC' | 'DESC'>('ASC');
  const [responseHistoryDetails, setResponseHistoryDetails] = useState<
    DisplayColumn[]
  >([]);
  const [detailQuestions, setDetailQuestions] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const accountId = searchParams.get('accountID') || '';
  const interactionId = searchParams.get('interaction_id') || undefined;
  const interactionResponseId = searchParams.get('versionID') || undefined;

  const {
    data: detialsResponse,
    isLoading: detailsLoading,
    isError: detailsError,
  } = useResponseInteractionDetails({
    account_rid: accountId,
    interaction_rid: interactionId,
    version: Number(interactionResponseId),
  });

  useEffect(() => {
    if (detialsResponse?.data.history_details) {
      const updatedData = detialsResponse?.data.history_details.map(
        (question: InteractionHistoryResponse) => ({
          ...question,
          rid: question?.interaction_response_rid,
          question_seq_num: question?.question_id,
          notes: '',
          is_mandatory: false,
          response_on_datetime: question?.response_on,
        })
      );
      setDetailQuestions(updatedData);
    }
  }, [detialsResponse?.data.history_details]);

  const {
    data: responseDataList,
    isLoading,
    isError,
  } = useInteractionResponseHistoryList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sort: sortField,
      sort_by: sortBy,
      fiscal_year: 2023,
      account_rid: accountId,
      interaction_rid: interactionId,
    },
    !interactionResponseId
  );

  useEffect(() => {
    if (detialsResponse) {
      setResponseHistoryDetails(transformInteractionData(detialsResponse));
    }
  }, [detialsResponse]);

  useEffect(() => {
    if (responseDataList) {
      setCount(responseDataList?.count || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responseDataList]);

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

  const handleViewInteraction = (row: ResponseInteractionList) => {
    if (row) {
      console.log('rowId', row);
      const versionValue = String(row?.interaction_version);
      searchParams.set('versionID', versionValue);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  const getRowId = (row: ResponseInteractionList) => row.rid;
  const interactionColumns = getInteractionListColumns(handleViewInteraction);

  return (
    <div>
      {interactionResponseId ? (
        <>
          <InfoSection
            columns={responseHistoryDetails}
            loading={detailsLoading}
            error={detailsError}
            singleLineView={true}
          />
          {detailsLoading ? (
            <DetailsSectionSkeleton />
          ) : (
            detialsResponse?.data?.history_details &&
            detialsResponse?.data?.history_details.length > 0 && (
              <InteractionQuestions
                questions={detailQuestions}
                globalAttachments={[]}
                isEditEnable={false}
                actionButtonEnable={false}
                className='border-0'
              />
            )
          )}
        </>
      ) : (
        <ListTable
          data={responseDataList?.interactions || []}
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
          selectable={false}
          actionWidth={80}
          actionDisplayMode='dropdown'
          actionMenuItems={[]}
          loading={isLoading}
          error={isError ? 'error occurs' : undefined}
          rowsPerPageOptions={[25, 50, 100]}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          totalItems={responseDataList?.count || 0}
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
