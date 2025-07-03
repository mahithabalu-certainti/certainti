import { Box } from '@mui/material';
import React from 'react';
import { ComingSoon } from '../../assets';

export const NotFound: React.FC = () => {
  return (
    <Box className='flex items-center justify-center h-full'>
      <ComingSoon alt='comingSoon' />
    </Box>
  );
};

export default NotFound;
