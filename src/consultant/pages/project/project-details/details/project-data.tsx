/* eslint-disable @typescript-eslint/no-explicit-any */ import { useState } from 'react';
import { projectsBook } from '../../../../../assets';
import TabPanel from './tab';
import { useNavigate } from 'react-router-dom';
import ProjectOverview from './project-overview';
import { NewProjectData } from '../../../../types/project';

const BUTTON_STYLES = {
  height: '26px !important',
  fontSize: '13px',
  fontWeight: 400,
  color: '#F16137',
  bgcolor: '#FFF8F6',
  borderRadius: '2px',
};

interface ProjectsDataProps {
  projectDetails?: NewProjectData | null;
  activeKey?: string;
}

const ProjectDetailsData: React.FC<ProjectsDataProps> = ({
  projectDetails,
}) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);

  const handleEdit = () => {
    navigate(`/Project/edit/${projectDetails?.rid}`, {
      state: {
        accountID: projectDetails?.account_rid,
        projectID: projectDetails?.rid,
      },
    });
  };

  const headerButtons = [
    {
      label: 'Edit',
      variant: 'outlined' as const,
      onClick: () => handleEdit(),
      sx: { ...BUTTON_STYLES, width: '96px', minWidth: '96px' },
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

  return (
    <div className='w-full'>
      <TabPanel value={'projects'} setCurrentPage={setCurrentPage} />
      {currentPage === 0 && (
        <ProjectOverview
          title='Projects'
          titleIcon={<img src={projectsBook} alt='project-header-icon' />}
          headerButtons={headerButtons}
          projectDetails={projectDetails}
        />
      )}
    </div>
  );
};

export default ProjectDetailsData;
