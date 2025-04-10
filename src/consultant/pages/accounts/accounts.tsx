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
import FilterComponent from './filter-component/filter-component';
import AccountTable from './table/account-table';

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
    <div className='flex flex-col w-full h-full'>
      <div className='flex justify-between w-full h-[15%] border-b-2 border-[#CBD6E2] p-4'>
        <div className='flex'>
          <div className='flex items-center justify-center'>
            <img
              src={accountHomeIcon}
              alt='menu-icon'
              className='h-10 w-10 bg-[#d16dd3] p-2.5 rounded'
            />
            <div className='flex flex-col mx-2'>
              <div className='font-semibold text-[20px] text-[#2D3E4F]'>
                All Accounts
              </div>
              <div className='font-medium text-[#7D98B6] text-[11px]'>
                Total Records found -{' '}
                <span className='font-semibold text-[#2D3E4F]'>5</span>
              </div>
            </div>
            <div className='flex items-center justify-center border border-[#EAF0F5] mt-0.5 ml-2 rounded-xs w-9 h-9'>
              <img src={filterIcon} alt='menu-icon' className='h-[13px]' />
            </div>
          </div>
        </div>
        <div className='flex gap-3 justify-center items-center'>
          <ActionsDropdown actions={menuItems} />
          <TextButton
            label='Create Account'
            onClick={handleCreateAcount}
            sx={{
              ...BUTTON_STYLES,
              backgroundColor: '#F16137',
              color: '#fff',
              borderRadius: '2px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
          <div className='flex items-center justify-center border border-[#EAF0F5] w-20 h-[35px]'>
            <div className='flex items-center justify-center w-1/2'>
              <img src={refreshIcon} alt='refresh-icon' className='h-[17px]' />
            </div>
            <div className='border-l border-[#EAF0F5] h-full'></div>
            <div className='flex items-center justify-center w-1/2'>
              <img
                src={downloadIcon}
                alt='download-icon'
                className='h-[19px]'
              />
            </div>
          </div>
          <div className='flex border border-[#EAF0F5] w-9 h-[35px] justify-center items-center bg-[#EAF0F6]'>
            <img src={actionIcon} alt='menu-icon' className='h-[16px]' />
          </div>
          <div className='flex border border-[#EAF0F5] w-9 h-[35px] justify-center items-center bg-[#EAF0F6]'>
            <img
              src={accountSettingsIcon}
              alt='menu-icon'
              className='h-[18px]'
            />
          </div>
        </div>
      </div>
      <div className='flex flex-1'>
        <div className='flex w-[20%] h-full border-r-2 border-gray-300 min-h-[calc(100vh-144px)]'>
          <FilterComponent setAppliedFilters={setAppliedFilters} />
        </div>

        <div className='flex flex-col w-[80%] p-5 border-l-2 border-gray-300 -ml-[2px]'>
          <div className='font-semibold text-[16px] leading-5 text-[#2D3E4F] mb-6'>
            All Accounts
            {/* <span className='font-normal'>• 10 items</span> */}
          </div>
          <AccountTable appliedFilters={appliedFilters} />
        </div>
      </div>
    </div>
  );
};
