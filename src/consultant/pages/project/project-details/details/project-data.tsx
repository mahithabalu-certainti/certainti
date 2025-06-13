/* eslint-disable @typescript-eslint/no-explicit-any */ import {
  useEffect,
  useState,
} from 'react';
import {
  detailsKeyContactErrorIcon,
  projectsBook,
} from '../../../../../assets';
import TabPanel from './tab';
import { useNavigate } from 'react-router-dom';
import ProjectOverview from './project-overview';
import { NewProjectData } from '../../../../types/project';
import { AllPermissions, Permissions } from '../../../../../common-service';
import { Box } from '@mui/material';

const BUTTON_STYLES = {
  height: '26px !important',
  fontSize: '13px',
  fontWeight: 400,
};

interface ProjectsDataProps {
  accountInActive: boolean;
  permission: Permissions[];
  projectDetails?: NewProjectData | null;
  activeKey?: string;
  isDetailsLoading: boolean;
  detailsError: boolean;
  projectDownloadIsEnable?: boolean;
  projectEditIsEnable?: boolean;
}
export interface DetailsTabs {
  id: AllPermissions;
  name: string;
  hide: boolean;
}

const detailsTabs: DetailsTabs[] = [
  {
    id: AllPermissions.PROJECT_DETAILS_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  {
    id: AllPermissions.PROJECT_DETAILS_TIMELINE,
    name: 'Timeline',
    hide: false,
  },
];

const ProjectDetailsData: React.FC<ProjectsDataProps> = ({
  accountInActive,
  projectDetails,
  isDetailsLoading,
  detailsError,
  projectDownloadIsEnable,
  projectEditIsEnable,
  permission,
}) => {
  const [detailsTab, setDetailsTab] = useState(detailsTabs);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [tabValue, setTabValue] = useState('');

  const isOverViewEnable = !detailsTab[0].hide;

  useEffect(() => {
    const isHide = (tab: DetailsTabs) => {
      return (
        !permission?.find((item) => item.name === tab.id)?.is_enabled || false
      );
    };
    // updated sub tabs(Overview, Timeline)
    setDetailsTab(
      detailsTabs.map((tab) => ({
        ...tab,
        hide: isHide(tab),
      }))
    );
  }, [permission]);

  const handleEdit = () => {
    navigate(`/project/edit/${projectDetails?.rid}`, {
      state: {
        accountID: projectDetails?.account_rid,
        projectID: projectDetails?.rid,
        breadcrumbs: [
          { label: 'Project' },
          { label: projectDetails?.project_code },
        ],
      },
    });
  };
  const isKeyContactAvailable =
    projectDetails?.keyContact && projectDetails?.keyContact.length > 0;
  const headerButtons = [
    {
      label: 'Edit',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: () => handleEdit(),
      sx: { ...BUTTON_STYLES, width: '48px', minWidth: '48px' },
      hide: !projectEditIsEnable,
    },
    {
      label: 'Download',
      variant: 'outlined' as const,
      onClick: () => console.log('Download'),
      sx: { ...BUTTON_STYLES, width: '96px', minWidth: '96px' },
      hide: !projectDownloadIsEnable,
    },
  ];

  //   const handleProject = (project: ProjectList) => {
  //     const path = generatePath(PROJECT_DETAILS, {
  //       projectid: project?.rid,
  //     });
  //     navigate(path, {
  //       state: { accountID: project?.account_rid, projectID: project?.rid },
  //     });
  //   };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  return (
    <div className='w-full'>
      {!isKeyContactAvailable && (
        <Box className='flex items-center gap-1.5 h-8 border-b border-[#FFC77B] bg-[#FEF8F0] text-[13px] text-[#2D3E4F] px-3 py-2 border-box'>
          <Box>
            <img src={detailsKeyContactErrorIcon} alt='key-contact' />
          </Box>
          <Box>
            <span className='font-bold mr-1'>Contact Details </span> -{' '}
            <span className='ml-1 font-medium'>
              {' '}
              {`Not added for ${projectDetails?.project_name || 'project'}`}
            </span>
          </Box>
        </Box>
      )}
      <Box className='pr-4 pl-2 py-2'>
        <TabPanel
          tabValue={tabValue}
          setCurrentPage={setCurrentPage}
          detailsTab={detailsTab}
          handleTabChange={handleTabChange}
        />
        {currentPage === 0 && isOverViewEnable && (
          <ProjectOverview
            title='Projects'
            titleIcon={
              <img
                src={projectsBook}
                alt='project-header-icon'
                className='w-6 h-6'
              />
            }
            headerButtons={headerButtons}
            projectDetails={projectDetails}
            isDetailsLoading={isDetailsLoading}
            detailsError={detailsError}
            isKeyContactAvailable={isKeyContactAvailable}
          />
        )}
      </Box>
    </div>
  );
};

export default ProjectDetailsData;
