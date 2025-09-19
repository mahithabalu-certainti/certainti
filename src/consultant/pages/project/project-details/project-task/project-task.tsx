/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from 'react';
import TabPanel from '../../../account-details-sidebar/components/tab';
import {
  AcceptIcon,
  CreateResourceIcon,
  RejectIcon,
  ResourcesIcon,
} from '../../../../../assets';
import { useSelector } from 'react-redux';
import {
  useProjectTaskDetail,
  useProjectTask,
  useUpdateProjectTaskStatus,
} from '../../../../services/project/project-task-service';
import { PROJECT_TASK, PROJECT_TASK_EDIT } from '../../../../../routes';

import { getProjectTaskColumns } from '../project-task/columns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AllMenus,
  AllModules,
  AllPermissions,
} from '../../../../../common-service';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import {
  ProjectTaskDetailsType,
  ProjectTaskListExportParams,
  ProjectTaskListType,
} from '../../../../types/project-task';
import { RootState } from '../../../../../store/store';
import ProjectTaskDetails from './project-task-details';
import {
  ExportType,
  FormFiscalDateType,
  ProjectResourcesListType,
  SelectOption,
} from '../../../../types';
import {
  CellEditData,
  FieldChangeValue,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import { useToast } from '../../../../../hooks';
import { useMutation } from '@apollo/client';
import { UPDATE_PROJECT_TASK } from '../../../../../api/graphql/queries/project-query';
import { taskClient } from '../../../../../api/graphql/clients/client';
import { useGetProjectResourceCode } from '../../../../services/project-resources/project-resources-form-service';
import { checkPermission } from '../../../../../common-utils';
import { AccessRestricted } from '../../../../../components/account-restricted';
import Uploads from '../../../../../components/Attachments/upload';
import SectionHeader from '../../../../../components/details-section/section-header';

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
  // {
  //   id: AllMenus.TIMESHEETS,
  //   name: 'Timeline',
  //   hide: false,
  //   disable: true,
  // },
];

export const ProjectTask = ({
  projectID,
  accountData,
  projectFiscalDate,
  setExportType,
  setProjectTaskParams,
  projectCode,
  accountOrProjectInActive,
}: {
  projectID?: string;
  accountData?: {
    accountID: string;
    accountName: string;
    accountNumber: string;
  };
  projectFiscalDate?: FormFiscalDateType;
  setExportType?: (type: ExportType) => void;
  setProjectTaskParams: React.Dispatch<
    React.SetStateAction<ProjectTaskListExportParams>
  >;
  projectCode?: string;
  accountOrProjectInActive?: boolean;
}) => {
  const { errorToast } = useToast();
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [projectsTabs] = useState(projectTabs);
  const [, setSortFilterCount] = useState<number>(0);
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean>
  >({});
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('resource_code');
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [, setProjectResData] = useState<ProjectTaskListType | null>(null);
  const [showProjectTaskDetails, setShowProjectTaskDetails] =
    useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const accountID =
    accountData?.accountID || searchParams.get('accountID') || '';
  const currency_rid = searchParams.get('currency_rid') || '';
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  const isModalOpen = Boolean(columnAnchorEl);
  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const navigate = useNavigate();
  const [refreshProjectsTrigger, setRefreshProjectsTrigger] = useState<number>(
    Date.now()
  );
  const [refreshTaskDetailPageTrigger, setRefreshTaskDetailPageTrigger] =
    useState<number>(Date.now());
  const [projectTaskList, setProjectTaskList] = useState<ProjectTaskListType[]>(
    []
  );
  const [updateProjectTaskMutation] = useMutation(UPDATE_PROJECT_TASK, {
    client: taskClient,
  });
  const { modules, permission } = useSelector(
    (state: RootState) => state.permission
  );
  const projectTaskIsEnable = checkPermission(modules, AllModules.PROJECT_TASK);
  const isProjectTaskFieldsEditable = useMemo(
    () =>
      permission
        .find((item) => item.name === AllPermissions.PROJECTS_TASK_VIEW_EDIT)
        ?.fields?.some((field) => field.edit),
    [permission]
  );

  const isAttachmentCreateEnable = checkPermission(
    permission,
    AllPermissions.ATTACHMENT_CREATE
  );
  const isTaskCreateEnable = checkPermission(
    permission,
    AllPermissions.PROJECTS_TASK_CREATE
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

  const { data, isLoading, error, refetch } = useProjectTask(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      accountRid: accountID,
      projectRid: projectID,
    },
    undefined,
    refreshProjectsTrigger
  );
  const taskId = searchParams.get('pro_task_id');
  const taskDetails = searchParams.get('page');
  const checkDetail = taskDetails === 'details' && taskId;
  const source = searchParams.get('source');
  const viewDetails = !!checkDetail;

  const {
    data: resourceDetails,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useProjectTaskDetail(
    taskId || '',
    accountID || '',
    refreshTaskDetailPageTrigger
  );
  const { successToast } = useToast();
  const updateStatusAccept = useUpdateProjectTaskStatus();
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
    if (page === 'details' && taskId) {
      setShowProjectTaskDetails(true);
    } else {
      setShowProjectTaskDetails(false);
    }
  }, [searchParams, taskId]);

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
      hide: !isProjectTaskFieldsEditable,
      disabled: accountOrProjectInActive,
    },
  ];

  const headerButtons = [
    {
      label: 'Add Attachment',
      variant: 'outlined' as const,
      onClick: () => handleOpen(),
      sx: { ...BUTTON_STYLES, width: '120px', minWidth: '48px' },
      hide: !viewDetails || !isAttachmentCreateEnable,
    },
    {
      label: viewDetails ? 'Edit' : 'New',
      variant: 'outlined' as const,
      onClick: () =>
        viewDetails
          ? handleProjectTaskDetailEdit()
          : handleCreateProjectResource(),
      sx: { ...BUTTON_STYLES, width: '48px', minWidth: '48px' },
      hide: viewDetails ? !isProjectTaskFieldsEditable : !isTaskCreateEnable,
      disabled: accountOrProjectInActive,
    },
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { ...BUTTON_STYLES, width: '125px', minWidth: '125px' },
      hide: viewDetails ? true : false,
    },
    {
      label:
        source === 'timesheet' ? 'Back To Timesheet' : 'Back To Project Tasks',
      variant: 'contained' as const,
      onClick: () => handleBackClick(),
      sx: { width: '155px', minWidth: '155px' },
      hide: viewDetails ? false : true,
    },
  ];
  const PFY = projectFiscalDate;
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
        projectCode: projectCode ?? '',
      });
      navigate(`${path}?${queryParams.toString()}`);
    }
  };

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleBackClick = () => {
    if (source === 'timesheet') {
      const timesheetId = searchParams.get('timesheet_id');
      const accountid = searchParams.get('accountID');
      const newSearchParams = new URLSearchParams();
      newSearchParams.set('list', 'timesheet');
      if (timesheetId) newSearchParams.set('timesheet_id', timesheetId);
      newSearchParams.set('tab', 'timesheet_project_task');
      navigate(`/account/details/${accountid}?${newSearchParams.toString()}`);
    } else {
      setShowProjectTaskDetails(!showProjectTaskDetails);
      setProjectResData(null);
      setShowFilter(false);
      searchParams.delete('pro_task_id');
      searchParams.delete('page');
      navigate({
        pathname: location.pathname,
        search: searchParams.toString(),
      });
    }
  };
  useEffect(() => {
    if (setExportType) {
      setExportType('projectTask');
    }
    setProjectTaskParams({
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
    });
  }, [sortField, sortOrder, appliedFilters]);

  const handleCreateProjectResource = () => {
    const account_Id = accountID ?? '';
    const project_Id = projectID ?? '';
    const queryParams = new URLSearchParams({
      account_Id,
      project_Id,
      account_name: accountData?.accountName || '',
      account_number: accountData?.accountNumber || '',
      currency_rid: currency_rid ?? '',
      PFY: JSON.stringify(PFY),
      projectCode: projectCode ?? '',
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
      projectCode: projectCode ?? '',
      source: 'editProjectTask',
    });
    navigate(`${path}?${queryParams.toString()}`);
  };
  const getRowId = (row: ProjectTaskListType) => row.rid;
  const handleProjectTaskClick = (row: ProjectTaskListType) => {
    searchParams.set('page', 'details');
    searchParams.set('pro_task_id', row?.rid ?? '');
    navigate({ search: searchParams.toString() }, { replace: true });
    setProjectResData(row);
    setShowProjectTaskDetails(true);
    setShowFilter(false);
  };
  const convertDates = (pfy: FormFiscalDateType) => {
    const isValidDate = (date?: Date) => {
      return date && !isNaN(new Date(date).getTime());
    };

    return {
      ...pfy,
      endMax: isValidDate(pfy.endMax)
        ? new Date(pfy.endMax as Date).toISOString()
        : null,
      startMax: isValidDate(pfy.startMax)
        ? new Date(pfy.startMax as Date).toISOString()
        : null,
      startMin: isValidDate(pfy.startMin)
        ? new Date(pfy.startMin as Date).toISOString()
        : null,
    };
  };
  const fiscalDate = PFY ? convertDates(PFY) : null;
  let fiscalDatesArg;
  if (fiscalDate) {
    fiscalDatesArg = {
      endMax: fiscalDate.endMax ? new Date(fiscalDate.endMax) : undefined,
      startMax: fiscalDate.startMax ? new Date(fiscalDate.startMax) : undefined,
      startMin: fiscalDate.startMin ? new Date(fiscalDate.startMin) : undefined,
      year: fiscalDate.year,
    };
  }

  const projectTaskColumns = getProjectTaskColumns(
    handleProjectTaskClick,
    memoizedProjectResourceCode,
    permissionMapTaskTableColumn,
    accountOrProjectInActive,
    fiscalDatesArg
  );
  const onRefreshClick = () => {
    setRefreshProjectsTrigger(Date.now());
  };
  const taskDetailPageRefresh = () => {
    setRefreshTaskDetailPageTrigger(Date.now());
  };
  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousProject = [...projectTaskList];

    const selectedProject = projectTaskList.find((pro) => pro.rid === rowId);
    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (acc, item) => {
        acc[item.editId || item.columnId] = item.value;
        return acc;
      },
      {
        rid: rowId,
        account_rid: selectedProject?.account_rid,
        project_fiscal_rid: selectedProject?.project_fiscal_rid,
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
  const filterShow = !searchParams.get('page');
  const RestrictedColumns = [
    {
      id: 'resource_code',
      canHide: false,
      canDrag: false,
    },
  ];

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const modalId = isModalOpen
    ? 'project-resource-list-column-visibility-popover'
    : undefined;

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(Object.fromEntries(projectTaskColumns.map((col) => [col.id, !col.hide])));

  const [columnOrder, setColumnOrder] = useState(
    projectTaskColumns.map((col) => col.id)
  );

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  const visibleColumns = columnOrder
    .map((id) => projectTaskColumns.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);
  if (!projectTaskIsEnable) return <AccessRestricted />;
  const handleAccept = (row: ProjectResourcesListType) => {
    const payload = {
      rid: row?.rid || '',
      accountId: accountData?.accountID || '',
      action: 'accept',
      type: row?.status_name || '',
      resourceCode: row?.resource_code,
    };
    updateStatusAccept.mutate(payload, {
      onSuccess: (data) => {
        successToast(data?.statusMessage || 'Status updated successfully');
        refetch();
      },
    });
  };

  const handleReject = (row: ProjectResourcesListType) => {
    const payload = {
      rid: row?.rid || '',
      accountId: accountData?.accountID || '',
      action: 'reject',
      type: row?.status_name || '',
      resourceCode: row?.resource_code,
    };
    updateStatusAccept.mutate(payload, {
      onSuccess: (data) => {
        successToast(data?.statusMessage || 'Status updated successfully');
        refetch();
      },
    });
  };

  const hideStatusAction =
    !permissionMapTaskTableColumn?.['status_action']?.edit &&
    !permissionMapTaskTableColumn?.['status_action']?.read;

  const getConditionMenuItems = (row: ProjectResourcesListType) => {
    let statusLabel = '';
    switch (row.status_name) {
      case 'Duplicate':
        statusLabel = 'Duplicate';
        break;
      case 'Anomaly':
        statusLabel = 'Anomaly';
        break;
      default:
        return [];
    }

    return [
      {
        label: statusLabel ? `Accept ${statusLabel}` : 'Accept',
        onClick: handleAccept,
        icon: AcceptIcon,
        className:
          'inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] cursor-pointer h-[24px] bg-[#3EA72F1A] hover:bg-[#3EA72F] hover:text-[#fff]',
      },
      {
        label: statusLabel ? `Reject ${statusLabel}` : 'Reject',
        onClick: handleReject,
        icon: RejectIcon,
        className:
          'inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] cursor-pointer h-[24px] bg-[#FF3C031A] hover:bg-[#FF3C03] hover:text-[#fff]',
      },
    ];
  };

  return (
    <div className='w-full pt-2 pb-2 pl-2 pr-4'>
      <TabPanel
        value={'project-task'}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        showFilter={showFilter}
        filterVisibility={filterShow}
        handleFilter={handleFilter}
        setCurrentPage={setCurrentPage}
        resourceTab={projectsTabs}
        showRefresh={filterShow}
        onRefreshClick={onRefreshClick}
        handleSorting={handleSorting}
        sortFilterCount={0}
        setSortFilterCount={setSortFilterCount}
        projectResourceAccountID={accountID}
        projectResourceProjectID={projectID}
        permissionMapTaskTableColumn={permissionMapTaskTableColumn}
        fiscalDatesArg={fiscalDatesArg}
      />
      {showUploads ? (
        <Uploads
          accountId={accountID}
          attachID={taskId}
          onUploadSuccess={taskDetailPageRefresh}
        />
      ) : (
        <>
          <SectionHeader
            title={viewDetails ? 'Project Task' : 'Project Tasks'}
            titleIcon={
              viewDetails ? (
                <ResourcesIcon
                  alt='resource header icon'
                  className='[&>path]:stroke-white w-[14px] h-[14px]'
                />
              ) : (
                <CreateResourceIcon />
              )
            }
            count={totalItems}
            showItemCount={!viewDetails}
            buttons={headerButtons}
            subValue={resourceData?.r_number}
            iconBg={viewDetails ? '#7785ff' : ''}
          />
          <div className='border border-[#CBD6E2]'>
            {showProjectTaskDetails ? (
              <ProjectTaskDetails
                projectTaskData={
                  (resourceData as unknown as ProjectTaskDetailsType) ||
                  undefined
                }
                isDetailsLoading={isDetailsLoading}
                detailsError={detailsError}
              />
            ) : (
              <>
                <ManageColumnsPopover
                  anchorEl={columnAnchorEl}
                  open={isModalOpen}
                  popoverId={modalId}
                  onClose={handlePopoverClose}
                  columns={projectTaskColumns}
                  onColumnsChange={handleColumnsChange}
                  columnRestrictions={RestrictedColumns}
                />
                <ListTable
                  data={projectTaskList}
                  columns={visibleColumns}
                  actionMenuItems={actionMenuItems}
                  getRowId={getRowId}
                  hoverHighlight={false}
                  tableStyle={{
                    height: '100%',
                    maxHeight: 'calc(100vh - 360px)',
                    overflow: 'auto',
                  }}
                  stickyHeader={true}
                  stickyColumnsCount={1}
                  actionWidth={60}
                  actionDisplayMode='dropdown'
                  conditionMenuItems={
                    !hideStatusAction
                      ? (row: ProjectResourcesListType) =>
                          getConditionMenuItems(row)
                      : undefined
                  }
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
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
