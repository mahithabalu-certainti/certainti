import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ManageUserIcon, RealatedListDetailsIcon } from '../../../assets/icons';
import ActionsDropdown from '../../../components/actions-dropdown/actions-dropdown';
import TextButton from '../../../components/button/text-button';
import { useManageUserDetail } from '../../service/manage-user-detail/manage-user-detail-service';
import { BUTTON_STYLES, HEADER_STYLES } from './styles';
import { ADMIN_CREATE_USER, ADMIN_MANAGE_USER } from '../../../routes';
import { UserDetailComponent } from '../../../components';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { checkPermission } from '../../../common-utils';
import { AllModules, AllPermissions } from '../../../common-service';
import { AccessRestricted } from '../../../components/account-restricted';

export const ManageUserDetails: React.FC = () => {
  // Get userId from URL params
  const location = useLocation();
  const userId = location.state?.user.id;
  // Use the query hook to fetch user details
  const userDetails = useManageUserDetail(userId as string);
  const navigate = useNavigate();
  const userDetail = userDetails.data?.data?.users;
  const userFullName =
    `${userDetail?.first_name || ''} ${userDetail?.last_name || ''}`.trim();

  // Permission Mangement
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const userIsEnable = checkPermission(modules, AllModules.USER_MANAGEMENT);
  const isUserViewEnable = checkPermission(
    permission,
    AllPermissions.USER_VIEW
  );
  const isUserCreateEnable = checkPermission(
    permission,
    AllPermissions.USER_CREATE
  );
  const isUserDeleteEnable = checkPermission(
    permission,
    AllPermissions.USER_DELETE
  );
  const isUserSuspendEnable = checkPermission(
    permission,
    AllPermissions.USER_SUSPEND
  );
  const isUserViewPermissionEnable = checkPermission(
    permission,
    AllPermissions.USER_VIEW_PERMISSION
  );
  const isUserResetPasswordEnable = checkPermission(
    permission,
    AllPermissions.USER_RESET_PASSWORD
  );
  const isUserAssignPermissionEnable = checkPermission(
    permission,
    AllPermissions.USER_ASSIGN_PERMISSION
  );

  const MENU_ITEMS = [
    {
      label: 'Assign Permission to User',
      onClick: () =>
        navigate(ADMIN_MANAGE_USER + '/extended-permission/' + userDetail?.rid),
      hide: !isUserAssignPermissionEnable,
    },
    {
      label: 'View Permissions',
      onClick: () => console.log('View Permissions clicked'),
      hide: !isUserViewPermissionEnable,
    },
  ];

  const userActionButtons = [
    { label: 'Suspend User', width: '104px', hide: !isUserSuspendEnable },
    { label: 'Reinstate User', width: '116px', hide: false },
    {
      label: 'Reset Password',
      width: '118px',
      hide: !isUserResetPasswordEnable,
    },
    { label: 'Delete', width: '58px', hide: !isUserDeleteEnable },
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

  if (!userIsEnable || !isUserViewEnable) return <AccessRestricted />;

  return (
    <div className='flex flex-col h-[calc(100vh-64px)] w-full overflow-y-auto p-4 gap-3'>
      <div className='w-full h-[55px] min-h-[50px] px-4 flex items-center justify-between border border-[#CBD6E2] rounded-[4px]'>
        <div className='flex items-center justify-center'>
          <ManageUserIcon alt='manage user' className='h-7 w-7 rounded' />
          <div className='flex flex-col mx-2.5 pb-1'>
            <div className={HEADER_STYLES.adminPermission}>
              {`Admin Permission > Manage User${(userDetail?.full_name ?? userFullName) ? ` > ${userDetail?.full_name ?? userFullName}` : ''}`}
            </div>
            <div className={HEADER_STYLES.manageUser}>View User</div>
          </div>
        </div>
        <div className='flex gap-2 items-center'>
          <ActionsDropdown actions={MENU_ITEMS} />
          {isUserCreateEnable && (
            <TextButton
              label='Create User'
              sx={{
                ...BUTTON_STYLES,
                fontSize: '13px',
                fontWeight: 400,
                width: '91px',
                minWidth: '91px',
              }}
              onClick={() => navigate(ADMIN_CREATE_USER)}
            />
          )}

          <TextButton
            label='Back'
            onClick={goBack}
            sx={{
              width: '49px',
              minWidth: '49px',
              fontWeight: 400,
              fontSize: '13px',
            }}
          />
        </div>
      </div>
      {/* User Details section  */}
      <div className='flex flex-col gap-0 border border-[#CBD6E2] rounded-[2px]'>
        <Box className='flex items-center justify-between gap-4 h-[38px] py-1 px-2'>
          <Box className='flex items-center gap-2'>
            <Box>
              <RealatedListDetailsIcon alt='details' className='w-6 h-6' />
            </Box>
            <Box className='text-[13px] text-[#2D3E4F] font-semibold'>
              Details
            </Box>
          </Box>
          <Box className='hidden items-center gap-2'>
            {userActionButtons?.map((button, index) => {
              if (button.hide) return null;
              return (
                <TextButton
                  key={`header-button-${index}`}
                  label={button.label}
                  // variant={button.variant}
                  onClick={() => handleAction(button.label)}
                  aria-label={button.label}
                  sx={{
                    ...BUTTON_STYLES,
                    fontSize: '13px',
                    fontWeight: 600,
                    width: button.width,
                    minWidth: button.width,
                    maxWidth: button.width,
                  }}
                />
              );
            })}
          </Box>
        </Box>
        <Box>
          <UserDetailComponent
            data={userDetail}
            loading={userDetails.isLoading}
          />
        </Box>
      </div>
    </div>
  );
};

export default ManageUserDetails;
