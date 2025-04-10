import React from 'react';
import { useLocation } from 'react-router-dom';
import { ManageUserIcon } from '../../../assets/icons';
import ActionsDropdown from '../../../components/actions-dropdown/actions-dropdown';
import TextButton from '../../../components/button/text-button';
import { useManageUserDetail } from '../../service/manage-user-detail/manage-user-detail-service';
import { Detail } from '../../types/admin-user-detail';
import { BUTTON_STYLES, HEADER_STYLES } from './styles';

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

  const userDetail = user?.data.users[0];
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

  const renderRow = (value: Detail): JSX.Element => (
    <div className='grid grid-cols-2 gap-1 items-center justify-center border-b border-gray-200 py-2'>
      <div className='font-bold text-center'>{value?.label}</div>
      <div className=''>{value?.value}</div>
    </div>
  );

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

  // Map your API data to the mock data structure
  const mappedUserDetails: Detail[] = [
    { label: 'Full name', value: userDetail?.full_name || 'N/A' },
    { label: 'Email address', value: userDetail?.email || 'N/A' },
    { label: 'Profile', value: userDetail?.profile.profile_name || 'N/A' },
    { label: 'Active', value: userDetail?.status || 'N/A' },
    { label: 'First name', value: userDetail?.first_name || 'N/A' },
    { label: 'Last name', value: userDetail?.last_name || 'N/A' },
    { label: 'Street', value: userDetail?.street || 'N/A' },
    { label: 'City', value: userDetail?.city || 'N/A' },
    // Add other fields as needed
  ];

  const mappedAdditionalDetails: Detail[] = [
    { label: 'State/Province', value: userDetail?.state || 'N/A' },
    { label: 'Zip/Postal Code', value: userDetail?.zip_code || 'N/A' },
    { label: 'Country', value: userDetail?.country || 'N/A' },
    { label: 'Created by', value: userDetail?.created_by || 'N/A' },
    { label: 'Created on', value: userDetail?.createdAt || 'N/A' },
    { label: 'Modified by', value: userDetail?.modified_by || 'N/A' },
    { label: 'Modified on', value: userDetail?.updatedAt },
  ];

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
            label='Create Account'
            sx={{
              ...BUTTON_STYLES,
              backgroundColor: 'secondary.main',
              color: '#fff',
            }}
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
          <div className='grid grid-cols-2'>
            <div className='flex flex-col space-y-4'>
              {mappedUserDetails.map((detail, index) => (
                <React.Fragment key={index}>{renderRow(detail)}</React.Fragment>
              ))}
            </div>
            <div className='flex flex-col space-y-4'>
              {mappedAdditionalDetails.map((detail, index) => (
                <React.Fragment key={index}>{renderRow(detail)}</React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
