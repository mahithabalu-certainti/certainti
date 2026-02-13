import React, { useMemo } from 'react';
import { Chart } from 'react-google-charts';
import { MenuItem, Select, Skeleton } from '@mui/material';
import { OverallProjectValueDetail } from '../../../../types/dashboard';
import {
  blendWithWhite,
  COMMON_MENU_PROPS,
  getDynamicSvgIcon,
  getSelectStyles,
} from '../../helpers';
import { getFiscalYears } from '../../../../../common-utils';

export interface DonutMetricItem {
  country: string;
  projectCost: number;
  qualifiedCost: number;
  qreCost: number;
  computed: number;
  submitted: number;
  approved: number;
}

interface DonutChartsGroupProps {
  title: string;
  subtitle?: string;
  data: OverallProjectValueDetail[];
  colors: Record<string, string>;
  minHeight?: number;
  isLoading?: boolean;
  selectedYear: string;
  onYearChange: (year: string) => void;
}

const DonutChartsGroup: React.FC<DonutChartsGroupProps> = ({
  title,
  subtitle,
  data,
  colors,
  minHeight = 260,
  isLoading = false,
  selectedYear,
  onYearChange,
}) => {
  const minYear = 1950;
  const currentYear = new Date().getFullYear();
  const fiscalYears = getFiscalYears(currentYear - minYear + 1);

  // Transform to DonutMetricItem format using data directly
  const transformedData = useMemo(() => {
    return data.map((item) => ({
      country: item.country_name || item.country_code,
      projectCost: Number(item.total_project_cost),
      qualifiedCost: Number(item.qualified_project_cost),
      qreCost: Number(item.qre_cost),
      computed: Number(item.final_credit_computed),
      submitted: Number(item.final_credit_submitted),
      approved: Number(item.final_credit_approved),
    }));
  }, [data]);

  const metrics = [
    { key: 'projectCost', label: 'Total Project Cost' },
    { key: 'qualifiedCost', label: 'Qualified Project Cost' },
    { key: 'qreCost', label: 'QRE Cost' },
    { key: 'computed', label: 'RD Credits Computed' },
    { key: 'submitted', label: 'RD Credits Submitted' },
    { key: 'approved', label: 'RD Credits Approved' },
  ];

  const chartOptions = {
    pieHole: 0.55,
    legend: 'none',
    chartArea: { width: '90%', height: '90%' },
    pieSliceText: 'none',
    tooltip: {
      text: 'percentage',
      showColorCode: true,
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

        {/* Year Selector */}
        <Select
          value={selectedYear}
          onChange={(e) => onYearChange(e.target.value as string)}
          displayEmpty
          size='small'
          className='custom-select-no-arrow w-[150px] max-w-[150px] sm:text-sm'
          MenuProps={COMMON_MENU_PROPS}
          sx={getSelectStyles(false, false)}
        >
          <MenuItem
            value='all'
            sx={{ color: '#425A76', fontSize: '13px', fontWeight: 500 }}
          >
            Last 4 Years
          </MenuItem>
          {fiscalYears.map((year, i) => (
            <MenuItem
              key={`${year.value}-${i}`}
              value={year.value}
              title={year.label}
              sx={{
                color: '#425A76',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {year.label}
            </MenuItem>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div>
          <div
            className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4'
            style={{ minHeight }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
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
            {[...Array(6)].map((_, i) => (
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
                className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4'
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
                        {selectedYear === 'all' ? '' : `FY-${selectedYear}`}
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
