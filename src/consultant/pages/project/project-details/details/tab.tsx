import { Box, Menu, MenuItem, Tab, Tabs } from '@mui/material';
import React, { useState } from 'react';
import ActionImportDropdown from '../../../account-details-sidebar/sidebar-pages/imports/importdropdown';

interface TabProps {
  value: string;
  setCurrentPage: (page: number) => void;
}
const TabPanel: React.FC<TabProps> = ({ setCurrentPage }) => {
  const [tabValue, setTabValue] = useState(0);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);

  const [, setSelectedSort] = useState('Accounts');
  const menuYear = [
    {
      label: '2024',
      onClick: () => console.log('manage user clicked'),
    },
    {
      label: '2023',
      onClick: () => console.log('Export clicked'),
    },
    {
      label: '2023',
      onClick: () => console.log('Export clicked'),
    },
    {
      label: '2022',
      onClick: () => console.log('Export clicked'),
    },
    {
      label: '2021',
      onClick: () => console.log('Export clicked'),
    },
  ];
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setCurrentPage(0);
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
      <Box className='flex justify-between items-center mb-4'>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
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
          <Tab
            label='Overview'
            sx={{
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              color: '#2D3E4F',
              backgroundColor: tabValue === 0 ? '#0BBFB70D' : '',
              margin: '0',
              border:
                tabValue === 0 ? '1px solid #0BBFB7' : '1px solid transparent',
              width: '120px',
              height: '28px',
              borderRadius: '4px',
              minHeight: '28px',
              padding: '8px 16px',
              '&:hover': {
                color: tabValue !== 0 ? '#0BBFB7' : undefined,
              },
            }}
          />
          <Tab
            label='Timeline'
            sx={{
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              color: '#2D3E4F',
              backgroundColor: tabValue === 1 ? '#0BBFB70D' : '',
              margin: '0',
              border:
                tabValue === 1 ? '1px solid #0BBFB7' : '1px solid transparent',
              width: '120px',
              height: '28px',
              borderRadius: '4px',
              minHeight: '28px',
              padding: '8px 16px',
              '&:hover': {
                color: tabValue !== 1 ? '#0BBFB7' : undefined,
              },
            }}
          />
        </Tabs>

        <Box className='flex items-center space-x-2'>
          <ActionImportDropdown
            variant={'outlined'}
            actions={menuYear}
            label='Fy-2024'
          />
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
