import { Suspense, useEffect, useMemo, useState } from 'react';
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
import { useSelector } from 'react-redux';
import { Attachments } from './case-attachments';
import { exportAttachmentsData } from '../../../services/attachments/attachments-service';
import { ExportChecklistList } from '../../../services/checklist/checklist-service';
import { Checklist } from './checklist';

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

  const noteView = searchParams.get('note_id');
  const checklistView = searchParams.get('checklist_id');
  const accountInActive =
    caseData?.account_status_name?.toLowerCase() !== 'active';
  const [caseProjectParams, setCaseProjectParams] =
    useState<CaseAssignedExportParams>({
      sort: 'project_type_name',
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

  const handleExport = (exportType: ExportType) => {
    if (
      !(
        searchParams.get('list') === 'attachments' ||
        searchParams.get('list') === 'notes' ||
        (searchParams.get('list') !== 'checklist' &&
          searchParams.get('list') === 'caseProjects') ||
        searchParams.get('list') === 'workBreakdown' ||
        searchParams.get('tab') === 'case_task'
      )
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
    } else if (list === 'caseProjects') {
      ExportAssignedList(caseProjectParams);
    } else if (exportType === 'case_task') {
      ExportCaseTaskList(caseTaskParams);
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
    } else if (list === 'caseProjects' && !isAssignProject && !projectDetails) {
      return false;
    } else if (searchParams.get('tab') === 'case_task') {
      return false;
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

  const renderContent = () => {
    switch (activeKey) {
      case 'workBreakdown':
        return (
          <div className='w-full pr-4 pl-2 py-2'>
            <WorkBreakDown
              caseId={caseId}
              setExportType={setExportType}
              setCaseTaskParams={(params: Record<string, unknown>) =>
                setCaseTaskParams((prev) => ({
                  ...prev,
                  ...params,
                }))
              }
            />
          </div>
        );
      case 'caseTeam':
        return (
          <div className='w-full pr-4 pl-2 py-2'>
            <CaseTeam />
          </div>
        );
      case 'caseProjects':
        return (
          <div>
            <CasesProjects
              fiscalYear={fiscalYear}
              accountInActive={accountInActive}
              setTableParams={setCaseProjectParams}
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
      default:
        return (
          <div className='flex items-center justify-center h-full'>
            <ComingSoon alt='comingSoon' />
          </div>
        );
    }
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
        name: 'Financial Workings',
        key: 'financialWorkings',
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
        id: AllMenus.FINANCIAL_HIGHLIGHTS,
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
        key: 'interaction',
        id: AllModules.PROJECT_INTERACTIONS,
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
        />
      </div>
      <InfoSection
        columns={caseHeaderDetails}
        loading={isLoading}
        loadingRows={4}
        error={isError}
        className={!isError ? 'max-h-[140px] min-h-[140px]' : ''}
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
