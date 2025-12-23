import React from 'react';
import { DetailsIcon, DetailsKeyContactErrorIcon } from '../../../../../assets';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProjectOverview from './project-overview';
import { NewProjectData } from '../../../../types/project';
import {
  AllMenus,
  AllPermissions,
  Permissions,
} from '../../../../../common-service';
import { Box } from '@mui/material';
import { ActivityDropdownItem } from '../../../../types';
import { SectionTabPanel } from '../../../../../components';

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
  iconBg?: string;
  bgType?: 'circle' | 'react';
  activityMenuItems: ActivityDropdownItem[];
}
export interface DetailsTabs {
  id: AllPermissions | AllMenus;
  name: string;
  hide: boolean;
  disable?: boolean;
}

const detailsTabs = [
  {
    id: AllPermissions.PROJECTS_VIEW_EDIT,
    name: 'Overview',
    hide: false,
  },
  // {
  //   id: AllMenus.TIMESHEETS,
  //   name: 'Timeline',
  //   hide: false,
  //   disable: true,
  // },
];

const ProjectDetailsData: React.FC<ProjectsDataProps> = ({
  accountInActive,
  projectDetails,
  isDetailsLoading,
  detailsError,
  // projectDownloadIsEnable,
  projectEditIsEnable,
  permission,
  activityMenuItems,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceTab = searchParams.get('source_tab');

  const handleEdit = () => {
    const source =
      searchParams.get('source') === 'account' ? 'account' : 'project';

    const queryParams = new URLSearchParams({
      accountID: projectDetails?.account_rid ?? '',
      projectID: projectDetails?.rid ?? '',
      source,
    });

    navigate(`/project/edit/${projectDetails?.rid}?${queryParams.toString()}`);
  };

  const isKeyContactAvailable =
    projectDetails?.keyContact && projectDetails?.keyContact.length > 0;

  const handleBackClick = () => {
    const timesheetId = searchParams.get('timesheet_id');
    const sourceTab = searchParams.get('source_tab');
    const accountid = searchParams.get('accountID');
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('list', 'timesheet');
    if (timesheetId) newSearchParams.set('timesheet_id', timesheetId);
    if (sourceTab) newSearchParams.set('tab', sourceTab);
    navigate(`/account/details/${accountid}?${newSearchParams.toString()}`);
  };

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
      // hide: !projectDownloadIsEnable,
      hide: true,
    },
    {
      label: 'Back To Timesheet',
      variant: 'contained' as const,
      onClick: () => handleBackClick(),
      sx: { width: '155px', minWidth: '155px' },
      hide: sourceTab !== 'timesheet_project',
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
      {!isKeyContactAvailable && !isDetailsLoading && (
        <Box className='flex items-center gap-1.5 h-8 border-b border-[#FFC77B] bg-[#FEF8F0] text-[13px] text-[#2D3E4F] px-3 py-2 border-box'>
          <Box>
            <DetailsKeyContactErrorIcon alt='key-contact' />
          </Box>
          <Box>
            <span className='font-bold mr-1'>Contact Details </span> -{' '}
            <span className='ml-1 font-medium'>
              {' '}
              {`Not added for ${projectDetails?.project_name || projectDetails?.project_code}`}
            </span>
          </Box>
        </Box>
      )}
      <Box className='pr-4 pl-2 py-2'>
        <SectionTabPanel
          tabs={detailsTabs}
          showAddActivity={true}
          activityMenuItems={activityMenuItems}
          filterVisibility={false}
          showFilter={false}
          contextKey='project-details'
          setCurrentPage={() => {}}
          appliedFilters={{}}
          setAppliedFilters={() => {}}
          handleFilter={() => {}}
          handleSorting={() => {}}
          sortFilterCount={0}
          setSortFilterCount={() => {}}
        />
        <ProjectOverview
          title='Projects'
          titleIcon={
            <DetailsIcon
              alt='project-header-icon'
              className='[&>path]:stroke-white'
            />
          }
          headerButtons={headerButtons}
          projectDetails={projectDetails}
          isDetailsLoading={isDetailsLoading}
          detailsError={detailsError}
          isKeyContactAvailable={isKeyContactAvailable}
          permission={permission}
          iconBg='#AF78FF'
          bgType='circle'
        />
      </Box>
    </div>
  );
};

export default ProjectDetailsData;
