import React, { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { AssignUsers, AssignGroups } from './tabs';
interface TabItem {
  label: string;
  content: React.ReactNode;
}

const Users: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs: TabItem[] = [
    {
      label: 'Assign Users',
      content: <AssignUsers />,
    },
    {
      label: 'Assign Group',
      content: <AssignGroups />,
    },
  ];
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <div>
      <div className='flex flex-col gap-0 border border-[#CBD6E2]'>
        <Box className='flex items-center justify-between gap-4 h-[38px] py-1 border-b border-[#CBD6E2]'>
          <Tabs
            value={activeTab}
            onChange={handleChange}
            TabIndicatorProps={{
              style: {
                backgroundColor: '#1565C0',
                height: '2px',
              },
            }}
            sx={{
              minHeight: '38px',
              '& .MuiTab-root': {
                minHeight: '38px',
                textTransform: 'none',
                fontWeight: 'normal',
                color: '#5F6B7C',
                fontSize: '14px',
                paddingX: '16px',
              },
              '& .Mui-selected': {
                color: '#172B4D',
                fontWeight: 600,
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} value={index} />
            ))}
          </Tabs>
        </Box>
        <Box>{tabs[activeTab].content}</Box>
      </div>
    </div>
  );
};

export default Users;
