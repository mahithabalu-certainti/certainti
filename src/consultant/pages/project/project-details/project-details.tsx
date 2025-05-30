/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { InfoSection, PageHeader, SideMenuPanel } from '../../../../components';
import { projectDetailsIcon } from '../../../../assets';
import { CircularProgress } from '@mui/material';
import { useProjectDetail } from '../../../services/project';
import { transformProjectData } from '../utils';
import ProjectDetailsData from './details/project-data';
import { NewProjectData } from '../../../types/project';
import { MenuItem } from '../../../types';
import { AllModules } from '../../../../common-service';

const sideMenuItems: MenuItem[] = [
  {
    name: 'Financial Highlights',
    key: 'financial',
    id: AllModules.FINANCIAL_HIGHLIGHTS,
    disabled: false,
  },
  {
    name: 'Project Details',
    key: 'projectDetails',
    id: AllModules.PROJECTS,
    disabled: false,
  },
  {
    name: 'Project Resources',
    key: 'projectResources',
    id: AllModules.RESOURCES,
    disabled: false,
  },
  {
    name: 'Projects Task',
    key: 'projectsTask',
    id: AllModules.PROJECTS,
    disabled: false,
  },
  {
    name: 'Interactions',
    key: 'interactions',
    id: AllModules.INTRACTION,
    disabled: false,
  },
  {
    name: 'Technical Summary',
    key: 'technicalSummary',
    id: AllModules.PROJECTS,
    disabled: false,
  },
  { name: 'Cases', key: 'cases', id: AllModules.CASES, disabled: false },
  {
    name: 'Activities',
    key: 'activities',
    id: AllModules.ACTIVITIES,
    disabled: false,
  },
  { name: 'Notes', key: 'notes', id: AllModules.NOTES, disabled: false },
  {
    name: 'Attachments',
    key: 'attachments',
    id: AllModules.ATTACHMENTS,
    disabled: false,
  },
  {
    name: 'Checklists',
    key: 'checklists',
    id: AllModules.CHECKLISTS,
    disabled: false,
  },
];

export const ProjectDetails = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [projectDetails, setProjectDetails] = useState<any>([]);
  // const { accountID, projectID } = location.state || {};
  const defaultTab = searchParams.get('list') || 'financial';
  const [activeKey, setActiveKey] = useState(defaultTab);
  const [projectData, setProjectData] = useState<NewProjectData | null>(null);
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
  // console.log('projectDetails outerr', data);
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
    },
  ];

  const handleEditAccount = () => {
    console.log('Edit clicked');
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
            projectDetails={projectData}
            isDetailsLoading={isLoading}
            detailsError={isError}
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

  return (
    <div className='flex flex-col'>
      <div className='flex'>
        <PageHeader
          variant='sub'
          placeholder='Project Name'
          icon={projectDetailsIcon}
          iconBackgroundColor='#AF78FF'
          iconClasses='h-8 w-8 rounded p-[6px]'
          //   title={data?.data?.accountById?.account_name || 'Project Title'}
          title={data?.data?.project?.project_name || 'Project Title'}
          totalRecords={5}
          actionItems={menuItems}
          primaryButton={{
            label: 'Edit',
            onClick: handleEditAccount,
          }}
          onActionsClick={handleActionsClick}
          onSettingsClick={handleSettingsClick}
        />
      </div>
      <InfoSection
        columns={projectDetails}
        loading={isLoading}
        error={isError}
      />
      <div className='flex flex-row w-full'>
        <div className='flex w-[200px] min-w-[200px] max-w-[200px]'>
          <SideMenuPanel
            menuItems={sideMenuItems}
            activeKey={activeKey}
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
