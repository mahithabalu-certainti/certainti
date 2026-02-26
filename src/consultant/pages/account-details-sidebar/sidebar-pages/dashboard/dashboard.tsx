import React, { useMemo } from 'react';
import { useParams } from 'react-router';
import { accountDetailsProps } from '../../../account-details/utils';
import { GroupedTrendChart } from '../../../home/components/charts';
import { useGetAccountFiscalCost } from '../../../../services/dashboard/dashboard-service';
import { TrendPoint } from '../../../home/components/charts/grouped-trend-chart';

interface DashboardProps {
  accountDetails?: accountDetailsProps;
}

const Dashboard: React.FC<DashboardProps> = ({ accountDetails }) => {
  const { accountid } = useParams();
  const accountName = accountDetails?.accountById?.account_name || 'Account';
  const accountRid = accountDetails?.accountById?.rid || '';

  const { data: fiscalCostData, isLoading } = useGetAccountFiscalCost(
    accountid || accountRid
  );

  const { qreData, expenseData } = useMemo(() => {
    if (!fiscalCostData) return { qreData: [], expenseData: [] };

    const sortedData = [...fiscalCostData].sort(
      (a, b) => a.fiscal_year - b.fiscal_year
    );

    const qreData: TrendPoint[] = sortedData
      .filter((item) => item.qre_cost !== null)
      .map((item) => ({
        year: item.fiscal_year,
        amount: parseFloat(item.qre_cost as string),
      }));

    const expenseData: TrendPoint[] = sortedData.map((item) => ({
      year: item.fiscal_year,
      amount: parseFloat(item.total_project_cost),
    }));

    return { qreData, expenseData };
  }, [fiscalCostData]);

  return (
    <div className='w-full h-full p-6'>
      {/* Common Title */}
      <div className='w-full text-center mb-4'>
        <h2 className='text-2xl font-bold text-[#2A2A2A]'>
          {accountName} - Expense Overview (Last 6 Years)
        </h2>
        <p className='text-sm text-[#425A76] mt-1'>
          Combined Year-on-Year Trend for QRE Expense &amp; Total Expense
        </p>
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center h-96 text-gray-500'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2'></div>
            <p className='text-sm'>Loading data...</p>
          </div>
        </div>
      ) : !isLoading && fiscalCostData?.length === 0 ? (
        <div className='flex justify-center items-center h-[200px] text-sm text-[#425A76]'>
          No data available
        </div>
      ) : (
        <GroupedTrendChart
          title='QRE vs Total Expense'
          series={[
            { name: 'QRE Expense', color: '#84E184', data: qreData },
            { name: 'Total Expense', color: '#FFC966', data: expenseData },
          ]}
        />
      )}
    </div>
  );
};

export default Dashboard;
