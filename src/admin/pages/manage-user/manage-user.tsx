import { useNavigate } from 'react-router-dom';
import { ManageUserIcon } from '../../../assets/icons';
import ActionsDropdown from '../../../components/actions-dropdown/actions-dropdown';
import TextButton from '../../../components/button/text-button';
import { ADMIN_CREATE_USER } from '../../../routes';
import { UserTable } from './table/user-table';

const BUTTON_STYLES = {
  height: '35px',
  color: 'secondary.main',
};

const HEADER_STYLES = {
  adminPermission: 'font-semibold text-[#7D98B6] text-xs',
  manageUser: 'font-semibold text-2xl',
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

export const ManageUser: React.FC = () => {
  const navigate = useNavigate();

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
            variant='filled'
            onClick={() => navigate(ADMIN_CREATE_USER)}
          />
        </div>
      </div>

      {/* User Table Section */}
      <div className='border border-gray-300 rounded'>
        <div className='flex justify-between items-center border-b border-gray-300 p-4'>
          <div className='font-semibold text-xl'>All Users</div>
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
        <UserTable />
      </div>
    </div>
  );
};
