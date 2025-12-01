import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
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
} from '../../../types';
import {
  AllMenus,
  AllModules,
  AllPermissions,
} from '../../../../common-service';
import { InfoSection, PageHeader, SideMenuPanel } from '../../../../components';
import {
  AccountDetailsIcon,
  ActivitiesIcon,
  AttachmentsSideIcon,
  CasesIcon,
  ChecklistIcon,
  ComingSoon,
  DetailsIcon,
  FinancialIcon,
  InteractionsIcon,
  NotesSideIcon,
  ProjectsSideIcon,
  ResourcesIcon,
  SettingIcon,
  TechSummaryIcon,
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
import { setTemporaryFiscalYear } from '../../../../store/slices/account-slice';
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

export const CaseDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { caseId } = useParams();
  const accountId = searchParams.get('accountID') || '';
  const mainSource = searchParams.get('mainSource') || '';
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const {
    data: caseData,
    isLoading,
    isError,
  } = useCaseDetails(caseId ?? '', accountId ?? '');
  const isAssignProject = searchParams.get('assignProject');
  const projectDetails = searchParams.get('detailstab');
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

  const [notesParams, setNotesParams] = useState<NotesListExportParams>({
    sortBy: 'r_number',
    sortOrder: 'ASC',
    filters: {},
  });
  const interactionHistoryId = searchParams.get('interaction_history_id');
  const interactionId = searchParams.get('interaction_id');
  const interactionRID = searchParams.get('interaction_rid');
  const interactionsView = !!interactionId || !!interactionRID;
  const noteView = searchParams.get('note_id');
  const checklistView = searchParams.get('checklist_id');
  const accountInActive =
    caseData?.account_status_name?.toLowerCase() !== 'active';
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

  const [activityParams, setActivityParams] =
    useState<ActivityListExportURLParams>({
      sortBy: 'r_number',
      sortOrder: 'ASC',
      filters: {},
      activity_type: 'all',
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
    }
  }, [searchParams.get('list')]);

  const dispatch = useDispatch();
  useEffect(() => {
    if (caseData?.fiscal_year) {
      dispatch(setTemporaryFiscalYear(caseData.fiscal_year.toString()));
    }
  }, [caseData, dispatch]);

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
      searchParams.get('list') !== 'interactions'
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
      return false;
    } else if (searchParams.get('tab') === 'case_task') {
      return false;
    } else if (list === 'interactions' && !interactionsView) {
      return !isInteractionsExportEnable;
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

  const activityMenuItems = [
    { label: 'Create Task', onClick: () => console.log('Task') },
    { label: 'Draft Email', onClick: () => console.log('Eamil') },
    { label: 'Schedule Meeting', onClick: () => console.log('Meeting') },
    { label: 'Log a call', onClick: () => console.log('Call') },
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

  const renderContent = () => {
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
            />
          </div>
        );
      case 'caseTeam':
        return (
          <div className='w-full pr-4 pl-2 py-2'>
            <CaseTeam
              activityMenuItems={activityMenuItems}
              fiscalYear={fiscalYear}
            />
          </div>
        );
      case 'historical_submission':
        return (
          <div className='w-full pr-4 pl-2 py-2'>
            <HistorySubmission activityMenuItems={activityMenuItems} />
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
          />
        );
      case 'attachments':
        return (
          <Attachments
            accountInActive={accountInActive}
            setExportType={setExportType}
            setAttachmentParams={setAttachmentParams}
            caseDetails={caseData}
          />
        );
      case 'settings':
        return <Setting />;
      case 'activities':
        return (
          <CaseActivities
            accountInActive={accountInActive}
            caseDetails={caseData}
            setExportType={setExportType}
            setActivityParams={setActivityParams}
          />
        );
      case 'checklist':
        return (
          <Checklist
            setExportType={setExportType}
            setChecklistParams={setChecklistParams}
            accountInActive={accountInActive}
            caseDetails={caseData}
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
  const sideMenuItems = useMemo<MenuItem[]>(() => {
    const allMenus = [
      {
        name: 'Work Breakdown',
        key: 'workBreakdown',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: ProjectsSideIcon,
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
        icon: CasesIcon,
      },
      {
        name: 'Case Team',
        key: 'caseTeam',
        id: AllModules.CASES_TEAM,
        disabled: false,
        icon: CasesIcon,
      },
      {
        name: 'Case Projects',
        key: 'caseProjects',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: CasesIcon,
      },
      {
        name: 'Project Resource',
        key: 'projectResource',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: ResourcesIcon,
      },
      {
        name: 'Project Task',
        key: 'projectTask',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: ProjectsSideIcon,
      },
      {
        name: 'Historical Submission',
        key: 'historical_submission',
        id: AllModules.PROJECT_INTERACTIONS,
        disabled: false,
        icon: InteractionsIcon,
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
        name: 'RD Credit Forms',
        key: 'rd_credit_forms',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: DetailsIcon,
      },
      {
        name: 'Dossier',
        key: 'dossier',
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
        disabled: false,
        icon: DetailsIcon,
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
            icon: ResourcesIcon,
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

  if (!caseIsEnable || !isCaseDetailsEnable) return <AccessRestricted />;

  return (
    <div className='flex flex-col h-full'>
      <div className='flex h-[60px]'>
        <PageHeader
          variant='sub'
          placeholder={'Case ID'}
          icon={
            <AccountDetailsIcon
              className='h-6 w-6 rounded'
              style={{ backgroundColor: '#4B9BFF' }}
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
      <InfoSection
        columns={caseHeaderDetails}
        loading={isLoading}
        loadingRows={4}
        error={isError}
        className={!isError ? 'max-h-[140px] min-h-[140px]' : ''}
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
            enableScrollbar={true}
          />
        </div>
        <div
          className='flex-1'
          style={{
            maxHeight: 'calc(100vh - 140px)',
            overflow: 'auto',
          }}
        >
          <Suspense fallback={null}>{renderContent()}</Suspense>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
