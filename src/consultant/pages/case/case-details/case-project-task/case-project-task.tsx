/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { AllPermissions } from '../../../../../common-service';
import { ExportType, ProjectResourcesListParams } from '../../../../types';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  useCaseProjectTaskDetail,
  useCaseProjectTaskList,
} from '../../../../services/case-project-task/case-project-task-service';
import { BUTTON_STYLES } from '../../../../../admin/pages/manage-user-detail/styles';
import { ShowHideTableColumn } from '../../../../../components/table/types';
import { SectionTabPanel } from '../../../../../components';
import { ProjectsIcon } from '../../../../../assets';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import { CaseProjectTaskRow, getCaseProjectTaskColumns } from './columns';
import { caseProjectTaskFilterFields } from './utils';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import ProjectTaskDetails from '../../../project/project-details/project-task/project-task-details';
import { ProjectTaskDetailsType } from '../../../../types/project-task';
import SectionHeader from '../../../../../components/details-section/section-header';

const CasesProjectTaskTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
];

interface projectTaskProps {
  setExportType?: (type: ExportType) => void;
  // setAttachmentParams?: React.Dispatch<
  //   React.SetStateAction<AttachmentsListExportParams>
  // >;
  setProjectTaskParams?: React.Dispatch<
    React.SetStateAction<ProjectResourcesListParams>
  >;
  accountInActive?: boolean;
  refetchAccountDetails?: () => void;
}

const CaseProjectTask: React.FC<projectTaskProps> = ({
  setExportType,
  // setProjectTaskParams,
  // accountInActive,
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
  const [sortField, setSortField] = useState<string>('resource_name');
  const [totalItems, setTotalItems] = useState<number>(0);
  const [resourceRowList, setResourceRowList] = useState<CaseProjectTaskRow[]>(
    []
  );
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
    setExportType?.('projectTask');
    if (data?.count) {
      setTotalItems(data?.count || 0);
      setResourceRowList(data.projectTask || []);
    } else {
      setResourceRowList([]);
    }
  }, [data]);

  const taskId = searchParams.get('caseProjectTask');
  const accountID = searchParams.get('accountID');

  const {
    data: resourceDetails,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useCaseProjectTaskDetail(
    taskId || '',
    accountID || ''
    // refreshTaskDetailPageTrigger
  );
  const resourceData = resourceDetails?.data;
  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  const onRefreshClick = () => {
    setRefreshAttachments(Date.now());
  };

  const handleSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const defaultSortField = 'document_name';
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
      disabled: false,
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
  const handleProjectDetails = (data: CaseProjectTaskRow) => {
    // Create new search params without assignProject
    const newParams = new URLSearchParams(searchParams);
    newParams.set('caseProjectTask', data.rid);

    navigate({ search: newParams.toString() }, { replace: true });
  };

  const projectTaskFilterFields = caseProjectTaskFilterFields();

  const getRowId = (row: CaseProjectTaskRow) => row.rid;

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
    permissionMapTaskTableColumn,
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
      <SectionTabPanel
        tabs={CasesProjectTaskTabs}
        filterMenu={projectTaskFilterFields}
        filterVisibility={taskId ? false : true}
        showFilter={showFilter}
        contextKey='case-projectTask-list'
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        setCurrentPage={setCurrentPage}
        handleFilter={handleFilter}
        handleSorting={handleSorting}
        sortFilterCount={sortFilterCount}
        setSortFilterCount={setSortFilterCount}
        showRefresh={taskId ? false : true}
        onRefreshClick={onRefreshClick}
        showSearch={taskId ? false : true}
        onSearch={(text) => setSearchText(text)}
      />

      <>
        {/* <ResourceTableHeader
          value={'projectTask'}
          title='Case Project Task'
          count={taskId ? undefined : totalItems}
          titleIcon={
            <ProjectsIcon
              alt='attachment-header-icon'
              className='[&>path]:stroke-[#4B9BFF]'
            />
          }
          headerButtons={headerButtons}
          iconBg='#D8E9FF'
          bgType='circle'
        /> */}
        <SectionHeader
          title={taskId ? 'Case Project Task Details' : 'Case Project Task '}
          titleIcon={
            <ProjectsIcon
              alt='attachment-header-icon'
              className='[&>path]:stroke-[#4B9BFF]'
            />
          }
          count={totalItems}
          showItemCount={taskId ? false : true}
          buttons={headerButtons.map((btn) => ({
            ...btn,
            hide: Boolean(btn.hide),
          }))}
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
                columns={visibleColumns}
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
