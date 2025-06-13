import { Box } from '@mui/material';
import React from 'react';
import { comingSoon } from '../../../assets';

export const NotFound: React.FC = () => {
  return (
    <Box className='flex items-center justify-center h-full'>
      <img src={comingSoon} alt='comingSoon' />
    </Box>
  );
};
