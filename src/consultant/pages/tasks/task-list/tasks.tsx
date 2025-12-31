/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AccountSettingsIcon,
  ActionIcon,
  NewFilterIcon,
  ProjectDetailsIcon,
  RefreshIcon,
} from '../../../../assets';
import { ActionsDropdown } from '../../../../components';
import { TasksListURLParams } from '../../../types/task';
import { TaskTable } from './table/task-table';
import SectionHeaderTab from '../../../../components/side-menu-panel/section-header-tab';
import Filter from '../../account-details-sidebar/components/filter/filter';
import {
  AllModules,
  AllPermissions,
  useGetAllDocumentInfo,
  useGetDocumentCategoryType,
  useGetStatus,
} from '../../../../common-service';
import {
  checkPermission,
  getFiscalYears,
  reshapeGlobalFilter,
} from '../../../../common-utils';
import { FilterState, SelectOption } from '../../../types';
import { exportTasksData } from '../../../services/tasks/tasks-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { FilterValue } from '../../account-details-sidebar/components/filter/filterType';
import { AccessRestricted } from '../../../../components/account-restricted';
import SearchBar from '../../../../components/search/search-bar';
import { getTaskFilterFields } from './table/filter-fields';
import {
  transformPriorityData,
  transformStatusData,
} from '../../case/case-details/work-breakdown/helper';
import {
  useGetTaskPriorities,
  useGetTaskStatuses,
} from '../../../services/work-breakdown/work-breakdown-service';
import { useGetActivityStatus } from '../../../services/activities/activities-service';
import { getPermissionMap } from '../../activities/activities-list/helper';

export const Tasks: React.FC = () => {
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState(Date.now());
  const [searchText, setSearchText] = useState<string>('');
  const [searchKey, setSearchKey] = useState<number>(0);
  const [tableParams, setTableParams] = useState<TasksListURLParams>({
    page: page,
    limit: 100,
    sortBy: 'r_number',
    sortOrder: 'ASC',
    fiscalYear: 0,
    isGlobal: true,
  });
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'milestone';

  const { fiscalYear, filters } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);
  const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const onRefreshClick = () => {
    setRefreshTrigger(Date.now());
  };

  // Permission Management
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );

  const isWorkBreakdownEnable = checkPermission(
    modules,
    AllModules.WORKBREAKDOWN
  );

  const isActivityTaskEnable = checkPermission(
    modules,
    AllModules.ACTIVITIES_TASK
  );

  const tabs = useMemo(() => {
    const list = [];
    if (isWorkBreakdownEnable) {
      list.push({ label: 'Case Tasks', value: 'milestone' });
    }
    if (isActivityTaskEnable) {
      list.push({ label: 'Activities', value: 'activity' });
    }
    return list;
  }, [isWorkBreakdownEnable, isActivityTaskEnable]);

  useEffect(() => {
    if (!isWorkBreakdownEnable && tabParam === 'milestone') {
      if (isActivityTaskEnable) {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('tab', 'activity');
        setSearchParams(newParams, { replace: true });
      }
    } else if (!isActivityTaskEnable && tabParam === 'activity') {
      if (isWorkBreakdownEnable) {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('tab', 'milestone');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [
    isWorkBreakdownEnable,
    isActivityTaskEnable,
    tabParam,
    searchParams,
    setSearchParams,
  ]);

  const taskPermissionMap = useMemo(
    () => getPermissionMap(permission, AllPermissions.ACTIVITY_TASK_VIEW_EDIT),
    [permission]
  );

  const milestonePermissionMap = useMemo(
    () =>
      getPermissionMap(
        permission,
        AllPermissions.CASES_WORKBREAKDOWN_VIEW_EDIT
      ),
    [permission]
  );

  const accountPermissionMap = useMemo(
    () => getPermissionMap(permission, AllPermissions.ACCOUNTS_VIEW_EDIT),
    [permission]
  );

  const isMilestoneExportEnable = checkPermission(
    permission,
    AllPermissions.CASES_WORKBREAKDOWN_EXPORT
  );

  const isActivityTaskExportEnable = checkPermission(
    permission,
    AllPermissions.ACTIVITY_TASK_EXPORT
  );

  const currentPermissionMap =
    tabParam === 'milestone' ? milestonePermissionMap : taskPermissionMap;

  const isCurrentTabExportEnable =
    tabParam === 'milestone'
      ? isMilestoneExportEnable
      : isActivityTaskExportEnable;

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen ? 'all-project-filter-popover' : undefined;

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen
    ? 'attachment-column-visibility-popover'
    : undefined;

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'r_number';
    const defaultSortOrder = 'ASC';
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    if (!sortBy) {
      setSortFilterCount(0);
      setTableParams((prev) => ({
        ...prev,
        sortBy: defaultSortField,
        sortOrder: defaultSortOrder,
      }));
    } else {
      setSortFilterCount(1);
      setTableParams((prev) => ({
        ...prev,
        sortBy,
        sortOrder: apiOrder,
      }));
    }
  };

  const handleExport = () => {
    const projectParams = {
      sortBy: tableParams.sortBy,
      sortOrder: tableParams.sortOrder,
      filters: appliedFilters,
      fiscalYear: newFiscalYear,
      globalFilters: reshapeGlobalFilter(filters as FilterState),
      search: searchText || undefined,
    };
    exportTasksData(tabParam as 'milestone' | 'activity', projectParams);
  };

  const minYear = 1950;
  const currentYear = new Date().getFullYear();
  const fiscalYears = getFiscalYears(currentYear - minYear + 1);
  const allDocumentInfo = useGetAllDocumentInfo();
  const categoryTypes = useGetDocumentCategoryType(currentCategory);

  const memoizedDocumentTypes: SelectOption[] = useMemo(
    () =>
      categoryTypes.data?.data.documentTypes.map((type) => ({
        label: type.type_name,
        value: type.rid,
      })) || [],
    [categoryTypes.data?.data.documentTypes]
  );

  const memoizedDocumentCategories: SelectOption[] = useMemo(
    () =>
      allDocumentInfo.data?.data.documentCategories.map((category) => ({
        label: category.category_name,
        value: category.rid,
      })) || [],
    [allDocumentInfo.data?.data.documentCategories]
  );

  const handleCategory = (fieldName: string, value: FilterValue) => {
    if (fieldName === 'document_category_rid' && value) {
      setCurrentCategory(String(value));
    }
  };

  const fieldOptions = {
    fiscalYears: fiscalYears,
    docCategories: memoizedDocumentCategories,
    docTypes: memoizedDocumentTypes,
    docTypesLoading: categoryTypes.isLoading,
  };

  const prioritiesQuery = useGetTaskPriorities();
  const statusesQuery = useGetTaskStatuses();
  const activityStatusesQuery = useGetActivityStatus('Task');
  const accountStatusQuery = useGetStatus();

  const priorityOptions = useMemo(
    () =>
      transformPriorityData(prioritiesQuery.data || []).map((priority) => ({
        label: priority.name,
        value: priority.id,
      })),
    [prioritiesQuery.data]
  );

  const statusOptions = useMemo(() => {
    if (tabParam === 'milestone') {
      return transformStatusData(statusesQuery.data || []).map((status) => ({
        label: status.name,
        value: status.id,
      }));
    } else {
      const activityStatuses =
        activityStatusesQuery.data?.data?.activityStatus || [];
      return activityStatuses.map((status: any) => ({
        label: status.status_name,
        value: status.rid,
      }));
    }
  }, [tabParam, statusesQuery.data, activityStatusesQuery.data]);

  const accountStatusOptions = useMemo(
    () =>
      accountStatusQuery?.data?.data?.status.map((status) => ({
        label: status.status_name,
        value: status.rid,
      })) || [],
    [accountStatusQuery?.data?.data?.status]
  );

  const TaskFilterFields = useMemo(
    () =>
      getTaskFilterFields(
        priorityOptions,
        statusOptions,
        [], // assigneeOptions - currently empty for global list
        accountStatusOptions,
        currentPermissionMap,
        accountPermissionMap
      ),
    [
      priorityOptions,
      statusOptions,
      accountStatusOptions,
      currentPermissionMap,
      accountPermissionMap,
    ]
  );

  const menuItems = [
    {
      label: 'Manage tasks',
      onClick: () => console.log('Manage tasks clicked'),
      hide: true,
    },
    {
      label: 'Export',
      onClick: () => handleExport(),
      hide: !isCurrentTabExportEnable,
    },
  ];

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  if (!isWorkBreakdownEnable && !isActivityTaskEnable)
    return <AccessRestricted />;

  const handleTabChange = (value: string) => {
    setSearchText('');
    setSearchKey((prev) => prev + 1);
    setPage(1);
    setTableParams((prev) => ({
      ...prev,
      page: 1,
      search: undefined,
    }));
    setAppliedFilters({});
    searchParams.set('tab', value);
    setSearchParams(searchParams, { replace: true });
  };

  return (
    <div className='flex flex-col w-full  h-full'>
      <div className='flex items-center justify-between w-full h-[55px] min-h-[55px] max-h-[55px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <ProjectDetailsIcon
              alt='menu-icon'
              className='h-7 w-7 bg-[#d16dd3] p-[7px] rounded'
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-bold text-[16px] text-[#2D3E4F]'>Tasks</div>
              <div className='font-semibold text-[#7D98B6] text-[12px] -mt-1'>
                {`${totalCount} items`}
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'>
          <ActionsDropdown actions={menuItems} />
          <div
            className='flex items-center justify-center border border-[#CBD6E2] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] w-[24px] h-[23px] cursor-pointer'
            onClick={onRefreshClick}
          >
            <RefreshIcon alt='refresh-icon' className='h-4' />
          </div>
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
            key={searchKey}
            initialSearchText={searchText}
            onSearch={(value) => {
              setSearchText(value);
              setTableParams((prevParams) => {
                const newParams = { ...prevParams };
                if (value) {
                  newParams.search = value;
                } else {
                  delete newParams.search;
                }
                return newParams;
              });
            }}
            placeholder='Search'
            disabled={false}
            hide={false}
            setCurrentPage={(pageNo) => {
              setPage(pageNo + 1);
              setTableParams((prev) => ({
                ...prev,
                page: pageNo + 1,
              }));
            }}
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
              value='global-tasks'
              isOpen={isFilterOpen}
              filterAnchorEl={anchorEl}
              filterId={filterId}
              filterMenu={TaskFilterFields}
              setAppliedFilters={setAppliedFilters}
              handleCloseFilter={handleCloseFilter}
              setCurrentPage={(pageNo) => {
                setPage(pageNo + 1);
                setTableParams((prev) => ({
                  ...prev,
                  page: pageNo + 1,
                }));
              }}
              handleSorting={handleSorting}
              onFilterChange={handleCategory}
            />
          </Suspense>
        </div>
      </div>

      <SectionHeaderTab
        tabs={tabs}
        onTabChange={handleTabChange}
        defaultValue={tabParam}
      />

      <div className='border border-[#CBD6E2] border-t-0'>
        {tabParam === 'milestone' && isWorkBreakdownEnable && (
          <TaskTable
            appliedFilters={appliedFilters}
            tableParams={tableParams}
            setTableParams={setTableParams}
            setTotalCount={setTotalCount}
            refreshTrigger={refreshTrigger}
            fieldOptions={fieldOptions}
            setCurrentCategory={setCurrentCategory}
            setColumnAnchorEl={setColumnAnchorEl}
            columnAnchorEl={columnAnchorEl}
            searchValue={searchText}
            taskType='milestone'
          />
        )}
        {tabParam === 'activity' && isActivityTaskEnable && (
          <TaskTable
            appliedFilters={appliedFilters}
            tableParams={tableParams}
            setTableParams={setTableParams}
            setTotalCount={setTotalCount}
            refreshTrigger={refreshTrigger}
            fieldOptions={fieldOptions}
            setCurrentCategory={setCurrentCategory}
            setColumnAnchorEl={setColumnAnchorEl}
            columnAnchorEl={columnAnchorEl}
            searchValue={searchText}
            taskType='activity'
          />
        )}
      </div>
    </div>
  );
};

export default Tasks;
