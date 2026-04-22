/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from 'react';
import Chart from 'react-google-charts';
import {
  formatAmount,
  getDynamicSvgIcon,
  blendWithWhite,
  generateChartTicks,
} from '../../helpers';

interface SummaryItem {
  label: string;
  value: number | string;
  color: string;
}

interface TooltipItem {
  label: string;
  value: string | number;
}

interface StackedBarChartProps {
  title: string;
  subtitle?: string;
  data: any[];
  series: {
    key: string;
    name: string;
    color: string;
  }[];
  getLabel?: (item: any) => string;
  hideHeader?: boolean;
  summary?: SummaryItem[];
  minHeight?: number;
  className?: string;
  XAxis?: string;
  YAxis?: string;
  customTooltip?: boolean;
  getTooltipData?: (item: any) => TooltipItem[];
  getCurrencySymbol?: (item: any) => string;
  itemsPerPage?: number; // New prop for pagination
}

const StackedBarChart: React.FC<StackedBarChartProps> = ({
  title,
  subtitle,
  data,
  series,
  getLabel = (i) => i.account,
  summary = [],
  minHeight = 350,
  className = '',
  hideHeader = false,
  XAxis = '',
  YAxis = '',
  customTooltip = false,
  getTooltipData,
  getCurrencySymbol,
  itemsPerPage = 5, // Default 5 items per page
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = useMemo(
    () => data.slice(startIndex, endIndex),
    [data, startIndex, endIndex]
  );

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, itemsPerPage]);

  const prepareChartData = () => {
    if (series.length === 1) {
      const valueSeries = series[0];

      const headers: any[] = [
        'Account',
        valueSeries.name,
        { role: 'annotation', type: 'string' },
      ];

      if (customTooltip && getTooltipData) {
        headers.push({ role: 'tooltip', type: 'string', p: { html: true } });
      }

      const rows = paginatedData.map((item) => {
        const label = getLabel(item);
        const value = Number(item[valueSeries.key] ?? 0);
        const symbol = getCurrencySymbol ? getCurrencySymbol(item) : '';
        const annotation = `${symbol}${formatAmount(value)}`;

        if (customTooltip && getTooltipData) {
          const tooltipItems = getTooltipData(item) || [];

          const tooltipHtml = [
            `<div style="
      padding:8px 10px;
      border-radius:6px;
      box-shadow:0 2px 8px rgba(0,0,0,0.15);
      font-size:12px;
      line-height:1.4;
      white-space:nowrap;
      min-width:max-content;
    ">`,
            `<div style="font-weight:700; margin-bottom:4px; color:#1e293b;">${label}</div>`,
            ...tooltipItems.map(
              (t) => `
        <div style="display:flex; justify-content:space-between; gap:18px;">
          <span style="color:#64748b;">${t.label}</span>
          <b style="color:#0f172a;">${t.value}</b>
        </div>`
            ),
            `</div>`,
          ].join('');

          return [label, value, annotation, tooltipHtml];
        }

        return [label, value, annotation];
      });

      return [headers, ...rows];
    }

    const headers = ['Account', ...series.map((s) => s.name)];
    const rows = paginatedData.map((item) => [
      getLabel(item),
      ...series.map((s) => item[s.key]),
    ]);

    return [headers, ...rows];
  };

  const chartData = prepareChartData();

  // Compute max value from chart data for formatted hAxis ticks
  const maxChartValue = useMemo(() => {
    if (!chartData || chartData.length <= 1) return 0;
    let max = 0;
    for (let i = 1; i < chartData.length; i++) {
      const row = chartData[i];
      for (let j = 1; j < row.length; j++) {
        const val = Number(row[j]);
        if (isFinite(val) && val > max) max = val;
      }
    }
    return max;
  }, [chartData]);

  const hAxisTicks = useMemo(
    () => generateChartTicks(0, maxChartValue),
    [maxChartValue]
  );

  const chartOptions: any = {
    title: hideHeader ? title : '',
    isStacked: true,
    legend: { position: 'bottom', textStyle: { fontSize: 12 } },
    colors: series.map((s) => blendWithWhite(s.color, 0.6)),
    chartArea: {
      left: 150,
      right: 50,
      top: 30,
      bottom: 80,
      width: '85%',
      height: '75%',
    },
    hAxis: {
      title: XAxis,
      minValue: 0,
      textStyle: { fontSize: 12 },
      ticks: hAxisTicks,
    },
    vAxis: { title: YAxis, textStyle: { fontSize: 12 } },
    bar: { groupWidth: series.length === 1 ? '50%' : '30%' },
    backgroundColor: 'transparent',
    annotations: {
      alwaysOutside: false,
      textStyle: { fontSize: 10, color: '#2A2A2A', bold: true },
    },
    tooltip: customTooltip ? { isHtml: true, trigger: 'focus' } : {},
  };

  return (
    <div
      className={`bg-white rounded-lg border border-[#CBD6E2] overflow-hidden ${className}`}
    >
      {/* Header */}
      {!hideHeader && (
        <div className='flex items-center gap-3 px-4 py-3 border-b border-[#CBD6E2]'>
          <div className='flex-shrink-0'>{getDynamicSvgIcon(title, 26)}</div>
          <div>
            <h3 className='text-xl font-semibold text-[#2A2A2A]'>{title}</h3>
            {subtitle && (
              <p className='text-sm text-[#425A76] mt-0.5'>{subtitle}</p>
            )}
          </div>
        </div>
      )}

      {summary.length > 0 && (
        <div className='flex items-center justify-evenly px-4 py-3 border-b border-[#CBD6E2]'>
          {summary.map((item, idx) => (
            <div key={idx} className='flex items-center gap-2'>
              <span
                className='inline-block h-3 w-3 rounded-full'
                style={{ backgroundColor: item.color }}
              />
              <span
                className='text-lg font-medium'
                style={{ color: item.color }}
              >
                {item.value} {item.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          minHeight,
          maxHeight: minHeight,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <Chart
          chartType='BarChart'
          width='100%'
          height={paginatedData.length * 40 + 100}
          data={chartData}
          options={chartOptions}
        />
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className='flex items-center justify-center mb-4 bg-white'>
          <div className='flex items-center gap-1'>
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`text-[12px] font-medium ${
                currentPage === 1
                  ? 'text-gray-300 cursor-default'
                  : 'text-gray-600 hover:text-gray-900 cursor-pointer'
              }`}
            >
              ◄
            </button>

            <span className='text-sm font-medium text-gray-700 min-w-[80px] text-center'>
              Page {currentPage}
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`text-[12px] font-medium ${
                currentPage === totalPages
                  ? 'text-gray-300 cursor-default'
                  : 'text-gray-600 hover:text-gray-900 cursor-pointer'
              }`}
            >
              ►
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StackedBarChart;
