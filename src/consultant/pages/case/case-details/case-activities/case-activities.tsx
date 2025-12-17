import React, { useEffect, useMemo, useState } from 'react';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import {
  ActivitiesIcon,
  DetailsKeyContactErrorIcon,
} from '../../../../../assets';
import { AllModules, AllPermissions } from '../../../../../common-service';
import {
  ActivityDropdownItem,
  ActivityListExportURLParams,
  ActivityModuleType,
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
  getPermissionMap,
} from '../../../activities/activities-list/helper';
import ActivityDetails from '../../../activities/activities-details/activity-details';
import { ActivityListTable } from '../../../activities';
import { ACTIVITY_CREATE } from '../../../../../routes';
import TaskDetails from '../../../activities/activities-details/task-details';
import { useGetUserOptions } from '../../../../services/case-team';
import { useGetActivityStatus } from '../../../../services/activities/activities-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { checkPermission } from '../../../../../common-utils';
import { capitalize } from '@mui/material';

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
  isDetailLoading?: boolean;
  activityMenuItems: ActivityDropdownItem[];
}

const CaseActivities: React.FC<CaseActivitiesProps> = ({
  accountInActive,
  caseDetails,
  setExportType,
  setActivityParams,
  isDetailLoading,
  activityMenuItems,
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
  const [resetSearch, setResetSearch] = useState<boolean>(false);

  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );

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

  const isEmailConfigured = caseDetails?.is_send_interaction;

  const entityDetails = {
    r_number: caseDetails?.r_number || '',
    module: 'case',
    source: `Case > ${caseDetails?.r_number || ''}`,
    fiscalYear: caseFiscalYear,
  };

  // Permissions management
  const activitiesTaskEnable = checkPermission(
    modules,
    AllModules.ACTIVITIES_TASK
  );
  const activitiesEmailEnable = checkPermission(
    modules,
    AllModules.ACTIVITIES_EMAIL
  );
  const activitiesMeetingEnable = checkPermission(
    modules,
    AllModules.ACTIVITIES_MEETING
  );
  const activitiesCallEnable = checkPermission(
    modules,
    AllModules.ACTIVITIES_CALL
  );

  // Create Permission
  const isActivityTaskCreateEnable = checkPermission(
    permission,
    AllPermissions.ACTIVITY_TASK_CREATE
  );
  const isActivityCallCreateEnable = checkPermission(
    permission,
    AllPermissions.ACTIVITY_CALL_CREATE
  );
  const isActivityEmailCreateEnable = checkPermission(
    permission,
    AllPermissions.ACTIVITY_EMAIL_CREATE
  );
  const isActivityMeetingCreateEnable = checkPermission(
    permission,
    AllPermissions.ACTIVITY_MEETING_CREATE
  );

  const allActivitiesEnabled =
    activitiesCallEnable ||
    activitiesEmailEnable ||
    activitiesMeetingEnable ||
    activitiesTaskEnable;

  // Edit / View Permission
  const taskPermissionMap = useMemo(
    () => getPermissionMap(permission, AllPermissions.ACTIVITY_TASK_VIEW_EDIT),
    [permission]
  );

  const emailPermissionMap = useMemo(
    () => getPermissionMap(permission, AllPermissions.ACTIVITY_EMAIL_VIEW_EDIT),
    [permission]
  );

  const meetingPermissionMap = useMemo(
    () =>
      getPermissionMap(permission, AllPermissions.ACTIVITY_MEETING_VIEW_EDIT),
    [permission]
  );

  const callPermissionMap = useMemo(
    () => getPermissionMap(permission, AllPermissions.ACTIVITY_CALL_VIEW_EDIT),
    [permission]
  );

  // Edit button permission check
  const emailActivityFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.ACTIVITY_EMAIL_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );
  const taskActivityFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.ACTIVITY_TASK_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );
  const meetingActivityFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.ACTIVITY_MEETING_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );
  const callActivityFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.ACTIVITY_CALL_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );

  const initialTab = useMemo(() => {
    if (allActivitiesEnabled) return 'all';
    if (activitiesTaskEnable) return 'task';
    if (activitiesEmailEnable) return 'eamil';
    if (activitiesCallEnable) return 'call';
    if (activitiesMeetingEnable) return 'meeting';
    return 'all';
  }, [
    activitiesCallEnable,
    activitiesEmailEnable,
    activitiesMeetingEnable,
    activitiesTaskEnable,
    allActivitiesEnabled,
  ]);

  useEffect(() => {
    if (searchParams.get('list') === 'activities' && !searchParams.get('tab')) {
      searchParams.set('tab', initialTab);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab, searchParams]);

  const tabParam = searchParams.get('tab') || initialTab;
  const userListOptions = useGetUserOptions(accountId, true);
  const currentType = capitalize(tabParam);
  const activityStatus = useGetActivityStatus(currentType);

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
    setSearchText('');
    setResetSearch(true);
  };

  const handleSearchReset = () => {
    setResetSearch(false);
  };

  const userOptions = useMemo(() => {
    return (
      userListOptions?.data?.map((item) => ({
        value: item.rid,
        label: item?.name || '',
      })) || []
    );
  }, [userListOptions]);

  const emailUserOptions = useMemo(() => {
    return (
      userListOptions?.data?.map((item) => ({
        value: item?.email,
        label: item?.email || '',
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

  const allActivityPermissionMaps = useMemo(
    () => [
      taskPermissionMap,
      emailPermissionMap,
      meetingPermissionMap,
      callPermissionMap,
    ],
    [
      taskPermissionMap,
      emailPermissionMap,
      meetingPermissionMap,
      callPermissionMap,
    ]
  );

  const filterFields = useMemo(() => {
    switch (tabParam) {
      case 'task':
        return getTaskFilterFields(
          userOptions,
          activityStatusOptions,
          taskPermissionMap
        );
      case 'email':
        return getEmailFilterFields(
          activityStatusOptions,
          emailUserOptions,
          emailPermissionMap
        );
      case 'meeting':
        return getMeetingFilterFields(
          activityStatusOptions,
          meetingPermissionMap
        );
      case 'call':
        return getCallFilterFields(activityStatusOptions, callPermissionMap);
      default:
        return getAllActivityFilterFields(
          activityStatusOptions,
          allActivityPermissionMaps
        );
    }
  }, [
    tabParam,
    userOptions,
    activityStatusOptions,
    taskPermissionMap,
    emailUserOptions,
    emailPermissionMap,
    meetingPermissionMap,
    callPermissionMap,
    allActivityPermissionMaps,
  ]);

  const tabs = [
    { label: 'All', value: 'all', hide: !allActivitiesEnabled },
    { label: 'Task', value: 'task', hide: !activitiesTaskEnable },
    { label: 'Email', value: 'email', hide: !activitiesEmailEnable },
    { label: 'Meeting', value: 'meeting', hide: !activitiesMeetingEnable },
    { label: 'Call', value: 'call', hide: !activitiesCallEnable },
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
      isEmailConfigured: String(!!isEmailConfigured),
    });
    navigate(`${path}?${queryParams.toString()}`);
  };

  // Permission → Create Button Mapping
  const createPermissionMap: Record<string, boolean> = {
    task: !!isActivityTaskCreateEnable,
    email: !!isActivityEmailCreateEnable,
    meeting: !!isActivityMeetingCreateEnable,
    call: !!isActivityCallCreateEnable,
  };

  // Show/Hide Create Button
  const showCreateButton =
    tabParam !== 'all' && !viewDetails && createPermissionMap[tabParam];

  const headerButtons = [
    {
      label: 'New',
      variant: 'outlined' as const,
      disabled:
        accountInActive || (tabParam === 'meeting' && !isEmailConfigured),
      onClick: () => handleCreate(),
      sx: { width: '48px', minWidth: '48px' },
      hide: !showCreateButton,
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
        return getActivityTaskListColumns(
          handleViewActivity,
          taskPermissionMap
        );
      case 'email':
        return getActivityEmailListColumns(
          handleViewActivity,
          emailPermissionMap
        );
      case 'meeting':
        return getActivityMeetingListColumns(
          handleViewActivity,
          meetingPermissionMap
        );
      case 'call':
        return getActivityCallLogListColumns(
          handleViewActivity,
          callPermissionMap
        );
      default:
        return getActivityAllActivityListColumns(
          handleViewActivity,
          allActivityPermissionMaps
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    callPermissionMap,
    emailPermissionMap,
    meetingPermissionMap,
    tabParam,
    taskPermissionMap,
    allActivityPermissionMaps,
  ]);

  const activityEditPermissionByType: Record<ActivityModuleType, boolean> = {
    email: emailActivityFieldsEditable ?? false,
    task: taskActivityFieldsEditable ?? false,
    meeting: meetingActivityFieldsEditable ?? false,
    call: callActivityFieldsEditable ?? false,
  };

  if (
    !activitiesCallEnable &&
    !activitiesEmailEnable &&
    !activitiesMeetingEnable &&
    !activitiesTaskEnable
  )
    return <AccessRestricted />;

  return (
    <div className='w-full'>
      {!isEmailConfigured &&
        !isDetailLoading &&
        (tabParam === 'email' || tabParam === 'meeting') && (
          <div className='flex items-center gap-1.5 h-8 border-b border-[#FFC77B] bg-[#FEF8F0] text-[13px] text-[#2D3E4F] px-3 py-2 border-box'>
            <div>
              <DetailsKeyContactErrorIcon alt='key-contact' />
            </div>
            <div>
              <span className='font-bold mr-1 capitalize'>
                Activities Details
              </span>
              -
              <span className='ml-1 font-medium'>
                {tabParam === 'email'
                  ? 'Global account email configuration is missing. Please set it to enable sending emails.'
                  : 'Global account email configuration is missing. Please set it to enable creating meetings.'}
              </span>
            </div>
          </div>
        )}
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
          searchReset={resetSearch}
          onSearchReset={handleSearchReset}
          showAddActivity={tabParam === 'all'}
          activityMenuItems={activityMenuItems}
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
            {tabParam === 'all' && allActivitiesEnabled && (
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
                activityEditPermissionByType={activityEditPermissionByType}
              />
            )}

            {tabParam === 'task' && activitiesTaskEnable && (
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
                editButtonEnable={taskActivityFieldsEditable}
              />
            )}

            {tabParam === 'email' && activitiesEmailEnable && (
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
                editButtonEnable={emailActivityFieldsEditable}
              />
            )}

            {tabParam === 'meeting' && activitiesMeetingEnable && (
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
                editButtonEnable={meetingActivityFieldsEditable}
              />
            )}

            {tabParam === 'call' && activitiesCallEnable && (
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
                editButtonEnable={callActivityFieldsEditable}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseActivities;
