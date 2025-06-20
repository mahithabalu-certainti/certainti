/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo, Suspense } from 'react';
import {
  useLocation,
  useParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import {
  AccountDetailsIcon,
  ActivitiesIcon,
  AttachmentsSideIcon,
  CasesIcon,
  ChecklistIcon,
  DetailsIcon,
  FinancialIcon,
  ImportsIcon,
  NotesSideIcon,
  ProjectsSideIcon,
  ResourcesIcon,
  TimeSheetIcon,
} from '../../../assets';
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
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

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
  const isResourcesExportEnable = checkPermission(
    permission,
    AllPermissions.RESOURCES_DOWNLOAD
  );
  const isProjectExportEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_PROJECTS_DOWNLOAD
  );

  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const defaultTab = searchParams.get('list');
  const [activeKey, setActiveKey] = useState(defaultTab as string);
  const [toggleEnabled, setToggleEnabled] = useState(false);

  const [tableParams, setTableParams] = useState<ExportModule>({
    sortBy: 'created_datetime',
    sortOrder: 'DESC',
    fiscalYear: String(convertedFiscalYear),
    rNumber: accountDetailsForEdit?.account_by_id?.r_number || '',
    resourceRid: '',
    filter: {},
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
    const { fiscalYear, rNumber, resourceRid, sortBy, sortOrder, filter } =
      tableParams;

    const commonPayload = {
      rNumber,
      sortBy,
      sortOrder,
      filter,
    };

    const exportPayload = {
      ...commonPayload,
      ...(exportType !== 'resource' && { resourceRid }),
      ...(exportType === 'cost' && { fiscalYear }),
    };

    if (exportType === 'project') {
      exportProjectData(exportType, {
        ...projectParams,
        timezone,
        bothParentAndChild: toggleEnabled,
      });
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

  const checkExport = () => {
    if (searchParams.get('list') === 'resources') {
      return !isResourcesExportEnable;
    } else if (searchParams.get('list') === 'projects') {
      return !isProjectExportEnable;
    } else {
      return !isAccountExportEnable;
    }
  };

  const menuItems: ActionsDropdownItem[] = [
    {
      label: 'Manage user',
      onClick: () => console.log('manage user clicked'),
    },
    {
      label: 'Export',
      onClick: () => handleExport(exportType),
      hide: checkExport(),
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
            toggleEnabled={toggleEnabled}
            setToggleEnabled={setToggleEnabled}
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
        return (
          <div className='flex items-center justify-center h-full'>
            Page Not Found
          </div>
        );
    }
  };

  const disable = data?.data?.accountById?.is_parent;

  const sideMenuItems = useMemo<MenuItem[]>(
    () => [
      {
        name: 'Details',
        key: 'details',
        id: AllModules.DETAILS,
        disabled: false,
        icon: DetailsIcon,
      },
      {
        name: 'Resources',
        key: 'resources',
        id: AllModules.RESOURCES,
        disabled: disable,
        icon: ResourcesIcon,
      },
      {
        name: 'Projects',
        key: 'projects',
        id: AllModules.PROJECTS,
        disabled: disable,
        icon: ProjectsSideIcon,
      },
      {
        name: 'Financial Highlights',
        key: 'financial',
        id: AllModules.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: FinancialIcon,
      },
      {
        name: 'Cases',
        key: 'cases',
        id: AllModules.CASES,
        disabled: disable,
        icon: CasesIcon,
      },
      {
        name: 'Activities',
        key: 'activities',
        id: AllModules.ACTIVITIES,
        disabled: disable,
        icon: ActivitiesIcon,
      },
      {
        name: 'Notes',
        key: 'notes',
        id: AllModules.NOTES,
        disabled: disable,
        icon: NotesSideIcon,
      },
      {
        name: 'Attachments',
        key: 'attachments',
        id: AllModules.ATTACHMENTS,
        disabled: disable,
        icon: AttachmentsSideIcon,
      },
      {
        name: 'Checklist',
        key: 'checklist',
        id: AllModules.CHECKLISTS,
        disabled: disable,
        icon: ChecklistIcon,
      },
      {
        name: 'Timesheet',
        key: 'timesheet',
        id: AllModules.TIMESHEETS,
        disabled: disable,
        icon: TimeSheetIcon,
      },
      {
        name: 'Imports',
        key: 'imports',
        id: AllModules.IMPORTS,
        disabled: disable,
        icon: ImportsIcon,
      },
    ],
    [disable]
  ); // Only recalculate when 'disable' changes

  if (!accountIsEnable || !isAccountDetailsEnable) return <AccessRestricted />;

  return (
    <div className='flex flex-col h-full'>
      <div className='flex h-[60px]'>
        <PageHeader
          variant='sub'
          placeholder='Account Name'
          icon={
            <AccountDetailsIcon
              className='h-6 w-6 rounded'
              style={{ backgroundColor: '#4B9BFF' }}
            />
          }
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
          showActions={false}
          showSettings={false}
        />
      </div>
      <InfoSection
        columns={accountDetails}
        loading={isLoading}
        error={isError}
        singleLineView={true}
      />
      <div className='flex flex-1 flex-row w-full'>
        <div
          className={`flex transition-all duration-300 ease-in-out ${
            isCollapsed
              ? 'w-[60px] min-w-[60px] max-w-[60px]'
              : 'w-[220px] min-w-[220px] max-w-[220px]'
          }`}
        >
          <SideMenuPanel
            menuItems={sideMenuItems}
            activeKey={activeKey}
            onSelect={setActiveKey}
            headerTitle='Related List'
            showBackIcon={true}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
          />
        </div>
        <div
          className='flex-1'
          style={{ maxHeight: 'calc(100vh - 140px)', overflow: 'auto' }}
        >
          {isLoading ? (
            <div className='flex items-center justify-center w-full h-full'>
              <CircularProgress />
            </div>
          ) : (
            <Suspense fallback={null}>{renderContent()}</Suspense>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountDetails;
