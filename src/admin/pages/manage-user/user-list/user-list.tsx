/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ManageUserIcon,
  newFilterIcon,
  refreshIcon,
} from '../../../../assets/icons';
import { FilterModal } from '../../../../components';
import ActionsDropdown from '../../../../components/actions-dropdown/actions-dropdown';
import TextButton from '../../../../components/button/text-button';
import { ADMIN_CREATE_USER, ADMIN_MANAGE_USER } from '../../../../routes';
import { UserTable } from '../table/user-table';
import { getUserFilterFields } from './helpers';
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
import { useToast } from '../../../../hooks';

const BUTTON_STYLES = {
  height: '24px',
  fontSize: '13px',
  fontWeight: 600,
};

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState<number>(1);
  const [tableParams, setTableParams] = useState<UserListParams>({
    page: page,
    limit: 100,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  const [refreshUserTrigger, setRefreshUserTrigger] = useState<number>(
    Date.now()
  );
  const onRefreshClick = () => {
    setRefreshUserTrigger(Date.now());
  };
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
    { label: 'Suspend User', width: '104px', hide: !isUserSuspendEnable },
    { label: 'Reinstate User', width: '116px', hide: false },
    {
      label: 'Reset Password',
      width: '118px',
      hide: !isUserResetPasswordEnable,
    },
    { label: 'Delete', width: '58px', hide: !isUserDeleteEnable },
  ];

  const [selectedUserId, setSelectedUserId] = useState<string[]>([]);
  const { errorToast } = useToast();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const handleFilterModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const isFilterOpen = Boolean(anchorEl);
  const filterId = isFilterOpen ? 'user-filter-popover' : undefined;

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedUserId(selectedIds);
  };

  const MENU_ITEMS = [
    {
      label: 'Assign Permissions to User',
      hide: !isUserAssignPermissionEnable,
      onClick: () => {
        if (selectedUserId.length === 1) {
          navigate(
            ADMIN_MANAGE_USER + '/extended-permission/' + selectedUserId[0]
          );
        } else if (selectedUserId.length > 1) {
          errorToast('Please select only one user to assign permissions.');
        } else {
          errorToast('You must select a user to assign permissions.');
        }
      },
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
      profileList.data?.data.profiles.map((item) => ({
        label: item.profile_name,
        value: item.profile_name,
      })) || []
    );
  }, [profileList]);

  const userFilterfields = getUserFilterFields(userProfiles);

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
          <ActionsDropdown actions={MENU_ITEMS} />
          <button
            className='flex border border-[#CBD6E2] w-[24px] h-[24px] bg-[linear-gradient(180deg,_#FFFFFF_0%,_#E4E6E7_100%)] justify-center items-center cursor-pointer'
            onClick={onRefreshClick}
          >
            <img src={refreshIcon} alt='refresh-icon' className='h-4' />
          </button>
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
              className={`w-[64px] h-[24px] text-[13px] mt-[4px] text-[#425A76] cursor-pointer flex items-center justify-center gap-1 font-semibold rounded-[2px] relative 
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
          onSelectionChange={handleSelectionChange}
          refreshUserTrigger={refreshUserTrigger}
        />
      </div>
    </div>
  );
};

export default UserList;
