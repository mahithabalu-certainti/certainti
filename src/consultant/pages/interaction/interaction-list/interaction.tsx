import React, { Suspense, useEffect, useMemo, useState } from 'react';
import {
  AccountSettingsIcon,
  ActionIcon,
  InteractionDetailIcon,
  NewFilterIcon,
  RefreshIcon,
} from '../../../../assets';
import { ActionsDropdown } from '../../../../components';
import Filter from '../../account-details-sidebar/components/filter/filter';
import { FilterState, InteractionListURLParams } from '../../../types';
import { getInteractionFilterFields } from './helpers';
import { InteractionTable } from './table/interaction-table';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import {
  AllModules,
  AllPermissions,
  useGetInteractionResponeSources,
  useGetInteractionStatus,
  useGetInteractionTypes,
} from '../../../../common-service';
import { checkPermission, reshapeGlobalFilter } from '../../../../common-utils';
import { exportGlobalInteractions } from '../../../services/interactions/interactions-service';
import TextButton from '../../../../components/button/text-button';
import { GLOBAL_INTERACTIONS_CREATE } from '../../../../routes';
import { useNavigate } from 'react-router-dom';
import { AccessRestricted } from '../../../../components/account-restricted';
import SearchBar from '../../../../components/search/search-bar';

const Interaction: React.FC = () => {
  const navigate = useNavigate();
  const { fiscalYear, filters } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);
  const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [tableParams, setTableParams] = useState<InteractionListURLParams>({
    page: page,
    limit: 100,
    sort: 'r_number',
    sort_by: 'ASC',
    filters: appliedFilters,
    fiscal_year: newFiscalYear,
    globalFilters: reshapeGlobalFilter(filters as FilterState),
  });
  const [refreshTrigger, setRefreshTrigger] = useState<number>();
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );

  // Permissions
  const interactionsEnable = checkPermission(modules, AllModules.INTERACTIONS);
  const interactionsViewEnable = checkPermission(
    permission,
    AllPermissions.INTERACTIONS_VIEW_EDIT
  );

  const createInteractionsEnable = checkPermission(
    permission,
    AllPermissions.INTERACTIONS_CREATE
  );

  const isInteractionsExportEnable = checkPermission(
    permission,
    AllPermissions.INTERACTIONS_EXPORT
  );

  const interactionsViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.INTERACTIONS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );

  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    interactionsViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [interactionsViewEditFields]);

  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const onRefreshClick = () => {
    setRefreshTrigger(Date.now());
  };

  useEffect(() => {
    const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
    setTableParams((prev) => ({
      ...prev,
      page: 1,
      filters: appliedFilters,
      fiscal_year: newFiscalYear,
      globalFilters: reshapeGlobalFilter(filters as FilterState),
    }));
  }, [appliedFilters, fiscalYear, filters]);

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen ? 'all-interaction-filter-popover' : undefined;

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'r_number';
    const defaultSortOrder = 'ASC';
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    if (!sortBy) {
      setSortFilterCount(0);
      setTableParams((prev) => ({
        ...prev,
        sort: defaultSortField,
        sort_by: defaultSortOrder,
      }));
    } else {
      setSortFilterCount(1);
      setTableParams((prev) => ({
        ...prev,
        sort: sortBy,
        sort_by: apiOrder,
      }));
    }
  };

  const handleExport = () => {
    const projectInteractionHistoryExportPayload = {
      page: tableParams.page || 1,
      limit: tableParams?.limit || 100,
      sort: tableParams?.sort || 'r_number',
      sort_by: tableParams?.sort_by || 'ASC',
      filters: tableParams?.filters || {},
      fiscal_year: newFiscalYear,
      timezone: systemTimezone,
      globalFilters: reshapeGlobalFilter(filters as FilterState) || {},
    };
    exportGlobalInteractions(projectInteractionHistoryExportPayload);
  };

  const menuItems = [
    {
      label: 'Export',
      hide: !isInteractionsExportEnable,
      onClick: () => handleExport(),
    },
  ];

  const interactionTypes = useGetInteractionTypes();
  const interactionStatus = useGetInteractionStatus();
  const interactionResponseSources = useGetInteractionResponeSources();

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

  const memoizedInteractionResponseSources = useMemo(
    () =>
      interactionResponseSources.data?.data.responseSource.map((type) => ({
        option: type.response_source_name,
        value: type.rid,
      })) || [],
    [interactionResponseSources.data?.data.responseSource]
  );
  const filterFields = getInteractionFilterFields(
    memoizedInteractionTypes,
    // memoizedInteractionSources,
    memoizedInteractionStatus,
    memoizedInteractionResponseSources,
    permissionMap
  );

  const handleCreate = () => {
    const queryParams = new URLSearchParams({
      source: 'global',
    });
    navigate(`${GLOBAL_INTERACTIONS_CREATE}?${queryParams.toString()}`);
  };

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'interaction-column-visibility-popover'
    : undefined;

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  if (!interactionsEnable || !interactionsViewEnable)
    return <AccessRestricted />;

  return (
    <div className='flex flex-col w-full  h-full'>
      <div className='flex items-center justify-between w-full h-[55px] min-h-[55px] max-h-[55px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <InteractionDetailIcon className='h-8 w-8 bg-[#6FBDA0] p-1.5 border-box rounded' />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-bold text-[16px] text-[#2D3E4F]'>
                Interactions
              </div>
              <div className='font-semibold text-[#7D98B6] text-[12px] -mt-1'>
                {`${totalCount} items`}
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-2 justify-center items-center'>
          <ActionsDropdown actions={menuItems} />
          <div
            className='flex items-center justify-center border border-[#CBD6E2] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] w-[24px] h-[23px] cursor-pointer'
            onClick={onRefreshClick}
          >
            <RefreshIcon alt='refresh-icon' className='h-4' />
          </div>
          <TextButton
            label='Create Interaction'
            onClick={handleCreate}
            hide={!createInteractionsEnable}
            sx={{
              width: '124px',
              minWidth: '124px',
              maxWidth: '124px',
            }}
          />
          <div className='hidden border border-[#CBD6E2] w-[24px] h-[24px] justify-center items-center bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'>
            <ActionIcon alt='menu-icon' className='h-4' />
          </div>
          <div className='hidden border border-[#CBD6E2] w-[24px] h-[24px]  justify-center items-center bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'>
            <AccountSettingsIcon alt='menu-icon' className='h-4' />
          </div>
        </div>
      </div>
      <div className='flex items-center justify-end h-[34px] min-h-[34px] px-4'>
        <div className='flex gap-1 relative'>
          <SearchBar
            initialSearchText={searchText}
            onSearch={(value) => {
              setSearchText(value);
              console.log('Search triggered for:', value);
            }}
            placeholder='Search'
            disabled={false}
            hide={false}
          />
          <button
            aria-describedby={modalId}
            className={`w-[120px] h-[24px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative border border-[#CBD6E2] px-0 py-0 normal-case ${isModalOpen ? 'bg-[#F3F3F3]' : 'bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)]'} hover:text-[#425A76] transition-colors duration-150`}
            style={{
              boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
            }}
            onClick={handleColumnVisibility}
          >
            Show/Hide Fields
          </button>
          <button
            aria-describedby={filterId}
            className={`w-[64px] h-[26px] text-[13px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative 
              ${isFilterOpen || (appliedFilters && Object.keys(appliedFilters).length > 0) || sortFilterCount > 0 ? 'bg-[#F3F3F3]' : ''}`}
            onClick={handleFilterModal}
          >
            <NewFilterIcon alt='filter-icon' />
            Filter
            {(appliedFilters && Object.keys(appliedFilters).length > 0) ||
            sortFilterCount > 0 ? (
              <div className='absolute -top-[5px] -right-2 w-4 h-4 flex items-center justify-center text-xs'>
                <span className='absolute w-full h-full bg-[#FF6666] rounded-full animate-ping opacity-75 z-0'></span>
                <span className='w-4 h-4 bg-[#FF6666] text-white rounded-full flex items-center justify-center z-10 font-semibold'>
                  {(appliedFilters ? Object.keys(appliedFilters).length : 0) +
                    sortFilterCount}
                </span>
              </div>
            ) : null}
          </button>
          <Suspense fallback={null}>
            <Filter
              value={'all-interactions'}
              isOpen={isFilterOpen}
              filterAnchorEl={anchorEl}
              filterId={filterId}
              filterMenu={filterFields}
              setAppliedFilters={setAppliedFilters}
              handleCloseFilter={handleCloseFilter}
              setCurrentPage={setPage}
              handleSorting={handleSorting}
            />
          </Suspense>
        </div>
      </div>

      <div className='border border-[#CBD6E2]'>
        <InteractionTable
          tableParams={tableParams}
          setTableParams={setTableParams}
          setTotalCount={setTotalCount}
          refreshTrigger={refreshTrigger}
          setColumnAnchorEl={setColumnAnchorEl}
          columnAnchorEl={columnAnchorEl}
        />
      </div>
    </div>
  );
};

export default Interaction;
