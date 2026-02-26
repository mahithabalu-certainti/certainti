import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../../store/store';
import {
  checkPermission,
  navigateWithFilters,
  reshapeGlobalFilter,
} from '../../../common-utils';
import { AllModules, MenuOption } from '../../../common-service';
import { AccessRestricted } from '../../../components/account-restricted';
import { ACCOUNT, CASE, TASKS } from '../../../routes';
import {
  useGetDashboardCountDetails,
  useGetCasesByHealthStatus,
  useGetOverallProjectValue,
  useGetWeeklyProductivity,
  useGetOverdueApprovals,
  useGetUpcomingTasks,
  useGetDueTodayOverdueTasks,
  useGetOpenTasks,
  useGetCompletedTasksThisWeek,
  useGetMeetingList,
  useGetPendingFollowUps,
} from '../../services/dashboard/dashboard-service';
import { useMutation } from '@apollo/client';
import { taskClient } from '../../../api/graphql/clients/client';
import { UPDATE_TASK_SUMMARY_INLINE } from '../../../api/graphql/queries/task-query';
import { useGetTaskStatuses } from '../../services/work-breakdown/work-breakdown-service';
import { useGetCaseFilingTypes } from '../../services/cases/case-service';
import { PROJECT_COLORS } from '../../../admin/pages/workflow-builder/form/helper';
import {
  AccountYearData,
  DashboardTaskDetail,
  OverdueApprovalsDetail,
  WeeklyProductivityDetail,
  DashboardMeetingDetail,
  PendingFollowUpDetail,
  ExportReportType,
} from '../../types/dashboard';
import { CardList, ReportCard, TaskCard } from './components/cards';
import {
  AccountChart,
  DonutChartsGroup,
  WorldMapChart,
} from './components/charts';
import {
  DONUT_COLORS,
  formatDate,
  getTrendColor,
  getTrendIcon,
  getPriorityBadge,
  getStatusBadge,
  formatTo12HourWithMinutes,
} from './helpers';
import { ExportDashboardReport } from '../../services/dashboard/dashboard-service';
import { ClockIcon } from '@mui/x-date-pickers';
import { Tooltip } from '@mui/material';
import { TickIcon } from '../../../assets';
import { useToast } from '../../../hooks';
import dayjs from 'dayjs';
import { FilterState } from '../../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { errorToast } = useToast();
  const [followUpsList, setFollowUpsList] = useState<PendingFollowUpDetail[]>(
    []
  );
  const [selectedFilingType, setSelectedFilingType] =
    useState<string>('Regular');

  // GraphQL mutation
  const [updateTaskSummaryInline] = useMutation(UPDATE_TASK_SUMMARY_INLINE, {
    client: taskClient,
  });

  const { fiscalYear, filters } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);
  const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  // Common payload for all dashboard APIs
  const dashboardPayload = useMemo(
    () => ({
      flag: 'all',
      fiscalYear: newFiscalYear,
      globalFilters: reshapeGlobalFilter(filters as FilterState),
    }),
    [newFiscalYear, filters]
  );

  const userDashboardPayload = useMemo(
    () => ({
      flag: 'user',
      fiscalYear: newFiscalYear,
      globalFilters: reshapeGlobalFilter(filters as FilterState),
    }),
    [newFiscalYear, filters]
  );

  // Meeting payload without fiscalYear
  const meetingPayload = useMemo(
    () => ({
      flag: 'user',
      globalFilters: reshapeGlobalFilter(filters as FilterState),
    }),
    [filters]
  );

  // Permission Mangement
  const { menus, modules } = useSelector(
    (state: RootState) => state.permission
  );
  const isDashboardEnable = checkPermission(menus, MenuOption.DASHBOARD);

  const isCasesEnable = checkPermission(modules, AllModules.CASES);
  const isAccountEnable = checkPermission(modules, AllModules.ACCOUNTS);
  const isCaseTaskEnable = checkPermission(modules, AllModules.WORKBREAKDOWN);
  const isActivityTaskEnable = checkPermission(
    modules,
    AllModules.ACTIVITIES_TASK
  );

  const caseFillingTypes = useGetCaseFilingTypes();
  const caseFilingTypesOptions = useMemo(() => {
    return (
      caseFillingTypes?.data?.data?.caseFilingType?.map((item) => ({
        value: item.filing_type_name,
        label: item.filing_type_name,
      })) || []
    );
  }, [caseFillingTypes]);

  const { data: countDetails, isLoading: isCountsLoading } =
    useGetDashboardCountDetails(dashboardPayload);

  const { data: healthStatusData, isLoading: isHealthLoading } =
    useGetCasesByHealthStatus({
      ...dashboardPayload,
      filingType: selectedFilingType || undefined,
    });

  const { data: overallProjectValue, isLoading: isProjectValueLoading } =
    useGetOverallProjectValue({ ...dashboardPayload, countryType: 'active' });
  const { data: weeklyProductivity, isLoading: isWeeklyProductivityLoading } =
    useGetWeeklyProductivity(userDashboardPayload);
  const { data: overdueApprovals, isLoading: isOverdueLoading } =
    useGetOverdueApprovals(userDashboardPayload);
  const { data: upcomingTasks, isLoading: isUpcomingLoading } =
    useGetUpcomingTasks(userDashboardPayload);
  const { data: dueTodayOverdueTasks, isLoading: isDueTodayLoading } =
    useGetDueTodayOverdueTasks(userDashboardPayload);
  const { data: openTasks, isLoading: isOpenTasksLoading } =
    useGetOpenTasks(userDashboardPayload);
  const { data: completedTasks, isLoading: isCompletedLoading } =
    useGetCompletedTasksThisWeek(userDashboardPayload);
  const { data: meetingList, isLoading: isMeetingsLoading } =
    useGetMeetingList(meetingPayload);
  const { data: pendingFollowUps, isLoading: isPendingFollowUpsLoading } =
    useGetPendingFollowUps(userDashboardPayload);

  const { data: taskStatuses } = useGetTaskStatuses();

  // Update local state when API data changes
  React.useEffect(() => {
    if (pendingFollowUps) {
      setFollowUpsList(pendingFollowUps);
    }
  }, [pendingFollowUps]);

  // Find "Completed" status RID
  const completedStatusRid = useMemo(() => {
    if (!taskStatuses) return null;
    const completedStatus = taskStatuses.find(
      (status) => status.task_status_name.toLowerCase() === 'completed'
    );
    return completedStatus?.rid || null;
  }, [taskStatuses]);

  // Handler to mark task as completed
  const handleMarkCompleted = useCallback(
    async (taskRid: string) => {
      const previousList = [...followUpsList];
      const selectedTask = followUpsList.find((task) => task.rid === taskRid);

      if (!selectedTask) {
        errorToast('Task not found');
        return;
      }
      if (!completedStatusRid) {
        errorToast('Completed status not found');
        return;
      }

      // Optimistic update - immediately mark as completed
      setFollowUpsList((prev) =>
        prev.map((task) =>
          task.rid === taskRid
            ? {
                ...task,
                status_rid: completedStatusRid,
                status_name: 'Completed',
              }
            : task
        )
      );

      const updateData = {
        rid: selectedTask.rid,
        status_rid: completedStatusRid,
        account_rid: selectedTask.account_rid,
        task_rid: selectedTask.task_rid,
        attachment_level: selectedTask.attachment_level,
        attach_to: selectedTask.attach_to || '',
        task_type_name: selectedTask.task_type_name,
      };

      try {
        const res = await updateTaskSummaryInline({
          variables: { data: updateData },
        });
        const result = res.data?.updateTaskSummaryInline;
        if (result?.statusCode === 200 && result.data) {
          const updatedTask = result.data;
          // Confirm update with actual API response
          setFollowUpsList((prev) =>
            prev.map((task) =>
              task.rid === taskRid
                ? {
                    ...task,
                    status_rid: updatedTask.status_rid,
                    status_name: updatedTask.status_name,
                  }
                : task
            )
          );
        } else {
          // Revert on failure
          errorToast(result?.statusMessage || 'Failed to update task status');
          setFollowUpsList(previousList);
        }
      } catch (error) {
        // Revert on error
        errorToast((error as Error)?.message || 'Failed to update task status');
        setFollowUpsList(previousList);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [followUpsList, completedStatusRid]
  );

  const transformedHealthData = React.useMemo<AccountYearData[]>(() => {
    if (!healthStatusData) return [];

    return healthStatusData.map((item) => ({
      account: item.account_name,
      years: [
        {
          year: item.fiscal_year,
          progress: Number(item.case_completion_percentage),
          color: item.colour,
        },
      ],
    }));
  }, [healthStatusData]);

  // Helper function to check if a card is accessible based on permissions
  const isCardAccessible = useCallback(
    (cardKey: string): boolean => {
      if (cardKey === 'active_accounts') {
        return isAccountEnable || false;
      } else if (
        cardKey === 'active_cases' ||
        cardKey === 'total_completed_cases' ||
        cardKey === 'stalled_cases'
      ) {
        return isCasesEnable || false;
      } else if (
        cardKey === 'open_tasks' ||
        cardKey === 'due_today_overdue_tasks' ||
        cardKey === 'upcoming_tasks_7_days' ||
        cardKey === 'tasks_completed_this_week'
      ) {
        return isCaseTaskEnable || false;
      }
      return true;
    },
    [isAccountEnable, isCasesEnable, isCaseTaskEnable]
  );

  // Helper function to get access restricted message
  const getAccessRestrictedMessage = useCallback((cardKey: string): string => {
    let pageName = '';
    if (cardKey === 'active_accounts') {
      pageName = 'Account';
    } else if (
      cardKey === 'active_cases' ||
      cardKey === 'total_completed_cases' ||
      cardKey === 'stalled_cases'
    ) {
      pageName = 'Case';
    } else if (
      cardKey === 'open_tasks' ||
      cardKey === 'due_today_overdue_tasks' ||
      cardKey === 'upcoming_tasks_7_days' ||
      cardKey === 'tasks_completed_this_week'
    ) {
      pageName = 'Task';
    }
    return `Access Restricted: You do not have permission to access the ${pageName} page.\nPlease contact administrator to gain access.`;
  }, []);

  // Helper function to check if a task item is accessible based on its type
  const isTaskItemAccessible = useCallback(
    (task: DashboardTaskDetail | PendingFollowUpDetail): boolean => {
      const taskType = task.task_type_name?.toLowerCase();
      if (taskType === 'activity') {
        return isActivityTaskEnable || false;
      } else if (taskType === 'milestone') {
        return isCaseTaskEnable || false;
      }
      // If type is unknown, allow access if user has any task permission
      return isCaseTaskEnable || isActivityTaskEnable || false;
    },
    [isCaseTaskEnable, isActivityTaskEnable]
  );

  // Helper function to get tooltip message for restricted task items
  const getTaskItemTooltipMessage = useCallback(
    (task: DashboardTaskDetail | PendingFollowUpDetail): string => {
      const taskType = task.task_type_name?.toLowerCase();
      const typeName = taskType === 'activity' ? 'Activity' : 'Case';
      return `Access Restricted: You do not have permission to access ${typeName} tasks.\nPlease contact administrator to gain access.`;
    },
    []
  );

  const handleExport = async (key: ExportReportType) => {
    const payload =
      key === 'meetingList' ? meetingPayload : userDashboardPayload;
    await ExportDashboardReport(key, payload);
  };

  const handleTaskItemClick = useCallback(
    (t: DashboardTaskDetail | PendingFollowUpDetail) => {
      navigateWithFilters(
        navigate,
        TASKS,
        [
          {
            filterKey: 'r_number',
            type: 'text',
            operator: 'equals',
            value: t.r_number,
          },
          {
            filterKey: 'attach_to_name',
            type: 'text',
            operator: 'equals',
            value: t.attached_to,
          },
        ],
        { openTaskId: t.rid, taskType: t.task_type_name?.toLowerCase() }
      );
    },
    [navigate]
  );

  // Handler to navigate to cases page with pre-applied filters
  const handleCardClick = useCallback(
    (cardKey: string) => {
      const tomorrowDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
      const seventhDayDate = dayjs().add(7, 'day').format('YYYY-MM-DD');

      if (cardKey === 'active_accounts') {
        navigateWithFilters(navigate, ACCOUNT, []);
      } else if (cardKey === 'active_cases') {
        navigateWithFilters(navigate, CASE, [
          {
            filterKey: 'status_rid',
            type: 'enum',
            operator: 'in',
            value: ['Audit Review', 'In Progress', 'Submitted'],
          },
        ]);
      } else if (cardKey === 'total_completed_cases') {
        navigateWithFilters(navigate, CASE, [
          {
            filterKey: 'status_rid',
            type: 'enum',
            operator: 'equals',
            value: 'Closed',
          },
        ]);
      } else if (cardKey === 'stalled_cases') {
        navigateWithFilters(navigate, CASE, [
          {
            filterKey: 'status_rid',
            type: 'enum',
            operator: 'equals',
            value: 'On Hold',
          },
        ]);
      } else if (cardKey === 'open_tasks') {
        navigateWithFilters(
          navigate,
          TASKS,
          [
            {
              filterKey: 'status_rid',
              type: 'enum',
              operator: 'in',
              value: ['To Do', 'In Progress'],
            },
          ],
          { taskType: 'milestone' }
        );
      } else if (cardKey === 'due_today_overdue_tasks') {
        navigateWithFilters(
          navigate,
          TASKS,
          [
            {
              filterKey: 'effective_end_datetime',
              type: 'date',
              operator: 'before',
              value: tomorrowDate,
            },
            {
              filterKey: 'status_rid',
              type: 'enum',
              operator: 'in',
              value: ['To Do', 'In Progress'],
            },
          ],
          { taskType: 'milestone' }
        );
      } else if (cardKey === 'upcoming_tasks_7_days') {
        navigateWithFilters(
          navigate,
          TASKS,
          [
            {
              filterKey: 'effective_start_datetime',
              type: 'date',
              operator: 'between',
              value: [tomorrowDate, seventhDayDate],
            },
            {
              filterKey: 'status_rid',
              type: 'enum',
              operator: 'in',
              value: ['To Do', 'In Progress'],
            },
          ],
          { taskType: 'milestone' }
        );
      } else if (cardKey === 'tasks_completed_this_week') {
        const startDate = dayjs().startOf('week').format('YYYY-MM-DD');
        const endDate = dayjs().endOf('week').format('YYYY-MM-DD');

        navigateWithFilters(
          navigate,
          TASKS,
          [
            {
              filterKey: 'status_rid',
              type: 'enum',
              operator: 'equals',
              value: 'Completed',
            },
            {
              filterKey: 'effective_end_datetime',
              type: 'date',
              operator: 'between',
              value: [startDate, endDate],
            },
          ],
          { taskType: 'milestone' }
        );
      }
    },
    [navigate]
  );

  if (!isDashboardEnable) return <AccessRestricted />;

  return (
    <div className='relative bg-slate-50 p-4 space-y-6'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold text-[#2A2A2A]'>Dashboard</h1>
        <p className='text-[#425A76]'>
          Welcome back! Here's your business overview.
        </p>
      </div>

      {/* Dashboard Report Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4'>
        {isCountsLoading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <ReportCard key={index} isLoading={true} />
          ))
        ) : countDetails && countDetails.length > 0 ? (
          countDetails.map((card, index) => {
            const isAccessible = isCardAccessible(card.key);
            return (
              <ReportCard
                key={card.key ?? index}
                title={card.name}
                value={card.count}
                color={PROJECT_COLORS[index % PROJECT_COLORS.length]}
                onClick={() => handleCardClick(card.key)}
                disabled={!isAccessible}
                tooltipMessage={
                  !isAccessible ? getAccessRestrictedMessage(card.key) : ''
                }
              />
            );
          })
        ) : (
          <div className='col-span-full flex justify-center items-center h-[80px] text-sm text-[#425A76] bg-white rounded-lg border border-[#CBD6E2]'>
            No data available
          </div>
        )}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <AccountChart
          title='Cases by Health Status'
          subtitle='Health score and progress across all R&D accounts'
          data={transformedHealthData}
          colors={PROJECT_COLORS}
          isLoading={isHealthLoading}
          filingType={selectedFilingType}
          filingTypeOptions={caseFilingTypesOptions}
          onFilingTypeChange={setSelectedFilingType}
        />

        <CardList
          title='My Meetings'
          subtitle={`${meetingList?.length || 0} Meetings scheduled or recently completed`}
          items={meetingList || []}
          isLoading={isMeetingsLoading}
          exportEnable={true}
          exportKey='meetingList'
          handleExport={handleExport}
          itemRenderer={(item: DashboardMeetingDetail) => {
            const statusBadge = getStatusBadge(item.status_name);
            const levelColor =
              item.attachment_level?.toLowerCase() === 'account'
                ? { bg: '#EFF6FF', text: '#1D4ED8' }
                : item.attachment_level?.toLowerCase() === 'case'
                  ? { bg: '#F0FDF4', text: '#15803D' }
                  : { bg: '#FFF7ED', text: '#C2410C' };

            return (
              <div>
                <div className='flex items-start justify-between gap-3'>
                  <p className='text-sm font-semibold text-[#2A2A2A] flex-1'>
                    {item.subject}
                  </p>
                  <div
                    className='px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap capitalize flex-shrink-0'
                    style={{
                      backgroundColor: statusBadge.bg,
                      color: statusBadge.text,
                    }}
                  >
                    {item.status_name}
                  </div>
                </div>
                <div className='flex items-center gap-2 mt-1 text-[11px] text-[#425a76cf]'>
                  <span>
                    {formatDate(item.effective_start_datetime)} at{' '}
                    {formatTo12HourWithMinutes(item.effective_start_time)}
                  </span>
                  {item.attachment_level && (
                    <span
                      className='px-2 py-0.5 rounded text-[10px] font-semibold capitalize'
                      style={{
                        backgroundColor: levelColor.bg,
                        color: levelColor.text,
                      }}
                    >
                      {item.attachment_level}
                    </span>
                  )}
                </div>
                {item.attached_to && (
                  <div className='text-[11px] text-[#425A76] font-medium mt-1'>
                    <span className='text-[#2a2a2a]'>Related To:</span>{' '}
                    {item.attached_to}
                  </div>
                )}
                <div className='text-[11px] text-[#425A76] font-medium mt-1'>
                  <span className='text-[#2a2a2a]'>Attendees:</span>{' '}
                  {item.meeting_participants?.map((p) => p.name).join(', ') ||
                    'None'}
                </div>
              </div>
            );
          }}
        />

        <CardList
          title='Weekly Productivity'
          subtitle={`Productivity items tracked this week`}
          items={weeklyProductivity || []}
          isLoading={isWeeklyProductivityLoading}
          exportEnable={true}
          exportKey='weeklyProductivity'
          handleExport={handleExport}
          itemRenderer={(item: WeeklyProductivityDetail) => {
            const percentage =
              (Number(item.count) / Number(item.total)) * 100 || 0;

            const trendStatus =
              percentage >= 75 ? 'up' : percentage >= 25 ? 'stable' : 'down';

            return (
              <div className='flex items-start justify-between gap-3'>
                <div className='flex-1'>
                  <p className='text-sm font-semibold text-[#2A2A2A]'>
                    {item.category}
                  </p>
                  <div className='flex items-center gap-3'>
                    <div className='flex-1'>
                      <div className='w-full bg-gray-200 rounded-full h-2'>
                        <div
                          className='bg-[#32cd3287] h-2 rounded-full'
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <span className='text-sm font-semibold text-[#2A2A2A] whitespace-nowrap'>
                      {item.count}/{item.total} {item.unit}
                    </span>
                  </div>
                </div>
                <div
                  className={`text-lg w-5 h-10 flex items-center justify-center font-bold ${getTrendColor(trendStatus)}`}
                >
                  {getTrendIcon(trendStatus)}
                </div>
              </div>
            );
          }}
        />

        <CardList
          title='Pending Follow-ups'
          subtitle={`${followUpsList?.filter((task) => task.status_name?.toLowerCase() !== 'completed').length || 0} Follow-ups awaiting response`}
          items={followUpsList || []}
          isLoading={isPendingFollowUpsLoading}
          exportEnable={true}
          exportKey='pendingFollowUps'
          handleExport={handleExport}
          onItemClick={handleTaskItemClick}
          isItemDisabled={(item) => !isTaskItemAccessible(item)}
          getItemTooltipMessage={getTaskItemTooltipMessage}
          itemRenderer={(item) => {
            const priorityBadge = item.priority_name
              ? getPriorityBadge(item.priority_name)
              : null;
            const isCompleted = item.status_name?.toLowerCase() === 'completed';

            return (
              <div className={isCompleted ? 'opacity-60' : ''}>
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex-1'>
                    <p
                      className={`text-sm font-semibold text-[#2A2A2A] ${
                        isCompleted ? 'line-through' : ''
                      }`}
                    >
                      {item.task_name}
                    </p>

                    <div
                      className={`text-[11px] mt-0.5 text-[#425a76cf] ${
                        isCompleted ? 'line-through' : ''
                      }`}
                    >
                      Due: {formatDate(item.effective_end_datetime)}
                    </div>
                  </div>

                  {/* Priority Badge */}
                  {item.priority_name && priorityBadge && (
                    <div
                      className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                        isCompleted ? 'line-through' : ''
                      }`}
                      style={{
                        backgroundColor: priorityBadge.bg,
                        color: priorityBadge.text,
                      }}
                    >
                      {item.priority_name}
                    </div>
                  )}

                  {/* Complete Button */}
                  <Tooltip
                    title={isCompleted ? 'Completed' : 'Mark as complete'}
                    arrow
                    placement='top'
                  >
                    <button
                      onClick={() => handleMarkCompleted(item.rid)}
                      disabled={isCompleted}
                      style={{
                        background: 'none',
                        border: 'none',
                        marginTop: '2px',
                        cursor: isCompleted ? 'default' : 'pointer',
                      }}
                    >
                      {isCompleted ? (
                        <React.Suspense fallback={null}>
                          <TickIcon className='w-[16px] h-[16px] [&_*]:!fill-[#00A63E]' />
                        </React.Suspense>
                      ) : (
                        <div className='w-[15px] h-[15px] border border-[#CBD6E2] rounded-[2px] cursor-pointer'></div>
                      )}
                    </button>
                  </Tooltip>
                </div>

                {/* Footer Row */}
                <div className='w-full flex items-center justify-between mt-1 text-[11px]'>
                  <span
                    className={`text-[#425a76cf] ${isCompleted ? 'line-through' : ''}`}
                  >
                    <strong>Assigned:</strong> {item.assigned_to_name}
                  </span>

                  <span
                    className={`text-[#425a76cf] font-bold ${
                      isCompleted ? 'line-through' : ''
                    }`}
                  >
                    {item.account_name} / FY-{item.fiscal_year}
                  </span>
                </div>
              </div>
            );
          }}
        />

        <CardList
          title='Overdue Approvals'
          subtitle={`${overdueApprovals?.length || 0} Approval requests overdue`}
          items={overdueApprovals || []}
          isLoading={isOverdueLoading}
          exportEnable={true}
          exportKey='overdueApprovals'
          handleExport={handleExport}
          onItemClick={handleTaskItemClick}
          isItemDisabled={(item) => !isTaskItemAccessible(item)}
          getItemTooltipMessage={getTaskItemTooltipMessage}
          itemRenderer={(item: OverdueApprovalsDetail) => {
            const daysOverdue = Math.max(
              0,
              Math.floor(
                (new Date().getTime() -
                  new Date(item.effective_end_datetime).getTime()) /
                  (1000 * 3600 * 24)
              )
            );
            return (
              <div>
                <div className='flex items-start justify-between gap-3 mb-1'>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold text-[#2A2A2A] truncate'>
                      {item.task_name}
                    </p>
                    <p className='text-[11px] text-[#425a76cf] mt-1'>
                      By: {item.assigned_to_name || 'N/A'}
                    </p>
                  </div>
                  <div className='flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap flex-shrink-0'>
                    <ClockIcon className='w-3 h-3 p-0.5' />
                    {daysOverdue}d overdue
                  </div>
                </div>
                <div className='flex items-start justify-between text-[11px] text-[#425a76cf] gap-2'>
                  <div className='flex items-center gap-2 flex-1 min-w-0'>
                    <p className='text-[11px] mt-0.5 font-semibold text-[#425a76cf] truncate'>
                      <span className='text-[#425A76]'>Submitted On:</span>{' '}
                      {formatDate(item.effective_start_datetime)}
                    </p>
                  </div>
                  <span className='font-bold whitespace-nowrap flex-shrink-0'>
                    {item.account_name} / FY-{`${item.fiscal_year}`}
                  </span>
                </div>
              </div>
            );
          }}
        />

        <TaskCard
          title='Upcoming Tasks (Next 7 Days)'
          subtitle={`${upcomingTasks?.length || 0} Tasks starting soon`}
          items={upcomingTasks || []}
          isLoading={isUpcomingLoading}
          exportEnable={true}
          exportKey='upcomingTasks'
          handleExport={handleExport}
          onItemClick={handleTaskItemClick}
          isItemDisabled={(item) => !isTaskItemAccessible(item)}
          getItemTooltipMessage={getTaskItemTooltipMessage}
          mapItem={(t: DashboardTaskDetail) => ({
            title: t.task_name,
            attachedTo: t.attached_to,
            assignee: t.assigned_to_name,
            priority: t.priority_name || undefined,
            status: t.status,
            date: formatDate(t.effective_end_datetime),
            highlightDate: false,
            account: t.account_name,
            fiscalYear: t.fiscal_year,
            avatar: t.profile_url || undefined,
          })}
        />

        <TaskCard
          title='Due Today / Overdue Tasks'
          subtitle={`${dueTodayOverdueTasks?.length || 0} Tasks need immediate attention`}
          items={dueTodayOverdueTasks || []}
          isLoading={isDueTodayLoading}
          exportEnable={true}
          exportKey='dueTodayOverdueTasks'
          handleExport={handleExport}
          onItemClick={handleTaskItemClick}
          isItemDisabled={(item) => !isTaskItemAccessible(item)}
          getItemTooltipMessage={getTaskItemTooltipMessage}
          mapItem={(t: DashboardTaskDetail) => ({
            title: t.task_name,
            attachedTo: t.attached_to,
            assignee: t.assigned_to_name,
            priority: t.priority_name || undefined,
            status: t.status,
            date: formatDate(t.effective_end_datetime),
            highlightDate: true,
            isOverdue:
              new Date(t.effective_end_datetime) <
              new Date(new Date().toDateString()),
            isToday:
              new Date(t.effective_end_datetime).toDateString() ===
              new Date().toDateString(),
            account: t.account_name,
            fiscalYear: t.fiscal_year,
            avatar: t.profile_url || undefined,
          })}
        />

        <TaskCard
          title='Open Tasks'
          subtitle={`${openTasks?.length || 0} Currently active tasks`}
          items={openTasks || []}
          isLoading={isOpenTasksLoading}
          exportEnable={true}
          exportKey='openTasks'
          handleExport={handleExport}
          onItemClick={handleTaskItemClick}
          isItemDisabled={(item) => !isTaskItemAccessible(item)}
          getItemTooltipMessage={getTaskItemTooltipMessage}
          mapItem={(t: DashboardTaskDetail) => ({
            title: t.task_name,
            attachedTo: t.attached_to,
            assignee: t.assigned_to_name,
            priority: t.priority_name || undefined,
            status: t.status,
            date: formatDate(t.effective_end_datetime),
            highlightDate: false,
            account: t.account_name,
            fiscalYear: t.fiscal_year,
            avatar: t.profile_url || undefined,
          })}
        />

        <TaskCard
          title='Completed Tasks This Week'
          subtitle={`${completedTasks?.length || 0} Tasks completed this week`}
          items={completedTasks || []}
          isLoading={isCompletedLoading}
          exportEnable={true}
          exportKey='completedTasksThisWeek'
          handleExport={handleExport}
          onItemClick={handleTaskItemClick}
          isItemDisabled={(item) => !isTaskItemAccessible(item)}
          getItemTooltipMessage={getTaskItemTooltipMessage}
          mapItem={(t: DashboardTaskDetail) => ({
            title: t.task_name,
            attachedTo: t.attached_to,
            assignee: t.assigned_to_name,
            priority: t.priority_name || undefined,
            status: t.status,
            date: formatDate(t.effective_end_datetime),
            highlightDate: false,
            account: t.account_name,
            fiscalYear: t.fiscal_year,
            avatar: t.profile_url || undefined,
          })}
        />
      </div>

      <DonutChartsGroup
        title='Overall Project Value by Jurisdiction'
        subtitle='Aggregate Total R&D project value across all jurisdictions.'
        data={overallProjectValue || []}
        colors={DONUT_COLORS}
        isLoading={isProjectValueLoading}
      />

      <WorldMapChart
        title='Global Level'
        subtitle='Click on any country to view detailed account information'
      />
    </div>
  );
};

export default HomePage;
