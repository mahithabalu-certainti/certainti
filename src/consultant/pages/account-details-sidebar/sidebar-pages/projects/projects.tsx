/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { ProjectHeaderIcon } from '../../../../../assets';
import TabPanel from '../../components/tab';
// import ListTable from '../../components/table';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import ResourceTableHeader from '../resources/resource-table-header';
import { getProjectColumns } from './columns';
import { useAccountProjects } from '../../../../services/project';
import { PROJECT_CREATE, PROJECT_DETAILS } from '../../../../../routes';
import { generatePath, useNavigate } from 'react-router-dom';
import { ProjectList, ProjectListParams } from '../../../../types/project';
import { ListTable } from '../../../../../components/table';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { checkPermission } from '../../../../../common-utils';
import { AllModules, AllPermissions } from '../../../../../common-service';
import { ResourceTabs } from '../resources/resources';

const BUTTON_STYLES = {
  height: '24px !important',
  fontSize: '13px',
  fontWeight: 600,
};

interface ProjectsProps {
  accountDetails?: Record<string, any>;
  activeKey?: string;
  setProjectParams: React.Dispatch<React.SetStateAction<ProjectListParams>>;
  setExportType?: (type: 'resource' | 'cost' | 'skill' | 'project') => void;
}

const projectTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_PROJECTS_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
  {
    id: AllPermissions.ACCOUNT_PROJECTS_TIMELINE,
    name: 'Timeline',
    hide: false,
  },
];

const Projects: React.FC<ProjectsProps> = ({
  accountDetails,
  setExportType,
  setProjectParams,
}) => {
  const navigate = useNavigate();
  const [projectsTabs, setProjectsTabs] = useState(projectTabs);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('project_code');
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );
  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const [refreshProjectsTrigger, setRefreshProjectsTrigger] = useState<number>(
    Date.now()
  );
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const accountInActive =
    accountDetails?.data?.accountById?.status === 'inactive';

  // Permission Mangement
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const projectIsEnable = checkPermission(modules, AllModules.PROJECTS);
  const projectViewAllIsEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_PROJECTS_VIEW_ALL
  );

  const projectCreateIsEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_PROJECTS_CREATE
  );
  const projectDownloadIsEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_PROJECTS_DOWNLOAD
  );
  const projectEditIsEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_PROJECTS_EDIT
  );
  const projectDeleteIsEnable = checkPermission(
    permission,
    AllPermissions.ACCOUNT_PROJECTS_DELETE
  );
  const projectOverviewIsEnable = !projectsTabs[0].hide;

  const { data, isLoading, error } = useAccountProjects(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      fiscalYear: convertedFiscalYear,
      accountNumber: accountDetails?.data?.accountDetails?.account_rid || '',
    },
    projectOverviewIsEnable && projectViewAllIsEnable,
    refreshProjectsTrigger
  );
  const totalItems = data?.count || 0;
  const onRefreshClick = () => {
    setRefreshProjectsTrigger(Date.now());
  };
  useEffect(() => {
    const isHide = (tab: ResourceTabs) => {
      return (
        !permission?.find((item) => item.name === tab.id)?.is_enabled || false
      );
    };
    // updated sub tabs(Overview, Timeline)
    setProjectsTabs(
      projectTabs.map((tab) => ({
        ...tab,
        hide: isHide(tab),
      }))
    );
  }, [permission]);

  useEffect(() => {
    if (setExportType) {
      setExportType('project');
    }
    setProjectParams({
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      fiscalYear: convertedFiscalYear,
      accountNumber: accountDetails?.data?.accountDetails?.account_rid || '',
    });
  }, [sortField, sortOrder, appliedFilters, convertedFiscalYear]);

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setSortOrder(apiOrder);
    setSortField(sortBy);
  };
  const handleEdit = (account: any) => {
    navigate(`/Project/edit/${account?.rid}`, {
      state: {
        accountID: account?.account_rid,
        projectID: account?.rid,
        breadcrumbs: [{ label: 'Account' }, { label: account?.account_name }],
      },
    });
  };
  const getRowId = (row: ProjectList) => row.rid;
  const actionMenuItems = [
    {
      label: 'Edit',
      disabled: accountInActive,
      onClick: (row: any) => handleEdit(row),
      hide: !projectEditIsEnable,
    },
    {
      label: 'Delete',
      disabled: accountInActive,
      onClick: (row: any) => console.log('Delete', row),
      hide: !projectDeleteIsEnable,
    },
    {
      label: 'View Summary',
      onClick: (row: any) => console.log('Summary', row),
    },
    {
      label: 'View Activities',
      onClick: (row: any) => console.log('Activities', row),
    },
    {
      label: 'View Notes',
      onClick: (row: any) => console.log('Notes', row),
    },
  ];

  const headerButtons = [
    {
      label: 'New',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: () => handleCreateProject(),
      sx: { ...BUTTON_STYLES, width: '48px', minWidth: '48px' },
      hide: !projectCreateIsEnable,
    },
    {
      label: 'Download',
      variant: 'outlined' as const,
      onClick: () => console.log('Download'),
      sx: {
        ...BUTTON_STYLES,
        width: '96px',
        minWidth: '96px',
        display: 'none',
      },
      hide: !projectDownloadIsEnable,
    },
  ];

  const handleCreateProject = () => {
    const accountID = accountDetails?.data?.accountById?.rid;
    const accountName = accountDetails?.data?.accountById?.account_name;
    navigate(`${PROJECT_CREATE}`, {
      state: {
        accountID,
        breadcrumbs: [{ label: 'Account' }, { label: accountName }],
      },
    });
  };

  const handleProject = (project: ProjectList) => {
    const path = generatePath(PROJECT_DETAILS, {
      projectid: project?.rid,
    });
    navigate(path, {
      state: { accountID: project?.account_rid, projectID: project?.rid },
    });
  };

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'project_code';
    const defaultSortOrder = 'ASC';
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    if (!sortBy) {
      setSortFilterCount(0);
      setSortOrder(defaultSortOrder);
      setSortField(defaultSortField);
    } else {
      setSortFilterCount(1);
      setSortOrder(apiOrder);
      setSortField(sortBy);
    }
  };

  const projectColumns = getProjectColumns(handleProject);

  if (!projectIsEnable) return <AccessRestricted />;

  return (
    <div className='w-full py-2 pl-2 pr-4'>
      <TabPanel
        value='projects'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        showFilter={showFilter}
        filterVisibility={projectOverviewIsEnable}
        handleFilter={handleFilter}
        setCurrentPage={setCurrentPage}
        resourceTab={projectsTabs}
        showRefresh={true}
        onRefreshClick={onRefreshClick}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
      />
      {projectOverviewIsEnable && projectViewAllIsEnable ? (
        <>
          <ResourceTableHeader
            value={'projects'}
            title='Projects'
            titleIcon={
              <ProjectHeaderIcon alt='project-header-icon' />
            }
            headerButtons={headerButtons}
          />
          <div className='border border-[#CBD6E2]'>
            <ListTable
              data={data?.projects as any}
              columns={projectColumns}
              getRowId={getRowId}
              hoverHighlight={false}
              stickyHeader={true}
              stickyColumnsCount={1}
              actionWidth={60}
              actionDisplayMode='dropdown'
              actionMenuItems={actionMenuItems}
              loading={isLoading}
              error={error ? 'Failed to load projects' : undefined}
              rowsPerPageOptions={[25, 50, 100]}
              rowsPerPage={rowsPerPage}
              currentPage={currentPage ?? 1}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={setRowsPerPage}
              sortBy={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          </div>
        </>
      ) : (
        <AccessRestricted />
      )}
    </div>
  );
};

export default Projects;
