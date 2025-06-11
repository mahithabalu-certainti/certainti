import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import OverviewTimelineTab from '../../components/overview-tab/overview-timeline-tab';
import {
  detailsKeyContactErrorIcon,
  realatedListDetailsIcon,
} from '../../../../../assets';
import TextButton from '../../../../../components/button/text-button';
import DetailsInfo from './details-info';
import { accountDetailsProps } from '../../../account-details/utils';
import { ACCOUNT } from '../../../../../routes';
import { useNavigate } from 'react-router-dom';
import { AllPermissions } from '../../../../../common-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
// import { checkPermission } from '../../../../../common-utils';

const BUTTON_STYLES = {
  height: '26px !important',
  fontSize: '13px',
  fontWeight: 400,
};

export interface DetailsTabs {
  id: AllPermissions;
  name: string;
  hide: boolean;
}

const detailsTabs: DetailsTabs[] = [
  {
    id: AllPermissions.ACCOUNT_DETAILS_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  {
    id: AllPermissions.ACCOUNT_DETAILS_TIMELINE,
    name: 'Timeline',
    hide: false,
  },
];

// interface ErrorProps {
//   message?: string;
// }
interface DetailsProps {
  accountDetails?: accountDetailsProps; // need to change once api info is availableRecord<string, any>
  isLoading?: boolean;
  isError?: boolean; // ErrorProps | null | undefined;
  isAccountEditEnable?: boolean;
  isAccountDetailsDownloadEnable?: boolean;
}

const Details: React.FC<DetailsProps> = ({
  accountDetails,
  isLoading,
  isError,
  isAccountEditEnable,
}) => {
  const [detailsTab, setDetailsTab] = useState(detailsTabs);
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState('');

  const { permission } = useSelector((state: RootState) => state?.permission);
  // Functionality will be implemented later
  // const isAccountDetailActivityEnable = checkPermission(
  //   permission,
  //   AllPermissions.ACCOUNT_DETAILS_ADD_ACTIVITY
  // );

  const isAccountDetailActivityEnable = false;

  const isOverViewEnable = !detailsTab[0].hide;

  useEffect(() => {
    const isHide = (tab: DetailsTabs) => {
      return (
        !permission?.find((item) => item.name === tab.id)?.is_enabled || false
      );
    };
    // updated sub tabs(Overview, Timeline)
    setDetailsTab(
      detailsTabs.map((tab) => ({
        ...tab,
        hide: isHide(tab),
      }))
    );
  }, [permission]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };
  const isKeyContactAvailable =
    accountDetails?.accountDetails?.keyContacts &&
    accountDetails.accountDetails.keyContacts.length > 0;

  const handleEdit = () => {
    const accountId = accountDetails?.accountById?.rid || '';
    navigate(ACCOUNT + '/edit/' + accountId);
  };

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
      onClick: handleEdit,
      sx: { ...BUTTON_STYLES, width: '48px', minWidth: '48px' },
      hide: !isAccountEditEnable,
    },
  ];

  return (
    <div className='w-full'>
      {!isKeyContactAvailable && (
        <Box className='flex items-center gap-1.5 h-8 border-b border-[#FFC77B] bg-[#FEF8F0] text-[13px] text-[#2D3E4F] px-3 py-2 border-box'>
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
      <Box className='pr-4 pl-2 py-2'>
        <OverviewTimelineTab
          tabValue={tabValue}
          handleTabChange={handleTabChange}
          menuActivity={menuActivity}
          detailsTab={detailsTab}
          isAccountDetailActivityEnable={isAccountDetailActivityEnable}
        />
        {isOverViewEnable && (
          <div className='flex flex-col gap-0 border border-[#CBD6E2] rounded-[2px]'>
            <Box className='flex items-center justify-between gap-4 h-[38px] py-1 px-2'>
              <Box className='flex items-center gap-2'>
                <Box>
                  <img
                    src={realatedListDetailsIcon}
                    alt='details'
                    className='w-6 h-6'
                  />
                </Box>
                <Box className='text-[13px] text-[#2D3E4F] font-semibold'>
                  Details
                </Box>
              </Box>
              <Box className='flex items-center gap-2'>
                {headerButtons?.map((button, index) => {
                  if (button.hide) return null;
                  return (
                    <TextButton
                      key={`header-button-${index}`}
                      label={button.label}
                      // variant={button.variant}
                      onClick={button.onClick}
                      aria-label={button.label}
                      sx={button.sx}
                      disabled={button.disabled}
                    />
                  );
                })}
              </Box>
            </Box>
            <Box>
              <DetailsInfo
                detailsInfo={accountDetails}
                isDetailsLoading={isLoading}
                detailsError={isError}
                isKeyContactAvailable={isKeyContactAvailable}
              />
            </Box>
          </div>
        )}
      </Box>
    </div>
  );
};

export default Details;
