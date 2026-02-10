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
} from '../../services/dashboard/dashboard-service';
import { PROJECT_COLORS } from '../../../admin/pages/workflow-builder/form/helper';
import { AccountYearData } from '../../types/dashboard';
import { ReportCard } from './components/cards';
import { AccountChart, DonutChartsGroup } from './components/charts';
import { DONUT_COLORS } from './helpers';

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
    <div className='relative h-full bg-slate-50 p-4 space-y-6'>
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
