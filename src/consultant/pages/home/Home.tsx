import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { checkPermission } from '../../../common-utils';
import { MenuOption } from '../../../common-service';
import { AccessRestricted } from '../../../components/account-restricted';
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
} from '../../services/dashboard/dashboard-service';
import { PROJECT_COLORS } from '../../../admin/pages/workflow-builder/form/helper';
import {
  AccountYearData,
  DashboardTaskDetail,
  OverdueApprovalsDetail,
  WeeklyProductivityDetail,
} from '../../types/dashboard';
import { CardList, ReportCard, TaskCard } from './components/cards';
import { AccountChart, DonutChartsGroup } from './components/charts';
import {
  DONUT_COLORS,
  formatDate,
  getTrendColor,
  getTrendIcon,
} from './helpers';
import { ClockIcon } from '@mui/x-date-pickers';

export const HomePage: React.FC = () => {
  const [selectedYear, setSelectedYear] = React.useState('all');
  const [donutFiscalYear, setDonutFiscalYear] = React.useState('all');

  // Permission Mangement
  const { menus } = useSelector((state: RootState) => state.permission);
  const isDashboardEnable = checkPermission(menus, MenuOption.DASHBOARD);

  const { data: countDetails, isLoading: isCountsLoading } =
    useGetDashboardCountDetails('all');

  const { data: healthStatusData, isLoading: isHealthLoading } =
    useGetCasesByHealthStatus(
      'all',
      selectedYear === 'all' ? undefined : Number(selectedYear)
    );

  const { data: overallProjectValue, isLoading: isProjectValueLoading } =
    useGetOverallProjectValue(
      'all',
      donutFiscalYear === 'all' ? undefined : Number(donutFiscalYear)
    );
  const { data: weeklyProductivity, isLoading: isWeeklyProductivityLoading } =
    useGetWeeklyProductivity('all');
  const { data: overdueApprovals, isLoading: isOverdueLoading } =
    useGetOverdueApprovals('all');
  const { data: upcomingTasks, isLoading: isUpcomingLoading } =
    useGetUpcomingTasks('all');
  const { data: dueTodayOverdueTasks, isLoading: isDueTodayLoading } =
    useGetDueTodayOverdueTasks('all');
  const { data: openTasks, isLoading: isOpenTasksLoading } =
    useGetOpenTasks('all');
  const { data: completedTasks, isLoading: isCompletedLoading } =
    useGetCompletedTasksThisWeek('all');

  const transformedHealthData = React.useMemo<AccountYearData[]>(() => {
    if (!healthStatusData) return [];

    const grouped = healthStatusData.reduce<Record<string, AccountYearData>>(
      (acc, item) => {
        const id = item.account_rid;
        if (!acc[id]) {
          acc[id] = {
            account: item.account_name,
            years: [],
          };
        }
        acc[id].years.push({
          year: item.fiscal_year,
          progress: Number(item.progress),
        });
        return acc;
      },
      {}
    );

    return Object.values(grouped);
  }, [healthStatusData]);

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
        {isCountsLoading
          ? Array.from({ length: 8 }).map((_, index) => (
              <ReportCard key={index} isLoading={true} />
            ))
          : countDetails?.map((card, index) => (
              <ReportCard
                key={index}
                title={card.name}
                value={card.count}
                color={PROJECT_COLORS[index % PROJECT_COLORS.length]}
              />
            ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <AccountChart
          title='Cases by Health Status'
          subtitle='Health score and progress across all R&D accounts'
          data={transformedHealthData}
          colors={PROJECT_COLORS}
          isLoading={isHealthLoading}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />
        <CardList
          title='Weekly Productivity'
          subtitle={`${weeklyProductivity?.length || 0} Productivity items tracked this week`}
          items={weeklyProductivity || []}
          isLoading={isWeeklyProductivityLoading}
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
          title='Overdue Approvals'
          subtitle={`${overdueApprovals?.length || 0} Approvals requests overdue`}
          items={overdueApprovals || []}
          isLoading={isOverdueLoading}
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
                  <div className='flex-1'>
                    <p className='text-sm font-semibold text-[#2A2A2A]'>
                      {item.task_name}
                    </p>
                    <p className='text-[11px] text-[#425a76cf] mt-1'>
                      By: {item.assigned_to_name || 'N/A'}
                    </p>
                  </div>
                  <div className='flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap'>
                    <ClockIcon className='w-3 h-3 p-0.5' />
                    {daysOverdue}d overdue
                  </div>
                </div>
                <div className='flex items-start justify-between text-[11px] text-[#425a76cf]'>
                  <div className='flex items-center gap-2 flex-1'>
                    <p className='text-[11px] mt-0.5 font-semibold text-[#425a76cf]'>
                      <span className='text-[#425A76]'>Submitted On:</span>{' '}
                      {formatDate(item.effective_start_datetime)}
                    </p>
                  </div>
                  <span className='font-bold'>
                    {item.account_name} / FY-{`${item.fiscal_year}`}
                  </span>
                </div>
              </div>
            );
          }}
        />

        <TaskCard
          title='Tasks Due Today / Overdue'
          subtitle={`${dueTodayOverdueTasks?.length || 0} Tasks due today or overdue`}
          items={dueTodayOverdueTasks || []}
          isLoading={isDueTodayLoading}
          mapItem={(t: DashboardTaskDetail) => ({
            title: t.task_name,
            description: t.case_name,
            assignee: t.assigned_to_name,
            priority: t.priority_name || 'Normal',
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
          })}
        />

        <TaskCard
          title='Upcoming Tasks'
          subtitle={`${upcomingTasks?.length || 0} Tasks starting soon`}
          items={upcomingTasks || []}
          isLoading={isUpcomingLoading}
          mapItem={(t: DashboardTaskDetail) => ({
            title: t.task_name,
            description: t.case_name,
            assignee: t.assigned_to_name,
            priority: t.priority_name || 'Normal',
            status: t.status,
            date: formatDate(t.effective_end_datetime),
            highlightDate: false,
            account: t.account_name,
            fiscalYear: t.fiscal_year,
          })}
        />

        <TaskCard
          title='Open Tasks'
          subtitle={`${openTasks?.length || 0} Currently active tasks`}
          items={openTasks || []}
          isLoading={isOpenTasksLoading}
          mapItem={(t: DashboardTaskDetail) => ({
            title: t.task_name,
            description: t.case_name,
            assignee: t.assigned_to_name,
            priority: t.priority_name || 'Normal',
            status: t.status,
            date: formatDate(t.effective_end_datetime),
            highlightDate: false,
            account: t.account_name,
            fiscalYear: t.fiscal_year,
          })}
        />

        <TaskCard
          title='Completed Tasks This Week'
          subtitle={`${completedTasks?.length || 0} Tasks finished recently`}
          items={completedTasks || []}
          isLoading={isCompletedLoading}
          mapItem={(t: DashboardTaskDetail) => ({
            title: t.task_name,
            description: t.case_name,
            assignee: t.assigned_to_name,
            priority: t.priority_name || 'Normal',
            status: t.status,
            date: formatDate(t.effective_end_datetime),
            highlightDate: false,
            account: t.account_name,
            fiscalYear: t.fiscal_year,
          })}
        />
      </div>

      <DonutChartsGroup
        title='Overall Project Value by Jurisdiction'
        subtitle='Aggregate Total R&D project value across all jurisdictions.'
        data={overallProjectValue || []}
        colors={DONUT_COLORS}
        isLoading={isProjectValueLoading}
        selectedYear={donutFiscalYear}
        onYearChange={setDonutFiscalYear}
      />
    </div>
  );
};

export default HomePage;
