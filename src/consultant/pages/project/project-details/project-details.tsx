/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { InfoSection, PageHeader, SideMenuPanel } from '../../../../components';
import { projectDetailsIcon } from '../../../../assets';
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

const sideMenuItems: MenuItem[] = [
  {
    name: 'Financial Highlights',
    key: 'financial',
    id: AllModules.PROJECT_FINANCIAL_HIGHLIGHTS,
    disabled: false,
  },
  {
    name: 'Project Details',
    key: 'projectDetails',
    id: AllModules.PROJECT_DETAILS,
    disabled: false,
  },
  {
    name: 'Project Resources',
    key: 'projectResources',
    id: AllModules.PROJECT_RESOURCES,
    disabled: false,
  },
  {
    name: 'Projects Task',
    key: 'projectsTask',
    id: AllModules.PROJECT_TASK,
    disabled: false,
  },
  {
    name: 'Interactions',
    key: 'interactions',
    id: AllModules.PROJECT_INTERACTIONS,
    disabled: false,
  },
  {
    name: 'Technical Summary',
    key: 'technicalSummary',
    id: AllModules.PROJECT_TECHNICAL_SUMMARY,
    disabled: false,
  },
  {
    name: 'Cases',
    key: 'cases',
    id: AllModules.PROJECT_CASES,
    disabled: false,
  },
  {
    name: 'Activities',
    key: 'activities',
    id: AllModules.PROJECT_ACTIVITIES,
    disabled: false,
  },
  {
    name: 'Notes',
    key: 'notes',
    id: AllModules.PROJECT_NOTES,
    disabled: false,
  },
  {
    name: 'Attachments',
    key: 'attachments',
    id: AllModules.PROJECT_ATTACHMENTS,
    disabled: false,
  },
  {
    name: 'Checklists',
    key: 'checklists',
    id: AllModules.PROJECT_CHECKLISTS,
    disabled: false,
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
        return <div>Financial Highlights</div>;
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
        return <div>Project Resources</div>;
      case 'projectsTask':
        return <div>Projects Task</div>;
      case 'interactions':
        return <div>Interactions</div>;
      case 'technicalSummary':
        return <div>Technical Summary</div>;
      case 'cases':
        return <div>Cases</div>;
      case 'activities':
        return <div>Activities</div>;
      case 'notes':
        return <div>Notes</div>;
      case 'attachments':
        return <div>Attachments</div>;
      case 'checklists':
        return <div>Checklists</div>;
      default:
        return <div className='p-6'>Page Not Found</div>;
    }
  };

  if (!projectIsEnable) return <AccessRestricted />;

  return (
    <div className='flex flex-col h-full'>
      <div className='flex'>
        <PageHeader
          variant='sub'
          placeholder='Name'
          icon={projectDetailsIcon}
          iconBackgroundColor='#AF78FF'
          iconClasses='h-8 w-8 rounded p-[6px]'
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
        />
      </div>
      <InfoSection
        columns={projectDetails}
        loading={isLoading}
        error={isError}
        singleLineView={true}
      />
      <div className='flex flex-row flex-1 w-full'>
        <div className='flex-1 w-[200px] min-w-[200px] max-w-[200px]'>
          <SideMenuPanel
            menuItems={sideMenuItems}
            activeKey={activeKey as string}
            onSelect={setActiveKey}
            headerTitle='Related List'
            showBackIcon={true}
          />
        </div>
        <div className='flex-1 p-4 overflow-hidden'>
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

export default ProjectDetails;
