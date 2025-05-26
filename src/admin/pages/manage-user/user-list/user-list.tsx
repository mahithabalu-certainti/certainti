/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ManageUserIcon, newFilterIcon } from '../../../../assets/icons';
import { FilterModal } from '../../../../components';
import ActionsDropdown from '../../../../components/actions-dropdown/actions-dropdown';
import TextButton from '../../../../components/button/text-button';
import { ADMIN_CREATE_USER } from '../../../../routes';
import { UserTable } from '../table/user-table';
import { getUserFilterfields } from './helpers';
import { exportUserList, useManageUserProfile } from '../../../service';
import { UserListParams } from '../../../types/manage-user';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { checkPermission } from '../../../../common-utils';
import { AllModules, AllPermissions } from '../../../../common-service';
import { AccessRestricted } from '../../../../components/account-restricted';
import {
  formatFilterForApi,
  getStoredFilters,
} from '../../../../components/filter-component/utils';

const BUTTON_STYLES = {
  height: '32px',
  background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
  border: '1px solid #CBD6E2',
  color: '#425A76',
  borderRadius: '2px',
  fontSize: '13px',
  fontWeight: 700,
  padding: '0px',
  '&:hover': {
    color: '#425A76 !important',
  },
};

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  // const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [tableParams, setTableParams] = useState<UserListParams>({
    page: page,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });

  // Permission Mangement
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const userIsEnable = checkPermission(modules, AllModules.USER_MANAGEMENT);
  const isUserCreateEnable = checkPermission(
    permission,
    AllPermissions.USER_CREATE
  );
  const isUserEditEnable = checkPermission(
    permission,
    AllPermissions.USER_EDIT_UPDATE
  );
  const isUserDeleteEnable = checkPermission(
    permission,
    AllPermissions.USER_DELETE
  );
  const isUserViewEnable = checkPermission(
    permission,
    AllPermissions.USER_VIEW
  );
  const isUserViewAllEnable = checkPermission(
    permission,
    AllPermissions.USER_VIEW_ALL
  );
  const isUserSuspendEnable = checkPermission(
    permission,
    AllPermissions.USER_SUSPEND
  );
  const isUserResetPasswordEnable = checkPermission(
    permission,
    AllPermissions.USER_RESET_PASSWORD
  );
  const isUserExportEnable = checkPermission(
    permission,
    AllPermissions.USER_EXPORT
  );
  const isUserViewPermissionEnable = checkPermission(
    permission,
    AllPermissions.USER_VIEW_PERMISSION
  );
  const isUserAssignPermissionEnable = checkPermission(
    permission,
    AllPermissions.USER_ASSIGN_PERMISSION
  );

  const userActionButtons = [
    {
      label: 'Suspend User',
      width: '119px',
      hide: !isUserSuspendEnable,
    },
    { label: 'Reinstate User', width: '120px', hide: false },
    {
      label: 'Reset Password',
      width: '132px',
      hide: !isUserResetPasswordEnable,
    },
    { label: 'Delete', width: '73px', hide: !isUserDeleteEnable },
  ];
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen ? 'user-filter-popover' : undefined;

  const MENU_ITEMS = [
    {
      label: 'Assign Permission to User',
      onClick: () => console.log('user clicked'),
      hide: !isUserAssignPermissionEnable,
    },
    {
      label: 'View Permissions',
      onClick: () => console.log('View Permissions clicked'),
      hide: !isUserViewPermissionEnable,
    },
    {
      label: 'Export',
      onClick: () => exportUserList(tableParams),
      hide: !isUserExportEnable,
    },
  ];

  const profileList = useManageUserProfile();

  const userProfiles = useMemo(() => {
    return (
      profileList.data?.data.profiles.map((item) => item.profile_name) || []
    );
  }, [profileList]);

  const userFilterfields = getUserFilterfields(userProfiles);

  useEffect(() => {
    const saved = getStoredFilters();
    if (saved) {
      setAppliedFilters(formatFilterForApi(saved as Record<string, any>));
    }
  }, []);

  const handleAction = (action: string) => {
    switch (action) {
      case 'Suspend User':
        console.log('Suspend User clicked');
        break;
      case 'Reinstate User':
        console.log('Reinstate User clicked');
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

  if (!userIsEnable || !isUserViewAllEnable) return <AccessRestricted />;

  return (
    <div className='flex flex-col w-full h-full'>
      {/* Header Section */}
      <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <img
              src={ManageUserIcon}
              alt='manage user'
              className='h-7 w-7 rounded'
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-semibold text-[#7D98B6] text-[12px] pt-1'>
                Admin Permission
              </div>
              <div className='font-bold text-[16px] text-[#2D3E4F] -mt-1'>
                Manage User
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'>
          <ActionsDropdown
            actions={MENU_ITEMS}
            sx={{
              ...BUTTON_STYLES,
              width: '81px',
              minWidth: '81px',
              maxWidth: '81px',
            }}
          />
          {isUserCreateEnable && (
            <TextButton
              label='Create User'
              onClick={() => navigate(ADMIN_CREATE_USER)}
              sx={{
                ...BUTTON_STYLES,
                width: '91px',
                minWidth: '91px',
                maxWidth: '91px',
              }}
            />
          )}
        </div>
      </div>

      <div className='flex items-center justify-between h-[42px] min-h-[42px] max-h-[42px] px-4'>
        <div className='font-bold text-[14px] leading-[32px] text-[#2D3E4F]'>
          All Users
        </div>
        <div className='flex items-center gap-3'>
          <div className='relative h-[32px]'>
            <button
              aria-describedby={filterId}
              className={`w-[64px] h-[26px] text-[13px] mt-[3px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative 
              ${isFilterOpen || (appliedFilters && Object.keys(appliedFilters).length > 0) ? 'bg-[#F3F3F3]' : ''}`}
              onClick={handleFilterModal}
            >
              <img src={newFilterIcon} alt='filter-icon' />
              Filter
              {appliedFilters && Object.keys(appliedFilters).length > 0 && (
                <div className='absolute -top-[5px] -right-2 w-4 h-4 flex items-center justify-center text-xs'>
                  <span className='absolute w-full h-full bg-[#FF6666] rounded-full animate-ping opacity-75 z-0'></span>
                  <span className='w-4 h-4 bg-[#FF6666] text-white rounded-full flex items-center justify-center z-10 font-semibold'>
                    {Object.keys(appliedFilters).length}
                  </span>
                </div>
              )}
            </button>
            <FilterModal
              isOpen={isFilterOpen}
              filterAnchorEl={anchorEl}
              filterId={filterId}
              filterFields={userFilterfields}
              setAppliedFilters={setAppliedFilters}
              setPage={setPage}
              handleCloseFilter={handleCloseFilter}
            />
          </div>
          {userActionButtons.map((button) => {
            if (button.hide) return null;
            return (
              <TextButton
                key={button.label}
                label={button.label}
                variant='outlined'
                onClick={() => handleAction(button.label)}
                sx={{
                  ...BUTTON_STYLES,
                  width: button.width,
                  minWidth: button.width,
                  maxWidth: button.width,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* User Table Section */}
      <div className='border border-[#CBD6E2]'>
        <UserTable
          appliedFilters={appliedFilters}
          tableParams={tableParams}
          setTableParams={setTableParams}
          isUserEditEnable={isUserEditEnable}
          isUserViewEnable={isUserViewEnable}
        />
      </div>
    </div>
  );
};

export default UserList;
