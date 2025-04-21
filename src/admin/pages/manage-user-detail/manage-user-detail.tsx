import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ManageUserIcon } from '../../../assets/icons';
import { getDateTimeFormat } from '../../../common-utils';
import ActionsDropdown from '../../../components/actions-dropdown/actions-dropdown';
import TextButton from '../../../components/button/text-button';
import { useManageUserDetail } from '../../service/manage-user-detail/manage-user-detail-service';
import { Detail } from '../../types/admin-user-detail';
import { BUTTON_STYLES, HEADER_STYLES } from './styles';
import { ADMIN_CREATE_USER } from '../../../routes';

const MENU_ITEMS = [
  {
    label: 'Assign Permission to User',
    onClick: () => console.log('user clicked'),
  },
  {
    label: 'View Permissions',
    onClick: () => console.log('View Permissions clicked'),
  },
];

export const ManageUserDetails: React.FC = () => {
  // Get userId from URL params
  const location = useLocation();
  const userId = location.state?.user.id;
  // Use the query hook to fetch user details
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useManageUserDetail(userId || '');
  
  const navigate = useNavigate();
  const userDetail = user?.data.users;
  const userActionButtons: string[] = [
    'Suspend User',
    'Reactive User',
    'Reset Password',
    'Delete',
  ];

  const handleAction = (action: string) => {
    switch (action) {
      case 'Suspend User':
        console.log('Suspend User clicked');
        break;
      case 'Reactive User':
        console.log('Reactive User clicked');
        break;
      case 'Reset Password':
        console.log('Reset Password clicked');
        break;
      case 'Delete':
        console.log('Delete clicked');
        break;
      default:
        break;
    }
  };

  const renderRows = (left: Detail[], right: Detail[]) => {
    const maxLength = Math.max(left.length, right.length);

    return Array.from({ length: maxLength }).map((_, index) => (
      <React.Fragment key={index}>
        <div className='grid grid-cols-2 gap-1 items-center justify-center border-b border-gray-200 py-2'>
          <div className='font-bold text-center'>
            {left[index]?.label ?? ''}
          </div>
          <div className='break-words whitespace-normal max-w-full'>
            {left[index]?.value ?? ''}
          </div>
       </div>
        <div className='grid grid-cols-2 gap-1 items-center justify-center border-b border-gray-200 py-2'>
          <div className='font-bold text-center'>
            {right[index]?.label ?? ''}
          </div>
          <div className='break-words whitespace-normal max-w-full'>
            {right[index]?.value ?? ''}
          </div>
       </div>
      </React.Fragment>
    ));
  };
  if (!userId) {
    return <div>No user ID provided</div>;
  }

  if (isLoading) {
    return <div>Loading user details...</div>;
  }

  if (isError) {
    return <div>Error loading user details: {error?.message}</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  const capitalizeFirstLetter = (str?: string) => {
    if (str) {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    return 'N/A';
  };

  // Map your API data to the mock data structure
  const mappedUserDetails: Detail[] = [
    { label: 'User ID', value: userDetail?.rid || 'N/A' },
    { label: 'Full name', value: userDetail?.full_name || 'N/A' },
    { label: 'Email address', value: userDetail?.email || 'N/A' },
    { label: 'Profile', value: userDetail?.profile.profile_name || 'N/A' },
    {
      label: 'Status',
      value: capitalizeFirstLetter(userDetail?.status),
    },
    { label: 'First name', value: userDetail?.first_name || 'N/A' },
    { label: 'Last name', value: userDetail?.last_name || 'N/A' },
    { label: 'Street', value: userDetail?.street || 'N/A' },
    { label: 'City', value: userDetail?.city_name || 'N/A' },
    // Add other fields as needed
  ];

  const mappedAdditionalDetails: Detail[] = [
    { label: 'User number', value: userDetail?.r_number || 'N/A' },
    { label: 'State/Province', value: userDetail?.state_name || 'N/A' },
    { label: 'Zip/Postal Code', value: userDetail?.zip_code || 'N/A' },
    { label: 'Country', value: userDetail?.country_name || 'N/A' },
    {
      label: 'Created by',
      value: capitalizeFirstLetter(userDetail?.created_by),
    },
    {
      label: 'Created on',
      value: getDateTimeFormat(userDetail?.created_datetime),
    },
    { label: 'Last Updated by', value: userDetail?.modified_by || 'N/A' },
    {
      label: 'Last Updated On',
      value: getDateTimeFormat(userDetail?.modified_datetime),
    },
    {
      label: 'Role',
      value: userDetail?.business_teams?.business_teams,
    },
  ];

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className='flex flex-col h-[calc(100vh-64px)] w-full overflow-y-auto p-4 gap-3'>
      <div className='flex h-[12%] w-full p-4 items-center justify-between border border-gray-300 rounded'>
        <div className='flex items-center gap-2'>
          <img src={ManageUserIcon} alt='manage user' />
          <div className='flex flex-col'>
            <div className={HEADER_STYLES.adminPermission}>
              Admin Permission
            </div>
            <div className={HEADER_STYLES.manageUser}>Manage User</div>
          </div>
        </div>
        <div className='flex gap-2 items-center'>
          <ActionsDropdown actions={MENU_ITEMS} />
          <TextButton
            label='Create User'
            sx={{
              ...BUTTON_STYLES,
              backgroundColor: 'secondary.main',
              color: '#fff',
            }}
            onClick={() => navigate(ADMIN_CREATE_USER)}
          />

          <TextButton
            label='Back'
            variant='outlined'
            color='inherit'
            onClick={goBack}
          />
        </div>
      </div>
      {/* User Details section  */}
      <div className='flex flex-col border border-gray-300'>
        <div className='flex justify-between items-center border-b border-gray-300 p-2'>
          <div>
            <div className='text-small text-[#7D98B6]'>User</div>
            <div className='font-semibold text-xl'>{userDetail?.full_name}</div>
          </div>
          <div className='flex gap-2 m-2'>
            {userActionButtons.map((label) => (
              <TextButton
                key={label}
                label={label}
                sx={BUTTON_STYLES}
                variant='outlined'
                onClick={() => handleAction(label)}
              />
            ))}
          </div>
        </div>
        <div className='w-full'>
          <div className='flex bg-[#CBD6E2] p-2'>
            <div className='mb-3 text-small font-semibold'>User Details</div>
          </div>
          <div className='grid grid-cols-2 divide-y'>
            {renderRows(mappedUserDetails, mappedAdditionalDetails)}
          </div>
        </div>
      </div>
    </div>
  );
};
