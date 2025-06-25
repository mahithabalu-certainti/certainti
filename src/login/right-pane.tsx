import { Box } from '@mui/material';
import React from 'react';
import { certaintiLogo, loginBg } from '../assets';
import { Image, Text } from '../components';
import { useAppTranslation } from '../hooks/use-app-translation';

/**
 * RightPane component displays the right side of the login page.
 * It includes a background image, a welcome message, and logos.
 */
export const RightPane: React.FC = () => {
  const t = useAppTranslation();

  return (
    <Box
      className='w-full h-full p-12 flex flex-col justify-between bg-[#F2F9F7]'
      sx={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Top section */}
      <Box className='flex-1 flex flex-col justify-center'>
        <Box className='flex flex-col gap-2'>
          <Text className='text-[48px] text-primary font-bold'>
            {t('core', 'login.thinkR&D')}
          </Text>
          <Box className='flex flex-wrap items-center gap-2'>
            <Text className='text-[12px] md:text-[18px] text-primary font-bold'>
              {t('core', 'login.poweredBy')}
            </Text>
            <Image
              src={certaintiLogo}
              className='w-auto h-[12px] md:h-[18px]'
              alt='Certainti.ai'
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
