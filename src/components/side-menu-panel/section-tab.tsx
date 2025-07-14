import { Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Switch, Tab, Tabs } from '@mui/material';
import { RefreshIcon, ResourceFilterIcon } from '../../assets';
import Filter from '../../consultant/pages/account-details-sidebar/components/filter/filter';
import ActionImportDropdown from '../../consultant/pages/account-details-sidebar/sidebar-pages/imports/importdropdown';
import { clearFilters } from '../../consultant/pages/account-details-sidebar/components/filter/utils';
import { FieldConfig } from '../../consultant/pages/account-details-sidebar/components/filter/filterType';

interface TabOption {
  id: string;
  name: string;
  hide?: boolean;
  disable?: boolean;
}

interface TabPanelProps {
  tabs?: TabOption[];
  filterVisibility: boolean;
  showFilter: boolean;
  filterMenu?: FieldConfig[];
  contextKey: string;

  setCurrentPage: (page: number) => void;
  appliedFilters: Record<string, string | number | boolean>;
  setAppliedFilters: (
    filters: Record<string, string | number | boolean>
  ) => void;

  handleFilter: () => void;
  handleSorting?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  sortFilterCount: number;
  setSortFilterCount: (count: number) => void;

  showRefresh?: boolean;
  onRefreshClick?: () => void;
  toggleEnabled?: boolean;
  setToggleEnabled?: (val: boolean) => void;
}

const SectionTabPanel: React.FC<TabPanelProps> = ({
  tabs,
  filterVisibility,
  showFilter,
  filterMenu = [],
  contextKey,

  setCurrentPage,
  appliedFilters,
  setAppliedFilters,

  handleFilter,
  handleSorting,
  sortFilterCount,
  setSortFilterCount,

  showRefresh,
  onRefreshClick,
  toggleEnabled,
  setToggleEnabled,
}) => {
  const location = useLocation();
  const [tabValue, setTabValue] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] =
    useState<HTMLButtonElement | null>(null);

  const isFilterOpen = Boolean(filterAnchorEl);
  const filterId = isFilterOpen
    ? `resource-${contextKey}-filter-popover`
    : undefined;

  useEffect(() => {
    const activeTab = tabs?.find((tab) => !tab.hide)?.id;
    setTabValue(activeTab || '');
  }, [tabs]);

  useEffect(() => {
    setAppliedFilters({});
    clearFilters(contextKey || 'resource');
    setSortFilterCount(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleTabChange = (_e: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
    setCurrentPage(0);
    setAppliedFilters({});
    clearFilters(contextKey || 'resource');
    setSortFilterCount(0);
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToggleEnabled?.(e.target.checked);
  };

  const handleFilterModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(e.currentTarget);
    if (!showFilter) handleFilter();
  };

  const handleCloseFilter = () => {
    setFilterAnchorEl(null);
    if (showFilter) handleFilter();
  };

  const menuActivity = [
    { label: 'Create Task', onClick: () => console.log('Task') },
    { label: 'Draft Email', onClick: () => console.log('Email') },
    { label: 'Schedule Meeting', onClick: () => console.log('Meeting') },
    { label: 'Log a call', onClick: () => console.log('Call') },
  ];

  return (
    <Box>
      <Box className='flex justify-between items-center mb-2'>
        {tabValue && (
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              border: '1px solid #CBD6E27D',
              padding: '3px',
              minHeight: '32px',
              '& .MuiTabs-indicator': { display: 'none' },
            }}
          >
            {tabs?.map((tab, i) =>
              tab.hide ? null : (
                <Tab
                  key={i}
                  value={tab.id}
                  label={tab.name}
                  disabled={tab.disable}
                  sx={{
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: tabValue === tab.id ? '500' : '400',
                    color: '#2D3E4F',
                    backgroundColor: tabValue === tab.id ? '#0BBFB70D' : '',
                    border:
                      tabValue === tab.id
                        ? '1px solid #0BBFB7'
                        : '1px solid transparent',
                    width: '120px',
                    height: '24px',
                    borderRadius: '4px',
                    minHeight: '24px',
                    padding: '8px 16px',
                    '&:hover': {
                      color: tabValue === tab.id ? '#0BBFB7' : undefined,
                    },
                  }}
                />
              )
            )}
          </Tabs>
        )}

        <Box className='flex items-center'>
          {tabValue === 'account_projects_view_overview' && (
            <div className='flex items-center gap-2'>
              <span className='font-semibold text-[13px] text-[#425A76]'>
                Include Parent
              </span>
              <Switch
                checked={toggleEnabled}
                onChange={handleToggleChange}
                size='small'
                color='success'
              />
            </div>
          )}

          {filterVisibility && contextKey !== 'details' && (
            <>
              <Box className='relative'>
                <Box
                  component='button'
                  onClick={handleFilterModal}
                  className='w-[24px] h-[24px] max-h-[24px] flex items-center justify-center border border-[#CBD6E2] rounded-[2px] cursor-pointer'
                  aria-describedby={filterId}
                >
                  <ResourceFilterIcon />
                  {(Object.keys(appliedFilters).length > 0 ||
                    sortFilterCount > 0) && (
                    <div className='absolute -top-[8px] -right-1.5 w-4 h-4 flex items-center justify-center text-xs'>
                      <span className='absolute w-full h-full bg-[#FF6666] rounded-full animate-ping opacity-75 z-0'></span>
                      <span className='w-3.5 h-3.5 bg-[#FF6666] text-white rounded-full flex items-center justify-center z-10 font-semibold'>
                        {Object.keys(appliedFilters).length + sortFilterCount}
                      </span>
                    </div>
                  )}
                </Box>

                <Suspense fallback={null}>
                  <Filter
                    value={contextKey}
                    isOpen={isFilterOpen && showFilter}
                    filterAnchorEl={filterAnchorEl}
                    filterId={filterId}
                    filterMenu={filterMenu}
                    setAppliedFilters={setAppliedFilters}
                    handleCloseFilter={handleCloseFilter}
                    setCurrentPage={setCurrentPage}
                    mode='date'
                    handleSorting={handleSorting}
                  />
                </Suspense>
              </Box>

              {showRefresh && (
                <button
                  className='flex border border-[#CBD6E2] ml-2 w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer'
                  onClick={onRefreshClick}
                >
                  <RefreshIcon alt='refresh-icon' className='h-4' />
                </button>
              )}
            </>
          )}

          <ActionImportDropdown
            variant='filled'
            actions={menuActivity}
            label='Add Activity'
            sx={{
              fontWeight: 600,
              fontSize: '13px',
              width: '143px',
              height: '24px',
              display: 'none',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default SectionTabPanel;
