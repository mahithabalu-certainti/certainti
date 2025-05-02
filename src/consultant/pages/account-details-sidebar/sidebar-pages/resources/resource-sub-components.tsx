/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Tab, Tabs } from '@mui/material';
import React, { Fragment } from 'react';
import { AccountData } from '../../../account-details/utils';
import ResourceCostTable from './resource-cost/resource-cost-table';
import ResourceDetails from './resource-details/resource-details';
import ResourceSkillTable from './resource-skill/resource-skill-table';

interface SubcomponentProps {
  handleTabChange: (event: React.SyntheticEvent, newValue: string) => void;
  value: string;
  resourceId: string;
  accountId: string;
  appliedFilters: Record<string, any>;
  fiscalYearValue: number;
  accountDetails: AccountData;
  setFilterVisibility: (value: boolean) => void;
  setShowFilter: (value: boolean) => void;
}

const ResourceSubComponents: React.FC<SubcomponentProps> = ({
  handleTabChange,
  value,
  resourceId,
  accountId,
  appliedFilters,
  fiscalYearValue,
  accountDetails,
  setFilterVisibility,
  setShowFilter,
}) => {
  return (
    <Fragment>
      <Box className='max-w-[100%]  border-b border-[1px] border-t-0 border-[#CBD6E2] rounded-bl-[2px] rounded-br-[2px] bg-white'>
        <Tabs
          value={value}
          onChange={handleTabChange}
          aria-label='navigation tabs'
          className='border-l-0 border-r-0 border-[1px] pl-4.5 border-solid border-[#CBD6E2]'
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#0B5CAB',
            },
          }}
        >
          <Tab
            label='Details'
            value={'details'}
            onClick={() => {
              setFilterVisibility(false);
              setShowFilter(false);
            }}
            sx={{
              textTransform: 'none',
              '&.Mui-selected': {
                color: '#2D3E4F',
                fontWeight: 600,
              },
            }}
          />
          <Tab
            label='Resource Cost'
            value={'cost'}
            onClick={() => setFilterVisibility(true)}
            sx={{
              textTransform: 'none',
              '&.Mui-selected': {
                color: '#2D3E4F',
                fontWeight: 600,
              },
            }}
          />
          <Tab
            label='Resource Skill'
            value={'skill'}
            onClick={() => setFilterVisibility(true)}
            sx={{
              textTransform: 'none',
              '&.Mui-selected': {
                color: '#2D3E4F',
                fontWeight: 600,
              },
            }}
          />
        </Tabs>

        {/* You can add the content for each tab below */}
        {value === 'details' && (
          <Box>
            <ResourceDetails
              resourceId={resourceId}
              accountId={accountId}
            />
          </Box>
        )}

        {value === 'cost' && (
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <ResourceCostTable
              fiscalYear={fiscalYearValue}
              appliedFilters={appliedFilters}
              accountDetails={accountDetails}
              resourceRid={resourceId}
            />
          </Box>
        )}

        {value === 'skill' && (
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <ResourceSkillTable
              fiscalYear={fiscalYearValue}
              appliedFilters={appliedFilters}
              accountDetails={accountDetails}
              resourceRid={resourceId}
            />
          </Box>
        )}
      </Box>
    </Fragment>
  );
};

export default ResourceSubComponents;
