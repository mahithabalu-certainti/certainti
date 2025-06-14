import { Box } from '@mui/material';
import React from 'react';
import { Text } from '../../../components';
import { useAppTranslation } from '../../../hooks/use-app-translation';

export const NotFound: React.FC = () => {
  const t = useAppTranslation();
  return (
    <Box className='flex flex-col items-center justify-center min-h-screen'>
      <Text className='text-[28px] text-primary font-bold'>
        {t('core', 'notFound.title')}
      </Text>
      <Text className='text-[28px] text-primary'>
        {t('core', 'notFound.message')}
      </Text>
    </Box>
  );
};

export default NotFound;
