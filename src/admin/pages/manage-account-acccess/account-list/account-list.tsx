import { useState } from 'react';
import { UserIcon } from '../../../../assets';
import TextButton from '../../../../components/button/text-button';
import { BUTTON_STYLES } from '../../manage-user-detail/styles';
import { ManageAccountTable } from './table';
import { ProjectListParams } from '../../../../consultant/types/project';
import { useSearchParams } from 'react-router-dom';
import { UserList } from '../../manage-user';
import UserTab from './tab';

const AccountList = () => {
  const [tableParams, setTableParams] = useState<ProjectListParams>({
    page: 1,
    limit: 100,
    sortBy: 'account_name',
    sortOrder: 'ASC',
    fiscalYear: 0,
  });
  const [searchParams] = useSearchParams();
  const userList = searchParams.get('userid');
  return (
    <div>
      <div className='flex items-center justify-between w-full h-[55px] min-h-[50px] border-b border-[#CBD6E2] px-4'>
        <div className='flex h-[33px]'>
          <div className='flex items-center justify-center'>
            <UserIcon
              alt='manage user'
              className='h-7 w-7 rounded bg-[#BE3EB5] p-[7px]'
            />
            <div className='flex flex-col mx-2.5 pb-1'>
              <div className='font-semibold text-[#7D98B6] text-[12px] pt-1'>
                Admin Permission
              </div>
              <div className='font-bold text-[16px] text-[#2D3E4F] -mt-1'>
                Manage Account Access
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'></div>
      </div>
      {!UserList && (
        <div className='flex items-center justify-between h-[42px] min-h-[42px] max-h-[42px] px-4'>
          <div className='font-bold text-[14px] leading-[32px] text-[#2D3E4F]'>
            All Accounts
          </div>
          <div className='flex items-center gap-3'>
            <div className='relative h-[32px]'></div>
            {/* {isProfileExportEnable && ( */}
            <TextButton
              label='Export'
              sx={{
                ...BUTTON_STYLES,
                width: '74px',
                minWidth: '74px',
                maxWidth: '74px',
              }}
            />
          </div>
        </div>
      )}
      {!userList && (
        <div className='border border-[#CBD6E2]'>
          <ManageAccountTable
            tableParams={tableParams}
            setTableParams={setTableParams}
          />
        </div>
      )}
      {userList && (
        <div>
          <UserTab />
        </div>
      )}
    </div>
  );
};

export default AccountList;
