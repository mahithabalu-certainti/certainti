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
import TaskDetailModal from '../../../../../components/kanban-board/task-detail-modal';
import {
  useGetTaskPriorities,
  useGetTaskStatuses,
  useAddCollaborator,
  AddCollaboratorPayload,
  AddCollaboratorResponse,
} from '../../../../services/work-breakdown/work-breakdown-service';
import {
  useAddTaskComment,
  useUpdateTaskComment,
  useDeleteTaskComment,
} from '../../../../services/case-task/case-task-service';
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
  const { errorToast, successToast } = useToast();
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

  const addCollaboratorMutation = useAddCollaborator();
  const addCommentMutation = useAddTaskComment();
  const updateCommentMutation = useUpdateTaskComment();
  const deleteCommentMutation = useDeleteTaskComment();
  // Hooks for Milestone (Case Task) details
  const isMilestoneTab = fixedFilters?.attachment_level === 'milestone';
  const isCaseTask = selectedTask?.attachment_level === 'case';
  const shouldFetchCaseData = isMilestoneTab || isCaseTask;

  const caseId = isMilestoneTab
    ? selectedTask?.attach_to || ''
    : selectedTask?.case_rid ||
      (isCaseTask ? selectedTask?.attach_to : '') ||
      '';
  const accountId = selectedTask?.account_rid || '';

  const prioritiesQuery = useGetTaskPriorities();
  const statusesQuery = useGetTaskStatuses();
  const checklistQuery = useGetTaskCheckListTypes();
  const roleOptionsQuery = useGetRoleOptions();

  const caseTeamMembersQuery = useGetCaseTeamMembersDropdown(
    accountId,
    caseId,
    !!accountId && !!caseId && shouldFetchCaseData
  );

  const tagOptionsQuery = useGetTagOptions(
    {
      task_rid: selectedTask?.task_rid || '',
      account_rid: accountId,
      case_rid: caseId,
      action: 'update',
    },
    !!selectedTask && shouldFetchCaseData
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

  const handleAddComment = useCallback(
    async (taskId: string, commentText: string, files: File[]) => {
      if (!accountId || !caseId) {
        errorToast('Account ID or Case ID is missing');
        throw new Error('Missing Account ID or Case ID');
      }

      return new Promise<void>((resolve, reject) => {
        addCommentMutation.mutate(
          {
            account_rid: accountId,
            case_rid: caseId,
            task_rid: taskId,
            comments: commentText,
            files: files,
          },
          {
            onSuccess: () => {
              const message =
                addCommentMutation.data?.statusMessage ||
                'Comment added successfully';
              successToast(message);
              const commentsParams = {
                account_rid: accountId,
                case_rid: caseId,
                task_rid: taskId,
                page: 1,
                limit: 100,
              };
              queryClient.invalidateQueries({
                queryKey: ['taskComments', commentsParams],
              });
              queryClient.invalidateQueries({
                queryKey: ['taskAttachments', commentsParams],
              });
              queryClient.invalidateQueries({ queryKey: ['allTasksList'] });
              resolve();
            },
            onError: (error) => {
              const errorMessage =
                (error as { response?: { data?: { statusMessage?: string } } })
                  ?.response?.data?.statusMessage ||
                error?.message ||
                'Failed to add comment';
              errorToast(errorMessage);
              reject(error);
            },
          }
        );
      });
    },
    [
      accountId,
      caseId,
      successToast,
      errorToast,
      addCommentMutation,
      queryClient,
    ]
  );

  const handleUpdateComment = useCallback(
    async (
      commentId: string,
      commentText: string,
      taskId: string,
      files?: File[],
      deletedFileIds?: string[]
    ) => {
      if (!accountId || !caseId) {
        errorToast('Account ID or Case ID is missing');
        throw new Error('Missing Account ID or Case ID');
      }

      return new Promise<void>((resolve, reject) => {
        updateCommentMutation.mutate(
          {
            account_rid: accountId,
            case_rid: caseId,
            task_rid: taskId,
            rid: commentId,
            comments: commentText,
            files: files,
            deleted_file_ids: deletedFileIds,
          },
          {
            onSuccess: () => {
              const message =
                updateCommentMutation.data?.statusMessage ||
                'Comment updated successfully';
              successToast(message);
              const commentsParams = {
                account_rid: accountId,
                case_rid: caseId,
                task_rid: taskId,
                page: 1,
                limit: 100,
              };
              queryClient.invalidateQueries({
                queryKey: ['taskComments', commentsParams],
              });
              queryClient.invalidateQueries({ queryKey: ['allTasksList'] });
              resolve();
            },
            onError: (error) => {
              const errorMessage =
                (error as { response?: { data?: { statusMessage?: string } } })
                  ?.response?.data?.statusMessage ||
                error?.message ||
                'Failed to update comment';
              errorToast(errorMessage);
              reject(error);
            },
          }
        );
      });
    },
    [
      accountId,
      caseId,
      successToast,
      errorToast,
      updateCommentMutation,
      queryClient,
    ]
  );

  const handleDeleteComment = useCallback(
    async (commentId: string, taskId: string) => {
      if (!accountId || !caseId) {
        errorToast('Account ID or Case ID is missing');
        throw new Error('Missing Account ID or Case ID');
      }

      return new Promise<void>((resolve, reject) => {
        deleteCommentMutation.mutate(
          {
            account_rid: accountId,
            case_rid: caseId,
            task_rid: taskId,
            rid: commentId,
            deleted_file_ids: [],
          },
          {
            onSuccess: () => {
              const message =
                deleteCommentMutation.data?.statusMessage ||
                'Comment deleted successfully';
              successToast(message);
              const commentsParams = {
                account_rid: accountId,
                case_rid: caseId,
                task_rid: taskId,
                page: 1,
                limit: 100,
              };
              queryClient.invalidateQueries({
                queryKey: ['taskComments', commentsParams],
              });
              queryClient.invalidateQueries({ queryKey: ['allTasksList'] });
              resolve();
            },
            onError: (error) => {
              const errorMessage =
                (error as { response?: { data?: { statusMessage?: string } } })
                  ?.response?.data?.statusMessage ||
                error?.message ||
                'Failed to delete comment';
              errorToast(errorMessage);
              reject(error);
            },
          }
        );
      });
    },
    [
      accountId,
      caseId,
      successToast,
      errorToast,
      deleteCommentMutation,
      queryClient,
    ]
  );

  const handleAddCollaborator = useCallback(
    async (
      taskId: string,
      userId: string
    ): Promise<AddCollaboratorResponse> => {
      if (!accountId || !caseId) {
        errorToast('Account ID or Case ID is missing');
        throw new Error('Missing Account ID or Case ID');
      }

      return new Promise<AddCollaboratorResponse>((resolve, reject) => {
        const payload: AddCollaboratorPayload = {
          case_rid: caseId,
          account_rid: accountId,
          rid: taskId,
          user_rid: userId,
          action_type: shouldFetchCaseData ? 'milestone' : 'activity',
        };

        addCollaboratorMutation.mutate(payload, {
          onSuccess: (response) => {
            if (
              response?.statusCode === 200 ||
              response?.statusCodeValue === 'OK'
            ) {
              const message =
                response?.statusMessage || 'Collaborator added successfully';
              successToast(message);
              queryClient.invalidateQueries({
                queryKey: ['collaborators', accountId, caseId, taskId],
              });
              queryClient.invalidateQueries({ queryKey: ['allTasksList'] });

              resolve(response);
            } else {
              const errorMessage =
                response?.statusMessage || 'Failed to add collaborator';
              errorToast(errorMessage);
              reject(new Error(errorMessage));
            }
          },
          onError: (error) => {
            const errorMessage =
              (error as { response?: { data?: { statusMessage?: string } } })
                ?.response?.data?.statusMessage ||
              error?.message ||
              'Failed to add collaborator';
            errorToast(errorMessage);
            console.error('Error adding collaborator:', error);
            reject(error);
          },
        });
      });
    },
    [
      accountId,
      caseId,
      addCollaboratorMutation,
      successToast,
      errorToast,
      queryClient,
      shouldFetchCaseData,
    ]
  );

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

  // Permission Map for Milestone (Case) Tasks
  const milestonePermissionMap = useMemo(
    () =>
      getPermissionMap(
        permission,
        AllPermissions.CASES_WORKBREAKDOWN_VIEW_EDIT
      ),
    [permission]
  );

  const fieldHiddenMap = useMemo(() => {
    if (!selectedTask) return {};

    if (isMilestoneTab) {
      return {
        taskName:
          !milestonePermissionMap['task_name']?.read &&
          !milestonePermissionMap['task_name']?.edit,
        status:
          !milestonePermissionMap['status_rid']?.read &&
          !milestonePermissionMap['status_rid']?.edit,
        priority:
          !milestonePermissionMap['priority_rid']?.read &&
          !milestonePermissionMap['priority_rid']?.edit,
        assignee:
          !milestonePermissionMap['assigned_to']?.read &&
          !milestonePermissionMap['assigned_to']?.edit,
        startDate:
          !milestonePermissionMap['effective_start_datetime']?.read &&
          !milestonePermissionMap['effective_start_datetime']?.edit,
        endDate:
          !milestonePermissionMap['effective_end_datetime']?.read &&
          !milestonePermissionMap['effective_end_datetime']?.edit,
        description:
          !milestonePermissionMap['task_description']?.read &&
          !milestonePermissionMap['task_description']?.edit,
        checklistTemplate:
          !milestonePermissionMap['checklist_template_rid']?.read &&
          !milestonePermissionMap['checklist_template_rid']?.edit,
        tags:
          !milestonePermissionMap['tags']?.read &&
          !milestonePermissionMap['tags']?.edit,
        weightage:
          !milestonePermissionMap['weightage_rid']?.read &&
          !milestonePermissionMap['weightage_rid']?.edit,
        category:
          !milestonePermissionMap['task_category_rid']?.read &&
          !milestonePermissionMap['task_category_rid']?.edit,
        linkedType:
          !milestonePermissionMap['relationship_connector_rid']?.read &&
          !milestonePermissionMap['relationship_connector_rid']?.edit,
        linkTaskType:
          !milestonePermissionMap['target_rid']?.read &&
          !milestonePermissionMap['target_rid']?.edit,
        attachments:
          !milestonePermissionMap['attachments']?.read &&
          !milestonePermissionMap['attachments']?.edit,
        comments:
          !milestonePermissionMap['comments']?.read &&
          !milestonePermissionMap['comments']?.edit,
        collaborators:
          !milestonePermissionMap['collaborators']?.read &&
          !milestonePermissionMap['collaborators']?.edit,
        fiscalYear: true,
      };
    }

    // Activity View
    const entityLevel = selectedTask.attachment_level?.toLowerCase();
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
  }, [selectedTask, taskPermissionMap, milestonePermissionMap, isMilestoneTab]);

  const fieldDisabledMap = useMemo(() => {
    if (!selectedTask) return {};

    if (isMilestoneTab) {
      return {
        taskName: !milestonePermissionMap['task_name']?.edit,
        status: !milestonePermissionMap['status_rid']?.edit,
        priority: !milestonePermissionMap['priority_rid']?.edit,
        assignee: !milestonePermissionMap['assigned_to']?.edit,
        startDate: !milestonePermissionMap['effective_start_datetime']?.edit,
        endDate: !milestonePermissionMap['effective_end_datetime']?.edit,
        description: !milestonePermissionMap['task_description']?.edit,
        checklistTemplate:
          !milestonePermissionMap['checklist_template_rid']?.edit,
        tags: !milestonePermissionMap['tags']?.edit,
        weightage: !milestonePermissionMap['weightage_rid']?.edit,
        category: !milestonePermissionMap['task_category_rid']?.edit,
        linkedType: !milestonePermissionMap['relationship_connector_rid']?.edit,
        linkTaskType: !milestonePermissionMap['target_rid']?.edit,
        attachments: !milestonePermissionMap['attachments']?.edit,
        comments: !milestonePermissionMap['comments']?.edit,
        collaborators: !milestonePermissionMap['collaborators']?.edit,
        fiscalYear: true,
      };
    }

    // Activity View
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
  }, [selectedTask, taskPermissionMap, milestonePermissionMap, isMilestoneTab]);

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

  // const actionButtons: ActionItem<TaskList>[] = [
  //   {
  //     label: 'Edit',
  //     onClick: (row: TaskList) => console.log('Edit clicked:', row),
  //     icon: EditIcon,
  //     hide: false,
  //     iconStyle: {
  //       filter:
  //         'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
  //     },
  //   },
  // ];

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
        actionMenuItems={[]}
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
          caseId={caseId}
          onTaskUpdate={handleTaskUpdate}
          onAddComment={handleAddComment}
          onUpdateComment={handleUpdateComment}
          onDeleteComment={handleDeleteComment}
          onAddCollaborator={handleAddCollaborator}
          statusData={statusData}
          priorityData={priorityData}
          tagData={tagData}
          availableUsers={userData}
          roleOptions={roleOptionsQuery.data || []}
          checklistData={checklistData}
          taskType={
            fixedFilters?.attachment_level === 'milestone'
              ? 'milestone'
              : 'activity'
          }
          fieldVisibility={fieldHiddenMap}
          fieldDisabled={fieldDisabledMap}
        />
      )}
    </>
  );
};
