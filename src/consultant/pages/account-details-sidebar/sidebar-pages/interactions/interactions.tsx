import React, { useEffect, useState } from 'react';
import { AllPermissions, OverviewTabs } from '../../../../../common-service';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { InteractionList } from '../../../../types';
import { useInteractionList } from '../../../../services/interactions/interactions-service';
import { INTERACTIONS, INTERACTIONS_CREATE } from '../../../../../routes';
import { ActionItem } from '../../../../../components/table/types';
import { EditIcon, InteractionDetailIcon } from '../../../../../assets';
import { getInteractionListColumns } from './columns';
import { getInteractionFilterFields } from './helpers';
import { SectionTabPanel } from '../../../../../components';
import InteractionDetails from './interaction-details/interaction-details';
import SectionHeader from '../../../../../components/details-section/section-header';
import { ListTable } from '../../../../../components/table';
import { accountDetailsProps } from '../../../account-details/utils';

const InteractionsTabs: OverviewTabs[] = [
  {
    id: AllPermissions.INTERACTIONS_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  {
    id: AllPermissions.INTERACTIONS_TIMELINE,
    name: 'Timeline',
    hide: false,
    disable: true,
  },
];

interface InteractionsProps {
  accountInActive: boolean;
  accountDetails?: accountDetailsProps;
}

const Interactions: React.FC<InteractionsProps> = ({
  accountInActive,
  accountDetails,
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

  const interactionId = searchParams.get('interaction_id');
  const viewDetails = !!interactionId;

  const { data, isLoading, isError } = useInteractionList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sort: sortField,
      sort_by: sortBy,
      filters: appliedFilters,
      accountRid: accountid || '',
    },
    !viewDetails,
    refreshInteractions
  );
  const totalItems = data?.count || 0;

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
    const accountId = accountid ?? '';
    const queryParams = new URLSearchParams({
      accountId,
      source: 'account',
      account_name: accountDetails?.accountById?.account_name || '',
    });
    navigate(`${INTERACTIONS_CREATE}?${queryParams.toString()}`);
  };

  const handleEdit = (row: InteractionList) => {
    const accountId = accountid ?? '';
    const queryParams = new URLSearchParams({
      accountId,
      source: 'account',
      account_name: accountDetails?.accountById?.account_name || '',
    });
    navigate(`${INTERACTIONS}/edit/${row.rid}?${queryParams.toString()}`);
  };

  const headerButtons = [
    {
      label: 'Send Interaction',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: () => console.log('Send Interaction clicked'),
      sx: { width: '120px', minWidth: '120px' },
      hide: false,
    },
    {
      label: 'New',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: () => handleCreate(),
      sx: { width: '48px', minWidth: '48px' },
      hide: false,
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
    console.log(selectedIds);
  };

  const handleViewInteraction = (rowId: string) => {
    if (rowId) {
      searchParams.set('interaction_id', rowId);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  const handleBackClick = () => {
    searchParams.delete('interaction_id');
    navigate({ search: searchParams.toString() }, { replace: true });
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
  const interactionColumns = getInteractionListColumns(handleViewInteraction);

  const filterFields = getInteractionFilterFields();

  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <SectionTabPanel
        tabs={InteractionsTabs}
        filterMenu={filterFields}
        filterVisibility={!viewDetails}
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
      {viewDetails ? (
        <InteractionDetails
          accountInActive={accountInActive}
          handleBackClick={handleBackClick}
          accountDetails={accountDetails}
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
            buttons={headerButtons}
          />
          <div className='border border-[#CBD6E2]'>
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
          </div>
        </>
      )}
    </div>
  );
};

export default Interactions;
