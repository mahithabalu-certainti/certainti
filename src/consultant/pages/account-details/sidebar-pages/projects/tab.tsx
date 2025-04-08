/* eslint-disable @typescript-eslint/no-unused-vars */
import { Box, Menu, MenuItem, Tab, Tabs } from '@mui/material';
import React, { useState } from 'react';
import { ActionsDropdown } from '../../../../../components';
import { Dropdown } from '../../../../../components/dropdown';
import { SortByDropdown } from '../../../../../components/sortby-dropdown';

const TabPanel: React.FC = () => {
  const [tabValue, setTabValue] = useState('overview');
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSort, setSelectedSort] = useState('Accounts');

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  const handleSortClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortSelect = (sortOption: string) => {
    setSelectedSort(sortOption);
    handleSortClose();
  };

  const MENU_ITEMS = [
    {
      label: 'Assign Permission to User',
      onClick: () => console.log('user clicked'),
    },
    {
      label: 'View Permissions',
      onClick: () => console.log('View Permissions clicked'),
    },
  ];

  return (
    <Box className='p-4 rounded-lg'>
      <Box className='flex justify-between items-center mb-4'>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          className='border-1 border-gray-300'
          sx={{
            minHeight: '36px',
            '& .MuiTabs-indicator': {
              height: '3px',
              backgroundColor: '#1A3D6F',
            },
          }}
        >
          <Tab
            label='Overview'
            className='border-2 border-gray-300'
            sx={{
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 600,
              color: tabValue === 'overview' ? '#1A3D6F' : '#6B7280',
              backgroundColor:
                tabValue === 'overview' ? '#F9FAFB' : 'transparent',
              margin: tabValue === 'overview' ? '0' : '0',
              border:
                tabValue === 'overview'
                  ? '2px solid #1A3D6F'
                  : '2px solid transparent',
              minHeight: '36px',
              padding: '8px 16px',
              '&.Mui-selected': {
                color: '#1A3D6F',
              },
            }}
          />
          <Tab
            label='Timeline'
            className='border-2 border-gray-300'
            sx={{
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 600,
              color: tabValue === 'timeline' ? '#1A3D6F' : '#6B7280',
              minHeight: '36px',
              padding: '8px 16px',
              '&.Mui-selected': {
                color: '#1A3D6F',
              },
            }}
          />
        </Tabs>

        <Box className='flex items-center space-x-2'>
          <Dropdown
            options={[
              { value: 'FY-2024', label: 'FY-2024' },
              { value: 'FY-2024', label: 'FY-2024' },
              { value: 'FY-2024', label: 'FY-2024' },
              { value: 'FY-2024', label: 'FY-2024' },
            ]}
            defaultValue='FY-2024'
            onChange={(value) => console.log('Selected:', value)}
          />
          <ActionsDropdown actions={MENU_ITEMS} />
          <SortByDropdown />
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
