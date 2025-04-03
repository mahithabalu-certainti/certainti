import { Box } from '@mui/material';
import React from 'react';
import { certaintiLogo, loginBg, onrouteLogo } from '../../../assets';
import { Image, Text } from '../../../components';
import { useAppTranslation } from '../../../hooks/use-app-translation';

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
          {/* Welcome message */}
          <Text className='text-[28px] md:text-[48px] text-primary font-bold'>
            {t('core', 'login.enterpriseAssist')}
          </Text>
          <Text className='text-[15px] md:text-[20px] text-secondary font-medium'>
            {t('core', 'login.enablingAIExcellence')}
          </Text>
          {/* Onroute logo */}
          <Image
            src={onrouteLogo}
            alt='Onroute'
            className='w-[200px] h-[42px] md:w-[360px] md:h-[62px]'
          />
        </Box>
      </Box>

      {/* Bottom section */}
      <Box className='mt-auto'>
        <Box className='flex flex-wrap items-center gap-2'>
          {/* Powered by message */}
          <Text className='text-[12px] md:text-[18px] font-medium mt-1'>
            {t('core', 'login.poweredBy')}
          </Text>
          {/* Certainti logo */}
          <Image
            src={certaintiLogo}
            className='w-auto h-[12px] md:h-[18px]'
            alt='Certainti.ai'
          />
        </Box>
      </Box>
    </Box>
  );
};
