/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import TabPanel from '../../../account-details-sidebar/components/tab';
import { CreateResourceIcon, ResourceProfileIcon } from '../../../../../assets';
import { useSelector } from 'react-redux';
import {
  useProjectTaskDetail,
  useProjectTask,
} from '../../../../services/project/project-task-service';
import {
  PROJECT_TASK,
  // PROJECT_TASK_CREATE,
  // PROJECT_TASK_EDIT,
} from '../../../../../routes';

import { getProjectTaskColumns } from '../project-task/columns';
import { useNavigate, useSearchParams } from 'react-router-dom';
// import { resetFilter } from '../../../account-details-sidebar/components/filter/utils';
import { AllMenus, AllPermissions } from '../../../../../common-service';
import { ListTable } from '../../../../../components/table';
import { ProjectTaskListType } from '../../../../types/project-task';
import { RootState } from '../../../../../store/store';
import ProjectTaskTableHeader from './project-task-header';
import ProjectTaskDetails from './project-task-details';

const BUTTON_STYLES = {
  height: '24px !important',
  fontSize: '13px',
  fontWeight: 600,
};

export interface ProjectsTabs {
  id: AllPermissions | AllMenus;
  name: string;
  hide: boolean;
  disable?: boolean;
}
const projectTabs: ProjectsTabs[] = [
  {
    id: AllPermissions.PROJECTS_TASK_VIEW_EDIT,
    name: 'Overview',
    hide: false,
  },
  {
    id: AllMenus.TIMESHEETS,
    name: 'Timeline',
    hide: false,
    disable: true,
  },
];

export const ProjectTask = ({
  projectID,
  accountID,
}: {
  projectID?: string;
  accountID?: string;
}) => {
  console.log('projectID', projectID, accountID);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [
    projectsTabs,
    // setProjectsTabs
  ] = useState(projectTabs);
  const [
    ,
    // sortFilterCount
    setSortFilterCount,
  ] = useState<number>(0);
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean>
  >({});
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [sortField, setSortField] = useState<string>('created_datetime');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [, setProjectResData] = useState<ProjectTaskListType | null>(null);
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
  const accountRID = 'D001-1b18d36d-5c6f-45d6-8bd3-bd1b12d7bffc';
  const projectRID = 'D001-cda74b9d-08b1-4f7c-9b7e-36224206a40e';
  const { data, isLoading, error } = useProjectTask(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      fiscalYear: convertedFiscalYear,
      accountRid: accountRID,
      projectRid: projectRID,
    },
    undefined,
    refreshProjectsTrigger
  );
  const taskId = searchParams.get('pro_task_id');
  const accountId = searchParams.get('pro_acc_id');

  // get project resource detail
  // project resource details
  const {
    data: resourceDetails,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useProjectTaskDetail(taskId || '', accountId || '');

  const totalItems = data?.count || 0;

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

  const resourceData = resourceDetails?.data?.projectResourceDetails;
  const actionMenuItems = [
    {
      label: 'Edit',
      onClick: (row: any) => handleEditProjectResource(row),
    },
  ];

  const headerButtonsEdit = [
    {
      label: 'Edit',
      variant: 'outlined' as const,
      onClick: (row: any) => handleEditProjectResource(row),
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
    searchParams.delete('pro_task_id');
    searchParams.delete('page');
    navigate({
      pathname: location.pathname,
      search: searchParams.toString(),
    });
    setFilterVisibility(true);
    //   resetFilter(
    //       {
    //   setAppliedFilters,
    //   setFilterStates,
    //   setSelectedFilters,
    //       }
    //   );
  };

  const handleCreateProjectResource = () => {
    navigate({
      pathname: `${PROJECT_TASK}/create`,
    });
  };

  const handleEditProjectResource = (row: any) => {
    navigate({
      pathname: `${PROJECT_TASK}/edit/${row?.rid}`,
    });
  };
  const getRowId = (row: any) => row.project_rid;
  const handleProjectTaskClick = (row: any) => {
    searchParams.set('page', 'details');
    searchParams.set('pro_task_id', row?.rid ?? '');
    searchParams.set('pro_acc_id', row?.account_rid ?? '');
    navigate({ search: searchParams.toString() });
    setProjectResData(row);
    setShowProjectResourceDetails(true);
    setShowFilter(false);
    setFilterVisibility(false);
  };

  const projectTaskColumns = getProjectTaskColumns(handleProjectTaskClick);
  const onRefreshClick = () => {
    setRefreshProjectsTrigger(Date.now());
  };

  return (
    <div className='w-full pt-2 pb-2 pl-2 pr-4'>
      <TabPanel
        value={'project-task'}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        showFilter={showFilter}
        filterVisibility={filterVisibility}
        handleFilter={handleFilter}
        setCurrentPage={setCurrentPage}
        resourceTab={projectsTabs}
        showRefresh={true}
        onRefreshClick={onRefreshClick}
        handleSorting={handleSorting}
        sortFilterCount={0}
        setSortFilterCount={setSortFilterCount}
        keyProjectTask={'ProjectTask'}
      />
      <>
        <ProjectTaskTableHeader
          value={resourceData ? 'project-task-details' : 'projects-task'}
          title={resourceData ? 'Project Task' : 'Project Task'}
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
            <ProjectTaskDetails
              resourceData={
                resourceDetails?.data?.projectResourceDetails || undefined
              }
              isDetailsLoading={isDetailsLoading}
              detailsError={detailsError}
            />
          ) : (
            <ListTable
              data={data?.projectTask as ProjectTaskListType[]}
              columns={projectTaskColumns}
              actionMenuItems={actionMenuItems}
              getRowId={getRowId}
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
              component='project task'
            />
          )}
        </div>
      </>
    </div>
  );
};
