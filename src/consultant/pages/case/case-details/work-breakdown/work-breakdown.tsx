import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { CaseIcon } from '../../../../../assets';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { AllPermissions, useGetStatus } from '../../../../../common-service';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import KanbanBoard from '../../../../../components/kanban-board/kanban-board';
import { useGetWorkBreakdownList } from '../../../../../hooks/use-work-breakdown';
import {
  getTaskDetail,
  fetchTaskActivities,
} from '../../../../services/work-breakdown/work-breakdown-service';
import {
  useGetUserOptions,
  useGetTagOptions,
} from '../../../../services/case-team/case-team-service';
import { CaseTask } from './case-task';
import { getAssignGroupsFilterFields } from './case-task/helper';
import { ExportType } from '../../../../types';
import { ActivityMenuItem } from '../../../../types';

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
interface WorkBreakDownProps {
  activityMenuItems: ActivityMenuItem[];
  setExportType: (type: ExportType) => void;
  setCaseTaskParams: (params: Record<string, unknown>) => void;
}

const WorkBreakDown: React.FC<WorkBreakDownProps> = ({
  setExportType,
  setCaseTaskParams,
  activityMenuItems,
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { caseId } = useParams<{
    caseId: string;
  }>();
  const accountId = searchParams.get('accountID');

  const {
    data: kanbanData,
    isLoading,
    isError,
  } = useGetWorkBreakdownList(accountId || '', caseId || '');

  const userOptionsQuery = useGetUserOptions(accountId || '');
  const tagOptionsQuery = useGetTagOptions();

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

  const priorityData = [
    { id: '1', name: 'Lowest', color: '#gray' },
    { id: '2', name: 'Low', color: '#lightblue' },
    { id: '3', name: 'Medium', color: '#yellow' },
    { id: '4', name: 'High', color: '#orange' },
    { id: '5', name: 'Highest', color: '#red' },
  ];

  const statusData = [
    { id: '1', name: 'Active', color: '#10b981' },
    { id: '2', name: 'Inactive', color: '#ef4444' },
  ];

  const tagData = (tagOptionsQuery.data || []).map((tag) => ({
    id: tag.rid,
    name: tag.tag_name,
    color: '#3B82F6',
  }));

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

  const handleFetchTaskDetails = useCallback(
    async (taskId: string) => {
      console.log('handleFetchTaskDetails called for taskId:', taskId);
      if (!accountId || !caseId) {
        console.warn('Account ID or Case ID is missing');
        return null;
      }

      try {
        const taskData = await getTaskDetail(accountId, caseId, taskId);
        return taskData;
      } catch (error) {
        console.error('Failed to fetch task details:', error);
        return null;
      }
    },
    [accountId, caseId]
  );

  const handleFetchTaskActivities = useCallback(
    async (taskId: string) => {
      if (!accountId || !caseId) {
        console.warn('Missing Account ID or Case ID is missing');
        return [];
      }

      try {
        const activitiesData = await fetchTaskActivities(
          accountId,
          caseId,
          taskId
        );

        const transformedActivities = activitiesData.map((activity) => ({
          id: activity.rid,
          user: activity.created_by_name,
          action: `changed ${activity.attribute_name} from "${activity.old_value}" to "${activity.new_value}"`,
          date: new Date(activity.created_datetime).toLocaleDateString(
            'en-US',
            {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }
          ),
        }));

        return transformedActivities;
      } catch (error) {
        console.error('Failed to fetch task activities:', error);
        return [];
      }
    },
    [accountId, caseId]
  );

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
        showAddActivity={true}
        activityMenuItems={activityMenuItems}
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
          <>
            {isError ? (
              <div className='flex items-center justify-center h-full p-40 text-red-500'>
                Error loading data.
              </div>
            ) : kanbanData?.data && kanbanData.data.length === 0 ? (
              <div className='flex items-center justify-center h-full p-40 text-gray-500'>
                {kanbanData.statusMessage || 'No data available'}
              </div>
            ) : (
              <KanbanBoard
                data={kanbanData?.data || []}
                onFetchTaskDetails={handleFetchTaskDetails}
                onFetchTaskActivities={handleFetchTaskActivities}
                showCommentCount={true}
                showTaskCount={true}
                showProfileIndicator={true}
                isDragable={true}
                isLoading={isLoading}
                statusData={statusData}
                priorityData={priorityData}
                tagData={tagData}
                userData={userOptionsQuery.data || []}
              />
            )}
          </>
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
