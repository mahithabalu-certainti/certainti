import { useEffect, useState, useMemo, Suspense } from 'react';
import {
  useLocation,
  useParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import {
  ActivitiesIcon,
  AttachmentsSideIcon,
  CasesIcon,
  ChecklistIcon,
  FinancialIcon,
  ImportsIcon,
  NotesSideIcon,
  ProjectsSideIcon,
  ResourcesIcon,
  SettingIcon,
  TimeSheetIcon,
  ConfigIcon,
  InteractionsIcon,
  TaskCreateIcon,
  DraftEmailIcon,
  MeetingIcon,
  CallLogIcon,
  ConfigRuleIcon,
  AccountDeatilsIcon,
  AccountsIcon,
  ManageGroupAccount,
  HistorySubmissionIcon,
  DashboardIcon,
  FourPartIcon,
} from '../../../assets';
import {
  ActivityModal,
  InfoSection,
  PageHeader,
  SideMenuPanel,
} from '../../../components';
import { ACCOUNT } from '../../../routes';
import { useAccountDetail } from '../../services/account-details/account-details-service';
import {
  Activities,
  Attachments,
  Checklist,
  Details,
  FinancialSummary,
  Inbox,
  Import,
  Notes,
  Projects,
  Resources,
  Timesheet,
  Configuration,
  Cases,
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
  ActivityListExportURLParams,
  ActivityType,
  ActivityDropdownItem,
  CaseListExportParams,
  ChecklistListExportParams,
  ExportType,
  MenuItem,
  NotesListExportParams,
  ProjectFinancialProjectExportParams,
  ProjectFinancialResourceExportParams,
  ColorCode,
  FourPartAssessmentListExportURLParams,
} from '../../types';
import { exportProjectData, ProjectTriggerAI } from '../../services/project';
import {
  ProjectListParams,
  ProjectTriggerAIPayload,
} from '../../types/project';
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
  exportAccountInteractions,
} from '../../services/interactions/interactions-service';
import { TimesheetProjectExportListURLParams } from '../../types/timesheet-projects';
import { BUTTON_STYLES } from '../../../admin/pages/manage-user-detail/styles';
import { useToast } from '../../../hooks';
import { ExportNotesList } from '../../services/notes/notes-service';
import { ExportCaseList } from '../../services/cases/case-service';
import { ExportChecklistList } from '../../services/checklist/checklist-service';
import { ExportActivityList } from '../../services/activities/activities-service';
import HistorySubmission from '../case/case-details/history-submission/history-submission';
import Dashboard from '../account-details-sidebar/sidebar-pages/dashboard/dashboard';
import { ExportFourPartAssessmentList } from '../../services/four-part-assessment/four-part-assessment-service';
import { FourPartAssessment } from '../four-part-assessment';

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
  const TriggerAIEnable = checkPermission(
    permission,
    AllPermissions.TRIGGER_AI_ASSESSMENT
  );
  const [activityModalId, setActivityModalId] = useState<string | null>(null);

  const { filters, fiscalYear } = useSelector<RootState, AccountState>(
    (state: RootState) => state.account
  );
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const interactionHistoryId = searchParams.get('interaction_history_id');
  const interactionId = searchParams.get('interaction_id');
  const interactionRID = searchParams.get('interaction_rid');
  const interactionsView = !!interactionId || !!interactionRID;
  const noteView = searchParams.get('note_id');
  const checklistView = searchParams.get('checklist_id');
  const activityId = searchParams.get('activity_id');
  const activityType = searchParams.get('activity_type');
  const activityViewDetails = !!activityId && !!activityType;
  const fourPartAssessmentView = !!searchParams.get('fpa_id');

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
  const isResourceCostExportEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_RESOURCES_COST_EXPORT
  );
  const isResourceSkillExportEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_RESOURCES_SKILL_EXPORT
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
  const isAttachmentExportEnable = checkPermission(
    permission,
    AllPermissions.ATTACHMENT_EXPORT
  );

  const isNotesExportEnable = checkPermission(
    permission,
    AllPermissions.NOTES_EXPORT
  );

  const isChecklistsExportEnable = checkPermission(
    permission,
    AllPermissions.CHECKLIST_EXPORT
  );

  const isCasesExportEnable = checkPermission(
    permission,
    AllPermissions.CASES_EXPORT
  );

  const isImportExportEnable = checkPermission(
    permission,
    AllPermissions.IMPORTS_EXPORT
  );

  const isInteractionsExportEnable = checkPermission(
    permission,
    AllPermissions.INTERACTIONS_EXPORT
  );

  const isFourPartExportEnable = checkPermission(
    permission,
    AllPermissions.FOUR_PART_ASSESSMENT_EXPORT
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

  const isActivityTaskExportEnable = checkPermission(
    permission,
    AllPermissions.ACTIVITY_TASK_EXPORT
  );

  const isActivityCallExportEnable = checkPermission(
    permission,
    AllPermissions.ACTIVITY_CALL_EXPORT
  );

  const isActivityEmailExportEnable = checkPermission(
    permission,
    AllPermissions.ACTIVITY_EMAIL_EXPORT
  );

  const isActivityMeetingExportEnable = checkPermission(
    permission,
    AllPermissions.ACTIVITY_MEETING_EXPORT
  );

  // Activity Create Permission
  const isActivityTaskCreateEnable = checkPermission(
    permission,
    AllPermissions.ACTIVITY_TASK_CREATE
  );
  const isActivityCallCreateEnable = checkPermission(
    permission,
    AllPermissions.ACTIVITY_CALL_CREATE
  );
  const isActivityEmailCreateEnable = checkPermission(
    permission,
    AllPermissions.ACTIVITY_EMAIL_CREATE
  );
  const isActivityMeetingCreateEnable = checkPermission(
    permission,
    AllPermissions.ACTIVITY_MEETING_CREATE
  );

  const activityExportPermissionMap: Record<string, boolean> = {
    task: !!isActivityTaskExportEnable,
    email: !!isActivityEmailExportEnable,
    meeting: !!isActivityMeetingExportEnable,
    call: !!isActivityCallExportEnable,
  };

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

  const detailPageView = activeKey === 'details';

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
    accountNumber: accountid || '',
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
      search: '',
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

  const [notesParams, setNotesParams] = useState<NotesListExportParams>({
    sortBy: 'r_number',
    sortOrder: 'ASC',
    filters: {},
    fiscalYear: convertedFiscalYear,
  });

  const [checklistParams, setChecklistParams] =
    useState<ChecklistListExportParams>({
      sortBy: 'r_number',
      sortOrder: 'ASC',
      filters: {},
      fiscalYear: convertedFiscalYear,
    });

  const [casesParams, setCasesParams] = useState<CaseListExportParams>({
    sortBy: 'r_number',
    sortOrder: 'ASC',
    filters: {},
    fiscalYear: convertedFiscalYear,
  });

  const [activityParams, setActivityParams] =
    useState<ActivityListExportURLParams>({
      sortBy: 'r_number',
      sortOrder: 'ASC',
      filters: {},
      activity_type: 'all',
    });

  const [fourPartParams, setFourPartParams] =
    useState<FourPartAssessmentListExportURLParams>({
      account_rid: '',
      search: '',
      filter: {},
      sort: 'r_number',
      sort_by: 'ASC',
      type: 'account',
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
      searchParams.get('list') !== 'activities' &&
      searchParams.get('list') !== 'notes' &&
      searchParams.get('list') !== 'checklist' &&
      searchParams.get('list') !== 'cases' &&
      searchParams.get('list') !== 'imports' &&
      searchParams.get('list') !== 'financial' &&
      searchParams.get('list') !== 'timesheet' &&
      searchParams.get('list') !== 'interactions' &&
      searchParams.get('tab') !== 'timesheet_project' &&
      searchParams.get('tab') !== 'timesheet_project_resource' &&
      searchParams.get('tab') !== 'timesheet_project_task' &&
      searchParams.get('list') !== 'four_part_assessment'
    ) {
      return;
    }

    //"resource" | "cost" | "skill"
    const {
      fiscalYear,
      rNumber,
      resourceRid,
      sortBy,
      sortOrder,
      filter,
      search,
    } = tableParams;

    const commonPayload = {
      rNumber,
      sortBy,
      sortOrder,
      filter,
      search,
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
        sortBy: tableParams.sortBy,
        sortOrder: tableParams.sortOrder as 'ASC' | 'DESC' | undefined,
        fiscalYear: convertedFiscalYear,
        filters: filter,
        search,
      }),
    };

    const notesPayload = {
      accountRid: accountid || rNumber,
      entityId: exportType === 'notes' ? accountid || rNumber : resourceRid,
      attachmentLevel: exportType === 'notes' ? 'account' : 'resource',
      ...(exportType === 'resource_notes' && {
        sortBy: tableParams.sortBy,
        sortOrder: tableParams.sortOrder as 'ASC' | 'DESC' | undefined,
        fiscalYear: convertedFiscalYear,
        filters: filter,
        search,
      }),
    };

    const checklistsPayload = {
      accountRid: accountid || rNumber,
      entityId: exportType === 'checklist' ? accountid || rNumber : resourceRid,
      attachmentLevel: exportType === 'checklist' ? 'account' : 'resource',
      ...(exportType === 'resource_checklist' && {
        sortBy: tableParams.sortBy,
        sortOrder: tableParams.sortOrder as 'ASC' | 'DESC' | undefined,
        fiscalYear: convertedFiscalYear,
        filters: filter,
        search,
      }),
    };

    const financialPayload = {
      accountNumber: accountDetailsForEdit?.accountById?.r_number,
      accountRid: accountid,
    };

    const financialProjectPayload = {
      accountRid: accountid,
    };

    const activityPayload = {
      accountRid: accountid,
      entityId: accountid,
      attachmentLevel: 'account',
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
    } else if (exportType === 'notes' || exportType === 'resource_notes') {
      ExportNotesList('notes', { ...notesParams, ...notesPayload });
    } else if (exportType === 'activities') {
      ExportActivityList(
        { ...activityParams, ...activityPayload },
        activityType as ActivityType
      );
    } else if (
      exportType === 'checklist' ||
      exportType === 'resource_checklist'
    ) {
      ExportChecklistList('checklist', {
        ...checklistParams,
        ...checklistsPayload,
      });
    } else if (exportType === 'imports') {
      exportImportsData(importsParams);
    } else if (exportType === 'cases') {
      ExportCaseList(casesParams, accountid);
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
    } else if (exportType === 'four_part_assessment') {
      ExportFourPartAssessmentList(fourPartParams);
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
          sort_by: interactionsParams?.sortOrder || 'ASC',
          filters: interactionsParams?.filters || {},
          fiscal_year: convertedFiscalYear,
          search: interactionsParams?.search || '',
          flag: 'account',
          sort: 'r_number',
          page: 1,
          assessment_type: interactionsParams?.assessment_type,
        };
        exportAccountInteractions(projectInteractionExportPayload);
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

    if (list === 'resources' && !tab) {
      return !isResourcesExportEnable;
    } else if (list === 'resources' && tab === 'cost') {
      return !isResourceCostExportEnable;
    } else if (list === 'resources' && tab === 'skill') {
      return !isResourceSkillExportEnable;
    } else if (list === 'resources' && tab === 'attachments') {
      return !isAttachmentExportEnable;
    } else if (list === 'resources' && tab === 'notes' && !noteView) {
      return !isNotesExportEnable;
    } else if (list === 'resources' && tab === 'checklists' && !checklistView) {
      return !isChecklistsExportEnable;
    } else if (list === 'checklist' && !checklistView) {
      return !isChecklistsExportEnable;
    } else if (list === 'activities' && !activityViewDetails) {
      const tab = searchParams.get('tab') || 'all';
      if (tab === 'all') {
        const canExportAll =
          isActivityTaskExportEnable ||
          isActivityEmailExportEnable ||
          isActivityMeetingExportEnable ||
          isActivityCallExportEnable;

        return !canExportAll;
      }
      return !activityExportPermissionMap[tab];
    } else if (list === 'projects') {
      return !isProjectExportEnable;
    } else if (list === 'attachments') {
      return !isAttachmentExportEnable;
    } else if (list === 'notes' && !noteView) {
      return !isNotesExportEnable;
    } else if (list === 'imports') {
      return !isImportExportEnable;
    } else if (list === 'cases') {
      return !isCasesExportEnable;
    } else if (list === 'financial' && tab === 'resource_cost') {
      return !isFinancialResourceCostExportEnable;
    } else if (list === 'financial' && tab === 'project_cost') {
      return !isFinancialProjectCostExportEnable;
    } else if (list === 'timesheet' && !tab) {
      return !isTimesheetExportEnable;
    } else if (list === 'interactions' && !interactionsView) {
      return !isInteractionsExportEnable;
    } else if (list === 'four_part_assessment' && !fourPartAssessmentView) {
      return !isFourPartExportEnable;
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
    const listParam = searchParams.get('list');
    setActiveKey(location.state?.activeKey || listParam || 'details');
  }, [location.state, searchParams]);

  const { successToast } = useToast();
  const triggerAIMutation = ProjectTriggerAI();
  const handleTriggerAI = () => {
    const accountId = data?.data?.accountById?.rid || '';
    const payload: ProjectTriggerAIPayload = {
      data: [
        {
          account_rid: accountId,
          project_fiscal_rid: [],
        },
      ],
      type: 'account',
    };
    triggerAIMutation.mutate(payload, {
      onSuccess: (res) => {
        successToast(res.statusMessage);
      },
      onError: (err) => {
        console.log(err);
      },
    });
  };

  const activityMenuItems: ActivityDropdownItem[] = [
    {
      label: 'Create Task',
      onClick: () => setActivityModalId('create-task'),
      icon: TaskCreateIcon,
      hide: !isActivityTaskCreateEnable,
    },
    {
      label: 'Draft Email',
      onClick: () => setActivityModalId('draft-email'),
      icon: DraftEmailIcon,
      hide: !isActivityEmailCreateEnable,
    },
    {
      label: 'Schedule Meeting',
      onClick: () => setActivityModalId('schedule-meeting'),
      icon: MeetingIcon,
      hide: !isActivityMeetingCreateEnable,
    },
    {
      label: 'Log a call',
      onClick: () => setActivityModalId('call-log'),
      icon: CallLogIcon,
      hide: !isActivityCallCreateEnable,
    },
  ];

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
            activityMenuItems={activityMenuItems}
          />
        );
      case 'details':
        return (
          <Details
            accountDetails={{ ...data?.data } as accountDetailsProps}
            isLoading={isPending}
            isError={isError}
            isAccountEditEnable={isAccountFieldsEditable}
            activityMenuItems={activityMenuItems}
          />
        );
      case 'resources':
        return (
          <Resources
            accountDetails={{ ...data, activeKey: 'resources' }}
            setTableParams={setTableParams}
            setExportType={setExportType}
            permission={permission}
            activityMenuItems={activityMenuItems}
          />
        );
      case 'attachments':
        return (
          <Attachments
            accountInActive={accountInActive}
            setExportType={setExportType}
            setAttachmentParams={setAttachmentParams}
            refetchAccountDetails={onRefreshClick}
            activityMenuItems={activityMenuItems}
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
            activityMenuItems={activityMenuItems}
          />
        );
      case 'interactions':
        return (
          <Interactions
            accountInActive={accountInActive}
            accountDetails={{ ...data?.data } as accountDetailsProps}
            setExportType={setExportType}
            setInteractionsParams={setInteractionsParams}
            loading={isPending}
            activityMenuItems={activityMenuItems}
          />
        );
      case 'inbox':
        return <Inbox />;
      case 'four_part_assessment':
        return (
          <FourPartAssessment
            setExportType={setExportType}
            setFourPartAssessmentParams={setFourPartParams}
            activityMenuItems={activityMenuItems}
            moduleLevel='account'
          />
        );
      case 'cases':
        return (
          <Cases
            accountInActive={accountInActive}
            accountDetails={{ ...data?.data } as accountDetailsProps}
            setExportType={setExportType}
            setCasesParams={setCasesParams}
            activityMenuItems={activityMenuItems}
          />
        );
      case 'historical_submission':
        return (
          <div className='w-full pr-4 pl-2 py-2'>
            <HistorySubmission
              activityMenuItems={activityMenuItems}
              isDetailLoading={isPending}
              accountDetails={{ ...data?.data } as accountDetailsProps}
            />
          </div>
        );
      case 'activities':
        return (
          <Activities
            setExportType={setExportType}
            setActivityParams={setActivityParams}
            accountInActive={accountInActive}
            accountDetails={{ ...data?.data } as accountDetailsProps}
            isDetailLoading={isPending}
            activityMenuItems={activityMenuItems}
          />
        );
      case 'notes':
        return (
          <Notes
            setExportType={setExportType}
            accountInActive={accountInActive}
            setNotesParams={setNotesParams}
            accountDetails={{ ...data?.data } as accountDetailsProps}
            activityMenuItems={activityMenuItems}
          />
        );
      case 'checklist':
        return (
          <Checklist
            setExportType={setExportType}
            setChecklistParams={setChecklistParams}
            accountInActive={accountInActive}
            accountDetails={{ ...data?.data } as accountDetailsProps}
            activityMenuItems={activityMenuItems}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            accountDetails={{ ...data?.data } as accountDetailsProps}
          />
        );
      case 'timesheet':
        return (
          <Timesheet
            setExportType={setExportType}
            setTimesheetParams={setImportsParams}
            setTimesheetProjectParams={setTimesheetProjectParams}
            setTimesheetResourceParams={setTimesheetResourceParams}
            setTimesheetTaskParams={setTimesheetTaskParams}
            activityMenuItems={activityMenuItems}
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
            activityMenuItems={activityMenuItems}
          />
        );
      case 'configuration':
        return (
          <Configuration
            countryId={data?.data.accountById.country_rid ?? null}
            activityMenuItems={activityMenuItems}
          />
        );

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
        name: 'Dashboard',
        key: 'dashboard',
        id: AllModules.DASHBOARD,
        disabled: disable,
        hide: disable,
        icon: DashboardIcon,
      },
      {
        name: 'Details',
        key: 'details',
        id: AllModules.ACCOUNTS,
        disabled: false,
        icon: AccountDeatilsIcon,
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
        name: 'Mailbox',
        key: 'inbox',
        id: AllModules.ACCOUNTS,
        disabled: !disable,
        hide: !disable,
        icon: DraftEmailIcon,
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
        name: 'Four Part Assessment',
        key: 'four_part_assessment',
        id: AllModules.FOUR_PART_ASSESSMENT,
        disabled: disable,
        hide: disable,
        icon: FourPartIcon,
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
        name: 'Historical Submission',
        key: 'historical_submission',
        id: AllModules.HISTORICAL_SUBMISSION,
        disabled: disable,
        hide: disable,
        icon: HistorySubmissionIcon,
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
        name: 'Checklists',
        key: 'checklist',
        id: AllMenus.CHECKLISTS,
        disabled: disable,
        hide: disable,
        icon: ChecklistIcon,
      },
      {
        name: 'Timesheets',
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
        disabled: false,
        hide: false,
        icon: ConfigIcon,
        subMenu: [
          {
            name: 'Users',
            key: 'users',
            id: AllMenus.MANAGE_ACCOUNT_ACCESS,
            disabled: disable,
            hide: disable,
            icon: ManageGroupAccount,
          },
          {
            name: 'Settings',
            key: 'settings',
            id: AllMenus.ACCOUNT_SETTINGS,
            disabled: false,
            hide: false,
            icon: SettingIcon,
          },
          {
            name: 'Jurisdiction Configuration',
            key: 'jurisdiction_configuration',
            id: AllMenus.MANAGE_ACCOUNT_ACCESS,
            disabled: disable,
            hide: disable,
            icon: ConfigRuleIcon,
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

  const sourceDetails = {
    accountId: accountid || '',
    entityLevel: 'account',
    entityId: accountid || '',
    source: `Account > ${data?.data?.accountById?.r_number || ''}`,
    isEmailConfigured: data?.data?.accountDetails?.is_send_interaction,
  };

  if (!accountIsEnable || !isAccountDetailsEnable) return <AccessRestricted />;
  return (
    <div className='flex flex-col h-full'>
      <div className='flex h-[60px]'>
        <PageHeader
          variant='sub'
          placeholder='Account Name'
          icon={
            <AccountsIcon
              alt='account-icon'
              className={`h-7 w-7 p-1.5 rounded [&>path]:stroke-[${ColorCode.accountTextColor}] bg-[${ColorCode.accountBgColor}]`}
            />
          }
          title={data?.data?.accountById?.account_name ?? ''}
          totalRecords={5}
          actionItems={menuItems}
          headerButtons={[
            {
              label: 'RD Assessment',
              onClick: handleTriggerAI,
              disabled: accountInActive,
              loading: triggerAIMutation.isPending,
              sx: { ...BUTTON_STYLES, width: '115px', minWidth: '115px' },
              hide: disable || !TriggerAIEnable,
            },
          ]}
          primaryButton={
            isAccountFieldsEditable && !detailPageView
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
      <div className='flex flex-1 flex-row w-full border-b border-[#CBD6E2]'>
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
            maxHeight={225}
          />
        </div>
        <div
          className='flex-1'
          style={{ maxHeight: 'calc(100vh - 220px)', overflow: 'auto' }}
        >
          <Suspense fallback={null}>{renderContent()}</Suspense>
        </div>
      </div>
      <ActivityModal
        modalId={activityModalId}
        onCloseModal={() => setActivityModalId(null)}
        sourceDetails={sourceDetails}
      />
    </div>
  );
};

export default AccountDetails;
