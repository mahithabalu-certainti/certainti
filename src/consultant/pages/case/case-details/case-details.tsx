import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  ExportAssignedList,
  ExportCaseTaskList,
  useCaseDetails,
} from '../../../services/cases/case-service';
import {
  CaseAssignedExportParams,
  ChecklistListExportParams,
  ExportType,
  MenuItem,
  NotesListExportParams,
  InteractionListExportParams,
  ActivityListExportURLParams,
  ActivityType,
  ProjectResourcesListParams,
  ActivityDropdownItem,
  ProjectFinancialProjectExportParams,
  ProjectFinancialResourceExportParams,
  TechnicalSummaryExportListParams,
  ColorCode,
  FinancialHighlightsResponse,
} from '../../../types';
import CaseFinancialSummary from './financial-summary/financial-summary';
import { accountDetailsProps } from '../../account-details/utils';
import {
  AllMenus,
  AllModules,
  AllPermissions,
} from '../../../../common-service';
import {
  ActivityModal,
  InfoSection,
  PageHeader,
  SideMenuPanel,
} from '../../../../components';
import {
  ActivitiesIcon,
  AttachmentsSideIcon,
  CallLogIcon,
  CaseIcon,
  CaseTeamIcon,
  ChecklistIcon,
  ComingSoon,
  ConfigRuleIcon,
  DetailsKeyContactErrorIcon,
  DossierIcon,
  DraftEmailIcon,
  FinancialIcon,
  HistorySubmissionIcon,
  InteractionsIcon,
  MeetingIcon,
  NotesSideIcon,
  ProjectsSideIcon,
  ProjectTaskIcon,
  ResourcesIcon,
  ReviewProjectIcon,
  SettingIcon,
  TaskCreateIcon,
  TechSummaryIcon,
  WorkBreakdownIcon,
} from '../../../../assets';
import { WorkBreakDown } from './work-breakdown';
import { CaseTeam } from './case-team';
import CasesProjects from './case-assign-projects/cases-projects';
import { transformCaseData } from './utils';
import { ActionsDropdownItem, checkPermission } from '../../../../common-utils';
import { CaseNotes } from './case-notes';
import { ExportNotesList } from '../../../services/notes/notes-service';
import { AccessRestricted } from '../../../../components/account-restricted';
import { ACCOUNT } from '../../../../routes';
import { RootState } from '../../../../store/store';

import { AttachmentsListExportParams } from '../../../types/attachment';
import { useDispatch, useSelector } from 'react-redux';
import {
  setTemporaryFiscalYear,
  setDossierFinancialStatus as setDossierFinancialStatusAction,
  setFinancialData as setFinancialDataAction,
} from '../../../../store/slices/account-slice';
import { Attachments } from './case-attachments';
import { exportAttachmentsData } from '../../../services/attachments/attachments-service';
import Setting from './settings/setting';
import { ExportChecklistList } from '../../../services/checklist/checklist-service';
import { Checklist } from './checklist';
import { CaseInteractions } from './case-interactions';
import { ExportReviewProjectList } from '../../../services/cases-assign-projects/review-project-service';
import { ReviewProjectListURLParams } from '../../../types/assign-projects';
import HistorySubmission from './history-submission/history-submission';
import {
  exportInteractions,
  exportInteractionsHistory,
} from '../../../services/interactions/interactions-service';
import { ProjectTriggerAIPayload } from '../../../types/project';
import { useToast } from '../../../../hooks';
import { ProjectTriggerAI } from '../../../services/project';
import { BUTTON_STYLES } from '../../../../admin/pages/manage-user-detail/styles';
import { CaseActivities } from './case-activities';
import { ExportActivityList } from '../../../services/activities/activities-service';
import { CaseProjectTask } from './case-project-task';
import { ExportCaseProjectTasktList } from '../../../services/case-project-task/case-project-task-service';
import { TechnicalSummary } from './technical-summary';
import { CaseProjectResource } from './case-project-resource';
import { ExportCaseProjectResourceList } from '../../../services/case-project-resource/case-project-resource-service';
import {
  exportFinancialProjectCost,
  exportFinancialResourceCost,
} from '../../../services/financial/financial-service';
import { exportCasesTechnicalSummary } from '../../../services/case-technical-summary/technical-summary-service';
import { CircularProgress } from '@mui/material';
import { Dossier } from './dossier';

export const CaseDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { caseId } = useParams();
  const accountId = searchParams.get('accountID') || '';
  const mainSource = searchParams.get('mainSource') || '';
  const { modules, permission, menus } = useSelector(
    (state: RootState) => state.permission
  );
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const {
    data: caseData,
    isLoading,
    isError,
    isPending,
    refetch: refetchCaseDetails,
  } = useCaseDetails(caseId ?? '', accountId ?? '');
  const isAssignProject = searchParams.get('assignProject');
  const projectDetails = searchParams.get('detailstab');
  const tabParam = searchParams.get('tab');
  const caseHeaderDetails = useMemo(() => {
    if (caseData) {
      return transformCaseData(caseData);
    }
    return [];
  }, [caseData]);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const defaultTab = searchParams.get('list') ?? 'workBreakdown';
  const [activeKey, setActiveKey] = useState(defaultTab as string);
  const [exportType, setExportType] = useState<ExportType>('notes');
  const [isActionItemsExpanded, setIsActionItemsExpanded] = useState(false);
  const { dossierFinancialStatus, financialData } = useSelector(
    (state: RootState) => state.account
  );

  const setDossierFinancialStatus = (status: string) => {
    dispatch(setDossierFinancialStatusAction(status));
  };

  const setFinancialData = (data: FinancialHighlightsResponse | null) => {
    dispatch(setFinancialDataAction(data));
  };
  const [notesParams, setNotesParams] = useState<NotesListExportParams>({
    sortBy: 'r_number',
    sortOrder: 'ASC',
    filters: {},
  });
  const interactionHistoryId = searchParams.get('interaction_history_id');
  const interactionId = searchParams.get('interaction_id');
  const interactionRID = searchParams.get('interaction_rid');
  const interactionsView = !!interactionId || !!interactionRID;
  const [activityModalId, setActivityModalId] = useState<string | null>(null);

  const noteView = searchParams.get('note_id');
  const checklistView = searchParams.get('checklist_id');
  const accountInActive =
    caseData?.account_status_name?.toLowerCase() !== 'active';
  const isCaseTeamCreated = caseData?.is_case_team_created;
  const isFinancialWorkingSignoff = caseData?.financial_working_signoff;
  const [caseProjectParams, setCaseProjectParams] =
    useState<CaseAssignedExportParams>({
      sort: 'project_code',
      sort_by: 'ASC',
      filter: {},
      timezone: '',
      page: 1,
      limit: 10,
      search: '',
      case_rid: caseId ?? '',
      account_id: accountId ?? '',
    });
  const [caseTaskParams, setCaseTaskParams] = useState({
    sort: 'task_name',
    sort_by: 'ASC' as 'ASC' | 'DESC',
    filter: {},
    timezone: '',
    page: 1,
    limit: 10,
    search: '',
    case_rid: caseId ?? '',
    account_id: accountId ?? '',
  });
  const [reviewProjectParams, setReviewProjectParams] =
    useState<ReviewProjectListURLParams>({
      sortOrder: 'ASC',
      sortBy: 'project_code',
      filters: {},
      timezone: '',
      page: 1,
      limit: 10,
      search: '',
    });
  const [projectTaskParams, setProjectTaskParams] =
    useState<ProjectResourcesListParams>({
      sortOrder: 'ASC',
      sortBy: 'resource_code',
      page: 1,
      limit: 10,
      search: '',
    });

  const [projectResourceParams, setProjectResourceParams] =
    useState<ReviewProjectListURLParams>({
      sortOrder: 'ASC',
      sortBy: 'project_code',
      filters: {},
      timezone: '',
      page: 1,
      limit: 10,
      search: '',
    });
  const fiscalYear = caseData?.fiscal_year ?? 0;
  const [attachmentParams, setAttachmentParams] =
    useState<AttachmentsListExportParams>({
      sortBy: 'document_name',
      sortOrder: 'ASC',
      filters: {},
    });

  const [checklistParams, setChecklistParams] =
    useState<ChecklistListExportParams>({
      sortBy: 'r_number',
      sortOrder: 'ASC',
      filters: {},
    });

  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [interactionsParams, setInteractionsParams] =
    useState<InteractionListExportParams>({
      sortBy: '',
      sortOrder: 'ASC',
      filters: {},
      page: 1,
      limit: 100,
    });
  const [technicalSummaryParams, setTechnicalSummaryParams] =
    useState<TechnicalSummaryExportListParams>({
      sortBy: 'r_number',
      sortOrder: 'ASC',
      filters: {},
      case_rid: caseId ?? '',
      account_rid: accountId ?? '',
    });
  const [activityParams, setActivityParams] =
    useState<ActivityListExportURLParams>({
      sortBy: 'r_number',
      sortOrder: 'ASC',
      filters: {},
      activity_type: 'all',
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
      caseRid: caseId,
    });

  const activityId = searchParams.get('activity_id');
  const activityType = searchParams.get('activity_type');
  const activityViewDetails = !!activityId && !!activityType;

  useEffect(() => {
    const list = searchParams.get('list');
    if (list) {
      setActiveKey(list);
    } else {
      setActiveKey('workBreakdown');
    }
  }, [searchParams]);

  useEffect(() => {
    const listParam = searchParams.get('list');
    if (location.state?.activeKey) {
      setActiveKey(location.state.activeKey || listParam || 'workBreakdown');
    }
  }, [location.state, searchParams]);

  useEffect(() => {
    if (searchParams.get('list') !== 'caseProjects') {
      const newParams = new URLSearchParams(searchParams);
      if (!newParams.get('detailstab')) {
        newParams.delete('assignProject');
      }
      navigate({ search: newParams.toString() }, { replace: true });
    } else if (searchParams.get('list') !== 'projectTask') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('caseProjectTask');
      navigate({ search: newParams.toString() }, { replace: true });
    }
  }, [searchParams.get('list')]);
  useEffect(() => {
    if (searchParams.get('list') !== 'projectTask') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('caseProjectTask');
      navigate({ search: newParams.toString() }, { replace: true });
    }
  }, [searchParams.get('list')]);

  const dispatch = useDispatch();
  useEffect(() => {
    if (caseData?.fiscal_year) {
      dispatch(setTemporaryFiscalYear(caseData.fiscal_year.toString()));
    }
  }, [caseData, dispatch]);

  useEffect(() => {
    // Reset dossier states when case changes to avoid showing stale data from previous case
    setDossierFinancialStatus('');
    setFinancialData(null);
  }, [caseId]);

  useEffect(() => {
    setIsActionItemsExpanded(false);
  }, [activeKey, tabParam]);

  const list = searchParams.get('list');

  // Permissions management
  const caseIsEnable = checkPermission(modules, AllModules.CASES);
  const isCaseDetailsEnable = checkPermission(
    permission,
    AllPermissions.CASES_VIEW_EDIT
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

  const isInteractionsExportEnable = checkPermission(
    permission,
    AllPermissions.INTERACTIONS_EXPORT
  );
  const TriggerAIEnable = checkPermission(
    permission,
    AllPermissions.TRIGGER_AI_ASSESSMENT
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
  const isReviewProjectExportEnable = checkPermission(
    permission,
    AllPermissions.REVIEW_PROJECTS_EXPORT
  );
  const isProjectExportEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_EXPORT
  );
  const isProjectTaskExportEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_EXPORT
  );

  const isProjectResourceExportEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_RESOURCES_EXPORT
  );
  const isCaseTaskExportEnable = checkPermission(
    permission,
    AllPermissions.CASES_WORKBREAKDOWN_EXPORT
  );

  const isFinancialProjectCostExportEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_FINANCIAL_PROJECT_COST_EXPORT
  );

  const isFinancialResourceCostExportEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_FINANCIAL_RESOURCE_COST_EXPORT
  );

  const technicalSummaryExportEnable = checkPermission(
    permission,
    AllPermissions.PROJECT_TECHNICAL_SUMMARY_EXPORT
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

  const handleExport = (exportType: ExportType) => {
    if (
      searchParams.get('list') !== 'attachments' &&
      searchParams.get('list') !== 'notes' &&
      searchParams.get('list') !== 'checklist' &&
      searchParams.get('list') !== 'activities' &&
      searchParams.get('list') !== 'caseProjects' &&
      searchParams.get('list') !== 'workBreakdown' &&
      searchParams.get('tab') !== 'case_task' &&
      searchParams.get('list') !== 'interactions' &&
      searchParams.get('list') !== 'projectTask' &&
      searchParams.get('list') !== 'projectResource' &&
      searchParams.get('list') !== 'financialHighlights' &&
      searchParams.get('list') !== 'technicalSummary'
    ) {
      return;
    }

    const notesPayload = {
      accountRid: accountId,
      entityId: caseId,
      attachmentLevel: 'case',
      timezone,
    };

    const attachmentPayload = {
      accountRid: accountId,
      entityId: caseId,
      attachmentLevel: 'case',
      timezone,
    };

    const activityPayload = {
      accountRid: accountId,
      entityId: caseId,
      attachmentLevel: 'case',
    };

    if (exportType === 'notes') {
      ExportNotesList('notes', { ...notesParams, ...notesPayload });
    } else if (exportType === 'attachments') {
      exportAttachmentsData('attachments', {
        ...attachmentParams,
        ...attachmentPayload,
      });
    } else if (exportType === 'checklist') {
      const checklistPayload = {
        accountRid: accountId,
        entityId: caseId,
        attachmentLevel: 'case',
      };
      ExportChecklistList('checklist', {
        ...checklistParams,
        ...checklistPayload,
      });
    } else if (exportType === 'activities') {
      ExportActivityList(
        { ...activityParams, ...activityPayload },
        activityType as ActivityType
      );
    } else if (list === 'caseProjects' && exportType === 'cases_projects') {
      ExportAssignedList(caseProjectParams);
    } else if (exportType === 'case_task') {
      ExportCaseTaskList(caseTaskParams);
    } else if (list === 'caseProjects' && exportType === 'review_projects') {
      ExportReviewProjectList(reviewProjectParams, accountId, caseId);
    } else if (list === 'projectTask' && exportType === 'projectTask') {
      ExportCaseProjectTasktList(projectTaskParams, accountId, caseId);
    } else if (
      list === 'projectResource' &&
      exportType === 'project_resource'
    ) {
      ExportCaseProjectResourceList(projectResourceParams, accountId, caseId);
    } else if (list === 'financialHighlights') {
      if (exportType === 'financial_project_cost') {
        exportFinancialProjectCost(financialProjectCostParams);
      } else if (exportType === 'financial_resource_cost') {
        exportFinancialResourceCost(financialResCostParams);
      }
    } else if (list === 'technicalSummary') {
      if (exportType === 'technical_summary') {
        exportCasesTechnicalSummary(technicalSummaryParams);
      }
    }
    if (list === 'interactions') {
      if (interactionHistoryId) {
        const projectInteractionHistoryExportPayload = {
          account_rid: accountId || '',
          interaction_rid: interactionHistoryId,
          page: interactionsParams?.page || 1,
          limit: interactionsParams?.limit || 100,
          sort: interactionsParams.sortBy || 'status_name',
          sort_by: interactionsParams?.sortOrder || 'ASC',
          filters: interactionsParams?.filters || {},
          timezone: systemTimezone,
          flag: 'project',
          search: interactionsParams?.search || '',
        };
        exportInteractionsHistory(projectInteractionHistoryExportPayload);
        return;
      } else {
        const projectInteractionExportPayload = {
          account_rid: accountId || '',
          fiscal_year: fiscalYear,
          page: interactionsParams?.page || 1,
          limit: interactionsParams?.limit || 100,
          sort: interactionsParams?.sortBy || 'r_number',
          sort_by: interactionsParams?.sortOrder || 'ASC',
          filters: interactionsParams?.filters || {},
          flag: 'case',
          reminder_specific_list: true,
          case_rid: caseId || '',
          // search: interactionsParams?.search || '',
        };
        exportInteractions(projectInteractionExportPayload);
        return;
      }
    }
  };

  const checkExport = () => {
    const list = searchParams.get('list');
    if (
      searchParams.get('attachment_entity') ||
      searchParams.get('file_id') ||
      searchParams.get('upload')
    ) {
      return true;
    }

    if (list === 'attachments') {
      return !isAttachmentExportEnable;
    } else if (list === 'notes' && !noteView) {
      return !isNotesExportEnable;
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
    } else if (list === 'caseProjects' && !isAssignProject && !projectDetails) {
      if (tabParam === 'review_projects') {
        return !isReviewProjectExportEnable;
      } else {
        return !isProjectExportEnable;
      }
    } else if (searchParams.get('tab') === 'case_task') {
      return !isCaseTaskExportEnable;
    } else if (list === 'interactions' && !interactionsView) {
      return !isInteractionsExportEnable;
    } else if (list === 'projectTask') {
      return !isProjectTaskExportEnable;
    } else if (list === 'projectResource') {
      return !isProjectResourceExportEnable;
    } else if (list === 'technicalSummary') {
      return !technicalSummaryExportEnable;
    } else if (list === 'financialHighlights') {
      const tab = searchParams.get('tab');
      if (tab === 'project_cost') {
        return !isFinancialProjectCostExportEnable;
      } else if (tab === 'resource_cost') {
        return !isFinancialResourceCostExportEnable;
      }
      return true;
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

  const handleActionsClick = () => {
    console.log('Actions clicked');
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
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

  const handleSetCaseTaskParams = useCallback(
    (params: Record<string, unknown>) => {
      setCaseTaskParams((prev) => ({
        ...prev,
        ...params,
      }));
    },
    []
  );

  const handleToggleActionItems = (
    value: boolean | ((prevState: boolean) => boolean)
  ) => {
    setIsActionItemsExpanded((prev) => {
      const newState = typeof value === 'function' ? value(prev) : value;
      if (newState) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
      return newState;
    });
  };

  const handleToggleSideMenu = () => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      if (!newState) {
        setIsActionItemsExpanded(false);
      }
      return newState;
    });
  };

  const renderContent = () => {
    // Check if current activeKey has permission
    const currentMenuItem = sideMenuItems.find(
      (item) => item.key === activeKey
    );
    if (currentMenuItem) {
      const module = modules.find(
        (module) => module.name === currentMenuItem.id
      );
      const menu = menus.find((menu) => menu.name === currentMenuItem.id);

      // Use same logic as SideMenuPanel for permission check
      const shouldHide = !currentMenuItem.hide
        ? module
          ? !module.is_enabled
          : menu
            ? !menu.is_enabled
            : false
        : true;

      // If no permission, show loader (SideMenuPanel will switch to valid menu)
      if (shouldHide) {
        return (
          <div className='flex items-center justify-center h-full'>
            <CircularProgress size={30} sx={{ color: '#2D3E4F' }} />
          </div>
        );
      }
    }

    switch (activeKey) {
      case 'workBreakdown':
        return (
          <div className='w-full pr-4 pl-2 py-2'>
            <WorkBreakDown
              setExportType={setExportType}
              setCaseTaskParams={handleSetCaseTaskParams}
              activityMenuItems={activityMenuItems}
              caseStartDate={caseData?.case_startdate}
              caseEndDate={caseData?.statutory_submission_date}
              isActionItemsExpanded={isActionItemsExpanded}
              setIsActionItemsExpanded={handleToggleActionItems}
              isCaseTeamCreated={isCaseTeamCreated}
            />
          </div>
        );
      case 'financialHighlights':
        return (
          <CaseFinancialSummary
            accountDetails={
              {
                accountById: {
                  account_name: caseData?.account_name,
                  r_number: caseData?.account_rnumber,
                  currency: {
                    currency_symbol: caseData?.currency_symbol,
                  },
                },
              } as accountDetailsProps
            }
            setExportType={setExportType}
            setResCostExportParams={setFinancialResCostParams}
            setFinancialProjectCostParams={setFinancialProjectCostParams}
            countryId={caseData?.country_rid}
            accountId={accountId}
            caseRid={caseId}
          />
        );
      case 'caseTeam':
        return (
          <div className='w-full pr-4 pl-2 py-2'>
            <CaseTeam
              activityMenuItems={activityMenuItems}
              fiscalYear={fiscalYear}
              refetchCaseDetails={refetchCaseDetails}
            />
          </div>
        );
      case 'historical_submission':
        return (
          <div className='w-full pr-4 pl-2 py-2'>
            <HistorySubmission
              activityMenuItems={activityMenuItems}
              caseDetails={caseData}
            />
          </div>
        );
      case 'caseProjects':
        return (
          <div>
            <CasesProjects
              fiscalYear={fiscalYear}
              accountInActive={accountInActive}
              setTableParams={setCaseProjectParams}
              setReviewProjectParams={setReviewProjectParams}
              setExportType={setExportType}
              refetchCaseDetails={refetchCaseDetails}
              activityMenuItems={activityMenuItems}
              isCaseTeamCreated={!!isCaseTeamCreated}
              isFinancialWorkingSignoff={isFinancialWorkingSignoff}
            />
          </div>
        );
      case 'projectTask':
        return (
          <div>
            <CaseProjectTask
              accountInActive={accountInActive}
              setProjectTaskParams={setProjectTaskParams}
              setExportType={setExportType}
              activityMenuItems={activityMenuItems}
            />
          </div>
        );
      case 'notes':
        return (
          <CaseNotes
            accountInActive={accountInActive}
            setExportType={setExportType}
            setNotesParams={setNotesParams}
            caseDetails={caseData}
            activityMenuItems={activityMenuItems}
          />
        );
      case 'attachments':
        return (
          <Attachments
            accountInActive={accountInActive}
            setExportType={setExportType}
            setAttachmentParams={setAttachmentParams}
            caseDetails={caseData}
            activityMenuItems={activityMenuItems}
            isCaseTeamCreated={!!isCaseTeamCreated}
            isFinancialWorkingSignoff={isFinancialWorkingSignoff}
          />
        );
      case 'settings':
        return <Setting activityMenuItems={activityMenuItems} />;
      case 'activities':
        return (
          <CaseActivities
            accountInActive={accountInActive}
            caseDetails={caseData}
            setExportType={setExportType}
            setActivityParams={setActivityParams}
            isDetailLoading={isPending}
            activityMenuItems={activityMenuItems}
          />
        );
      case 'checklist':
        return (
          <Checklist
            setExportType={setExportType}
            setChecklistParams={setChecklistParams}
            accountInActive={accountInActive}
            caseDetails={caseData}
            activityMenuItems={activityMenuItems}
          />
        );
      case 'interactions':
        return (
          <CaseInteractions
            accountInActive={accountInActive}
            isSendInteraction={caseData?.is_send_interaction || false}
            CaseDetails={caseData || null}
            loading={isLoading}
            setInteractionsParams={setInteractionsParams}
            setExportType={setExportType}
            activityMenuItems={activityMenuItems}
            isCaseTeamCreated={!!isCaseTeamCreated}
            isFinancialWorkingSignoff={isFinancialWorkingSignoff}
          />
        );
      case 'projectResource':
        return (
          <CaseProjectResource
            accountInActive={accountInActive}
            setProjectResourceParams={setProjectResourceParams}
            setExportType={setExportType}
            activityMenuItems={activityMenuItems}
          />
        );
      case 'technicalSummary':
        return (
          <TechnicalSummary
            accountInActive={accountInActive}
            setExportType={setExportType}
            setTechnicalSummaryParams={setTechnicalSummaryParams}
          />
        );
      case 'dossier':
        return (
          <Dossier
            activityMenuItems={activityMenuItems}
            caseDetails={caseData}
            setDossierFinancialStatus={setDossierFinancialStatus}
            dossierFinancialStatus={dossierFinancialStatus}
            financialData={financialData}
            setFinancialData={setFinancialData}
          />
        );
      default:
        return (
          <div className='flex items-center justify-center h-full'>
            <ComingSoon alt='comingSoon' />
          </div>
        );
    }
  };
  const { successToast } = useToast();
  const triggerAIMutation = ProjectTriggerAI();
  const handleTriggerAI = () => {
    const payload: ProjectTriggerAIPayload = {
      data: [
        {
          account_rid: accountId,
          project_fiscal_rid: [],
          case_rid: caseId,
        },
      ],
      type: 'case',
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

  const isReviewProjectEnable = checkPermission(
    permission,
    AllPermissions.REVIEW_PROJECTS_VIEW_EDIT
  );
  const isProjectEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_VIEW_EDIT
  );
  const sideMenuItems = useMemo<MenuItem[]>(() => {
    const allMenus = [
      {
        name: 'Work Breakdown',
        key: 'workBreakdown',
        id: AllModules.WORKBREAKDOWN,
        disabled: false,
        icon: WorkBreakdownIcon,
      },
      {
        name: 'Financial Highlights',
        key: 'financialHighlights',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: FinancialIcon,
      },
      {
        name: 'Case Review',
        key: 'caseReview',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: ReviewProjectIcon,
      },
      {
        name: 'Case Team',
        key: 'caseTeam',
        id: AllModules.CASES_TEAM,
        disabled: false,
        icon: CaseTeamIcon,
      },
      {
        name: 'Case Projects',
        key: 'caseProjects',
        id: AllMenus.FALLBACK,
        hide: !isReviewProjectEnable && !isProjectEnable,
        disabled: false,
        icon: ProjectsSideIcon,
      },
      {
        name: 'Case Project Resource',
        key: 'projectResource',
        id: AllMenus.PROJECT_RESOURCES,
        disabled: false,
        icon: ResourcesIcon,
      },
      {
        name: 'Case Project Task',
        key: 'projectTask',
        id: AllMenus.PROJECT_TASK,
        disabled: false,
        icon: ProjectTaskIcon,
      },
      {
        name: 'Historical Submission',
        key: 'historical_submission',
        id: AllModules.HISTORICAL_SUBMISSION,
        disabled: false,
        icon: HistorySubmissionIcon,
      },
      {
        name: 'Interactions',
        key: 'interactions',
        id: AllModules.INTERACTIONS,
        disabled: false,
        icon: InteractionsIcon,
      },
      {
        name: 'Technical Summary',
        key: 'technicalSummary',
        id: AllModules.PROJECT_TECHNICAL_SUMMARY,
        disabled: false,
        icon: TechSummaryIcon,
      },
      {
        name: 'Dossier',
        key: 'dossier',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: DossierIcon,
      },
      {
        name: 'Activities',
        key: 'activities',
        id: AllModules.ACTIVITIES,
        disabled: false,
        icon: ActivitiesIcon,
      },
      {
        name: 'Notes',
        key: 'notes',
        id: AllMenus.NOTES,
        disabled: false,
        icon: NotesSideIcon,
      },
      {
        name: 'Attachments',
        key: 'attachments',
        id: AllMenus.ATTACHMENTS,
        disabled: false,
        icon: AttachmentsSideIcon,
      },
      {
        name: 'Checklists',
        key: 'checklist',
        id: AllMenus.CHECKLISTS,
        disabled: false,
        icon: ChecklistIcon,
      },
      {
        name: 'Settings',
        key: 'settings',
        id: AllMenus.CONFIGURATION,
        disabled: false,
        hide: false,
        icon: SettingIcon,
        subMenu: [
          {
            name: 'Jurisdiction Configuration',
            key: 'jurisdiction_configuration',
            id: AllMenus.MANAGE_ACCOUNT_ACCESS,
            disabled: false,
            hide: false,
            icon: ConfigRuleIcon,
          },
        ],
      },
    ];
    return allMenus;
  }, []);

  const goBack = () => {
    if (mainSource === 'global-cases') {
      window.history.back();
    } else {
      navigate(`${ACCOUNT}/details/${accountId}?list=cases`);
    }
  };

  const sourceDetails = {
    accountId: accountId,
    entityLevel: 'case',
    entityId: caseId || '',
    caseFiscalYear: caseData?.fiscal_year || '',
    source: `Case > ${caseData?.r_number || ''}`,
    isEmailConfigured: caseData?.is_send_interaction,
  };

  if (!caseIsEnable || !isCaseDetailsEnable) return <AccessRestricted />;

  return (
    <div className='flex flex-col h-full'>
      <div className='flex h-[60px]'>
        <PageHeader
          variant='sub'
          placeholder={'Case ID'}
          icon={
            <CaseIcon
              alt='case-icon'
              className={`h-7 w-7 p-1.5 rounded [&>path]:stroke-[${ColorCode.caseTextColor}] bg-[${ColorCode.caseBgColor}]`}
            />
          }
          title={caseData?.r_number || ''}
          isLoading={isLoading}
          totalRecords={5}
          actionItems={menuItems}
          onActionsClick={handleActionsClick}
          onSettingsClick={handleSettingsClick}
          showActions={false}
          showSettings={false}
          goBack={goBack}
          backBtnLabel='Back To Cases'
          headerButtons={[
            {
              label: 'RD Assessment',
              onClick: handleTriggerAI,
              disabled: accountInActive,
              loading: triggerAIMutation.isPending,
              sx: { ...BUTTON_STYLES, width: '115px', minWidth: '115px' },
              hide: !TriggerAIEnable,
            },
          ]}
        />
      </div>
      <div
        className={`transition-all duration-700 ease-in-out overflow-hidden ${
          isActionItemsExpanded
            ? 'max-h-0 opacity-0'
            : isError
              ? 'max-h-[60px] opacity-100'
              : 'max-h-[140px] opacity-100'
        }`}
      >
        <InfoSection
          columns={caseHeaderDetails}
          loading={isLoading}
          loadingRows={3}
          error={isError}
          className={!isError ? 'max-h-[140px] min-h-[140px]' : ''}
        />
      </div>
      <div className='flex flex-1 flex-row w-full border-b border-[#CBD6E2]'>
        <div
          className={`flex transition-all ease-in-out ${
            isCollapsed
              ? 'w-[60px] min-w-[60px] max-w-[60px] duration-700'
              : 'w-[220px] min-w-[220px] max-w-[220px] duration-700'
          }`}
        >
          <SideMenuPanel
            menuItems={sideMenuItems}
            activeKey={activeKey}
            onSelect={setActiveKey}
            headerTitle='Related List'
            showBackIcon={true}
            isCollapsed={isCollapsed}
            onToggleCollapse={handleToggleSideMenu}
            enableScrollbar={true}
            maxHeight={isActionItemsExpanded ? 150 : 292}
            isLoading={isLoading}
          />
        </div>
        <div
          className='flex-1 transition-all duration-500 ease-in-out'
          style={{
            maxHeight: isActionItemsExpanded
              ? 'calc(100vh - 140px)'
              : 'calc(100vh - 283px)',
            overflow: 'auto',
          }}
        >
          {!isCaseTeamCreated && !isLoading && (
            <div className='flex items-center gap-1.5 h-8 border-b border-[#FFC77B] bg-[#FEF8F0] text-[13px] text-[#2D3E4F] px-3 py-2 border-box'>
              <div>
                <React.Suspense fallback={null}>
                  <DetailsKeyContactErrorIcon alt='key-contact' />
                </React.Suspense>
              </div>
              <div>
                <span className='font-bold mr-1 capitalize'>Case Team</span>-
                <span className='ml-1 font-medium'>
                 Case activities are unavailable until the case team is setup.
                </span>
              </div>
            </div>
          )}
          {isFinancialWorkingSignoff && !isLoading && (
            <div className='flex items-center gap-1.5 h-8 border-b border-[#FFC77B] bg-[#FEF8F0] text-[13px] text-[#2D3E4F] px-3 py-2 border-box'>
              <div>
                <React.Suspense fallback={null}>
                  <DetailsKeyContactErrorIcon alt='key-contact' />
                </React.Suspense>
              </div>
              <div>
                <span className='font-bold mr-1 capitalize'>Case</span>-
                <span className='ml-1 font-medium'>
                Financial workings of this Case is signed off. Project changes are no longer allowed.
                </span>
              </div>
            </div>
          )}
          {dossierFinancialStatus && dossierFinancialStatus !== 'COMPLETED' && (
            <div className='flex items-center gap-1.5 h-8 border-b border-[#FFC77B] bg-[#FEF8F0] text-[13px] text-[#2D3E4F] px-3 py-2 border-box mb-2'>
              <div>
                <React.Suspense fallback={null}>
                  <DetailsKeyContactErrorIcon alt='key-contact' />
                </React.Suspense>
              </div>
              <div>
                <span className='font-bold mr-1 capitalize'>Status:</span>
                <span className='ml-1 font-medium'>
                  {dossierFinancialStatus || '-'}
                </span>
              </div>
            </div>
          )}
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

export default CaseDetails;
