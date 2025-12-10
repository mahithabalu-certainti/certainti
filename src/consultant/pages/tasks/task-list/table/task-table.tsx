import { useSelector } from 'react-redux';
import { TaskList, TasksListURLParams } from '../../../../types/task';
import { RootState } from '../../../../../store/store';
import { useAllTasksList } from '../../../../services/tasks/tasks-service';
import { useMutation } from '@apollo/client';
import { taskClient } from '../../../../../api/graphql/clients/client';
import { UPDATE_TASK_SUMMARY_INLINE } from '../../../../../api/graphql/queries/task-query';
import {
  CellEditData,
  FieldChangeValue,
  ActionItem,
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../../components/table/types';
import {
  ListTable,
  ManageColumnsPopover,
} from '../../../../../components/table';
import {
  // checkPermission,
  reshapeGlobalFilter,
} from '../../../../../common-utils';
import { FilterState, SelectOption } from '../../../../types';
import { useToast } from '../../../../../hooks';
// import { AllPermissions } from '../../../../../common-service';
import { getTaskTableColumns } from './columns';
import { EditIcon } from '../../../../../assets';
import TaskDetailModal from '../../../../../components/kanban-board/task-detail-modal';
import {
  useGetTaskPriorities,
  useGetTaskStatuses,
} from '../../../../services/work-breakdown/work-breakdown-service';
import {
  useGetRoleOptions,
  useGetTagOptions,
  useGetCaseTeamMembersDropdown,
} from '../../../../services/case-team/case-team-service';
import { useGetTaskCheckListTypes } from '../../../../../admin/service/task-template/task-template-service';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback, useEffect, useState } from 'react';
import {
  transformPriorityData,
  transformStatusData,
  transformTagData,
} from '../../../case/case-details/work-breakdown/helper';
import { AllPermissions } from '../../../../../common-service';
import { getPermissionMap } from '../../../activities/activities-list/helper';

interface ITaskTableProps {
  appliedFilters: Record<string, string | number | boolean>;
  tableParams: TasksListURLParams;
  setTableParams: React.Dispatch<React.SetStateAction<TasksListURLParams>>;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  refreshTrigger?: number;
  fieldOptions: any;
  setCurrentCategory: (rowId: string) => void;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue?: string;
  fixedFilters?: Record<string, any>;
}

export const TaskTable: React.FC<ITaskTableProps> = ({
  appliedFilters,
  tableParams,
  setTableParams,
  setTotalCount,
  refreshTrigger,
  setColumnAnchorEl,
  columnAnchorEl,
  searchValue,
  fixedFilters,
}) => {
  const { errorToast } = useToast();
  const { fiscalYear, filters } = useSelector<
    RootState,
    { filters: unknown; fiscalYear: string }
  >((state: RootState) => state.account);
  const [taskList, setTaskList] = useState<TaskList[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskList | null>(null);
  const queryClient = useQueryClient();

  const [updateTaskSummaryInline] = useMutation(UPDATE_TASK_SUMMARY_INLINE, {
    client: taskClient,
  });

  // Hooks for Milestone (Case Task) details
  const isMilestone = selectedTask?.attachment_level === 'milestone';
  const caseId = selectedTask?.case_rid || '';
  const accountId = selectedTask?.account_rid || '';

  const prioritiesQuery = useGetTaskPriorities();
  const statusesQuery = useGetTaskStatuses();
  const checklistQuery = useGetTaskCheckListTypes();
  const roleOptionsQuery = useGetRoleOptions();

  const caseTeamMembersQuery = useGetCaseTeamMembersDropdown(
    accountId,
    caseId,
    !!accountId && !!caseId && isMilestone
  );

  const tagOptionsQuery = useGetTagOptions(
    {
      task_rid: selectedTask?.task_rid || '',
      account_rid: accountId,
      case_rid: caseId,
      action: 'update',
    },
    !!selectedTask && isMilestone
  );

  // Transform data
  const priorityData = useMemo(
    () => transformPriorityData(prioritiesQuery.data || []),
    [prioritiesQuery.data]
  );

  const statusData = useMemo(
    () => transformStatusData(statusesQuery.data || []),
    [statusesQuery.data]
  );

  const statusOptions: SelectOption[] = useMemo(
    () =>
      statusData.map((value) => ({
        label: value.name,
        value: value.id,
      })),
    [statusData]
  );

  const tagData = useMemo(
    () => transformTagData(tagOptionsQuery.data || []),
    [tagOptionsQuery.data]
  );

  const checklistData = useMemo(() => {
    if (checklistQuery.data?.data && Array.isArray(checklistQuery.data.data)) {
      return checklistQuery.data.data.map(
        (checklist: { rid: string; checklist_name: string }) => ({
          id: checklist.rid,
          name: checklist.checklist_name,
        })
      );
    }
    return [];
  }, [checklistQuery.data]);

  const userData = useMemo(() => {
    if (caseTeamMembersQuery.data && Array.isArray(caseTeamMembersQuery.data)) {
      return caseTeamMembersQuery.data.map((member) => ({
        rid: member.user_rid,
        name: member.user_name,
      }));
    }
    return [];
  }, [caseTeamMembersQuery.data]);

  const handleTaskUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['allTasksList'] });
  };

  const { permission } = useSelector((state: RootState) => state.permission);
  const newFiscalYear = fiscalYear !== 'FY-All' ? Number(fiscalYear) : 0;

  // Permission Map for Activity Tasks
  const taskPermissionMap = useMemo(
    () => getPermissionMap(permission, AllPermissions.ACTIVITY_TASK_VIEW_EDIT),
    [permission]
  );

  const fieldHiddenMap = useMemo(() => {
    if (!selectedTask) return {};
    const entityLevel = selectedTask.attachment_level?.toLowerCase();
    const isActivity = ['account', 'project', 'case'].includes(entityLevel);

    if (isActivity) {
      return {
        taskName:
          !taskPermissionMap['task_name']?.read &&
          !taskPermissionMap['task_name']?.edit,
        status:
          !taskPermissionMap['status_rid']?.read &&
          !taskPermissionMap['status_rid']?.edit,
        priority:
          !taskPermissionMap['priority_rid']?.read &&
          !taskPermissionMap['priority_rid']?.edit,
        assignee:
          !taskPermissionMap['assigned_to']?.read &&
          !taskPermissionMap['assigned_to']?.edit,
        startDate:
          !taskPermissionMap['effective_start_datetime']?.read &&
          !taskPermissionMap['effective_start_datetime']?.edit,
        endDate:
          !taskPermissionMap['effective_end_datetime']?.read &&
          !taskPermissionMap['effective_end_datetime']?.edit,
        description:
          !taskPermissionMap['description']?.read &&
          !taskPermissionMap['description']?.edit,
        checklistTemplate:
          !taskPermissionMap['checklists']?.read &&
          !taskPermissionMap['checklists']?.edit,
        checklist:
          !taskPermissionMap['checklists']?.read &&
          !taskPermissionMap['checklists']?.edit,
        tags:
          !taskPermissionMap['tags']?.read && !taskPermissionMap['tags']?.edit,
        weightage: true,
        category: true,
        linkedType: true,
        linkTaskType: true,
        attachments:
          !taskPermissionMap['attachments']?.read &&
          !taskPermissionMap['attachments']?.edit,
        comments:
          !taskPermissionMap['comments']?.read &&
          !taskPermissionMap['comments']?.edit,
        collaborators:
          !taskPermissionMap['collaborators']?.read &&
          !taskPermissionMap['collaborators']?.edit,
        fiscalYear:
          entityLevel !== 'account' ||
          (!taskPermissionMap['fiscal_year']?.read &&
            !taskPermissionMap['fiscal_year']?.edit),
      };
    }
    return {};
  }, [selectedTask, taskPermissionMap]);

  const fieldDisabledMap = useMemo(() => {
    if (!selectedTask) return {};
    const entityLevel = selectedTask.attachment_level?.toLowerCase();
    const isActivity = ['account', 'project', 'case'].includes(entityLevel);

    if (isActivity) {
      return {
        taskName: !taskPermissionMap['task_name']?.edit,
        status: !taskPermissionMap['status_rid']?.edit,
        priority: !taskPermissionMap['priority_rid']?.edit,
        assignee: !taskPermissionMap['assigned_to']?.edit,
        startDate: !taskPermissionMap['effective_start_datetime']?.edit,
        endDate: !taskPermissionMap['effective_end_datetime']?.edit,
        description: !taskPermissionMap['description']?.edit,
        checklistTemplate: !taskPermissionMap['checklists']?.edit,
        checklist: !taskPermissionMap['checklists']?.edit,
        tags: !taskPermissionMap['tags']?.edit,
        attachments: !taskPermissionMap['attachments']?.edit,
        comments: !taskPermissionMap['comments']?.edit,
        collaborators: !taskPermissionMap['collaborators']?.edit,
        fiscalYear: !taskPermissionMap['fiscal_year']?.edit,
      };
    }
    return {};
  }, [selectedTask, taskPermissionMap]);

  const { data, isLoading, isError } = useAllTasksList(
    {
      ...tableParams,
      filters: { ...appliedFilters, ...fixedFilters },
      globalFilters: reshapeGlobalFilter(filters as FilterState),
      search: searchValue,
      fiscalYear: newFiscalYear,
    },
    refreshTrigger
  );
  const totalItems = data?.data?.count || data?.data?.totalCount || 0;

  useEffect(() => {
    if (data?.data) {
      setTotalCount(data.data.count || data.data.totalCount || 0);
      setTaskList(data.data.tasks || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setTableParams((prev) => ({
      ...prev,
      sortBy,
      sortOrder: apiOrder,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setTableParams((prev) => ({
      ...prev,
      page: newPage + 1,
    }));
  };

  const handleRowsPerPageChange = (newLimit: number) => {
    setTableParams((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }));
  };

  // Permissions
  // const taskViewEditFields = useMemo(
  //   () =>
  //     permission?.find(
  //       (item) => item.name === AllPermissions.ATTACHMENT_VIEW_EDIT
  //     )?.fields ?? [],
  //   [permission]
  // );

  // const isTaskExportEnable = checkPermission(
  //   permission,
  //   AllPermissions.ATTACHMENT_EXPORT
  // );

  // const permissionMap = useMemo(() => {
  //   const map: Record<string, { read: boolean; edit: boolean }> = {};
  //   taskViewEditFields.forEach((item) => {
  //     map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
  //   });
  //   return map;
  // }, [taskViewEditFields]);

  const getRowId = (row: TaskList) => row.task_rid;

  const handleTaskClick = useCallback((row: TaskList) => {
    console.log('Task clicked:', row);
    console.log('Attachment Level:', row.attachment_level);
    setSelectedTask(row);
  }, []);

  const tasksColumns = useMemo(
    () => getTaskTableColumns(handleTaskClick, statusOptions),
    [handleTaskClick, statusOptions]
  );

  const actionButtons: ActionItem<TaskList>[] = [
    {
      label: 'Edit',
      onClick: (row: TaskList) => console.log('Edit clicked:', row),
      icon: EditIcon,
      hide: false,
      iconStyle: {
        filter:
          'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
      },
    },
  ];

  const [visibleColumns, setVisibleColumns] = useState<
    ListTableColumn<TaskList>[]
  >(tasksColumns.filter((col) => !col.hide));

  // Sync visibleColumns with tasksColumns to ensure click handlers are up to date
  useEffect(() => {
    setVisibleColumns((prev) => {
      return tasksColumns.map((col) => {
        const prevCol = prev.find((p) => p.id === col.id);
        return prevCol ? { ...col, hide: prevCol.hide } : col;
      });
    });
  }, [tasksColumns]);

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    setVisibleColumns(
      updatedColumns.filter((col) => !col.hide) as ListTableColumn<TaskList>[]
    );
  };

  const handlePopoverClose = () => {
    setColumnAnchorEl(null);
  };

  const RestrictedColumns = [
    {
      id: 'r_number',
      canHide: false,
      canDrag: false,
    },
  ];

  const isModalOpen = Boolean(columnAnchorEl);
  const modalId = isModalOpen ? 'task-column-visibility-popover' : undefined;

  const handleCellEdit = async (rowId: string, updates: CellEditData[]) => {
    const previousTaskList = [...taskList];
    const selectedTask = taskList.find((task) => task.task_rid === rowId);

    const updateData = updates.reduce<Record<string, FieldChangeValue>>(
      (acc, item) => {
        acc[item.editId || item.columnId] = item.value;
        return acc;
      },
      {
        rid: selectedTask?.rid,
        account_rid: selectedTask?.account_rid,
        task_rid: selectedTask?.task_rid,
        attachment_level: selectedTask?.attachment_level,
      }
    );

    try {
      const res = await updateTaskSummaryInline({
        variables: { data: updateData },
      });

      const result = res.data?.updateTaskSummaryInline;

      if (result?.statusCode === 200 && result.data) {
        const updatedTask = result.data;
        const newTaskList = taskList.map((task) => {
          if (task.task_rid === updatedTask.task_rid) {
            return updatedTask;
          }
          return task;
        });
        setTaskList(newTaskList);
      } else {
        errorToast(result?.statusMessage || 'Failed to update task');
        setTaskList(previousTaskList);
      }
    } catch (error) {
      errorToast((error as Error)?.message || 'Failed to update task');
      setTaskList(previousTaskList);
    }
  };

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={tasksColumns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />
      <ListTable
        data={taskList || []}
        columns={visibleColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 180px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={1}
        selectable={true}
        onSelectionChange={(selectedIds) =>
          console.log('Selected:', selectedIds)
        }
        actionWidth={60}
        actionDisplayMode='dropdown'
        actionMenuItems={actionButtons}
        loading={isLoading}
        error={isError ? 'Failed to load Tasks data' : undefined}
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={tableParams.limit}
        currentPage={(tableParams.page ?? 1) - 1}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortBy={tableParams.sortBy}
        sortOrder={tableParams.sortOrder}
        onSort={handleSort}
        onCellEdit={handleCellEdit}
      />
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask.task_rid}
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          accountId={selectedTask.account_rid}
          caseId={selectedTask.case_rid || ''}
          onTaskUpdate={handleTaskUpdate}
          statusData={statusData}
          priorityData={priorityData}
          tagData={tagData}
          availableUsers={userData}
          roleOptions={roleOptionsQuery.data || []}
          checklistData={checklistData}
          taskType={
            ['account', 'project', 'case'].includes(
              selectedTask.attachment_level?.toLowerCase()
            )
              ? 'activity'
              : undefined
          }
          // For now, we are using the basic modal which should work for viewing/editing
          // common fields.
          fieldVisibility={fieldHiddenMap}
          fieldDisabled={fieldDisabledMap}
        />
      )}
    </>
  );
};
