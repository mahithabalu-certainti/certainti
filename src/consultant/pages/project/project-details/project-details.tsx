/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
import { CircularProgress } from '@mui/material';
import { useProjectDetail } from '../../../services/project';
import { transformProjectData } from '../utils';
import ProjectDetailsData from './details/project-data';
import { NewProjectData } from '../../../types/project';
import { MenuItem } from '../../../types';
import { AllModules, AllPermissions } from '../../../../common-service';
import { AccessRestricted } from '../../../../components/account-restricted';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { checkPermission } from '../../../../common-utils';
import { NotFound } from '../../../../pages';

const sideMenuItems: MenuItem[] = [
  {
    name: 'Project Details',
    key: 'projectDetails',
    id: AllModules.PROJECT_DETAILS,
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
    id: AllModules.PROJECT_FINANCIAL_HIGHLIGHTS,
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
    id: AllModules.PROJECT_CASES,
    disabled: false,
    icon: CasesIcon,
  },
  {
    name: 'Activities',
    key: 'activities',
    id: AllModules.PROJECT_ACTIVITIES,
    disabled: false,
    icon: ActivitiesIcon,
  },
  {
    name: 'Notes',
    key: 'notes',
    id: AllModules.PROJECT_NOTES,
    disabled: false,
    icon: NotesSideIcon,
  },
  {
    name: 'Attachments',
    key: 'attachments',
    id: AllModules.PROJECT_ATTACHMENTS,
    disabled: false,
    icon: AttachmentsSideIcon,
  },
  {
    name: 'Checklists',
    key: 'checklists',
    id: AllModules.PROJECT_CHECKLISTS,
    disabled: false,
    icon: ChecklistIcon,
  },
];

export const ProjectDetails = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [projectDetails, setProjectDetails] = useState<any>([]);
  // const { accountID, projectID } = location.state || {};
  const defaultTab = searchParams.get('list');
  const [activeKey, setActiveKey] = useState(defaultTab);
  const [projectData, setProjectData] = useState<NewProjectData | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const navigate = useNavigate();
  // Permission Mangement
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const projectIsEnable = checkPermission(modules, AllModules.PROJECTS);
  const projectDownloadIsEnable = checkPermission(
    permission,
    AllPermissions.PROJECT_PROJECTS_DOWNLOAD
  );
  const projectExportIsEnable = checkPermission(
    permission,
    AllPermissions.PROJECT_PROJECTS_EXPORT
  );
  const projectEditIsEnable = checkPermission(
    permission,
    AllPermissions.PROJECT_PROJECTS_EDIT
  );

  useEffect(() => {
    const list = searchParams.get('list');
    if (list) {
      setActiveKey(list);
    }
  }, [searchParams]);
  const initialAccountID =
    location.state?.accountID || localStorage.getItem('accountID');
  const initialProjectID =
    location.state?.projectID || localStorage.getItem('projectID');

  const [accountID, setAccountID] = useState(initialAccountID);
  const [projectID, setProjectID] = useState(initialProjectID);

  useEffect(() => {
    if (location.state?.accountID && location.state?.projectID) {
      localStorage.setItem('accountID', location.state.accountID);
      localStorage.setItem('projectID', location.state.projectID);
      setAccountID(location.state.accountID);
      setProjectID(location.state.projectID);
    }
  }, [location.state]);

  const { data, isLoading, isError } = useProjectDetail(accountID, projectID);
  const accountInActive = data?.data?.project?.account_status === 'inactive';

  useEffect(() => {
    if (data?.data) {
      setProjectDetails(transformProjectData(data.data));
      setProjectData(data.data.project);
    }
  }, [data]);
  const menuItems = [
    {
      label: 'Manage user',
      onClick: () => console.log('manage user clicked'),
    },
    {
      label: 'Export',
      onClick: () => console.log('export clicked'),
      hide: !projectExportIsEnable,
    },
  ];

  const handleEditAccount = () => {
    navigate(`/project/edit/${projectData?.rid}`, {
      state: {
        accountID: projectData?.account_rid,
        projectID: projectData?.rid,
        breadcrumbs: [
          { label: 'Project' },
          { label: projectData?.project_code },
        ],
      },
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
        return <NotFound />;
      case 'projectDetails':
        return (
          <ProjectDetailsData
            accountInActive={accountInActive}
            projectDetails={projectData}
            isDetailsLoading={isLoading}
            detailsError={isError}
            projectDownloadIsEnable={projectDownloadIsEnable}
            projectEditIsEnable={projectEditIsEnable}
            permission={permission}
          />
        );
      case 'projectResources':
        return <NotFound />;
      case 'projectsTask':
        return <NotFound />;
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
        return <NotFound />;
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
          //   title={data?.data?.accountById?.account_name || 'Project Title'}
          title={data?.data?.project?.project_name || 'Project Title'}
          totalRecords={5}
          actionItems={menuItems}
          primaryButton={
            projectEditIsEnable
              ? {
                  label: 'Edit',
                  onClick: handleEditAccount,
                  disabled: accountInActive,
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

export default ProjectDetails;
