import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ManageUserIcon } from '../../../assets/icons';
import ActionsDropdown from '../../../components/actions-dropdown/actions-dropdown';
import TextButton from '../../../components/button/text-button';
import { useManageUserDetail } from '../../service/manage-user-detail/manage-user-detail-service';
import { BUTTON_STYLES, HEADER_STYLES } from './styles';
import { ADMIN_CREATE_USER } from '../../../routes';
import { UserDetailComponent } from '../../../components';
import { Skeleton } from '@mui/material';

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
  const userDetails = useManageUserDetail(userId as string);
  const navigate = useNavigate();
  const userDetail = userDetails.data?.data?.users;

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

  if (!userId) {
    return <div>No user ID provided</div>;
  }

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
            <div className='font-semibold text-xl'>
              {userDetails.isLoading ? (
                <Skeleton variant='rounded' width={200} />
              ) : (
                userDetail?.full_name
              )}
            </div>
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
        <UserDetailComponent
          data={userDetail}
          loading={userDetails.isLoading}
        />
      </div>
    </div>
  );
};
