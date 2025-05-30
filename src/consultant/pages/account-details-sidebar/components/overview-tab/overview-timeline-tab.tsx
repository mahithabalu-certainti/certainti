import { Box, Tab, Tabs } from '@mui/material';
import ActionImportDropdown from '../../sidebar-pages/imports/importdropdown';

interface TabProps {
  tabValue: number;
  setTabValue?: (value: React.SetStateAction<number>) => void;
  menuActivity: {
    label: string;
    onClick: () => void;
  }[];
  handleTabChange: (_event: React.SyntheticEvent, newValue: number) => void;
}

const OverviewTimelineTab: React.FC<TabProps> = ({
  tabValue,
  handleTabChange,
  menuActivity,
}) => {
  const tabChange = (_event: React.SyntheticEvent, newValue: number) => {
    handleTabChange(_event, newValue);
  };

  return (
    <div className='w-full'>
      <Box className='flex justify-between items-center mb-2'>
        <Tabs
          value={tabValue}
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
          <Tab
            label='Overview'
            sx={{
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: tabValue === 0 ? '500' : '400',
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
              fontWeight: tabValue === 1 ? '500' : '400',
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
            variant={'filled'}
            actions={menuActivity}
            label='Add Activity'
            sx={{
              fontWeight: 400,
              fontSize: '13px',
              width: '143px',
              height: '32px',
              paddingLeft: '16px',
            }}
          />
        </Box>
      </Box>
    </div>
  );
};

export default OverviewTimelineTab;
