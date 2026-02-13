import React, { useEffect, useRef, useState } from 'react';
import Chart from 'react-google-charts';
import { MenuItem, Select, Skeleton } from '@mui/material';
import {
  blendWithWhite,
  COMMON_MENU_PROPS,
  getDynamicSvgIcon,
  getSelectStyles,
} from '../../helpers';
import { AccountYearData } from '../../../../types/dashboard';
import { getFiscalYears } from '../../../../../common-utils';

interface Props {
  title: string;
  subtitle?: string;
  data: AccountYearData[];
  colors: string[];
  className?: string;
  isLoading?: boolean;
  selectedYear: string;
  onYearChange: (year: string) => void;
}

const AccountChart: React.FC<Props> = ({
  title,
  subtitle,
  data,
  colors,
  className = '',
  isLoading = false,
  selectedYear,
  onYearChange,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState('100%');

  const minYear = 1950;
  const currentYear = new Date().getFullYear();
  const fiscalYears = getFiscalYears(currentYear - minYear + 1);
  const yearValues = fiscalYears.slice(0, 4).map((fy) => Number(fy.value));

  // BUILD GOOGLE-CHART ROWS
  const chartRows = React.useMemo(() => {
    const rows: (string | number | null)[][] = [];

    data.forEach((acc) => {
      acc.years.forEach((y, index) => {
        rows.push([
          index === 0 ? acc.account : '',
          y.progress,
          blendWithWhite(colors[y.year % colors.length], 0.5),
          `FY-${y.year}:  ${y.progress}%`,
        ]);
      });

      // GAP ROW (no bar, invisible)
      rows.push(['', 0, 'opacity: 0', '']);
    });

    return rows;
  }, [data, colors]);

  const chartData: (string | number | object | null)[][] = [
    ['Account', 'Progress', { role: 'style' }, { role: 'tooltip' }],
    ...chartRows,
  ];

  // Resize observer to handle container size changes
  useEffect(() => {
    const currentChartRef = chartRef.current; // Copy to variable

    if (!currentChartRef) return;

    const updateChartWidth = () => {
      const width = currentChartRef.offsetWidth;
      setChartWidth(`${width}px`);
    };

    // Initial calculation
    updateChartWidth();

    // Create resize observer
    const resizeObserver = new ResizeObserver(updateChartWidth);
    resizeObserver.observe(currentChartRef);

    // Cleanup - use the variable that won't change
    return () => {
      resizeObserver.unobserve(currentChartRef);
    };
  }, []);

  return (
    <div
      className={`bg-white rounded-lg border border-[#CBD6E2] overflow-hidden ${className}`}
      ref={chartRef}
    >
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-3 border-b border-[#CBD6E2]'>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex-shrink-0'>{getDynamicSvgIcon(title, 26)}</div>
          <div>
            <h3 className='text-xl font-semibold text-[#2A2A2A]'>{title}</h3>
            {subtitle && (
              <p className='text-sm text-[#425A76] mt-0.5'>{subtitle}</p>
            )}
          </div>
        </div>

        <Select
          name='fiscal_year'
          value={selectedYear}
          onChange={(e) => onYearChange(e.target.value)}
          displayEmpty
          size='small'
          className={`custom-select-no-arrow w-[150px] max-w-[150px] sm:text-sm ${
            selectedYear === '' ? 'text-[#7D98B6]' : 'text-black'
          }`}
          MenuProps={COMMON_MENU_PROPS}
          sx={getSelectStyles(false, false)}
        >
          <MenuItem
            value='all'
            sx={{ color: '#425A76', fontSize: '13px', fontWeight: 500 }}
          >
            Last 4 Years
          </MenuItem>

          {fiscalYears?.map((year, i) => (
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
        <div className='px-12 py-6'>
          <div className='relative h-[300px] w-full flex items-end justify-around px-10 pb-2 ml-1'>
            {/* Horizontal Grid lines simulation */}
            <div className='absolute inset-0 flex flex-col justify-between py-2 pointer-events-none px-4 pl-6'>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className='w-full border-t border-[#CBD6E2] relative'
                >
                  <span className='absolute -left-6 -top-2 text-[10px] text-gray-300'>
                    {100 - i * 20}
                  </span>
                </div>
              ))}
            </div>

            {/* Simulating 4 account groups with bars */}
            {[...Array(4)].map((_, groupIndex) => (
              <div
                key={groupIndex}
                className='flex items-end gap-1 h-full z-10'
              >
                {[...Array(4)].map((_, barIndex) => (
                  <Skeleton
                    key={barIndex}
                    variant='rectangular'
                    width={18}
                    sx={{
                      height: `${20 + Math.random() * 60}%`,
                      borderRadius: '2px 2px 0 0',
                      bgcolor: 'rgba(0,0,0,0.05)',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend Skeleton */}
          <div className='flex justify-center gap-6 mt-8'>
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
      ) : data.length === 0 ? (
        <div className='flex justify-center items-center h-[200px] text-sm text-[#425A76]'>
          No data available
        </div>
      ) : (
        <>
          <Chart
            chartType='ColumnChart'
            width={chartWidth}
            height='370px'
            data={chartData}
            options={{
              legend: 'none',
              bar: { groupWidth: selectedYear === 'all' ? '80%' : '40%' },

              chartArea: {
                left: 90,
                right: 40,
                bottom: 60,
                top: 35,
                width: '80%',
              },

              hAxis: {
                title: 'Account',
                slantedText: false,
                slantedTextAngle: 0,
                showTextEvery: 1,
                maxAlternation: 1,
                maxTextLines: 2,
                minTextSpacing: 0,
                textPosition: 'out',
                allowContainerBoundaryTextCutoff: false,
                textStyle: { fontSize: 11 },
              },

              vAxis: {
                title: 'Progress (%)',
                minValue: 0,
                maxValue: 100,
              },

              // tooltip: { isHtml: true },
              backgroundColor: 'transparent',
            }}
          />

          {/* Custom Legend */}
          <div className='flex justify-center gap-4 flex-wrap p-3 mb-1'>
            {(selectedYear === 'all' ? yearValues : [Number(selectedYear)]).map(
              (year) => (
                <div key={year} className='flex items-center gap-1 text-sm'>
                  <span
                    className='inline-block w-4 h-4 rounded'
                    style={{ backgroundColor: colors[year % colors.length] }}
                  ></span>
                  {year}
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AccountChart;
