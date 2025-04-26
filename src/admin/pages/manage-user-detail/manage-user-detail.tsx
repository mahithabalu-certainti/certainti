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

  const userActionButtons: { label: string; width: string }[] = [
    { label: 'Suspend User', width: '119px' },
    { label: 'Reinstate User', width: '120px' },
    { label: 'Reset Password', width: '132px' },
    { label: 'Edit', width: '57px' },
    { label: 'Delete', width: '73px' },
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
      case 'Edit':
        console.log('Edit clicked');
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
      <div className='w-full min-h-[75px] h-[75px] px-4 flex items-center justify-between border border-[#CBD6E2] rounded-[4px]'>
        <div className='flex items-center gap-2'>
          <img src={ManageUserIcon} alt='manage user' className='w-8 h-8 rounded' />
          <div className='flex flex-col mb-1'>
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
              backgroundColor: '#F16137',
              color: '#fff',
              borderRadius: '2px',
              fontSize: '13px',
              fontWeight: 400,
            }}
            onClick={() => navigate(ADMIN_CREATE_USER)}
          />

          <TextButton
            label='Back'
            variant='outlined'
            color='inherit'
            onClick={goBack}
            sx={{ width: '45px',minWidth:'45px', fontWeight:400,fontSize: '12px' }}
          />
        </div>
      </div>
      {/* User Details section  */}
      <div className='flex flex-col border border-[#CBD6E2] rounded-[4px]'>
        <div className='flex justify-between items-center border-b border-[#CBD6E2] p-2'>
          <div>
          <div className='text-[11px] text-[#7D98B6]'>User</div>
          <div className='font-semibold text-[16px] text-[#2D3E4F] leading-5 tracking-normal'>
              {userDetails.isLoading ? (
                <Skeleton variant='rounded' width={200} />
              ) : (
                userDetail?.full_name
              )}
            </div>
          </div>
          <div className='flex gap-2 m-2'>
          {userActionButtons.map((button) => (
              <TextButton
              key={button.label}
              label={button.label}              
                variant='outlined'
                onClick={() => handleAction(button.label)}
                sx={{
                  ...BUTTON_STYLES,
                  borderRadius: '2px',
                  fontSize: '13px',
                  fontWeight: 400,
                  padding: '4px',
                  width: button.width,
                }}
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
