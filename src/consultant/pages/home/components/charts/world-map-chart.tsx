/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import Chart, { ReactGoogleChartEvent } from 'react-google-charts';
import StackedBarChart from './stacked-bar-chart';
import { formatAmount, getDynamicSvgIcon, blendWithWhite } from '../../helpers';
import { useGetGlobalLevelChart } from '../../../../services/dashboard/dashboard-service';
import { AccountWiseConsolidation } from '../../../../types/dashboard';
import { PROJECT_COLORS } from '../../../../../admin/pages/workflow-builder/form/helper';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { reshapeGlobalFilter } from '../../../../../common-utils';
import { FilterState } from '../../../../types';

interface MapChartProps {
  title: string;
  subtitle?: string;
}

const WorldMapChart: React.FC<MapChartProps> = ({ title, subtitle }) => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [chartKey, setChartKey] = useState(0);

  const { fiscalYear, filters } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);
  const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  // Handle window resize to adjust charts when sidebar opens/closes
  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setChartKey((prev) => prev + 1);
      }, 150);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Fetch data from API
  const { data: apiData, isLoading } = useGetGlobalLevelChart({
    flag: 'all',
    fiscalYear: newFiscalYear,
    globalFilters: reshapeGlobalFilter(filters as FilterState),
    countryType: 'active' as const,
    countryRid: selectedCountry || undefined,
  });

  // Prepare map data for Google Charts
  const mapData = useMemo(() => {
    if (!apiData?.countryWiseConsolidation) {
      return [
        [
          'Country',
          'Total RD Credits Approved',
          { role: 'tooltip', type: 'string', p: { html: true } },
        ],
      ];
    }

    const data: any[] = [
      [
        'Country',
        'Total RD Credits Approved',
        { role: 'tooltip', type: 'string', p: { html: true } },
      ],
    ];

    apiData.countryWiseConsolidation.forEach((country, index) => {
      const tooltipHtml = `<div style="bachfont-size:12px;white-space:nowrap;">
        <span style="color:#000;">Total RD Credits Approved:</span>  <span style="color:#000;font-weight:bold;">${formatAmount(country.approved)}</span>
      </div>`;

      if (selectedCountry) {
        const isSelected = country.country_rid === selectedCountry;
        data.push([
          country.country_name,
          isSelected ? country.approved : 0,
          tooltipHtml,
        ]);
      } else {
        data.push([country.country_name, index + 1, tooltipHtml]);
      }
    });

    return data;
  }, [apiData, selectedCountry]);

  // Chart data for stacked bar
  const chartData = useMemo(() => {
    return apiData?.accountWiseConsolidationList || [];
  }, [apiData]);

  const handleCountrySelect = (chartWrapper: any) => {
    const chart = chartWrapper.getChart();
    const selection = chart.getSelection();

    if (selection.length > 0) {
      const selectedItem = selection[0];
      const countryName = mapData[selectedItem.row + 1][0] as string;

      // Find the country in the data
      const country = apiData?.countryWiseConsolidation.find(
        (c) => c.country_name === countryName
      );

      if (country) {
        setSelectedCountry(country.country_rid);
      } else {
        setSelectedCountry(null);
      }
    }
  };

  const fyLabel = newFiscalYear === 0 ? 'All' : String(newFiscalYear);

  const chartTitle = useMemo(() => {
    if (!selectedCountry || !apiData?.countryWiseConsolidation) {
      return `Global Account RD Credits Submitted (FY-${fyLabel})`;
    }
    const country = apiData.countryWiseConsolidation.find(
      (c) => c.country_rid === selectedCountry
    );
    return `${country?.country_name} - Account RD Credits Submitted (FY-${fyLabel})`;
  }, [selectedCountry, apiData, fyLabel]);

  const chartSubtitle = useMemo(() => {
    const count = chartData.length;
    if (!selectedCountry) {
      return `${count} total accounts across all countries for FY-${fyLabel}`;
    }
    const country = apiData?.countryWiseConsolidation.find(
      (c) => c.country_rid === selectedCountry
    );
    return `${count} accounts in ${country?.country_name} for FY-${fyLabel}`;
  }, [chartData, selectedCountry, apiData, fyLabel]);

  const mapOptions = {
    region: 'world',
    displayMode: 'regions',
    colorAxis: selectedCountry
      ? { colors: ['#e5e7eb', '#4A90E2'] }
      : {
          colors: apiData?.countryWiseConsolidation
            ? apiData.countryWiseConsolidation.map((_, index) =>
                blendWithWhite(
                  PROJECT_COLORS[index % PROJECT_COLORS.length],
                  0.4
                )
              )
            : ['#A2CD5A'],
        },
    tooltip: { isHtml: true, trigger: 'both' },
    legend: 'none',
    backgroundColor: '#fff',
    datalessRegionColor: '#e5e7eb',
    defaultColor: '#e5e7eb',
    keepAspectRatio: true,
    enableRegionInteractivity: true,
    magnifyingGlass: { enable: true, zoomFactor: 7.5 },
    regionStyle: {
      hover: {
        strokeColor: '#0A3D62',
        strokeWidth: 2,
      },
      selected: {
        strokeColor: '#0A3D62',
        strokeWidth: 2,
      },
    },
  };

  const chartEvents: ReactGoogleChartEvent[] = [
    {
      eventName: 'select',
      callback: ({ chartWrapper }: { chartWrapper: any }) => {
        handleCountrySelect(chartWrapper);
      },
    },
  ];

  return (
    <div
      key={`worldmap-bar-${chartKey}`}
      className='bg-white rounded-lg px-4 py-3 border border-[#CBD6E2] overflow-hidden'
    >
      <div className='mb-4 flex justify-between items-center'>
        {/* Header */}
        <div className='flex items-center gap-3'>
          <div className='flex-shrink-0'>
            {getDynamicSvgIcon('world map', 26)}
          </div>
          <div>
            <h3 className='text-xl font-semibold text-[#2A2A2A]'>{title}</h3>
            {subtitle && (
              <p className='text-sm text-[#425A76] mt-0.5'>{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center h-96 text-gray-500 border border-[#CBD6E2] rounded-lg'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2'></div>
            <p className='text-sm'>Loading chart data...</p>
          </div>
        </div>
      ) : !apiData || (!selectedCountry && chartData.length === 0) ? (
        <div className='flex justify-center items-center h-[200px] text-sm text-[#425A76] border border-[#CBD6E2] rounded-lg'>
          No data available
        </div>
      ) : (
        <div className='flex flex-col lg:flex-row gap-6 lg:gap-0 border border-[#CBD6E2] rounded-lg overflow-hidden'>
          <div className='w-full lg:w-[40%] pt-6'>
            {chartData.length === 0 ? (
              <div className='flex justify-center items-center h-[520px] text-sm text-[#425A76]'>
                No data available
              </div>
            ) : (
              <StackedBarChart
                title={chartTitle}
                subtitle={chartSubtitle}
                className='border-0 rounded-none bg-transparent'
                data={chartData}
                getLabel={(d: AccountWiseConsolidation) => d.account_name}
                hideHeader={true}
                minHeight={520}
                customTooltip={true}
                itemsPerPage={10}
                series={[
                  {
                    key: 'final_credit_submitted',
                    name: 'RD Credits Submitted',
                    color: '#4A90E2',
                  },
                ]}
                getTooltipData={(d: AccountWiseConsolidation) => [
                  {
                    label: 'Total Project Cost',
                    value: formatAmount(Number(d.total_project_cost)),
                  },
                  {
                    label: 'Qualified Project Cost',
                    value: formatAmount(Number(d.qualified_project_cost)),
                  },
                  {
                    label: 'QRE Cost',
                    value: formatAmount(Number(d.qre_cost)),
                  },
                  {
                    label: 'RD Credits Computed',
                    value: formatAmount(d.final_credit_computed),
                  },
                  {
                    label: 'RD Credits Submitted',
                    value: formatAmount(d.final_credit_submitted),
                  },
                  {
                    label: 'RD Credits Approved',
                    value: formatAmount(d.final_credit_approved),
                  },
                ]}
              />
            )}
          </div>

          <div
            className='w-full lg:w-[60%] pt-6'
            style={{ height: '500px', position: 'relative' }}
          >
            {selectedCountry && (
              <div className='absolute top-2 left-2 right-2 sm:left-6 sm:right-6 z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white/95 backdrop-blur-sm border border-[#CBD6E2] rounded-md px-3 py-2 sm:px-4 sm:py-2.5 shadow-md ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-300'>
                <div className='flex items-center gap-2 text-[11px] sm:text-[12px] text-[#425A76]'>
                  <div className='flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 animate-pulse'></div>
                  <span className='leading-tight'>
                    Viewing{' '}
                    <b>
                      {
                        apiData?.countryWiseConsolidation?.find(
                          (c) => c.country_rid === selectedCountry
                        )?.country_name
                      }
                    </b>
                    <span className='hidden md:inline'>
                      . Click <b>"Back to Global View"</b> to see other
                      countries.
                    </span>
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCountry(null)}
                  className='group flex items-center gap-1.5 cursor-pointer text-[11px] sm:text-[12px] font-bold text-[#4A90E2] hover:text-[#357ABD] transition-all whitespace-nowrap'
                >
                  <svg
                    width='14'
                    height='14'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='group-hover:-translate-x-0.5 transition-transform'
                  >
                    <path d='M19 12H5M12 19l-7-7 7-7' />
                  </svg>
                  Back to Global View
                </button>
              </div>
            )}
            <Chart
              chartType='GeoChart'
              width='100%'
              height='100%'
              data={mapData}
              options={mapOptions}
              chartEvents={chartEvents}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldMapChart;
