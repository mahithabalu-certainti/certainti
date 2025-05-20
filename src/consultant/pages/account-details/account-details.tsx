/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import {
  useLocation,
  useParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
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
import { CircularProgress } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { ExportModule } from '../../types/resource-skill';
import { exportData } from '../../services/resource-details/resource-details-service';
import {
  ActionsDropdownItem,
  checkPermission,
  DONT_HAVE_ACCESS,
} from '../../../common-utils';
import { AllModules, AllPermissions } from '../../../common-service';
import { AccessRestricted } from '../../../components/account-restricted';
import { AccountState } from '../../../store/type';

export const AccountDetails = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [accountDetails, setAccountDetails] = useState<any>(null);
  const [accountDetailsForEdit, setAccountDetailsForEdit] = useState<any>(null);
  const { accountid } = useParams();
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const { filters, fiscalYear } = useSelector<RootState, AccountState>(
    (state: RootState) => state.account
  );

  // Permission Mangement
  const accountIsEnable = checkPermission(modules, AllModules.ACCOUNTS);
  const isAccountEditEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_EDIT
  );
  const isAccountExportEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_EXPORT
  );

  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const defaultTab = searchParams.get('list') || 'financial';
  const [activeKey, setActiveKey] = useState(defaultTab);

  const [tableParams, setTableParams] = useState<ExportModule>({
    sortBy: 'created_datetime',
    sortOrder: 'DESC',
    fiscalYear: String(convertedFiscalYear),
    rNumber: accountDetailsForEdit?.account_by_id?.r_number || '',
    resourceRid: '',
  });
  const [exportType, setExportType] = useState<'resource' | 'cost' | 'skill'>(
    'resource'
  );
  const handleExport = (exportType: 'resource' | 'cost' | 'skill') => {
    if (searchParams.get('list') !== 'resources') {
      return;
    }

    //"resource" | "cost" | "skill"
    const { fiscalYear, rNumber, resourceRid, sortBy, sortOrder } = tableParams;

    const commonPayload = {
      rNumber,
      sortBy,
      sortOrder,
    };

    const exportPayload = {
      ...commonPayload,
      ...(exportType !== 'resource' && { resourceRid }),
      ...(exportType === 'cost' && { fiscalYear }),
    };

    exportData(exportType, exportPayload);
  };

  useEffect(() => {
    // Check Global filters and redirect if account is not in the list
    if (filters?.length > 0 && accountid) {
      const hasMatchingAccount = filters.some(
        (filter) =>
          filter.account === accountid ||
          (filter.child && filter.child.includes(accountid))
      );
      if (!hasMatchingAccount) {
        navigate(ACCOUNT);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, accountid]);

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

  const menuItems: ActionsDropdownItem[] = [
    {
      label: 'Manage user',
      onClick: () => console.log('manage user clicked'),
    },
    {
      label: 'Export',
      onClick: () => handleExport(exportType),
      disabled: !isAccountExportEnable,
      tooltip: isAccountExportEnable ? '' : DONT_HAVE_ACCESS,
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
          <Resources
            accountDetails={{ ...data, activeKey: 'resources' }}
            setTableParams={setTableParams}
            setExportType={setExportType}
          />
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

  if (!accountIsEnable) return <AccessRestricted />;

  return (
    <div className='flex flex-col'>
      <div className='flex h-[108px]'>
        <PageHeader
          variant='sub'
          placeholder='Account Name'
          icon={accountDetailsIcon}
          iconBackgroundColor='#4B9BFF'
          iconClasses='h-8 w-8 rounded'
          title={data?.data?.accountById?.account_name || 'Account Title'}
          totalRecords={5}
          actionItems={menuItems}
          primaryButton={{
            label: 'Edit',
            onClick: handleEditAccount,
            disabled: !isAccountEditEnable,
            tooltip: isAccountEditEnable ? '' : DONT_HAVE_ACCESS,
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
        <div className='flex-1 p-4 overflow-hidden'>
          {isLoading ? (
            <div className='flex items-center justify-center w-full h-full'>
              <CircularProgress />
            </div>
          ) : (
            <>{renderContent()}</>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountDetails;
