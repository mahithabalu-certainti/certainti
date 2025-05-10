import { Box, Menu, MenuItem, Tab, Tabs } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { resourceFilterIcon } from '../../../../assets';
import { Image } from '../../../../components';
import ActionImportDropdown from '../sidebar-pages/imports/importdropdown';
import {
  getCostFilterFields,
  getSkillFilterFields,
  resourceFilterFields,
} from '../sidebar-pages/resources/utils';
import Filter from './filter/filter';
import { FilterState } from './filter/filterType';
import { useFetchCurrency } from '../../../services/account';
import { resetFilter } from './filter/utils';
import { useFetchResourceSkillSubType, useFetchResourceSkillType } from '../../../services/resource-skill/resource-skill-service';
import { SkillSubtype, SkillType } from '../../../types/resource';
interface TabProps {
  filterVisibility: boolean;
  handleFilter: () => void;
  value: string;
  showFilter: boolean;
  setCurrentPage: (page: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setAppliedFilters: (filters: Record<string, any>) => void;
  filterStates?: Record<string, FilterState>;
  selectedFilters?: string[];
  setFilterStates: (filterStates: Record<string, FilterState>) => void;  
  setSelectedFilters: (selectedFilters: string[]) => void;
}
const TabPanel: React.FC<TabProps> = ({
  handleFilter,
  setAppliedFilters,
  value,
  showFilter,
  filterVisibility,
  setCurrentPage,
  filterStates,
  selectedFilters,
  setFilterStates,
  setSelectedFilters
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [currentSkillType, setCurrentSkillType] = useState({
    skill_type_rid: '',
    skill_subtype_rid: '',
  });
  console.log('currentSkillType', currentSkillType)

  const [skillSubTypeData, setSkillSubTypeData] = useState<{ option: string; value: string }[]>([]);
  const [, setSelectedSort] = useState('Accounts');
 
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setCurrentPage(0)
    resetFilter({
      setAppliedFilters,
      setFilterStates,
      setSelectedFilters,
    });
  };
  const currency = useFetchCurrency();
  const { data: skillType } = useFetchResourceSkillType();
  const { data: skillSubType } = useFetchResourceSkillSubType(currentSkillType.skill_type_rid || null as string | null);

  const memoizedSkillType: { option: string; value: string }[] = useMemo(() => {
    const data = skillType as SkillType[];
    return (
      data?.map((skill: SkillType) => ({
        option: skill.skill_type_name,
        value: skill.rid,
      })) || []
    );
  }, [skillType]);

  useEffect(()=>{
      const data = skillSubType as SkillSubtype[];
      const finalData = data?.map((skill: SkillSubtype) => ({
        option: skill.skill_subtype_name,
        value: skill.rid,
      })) || []
      setSkillSubTypeData(finalData)
  },[skillSubType])

  useEffect(()=>{
    console.log('filterStates', filterStates)
    if(filterStates?.skill_type_rid?.enum?.value){
      setCurrentSkillType({
        skill_type_rid: filterStates?.skill_type_rid?.enum?.value as unknown as string,
        skill_subtype_rid: filterStates?.skill_sub_type?.enum?.value as unknown as string
      })
    }
  },[filterStates])
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

  const memoizedCurrency: { option: string; value: string }[] = useMemo(
    () =>
      currency.data?.data.currency.map((account: { currency_code: string; rid: string }) => ({
        option: account.currency_code,
        value: account.rid,
      })) || [],
    [currency.data?.data.currency]
  );

  const getFilterFields = () => {
    if (!value) return resourceFilterFields;
    return value === 'cost' ? getCostFilterFields(memoizedCurrency) : getSkillFilterFields(memoizedSkillType, skillSubTypeData);
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
          {/* <ActionsDropdown actions={MENU_ITEMS} /> */}
          <Box className='relative'>
            {filterVisibility && (
              <Box
                onClick={handleFilter}
                className='h-[32px] w-[32px] flex items-center justify-center border border-[#CBD6E2] rounded-[2px] cursor-pointer'
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
                  savedFilterStates={filterStates}
                  onFilterStatesChange={setFilterStates}
                  savedSelectedFilters={selectedFilters}
                  onSelectedFiltersChange={setSelectedFilters}
                  setCurrentPage={setCurrentPage}
                />
              </Box>
            )}
          </Box>
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
