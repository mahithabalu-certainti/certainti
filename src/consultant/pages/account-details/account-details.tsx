/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from 'react';
import {
  useLocation,
  useParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { accountDetailsIcon } from '../../../assets';
import { InfoSection, PageHeader, SideMenuPanel } from '../../../components';
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
import { transformAccountData } from './utils';
import { CircularProgress } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { ExportModule } from '../../types/resource-skill';
import { exportData } from '../../services/resource-details/resource-details-service';
import { ActionsDropdownItem, checkPermission } from '../../../common-utils';
import { AllModules, AllPermissions } from '../../../common-service';
import { AccessRestricted } from '../../../components/account-restricted';
import { AccountState } from '../../../store/type';
import { MenuItem } from '../../types';
import { exportProjectData } from '../../services/project';
import { ProjectListParams } from '../../types/project';

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
  const isAccountDetailsEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_DETAILS_VIEW
  );
  const isAccountDetailsDownloadEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_DETAILS_DOWNLOAD
  );
  const isAccountEditEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_EDIT
  );
  const isAccountExportEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_EXPORT
  );

  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const defaultTab = searchParams.get('list');
  const [activeKey, setActiveKey] = useState(defaultTab as string);

  const [tableParams, setTableParams] = useState<ExportModule>({
    sortBy: 'created_datetime',
    sortOrder: 'DESC',
    fiscalYear: String(convertedFiscalYear),
    rNumber: accountDetailsForEdit?.account_by_id?.r_number || '',
    resourceRid: '',
  });
  const [projectParams, setProjectParams] = useState<ProjectListParams>({
    sortBy: 'created_datetime',
    sortOrder: 'DESC',
    filters: {},
    fiscalYear: String(convertedFiscalYear),
    accountNumber: accountDetailsForEdit?.account_by_id?.r_number || '',
  });
  const [exportType, setExportType] = useState<
    'resource' | 'cost' | 'skill' | 'project'
  >('resource');
  const handleExport = (
    exportType: 'resource' | 'cost' | 'skill' | 'project'
  ) => {
    if (
      searchParams.get('list') !== 'resources' &&
      searchParams.get('list') !== 'projects'
    ) {
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

    if (exportType === 'project') {
      exportProjectData(exportType, projectParams);
    } else {
      exportData(exportType, exportPayload);
    }
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

  // getting user is inactive error, need to uncomment once details page UI is done

  const {
    data,
    isLoading,
    isError,
  }: { data: any; isLoading: boolean; isError: boolean } = useAccountDetail(
    accountid as string,
    isAccountDetailsEnable
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
      hide: !isAccountExportEnable,
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
  // Set active key from location stat
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
        return (
          <Details
            accountDetails={{ ...data?.data }}
            isLoading={isLoading}
            isError={isError}
            isAccountEditEnable={isAccountEditEnable}
            isAccountDetailsDownloadEnable={isAccountDetailsDownloadEnable}
          />
        );
      case 'resources':
        return (
          <Resources
            accountDetails={{ ...data, activeKey: 'resources' }}
            setTableParams={setTableParams}
            setExportType={setExportType}
            permission={permission}
          />
        );
      case 'attachments':
        return <Attachments />;
      case 'projects':
        return (
          <Projects
            accountDetails={{ ...data, activeKey: 'Projects' }}
            setExportType={setExportType}
            setProjectParams={setProjectParams}
          />
        );
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

  const disable = data?.data?.accountById?.is_parent;

  const sideMenuItems = useMemo<MenuItem[]>(
    () => [
      {
        name: 'Financial Highlights',
        key: 'financial',
        id: AllModules.FINANCIAL_HIGHLIGHTS,
        disabled: false,
      },
      {
        name: 'Details',
        key: 'details',
        id: AllModules.DETAILS,
        disabled: false,
      },
      {
        name: 'Resources',
        key: 'resources',
        id: AllModules.RESOURCES,
        disabled: false,
      },
      {
        name: 'Projects',
        key: 'projects',
        id: AllModules.PROJECTS,
        disabled: disable,
      },
      { name: 'Cases', key: 'cases', id: AllModules.CASES, disabled: false },
      {
        name: 'Activities',
        key: 'activities',
        id: AllModules.ACTIVITIES,
        disabled: false,
      },
      { name: 'Notes', key: 'notes', id: AllModules.NOTES, disabled: false },
      {
        name: 'Attachments',
        key: 'attachments',
        id: AllModules.ATTACHMENTS,
        disabled: false,
      },
      {
        name: 'Checklist',
        key: 'checklist',
        id: AllModules.CHECKLISTS,
        disabled: false,
      },
      {
        name: 'Timesheet',
        key: 'timesheet',
        id: AllModules.TIMESHEETS,
        disabled: false,
      },
      {
        name: 'Imports',
        key: 'imports',
        id: AllModules.IMPORTS,
        disabled: disable,
      },
    ],
    [disable]
  ); // Only recalculate when 'disable' changes

  if (!accountIsEnable || !isAccountDetailsEnable) return <AccessRestricted />;

  return (
    <div className='flex flex-col'>
      <div className='flex h-[60px]'>
        <PageHeader
          variant='sub'
          placeholder='Account Name'
          icon={accountDetailsIcon}
          iconBackgroundColor='#4B9BFF'
          iconClasses='h-6 w-6 rounded'
          title={data?.data?.accountById?.account_name || 'Account Title'}
          totalRecords={5}
          actionItems={menuItems}
          primaryButton={
            isAccountEditEnable
              ? {
                  label: 'Edit',
                  onClick: handleEditAccount,
                }
              : undefined
          }
          onActionsClick={handleActionsClick}
          onSettingsClick={handleSettingsClick}
        />
      </div>
      <InfoSection
        columns={accountDetails}
        loading={isLoading}
        error={isError}
        singleLineView={true}
      />
      <div className='flex flex-row w-full'>
        <div className='flex w-[200px] min-w-[200px] max-w-[200px]'>
          <SideMenuPanel
            menuItems={sideMenuItems}
            activeKey={activeKey}
            onSelect={setActiveKey}
            headerTitle='Related List'
            showBackIcon={true}
          />
        </div>
        <div className='flex-1 overflow-hidden'>
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
