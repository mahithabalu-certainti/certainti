/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ManageUserIcon } from '../../../../assets/icons';
import { Filter } from '../../../../components';
import ActionsDropdown from '../../../../components/actions-dropdown/actions-dropdown';
import TextButton from '../../../../components/button/text-button';
import { ADMIN_CREATE_USER } from '../../../../routes';
import { UserTable } from '../table/user-table';
import { userFilterfields } from './helpers';

const BUTTON_STYLES = {
  height: '35px',
  color: '#F15A29',
};

const HEADER_STYLES = {
  adminPermission: 'font-medium text-[#7D98B6] text-[11px]',
  manageUser: 'font-semibold text-[20px] text-[#2D3E4F]',
};

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

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const userActionButtons = [
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

  return (
    <div className='flex flex-col h-[calc(100vh-64px)] overflow-y-auto w-full p-4 gap-3'>
      {/* Header Section */}
      <div className='flex h-[12%] w-full p-4 items-center justify-between border border-[#EAF0F5] rounded'>
        <div className='flex items-center gap-2'>
          <img
            src={ManageUserIcon}
            alt='manage user'
            className='h-10 w-10 rounded'
          />
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
            {userActionButtons.map((label) => (
              <TextButton
                key={label}
                label={label}
                variant='outlined'
                onClick={() => handleAction(label)}
                sx={{
                  ...BUTTON_STYLES,
                  borderRadius: '2px',
                  fontSize: '13px',
                  fontWeight: 400,
                }}
              />
            ))}
          </div>
        </div>
        <div className='flex flex-row w-full'>
          <div className='flex w-[20%]'>
            <Filter
              setAppliedFilters={setAppliedFilters}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterFields={userFilterfields}
            />
          </div>
          <div className='flex w-[80%]'>
            <UserTable
              appliedFilters={appliedFilters}
              searchTerm={searchTerm}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserList;
