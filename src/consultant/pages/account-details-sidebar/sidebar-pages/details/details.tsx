import React from 'react';
import { Box } from '@mui/material';
import {
  AccountsIcon,
  DetailsKeyContactErrorIcon,
} from '../../../../../assets';
import TextButton from '../../../../../components/button/text-button';
import DetailsInfo from './details-info';
import { accountDetailsProps } from '../../../account-details/utils';
import { ACCOUNT } from '../../../../../routes';
import { useNavigate } from 'react-router-dom';
import { AllPermissions, OverviewTabs } from '../../../../../common-service';
import DetailsSectionSkeleton from '../../../../../components/skeleton-component/detailsskeleton';
import { ActivityDropdownItem, ColorCode } from '../../../../types';
import { SectionTabPanel } from '../../../../../components';

const BUTTON_STYLES = {
  height: '26px !important',
  fontSize: '13px',
  fontWeight: 400,
};

const detailsTabs: OverviewTabs[] = [
  {
    id: AllPermissions.ACCOUNTS_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  // {
  //   id: AllMenus.ACCOUNTS_TIMELINE,
  //   name: 'Timeline',
  //   hide: false,
  //   disable: true,
  // },
];

interface DetailsProps {
  activityMenuItems: ActivityDropdownItem[];
  accountDetails?: accountDetailsProps;
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
  activityMenuItems,
}) => {
  const navigate = useNavigate();

  const isKeyContactAvailable =
    accountDetails?.accountDetails?.keyContacts &&
    accountDetails.accountDetails.keyContacts.length > 0;

  const handleEdit = () => {
    const accountId = accountDetails?.accountById?.rid || '';
    navigate(ACCOUNT + '/edit/' + accountId);
  };

  const headerButtons = [
    {
      label: 'Edit',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleEdit,
      sx: { ...BUTTON_STYLES, width: '48px', minWidth: '48px' },
      hide: !isAccountEditEnable,
    },
  ];

  return (
    <div
      className='w-full'
      style={{ maxHeight: 'calc(100vh - 225px)', overflow: 'auto' }}
    >
      {!isKeyContactAvailable && !isLoading && (
        <Box className='flex items-center gap-1.5 h-8 border-b border-[#FFC77B] bg-[#FEF8F0] text-[13px] text-[#2D3E4F] px-3 py-2 border-box'>
          <Box>
            <DetailsKeyContactErrorIcon alt='key-contact' />
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
        <SectionTabPanel
          tabs={detailsTabs}
          filterVisibility={false}
          showFilter={false}
          contextKey='account-details'
          setCurrentPage={() => {}}
          appliedFilters={{}}
          setAppliedFilters={() => {}}
          handleFilter={() => {}}
          sortFilterCount={0}
          setSortFilterCount={() => {}}
          showAddActivity={true}
          activityMenuItems={activityMenuItems}
        />
        <div className='flex flex-col gap-0 border border-[#CBD6E2] rounded-[2px]'>
          <Box className='flex items-center justify-between gap-4 h-[38px] py-1 px-2'>
            <Box className='flex items-center gap-2'>
              <div
                className={`w-[24px] h-[24px] flex items-center justify-center rounded-2xl bg-[${ColorCode.accountBgColor}]`}
              >
                <AccountsIcon
                  alt='details'
                  className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
                />
              </div>
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
                    // loading={button.loading}
                    aria-label={button.label}
                    sx={button.sx}
                    disabled={button.disabled}
                  />
                );
              })}
            </Box>
          </Box>
          <Box>
            {isLoading ? (
              <DetailsSectionSkeleton />
            ) : (
              <DetailsInfo
                detailsInfo={accountDetails}
                isDetailsLoading={isLoading}
                detailsError={isError}
                isKeyContactAvailable={isKeyContactAvailable}
              />
            )}
          </Box>
        </div>
      </Box>
    </div>
  );
};

export default Details;
