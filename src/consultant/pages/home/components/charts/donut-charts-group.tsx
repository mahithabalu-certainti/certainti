import React, { useMemo } from 'react';
import { Chart } from 'react-google-charts';
import { Skeleton } from '@mui/material';
import { OverallProjectValueDetail } from '../../../../types/dashboard';
import { blendWithWhite, getDynamicSvgIcon } from '../../helpers';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';

export interface DonutMetricItem {
  country: string;
  projectCost: number;
  fteCost: number;
  subconCost: number;
  nonlaborCost: number;
}

interface DonutChartsGroupProps {
  title: string;
  subtitle?: string;
  data: OverallProjectValueDetail[];
  colors: Record<string, string>;
  minHeight?: number;
  isLoading?: boolean;
}

const DonutChartsGroup: React.FC<DonutChartsGroupProps> = ({
  title,
  subtitle,
  data,
  colors,
  minHeight = 260,
  isLoading = false,
}) => {
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );
  const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  // Transform to DonutMetricItem format using data directly
  const transformedData = useMemo(() => {
    return data.map((item) => ({
      country: item.country_name || item.country_code,
      projectCost: Number(item.total_project_cost),
      fteCost: Number(item.total_fte_cost),
      subconCost: Number(item.total_subcon_cost),
      nonlaborCost: Number(item.total_nonlabor_cost),
    }));
  }, [data]);

  const metrics = [
    { key: 'projectCost', label: 'Total Project Cost' },
    { key: 'fteCost', label: 'FTE Cost' },
    { key: 'subconCost', label: 'SubCon Cost' },
    { key: 'nonlaborCost', label: 'Non-Labor Cost' },
  ];

  const chartOptions = {
    pieHole: 0.55,
    legend: 'none',
    chartArea: { width: '90%', height: '90%' },
    pieSliceText: 'none',
    tooltip: {
      text: 'percentage',
      showColorCode: true,
      isHtml: false,
      trigger: 'focus',
    },
  };

  return (
    <div className='bg-white rounded-lg border border-[#CBD6E2] overflow-hidden'>
      {/* Header with Year Selector */}
      <div className='flex items-center justify-between px-4 py-3 border-b border-[#CBD6E2]'>
        <div className='flex items-center gap-3'>
          <div className='flex-shrink-0'>{getDynamicSvgIcon(title, 26)}</div>
          <div>
            <h3 className='text-xl font-semibold text-[#2A2A2A]'>{title}</h3>
            {subtitle && (
              <p className='text-sm text-[#425A76] mt-0.5'>{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div>
          <div
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4'
            style={{ minHeight }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className='flex flex-col items-center justify-center text-center'
              >
                {/* Donut Skeleton */}
                <div className='relative flex items-center justify-center'>
                  <Skeleton
                    variant='circular'
                    width={160}
                    height={160}
                    sx={{ position: 'relative' }}
                  />
                  <div
                    className='absolute bg-white rounded-full'
                    style={{ width: '88px', height: '88px' }}
                  />
                </div>
                <Skeleton
                  variant='text'
                  width='60%'
                  height={20}
                  sx={{ mt: 2 }}
                />
                <Skeleton
                  variant='text'
                  width='40%'
                  height={16}
                  sx={{ mt: 1 }}
                />
              </div>
            ))}
          </div>
          {/* Legend Skeleton */}
          <div className='flex justify-center gap-6 border-t border-[#CBD6E2] p-3'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='flex items-center gap-2'>
                <Skeleton
                  variant='rectangular'
                  width={14}
                  height={14}
                  sx={{ borderRadius: '3px' }}
                />
                <Skeleton variant='text' width={40} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {transformedData.length > 0 ? (
            <>
              {/* Donut Charts Grid */}
              <div
                className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4'
                style={{ minHeight }}
              >
                {transformedData.map((country, idx) => {
                  // Step 1: Calculate grand total for this country
                  const grandTotal = metrics.reduce((sum, m) => {
                    return (
                      sum + (country[m.key as keyof DonutMetricItem] as number)
                    );
                  }, 0);

                  // Step 2: Calculate percentages
                  const chartData = [
                    ['Metric', 'Value'],
                    ...metrics.map((m) => {
                      const value = country[
                        m.key as keyof DonutMetricItem
                      ] as number;
                      const percentage =
                        grandTotal > 0 ? (value / grandTotal) * 100 : 0;
                      return [m.label, parseFloat(percentage.toFixed(2))];
                    }),
                  ];

                  const colorList = metrics.map((m) =>
                    blendWithWhite(colors[m.key], 0.5)
                  );

                  return (
                    <div
                      key={idx}
                      className='flex flex-col items-center text-center'
                    >
                      <Chart
                        chartType='PieChart'
                        width={'100%'}
                        height={'180px'}
                        data={chartData}
                        options={{ ...chartOptions, colors: colorList }}
                      />
                      <p className='font-semibold text-sm text-[#2A2A2A] mt-2'>
                        {country.country}
                      </p>
                      <p className='text-xs text-[#425A76] mt-1'>
                        {newFiscalYear === 0 ? 'FY-All' : `FY-${newFiscalYear}`}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Shared Legend */}
              <div className='px-4 pb-4 flex flex-wrap justify-center gap-4 border-t border-[#CBD6E2] pt-3'>
                {metrics.map((m) => (
                  <div key={m.key} className='flex items-center gap-2'>
                    <span
                      className='inline-block h-3 w-3 rounded-full'
                      style={{ backgroundColor: colors[m.key] }}
                    />
                    <span className='text-sm text-[#2A2A2A]'>{m.label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className='flex justify-center items-center h-[200px] text-sm text-[#425A76]'>
              No data available
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DonutChartsGroup;
