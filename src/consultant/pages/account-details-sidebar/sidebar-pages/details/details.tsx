import { Box } from '@mui/material';
import { useState } from 'react';
import OverviewTimelineTab from '../../components/overview-tab/overview-timeline-tab';
import {
  detailsKeyContactErrorIcon,
  realatedListDetailsIcon,
} from '../../../../../assets';
import TextButton from '../../../../../components/button/text-button';
import DetailsInfo from './details-info';
import { accountDetailsProps } from '../../../account-details/utils';

const BUTTON_STYLES = {
  height: '26px !important',
  fontSize: '13px',
  fontWeight: 400,
};

// interface ErrorProps {
//   message?: string;
// }
interface DetailsProps {
  accountDetails?: accountDetailsProps; // need to change once api info is availableRecord<string, any>
  isLoading?: boolean;
  isError?: boolean; // ErrorProps | null | undefined;
}

const Details: React.FC<DetailsProps> = ({
  accountDetails,
  isLoading,
  isError,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  const isKeyContactAvailable =
    accountDetails?.accountDetails?.keyContacts &&
    accountDetails.accountDetails.keyContacts.length > 0;

  const menuActivity = [
    {
      label: 'Create Task',
      onClick: () => console.log('manage user clicked'),
    },
    {
      label: 'Draft Email',
      onClick: () => console.log('Export clicked'),
    },
    {
      label: 'Schedule Meeting',
      onClick: () => console.log('Export clicked'),
    },
    {
      label: 'Log a call',
      onClick: () => console.log('Export clicked'),
    },
  ];

  const headerButtons = [
    {
      label: 'Edit',
      variant: 'outlined' as const,
      disabled: false, //accountInActive,
      onClick: () => console.log('edit clicked'),
      sx: { ...BUTTON_STYLES, width: '48px', minWidth: '48px' },
    },
    {
      label: 'Download',
      variant: 'outlined' as const,
      onClick: () => console.log('Download'),
      sx: { ...BUTTON_STYLES, width: '96px', minWidth: '96px' },
    },
  ];

  return (
    <div className='w-full'>
      {!isKeyContactAvailable && (
        <Box className='flex items-center gap-1.5 h-8 border-b border-[#FFC77B] bg-[#FEF8F0] text-[13px] text-[#2D3E4F] p-2 border-box'>
          <Box>
            <img src={detailsKeyContactErrorIcon} alt='key-contact' />
          </Box>
          <Box>
            <span className='font-bold mr-1'>Contact Details </span> -{' '}
            <span className='ml-1 font-medium'>
              {' '}
              {`Not added for ${accountDetails?.accountById?.account_name}`}
            </span>
          </Box>
        </Box>
      )}
      <Box className='p-2'>
        <OverviewTimelineTab
          tabValue={tabValue}
          handleTabChange={handleTabChange}
          menuActivity={menuActivity}
        />
        <Box className='flex items-center justify-between gap-4 h-[35px] px-2 border border-[#CBD6E2] rounded-[2px]'>
          <Box className='flex items-center gap-2'>
            <Box>
              <img src={realatedListDetailsIcon} alt='details' />
            </Box>
            <Box className='text-[13px] text-[#2D3E4F] font-semibold'>
              Details
            </Box>
          </Box>
          <Box className='flex items-center gap-2'>
            {headerButtons?.map((button, index) => (
              <TextButton
                key={`header-button-${index}`}
                label={button.label}
                // variant={button.variant}
                onClick={button.onClick}
                aria-label={button.label}
                sx={button.sx}
                disabled={button.disabled}
              />
            ))}
          </Box>
        </Box>
        <Box className='border-t-0 border border-[#CBD6E2]'>
          <DetailsInfo
            detailsInfo={accountDetails}
            isDetailsLoading={isLoading}
            detailsError={isError}
          />
        </Box>
      </Box>
    </div>
  );
};

export default Details;
