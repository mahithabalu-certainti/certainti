/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react';
import TabPanel from '../../../account-details-sidebar/components/tab';
import { CreateResourceIcon, ResourceProfileIcon } from '../../../../../assets';
import { useSelector } from 'react-redux';
import {
  useProjectTaskDetail,
  useProjectTask,
} from '../../../../services/project/project-task-service';
import {
  PROJECT_TASK,
  PROJECT_TASK_EDIT,
} from '../../../../../routes';

import { getProjectTaskColumns } from '../project-task/columns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AllMenus, AllModules, AllPermissions } from '../../../../../common-service';
import { ListTable } from '../../../../../components/table';
import { ProjectTaskDetailsType, ProjectTaskListExportParams, ProjectTaskListType } from '../../../../types/project-task';
import { RootState } from '../../../../../store/store';
import ProjectTaskTableHeader from './project-task-header';
import ProjectTaskDetails from './project-task-details';
import { ExportType, SelectOption } from '../../../../types';
import { CellEditData, FieldChangeValue } from '../../../../../components/table/types';
import { useToast } from '../../../../../hooks';
import { useMutation } from '@apollo/client';
import { UPDATE_PROJECT_TASK } from '../../../../../api/graphql/queries/project-query';
import { taskClient } from '../../../../../api/graphql/clients/client';
import { useGetProjectResourceCode } from '../../../../services/project-resources/project-resources-form-service';
import { checkPermission } from '../../../../../common-utils';
import { AccessRestricted } from '../../../../../components/account-restricted';
import Uploads from '../../../../../components/Attachments/upload';
import { FiscalYearType } from '../../../../types/project';

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
  projectFiscalYear,
  setExportType,
  setProjectTaskParams,
}: {
  projectID?: string;
  accountID?: string;
  projectFiscalYear?: FiscalYearType;
  setExportType?: (
    type: ExportType
  ) => void;
  setProjectTaskParams: React.Dispatch<
    React.SetStateAction<ProjectTaskListExportParams>
  >;
}) => {
  const { errorToast, successToast } = useToast();
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [
    projectsTabs,
  ] = useState(projectTabs);
  const [, setSortFilterCount] = useState<number>(0);
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean>
  >({});
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [sortField, setSortField] = useState<string>('resource_code');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [, setProjectResData] = useState<ProjectTaskListType | null>(null);
  const [showProjectResourceDetails, setShowProjectResourceDetails] =
    useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const { fiscalYear } = useSelector<RootState, { fiscalYear: string }>(
    (state: RootState) => state.account
  );
  const convertedFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;
  const navigate = useNavigate();
  const [refreshProjectsTrigger, setRefreshProjectsTrigger] = useState<number>(
    Date.now()
  );
  const [refreshTaskDetailPageTrigger, setRefreshTaskDetailPageTrigger] = useState<number>(
    Date.now()
  );
  const [projectTaskList, setProjectTaskList] = useState<
    ProjectTaskListType[]
  >([]);
  const [updateProjectTaskMutation] = useMutation(UPDATE_PROJECT_TASK, {
    client: taskClient,
  });
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const projectTaskIsEnable = checkPermission(
    modules,
    AllModules.PROJECT_TASK
  );
  const projectViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.PROJECTS_TASK_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMapTaskTableColumn = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);

  const { data, isLoading, error } = useProjectTask(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      fiscalYear: convertedFiscalYear,
      accountRid: accountID,
      projectRid: projectID,
    },
    undefined,
    refreshProjectsTrigger
  );
  const taskId = searchParams.get('pro_task_id');
  const taskDetails = searchParams.get('page');
  const checkDetail = taskDetails === "details";
  const viewDetails = !!checkDetail;

  const {
    data: resourceDetails,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useProjectTaskDetail(taskId || '', accountID || '', refreshTaskDetailPageTrigger);

  const totalItems = data?.count || 0;
  useEffect(() => {
    if (data) {
      setProjectTaskList(data?.projectTask || []);
    }
  }, [data]);

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'resource_code';
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
    const page = searchParams.get('page');
    if (page) {
      setShowProjectResourceDetails(true);
    }
  }, [searchParams]);

  const resourceData = resourceDetails?.data;
  const { data: projectResourceCodeOptions } = useGetProjectResourceCode(
    accountID as string
  );
  const memoizedProjectResourceCode: SelectOption[] = useMemo(
    () =>
      projectResourceCodeOptions?.data?.resourceCodes.map((item) => ({
        label: item.resource_code,
        value: item.resource_code,
      })) || [],
    [projectResourceCodeOptions?.data?.resourceCodes]
  );
  const handleOpen = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('attachment_entity', 'project_task');
    navigate({
      pathname: location.pathname,
      search: newParams.toString(),
    });
  };
  const showUploads = searchParams.get('attachment_entity') === 'project_task';
  const actionMenuItems = [
    {
      label: 'Edit',
      onClick: (row: ProjectTaskListType) => handleEditProjectTask(row),
    },
  ];

  const headerButtonsEdit = [
    {
      label: 'Add Attachment',
      variant: 'outlined' as const,
      onClick: () => handleOpen(),
      sx: { ...BUTTON_STYLES, width: '120px', minWidth: '48px' },
      // hide: value !== 'details' || !attachmentCreateEnable,
      // disabled: accountInActive ? accountInActive : resourceInActive,
    },
    {
      label: 'Edit',
      variant: 'outlined' as const,
      onClick: () => handleProjectTaskDetailEdit(),
      sx: { ...BUTTON_STYLES, width: '48px', minWidth: '48px' },
    },
  ];
  const PFY = projectFiscalYear;
  const handleProjectTaskDetailEdit = () => {
    if (resourceData) {
      const path = resourceData?.rid
        ? PROJECT_TASK_EDIT.replace(':taskId', resourceData.rid)
        : PROJECT_TASK_EDIT;
      const queryParams = new URLSearchParams({
        account_Id: resourceData?.account_rid || '',
        project_Id: resourceData?.project_rid || '',
        PFY: PFY ? JSON.stringify(PFY) : '',
        source: 'editProjectTask',
      });
      navigate(`${path}?${queryParams.toString()}`);
    }
  };
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
    searchParams.delete('pro_task_id');
    searchParams.delete('page');
    navigate({
      pathname: location.pathname,
      search: searchParams.toString(),
    });
  };
  useEffect(() => {
    if (setExportType) {
      setExportType('projectTask');
    }
    setProjectTaskParams({
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      fiscalYear: convertedFiscalYear,
    });
  }, [sortField, sortOrder, appliedFilters, convertedFiscalYear]);

  const handleCreateProjectResource = () => {
    const account_Id = accountID ?? '';
    const project_Id = projectID ?? '';
    const queryParams = new URLSearchParams({
      account_Id,
      project_Id,
      PFY: JSON.stringify(PFY),
      source: 'createProjectTask',
    });
    navigate(`${PROJECT_TASK}/create?${queryParams.toString()}`);
  };

  const handleEditProjectTask = (row: ProjectTaskListType) => {
    const path = row?.rid
      ? PROJECT_TASK_EDIT.replace(':taskId', row.rid)
      : PROJECT_TASK_EDIT;
    const queryParams = new URLSearchParams({
      account_Id: row?.account_rid || '',
      project_Id: row?.project_rid || '',
      PFY: PFY ? JSON.stringify(PFY) : '',
      source: 'editProjectTask',
    });
    navigate(`${path}?${queryParams.toString()}`);
  };
  const getRowId = (row: ProjectTaskListType) => row.rid;
  const handleProjectTaskClick = (row: ProjectTaskListType) => {
    searchParams.set('page', 'details');
    searchParams.set('pro_task_id', row?.rid ?? '');
    navigate({ search: searchParams.toString() });
    setProjectResData(row);
    setShowProjectResourceDetails(true);
    setShowFilter(false);
  };
  const projectTaskColumns = getProjectTaskColumns(
    handleProjectTaskClick,
    memoizedProjectResourceCode,
    permissionMapTaskTableColumn,
  );
  const onRefreshClick = () => {
    setRefreshProjectsTrigger(Date.now());
  };
  const taskDetailPageRefresh = () => {
    setRefreshTaskDetailPageTrigger(Date.now());
  }
  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousProject = [...projectTaskList];

    const selectedProject = projectTaskList.find(
      (pro) => pro.rid === rowId
    );

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (acc, item) => {
        acc[item.editId || item.columnId] = item.value;
        return acc;
      },
      {
        rid: rowId,
        account_rid: selectedProject?.account_rid,
        fiscal_year: selectedProject?.fiscal_year,
      }
    );

    try {
      const res = await updateProjectTaskMutation({
        variables: { data: updateData },
      });

      const result = res.data?.updateProjectTask;

      if (result?.statusCode === 200 && result.data) {
        const updatedParentData = result.data;

        const newProjects = projectTaskList.map((project) => {
          if (project.rid === updatedParentData.rid) {
            return updatedParentData;
          }
          return project;
        });
        successToast(result?.statusMessage);
        setProjectTaskList(newProjects);
      } else {
        errorToast(result?.statusMessage || 'Failed to update filed');
        setProjectTaskList(previousProject);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update filed');
      setProjectTaskList(previousProject);
    }
  };
  const filterShow = !searchParams.get('page')
  if (!projectTaskIsEnable) return <AccessRestricted />;
  return (
    <div className='w-full pt-2 pb-2 pl-2 pr-4'>
      <TabPanel
        value={'project-task'}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        showFilter={showFilter}
        filterVisibility={
          filterShow
        }
        handleFilter={handleFilter}
        setCurrentPage={setCurrentPage}
        resourceTab={projectsTabs}
        showRefresh={filterShow}
        onRefreshClick={onRefreshClick}
        handleSorting={handleSorting}
        sortFilterCount={0}
        setSortFilterCount={setSortFilterCount}
        keyProjectTask={'ProjectTask'}
        projectResourceAccountID={accountID}
        permissionMapTaskTableColumn={permissionMapTaskTableColumn}
      />
      {showUploads ? (
        <Uploads accountId={accountID} attachID={taskId} onUploadSuccess={taskDetailPageRefresh} />
      ) : (
        <>
          <ProjectTaskTableHeader
            value={viewDetails ? 'project-task-details' : 'projects-task'}
            title={viewDetails ? 'Project Task' : 'Project Task'}
            titleIcon={
              viewDetails ? <ResourceProfileIcon /> : <CreateResourceIcon />
            }
            count={totalItems}
            showBackArrow={viewDetails ? true : false}
            headerButtons={viewDetails ? headerButtonsEdit : headerButtonsCreate}
            projectResourceNumber={resourceData?.r_number}
            onBackClick={handleBackClick}
          />
          <div className='border border-[#CBD6E2]'>
            {showProjectResourceDetails ? (
              <ProjectTaskDetails
                projectTaskData={
                  resourceData as unknown as ProjectTaskDetailsType || undefined
                }
                isDetailsLoading={isDetailsLoading}
                detailsError={detailsError}
                permissionMapTaskTableColumn={permissionMapTaskTableColumn}
              />
            ) : (
              <ListTable
                data={projectTaskList}
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
                selectable={false}
                onSelectionChange={(selectedIds: unknown) =>
                  console.log('Selected:', selectedIds)
                }
                component='project task'
                onCellEdit={handleCellEdit}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};
