import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import React from 'react';
import { ILeftPane } from '../../consultant/types';
import { useAppTranslation } from '../../hooks/use-app-translation';
import { Text } from '../../components';

/**
 * LeftPane component displays the left side of the login page.
 * It includes a welcome message and a login button.
 *
 * @param {ILeftPane} props - The props for the component.
 * @param {() => void} props.handleLogin - The function to handle the login process.
 */
export const LeftPane: React.FC<ILeftPane> = ({ handleLogin, isLoading }) => {
  const t = useAppTranslation();

  return (
    <Box className='w-full px-8 py-12 flex flex-col justify-center max-w-md mx-auto'>
      {/* Welcome message */}
      <Text className='text-[28px] md:text-[48px] text-primary font-bold'>
        {t('core', 'login.welcome')}
      </Text>
      <Text className='text-[15px] md:text-[20px] text-primary font-normal'>
        {t('core', 'login.welcomeNote')}
      </Text>

      {/* Login button */}
      <Button
        onClick={handleLogin}
        disabled={isLoading}
        sx={{
          width: '100%',
          mt: 2,
          px: 2,
          py: 1,
          color: '#425A76',
          fontSize: '16px',
          fontWeight: 600,
          textTransform: 'none',
          borderRadius: 1,
          border: '1px solid #F16137',
          '&:hover': {
            backgroundColor: '#F16137',
            color: '#FFFFFF',
          },
        }}
      >
        {isLoading ? <span className='loader' /> : t('core', 'login.button')}
      </Button>
    </Box>
  );
};
