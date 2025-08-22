import React, { useEffect, useMemo, useState } from 'react';
import {
  AllPermissions,
  OverviewTabs,
  useGetInteractionSources,
  useGetInteractionStatus,
  useGetInteractionTypes,
} from '../../../../../common-service';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { ExportType, InteractionList, StatusTypeEnum } from '../../../../types';
import { useInteractionList } from '../../../../services/interactions/interactions-service';
import { INTERACTIONS_CREATE, INTERACTIONS_EDIT } from '../../../../../routes';
import { ActionItem } from '../../../../../components/table/types';
import { EditIcon, InteractionDetailIcon } from '../../../../../assets';
import { getInteractionListColumns } from './columns';
import { getInteractionFilterFields } from './helpers';
import {
  SectionTabPanel,
  SendInteractionModal,
} from '../../../../../components';
import InteractionDetails from './interaction-details/interaction-details';
import SectionHeader from '../../../../../components/details-section/section-header';
import { ListTable } from '../../../../../components/table';
import { accountDetailsProps } from '../../../account-details/utils';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { InteractionHistory } from './interaction-history';
import { InteractionAttachment } from './interaction-attachment';
import HistoryTable from './response-history/history-table';
import { getInteractionHistoryFilterFields } from './interaction-history/helper';
import { AttachmentsListExportParams } from '../../../../types/attachment';

const InteractionsTabs: OverviewTabs[] = [
  {
    id: AllPermissions.INTERACTIONS_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  // {
  //   id: AllPermissions.INTERACTIONS_TIMELINE,
  //   name: 'Timeline',
  //   hide: false,
  //   disable: true,
  // },
];

interface InteractionsProps {
  accountInActive: boolean;
  accountDetails?: accountDetailsProps;
  setExportType?: (type: ExportType) => void;
  setInteractionsParams: React.Dispatch<
    React.SetStateAction<AttachmentsListExportParams>
  >;
}

const Interactions: React.FC<InteractionsProps> = ({
  accountInActive,
  accountDetails,
  setExportType,
  setInteractionsParams,
}) => {
  const { accountid } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [refreshInteractions, setRefreshInteractions] = useState<number>(
    Date.now()
  );
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortField, setSortField] = useState<string>('r_number');
  const [sortBy, setSortBy] = useState<'ASC' | 'DESC'>('ASC');
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [interactionList, setInteractionList] = useState<InteractionList[]>([]);
  const [count, setCount] = useState<number>(0);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<InteractionList[]>([]);

  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );

  const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const interactionId = searchParams.get('interaction_id');
  const interactionHistoryId = searchParams.get('interaction_history_id');
  const interactionAttachmentId = searchParams.get(
    'interaction_attachment_count'
  );
  const responseHistory = searchParams.get('history');
  const interactionResponseId = searchParams.get('versionID');
  const viewDetails = !!interactionId;
  const viewInteractionHistory = !!interactionHistoryId;
  const viewInteractionAttachment = !!interactionAttachmentId;
  const viewResponseHistory = !!responseHistory;

  const { data, isLoading, isError } = useInteractionList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sort: sortField,
      sort_by: sortBy,
      filters: appliedFilters,
      account_rid: accountid || '',
      fiscal_year: newFiscalYear,
      flag: 'account',
    },
    !viewDetails &&
      !viewInteractionHistory &&
      !viewInteractionAttachment &&
      !viewResponseHistory,
    refreshInteractions
  );
  const totalItems = data?.count || 0;
  const interactionTypes = useGetInteractionTypes();
  const interactionSources = useGetInteractionSources();
  const interactionStatus = useGetInteractionStatus();

  const memoizedInteractionStatus = useMemo(
    () =>
      interactionStatus.data?.data.interactionStatus.map((status) => ({
        option: status.status_name,
        value: status.rid,
      })) || [],
    [interactionStatus.data?.data.interactionStatus]
  );

  const memoizedInteractionTypes = useMemo(
    () =>
      interactionTypes.data?.data.interactionTypes.map((type) => ({
        option: type.interaction_type_name,
        value: type.rid,
      })) || [],
    [interactionTypes.data?.data.interactionTypes]
  );

  const memoizedInteractionSources = useMemo(
    () =>
      interactionSources.data?.data.interactionSource.map((source) => ({
        option: source.interaction_source_name,
        value: source.interaction_source_name,
      })) || [],
    [interactionSources.data?.data.interactionSource]
  );

  useEffect(() => {
    if (data) {
      setCount(data.count || 0);
      const updatedInteractions =
        data.interactions?.map((item) => {
          const status = (item.status_name || '').toLowerCase();
          return {
            ...item,
            disableCheckBox:
              status === StatusTypeEnum.draft ||
              status === StatusTypeEnum.cancelled ||
              status === StatusTypeEnum.response_received ||
              status === '',
          };
        }) || [];

      setInteractionList(updatedInteractions);
      setSelectedRows([]);
    }
  }, [data]);

  useEffect(() => {
    if (setExportType) {
      setExportType('interactions');
    }
    if (interactionHistoryId) {
      return;
    }
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

  const handleRefresh = () => {
    setRefreshInteractions(Date.now());
  };

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'r_number';
    const defaultSortOrder = 'ASC';
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    if (!sortBy) {
      setSortFilterCount(0);
      setSortBy(defaultSortOrder);
      setSortField(defaultSortField);
    } else {
      setSortFilterCount(1);
      setSortBy(apiOrder);
      setSortField(sortBy);
    }
  };

  const handleCreate = () => {
    const accountId = accountid ?? '';
    const path = generatePath(INTERACTIONS_CREATE, {
      module: 'account',
    });
    const queryParams = new URLSearchParams({
      accountId,
      source: 'account',
      account_name: accountDetails?.accountById?.account_name || '',
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const handleEdit = (row: InteractionList) => {
    const accountId = accountid ?? '';
    const path = generatePath(INTERACTIONS_EDIT, {
      module: 'account',
      interactionId: row.rid,
    });
    const queryParams = new URLSearchParams({
      accountId,
      source: 'account',
      account_name: accountDetails?.accountById?.account_name || '',
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const headerButtons = [
    {
      label: 'Send Interaction',
      variant: 'outlined' as const,
      disabled: selectedRows.length === 0 || accountInActive,
      onClick: () => setSendModalOpen(true),
      sx: { width: '120px', minWidth: '120px' },
      hide: viewResponseHistory,
    },
    {
      label: 'New',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: () => handleCreate(),
      sx: { width: '48px', minWidth: '48px' },
      hide: viewResponseHistory,
    },
  ];

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedRows([]);
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

  const handleSelectionChange = (selectedIds: string[]) => {
    const selectedData = interactionList.filter((row) =>
      selectedIds.includes(row.rid)
    );
    setSelectedRows(selectedData);
  };

  const handleViewInteraction = (rowId: string) => {
    if (rowId) {
      searchParams.set('interaction_id', rowId);
      navigate({ search: searchParams.toString() }, { replace: true });
      setSelectedRows([]);
      setCount(0);
    }
  };

  const handleBackClick = () => {
    if (!interactionResponseId) {
      searchParams.delete('interaction_id');
      searchParams.delete('interaction_history_id');
      searchParams.delete('interaction_attachment_count');
      searchParams.delete('interaction_rid');
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  const handleBackFromResponse = () => {
    if (interactionResponseId) {
      searchParams.delete('versionID');
      navigate({ search: searchParams.toString() }, { replace: true });
    } else {
      searchParams.delete('history');
      searchParams.delete('interaction_attachment_id');
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  const disableInteractionEditBtn = (row: InteractionList): boolean => {
    const status = (row.status_name || '').toLowerCase() as StatusTypeEnum;
    return [
      StatusTypeEnum.cancelled,
      StatusTypeEnum.completed,
      StatusTypeEnum.response_received,
    ].includes(status);
  };

  const actionButtons: ActionItem<InteractionList>[] = [
    {
      label: 'Edit',
      onClick: (row: InteractionList) => handleEdit(row),
      icon: EditIcon,
      disabled: (row: InteractionList) =>
        accountInActive || disableInteractionEditBtn(row),
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
    },
  ];

  const handleViewInteractionHistory = (interactionHistoryId: string) => {
    if (interactionHistoryId) {
      searchParams.set('interaction_history_id', interactionHistoryId);
      navigate({ search: searchParams.toString() }, { replace: true });
      setSelectedRows([]);
    }
  };

  const handleViewInteractionAttachmentCount = (
    interactionAttachentCount: string | number,
    rowId: string
  ) => {
    if (interactionAttachentCount) {
      searchParams.set('interaction_rid', rowId);
      searchParams.set(
        'interaction_attachment_count',
        String(interactionAttachentCount)
      );
      navigate({ search: searchParams.toString() }, { replace: true });
      setSelectedRows([]);
    }
  };

  const getRowId = (row: InteractionList) => row.rid;
  const interactionColumns = getInteractionListColumns(
    handleViewInteraction,
    handleViewInteractionHistory,
    handleViewInteractionAttachmentCount
  );

  const filterFields = !viewInteractionHistory
    ? getInteractionFilterFields(
        memoizedInteractionTypes,
        memoizedInteractionSources,
        memoizedInteractionStatus
      )
    : getInteractionHistoryFilterFields(memoizedInteractionStatus);

  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={InteractionsTabs}
        filterMenu={filterFields}
        filterVisibility={!viewDetails && !viewInteractionAttachment}
        showFilter={showFilter}
        contextKey='project-interactions'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        showRefresh={!viewDetails}
        onRefreshClick={handleRefresh}
      />
      {viewDetails && !viewResponseHistory ? (
        <InteractionDetails
          accountInActive={accountInActive}
          handleBackClick={handleBackClick}
          accountDetails={accountDetails}
        />
      ) : viewInteractionHistory ? (
        <InteractionHistory
          handleBackClick={handleBackClick}
          appliedFilters={appliedFilters}
          refresh={refreshInteractions}
          setInteractionsParams={setInteractionsParams}
        />
      ) : viewInteractionAttachment ? (
        <InteractionAttachment
          handleBackClick={handleBackClick}
          refresh={refreshInteractions}
        />
      ) : (
        <>
          <SectionHeader
            title={
              viewResponseHistory
                ? `Interaction Response History`
                : 'Interaction'
            }
            titleIcon={
              <InteractionDetailIcon
                alt='financial-header-icon'
                className={`w-7 h-7 p-1 bg-[#E25A32] ${viewResponseHistory ? 'rounded-[2px]' : 'rounded-full'}`}
              />
            }
            count={viewResponseHistory ? count : totalItems}
            showItemCount={interactionResponseId ? false : true}
            showBackArrow={viewResponseHistory}
            onBackClick={handleBackFromResponse}
            buttons={headerButtons}
          />
          <div className='border border-[#CBD6E2]'>
            {!viewResponseHistory ? (
              <ListTable
                data={interactionList}
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
                actionMenuItems={actionButtons}
                loading={isLoading}
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
            ) : (
              <HistoryTable setCount={setCount} />
            )}
          </div>
          <SendInteractionModal
            isOpen={sendModalOpen}
            onClose={() => setSendModalOpen(false)}
            selectedRows={selectedRows}
            onSuccessRefetch={handleRefresh}
          />
        </>
      )}
    </div>
  );
};

export default Interactions;
