import React, { useEffect, useMemo, useState } from 'react';
import {
  AllPermissions,
  OverviewTabs,
  useGetInteractionSources,
  useGetInteractionStatus,
  useGetInteractionTypes,
} from '../../../../../common-service';
import { EditIcon, InteractionDetailIcon } from '../../../../../assets';
import SectionHeader from '../../../../../components/details-section/section-header';
import { SectionTabPanel } from '../../../../../components';
import { ListTable } from '../../../../../components/table';
import { InteractionList } from '../../../../types';
import { useInteractionList } from '../../../../services/interactions/interactions-service';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { getInteractionListColumns } from './columns';
import { getInteractionFilterFields } from './helpers';
import InteractionDetails from './interaction-details/interaction-details';
import { InteractionHistory } from './interaction-history';
import { ActionItem } from '../../../../../components/table/types';
import { INTERACTIONS_CREATE, INTERACTIONS_EDIT } from '../../../../../routes';
import { NewProjectData } from '../../../../types/project';
import { SendInteractionModal } from '../../../../../components/interaction';
import { InteractionAttachment } from './interaction-attachment';
import HistoryTable from './response-history/history-table';
import { getInteractionHistoryFilterFields } from './interaction-history/helper';

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
  projectDetails: NewProjectData | null;
}

const Interactions: React.FC<InteractionsProps> = ({
  accountInActive,
  projectDetails,
}) => {
  const { projectid } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const accountId = searchParams.get('accountID') || '';
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
  const viewHistory = !!responseHistory;
  // console.log('viewHistory', viewHistory);
  const projectData = {
    project_code: projectDetails?.project_code || '',
    project_name: projectDetails?.project_name || '',
    fiscal_year: projectDetails?.fiscal_year || '',
    account_name: projectDetails?.account_name || '',
    account_rid: projectDetails?.account_rid || '',
    project_rid: projectDetails?.project_rid || '',
    project_fiscal_rid:
      projectDetails?.project_fiscal_rid ||
      projectid ||
      projectDetails?.rid ||
      '',
  };
  const fiscalYear = Number(projectDetails?.fiscal_year);

  const { data, isLoading, isError } = useInteractionList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sort: sortField,
      sort_by: sortBy,
      filters: appliedFilters,
      project_rid: projectDetails?.project_rid || '',
      project_fiscal_rid:
        projectDetails?.project_fiscal_rid ||
        projectid ||
        projectDetails?.rid ||
        '',
      fiscal_year: fiscalYear,
      account_rid: accountId,
      flag: 'project',
    },
    !viewDetails && !viewInteractionHistory && !viewInteractionAttachment,
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
        value: source.rid,
      })) || [],
    [interactionSources.data?.data.interactionSource]
  );

  useEffect(() => {
    if (data) {
      setInteractionList(data.interactions || []);
      setCount(data.count || 0);
    }
  }, [data]);

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
    const path = generatePath(INTERACTIONS_CREATE, {
      module: 'project',
    });
    const queryParams = new URLSearchParams({
      accountId,
      source: 'project',
      projectDetails: JSON.stringify(projectData),
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const handleEdit = (row: InteractionList) => {
    const path = generatePath(INTERACTIONS_EDIT, {
      module: 'project',
      interactionId: row.rid,
    });
    const queryParams = new URLSearchParams({
      accountId,
      source: 'project',
      projectDetails: JSON.stringify(projectData),
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
      hide: viewHistory,
    },
    {
      label: 'New',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: () => handleCreate(),
      sx: { width: '48px', minWidth: '48px' },
      hide: viewHistory,
    },
  ];

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
    }
  };

  const handleViewInteractionHistory = (interactionHistoryId: string) => {
    if (interactionHistoryId) {
      searchParams.set('interaction_history_id', interactionHistoryId);
      navigate({ search: searchParams.toString() }, { replace: true });
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
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  const actionButtons: ActionItem<InteractionList>[] = [
    {
      label: 'Edit',
      onClick: (row: InteractionList) => handleEdit(row),
      icon: EditIcon,
      disabled: accountInActive,
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
    },
  ];

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
      {viewDetails && !viewHistory ? (
        <InteractionDetails
          accountInActive={accountInActive}
          handleBackClick={handleBackClick}
          projectDetails={projectDetails}
        />
      ) : viewInteractionHistory ? (
        <InteractionHistory
          handleBackClick={handleBackClick}
          projectDetails={projectDetails}
          accountInActive={accountInActive}
          refresh={refreshInteractions}
          appliedFilters={appliedFilters}
        />
      ) : viewInteractionAttachment ? (
        <InteractionAttachment
          handleBackClick={handleBackClick}
          refresh={refreshInteractions}
        />
      ) : (
        <>
          <SectionHeader
            title='Interaction'
            titleIcon={
              <InteractionDetailIcon
                alt='financial-header-icon'
                className={`w-7 h-7 p-1 bg-[#E25A32] rounded-full`}
              />
            }
            count={count}
            showItemCount={true}
            showBackArrow={viewHistory}
            onBackClick={handleBackFromResponse}
            buttons={headerButtons}
          />

          <div className='border border-[#CBD6E2]'>
            {!viewHistory ? (
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
                loading={isLoading || !fiscalYear}
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
              <HistoryTable />
            )}
            <SendInteractionModal
              isOpen={sendModalOpen}
              onClose={() => setSendModalOpen(false)}
              selectedRows={selectedRows}
              onSend={(emails) => {
                console.log('Emails to send:', emails);
                setSendModalOpen(false);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Interactions;
