/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components';
import { ACCOUNT_CREATE } from '../../../routes';
import FilterComponent from './filter-component/filter-component';
import AccountTable from './table/account-table';

export const Accounts: React.FC = () => {
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>();
  const navigate = useNavigate();

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

  const handleCreateAccount = () => {
    navigate(ACCOUNT_CREATE);
  };

  const handleFilterClick = () => {
    console.log('Filter clicked');
    // Add filter logic here
  };

  const handleRefreshClick = () => {
    console.log('Refresh clicked');
    // Add refresh logic here
  };

  const handleDownloadClick = () => {
    console.log('Download clicked');
    // Add download logic here
  };

  const handleActionsClick = () => {
    console.log('Actions clicked');
    // Add actions logic here
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
    // Add settings logic here
  };

  return (
    <>
      <PageHeader
        title='All Accounts'
        totalRecords={5}
        actionItems={menuItems}
        primaryButton={{
          label: 'Create Account',
          onClick: handleCreateAccount,
        }}
        variant='main'
        showFilter={true}
        showRefresh={true}
        showDownload={true}
        onFilterClick={handleFilterClick}
        onRefreshClick={handleRefreshClick}
        onDownloadClick={handleDownloadClick}
        onActionsClick={handleActionsClick}
        onSettingsClick={handleSettingsClick}
      />

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
