import React, { useEffect, useMemo, useState } from 'react';
import { CaseIcon } from '../../../../../assets';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { AllPermissions, useGetStatus } from '../../../../../common-service';
import { useNavigate, useSearchParams } from 'react-router-dom';
import KanbanBoard from '../../../../../components/kanban-board/kanban-board';
import {
  mockUserData,
  mockKanbanData,
} from '../../../../../components/kanban-board/mock-data';
import { CaseTask } from './case-task';
import { getAssignGroupsFilterFields } from './case-task/helper';
import { ExportType } from '../../../../types';

const ConfigTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  // {
  //   id: AllPermissions.ACCOUNT_ATTACHMENT_TIMELINE,
  //   name: 'Timeline',
  //   hide: false,
  //   disable: true,
  // },
];
const WorkBreakDown = ({
  caseId,
  setExportType,
  setCaseTaskParams,
}: {
  caseId: string | undefined;
  setExportType: (type: ExportType) => void;
  setCaseTaskParams: (params: Record<string, unknown>) => void;
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabParam = searchParams.get('tab') || 'milestone';
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [reFetchData, setReFetchData] = useState<number>(Date.now());
  const [count, setCount] = useState<number>(0);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [seachText, setSearchText] = useState('');
  const [resetSearch, setResetSearch] = useState(false);

  useEffect(() => {
    if (
      !searchParams.get('tab') &&
      searchParams.get('list') === 'workBreakdown'
    ) {
      searchParams.set('tab', 'milestone');
      navigate(`?${searchParams.toString()}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleSearchReset = () => {
    setResetSearch(false);
  };

  const statusOptions = useGetStatus();

  const memoizedStatus = useMemo(
    () =>
      statusOptions?.data?.data?.status.map((status) => ({
        option: status.status_name,
        value: status.rid,
      })) || [],
    [statusOptions?.data?.data?.status]
  );

  const filterFields =
    tabParam === 'case_task'
      ? getAssignGroupsFilterFields(memoizedStatus)
      : undefined;

  const getTitleIcon = () => {
    return (
      <CaseIcon
        alt='case-icon'
        className={`w-6 h-6 p-[5px] [&>path]:stroke-[#4ce547] bg-[#D2FFE3] !rounded-lg`}
      />
    );
  };

  const tabs = [
    { label: 'Milestone', value: 'milestone' },
    { label: 'Case Task', value: 'case_task' },
  ];

  const handleTabChange = (value: string) => {
    searchParams.set('tab', value);
    // setSearchParams(searchParams);
    navigate(`?${searchParams.toString()}`, { replace: true });
  };

  const onRefreshClick = () => {
    setReFetchData(Date.now());
  };

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const headerButtons = [
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { width: '125px', minWidth: '125px' },
      hide: tabParam !== 'case_task',
    },
  ];

  return (
    <>
      <SectionTabPanel
        tabs={ConfigTabs}
        filterMenu={filterFields}
        filterVisibility={tabParam !== 'milestone'}
        showFilter={showFilter}
        contextKey={`case`}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        handleSorting={() => {}}
        sortFilterCount={0}
        setSortFilterCount={() => {}}
        showRefresh={tabParam === 'case_task' ? true : false}
        onRefreshClick={onRefreshClick}
        // hideTabPanel={hideSection}
        showSearch={tabParam === 'case_task' ? true : false}
        searchDisabled={false}
        searchPlaceholder='Search'
        onSearch={(text) => setSearchText(text)}
        searchReset={resetSearch}
        onSearchReset={handleSearchReset}
      />
      <SectionHeader
        title={'Action Items'}
        titleIcon={getTitleIcon()}
        buttons={headerButtons}
        count={count}
        showItemCount={tabParam === 'case_task'}
        hideSection={false}
      />
      <SectionHeaderTab
        tabs={tabs}
        onTabChange={handleTabChange}
        defaultValue={tabParam}
      />

      <div className='border border-t-0 border-[#CBD6E2]'>
        {tabParam === 'milestone' && (
          <KanbanBoard
            data={mockKanbanData}
            userData={mockUserData}
            showCommentCount={true}
            showTaskCount={true}
            showProfileIndicator={true}
            isCreateTaskHide={true}
            isCreateTaskDisabled={true}
          />
        )}
        {tabParam === 'case_task' && (
          <CaseTask
            caseId={caseId}
            reFetchData={reFetchData}
            setCount={setCount}
            filterParams={{
              page: currentPage,
              filters: appliedFilters,
              limit: 100,
              entity_type: '',
            }}
            setColumnAnchorEl={setColumnAnchorEl}
            columnAnchorEl={columnAnchorEl}
            searchValue={seachText}
            setExportType={setExportType}
            setCaseTaskParams={setCaseTaskParams}
          />
        )}
      </div>
    </>
  );
};

export default WorkBreakDown;
