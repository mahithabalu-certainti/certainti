/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import Chart, { ReactGoogleChartEvent } from 'react-google-charts';
import StackedBarChart from './stacked-bar-chart';
import {
  formatAmount,
  getDynamicSvgIcon,
  COMMON_MENU_PROPS,
  getSelectStyles,
  blendWithWhite,
} from '../../helpers';
import { MenuItem, Select } from '@mui/material';
import { useGetGlobalLevelChart } from '../../../../services/dashboard/dashboard-service';
import { AccountWiseConsolidation } from '../../../../types/dashboard';
import { PROJECT_COLORS } from '../../../../../admin/pages/workflow-builder/form/helper';
import { getFiscalYears } from '../../../../../common-utils';

interface MapChartProps {
  title: string;
  subtitle?: string;
}

const WorldMapChart: React.FC<MapChartProps> = ({ title, subtitle }) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [chartKey, setChartKey] = useState(0);

  const minYear = 1950;
  const currentYear = new Date().getFullYear();
  const fiscalYears = getFiscalYears(currentYear - minYear + 1);

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
  const { data: apiData, isLoading } = useGetGlobalLevelChart(
    'all',
    'active',
    selectedYear === 'all' ? undefined : Number(selectedYear),
    selectedCountry || undefined
  );

  // Prepare map data for Google Charts
  const mapData = useMemo(() => {
    if (!apiData?.countryWiseConsolidation) {
      return [['Country', 'Total RD Credits Approved']];
    }

    const data: any[] = [['Country', 'Total RD Credits Approved']];

    apiData.countryWiseConsolidation.forEach((country, index) => {
      if (selectedCountry) {
        // Highlight only selected country, gray others
        const isSelected = country.country_rid === selectedCountry;
        data.push([
          country.country_name,
          isSelected
            ? { v: country.approved, f: formatAmount(country.approved) }
            : 0,
        ]);
      } else {
        // Global view normal values
        data.push([
          country.country_name,
          { v: index + 1, f: formatAmount(country.approved) },
        ]);
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

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    // Reset country selection when year changes
    setSelectedCountry(null);
  };

  const chartTitle = useMemo(() => {
    if (!selectedCountry || !apiData?.countryWiseConsolidation) {
      return `Global Account RD Credits Submitted (FY-${selectedYear === 'all' ? 'Last 4 Years' : selectedYear})`;
    }
    const country = apiData.countryWiseConsolidation.find(
      (c) => c.country_rid === selectedCountry
    );
    return `${country?.country_name} - Account RD Credits Submitted (FY-${selectedYear === 'all' ? 'Last 4 Years' : selectedYear})`;
  }, [selectedCountry, apiData, selectedYear]);

  const chartSubtitle = useMemo(() => {
    const count = chartData.length;
    if (!selectedCountry) {
      return `${count} total accounts across all countries for FY-${selectedYear === 'all' ? 'Last 4 Years' : selectedYear}`;
    }
    const country = apiData?.countryWiseConsolidation.find(
      (c) => c.country_rid === selectedCountry
    );
    return `${count} accounts in ${country?.country_name} for FY-${selectedYear === 'all' ? 'Last 4 Years' : selectedYear}`;
  }, [chartData, selectedCountry, apiData, selectedYear]);

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
        <div className='flex items-center gap-3'>
          {/* Year Selector */}
          <Select
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value as string)}
            size='small'
            className='custom-select-no-arrow w-[130px] max-w-[130px] sm:text-sm'
            MenuProps={COMMON_MENU_PROPS}
            sx={getSelectStyles(false, false)}
            disabled={isLoading}
          >
            <MenuItem
              value='all'
              sx={{
                color: '#425A76',
                fontSize: '13px',
                fontWeight: 500,
              }}
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

          {selectedCountry && (
            <button
              onClick={() => {
                setSelectedCountry(null);
              }}
              style={{
                boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
              }}
              className='h-[27px] px-2.5 border border-[#CBD6E2] text-[#425A76] rounded-[2px] text-sm font-medium cursor-pointer'
            >
              Back to Global View
            </button>
          )}
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
