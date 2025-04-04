/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  accountHomeIcon,
  accountSettingsIcon,
  actionIcon,
  downloadIcon,
  filterIcon,
  refreshIcon,
} from '../../../assets';
import ActionsDropdown from '../../../components/actions-dropdown/actions-dropdown';
import TextButton from '../../../components/button/text-button';
import { ACCOUNT_CREATE } from '../../../routes';
import AccountTable from './table/account-table';
import FilterComponent from './filter-component/filter-component';

const BUTTON_STYLES = {
  height: '35px',
  color: '#F15A29',
};

export const Accounts: React.FC = () => {
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>();

  const menuItems = [
    {
      label: 'Manage user',
      onClick: () => console.log('manage user clicked'),
    },
    {
      label: 'Export',
      onClick: () => console.log('Export clicked'),
    },
  ];

  const navigate = useNavigate();

  const handleCreateAcount = () => {
    navigate(ACCOUNT_CREATE);
  };
  return (
    <>
      <div className='flex w-full h-[15%] border-b-2 border-gray-300 p-4'>
        <div className='flex justify-between w-full'>
          <div className='flex'>
            <div className='flex items-center justify-center'>
              <img
                src={accountHomeIcon}
                alt='menu-icon'
                className='h-10 w-10 bg-[#d16dd3] p-2.5 rounded'
              />
              <div className='flex flex-col mx-2'>
                <div className='font-semibold text-[20px]'>All Accounts</div>
                <div className='font-medium text-[#7D98B6] text-[11px]'>
                  Total Records found - 5
                </div>
              </div>
              <div className='border border-gray-300 p-2'>
                <img src={filterIcon} alt='menu-icon' className='h-[15px]' />
              </div>
            </div>
          </div>
          <div className='flex gap-2 justify-center items-center'>
            <ActionsDropdown actions={menuItems} />
            <TextButton
              label='Create Account'
              onClick={handleCreateAcount}
              sx={{
                ...BUTTON_STYLES,
                backgroundColor: '#F15A29',
                color: '#fff',
              }}
            />
            <div className='flex'>
              <div className='flex border border-gray-300 p-2 h-[35px] justify-center items-center'>
                <img src={refreshIcon} alt='menu-icon' className='h-[15px]' />
              </div>
              <div className='flex border border-gray-300 p-2 h-[35px] justify-center items-center'>
                <img src={downloadIcon} alt='menu-icon' className='h-[18px]' />
              </div>
            </div>
            <div className='flex border border-gray-300 p-2 h-[35px] justify-center items-center bg-[#EAF0F6]'>
              <img src={actionIcon} alt='menu-icon' className='h-[13px]' />
            </div>
            <div className='flex border border-gray-300 p-2 h-[35px] justify-center items-center bg-[#EAF0F6]'>
              <img
                src={accountSettingsIcon}
                alt='menu-icon'
                className='h-[13px]'
              />
            </div>
          </div>
        </div>
      </div>
      <div className='flex'>
        <div className='flex w-[20%] h-full border-r-2 border-gray-300 min-h-[calc(100vh-144px)]'>
          <FilterComponent setAppliedFilters={setAppliedFilters} />
        </div>

        <div className='flex flex-col w-[80%] p-10 border-l-2 border-gray-300 -ml-[2px]'>
          <div className='font-medium mb-6'>All Accounts - 10 items</div>
          <AccountTable appliedFilters={appliedFilters} />
        </div>
      </div>
    </>
  );
};
