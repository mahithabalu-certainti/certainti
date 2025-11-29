import React, { useEffect, useMemo, useState } from 'react';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import { ActivitiesIcon } from '../../../../../assets';
import { AllPermissions } from '../../../../../common-service';
import {
  ActivityListExportURLParams,
  ActivityType,
  CaseDetails,
  ExportType,
} from '../../../../types';
import {
  getActivityAllActivityListColumns,
  getActivityCallLogListColumns,
  getActivityEmailListColumns,
  getActivityMeetingListColumns,
  getActivityTaskListColumns,
} from '../../../activities/activities-list/activity-columns';
import {
  getTaskFilterFields,
  getAllActivityFilterFields,
  getCallFilterFields,
  getEmailFilterFields,
  getMeetingFilterFields,
} from '../../../activities/activities-list/helper';
import ActivityDetails from '../../../activities/activities-details/activity-details';
import { ActivityListTable } from '../../../activities';
import { ACTIVITY_CREATE } from '../../../../../routes';
import TaskDetails from '../../../activities/activities-details/task-details';
import { useGetUserOptions } from '../../../../services/case-team';
import { useGetActivityStatus } from '../../../../services/activities/activities-service';

const ActivityTabs = [
  {
    id: AllPermissions.ACTIVITIES_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  {
    id: AllPermissions.ACTIVITIES_TIMELINE,
    name: 'Timeline',
    hide: true,
    disable: true,
  },
];

interface CaseActivitiesProps {
  accountInActive: boolean;
  caseDetails?: CaseDetails;
  setExportType?: (type: ExportType) => void;
  setActivityParams: React.Dispatch<
    React.SetStateAction<ActivityListExportURLParams>
  >;
}

const CaseActivities: React.FC<CaseActivitiesProps> = ({
  accountInActive,
  caseDetails,
  setExportType,
  setActivityParams,
}) => {
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [count, setCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [searchText, setSearchText] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(Date.now());

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const activityId = searchParams.get('activity_id');
  const activityType = searchParams.get('activity_type');
  const viewDetails = !!activityId && !!activityType;
  const caseFiscalYear = caseDetails?.fiscal_year || '';

  const entityDetails = {
    r_number: caseDetails?.r_number || '',
    module: 'case',
    source: `Case > ${caseDetails?.r_number || ''}`,
    fiscalYear: caseFiscalYear,
  };

  const userListOptions = useGetUserOptions(accountId, true);
  const activityStatus = useGetActivityStatus();

  const initialTab = useMemo(() => {
    return 'all';
  }, []);

  useEffect(() => {
    if (searchParams.get('list') === 'activities' && !searchParams.get('tab')) {
      searchParams.set('tab', initialTab);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab, searchParams]);

  const tabParam = searchParams.get('tab') || initialTab;

  const handleRefresh = () => setRefreshTrigger(Date.now());
  const handleFilter = () => setShowFilter(!showFilter);

  const handleTabChange = (value: string) => {
    searchParams.set('tab', value);
    searchParams.delete('activity_id');
    searchParams.delete('activity_type');
    navigate({ search: searchParams.toString() }, { replace: true });
    setCount(0);
    setAppliedFilters({});
    setCurrentPage(0);
  };

  const userOptions = useMemo(() => {
    return (
      userListOptions?.data?.map((item) => ({
        value: item.rid,
        label: item?.name || '',
      })) || []
    );
  }, [userListOptions]);

  const activityStatusOptions = useMemo(() => {
    return (
      activityStatus?.data?.data?.activityStatus?.map((item) => ({
        value: item.status_name,
        label: item.status_name,
      })) || []
    );
  }, [activityStatus]);

  const filterFields = useMemo(() => {
    switch (tabParam) {
      case 'task':
        return getTaskFilterFields(userOptions, activityStatusOptions);
      case 'email':
        return getEmailFilterFields(activityStatusOptions);
      case 'meeting':
        return getMeetingFilterFields(activityStatusOptions);
      case 'call':
        return getCallFilterFields(activityStatusOptions);
      default:
        return getAllActivityFilterFields(activityStatusOptions);
    }
  }, [tabParam, userOptions, activityStatusOptions]);

  const tabs = [
    { label: 'All', value: 'all' },
    { label: 'Task', value: 'task' },
    { label: 'Email', value: 'email' },
    { label: 'Meeting', value: 'meeting' },
    { label: 'Call', value: 'call' },
  ];

  const handleCreate = () => {
    const path = generatePath(ACTIVITY_CREATE, {
      module: 'case',
      type: tabParam,
    });
    const queryParams = new URLSearchParams({
      accountId,
      entityLevel: 'case',
      entityId: caseId || '',
      caseFiscalYear: caseFiscalYear?.toString() || '',
      source: `Case > ${caseDetails?.r_number || ''}`,
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  const headerButtons = [
    {
      label: 'New',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: () => handleCreate(),
      sx: { width: '48px', minWidth: '48px' },
      hide: tabParam === 'all' || viewDetails,
    },
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { width: '125px', minWidth: '125px' },
      hide: viewDetails,
    },
  ];

  const handleViewActivity = (rowId: string, activityType: ActivityType) => {
    const type = activityType?.toLowerCase();
    if (rowId) {
      searchParams.set('list', 'activities');
      searchParams.set('activity_id', rowId);
      searchParams.set('activity_type', type);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  const tableColumns = useMemo(() => {
    switch (tabParam) {
      case 'task':
        return getActivityTaskListColumns(handleViewActivity);
      case 'email':
        return getActivityEmailListColumns(handleViewActivity);
      case 'meeting':
        return getActivityMeetingListColumns(handleViewActivity);
      case 'call':
        return getActivityCallLogListColumns(handleViewActivity);
      default: // 'all'
        return getActivityAllActivityListColumns(handleViewActivity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  return (
    <div className='w-full pt-2 pl-2 pr-4 mb-1'>
      <SectionTabPanel
        tabs={ActivityTabs}
        filterMenu={filterFields}
        filterVisibility={!viewDetails}
        showFilter={showFilter}
        contextKey='case-activities'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        sortFilterCount={0}
        setSortFilterCount={() => {}}
        showRefresh={!viewDetails}
        onRefreshClick={handleRefresh}
        showSearch={!viewDetails}
        onSearch={(text) => setSearchText(text)}
      />

      <SectionHeader
        title='Activities'
        titleIcon={
          <ActivitiesIcon
            alt='activity-header-icon'
            className='[&>path]:stroke-[#FF5F5F]'
          />
        }
        count={count}
        showItemCount={!viewDetails}
        iconBg='#FFE9E9'
        bgType='circle'
        buttons={headerButtons}
      />

      <SectionHeaderTab
        tabs={tabs}
        onTabChange={handleTabChange}
        defaultValue={tabParam}
      />

      {viewDetails && activityType === 'task' && (
        <TaskDetails
          accountInActive={accountInActive}
          tabValue={tabParam as ActivityType}
          entityLevel={'case'}
          caseId={caseId}
        />
      )}

      {viewDetails && activityType !== 'task' ? (
        <ActivityDetails
          accountInActive={accountInActive}
          tabValue={tabParam as ActivityType}
          entityDetails={entityDetails}
          entityLevel='case'
        />
      ) : (
        <div className='border border-t-0 border-[#CBD6E2]'>
          {tabParam === 'all' && (
            <ActivityListTable
              activityType='all'
              columns={tableColumns}
              refreshTrigger={refreshTrigger}
              currentPage={currentPage}
              appliedFilters={appliedFilters}
              setCount={setCount}
              columnAnchorEl={columnAnchorEl}
              setColumnAnchorEl={setColumnAnchorEl}
              searchValue={searchText}
              accountInActive={accountInActive}
              entityDetails={entityDetails}
              entityLevel='case'
              setExportType={setExportType}
              setActivityParams={setActivityParams}
            />
          )}

          {tabParam === 'task' && (
            <ActivityListTable
              activityType='task'
              columns={tableColumns}
              refreshTrigger={refreshTrigger}
              currentPage={currentPage}
              appliedFilters={appliedFilters}
              setCount={setCount}
              columnAnchorEl={columnAnchorEl}
              setColumnAnchorEl={setColumnAnchorEl}
              searchValue={searchText}
              accountInActive={accountInActive}
              entityDetails={entityDetails}
              entityLevel='case'
              setExportType={setExportType}
              setActivityParams={setActivityParams}
            />
          )}

          {tabParam === 'email' && (
            <ActivityListTable
              activityType='email'
              columns={tableColumns}
              refreshTrigger={refreshTrigger}
              currentPage={currentPage}
              appliedFilters={appliedFilters}
              setCount={setCount}
              columnAnchorEl={columnAnchorEl}
              setColumnAnchorEl={setColumnAnchorEl}
              searchValue={searchText}
              accountInActive={accountInActive}
              entityDetails={entityDetails}
              entityLevel='case'
              setExportType={setExportType}
              setActivityParams={setActivityParams}
            />
          )}

          {tabParam === 'meeting' && (
            <ActivityListTable
              activityType='meeting'
              columns={tableColumns}
              refreshTrigger={refreshTrigger}
              currentPage={currentPage}
              appliedFilters={appliedFilters}
              setCount={setCount}
              columnAnchorEl={columnAnchorEl}
              setColumnAnchorEl={setColumnAnchorEl}
              searchValue={searchText}
              accountInActive={accountInActive}
              entityDetails={entityDetails}
              entityLevel='case'
              setExportType={setExportType}
              setActivityParams={setActivityParams}
            />
          )}

          {tabParam === 'call' && (
            <ActivityListTable
              activityType='call'
              columns={tableColumns}
              refreshTrigger={refreshTrigger}
              currentPage={currentPage}
              appliedFilters={appliedFilters}
              setCount={setCount}
              columnAnchorEl={columnAnchorEl}
              setColumnAnchorEl={setColumnAnchorEl}
              searchValue={searchText}
              accountInActive={accountInActive}
              entityDetails={entityDetails}
              entityLevel='case'
              setExportType={setExportType}
              setActivityParams={setActivityParams}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default CaseActivities;
