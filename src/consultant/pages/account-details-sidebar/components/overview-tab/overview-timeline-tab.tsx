import { Box, Tab, Tabs } from '@mui/material';
import ActionImportDropdown from '../../sidebar-pages/imports/importdropdown';
import { DetailsTabs } from '../../sidebar-pages/details/details';
import { useEffect, useState } from 'react';

interface TabProps {
  tabValue: string;
  detailsTab: DetailsTabs[];
  isAccountDetailActivityEnable?: boolean;
  setTabValue?: (value: React.SetStateAction<number>) => void;
  menuActivity: {
    label: string;
    onClick: () => void;
  }[];
  handleTabChange: (_event: React.SyntheticEvent, newValue: string) => void;
}

const OverviewTimelineTab: React.FC<TabProps> = ({
  menuActivity,
  detailsTab,
  tabValue,
  isAccountDetailActivityEnable,
  handleTabChange,
}) => {
  const [currentValue, setCurrentValue] = useState(tabValue);

  useEffect(() => {
    // assign default tab value
    const activeTab = detailsTab?.find((tab) => !tab.hide)?.id;
    setCurrentValue(activeTab as string);
  }, [detailsTab]);

  const tabChange = (_event: React.SyntheticEvent, newValue: string) => {
    handleTabChange(_event, newValue);
    setCurrentValue(newValue);
  };

  return (
    <div className='w-full'>
      <Box className='flex justify-between items-center mb-2'>
        {currentValue && (
          <Tabs
            value={currentValue}
            onChange={tabChange}
            sx={{
              border: '1px solid #CBD6E27D',
              padding: '3px',
              minHeight: '34px',
              '& .MuiTabs-indicator': {
                display: 'none',
                '& .MuiTabs-root': {
                  borderBottom: 'none',
                },
              },
            }}
          >
            {detailsTab.map((tab, index) => {
              const isActive = currentValue === tab.id;
              if (tab.hide) return null;
              return (
                <Tab
                  key={index}
                  label={tab.name}
                  value={tab.id}
                  disabled={tab.disable}
                  sx={{
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: isActive ? '500' : '400',
                    color: '#2D3E4F',
                    backgroundColor: isActive ? '#0BBFB70D' : '',
                    margin: '0',
                    border: isActive
                      ? '1px solid #0BBFB7'
                      : '1px solid transparent',
                    width: '120px',
                    height: '28px',
                    borderRadius: '4px',
                    minHeight: '28px',
                    padding: '8px 16px',
                    '&:hover': {
                      color: !isActive ? '#0BBFB7' : undefined,
                    },
                  }}
                />
              );
            })}
          </Tabs>
        )}
        {isAccountDetailActivityEnable && (
          <Box className='flex items-center space-x-2'>
            <ActionImportDropdown
              variant={'filled'}
              actions={menuActivity}
              label='Add Activity'
              sx={{
                fontWeight: 600,
                fontSize: '13px',
                width: '143px',
                height: '24px',
              }}
            />
          </Box>
        )}
      </Box>
    </div>
  );
};

export default OverviewTimelineTab;
