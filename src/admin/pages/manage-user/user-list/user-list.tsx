/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { filterIcon, ManageUserIcon } from '../../../../assets/icons';
import { Filter } from '../../../../components';
import ActionsDropdown from '../../../../components/actions-dropdown/actions-dropdown';
import TextButton from '../../../../components/button/text-button';
import { ADMIN_CREATE_USER } from '../../../../routes';
import { UserTable } from '../table/user-table';
import { getUserFilterfields } from './helpers';
import { exportUserList, useManageUserProfile } from '../../../service';
import { CircularProgress } from '@mui/material';
import { UserListParams } from '../../../types/manage-user';

const BUTTON_STYLES = {
  height: '32px',
  color: '#F15A29',
};

const HEADER_STYLES = {
  adminPermission: 'font-medium text-[#7D98B6] text-[11px] leading-5 tracking-normal',
  manageUser: 'font-semibold text-[20px] text-[#2D3E4F] leading-5 tracking-normal',
};

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(true);
  const [tableParams, setTableParams] = useState<UserListParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });

  const userActionButtons = [
    { label: 'Suspend User', width: '119px' },
    { label: 'Reinstate User', width: '120px' },
    { label: 'Reset Password', width: '132px' },
    { label: 'Delete', width: '73px' },
  ];

  const MENU_ITEMS = [
    {
      label: 'Assign Permission to User',
      onClick: () => console.log('user clicked'),
    },
    {
      label: 'View Permissions',
      onClick: () => console.log('View Permissions clicked'),
    },
    {
      label: 'Export',
      onClick: () => exportUserList(tableParams),
    },
  ];

  const profileList = useManageUserProfile();

  const userProfiles = useMemo(() => {
    return profileList.data?.data.profiles.map(item => item.profile_name) || [];
  }, [profileList]);

  const userFilterfields = getUserFilterfields(userProfiles);

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

  return (
    <div className='flex flex-col h-[calc(100vh-64px)] overflow-y-auto w-full p-4 gap-3'>
      {/* Header Section */}
      <div className='flex h-[12%] w-full p-4 items-center justify-between border border-[#EAF0F5] rounded'>
        <div className='flex items-center gap-2'>
          <img
            src={ManageUserIcon}
            alt='manage user'
            className='h-8 w-8 rounded'
          />
          <div className='flex flex-col mb-1'>
            <div className={HEADER_STYLES.adminPermission}>
              Admin Permission
            </div>
            <div className={HEADER_STYLES.manageUser}>Manage User</div>
          </div>
          <div
            className={`flex items-center justify-center border mt-0.5 ml-2 rounded-xs w-8 h-8 cursor-pointer transition-colors duration-300 ${isFilterOpen ? 'bg-[#EAF0F6] border-[#CBD6E2]' : 'border-[#EAF0F5]'}`}
            onClick={() => setIsFilterOpen((prev) => !prev)}
          >
            <img src={filterIcon} alt='menu-icon' className='h-[12px]' />
          </div>
        </div>
        <div className='flex gap-2 items-center'>
          <ActionsDropdown actions={MENU_ITEMS} />
          <TextButton
            label='Create User'
            variant='filled'
            onClick={() => navigate(ADMIN_CREATE_USER)}
            sx={{
              ...BUTTON_STYLES,
              backgroundColor: '#F16137',
              color: '#fff',
              borderRadius: '2px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
        </div>
      </div>

      {/* User Table Section */}
      <div className='border border-[#EAF0F5] rounded'>
        <div className='flex justify-between items-center border-b border-[#EAF0F5] p-4'>
          <div className='font-semibold text-[20px] leading-5 text-[#2D3E4F]'>
            All Users
          </div>
          <div className='flex gap-3'>
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
        <div className='flex flex-1 transition-all duration-300 ease-in-out'>
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden h-full min-h-[calc(100vh-144px)] ${isFilterOpen ? 'w-[20%] opacity-100' : 'w-0 opacity-0'
              }`}
          >
            {profileList.isLoading ?
              <div className='w-full min-h-[calc(100vh-144px)] flex justify-center items-center'>
                <CircularProgress />
              </div>
              :
              <Filter
                setAppliedFilters={setAppliedFilters}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterFields={userFilterfields}
                filterLable="Filter User by"
              />
            }
          </div>

          <div className={`transition-all duration-300 ease-in-out ${isFilterOpen ? 'w-[80%]' : 'w-full'}`}>
            <UserTable
              appliedFilters={appliedFilters}
              tableParams={tableParams}
              setTableParams={setTableParams}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserList;
