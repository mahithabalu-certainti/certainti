/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense, useEffect, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { InfoSection, PageHeader, SideMenuPanel } from '../../../../components';
import {
  ActivitiesIcon,
  AttachmentsSideIcon,
  CasesIcon,
  ChecklistIcon,
  DetailsIcon,
  FinancialIcon,
  InteractionsIcon,
  NotesSideIcon,
  ProjectDetailsIcon,
  ProjectsSideIcon,
  ResourcesIcon,
  TechSummaryIcon,
} from '../../../../assets';
import { useProjectDetail } from '../../../services/project';
import { transformProjectData } from '../utils';
import ProjectDetailsData from './details/project-data';
import { FiscalYearType, NewProjectData } from '../../../types/project';
import { ExportType, MenuItem } from '../../../types';
import {
  AllMenus,
  AllModules,
  AllPermissions,
} from '../../../../common-service';
import { AccessRestricted } from '../../../../components/account-restricted';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { checkPermission } from '../../../../common-utils';
import { NotFound } from '../../../../pages';
import { ProjectResources } from './project-resources/project-resources';
import { Attachments } from './attachments';
import { exportAttachmentsData } from '../../../services/attachments/attachments-service';
import { AttachmentsListExportParams } from '../../../types/attachment';
import { ProjectTask } from './project-task/project-task';
// import ProjectTask from './project-task/project-task';

const sideMenuItems: MenuItem[] = [
  {
    name: 'Project Details',
    key: 'projectDetails',
    id: AllModules.PROJECTS,
    disabled: false,
    icon: DetailsIcon,
  },
  {
    name: 'Project Resources',
    key: 'projectResources',
    id: AllModules.PROJECT_RESOURCES,
    disabled: false,
    icon: ResourcesIcon,
  },
  {
    name: 'Projects Task',
    key: 'projectsTask',
    id: AllModules.PROJECT_TASK,
    disabled: false,
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
    name: 'Interactions',
    key: 'interactions',
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
    name: 'Cases',
    key: 'cases',
    id: AllMenus.CASES,
    disabled: false,
    icon: CasesIcon,
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
    key: 'checklists',
    id: AllMenus.CHECKLISTS,
    disabled: false,
    icon: ChecklistIcon,
  },
];

export const ProjectDetails = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [projectDetails, setProjectDetails] = useState<any>([]);
  const defaultTab = searchParams.get('list');
  const [activeKey, setActiveKey] = useState(defaultTab);
  const [projectData, setProjectData] = useState<NewProjectData | null>(null);
  const [fiscalYear, setFiscalYear] = useState<FiscalYearType | undefined>();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [exportType, setExportType] = useState<ExportType>('attachments');
  const [refreshProjectDetails, setRefreshProjectDetails] = useState<number>(
    Date.now()
  );
  const [attachmentParams, setAttachmentParams] =
    useState<AttachmentsListExportParams>({
      sortBy: 'document_name',
      sortOrder: 'ASC',
      filters: {},
    });

  const navigate = useNavigate();
  // Permission Mangement
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const projectIsEnable = checkPermission(modules, AllModules.PROJECTS);
  const projectDownloadIsEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_EXPORT
  );
  // Functionality will be implement later
  // const projectExportIsEnable = checkPermission(
  //   permission,
  //   AllPermissions.PROJECT_PROJECTS_EXPORT
  // );
  // const projectEditIsEnable = checkPermission(
  //   permission,
  //   AllPermissions.PROJECT_PROJECTS_EDIT
  // );

  useEffect(() => {
    const list = searchParams.get('list');
    if (list) {
      setActiveKey(list);
    }
  }, [searchParams]);

  const onRefreshClick = () => {
    setRefreshProjectDetails(Date.now());
  };

  const { projectid: projectID } = useParams();
  const accountID = searchParams.get('accountID') || '';
  const parent = searchParams.get('source');
  const { data, isLoading, isError } = useProjectDetail(
    accountID,
    projectID || '',
    refreshProjectDetails
  );
  const accountInActive =
    data?.data?.project?.account_status?.toLowerCase() !== 'active';

  const formatDate = (year: number, mmdd: string): string => {
    const [month, day] = mmdd.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  useEffect(() => {
    if (data?.data) {
      setProjectDetails(transformProjectData(data.data));
      setProjectData(data.data.project);
      setFiscalYear({
        year: data.data.project.fiscal_year,
        startDate: formatDate(
          data.data.project.fiscal_year,
          data.data.project.fiscal_start_date
        ),
        endDate: formatDate(
          data.data.project.fiscal_year,
          data.data.project.fiscal_end_date
        ),
      });
    }
  }, [data]);

  const isAttachmentViewEnable = checkPermission(
    permission,
    AllPermissions.ATTACHMENT_VIEW_EDIT
  );

  const checkExport = () => {
    const list = searchParams.get('list');
    if (list === 'attachments') {
      return !isAttachmentViewEnable;
    } else {
      return true;
    }
  };

  const handleExport = (exportType: ExportType) => {
    if (searchParams.get('list') !== 'attachments') {
      return;
    }

    const attachmentPayload = {
      accountRid: accountID,
      entityId: projectID,
      attachmentLevel: 'project',
    };
    if (exportType === 'attachments') {
      exportAttachmentsData('attachments', {
        ...attachmentParams,
        ...attachmentPayload,
      });
    } else {
      return;
    }
  };

  const menuItems = [
    {
      label: 'Manage user',
      onClick: () => console.log('manage user clicked'),
      hide: true,
    },
    {
      label: 'Export',
      onClick: () => handleExport(exportType),
      // hide: !projectExportIsEnable,
      hide: accountInActive || checkExport(),
    },
  ];

  const handleEditAccount = () => {
    const projectID = projectData?.rid ?? '';
    const accountID = projectData?.account_rid ?? '';

    const source = parent === 'account' ? 'account' : 'project';

    const queryParams = new URLSearchParams({
      accountID,
      projectID,
      source,
    });

    navigate(`/project/edit/${projectID}?${queryParams.toString()}`);
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
        return <NotFound />;
      case 'projectDetails':
        return (
          <ProjectDetailsData
            accountInActive={accountInActive}
            projectDetails={{
              ...projectData!,
              attachment: data?.data?.attachment || [],
            }}
            isDetailsLoading={isLoading}
            detailsError={isError}
            projectDownloadIsEnable={projectDownloadIsEnable}
            projectEditIsEnable={true}
            permission={permission}
          />
        );
      case 'projectResources':
        return (
          <ProjectResources
            projectID={projectID}
            accountID={accountID}
            projectFiscalYear={fiscalYear}
          />
        );
      case 'projectsTask':
        return <ProjectTask />;

      case 'interactions':
        return <NotFound />;
      case 'technicalSummary':
        return <NotFound />;
      case 'cases':
        return <NotFound />;
      case 'activities':
        return <NotFound />;
      case 'notes':
        return <NotFound />;
      case 'attachments':
        return (
          <Attachments
            accountInActive={accountInActive}
            setExportType={setExportType}
            setAttachmentParams={setAttachmentParams}
            refetchProjectDetails={onRefreshClick}
          />
        );
      case 'checklists':
        return <NotFound />;
      default:
        return (
          <div className='flex items-center justify-center h-full'>
            Page Not Found
          </div>
        );
    }
  };

  const goBack = () => {
    window.history.back();
  };

  if (!projectIsEnable) return <AccessRestricted />;
  return (
    <div className='flex flex-col h-full'>
      <div className='flex h-[60px]'>
        <PageHeader
          variant='sub'
          placeholder='Name'
          icon={
            <ProjectDetailsIcon
              className='h-6 w-6 rounded p-[4px]'
              style={{ backgroundColor: '#AF78FF' }}
            />
          }
          title={data?.data?.project?.project_name || 'Project Title'}
          totalRecords={5}
          actionItems={menuItems}
          primaryButton={{
            label: 'Edit',
            onClick: handleEditAccount,
            disabled: accountInActive,
          }}
          onActionsClick={handleActionsClick}
          onSettingsClick={handleSettingsClick}
          showActions={false}
          showSettings={false}
          goBack={goBack}
        />
      </div>
      <InfoSection
        columns={projectDetails}
        loading={isLoading}
        error={isError}
        singleLineView={true}
      />
      <div className='flex flex-row flex-1 w-full'>
        <div
          className={`flex transition-all duration-300 ease-in-out ${
            isCollapsed
              ? 'w-[60px] min-w-[60px] max-w-[60px]'
              : 'w-[220px] min-w-[220px] max-w-[220px]'
          }`}
        >
          <SideMenuPanel
            menuItems={sideMenuItems}
            activeKey={activeKey as string}
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

export default ProjectDetails;
