/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { accountDetailsIcon } from '../../../assets';
import { PageHeader } from '../../../components';
import { ACCOUNT } from '../../../routes';
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
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [accountDetails, setAccountDetails] = useState<any>(null);
  const [accountDetailsForEdit, setAccountDetailsForEdit] = useState<any>(null);
  const { accountid } = useParams();

  const defaultTab = searchParams.get('list') || 'financial';
  const [activeKey, setActiveKey] = useState(defaultTab);

  useEffect(() => {
    const list = searchParams.get('list');
    if (list) {
      setActiveKey(list);
    }
  }, [searchParams]);

  const {
    data,
    isLoading,
    isError,
  }: { data: any; isLoading: boolean; isError: boolean } = useAccountDetail(
    accountid as string
  );

  useEffect(() => {
    if (data?.data) {
      setAccountDetails(transformAccountData(data.data));
      setAccountDetailsForEdit(data.data);
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
    navigate(ACCOUNT + '/edit/' + data.data.accountById.rid, {
      state: { accountDetailsForEdit },
    });
  };

  const handleActionsClick = () => {
    console.log('Actions clicked');
    // Add actions logic here
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
    // Add settings logic here
  };

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
        <div className='flex w-[261px] min-w-[261px] max-w-[261px]'>
          <Sidebar activeKey={activeKey} onSelect={setActiveKey} />
        </div>
        <div className='flex-1 p-4 overflow-hidden'>{renderContent()}</div>
      </div>
    </div>
  );
};

export default AccountDetails;
