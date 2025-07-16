import { useEffect, useState } from 'react';
import TabPanel from '../../../account-details-sidebar/components/tab';
import { CreateResourceIcon, ResourceProfileIcon } from '../../../../../assets';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import {
  useProjectResourceDetail,
  useProjectResources,
} from '../../../../services/project-resources/project-resource-service';
import {
  PROJECT_RESOURCE_CREATE,
  PROJECT_RESOURCE_EDIT,
} from '../../../../../routes';
import { getProjectResourcesColumns } from './list/columns';
import { ProjectResourcesListType } from '../../../../types/project-resources';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProjectResourceTableHeader from './project-resource-list-header';
import ProjectResourceDetails from './details/project-resource-detail';
// import { resetFilter } from '../../../account-details-sidebar/components/filter/utils';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { AllPermissions } from '../../../../../common-service';
import { ListTable } from '../../../../../components/table';

const BUTTON_STYLES = {
  height: '24px !important',
  fontSize: '13px',
  fontWeight: 600,
};

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
    disable: true,
  },
];

export const ProjectResources = ({
  projectID,
  accountID,
  projectFiscalYear,
}: {
  projectID?: string;
  accountID?: string;
  projectFiscalYear?: number;
}) => {
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [
    projectsTabs,
    // setProjectsTabs
  ] = useState(projectTabs);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean>
  >({});
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [sortField, setSortField] = useState<string>('project_code');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [projectResData, setProjectResData] =
    useState<ProjectResourcesListType | null>(null);
  const [showProjectResourceDetails, setShowProjectResourceDetails] =
    useState<boolean>(false);
  // const [filterStates, setFilterStates] = useState<Record<string, FilterState>>(
  //   {}
  // );
  // const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [filterVisibility, setFilterVisibility] = useState<boolean>(true);
  const [searchParams] = useSearchParams();
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );

  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  const navigate = useNavigate();
  const [refreshProjectsTrigger, setRefreshProjectsTrigger] = useState<number>(
    Date.now()
  );
  const { data, isLoading, error } = useProjectResources(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      fiscalYear: convertedFiscalYear,
      accountNumber: accountID,
      projectid: projectID,
    },
    undefined,
    refreshProjectsTrigger
  );
  // const detailsResourceId = searchParams.get('pro_res_id');

  const {
    data: resourceDetails,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useProjectResourceDetail(
    projectResData?.account_rid as string,
    projectResData?.rid as string
  );
  const resourceData = resourceDetails?.data?.projectResource;

  const totalItems = data?.count || 0;

  const handleProjectResourceDetailEdit = () => {
    if (resourceData) {
      const path = PROJECT_RESOURCE_EDIT.replace(
        ':resourceId',
        resourceData.rid
      );
      const queryParams = new URLSearchParams({
        account_Id: resourceData.account_rid,
        project_Id: resourceData.project_rid,
      });
      navigate(`${path}?${queryParams.toString()}`);
    }
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

  useEffect(() => {
    // update sub tab when refereshing the page
    const page = searchParams.get('page');
    if (page) {
      setShowProjectResourceDetails(true);
    }
  }, [searchParams]);

  const actionMenuItems = [
    {
      label: 'Edit',
      onClick: (row: ProjectResourcesListType) =>
        handleEditProjectResource(row),
    },
  ];

  const headerButtonsEdit = [
    {
      label: 'Edit',
      variant: 'outlined' as const,
      onClick: () => handleProjectResourceDetailEdit(),
      sx: { ...BUTTON_STYLES, width: '48px', minWidth: '48px' },
    },
  ];
  const headerButtonsCreate = [
    {
      label: 'New',
      variant: 'outlined' as const,
      onClick: () => handleCreateProjectResource(),
      sx: { ...BUTTON_STYLES, width: '48px', minWidth: '48px' },
    },
  ];
  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleBackClick = () => {
    setShowProjectResourceDetails(!showProjectResourceDetails);
    setProjectResData(null);
    setShowFilter(false);
    // clear query params
    searchParams.delete('pro_res_id');
    searchParams.delete('page');
    navigate({
      pathname: location.pathname,
      search: searchParams.toString(),
    });
    setFilterVisibility(true);
  };

  const handleCreateProjectResource = () => {
    const account_Id = accountID ?? ''; // fallback to empty string
    const project_Id = projectID ?? '';
    const PFY = String(projectFiscalYear);
    const queryParams = new URLSearchParams({
      account_Id,
      project_Id,
      PFY,
      source: 'createAccount',
    });
    navigate(`${PROJECT_RESOURCE_CREATE}?${queryParams.toString()}`);
  };

  const handleEditProjectResource = (row: ProjectResourcesListType) => {
    const path = row?.rid
      ? PROJECT_RESOURCE_EDIT.replace(':resourceId', row.rid)
      : PROJECT_RESOURCE_EDIT;
    const queryParams = new URLSearchParams({
      account_Id: row?.account_rid || '',
      project_Id: row?.project_rid || '',
    });
    navigate(`${path}?${queryParams.toString()}`);
  };
  const handleProjectResourceClick = (row: ProjectResourcesListType) => {
    searchParams.set('page', 'details');
    searchParams.set('pro_res_id', row?.rid ?? '');
    navigate({ search: searchParams.toString() });
    setProjectResData(row);
    setShowProjectResourceDetails(true);
    setShowFilter(false);
    setFilterVisibility(false);
  };

  const projectResourcesColumns = getProjectResourcesColumns(
    handleProjectResourceClick
  );
  const onRefreshClick = () => {
    setRefreshProjectsTrigger(Date.now());
  };

  return (
    <div className='w-full pt-2 pb-2 pl-2 pr-4'>
      <TabPanel
        value={'project-resources'}
        appliedFilters={appliedFilters}
        setAppliedFilters={(data) => {
          setAppliedFilters(data);
          setShowFilter(false);
        }}
        showFilter={showFilter}
        filterVisibility={filterVisibility}
        handleFilter={handleFilter}
        setCurrentPage={setCurrentPage}
        resourceTab={projectsTabs}
        showRefresh={true}
        onRefreshClick={onRefreshClick}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        keyProjectTask={'ProjectResources'}
        projectResourceAccountID={accountID}
      />
      <>
        <ProjectResourceTableHeader
          value={
            resourceData ? 'project-resource-details' : 'projects-resources'
          }
          title={resourceData ? 'Project Resource' : 'Project Resources'}
          titleIcon={
            resourceData ? <ResourceProfileIcon /> : <CreateResourceIcon />
          }
          count={totalItems}
          showBackArrow={resourceData ? true : false}
          headerButtons={resourceData ? headerButtonsEdit : headerButtonsCreate}
          projectResourceNumber={resourceData?.resource_code}
          onBackClick={handleBackClick}
        />
        <div className='border border-[#CBD6E2]'>
          {showProjectResourceDetails ? (
            <ProjectResourceDetails
              resourceData={resourceDetails?.data?.projectResource || undefined}
              isDetailsLoading={isDetailsLoading}
              detailsError={detailsError}
            />
          ) : (
            <ListTable
              data={data?.projectResources as ProjectResourcesListType[]}
              columns={projectResourcesColumns}
              actionMenuItems={actionMenuItems}
              getRowId={(row: ProjectResourcesListType): string =>
                row.rid || ''
              }
              hoverHighlight={false}
              tableStyle={{
                height: '100%',
                maxHeight: 'calc(100vh - 290px)',
                overflow: 'auto',
              }}
              stickyHeader={true}
              stickyColumnsCount={1}
              actionWidth={60}
              actionDisplayMode='dropdown'
              loading={isLoading}
              error={error ? 'Failed to load projects' : undefined}
              rowsPerPageOptions={[25, 50, 100]}
              rowsPerPage={rowsPerPage}
              currentPage={currentPage ?? 1}
              totalItems={data?.count || 0}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={setRowsPerPage}
              sortBy={sortField}
              sortOrder={sortOrder}
              onSort={handleSorting}
              selectable={true}
              onSelectionChange={(selectedIds: unknown) =>
                console.log('Selected:', selectedIds)
              }
              component='project resources'
            />
          )}
        </div>
      </>
    </div>
  );
};
