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
  SettingIcon,
  TimeSheetIcon,
  ConfigIcon,
  InteractionsIcon,
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
  Configuration,
  Interactions,
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
  ExportType,
  MenuItem,
  ProjectFinancialProjectExportParams,
  ProjectFinancialResourceExportParams,
} from '../../types';
import { exportProjectData } from '../../services/project';
import { ProjectListParams } from '../../types/project';
import { exportAttachmentsData } from '../../services/attachments/attachments-service';
import { AttachmentsListExportParams } from '../../types/attachment';
import {
  exportImportsData,
  exportTimesheetData,
  exportTimesheetProjectData,
  exportTimesheetResourceData,
  exportTimesheetTaskData,
} from '../../services/import';

import { ImportsListURLParams } from '../../types/imports';
import {
  exportFinancialProjectCost,
  exportFinancialResourceCost,
} from '../../services/financial/financial-service';
import DetailsSectionSkeleton from '../../../components/skeleton-component/detailsskeleton';
import {
  exportInteractionsHistory,
  exportInteractions,
} from '../../services/interactions/interactions-service';
import { TimesheetProjectExportListURLParams } from '../../types/timesheet-projects';

export const AccountDetails = () => {
    const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [accountDetails, setAccountDetails] = useState<DisplayColumn[]>([]);
  const [accountDetailsForEdit, setAccountDetailsForEdit] =
    useState<AccountFieldsApiResponse['data']>();
  const { accountid } = useParams();
  const { menus, modules, permission } = useSelector(
    (state: RootState) => state.permission
  );

  const { filters, fiscalYear } = useSelector<RootState, AccountState>(
    (state: RootState) => state.account
  );
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const interactionHistoryId = searchParams.get('interaction_history_id');
  const interactionId = searchParams.get('interaction_id');
  const interactionRID = searchParams.get('interaction_rid');
  const interactionsView = !!interactionId || !!interactionRID;

  // Permission Mangement
  const accountIsEnable = checkPermission(modules, AllModules.ACCOUNTS);
  const isAccountDetailsEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNTS_VIEW_EDIT
  );
  const isFinancialHighlightsEnable = checkPermission(
    menus,
    AllMenus.FINANCIAL_HIGHLIGHTS
  );
  const isResourcesExportEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_RESOURCES_EXPORT
  );
  const isProjectExportEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_EXPORT
  );
  const isProjectResourceExportViewEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_RESOURCES_EXPORT
  );
  const isProjectTaskExportViewEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_TASK_EXPORT
  );
  const isAttachmentViewEnable = checkPermission(
    permission,
    AllPermissions.ATTACHMENT_VIEW_EDIT
  );

  const isImportExportEnable = checkPermission(
    permission,
    AllPermissions.IMPORTS_EXPORT
  );

  const isInteractionsExportEnable = checkPermission(
    permission,
    AllPermissions.INTERACTIONS_EXPORT
  );

  const isFinancialResourceCostExportEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_FINANCIAL_RESOURCE_COST_EXPORT
  );

  const isFinancialProjectCostExportEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_FINANCIAL_PROJECT_COST_EXPORT
  );

  const isTimesheetExportEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_TIMESHEET_EXPORT
  );

  const isAccountFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.ACCOUNTS_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );

  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const defaultTab = searchParams.get('list') ?? 'details';
  const [activeKey, setActiveKey] = useState(defaultTab as string);
  const [toggleEnabled, setToggleEnabled] = useState(false);
  const [refreshAccountDetails, setRefreshAccountDetails] = useState<number>(
    Date.now()
  );
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
  const [attachmentParams, setAttachmentParams] =
    useState<AttachmentsListExportParams>({
      sortBy: 'document_name',
      sortOrder: 'ASC',
      filters: {},
      fiscalYear: convertedFiscalYear,
    });

  const [importsParams, setImportsParams] = useState<ImportsListURLParams>({
    page: 1,
    limit: 100,
    sort: 'r_number',
    sort_by: 'asc',
    filters: {},
    fiscal_year: convertedFiscalYear,
    account_rid: accountid || '',
  });

  const [interactionsParams, setInteractionsParams] =
    useState<AttachmentsListExportParams>({
      sortBy: 'status_name',
      sortOrder: 'ASC',
      filters: {},
      page: 1,
      limit: 100,
    });
  const [timesheetProjectParams, setTimesheetProjectParams] =
    useState<TimesheetProjectExportListURLParams>({
      sortBy: 'project_code',
      sortOrder: 'ASC',
      filters: {},
      fiscalYear: convertedFiscalYear,
      account_rid: accountid || '',
      bothParentAndChild: toggleEnabled,
      documentRid: '',
    });
  const [timesheetResourceParams, setTimesheetResourceParams] =
    useState<TimesheetProjectExportListURLParams>({
      sortBy: 'project_code',
      sortOrder: 'ASC',
      filters: {},
      account_rid: accountid || '',
      documentRid: '',
    });
  const [timesheetTaskParams, setTimesheetTaskParams] =
    useState<TimesheetProjectExportListURLParams>({
      sortBy: 'project_code',
      sortOrder: 'ASC',
      filters: {},
      account_rid: accountid || '',
      documentRid: '',
    });

  const [financialResCostParams, setFinancialResCostParams] =
    useState<ProjectFinancialResourceExportParams>({
      sortBy: 'project_code',
      sortOrder: 'ASC',
      filters: {},
    });

  const [financialProjectCostParams, setFinancialProjectCostParams] =
    useState<ProjectFinancialProjectExportParams>({
      sortBy: 'project_code',
      sortOrder: 'ASC',
      filters: {},
      fiscalYear: 0,
    });
  useEffect(() => {
    const list = searchParams.get('list');
    const tabParams = searchParams.get('tab');
    const source = searchParams.get('source');
    if (
      tabParams !== 'details' &&
      list !== 'projectsTask' &&
      source === 'timesheet'
    ) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('source');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [exportType, setExportType] = useState<ExportType>('resource');

  const handleExport = (exportType: ExportType) => {
    const tab = searchParams.get('tab');
    if (
      searchParams.get('list') !== 'resources' &&
      searchParams.get('list') !== 'projects' &&
      searchParams.get('list') !== 'attachments' &&
      searchParams.get('list') !== 'imports' &&
      searchParams.get('list') !== 'financial' &&
      searchParams.get('list') !== 'timesheet' &&
      searchParams.get('list') !== 'interactions' &&
      searchParams.get('tab') !== 'timesheet_project' &&
      searchParams.get('tab') !== 'timesheet_project_resource' &&
      searchParams.get('tab') !== 'timesheet_project_task'
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
    const attachmentPayload = {
      accountRid: accountid || rNumber,
      entityId:
        exportType === 'attachments' ? accountid || rNumber : resourceRid,
      attachmentLevel: exportType === 'attachments' ? 'account' : 'resource',
      ...(exportType === 'resource_attachments' && {
        fiscalYear: convertedFiscalYear,
        filters: filter,
      }),
    };

    const financialPayload = {
      accountNumber: accountDetailsForEdit?.accountById?.r_number,
      accountRid: accountid,
    };

    const financialProjectPayload = {
      accountRid: accountid,
    };

    if (exportType === 'project') {
      exportProjectData(exportType, {
        ...projectParams,
        timezone,
        bothParentAndChild: toggleEnabled,
      });
    } else if (
      exportType === 'attachments' ||
      exportType === 'resource_attachments'
    ) {
      exportAttachmentsData('attachments', {
        ...attachmentParams,
        ...attachmentPayload,
      });
    } else if (exportType === 'imports') {
      exportImportsData(importsParams);
    } else if (exportType === 'timesheet' && !tab) {
      exportTimesheetData({
        ...importsParams,
        filters: {
          ...importsParams.filters,
          entity: { equals: 'project_task' },
        },
      });
    } else if (exportType === 'timesheet_project') {
      exportTimesheetProjectData(timesheetProjectParams);
    } else if (exportType === 'timesheet_project_resource') {
      exportTimesheetResourceData(timesheetResourceParams);
    } else if (exportType === 'timesheet_project_task') {
      exportTimesheetTaskData(timesheetTaskParams);
    } else if (exportType === 'financial_resource_cost') {
      exportFinancialResourceCost({
        ...financialResCostParams,
        ...financialPayload,
      });
    } else if (exportType === 'financial_project_cost') {
      exportFinancialProjectCost({
        ...financialProjectCostParams,
        ...financialProjectPayload,
      });
    } else if (exportType === 'interactions') {
      if (interactionHistoryId) {
        const projectInteractionHistoryExportPayload = {
          account_rid: accountid || '',
          interaction_rid: interactionHistoryId,
          page: interactionsParams?.page || 1,
          limit: interactionsParams?.limit || 100,
          sort: interactionsParams.sortBy || 'status_name',
          sort_by: interactionsParams?.sortOrder || 'ASC',
          filters: interactionsParams?.filters || {},
          timezone: systemTimezone,
          flag: 'account',
        };
        exportInteractionsHistory(projectInteractionHistoryExportPayload);
        return;
      } else {
        const projectInteractionExportPayload = {
          account_rid: accountid || '',
          fiscal_year: convertedFiscalYear,
          page: interactionsParams?.page || 1,
          limit: interactionsParams?.limit || 100,
          sort: interactionsParams?.sortBy || 'action',
          sort_by: interactionsParams?.sortOrder || 'ASC',
          filters: interactionsParams?.filters || {},
          timezone: systemTimezone,
          flag: 'account',
        };
        exportInteractions(projectInteractionExportPayload);
        return;
      }
    } else {
      exportData(exportType, exportPayload);
    }
  };

  const onRefreshClick = () => {
    setRefreshAccountDetails(Date.now());
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
    } else {
      setActiveKey('details');
    }
  }, [searchParams]);

  // getting user is inactive error, need to uncomment once details page UI is done

  const { data, isPending, isError } = useAccountDetail(
    accountid as string,
    isAccountDetailsEnable,
    refreshAccountDetails
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
    if (
      tab === 'details' ||
      searchParams.get('attachment_entity') ||
      searchParams.get('file_id') ||
      searchParams.get('upload')
    ) {
      return true;
    }

    if (list === 'resources') {
      return !isResourcesExportEnable;
    } else if (list === 'projects') {
      return !isProjectExportEnable;
    } else if (list === 'attachments') {
      return !isAttachmentViewEnable;
    } else if (list === 'imports') {
      return !isImportExportEnable;
    } else if (list === 'financial' && tab === 'resource_cost') {
      return !isFinancialResourceCostExportEnable;
    } else if (list === 'financial' && tab === 'project_cost') {
      return !isFinancialProjectCostExportEnable;
    } else if (list === 'timesheet' && !tab) {
      return !isTimesheetExportEnable;
    } else if (list === 'interactions' && !interactionsView) {
      return !isInteractionsExportEnable;
    } else if (list === 'timesheet' && tab === 'timesheet_project') {
      return !isProjectExportEnable;
    } else if (list === 'timesheet' && tab === 'timesheet_project_resource') {
      return !isProjectResourceExportViewEnable;
    } else if (list === 'timesheet' && tab === 'timesheet_project_task') {
      return !isProjectTaskExportViewEnable;
    } else {
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
        return (
          <FinancialSummary
            accountDetails={{ ...data?.data } as accountDetailsProps}
            setExportType={setExportType}
            setResCostExportParams={setFinancialResCostParams}
            setFinancialProjectCostParams={setFinancialProjectCostParams}
            countryId={data?.data.accountById.country_rid}
            stateId={data?.data.accountById.region_rid}
          />
        );
      case 'details':
        return (
          <Details
            accountDetails={{ ...data?.data } as accountDetailsProps}
            isLoading={isPending}
            isError={isError}
            isAccountEditEnable={isAccountFieldsEditable}
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
        return (
          <Attachments
            accountInActive={accountInActive}
            setExportType={setExportType}
            setAttachmentParams={setAttachmentParams}
            refetchAccountDetails={onRefreshClick}
          />
        );
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
      case 'interactions':
        return (
          <Interactions
            accountInActive={accountInActive}
            accountDetails={{ ...data?.data } as accountDetailsProps}
            setExportType={setExportType}
            setInteractionsParams={setInteractionsParams}
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
        return (
          <Timesheet
            setExportType={setExportType}
            setTimesheetParams={setImportsParams}
            setTimesheetProjectParams={setTimesheetProjectParams}
            setTimesheetResourceParams={setTimesheetResourceParams}
            setTimesheetTaskParams={setTimesheetTaskParams}
          />
        );
      case 'imports':
        return (
          <Import
            accountDetails={{
              ...(data?.data as AccountDetailsResponse),
              activeKey: 'imports',
            }}
            accountInActive={accountInActive}
            setExportType={setExportType}
            setImportsParams={setImportsParams}
          />
        );
      case 'configuration':
        return <Configuration />;
      default:
        return (
          <div className='w-full pr-4 pl-2 py-2'>
            <DetailsSectionSkeleton />
          </div>
        );
    }
  };

  const disable = data?.data?.accountById?.is_parent;

  const sideMenuItems = useMemo<MenuItem[]>(() => {
    const allMenus = [
      {
        name: 'Financial Highlights',
        key: 'financial',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: disable,
        hide: disable,
        icon: FinancialIcon,
      },
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
        hide: disable,
        icon: ResourcesIcon,
      },
      {
        name: 'Projects',
        key: 'projects',
        id: AllMenus.PROJECTS,
        disabled: disable,
        hide: disable,
        icon: ProjectsSideIcon,
      },
      {
        name: 'Interactions',
        key: 'interactions',
        id: AllModules.INTERACTIONS,
        disabled: disable,
        hide: disable,
        icon: InteractionsIcon,
      },
      {
        name: 'Cases',
        key: 'cases',
        id: AllMenus.CASES,
        disabled: disable,
        hide: disable,
        icon: CasesIcon,
      },
      {
        name: 'Activities',
        key: 'activities',
        id: AllModules.ACTIVITIES,
        disabled: disable,
        hide: disable,
        icon: ActivitiesIcon,
      },
      {
        name: 'Notes',
        key: 'notes',
        id: AllMenus.NOTES,
        disabled: disable,
        hide: disable,
        icon: NotesSideIcon,
      },
      {
        name: 'Attachments',
        key: 'attachments',
        id: AllMenus.ATTACHMENTS,
        disabled: disable,
        hide: disable,
        icon: AttachmentsSideIcon,
      },
      {
        name: 'Checklist',
        key: 'checklist',
        id: AllMenus.CHECKLISTS,
        disabled: disable,
        hide: disable,
        icon: ChecklistIcon,
      },
      {
        name: 'Timesheet',
        key: 'timesheet',
        id: AllMenus.TIMESHEETS,
        disabled: disable,
        hide: disable,
        icon: TimeSheetIcon,
      },
      {
        name: 'Imports',
        key: 'imports',
        id: AllMenus.IMPORTS,
        disabled: disable,
        hide: disable,
        icon: ImportsIcon,
      },
      {
        name: 'Configuration',
        key: 'configuration',
        id: AllMenus.CONFIGURATION,
        disabled: disable,
        hide: disable,
        icon: ConfigIcon,
        subMenu: [
          {
            name: 'Users',
            key: 'users',
            id: AllMenus.MANAGE_ACCOUNT_ACCESS,
            disabled: disable,
            hide: disable,
            icon: ResourcesIcon,
          },
          {
            name: 'Settings',
            key: 'settings',
            id: AllMenus.ACCOUNT_SETTINGS,
            disabled: disable,
            hide: disable,
            icon: SettingIcon,
          },
        ],
      },
    ];
    return isFinancialHighlightsEnable
      ? allMenus
      : allMenus.filter((item) => item.id !== AllMenus.FINANCIAL_HIGHLIGHTS);
  }, [disable, isFinancialHighlightsEnable]);

  const goBack = () => {
    navigate(ACCOUNT);
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
          title={data?.data?.accountById?.account_name ?? ''}
          totalRecords={5}
          actionItems={menuItems}
          primaryButton={
            isAccountFieldsEditable
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
          goBack={goBack}
          backBtnLabel='Back To Accounts'
          isLoading={isPending}
        />
      </div>
      <InfoSection
        columns={accountDetails}
        loading={isPending}
        error={isError}
        singleLineView={false}
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
            isLoading={isPending}
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
