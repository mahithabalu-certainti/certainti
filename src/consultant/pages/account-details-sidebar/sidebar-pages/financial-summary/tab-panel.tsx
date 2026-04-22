// TabPanel.tsx
import { Box } from '@mui/material';
import React from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`rd-tabpanel-${index}`}
      aria-labelledby={`rd-tab-${index}`}
      className='py-4'
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};
