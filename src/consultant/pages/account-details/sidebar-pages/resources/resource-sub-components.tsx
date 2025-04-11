import { Box, Tab, Tabs } from '@mui/material';
import React, { Fragment } from 'react';
import ResourceCostTable from './resource-cost/resource-cost-table';
import ResourceSkillTable from './resource-skill/resource-skill-table';

interface SubcomponentProps {
  handleTabChange: (event: React.SyntheticEvent, newValue: string) => void;
  value: string;
}

const ResourceSubComponents: React.FC<SubcomponentProps> = ({
  handleTabChange,
  value,
}) => {
  // const navigate = useNavigate();

  // const hanleClickNew = () => {
  //   navigate(`/resource/create`, { state: { value } });
  // };

  return (
    <Fragment>
      <Box className='mr-2'>
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
