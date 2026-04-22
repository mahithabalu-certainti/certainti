import React, { useMemo } from 'react';
import { Chart } from 'react-google-charts';
import { Skeleton } from '@mui/material';
import {
  getDynamicSvgIcon,
  formatAmountWithSign,
  generateChartTicks,
  blendWithWhite,
} from '../../helpers';
import { RootState } from '../../../../../store/store';
import { useSelector } from 'react-redux';
import { OverallProjectValueDetail } from '../../../../types';

interface BarChartsGroupProps {
  title: string;
  subtitle?: string;
  data: OverallProjectValueDetail[];
  isLoading?: boolean;
}

// Bar colors for QRE Cost, RD Credits, Total Project Cost
const BAR_COLORS = {
  qreCost: '#03A9F4', // Light Blue
  rdCredits: '#4CAF50', // Green
  totalProjectCost: '#FF9800', // Orange
};

const LEGEND_ITEMS = [
  { key: 'qreCost', label: 'QRE Cost', color: BAR_COLORS.qreCost },
  { key: 'rdCredits', label: 'RD Credits', color: BAR_COLORS.rdCredits },
  {
    key: 'totalProjectCost',
    label: 'Total Project Cost',
    color: BAR_COLORS.totalProjectCost,
  },
];

/** Safe parse — never returns NaN; falls back to 0 */
const safeNum = (v: string | number | undefined | null): number => {
  const n = Number(v);
  return isFinite(n) ? n : 0;
};

const BarChartsGroup: React.FC<BarChartsGroupProps> = ({
  title,
  subtitle,
  data,
  isLoading = false,
}) => {
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );
  const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const transformedData = useMemo(
    () =>
      data.map((item) => ({
        country: item.country_name || item.country_code,
        currencySymbol: item.currency_symbol || '$',
        qreCost: safeNum(item.qre_cost),
        rdCredits: safeNum(item.rd_credits),
        totalProjectCost: safeNum(item.total_project_cost),
      })),
    [data]
  );

  /**
   * Google Charts ColumnChart with role columns (style, annotation) requires
   * plain numbers in the value column — NOT { v, f } objects. Formatted labels
   * are handled via the ticks array for the Y-axis and via the annotation column.
   */
  const buildChartPayload = (item: (typeof transformedData)[number]) => {
    const values = [item.qreCost, item.rdCredits, item.totalProjectCost];
    const minVal = Math.min(...values, 0); // always anchor at 0
    const maxVal = Math.max(...values, 0);
    const ticks = generateChartTicks(minVal, maxVal);

    // Value column must be a plain number when using role columns
    const chartData: (string | number | object | null)[][] = [
      [
        'Metric',
        'Value',
        { role: 'style' },
        { role: 'annotation' },
        { role: 'tooltip' },
      ],
      [
        'QRE Cost',
        item.qreCost,
        blendWithWhite(BAR_COLORS.qreCost, 0.3),
        `${item.currencySymbol}${formatAmountWithSign(item.qreCost)}`,
        `QRE Cost:  ${item.currencySymbol}${formatAmountWithSign(item.qreCost)}`,
      ],
      [
        'RD Credits',
        item.rdCredits,
        blendWithWhite(BAR_COLORS.rdCredits, 0.3),
        `${item.currencySymbol}${formatAmountWithSign(item.rdCredits)}`,
        `RD Credits:  ${item.currencySymbol}${formatAmountWithSign(item.rdCredits)}`,
      ],
      [
        'Total Cost',
        item.totalProjectCost,
        blendWithWhite(BAR_COLORS.totalProjectCost, 0.3),
        `${item.currencySymbol}${formatAmountWithSign(item.totalProjectCost)}`,
        `Total Project Cost:  ${item.currencySymbol}${formatAmountWithSign(item.totalProjectCost)}`,
      ],
    ];

    return { chartData, ticks };
  };

  const buildChartOptions = (ticks: { v: number; f: string }[]) => ({
    legend: 'none',
    bar: { groupWidth: '60%' },
    chartArea: { width: '60%', height: '70%', left: '25%' },
    vAxis: {
      textStyle: { fontSize: 9, color: '#425A76' },
      gridlines: { color: '#CBD5E1', count: ticks.length },
      minorGridlines: { count: 0 },
      baseline: 0,
      baselineColor: '#94A3B8',
      ticks,
      viewWindow: {
        min: ticks[0]?.v ?? 0,
        max: ticks[ticks.length - 1]?.v ?? 0,
      },
    },
    hAxis: { textPosition: 'none' },
    annotations: {
      alwaysOutside: false,
      textStyle: { fontSize: 9, color: '#2A2A2A', bold: true },
    },
    tooltip: { isHtml: false, trigger: 'focus' },
    backgroundColor: '#ffffff',
  });

  return (
    <div className='bg-white rounded-lg border border-[#CBD6E2] overflow-hidden'>
      <style>{`
        .google-visualization-tooltip {
          pointer-events: none !important;
        }
      `}</style>

      {/* Header */}
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
            className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4'
            style={{ minHeight: 260 }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className='flex flex-col items-center justify-center text-center gap-2'
              >
                <div className='w-full flex items-end justify-center gap-2 h-[160px]'>
                  {[70, 110, 85].map((h, j) => (
                    <Skeleton
                      key={j}
                      variant='rectangular'
                      width={24}
                      height={h}
                      sx={{ borderRadius: '3px' }}
                    />
                  ))}
                </div>
                <Skeleton variant='text' width='60%' height={20} />
                <Skeleton variant='text' width='40%' height={16} />
              </div>
            ))}
          </div>
          {/* Legend skeleton */}
          <div className='flex justify-center gap-6 border-t border-[#CBD6E2] p-3'>
            {LEGEND_ITEMS.map((_, i) => (
              <div key={i} className='flex items-center gap-2'>
                <Skeleton
                  variant='rectangular'
                  width={14}
                  height={14}
                  sx={{ borderRadius: '3px' }}
                />
                <Skeleton variant='text' width={60} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {transformedData.length > 0 ? (
            <>
              {/* Bar Charts Grid — one column chart per country */}
              <div
                className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4'
                style={{ minHeight: 260 }}
              >
                {transformedData.map((country, idx) => {
                  const { chartData, ticks } = buildChartPayload(country);
                  return (
                    <div
                      key={idx}
                      className='flex flex-col items-center text-center w-full'
                    >
                      <div className='w-full' style={{ height: 200 }}>
                        <Chart
                          chartType='ColumnChart'
                          width='100%'
                          height='200px'
                          data={chartData}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          options={buildChartOptions(ticks) as any}
                        />
                      </div>
                      <p className='font-semibold text-sm text-[#2A2A2A] mt-1'>
                        {country.country}
                      </p>
                      <p className='text-xs text-[#425A76] mt-0.5'>
                        {newFiscalYear === 0 ? 'FY-All' : `FY-${newFiscalYear}`}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Shared Legend */}
              <div className='px-4 pb-4 flex flex-wrap justify-center gap-4 border-t border-[#CBD6E2] pt-3'>
                {LEGEND_ITEMS.map((item) => (
                  <div key={item.key} className='flex items-center gap-2'>
                    <span
                      className='inline-block h-3 w-3 rounded-[2px]'
                      style={{
                        backgroundColor: blendWithWhite(item.color, 0.3),
                      }}
                    />
                    <span className='text-sm text-[#2A2A2A]'>{item.label}</span>
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

export default BarChartsGroup;
