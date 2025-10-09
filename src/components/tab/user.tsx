import React, { useEffect, useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { clearFilters } from '../filter-component/utils';
import { FilterType } from '../../admin/types';

interface TabItem {
  label: string;
  content: React.ReactNode;
}

interface UsersProps {
  tabs: TabItem[];
  setAppliedFilters: React.Dispatch<
    React.SetStateAction<Record<string, FilterType>>
  >;
  resetSearch?: boolean;
  onSearchReset?: () => void;
}

const Users: React.FC<UsersProps> = ({ tabs, setAppliedFilters }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = Number(searchParams.get('tabIndex')) || 0;

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tabParam = Number(searchParams.get('tabIndex'));
    if (!isNaN(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    searchParams.set('tabIndex', newValue.toString());
    setSearchParams(searchParams, { replace: true });
    clearFilters();
    setAppliedFilters({});
  };

  return (
    <div>
      <div className='flex flex-col gap-0 border border-[#CBD6E2]'>
        <Box className='flex items-center justify-between gap-4 h-[38px] py-1 border-b border-[#CBD6E2]'>
          <Tabs
            value={activeTab}
            onChange={handleChange}
            TabIndicatorProps={{
              style: {
                backgroundColor: '#1565C0',
                height: '2px',
              },
            }}
            sx={{
              minHeight: '38px',
              '& .MuiTab-root': {
                minHeight: '38px',
                textTransform: 'none',
                fontWeight: 'normal',
                color: '#5F6B7C',
                fontSize: '14px',
                paddingX: '16px',
              },
              '& .Mui-selected': {
                color: '#172B4D',
                fontWeight: 600,
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} value={index} />
            ))}
          </Tabs>
        </Box>
        <Box>{tabs[activeTab]?.content}</Box>
      </div>
    </div>
  );
};

export default Users;
