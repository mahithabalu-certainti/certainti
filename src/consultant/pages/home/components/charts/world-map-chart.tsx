/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import Chart, { ReactGoogleChartEvent } from 'react-google-charts';
import StackedBarChart from './stacked-bar-chart';
import {
  formatAmount,
  getDynamicSvgIcon,
  COMMON_MENU_PROPS,
  getSelectStyles,
} from '../../utils/helpers';
import { MenuItem, Select } from '@mui/material';

interface MapChartProps {
  title: string;
  subtitle?: string;
}

interface RDCostData {
  name: string;
  level: 'Federal' | 'State';
  value: number;
  projectCost: number;
  qualifiedCost: number;
  qreCost: number;
  creditsSubmitted: number;
  creditsApproved: number;
  year: number;
}

interface AccountData {
  account: string;
  claimedAmount: number;
  projectCost: number;
  qualifiedCost: number;
  qreCost: number;
  creditsSubmitted: number;
  creditsApproved: number;
  status: 'healthy' | 'at-risk' | 'critical';
  year: number;
}

interface CountryAccountsData {
  [country: string]: AccountData[];
}

// Updated federalRDCostData with years
const federalRDCostData: RDCostData[] = [
  // 2026 Data
  {
    name: 'United States',
    level: 'Federal',
    value: 280,
    projectCost: 580,
    qualifiedCost: 485,
    qreCost: 465,
    creditsSubmitted: 445,
    creditsApproved: 280,
    year: 2026,
  },
  {
    name: 'Canada',
    level: 'Federal',
    value: 195,
    projectCost: 395,
    qualifiedCost: 365,
    qreCost: 348,
    creditsSubmitted: 335,
    creditsApproved: 195,
    year: 2026,
  },
  {
    name: 'United Kingdom',
    level: 'Federal',
    value: 220,
    projectCost: 420,
    qualifiedCost: 378,
    qreCost: 362,
    creditsSubmitted: 342,
    creditsApproved: 220,
    year: 2026,
  },
  {
    name: 'Ireland',
    level: 'Federal',
    value: 165,
    projectCost: 365,
    qualifiedCost: 342,
    qreCost: 328,
    creditsSubmitted: 318,
    creditsApproved: 165,
    year: 2026,
  },
  {
    name: 'Australia',
    level: 'Federal',
    value: 185,
    projectCost: 385,
    qualifiedCost: 358,
    qreCost: 345,
    creditsSubmitted: 328,
    creditsApproved: 185,
    year: 2026,
  },

  // 2024 Data
  {
    name: 'United States',
    level: 'Federal',
    value: 245,
    projectCost: 520,
    qualifiedCost: 445,
    qreCost: 425,
    creditsSubmitted: 405,
    creditsApproved: 245,
    year: 2024,
  },
  {
    name: 'Canada',
    level: 'Federal',
    value: 178,
    projectCost: 378,
    qualifiedCost: 352,
    qreCost: 338,
    creditsSubmitted: 325,
    creditsApproved: 178,
    year: 2024,
  },
  {
    name: 'United Kingdom',
    level: 'Federal',
    value: 198,
    projectCost: 398,
    qualifiedCost: 365,
    qreCost: 348,
    creditsSubmitted: 332,
    creditsApproved: 198,
    year: 2024,
  },
  {
    name: 'Ireland',
    level: 'Federal',
    value: 148,
    projectCost: 348,
    qualifiedCost: 328,
    qreCost: 318,
    creditsSubmitted: 308,
    creditsApproved: 148,
    year: 2024,
  },
  {
    name: 'Australia',
    level: 'Federal',
    value: 168,
    projectCost: 368,
    qualifiedCost: 342,
    qreCost: 332,
    creditsSubmitted: 318,
    creditsApproved: 168,
    year: 2024,
  },

  // 2023 Data
  {
    name: 'United States',
    level: 'Federal',
    value: 215,
    projectCost: 465,
    qualifiedCost: 415,
    qreCost: 395,
    creditsSubmitted: 375,
    creditsApproved: 215,
    year: 2023,
  },
  {
    name: 'Canada',
    level: 'Federal',
    value: 158,
    projectCost: 358,
    qualifiedCost: 335,
    qreCost: 322,
    creditsSubmitted: 312,
    creditsApproved: 158,
    year: 2023,
  },
  {
    name: 'United Kingdom',
    level: 'Federal',
    value: 175,
    projectCost: 375,
    qualifiedCost: 348,
    qreCost: 332,
    creditsSubmitted: 318,
    creditsApproved: 175,
    year: 2023,
  },
  {
    name: 'Ireland',
    level: 'Federal',
    value: 128,
    projectCost: 328,
    qualifiedCost: 312,
    qreCost: 305,
    creditsSubmitted: 298,
    creditsApproved: 128,
    year: 2023,
  },
  {
    name: 'Australia',
    level: 'Federal',
    value: 148,
    projectCost: 348,
    qualifiedCost: 325,
    qreCost: 318,
    creditsSubmitted: 305,
    creditsApproved: 148,
    year: 2023,
  },

  // 2022 Data
  {
    name: 'United States',
    level: 'Federal',
    value: 185,
    projectCost: 425,
    qualifiedCost: 385,
    qreCost: 365,
    creditsSubmitted: 345,
    creditsApproved: 185,
    year: 2022,
  },
  {
    name: 'Canada',
    level: 'Federal',
    value: 135,
    projectCost: 335,
    qualifiedCost: 312,
    qreCost: 302,
    creditsSubmitted: 295,
    creditsApproved: 135,
    year: 2022,
  },
  {
    name: 'United Kingdom',
    level: 'Federal',
    value: 152,
    projectCost: 352,
    qualifiedCost: 325,
    qreCost: 312,
    creditsSubmitted: 302,
    creditsApproved: 152,
    year: 2022,
  },
  {
    name: 'Ireland',
    level: 'Federal',
    value: 108,
    projectCost: 308,
    qualifiedCost: 295,
    qreCost: 288,
    creditsSubmitted: 282,
    creditsApproved: 108,
    year: 2022,
  },
  {
    name: 'Australia',
    level: 'Federal',
    value: 125,
    projectCost: 325,
    qualifiedCost: 305,
    qreCost: 298,
    creditsSubmitted: 288,
    creditsApproved: 125,
    year: 2022,
  },
];

// Updated stateRDCostData with years
const stateRDCostData: RDCostData[] = [
  // 2026
  {
    name: 'United States',
    level: 'State',
    value: 100,
    projectCost: 220,
    qualifiedCost: 185,
    qreCost: 160,
    creditsSubmitted: 120,
    creditsApproved: 100,
    year: 2026,
  },
  {
    name: 'Canada',
    level: 'State',
    value: 50,
    projectCost: 110,
    qualifiedCost: 92,
    qreCost: 78,
    creditsSubmitted: 60,
    creditsApproved: 50,
    year: 2026,
  },
  // 2024
  {
    name: 'United States',
    level: 'State',
    value: 90,
    projectCost: 200,
    qualifiedCost: 170,
    qreCost: 145,
    creditsSubmitted: 110,
    creditsApproved: 90,
    year: 2024,
  },
  {
    name: 'Canada',
    level: 'State',
    value: 45,
    projectCost: 100,
    qualifiedCost: 85,
    qreCost: 72,
    creditsSubmitted: 55,
    creditsApproved: 45,
    year: 2024,
  },
  // 2023
  {
    name: 'United States',
    level: 'State',
    value: 80,
    projectCost: 180,
    qualifiedCost: 155,
    qreCost: 130,
    creditsSubmitted: 100,
    creditsApproved: 80,
    year: 2023,
  },
  {
    name: 'Canada',
    level: 'State',
    value: 40,
    projectCost: 90,
    qualifiedCost: 78,
    qreCost: 65,
    creditsSubmitted: 50,
    creditsApproved: 40,
    year: 2023,
  },
  // 2022
  {
    name: 'United States',
    level: 'State',
    value: 70,
    projectCost: 160,
    qualifiedCost: 140,
    qreCost: 115,
    creditsSubmitted: 90,
    creditsApproved: 70,
    year: 2022,
  },
  {
    name: 'Canada',
    level: 'State',
    value: 35,
    projectCost: 80,
    qualifiedCost: 70,
    qreCost: 58,
    creditsSubmitted: 45,
    creditsApproved: 35,
    year: 2022,
  },
];

// Updated countryAccountsData with years
const countryAccountsData: CountryAccountsData = {
  'United States': [
    // 2026
    {
      account: 'TechCorp USA',
      claimedAmount: 3200000,
      projectCost: 6500000,
      qualifiedCost: 5800000,
      qreCost: 5200000,
      creditsSubmitted: 4800000,
      creditsApproved: 3200000,
      status: 'healthy',
      year: 2026,
    },
    {
      account: 'InnovateLabs',
      claimedAmount: 2400000,
      projectCost: 4800000,
      qualifiedCost: 4200000,
      qreCost: 3800000,
      creditsSubmitted: 3400000,
      creditsApproved: 2400000,
      status: 'healthy',
      year: 2026,
    },
    // 2024
    {
      account: 'TechCorp USA',
      claimedAmount: 2800000,
      projectCost: 5800000,
      qualifiedCost: 5200000,
      qreCost: 4800000,
      creditsSubmitted: 4200000,
      creditsApproved: 2800000,
      status: 'healthy',
      year: 2024,
    },
    {
      account: 'InnovateLabs',
      claimedAmount: 2100000,
      projectCost: 4200000,
      qualifiedCost: 3800000,
      qreCost: 3400000,
      creditsSubmitted: 3000000,
      creditsApproved: 2100000,
      status: 'healthy',
      year: 2024,
    },
    // 2023
    {
      account: 'TechCorp USA',
      claimedAmount: 2500000,
      projectCost: 5200000,
      qualifiedCost: 4500000,
      qreCost: 3800000,
      creditsSubmitted: 3200000,
      creditsApproved: 2500000,
      status: 'healthy',
      year: 2023,
    },
    {
      account: 'InnovateLabs',
      claimedAmount: 1800000,
      projectCost: 3800000,
      qualifiedCost: 3200000,
      qreCost: 2800000,
      creditsSubmitted: 2400000,
      creditsApproved: 1800000,
      status: 'healthy',
      year: 2023,
    },
    // 2022
    {
      account: 'TechCorp USA',
      claimedAmount: 2200000,
      projectCost: 4500000,
      qualifiedCost: 3800000,
      qreCost: 3200000,
      creditsSubmitted: 2800000,
      creditsApproved: 2200000,
      status: 'healthy',
      year: 2022,
    },
    {
      account: 'InnovateLabs',
      claimedAmount: 1500000,
      projectCost: 3200000,
      qualifiedCost: 2800000,
      qreCost: 2400000,
      creditsSubmitted: 2000000,
      creditsApproved: 1500000,
      status: 'healthy',
      year: 2022,
    },
  ],
  Canada: [
    // 2026
    {
      account: 'MapleTech Industries',
      claimedAmount: 2200000,
      projectCost: 4800000,
      qualifiedCost: 4200000,
      qreCost: 3800000,
      creditsSubmitted: 3500000,
      creditsApproved: 2200000,
      status: 'healthy',
      year: 2026,
    },
    // 2024
    {
      account: 'MapleTech Industries',
      claimedAmount: 1900000,
      projectCost: 4200000,
      qualifiedCost: 3800000,
      qreCost: 3400000,
      creditsSubmitted: 3000000,
      creditsApproved: 1900000,
      status: 'healthy',
      year: 2024,
    },
    // 2023
    {
      account: 'MapleTech Industries',
      claimedAmount: 1500000,
      projectCost: 3200000,
      qualifiedCost: 2800000,
      qreCost: 2400000,
      creditsSubmitted: 2000000,
      creditsApproved: 1500000,
      status: 'healthy',
      year: 2023,
    },
    // 2022
    {
      account: 'MapleTech Industries',
      claimedAmount: 1200000,
      projectCost: 2800000,
      qualifiedCost: 2400000,
      qreCost: 2000000,
      creditsSubmitted: 1700000,
      creditsApproved: 1200000,
      status: 'healthy',
      year: 2022,
    },
  ],
  'United Kingdom': [
    // 2026
    {
      account: 'Cambridge Research',
      claimedAmount: 3500000,
      projectCost: 6800000,
      qualifiedCost: 6200000,
      qreCost: 5800000,
      creditsSubmitted: 5200000,
      creditsApproved: 3500000,
      status: 'healthy',
      year: 2026,
    },
    // 2024
    {
      account: 'Cambridge Research',
      claimedAmount: 3000000,
      projectCost: 5800000,
      qualifiedCost: 5200000,
      qreCost: 4800000,
      creditsSubmitted: 4500000,
      creditsApproved: 3000000,
      status: 'healthy',
      year: 2024,
    },
    // 2023
    {
      account: 'Cambridge Research',
      claimedAmount: 2800000,
      projectCost: 5800000,
      qualifiedCost: 5200000,
      qreCost: 4800000,
      creditsSubmitted: 4500000,
      creditsApproved: 2800000,
      status: 'healthy',
      year: 2023,
    },
    // 2022
    {
      account: 'Cambridge Research',
      claimedAmount: 2400000,
      projectCost: 5200000,
      qualifiedCost: 4800000,
      qreCost: 4400000,
      creditsSubmitted: 4000000,
      creditsApproved: 2400000,
      status: 'healthy',
      year: 2022,
    },
  ],
  Ireland: [
    // 2026
    {
      account: 'Cork BioSciences',
      claimedAmount: 2000000,
      projectCost: 4200000,
      qualifiedCost: 3800000,
      qreCost: 3400000,
      creditsSubmitted: 3000000,
      creditsApproved: 2000000,
      status: 'healthy',
      year: 2026,
    },
    // 2024
    {
      account: 'Cork BioSciences',
      claimedAmount: 1800000,
      projectCost: 3800000,
      qualifiedCost: 3400000,
      qreCost: 3000000,
      creditsSubmitted: 2600000,
      creditsApproved: 1800000,
      status: 'healthy',
      year: 2024,
    },
    // 2023
    {
      account: 'Cork BioSciences',
      claimedAmount: 1600000,
      projectCost: 3400000,
      qualifiedCost: 3000000,
      qreCost: 2700000,
      creditsSubmitted: 2400000,
      creditsApproved: 1600000,
      status: 'healthy',
      year: 2023,
    },
    // 2022
    {
      account: 'Cork BioSciences',
      claimedAmount: 1400000,
      projectCost: 3000000,
      qualifiedCost: 2600000,
      qreCost: 2300000,
      creditsSubmitted: 2000000,
      creditsApproved: 1400000,
      status: 'healthy',
      year: 2022,
    },
  ],
  Australia: [
    // 2026
    {
      account: 'Sydney Research Labs',
      claimedAmount: 1800000,
      projectCost: 3800000,
      qualifiedCost: 3400000,
      qreCost: 3000000,
      creditsSubmitted: 2600000,
      creditsApproved: 1800000,
      status: 'healthy',
      year: 2026,
    },
    // 2024
    {
      account: 'Sydney Research Labs',
      claimedAmount: 1600000,
      projectCost: 3400000,
      qualifiedCost: 3000000,
      qreCost: 2600000,
      creditsSubmitted: 2200000,
      creditsApproved: 1600000,
      status: 'healthy',
      year: 2024,
    },
    // 2023
    {
      account: 'Sydney Research Labs',
      claimedAmount: 1400000,
      projectCost: 3000000,
      qualifiedCost: 2600000,
      qreCost: 2300000,
      creditsSubmitted: 2000000,
      creditsApproved: 1400000,
      status: 'healthy',
      year: 2023,
    },
    // 2022
    {
      account: 'Sydney Research Labs',
      claimedAmount: 1200000,
      projectCost: 2600000,
      qualifiedCost: 2200000,
      qreCost: 1900000,
      creditsSubmitted: 1600000,
      creditsApproved: 1200000,
      status: 'healthy',
      year: 2022,
    },
  ],
};

const WorldMapChart: React.FC<MapChartProps> = ({ title, subtitle }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Get available years (last 4 years)
  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set([
        ...federalRDCostData.map((item) => item.year),
        ...stateRDCostData.map((item) => item.year),
      ])
    )
      .sort((a, b) => b - a)
      .slice(0, 4);
    return years;
  }, []);

  // Filter data by selected year
  const getAllCountryAccounts = (year: number): AccountData[] => {
    const allAccounts: AccountData[] = [];
    Object.keys(countryAccountsData).forEach((country) => {
      const yearAccounts = countryAccountsData[country].filter(
        (account) => account.year === year
      );
      allAccounts.push(...yearAccounts);
    });
    return allAccounts;
  };

  const getCountryAccounts = (country: string, year: number): AccountData[] => {
    return (
      countryAccountsData[country]?.filter(
        (account) => account.year === year
      ) || []
    );
  };

  // Prepare map data for Google Charts
  const prepareMapData = (year: number, selectedCountry: string | null) => {
    const combinedWorldData = [
      ...federalRDCostData.filter((item) => item.year === year),
      ...stateRDCostData.filter((item) => item.year === year),
    ];

    // Aggregate data by country
    const countryMap = new Map<string, number>();
    combinedWorldData.forEach((item) => {
      countryMap.set(item.name, (countryMap.get(item.name) || 0) + item.value);
    });

    const mapData: any[] = [['Country', 'R&D Cost Approved (Millions)']];

    countryMap.forEach((totalValue, country) => {
      if (selectedCountry) {
        // Highlight only selected country, gray others
        mapData.push([country, country === selectedCountry ? totalValue : 0]);
      } else {
        // Global view normal values
        mapData.push([country, totalValue]);
      }
    });

    return mapData;
  };

  const [chartData, setChartData] = useState<AccountData[]>(
    getAllCountryAccounts(currentYear)
  );

  const handleCountrySelect = (chartWrapper: any) => {
    const chart = chartWrapper.getChart();
    const selection = chart.getSelection();

    if (selection.length > 0) {
      const selectedItem = selection[0];
      const mapData = prepareMapData(selectedYear, selectedCountry);
      const countryName = mapData[selectedItem.row + 1][0] as string;

      if (countryAccountsData[countryName]) {
        setSelectedCountry(countryName);
        setChartData(getCountryAccounts(countryName, selectedYear));
      } else {
        setSelectedCountry(null);
        setChartData(getAllCountryAccounts(selectedYear));
      }
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    if (selectedCountry) {
      setChartData(getCountryAccounts(selectedCountry, year));
    } else {
      setChartData(getAllCountryAccounts(year));
    }
  };

  const mapData = prepareMapData(selectedYear, selectedCountry);

  const chartTitle = selectedCountry
    ? `${selectedCountry} - Account Claimed Amounts (FY-${selectedYear})`
    : `Global Account Claimed Amounts (FY-${selectedYear})`;

  const chartSubtitle = selectedCountry
    ? `${chartData.length} accounts in ${selectedCountry} for FY-${selectedYear}`
    : `${chartData.length} total accounts across all countries for FY-${selectedYear}`;

  const mapOptions = {
    region: 'world',
    displayMode: 'regions',
    colorAxis: selectedCountry
      ? { colors: ['#e5e7eb', '#4A90E2'] }
      : { colors: ['#A2CD5A', '#CDB5CD'] },
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
    <div className='bg-white rounded-lg px-4 py-3 border border-gray-200 overflow-hidden'>
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
            onChange={(e) => handleYearChange(Number(e.target.value))}
            size='small'
            className='custom-select-no-arrow w-[130px] max-w-[130px] sm:text-sm'
            MenuProps={COMMON_MENU_PROPS}
            sx={getSelectStyles(false, false)}
          >
            {availableYears.map((year) => (
              <MenuItem
                key={year}
                value={year}
                sx={{
                  color: '#425A76',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                FY-{year}
              </MenuItem>
            ))}
          </Select>

          {selectedCountry && (
            <button
              onClick={() => {
                setSelectedCountry(null);
                setChartData(getAllCountryAccounts(selectedYear));
              }}
              style={{
                boxShadow: '0px 1px 2px 0px rgba(42, 54, 71, 0.05)',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
              }}
              className='h-[27px] px-2.5 border border-[#CBD6E2] text-[#425A76] rounded-[2px] text-sm font-medium cursor-pointer'
            >
              Reset to Global View
            </button>
          )}
        </div>
      </div>

      <div className='flex gap-6 border border-gray-200 rounded-lg overflow-hidden'>
        <div className='w-[40%] max-h-[600px] overflow-y-auto mt-6'>
          <StackedBarChart
            title={chartTitle}
            subtitle={chartSubtitle}
            className='border-0 rounded-none bg-transparent'
            data={chartData}
            getLabel={(d: AccountData) => d.account}
            hideHeader={true}
            minHeight={580}
            customTooltip={true}
            series={[
              {
                key: 'claimedAmount',
                name: 'Claimed Submitted',
                color: '#4A90E2',
              },
            ]}
            getTooltipData={(d: AccountData) => [
              {
                label: 'Total Project Cost',
                value: formatAmount(d.projectCost),
              },
              {
                label: 'Total Qualified Cost',
                value: formatAmount(d.qualifiedCost),
              },
              { label: 'Total QRE Cost', value: formatAmount(d.qreCost) },
              {
                label: 'RD Credits Computed',
                value: formatAmount(Math.round(d.qreCost * 0.15)),
              },
              {
                label: 'Claimed Submitted',
                value: formatAmount(d.claimedAmount),
              },
              {
                label: 'Claimed Approved',
                value: formatAmount(d.creditsApproved),
              },
            ]}
          />
        </div>

        <div style={{ width: '60%', position: 'relative' }}>
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
    </div>
  );
};

export default WorldMapChart;
