/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { AllPermissions } from '../../../../../common-service';
import {
  ActivityDropdownItem,
  ColorCode,
  ExportType,
  ProjectResourcesListParams,
} from '../../../../types';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  useCaseProjectTaskDetail,
  useCaseProjectTaskList,
} from '../../../../services/case-project-task/case-project-task-service';
import { BUTTON_STYLES } from '../../../../../admin/pages/manage-user-detail/styles';
import { ShowHideTableColumn } from '../../../../../components/table/types';
import { ProjectTaskIcon } from '../../../../../assets';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { getCaseProjectTaskColumns } from './columns';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import ProjectTaskDetails from '../../../project/project-details/project-task/project-task-details';
import { ProjectTaskDetailsType } from '../../../../types/project-task';
import SectionHeader from '../../../../../components/details-section/section-header';
import TabPanel from '../../../account-details-sidebar/components/tab';
import { ProjectTasksListType } from '../../../../types/project-tasks';

const CasesProjectTaskTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
];

interface projectTaskProps {
  accountInActive?: boolean;
  setProjectTaskParams?: React.Dispatch<
    React.SetStateAction<ProjectResourcesListParams>
  >;
  setExportType?: (type: ExportType) => void;
  refetchAccountDetails?: () => void;
  activityMenuItems: ActivityDropdownItem[];
}

const CaseProjectTask: React.FC<projectTaskProps> = ({
  accountInActive,
  setProjectTaskParams,
  setExportType,
  activityMenuItems,
  // refetchAccountDetails,
}) => {
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID');
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [refreshAttachments, setRefreshAttachments] = useState<number>(
    Date.now()
  );
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortField, setSortField] = useState<string>('resource_code');
  const [totalItems, setTotalItems] = useState<number>(0);
  const [resourceRowList, setResourceRowList] = useState<
    ProjectTasksListType[]
  >([]);
  const [sortFilterCount, setSortFilterCount] = useState<number>(0);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const isModalOpen = Boolean(columnAnchorEl);
  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const { data, isLoading, isError } = useCaseProjectTaskList(
    {
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: sortField,
      sortOrder: sortOrder,
      filters: appliedFilters,
      accountRid: accountId || '',
      case_rid: caseId || '',
      search: searchText,
    },
    refreshAttachments
  );

  useEffect(() => {
    if (data) {
      setTotalItems(data?.count);
      setResourceRowList(data?.tasks || []);
    }
    if (setExportType) {
      setExportType('projectTask');
    }
    setProjectTaskParams?.({
      page: currentPage + 1,
      limit: rowsPerPage,
      sortOrder: sortOrder,
      sortBy: sortField,
      search: searchText,
      filters: appliedFilters,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sortField,
    sortOrder,
    searchText,
    rowsPerPage,
    currentPage,
    caseId,
    data?.count,
    setExportType,
    appliedFilters,
  ]);

  const taskId = searchParams.get('caseProjectTask');
  const accountID = searchParams.get('accountID');

  const {
    data: resourceDetails,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useCaseProjectTaskDetail(taskId || '', accountID || '');
  const resourceData = resourceDetails?.data;
  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const onRefreshClick = () => {
    setRefreshAttachments(Date.now());
  };

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
  const updateSearchParams = (callback: (params: URLSearchParams) => void) => {
    const newParams = new URLSearchParams(searchParams);
    callback(newParams);
    navigate({ search: newParams.toString() }, { replace: true });
  };

  const handleBackToCaseProjectTask = () => {
    updateSearchParams((params) => {
      params.delete('caseProjectTask');
    });
  };
  const headerButtons = [
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: accountInActive,
      onClick: handleColumnVisibility,
      sx: { ...BUTTON_STYLES, width: '125px', minWidth: '125px' },
      hide: taskId ? true : false,
    },
    {
      label: 'Back To Case Project Task',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleBackToCaseProjectTask,
      sx: { ...BUTTON_STYLES, width: '190px', minWidth: '19s0px' },
      hide: taskId ? false : true,
    },
  ];

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(1);
  };
  const handleSortRequest = (property: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setSortOrder(apiOrder);
    setSortField(property);
  };
  const { permission } = useSelector((state: RootState) => state.permission);
  const projectTaskViewEditFields = useMemo(
    () =>
      permission.find(
        (item) => item.name === AllPermissions.PROJECTS_TASK_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMapProjectTaskTableColumn = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectTaskViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectTaskViewEditFields]);
  const projectViewEditFields = useMemo(
    () =>
      permission.find((item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT)
        ?.fields ?? [],
    [permission]
  );
  const permissionMapProjectTableColumn = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectViewEditFields]);
  const handleProjectDetails = (data: ProjectTasksListType) => {
    // Create new search params without assignProject
    const newParams = new URLSearchParams(searchParams);
    newParams.set('caseProjectTask', data.rid);

    navigate({ search: newParams.toString() }, { replace: true });
  };
  const getRowId = (row: ProjectTasksListType) => row.rid;

  const RestrictedColumns = [
    {
      id: 'project_code',
      canHide: false,
      canDrag: false,
    },
  ];

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };
  const caseProjectTaskColumn = getCaseProjectTaskColumns(
    permissionMapProjectTaskTableColumn,
    permissionMapProjectTableColumn,
    handleProjectDetails
  );
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(
    Object.fromEntries(caseProjectTaskColumn.map((col) => [col.id, !col.hide]))
  );
  const [columnOrder, setColumnOrder] = useState(
    caseProjectTaskColumn.map((col) => col.id)
  );
  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };
  const visibleColumns = columnOrder
    .map((id) => caseProjectTaskColumn.find((col) => col.id === id)!)
    .filter((col) => columnVisibility[col.id]);
  const modalId = isModalOpen
    ? 'case-projectTask-list-column-visibility-popover'
    : undefined;

  return (
    <div className='w-full pt-2 pl-2 pr-4'>
      <TabPanel
        value={'case-project-task'}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        showFilter={showFilter}
        filterVisibility={taskId ? false : true}
        handleFilter={handleFilter}
        setCurrentPage={setCurrentPage}
        resourceTab={CasesProjectTaskTabs}
        showRefresh={taskId ? false : true}
        onRefreshClick={onRefreshClick}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        permissionMapTaskTableColumn={permissionMapProjectTaskTableColumn}
        permissionMapCaseProjectTableColumn={permissionMapProjectTableColumn}
        // fiscalDatesArg={fiscalDatesArg}
        showSearch={taskId ? false : true}
        onSearch={(text) => setSearchText(text)}
        showAddActivity={true}
        activityMenuItems={activityMenuItems}
      />
      <>
        <SectionHeader
          title={taskId ? 'Case Project Task Details' : 'Case Project Task '}
          titleIcon={
            <ProjectTaskIcon
              alt='attachment-header-icon'
              // className='[&>path]:stroke-[#4B9BFF]'
              className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
            />
          }
          count={totalItems}
          showItemCount={taskId ? false : true}
          buttons={headerButtons.map((btn) => ({
            ...btn,
            hide: Boolean(btn.hide),
          }))}
          iconBg={ColorCode.caseBgColor}
          bgType='circle'
        />
        <div className='border border-[#CBD6E2]'>
          {taskId ? (
            <ProjectTaskDetails
              projectTaskData={
                (resourceData as unknown as ProjectTaskDetailsType) || undefined
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
                columns={caseProjectTaskColumn}
                onColumnsChange={handleColumnsChange}
                columnRestrictions={RestrictedColumns}
              />
              <ListTable
                data={resourceRowList}
                columns={visibleColumns}
                getRowId={getRowId}
                hoverHighlight={false}
                tableStyle={{
                  borderBottom: '1px solid #CBD6E2',
                  height: '100%',
                  maxHeight: 'calc(100vh - 320px)',
                  overflow: 'auto',
                }}
                stickyHeader={true}
                stickyColumnsCount={1}
                selectable={false}
                actionWidth={80}
                actionDisplayMode='dropdown'
                actionMenuItems={[]}
                loading={isLoading}
                error={isError ? 'Failed to load Attachment data' : undefined}
                rowsPerPageOptions={[25, 50, 100]}
                rowsPerPage={rowsPerPage}
                currentPage={currentPage}
                totalItems={totalItems}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                sortBy={sortField}
                sortOrder={sortOrder}
                onSort={handleSortRequest}
              />
            </>
          )}
        </div>
      </>
    </div>
  );
};

export default CaseProjectTask;
