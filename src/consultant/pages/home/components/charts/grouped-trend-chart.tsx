import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'react-google-charts';
import { formatAmountWithSign, generateChartTicks } from '../../helpers';

export interface TrendPoint {
  year: number;
  amount: number;
}

interface MultiTrendSeries {
  name: string;
  color: string;
  data: TrendPoint[];
}

interface TrendChartProps {
  title: string;
  series: MultiTrendSeries[];
  height?: number;
}

const GroupedTrendChart: React.FC<TrendChartProps> = ({
  title,
  series,
  height = 350,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState('100%');

  // Extract all years
  const allYears = Array.from(
    new Set(series.flatMap((s) => s.data.map((d) => d.year)))
  ).sort((a, b) => a - b);

  // Build Google Chart Data Format with formatted tooltips
  const chartData = [
    ['Year', ...series.map((s) => s.name)],
    ...allYears.map((year) => [
      year.toString(),
      ...series.map((s) => {
        const point = s.data.find((d) => d.year === year);
        if (!point) return null;
        return { v: point.amount, f: formatAmountWithSign(point.amount) };
      }),
    ]),
  ];

  // Calculate min & max values among all series
  const allAmounts = series.flatMap((s) => s.data.map((d) => d.amount));
  const maxAmount = Math.max(...allAmounts);
  const minAmount = Math.min(...allAmounts);
  const ticks = generateChartTicks(minAmount, maxAmount);

  const options = {
    legend: { position: 'bottom' },
    curveType: 'none',
    height,
    chartArea: { top: 20, left: 80, bottom: 80, right: 20 },
    hAxis: { title: 'Year' },
    vAxis: {
      title: 'Amount',
      ticks,
      format: 'short',
      baseline: 0,
    },
    colors: series.map((s) => s.color),
    pointSize: 6,
  };

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
    <div ref={chartRef}>
      <style>{`
        .google-visualization-tooltip {
          pointer-events: none !important;
        }
      `}</style>
      <div className='flex justify-center items-center p-3 font-semibold'>
        {title}
      </div>
      <div style={{ position: 'relative' }}>
        {/* Left axis vertical line */}
        <div
          style={{
            position: 'absolute',
            left: 80,
            top: 20,
            height: height - 20 - 80,
            width: '1.5px',
            backgroundColor: '#333',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
        <Chart
          chartType='LineChart'
          width={chartWidth}
          height={`${height}px`}
          data={chartData}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          options={options as any}
        />
      </div>
    </div>
  );
};

export default GroupedTrendChart;
