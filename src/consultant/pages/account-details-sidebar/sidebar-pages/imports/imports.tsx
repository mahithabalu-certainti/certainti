import { useState } from "react";
import ActionImportDropdown from "./importdropdown";
import Overview from "./overview";
import Timeline from "./TimeLine";
interface ImportProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accountDetails?: Record<string,any>;
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
  const menuAccounts = [
    {
      label: 'Recently Added',
      onClick: () => console.log('manage user clicked'),
    },
    {
      label: 'Ascending',
      onClick: () => console.log('Export clicked'),
    },
    {
      label: 'Descending',
      onClick: () => console.log('Export clicked'),
    },
    {
      label: 'Popularity',
      onClick: () => console.log('Export clicked'),
    },
  ];

  return (
    <div className='p-1 w-full'>
      <div className='w-full h-12  flex justify-between items-center'>
        <div className='bg-white border border-[#CBD6E27D] p-1 flex gap-2'>
          <button
            className={`flex items-center justify-center text-[#2D3E4F] text-[14px] rounded w-[120px] h-[28px] border whitespace-nowrap ${
              isActive === 'overView'
                ? 'border-[#0BBFB7]'
                : 'border-transparent hover:text-[#0BBFB7]'
            }`}
            onClick={() => setIsActive('overView')}
          >
            Overview
          </button>
          <button
            className={`flex items-center justify-center text-[#2D3E4F] text-[14px] rounded w-[120px] h-[28px] border whitespace-nowrap ${
              isActive === 'TimeLine'
                ? 'border-[#0BBFB7]'
                : 'border-transparent hover:text-[#0BBFB7]'
            }`}
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
          />
          {isActive === 'overView' && (
            <ActionImportDropdown
              actions={menuAccounts}
              label='Sort By: Accounts'
              split='true'
            />
          )}
        </div>
      </div>
      <div className='mt-4'>
        {isActive === 'overView' && (
          <Overview
            accountNo={accountDetails?.data?.accountById.r_number}
            accountId={accountDetails?.data?.accountDetails?.account_rid}
          />
        )}
        {isActive === 'TimeLine' && <Timeline />}
      </div>
    </div>
  );
};

export default Import;
