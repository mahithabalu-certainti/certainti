import { Box, Tab, Tabs } from '@mui/material';
import React, { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResourceCostTable from './resource-cost/resource-cost-table';
import ResourceSkillTable from './resource-skill/resource-skill-table';

const ResourceSubComponents: React.FC = () => {
  const navigate = useNavigate();
  const [selectedResourceInfo, setSelectedResourceInfo] =
    React.useState<any>(null);
  const [value, setValue] = useState('details');
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>();

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const hanleClickNew = () => {
    navigate(`/resource/create`, { state: { value } });
  };
  return (
    <Fragment>
      <Box>
        <Tabs
          value={value}
          onChange={handleTabChange}
          aria-label='navigation tabs'
          className='border border-solid border-[#CBD6E2]'
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#0B5CAB',
            },
          }}
        >
          <Tab
            label='Details'
            value={'details'}
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
        {value === 'details' && <Box>Details Content</Box>}
        {value === 'cost' && (
          <Box>
            <ResourceCostTable />
          </Box>
        )}
        {value === 'skill' && (
          <Box>
            <ResourceSkillTable />
          </Box>
        )}
      </Box>
    </Fragment>
  );
};

export default ResourceSubComponents;
