import React, { useEffect, useRef, useState } from 'react';
import Chart from 'react-google-charts';
import { MenuItem, Select, SelectChangeEvent, Skeleton } from '@mui/material';
import {
  blendWithWhite,
  colorMap,
  COMMON_MENU_PROPS,
  getDynamicSvgIcon,
  getSelectStyles,
} from '../../helpers';
import { AccountYearData } from '../../../../types/dashboard';

interface Props {
  title: string;
  subtitle?: string;
  data: AccountYearData[];
  colors: string[];
  className?: string;
  isLoading?: boolean;
  filingType?: string;
  filingTypeOptions?: { value: string; label: string }[];
  onFilingTypeChange?: (value: string) => void;
}

const AccountChart: React.FC<Props> = ({
  title,
  subtitle,
  data,
  colors,
  className = '',
  isLoading = false,
  filingType,
  filingTypeOptions = [],
  onFilingTypeChange,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState('100%');

  // BUILD GOOGLE-CHART ROWS
  const chartRows = React.useMemo(() => {
    const rows: (string | number | null)[][] = [];

    data.forEach((acc) => {
      // Since response is now single year per account, we take the first item
      const y = acc.years[0];
      if (!y) return;

      const barColor = y.color
        ? colorMap[y.color.toUpperCase()] || y.color
        : colors[y.year % colors.length];

      rows.push([
        acc.account,
        y.progress,
        blendWithWhite(barColor, 0.4),
        `${y.progress}%`,
        `FY-${y.year}:  ${y.progress}%`,
      ]);
    });

    return rows;
  }, [data, colors]);

  const chartData: (string | number | object | null)[][] = [
    [
      'Account',
      'Progress',
      { role: 'style' },
      { role: 'annotation' },
      { role: 'tooltip' },
    ],
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

  const LEGEND_ITEMS = [
    {
      key: 'onTrack',
      label: 'On Track',
      color: colorMap.GREEN,
    },
    { key: 'atRisk', label: 'At Risk', color: colorMap.ORANGE },
    { key: 'critical', label: 'Critical', color: colorMap.RED },
  ];

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
          size='small'
          value={filingType || ''}
          onChange={(e: SelectChangeEvent) =>
            onFilingTypeChange?.(e.target.value)
          }
          className={`custom-select-no-arrow w-[160px] max-w-[160px] sm:text-sm ${'text-black'}`}
          MenuProps={COMMON_MENU_PROPS}
          sx={getSelectStyles(false, false)}
          disabled={isLoading}
        >
          {filingTypeOptions.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              sx={{
                color: '#425A76',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {option.label}
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

            {/* Simulating individual bars */}
            {[...Array(8)].map((_, i) => (
              <Skeleton
                key={i}
                variant='rectangular'
                width={'6%'}
                sx={{
                  height: `${20 + Math.random() * 60}%`,
                  borderRadius: '2px 2px 0 0',
                  bgcolor: 'rgba(0,0,0,0.05)',
                }}
              />
            ))}
          </div>

          {/* Legend Skeleton */}
          <div className='flex justify-center gap-6 mt-6'>
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
        <div className='mb-4'>
          <Chart
            chartType='ColumnChart'
            width={chartWidth}
            height='370px'
            data={chartData}
            options={{
              legend: 'none',
              bar: { groupWidth: '80%' },

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
          {/* Shared Legend */}
          <div className='px-4 flex flex-wrap justify-center gap-4 border-t border-[#CBD6E2] pt-3'>
            {LEGEND_ITEMS.map((item) => (
              <div key={item.key} className='flex items-center gap-2'>
                <span
                  className='inline-block h-3 w-3 rounded-[2px]'
                  style={{ backgroundColor: blendWithWhite(item.color, 0.4) }}
                />
                <span className='text-sm text-[#2A2A2A]'>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountChart;
