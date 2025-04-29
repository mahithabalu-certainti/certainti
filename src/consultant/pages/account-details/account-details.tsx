/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { accountDetailsIcon } from '../../../assets';
import { PageHeader } from '../../../components';
import { useAccountDetail } from '../../services/account-details/account-details-service';
import {
  Activities,
  Attachments,
  Cases,
  Checklist,
  Details,
  FinancialSummary,
  Import,
  Notes,
  Projects,
  Resources,
  Timesheet,
} from '../account-details-sidebar';
import { AccountInfo } from './account-info';
import Sidebar from './sidebar';
import { transformAccountData } from './utils';

export const AccountDetails = () => {
  const location = useLocation();
  const paramsData = location.state;
  const [accountDetails, setAccountDetails] = useState<any>(null);

  const {
    data,
    isLoading,
    isError,
  }: { data: any; isLoading: boolean; isError: boolean } = useAccountDetail(
    paramsData?.account?.accountId || ''
  );

  useEffect(() => {
    if (data?.data) {
      setAccountDetails(transformAccountData(data.data));
    }
  }, [data]);

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

  const handleEditAccount = () => {
    // Add your logic for edit an account
  };

  const handleActionsClick = () => {
    console.log('Actions clicked');
    // Add actions logic here
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
    // Add settings logic here
  };

  const [activeKey, setActiveKey] = useState(
    location.state?.activeKey || 'financial'
  );

  useEffect(() => {
    if (location.state?.activeKey) {
      setActiveKey(location.state.activeKey);
    }
  }, [location.state]);

  const renderContent = () => {
    switch (activeKey) {
      case 'financial':
        return <FinancialSummary />;
      case 'details':
        return <Details />;
      case 'resources':
        return (
          <Resources accountDetails={{ ...data, activeKey: 'resources' }} />
        );
      case 'attachments':
        return <Attachments />;
      case 'projects':
        return <Projects />;
      case 'cases':
        return <Cases />;
      case 'activities':
        return <Activities />;
      case 'notes':
        return <Notes />;
      case 'checklist':
        return <Checklist />;
      case 'timesheet':
        return <Timesheet />;
      case 'imports':
        return <Import accountDetails={{ ...data, activeKey: 'imports' }} />;
      default:
        return <div className='p-6'>Page Not Found</div>;
    }
  };

  return (
    <div className='flex flex-col'>
      <div className='flex h-[108px]'>
        <PageHeader
          variant='sub'
          placeholder='Account Name'
          icon={accountDetailsIcon}
          iconBackgroundColor='#4B9BFF'
          iconClasses='h-[30px] w-[30px] rounded'
          title={data?.data?.accountById?.account_name || 'Account Title'}
          totalRecords={5}
          actionItems={menuItems}
          primaryButton={{
            label: 'Edit',
            onClick: handleEditAccount,
          }}
          onActionsClick={handleActionsClick}
          onSettingsClick={handleSettingsClick}
        />
      </div>
      <AccountInfo
        columns={accountDetails}
        loading={isLoading}
        error={isError}
      />
      <div className='flex flex-row w-full'>
        <div className='flex w-[17%]'>
          <Sidebar activeKey={activeKey} onSelect={setActiveKey} />
        </div>
        <div className='flex w-[83%] p-4 '>{renderContent()}</div>
      </div>
    </div>
  );
};

export default AccountDetails;
