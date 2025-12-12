import React, { useState, useEffect, Suspense } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { CollapseViewIcon, ExpandViewIcon } from '../../assets';

export interface TabItem {
  label: string;
  value: string;
  hide?: boolean;
  disabled?: boolean;
}

export interface SectionHeaderTabProps {
  tabs: TabItem[];
  onTabChange?: (value: string) => void;
  defaultValue?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const SectionHeaderTab: React.FC<SectionHeaderTabProps> = ({
  tabs,
  onTabChange,
  defaultValue,
  isExpanded,
  onToggleExpand,
}) => {
  const visibleTabs = tabs.filter((tab) => !tab.hide);

  const getInitialTab = () => {
    if (defaultValue) {
      const defaultTab = tabs.find((tab) => tab.value === defaultValue);
      if (defaultTab && !defaultTab.hide) return defaultValue;
    }
    return visibleTabs[0]?.value ?? '';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.value === activeTab)) {
      setActiveTab(getInitialTab());
    }
    // eslint-disable-next-line
  }, [JSON.stringify(visibleTabs), defaultValue]);

  const handleChange = (_event: React.SyntheticEvent, newIndex: number) => {
    const newValue = visibleTabs[newIndex]?.value;
    if (!newValue) return;

    setActiveTab(newValue);
    onTabChange?.(newValue);
  };

  const activeIndex = visibleTabs.findIndex((tab) => tab.value === activeTab);

  return (
    <div className='flex flex-col gap-0 border border-[#CBD6E2] pl-3'>
      <Box className='flex items-center justify-between gap-4 h-[40px] py-1 border-b border-[#CBD6E2] pr-3'>
        <Tabs
          value={activeIndex}
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
          {visibleTabs.map((tab) => (
            <Tab key={tab.value} label={tab.label} disabled={tab.disabled} />
          ))}
        </Tabs>
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            className='flex border border-[#CBD6E2] w-[22px] h-[22px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer'
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <Suspense fallback={null}>
              {isExpanded ? (
                <CollapseViewIcon className='w-5 h-5' />
              ) : (
                <ExpandViewIcon className='w-5 h-5' />
              )}
            </Suspense>
          </button>
        )}
      </Box>
    </div>
  );
};

export default SectionHeaderTab;
