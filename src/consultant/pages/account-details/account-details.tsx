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
import {
  accountDetailsProps,
  DisplayColumn,
  transformAccountData,
} from './utils';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { ExportModule } from '../../types/resource-skill';
import { exportData } from '../../services/resource-details/resource-details-service';
import { ActionsDropdownItem, checkPermission } from '../../../common-utils';
import { AllMenus, AllModules, AllPermissions } from '../../../common-service';
import { AccessRestricted } from '../../../components/account-restricted';
import { AccountState } from '../../../store/type';
import {
  AccountDetailsResponse,
  AccountFieldsApiResponse,
  MenuItem,
} from '../../types';
import { exportProjectData } from '../../services/project';
import { ProjectListParams } from '../../types/project';

export const AccountDetails = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [accountDetails, setAccountDetails] = useState<DisplayColumn[]>([]);
  const [accountDetailsForEdit, setAccountDetailsForEdit] =
    useState<AccountFieldsApiResponse['data']>();
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
    AllPermissions.ACCOUNTS_VIEW_EDIT
  );
  // const isAccountDetailsDownloadEnable = checkPermission(
  //   permission,
  //   AllPermissions.ACCOUNT_DETAILS_DOWNLOAD
  // );
  // const isAccountExportEnable = checkPermission(
  //   permission,
  //   AllPermissions.ACCOUNT_EXPORT
  // );
  const isResourcesExportEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_RESOURCES_EXPORT
  );
  const isProjectExportEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_EXPORT
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
    rNumber: accountDetailsForEdit?.accountById?.r_number || '',
    resourceRid: '',
    filter: {},
  });
  const [projectParams, setProjectParams] = useState<ProjectListParams>({
    sortBy: 'created_datetime',
    sortOrder: 'DESC',
    filters: {},
    fiscalYear: String(convertedFiscalYear),
    accountNumber: accountDetailsForEdit?.accountById?.r_number || '',
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

  const { data, isPending, isError } = useAccountDetail(
    accountid as string,
    isAccountDetailsEnable
  );
  const accountViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.ACCOUNTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    accountViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [accountViewEditFields]);

  useEffect(() => {
    if (data?.data) {
      setAccountDetails(transformAccountData(data?.data, permissionMap));
      setAccountDetailsForEdit(data.data);
    }
  }, [data, permissionMap]);

  const accountInActive =
    data?.data?.accountById?.status?.status_name?.toLowerCase() !== 'active';

  const checkExport = () => {
    const list = searchParams.get('list');
    const tab = searchParams.get('tab');
    if (tab === 'details') {
      return true;
    }

    if (list === 'resources') {
      return !isResourcesExportEnable;
    } else if (list === 'projects') {
      return !isProjectExportEnable;
    } else {
      // return !isAccountExportEnable;
      return true;
    }
  };

  const menuItems: ActionsDropdownItem[] = [
    {
      label: 'Manage user',
      onClick: () => console.log('manage user clicked'),
      hide: true,
    },
    {
      label: 'Export',
      onClick: () => handleExport(exportType),
      hide: accountInActive || checkExport(),
    },
  ];

  const handleEditAccount = () => {
    navigate(ACCOUNT + '/edit/' + data?.data?.accountById?.rid, {
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
            accountDetails={{ ...data?.data } as accountDetailsProps}
            isLoading={isPending}
            isError={isError}
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
            accountDetails={{
              ...(data?.data as AccountDetailsResponse),
              activeKey: 'Projects',
            }}
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
        return (
          <Import
            data={{
              ...(data?.data as AccountDetailsResponse),
              activeKey: 'imports',
            }}
          />
        );
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
        id: AllModules.ACCOUNTS,
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
        id: AllMenus.PROJECTS,
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
        id: AllMenus.CASES,
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
        id: AllMenus.NOTES,
        disabled: disable,
        icon: NotesSideIcon,
      },
      {
        name: 'Attachments',
        key: 'attachments',
        id: AllMenus.ATTACHMENTS,
        disabled: disable,
        icon: AttachmentsSideIcon,
      },
      {
        name: 'Checklist',
        key: 'checklist',
        id: AllMenus.CHECKLISTS,
        disabled: disable,
        icon: ChecklistIcon,
      },
      {
        name: 'Timesheet',
        key: 'timesheet',
        id: AllMenus.TIMESHEETS,
        disabled: disable,
        icon: TimeSheetIcon,
      },
      {
        name: 'Imports',
        key: 'imports',
        id: AllMenus.IMPORTS,
        disabled: disable,
        icon: ImportsIcon,
      },
    ],
    [disable]
  ); // Only recalculate when 'disable' changes

  const goBack = () => {
    window.history.back();
  };

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
          primaryButton={{
            label: 'Edit',
            onClick: handleEditAccount,
          }}
          onActionsClick={handleActionsClick}
          onSettingsClick={handleSettingsClick}
          showActions={false}
          showSettings={false}
          goBack={goBack}
        />
      </div>
      <InfoSection
        columns={accountDetails}
        loading={isPending}
        error={isError}
        singleLineView={true}
      />
      <div className='flex flex-1 flex-row w-full'>
        <div
          className={`flex transition-all ease-in-out ${
            isCollapsed
              ? 'w-[60px] min-w-[60px] max-w-[60px] duration-300'
              : 'w-[220px] min-w-[220px] max-w-[220px] duration-500'
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
          <Suspense fallback={null}>{renderContent()}</Suspense>
        </div>
      </div>
    </div>
  );
};

export default AccountDetails;
