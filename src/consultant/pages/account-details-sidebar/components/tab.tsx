import { Box, Menu, MenuItem, Tab, Tabs } from '@mui/material';
import React, { useState } from 'react';
import ActionImportDropdown from '../sidebar-pages/imports/importdropdown';
import {
  costFilterFields,
  resourceFilterFields,
  skillFilterFields,
} from '../sidebar-pages/resources/utils';
import { Image } from '../../../../components';
import { resourceFilterIcon } from '../../../../assets';
import Filter from './filter/filter';
interface TabProps {
  filterVisibility: boolean;
  handleFilter: () => void;
  value: string;
  showFilter: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setAppliedFilters: (filters: Record<string, any>) => void;
}
const TabPanel: React.FC<TabProps>  = ({
  handleFilter,
  setAppliedFilters,
  value,
  showFilter,
  filterVisibility,
}) => {
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

  // const MENU_ITEMS = [
  //   {
  //     label: 'Assign Permission to User',
  //     onClick: () => console.log('user clicked'),
  //   },
  //   {
  //     label: 'View Permissions',
  //     onClick: () => console.log('View Permissions clicked'),
  //   },
  // ];
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
  const menuAccounts = [
    {
      label: 'Recently Added',
      onClick: () => console.log('manage user clicked'),
    },
    {
      label: 'Ascending',
      onClick: () => console.log('Export clicked'),
    },
    {
      label: 'Descending',
      onClick: () => console.log('Export clicked'),
    },
    {
      label: 'Popularity',
      onClick: () => console.log('Export clicked'),
    },
  ];
    const getFilterFields = () => {
      if (!value) return resourceFilterFields;
      return value === 'cost' ? costFilterFields : skillFilterFields;
    };

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
              fontWeight: 400,
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
              fontWeight: 400,
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
          {/* <ActionsDropdown actions={MENU_ITEMS} /> */}
          <Box className='relative'>
            {filterVisibility && (
              <Box
                onClick={handleFilter}
                className='h-[35px] w-[38px] flex items-center justify-center border border-[#CBD6E2] cursor-pointer'
              >
                <Image src={resourceFilterIcon} />
              </Box>
            )}
            {showFilter && value !== 'details' && (
              <Box className='absolute right-0 z-50'>
                <Filter
                  filterMenu={getFilterFields()}
                  setAppliedFilters={setAppliedFilters}
                  handleFilter={handleFilter}
                />
              </Box>
            )}
          </Box>
          <ActionImportDropdown
            variant={'filled'}
            actions={menuActivity}
            label='Add Activity'
          />

          <ActionImportDropdown
            actions={menuAccounts}
            label='Sort By: Accounts'
            split='true'
          />
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
