import { useState } from 'react';
import ActionImportDropdown from './importdropdown';
import Overview from './overview';
import Timeline from './TimeLine';
interface ImportProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accountDetails?: Record<string, any>;
  activeKey?: string;
}

const Import: React.FC<ImportProps> = ({ accountDetails }) => {
  const [isActive, setIsActive] = useState('overView');
  const menuYear = [
    {
      label: '2024',
      onClick: () => console.log('manage user clicked'),
    },
    {
      label: '2023',
      onClick: () => console.log('Export clicked'),
    },
    {
      label: '2023',
      onClick: () => console.log('Export clicked'),
    },
    {
      label: '2022',
      onClick: () => console.log('Export clicked'),
    },
    {
      label: '2021',
      onClick: () => console.log('Export clicked'),
    },
  ];
  const menuActivity = [
    {
      label: 'Create Task',
      onClick: () => console.log('manage user clicked'),
    },
    {
      label: 'Draft Email',
      onClick: () => console.log('Export clicked'),
    },
    {
      label: 'Schedule Meeting',
      onClick: () => console.log('Export clicked'),
    },
    {
      label: 'Log a call',
      onClick: () => console.log('Export clicked'),
    },
  ];

  return (
    <div className='w-full py-1.5 pl-2 pr-4'>
      <div className='flex items-center justify-between w-full h-12'>
        <div className='bg-white border border-[#CBD6E27D] p-1 flex gap-2'>
          <button
            className={`flex items-center cursor-pointer font-medium justify-center text-[#2D3E4F] text-[14px] rounded w-[120px] h-[28px] border whitespace-nowrap ${
              isActive === 'overView'
                ? 'border-[#0BBFB7] bg-[#0BBFB70D]'
                : 'border-transparent hover:text-[#0BBFB7]'
            }`}
            onClick={() => setIsActive('overView')}
          >
            Overview
          </button>
          <button
            className={`flex items-center cursor-pointer font-medium justify-center text-[#2D3E4F] text-[14px] rounded w-[120px] h-[28px] border whitespace-nowrap ${
              isActive === 'TimeLine'
                ? 'border-[#0BBFB7] bg-[#0BBFB70D] '
                : 'border-transparent hover:text-[#0BBFB7]'
            } disabled:hover:text-[#2D3E4F] disabled:opacity-50`}
            disabled
            onClick={() => setIsActive('TimeLine')}
          >
            Timeline
          </button>
        </div>
        <div className='flex gap-2'>
          {isActive === 'TimeLine' && (
            <ActionImportDropdown
              variant={'outlined'}
              actions={menuYear}
              label='Fy-2024'
            />
          )}

          <ActionImportDropdown
            variant={'filled'}
            actions={menuActivity}
            label='Add Activity'
            sx={{ display: 'none' }}
          />
          {/* {isActive === 'overView' && (
            <ActionImportDropdown
              actions={menuAccounts}
              label='Sort By: Accounts'
              split='true'
            />
          )} */}
        </div>
      </div>
      <div className='mt-1'>
        {isActive === 'overView' && (
          <Overview
            accountNo={accountDetails?.data?.accountById.r_number}
            accountId={accountDetails?.data?.accountDetails?.account_rid}
            accountInActive={
              accountDetails?.data?.accountById?.status?.status_name?.toLowerCase() !==
              'active'
            }
          />
        )}
        {isActive === 'TimeLine' && <Timeline />}
      </div>
    </div>
  );
};

export default Import;
