import { Box, Menu, MenuItem, Tab, Tabs } from '@mui/material';
import React, { useState } from 'react';
import { leftArrowIcon } from '../../../../assets';
import { ActionsDropdown } from '../../../../components';
import { FiscalYearDropdown } from './fiscal-year-dropdown';

interface TabPanelProps {
  viewMode: boolean;
  onExitView: () => void;
  title: string;
}

const TabPanel: React.FC<TabPanelProps> = ({ viewMode, onExitView, title }) => {
  const [tabValue, setTabValue] = useState(0);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [, setSelectedSort] = useState('Accounts');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
        {viewMode ? (
          <div className='flex gap-2 cursor-pointer' onClick={onExitView}>
            <img src={leftArrowIcon} alt='' />
            {title}
          </div>
        ) : (
          // <Button
          //   variant='outlined'
          //   onClick={onExitView}
          //   className='text-blue-600 border-blue-600'
          //   sx={{
          //     textTransform: 'none',
          //     fontSize: '14px',
          //     fontWeight: 600,
          //     minHeight: '36px',
          //     padding: '8px 16px',
          //   }}
          // >
          //   Exit View
          // </Button>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            className='border-1 border-gray-300'
            sx={{
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
                fontWeight: 600,
                color: tabValue === 0 ? '#0BBFB726' : '',
                backgroundColor: tabValue === 0 ? '#0BBFB726' : '',
                margin: '0',
                border: tabValue === 0 ? '2px solid #0BBFB7' : '',
                minHeight: '36px',
                padding: '8px 16px',
                '&.Mui-selected': {
                  color: '#1A3D6F',
                },
              }}
            />
            <Tab
              label='Timeline'
              sx={{
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 600,
                color: tabValue === 1 ? '#0BBFB726' : '',
                backgroundColor: tabValue === 1 ? '#0BBFB726' : '',
                margin: '0',
                border: tabValue === 1 ? '2px solid #0BBFB7' : '',
                minHeight: '36px',
                padding: '8px 16px',
                '&.Mui-selected': {
                  color: '#1A3D6F',
                },
              }}
            />
          </Tabs>
        )}

        <Box className='flex items-center space-x-2'>
          <FiscalYearDropdown />
          <ActionsDropdown actions={MENU_ITEMS} />
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
