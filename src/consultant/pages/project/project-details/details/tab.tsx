import { Box, Menu, MenuItem, Tab, Tabs } from '@mui/material';
import React, { useEffect, useState } from 'react';
import ActionImportDropdown from '../../../account-details-sidebar/sidebar-pages/imports/importdropdown';
import { DetailsTabs } from './project-data';

interface TabProps {
  detailsTab: DetailsTabs[];
  tabValue: string;
  setCurrentPage: (page: number) => void;
  handleTabChange: (_event: React.SyntheticEvent, newValue: string) => void;
}
const TabPanel: React.FC<TabProps> = ({
  detailsTab,
  tabValue,
  setCurrentPage,
  handleTabChange,
}) => {
  const [currentValue, setCurrentValue] = useState(tabValue);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);

  const [, setSelectedSort] = useState('Accounts');

  useEffect(() => {
    // assign default tab value
    const activeTab = detailsTab?.find((tab) => !tab.hide)?.id;
    setCurrentValue(activeTab as string);
  }, [detailsTab]);

  const tabChange = (_event: React.SyntheticEvent, newValue: string) => {
    handleTabChange(_event, newValue);
    setCurrentPage(0);
    setCurrentValue(newValue);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortSelect = (sortOption: string) => {
    setSelectedSort(sortOption);
    handleSortClose();
  };

  const menuActivity = [
    {
      label: 'Create Task',
      onClick: () => console.log('manage user clicked'),
    },
    {
      label: 'Draft Email',
      onClick: () => console.log('Export clicked'),
    },
    {
      label: 'Schedule Meeting',
      onClick: () => console.log('Export clicked'),
    },
    {
      label: 'Log a call',
      onClick: () => console.log('Export clicked'),
    },
  ];

  return (
    <Box className=' rounded-lg'>
      <Box className='flex justify-between items-center mb-2.5'>
        {currentValue && (
          <Tabs
            value={currentValue}
            onChange={tabChange}
            sx={{
              border: '1px solid #CBD6E27D',
              padding: '3px',
              minHeight: '36px',
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

        <Box className='flex items-center space-x-2'>
          <ActionImportDropdown
            variant={'filled'}
            actions={menuActivity}
            label='Add Activity'
          />

          {/* <ActionImportDropdown
            actions={menuAccounts}
            label='Sort By: Accounts'
            split='true'
          /> */}
        </Box>
      </Box>

      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
      >
        <MenuItem onClick={() => handleSortSelect('Accounts')}>
          Accounts
        </MenuItem>
        <MenuItem onClick={() => handleSortSelect('Date')}>Date</MenuItem>
        <MenuItem onClick={() => handleSortSelect('Amount')}>Amount</MenuItem>
        <MenuItem onClick={() => handleSortSelect('User')}>User</MenuItem>
      </Menu>
    </Box>
  );
};

export default TabPanel;
