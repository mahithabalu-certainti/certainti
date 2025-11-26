import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  ActivityList,
  ActivityListURLParams,
  ActivityType,
} from '../../../types';
import {
  ListTableColumn,
  ShowHideTableColumn,
} from '../../../../components/table/types';
import { useActivityList } from '../../../services/activities/activities-service';
import { ListTable, ManageColumnsPopover } from '../../../../components/table';
import { ACTIVITY_EDIT } from '../../../../routes';
import TaskDetailModal from '../../../../components/kanban-board/task-detail-modal';
import {
  useGetTaskPriorities,
  useGetTaskStatuses,
} from '../../../services/work-breakdown/work-breakdown-service';
import {
  useAddTaskComment,
  useUpdateTaskComment,
  useDeleteTaskComment,
} from '../../../services/case-task/case-task-service';
import {
  useGetTagOptions,
  useGetCaseTeamMembersDropdown,
  useGetRoleOptions,
} from '../../../services/case-team/case-team-service';
import {
  transformPriorityData,
  transformStatusData,
  transformTagData,
} from '../../case/case-details/work-breakdown/helper';
import { useGetTaskCheckListTypes } from '../../../../admin/service/task-template/task-template-service';
import { useToast } from '../../../../hooks';
import { useQueryClient } from '@tanstack/react-query';
import { AddCollaboratorResponse, useAddCollaborator, AddCollaboratorPayload } from '../../../services/work-breakdown/work-breakdown-service';

interface ActivityListTableProps {
  refreshTrigger: number;
  currentPage: number;
  appliedFilters: Record<string, string | number | boolean | string[]>;
  setCount: (value: number) => void;
  columnAnchorEl: HTMLButtonElement | null;
  setColumnAnchorEl: React.Dispatch<
    React.SetStateAction<HTMLButtonElement | null>
  >;
  searchValue: string;
  activityType: ActivityType;
  columns: ListTableColumn<ActivityList>[];
  accountInActive?: boolean;
  entityDetails?: {
    r_number: string;
    module: string;
    source: string;
  };
  entityLevel: 'account' | 'case';
}

const ActivityListTable: React.FC<ActivityListTableProps> = ({
  refreshTrigger,
  currentPage,
  appliedFilters,
  setCount,
  columnAnchorEl,
  setColumnAnchorEl,
  searchValue,
  activityType,
  columns,
  accountInActive,
  entityDetails,
  entityLevel,
}) => {
  const navigate = useNavigate();
  const { caseId, accountid } = useParams();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const activityId = searchParams.get('activity_id');
  const viewDetails = !!activityId;
  const { successToast, errorToast } = useToast();
  const queryClient = useQueryClient();

  const [activityData, setActivityData] = useState<ActivityList[]>([]);
  const [selectedTask, setSelectedTask] = useState<ActivityList | null>(null);
  const [tableParams, setTableParams] = useState<ActivityListURLParams>({
    page: currentPage + 1,
    limit: 100,
    sortBy: 'r_number',
    sortOrder: 'ASC',
  });

  const { data, isLoading, isError } = useActivityList(
    {
      ...tableParams,
      search: searchValue,
      filters: appliedFilters,
      entityId: caseId || accountid || '',
      accountRid: accountId || accountid || '',
      attachmentLevel: entityLevel || 'account',
      activity_type: activityType,
    },
    !viewDetails,
    refreshTrigger
  );

  const caseTeamMembersQuery = useGetCaseTeamMembersDropdown(
    accountId || accountid || '',
    caseId || '',
    !!(accountId || accountid)
  );
  const roleOptionsQuery = useGetRoleOptions();
  const prioritiesQuery = useGetTaskPriorities();
  const statusesQuery = useGetTaskStatuses();
  const checklistQuery = useGetTaskCheckListTypes();
  const addCommentMutation = useAddTaskComment();
  const updateCommentMutation = useUpdateTaskComment();
  const deleteCommentMutation = useDeleteTaskComment();
  const addCollaboratorMutation = useAddCollaborator();

  const tagOptionsQuery = useGetTagOptions(
    {
      task_rid: '',
      account_rid: accountId || accountid || '',
      case_rid: caseId || '',
      action: 'create',
    },
    !!(accountId || accountid)
  );

  const tagData = useMemo(
    () => transformTagData(tagOptionsQuery.data || []),
    [tagOptionsQuery.data]
  );

  const userData = useMemo(() => {
    if (caseTeamMembersQuery.data && Array.isArray(caseTeamMembersQuery.data)) {
      return caseTeamMembersQuery.data.map((member) => ({
        rid: member.user_rid,
        name: member.user_name,
      }));
    }
    return [];
  }, [caseTeamMembersQuery.data]);

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

  const priorityData = useMemo(
    () => transformPriorityData(prioritiesQuery.data || []),
    [prioritiesQuery.data]
  );

  const statusData = useMemo(
    () => transformStatusData(statusesQuery.data || []),
    [statusesQuery.data]
  );

  const totalItems = data?.count || 0;

  useEffect(() => {
    if (data) {
      setActivityData(data.activities || []);
      setCount(data.count || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    setTableParams((prev) => ({
      ...prev,
      page: currentPage + 1,
      filters: appliedFilters,
      search: searchValue,
    }));
  }, [currentPage, appliedFilters, searchValue]);

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const apiOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';
    setTableParams((prev) => ({ ...prev, sortBy, sortOrder: apiOrder }));
  };

  const handlePageChange = (newPage: number) => {
    setTableParams((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleRowsPerPageChange = (newLimit: number) => {
    setTableParams((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const getRowId = (row: ActivityList) => row.rid;

  const handleEdit = (row: ActivityList) => {
    // For task activities, open modal instead of navigating
    if (row.activity_type?.toLowerCase() === 'task') {
      setSelectedTask(row);
    } else {
      // For other activity types (email, call, meeting), navigate to edit page
      const path = generatePath(ACTIVITY_EDIT, {
        module: entityDetails?.module || '',
        activityId: row.rid,
        type: row.activity_type?.toLowerCase() || activityType,
      });
      const queryParams = new URLSearchParams({
        accountId: accountId || accountid || '',
        entityLevel: row.attachment_level || entityDetails?.module || '',
        entityId: row.attach_to || '',
        source: entityDetails?.source || '',
      });
      navigate(`${path}?${queryParams.toString()}`);
    }
  };

  const handleTaskSaved = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['activity-list'],
    });
  }, [queryClient]);

  const handleAddComment = useCallback(
    async (taskId: string, commentText: string, files: File[]) => {
      if (!(accountId || accountid)) {
        errorToast('Account ID is missing');
        throw new Error('Missing Account ID');
      }

      return new Promise<void>((resolve, reject) => {
        addCommentMutation.mutate(
          {
            account_rid: accountId || accountid || '',
            case_rid: caseId || '',
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
                account_rid: accountId || accountid || '',
                case_rid: caseId || '',
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
      accountid,
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
      if (!(accountId || accountid)) {
        errorToast('Account ID is missing');
        throw new Error('Missing Account ID');
      }

      return new Promise<void>((resolve, reject) => {
        updateCommentMutation.mutate(
          {
            account_rid: accountId || accountid || '',
            case_rid: caseId || '',
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
                account_rid: accountId || accountid || '',
                case_rid: caseId || '',
                task_rid: taskId,
                page: 1,
                limit: 100,
              };
              queryClient.invalidateQueries({
                queryKey: ['taskComments', commentsParams],
              });
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
      accountid,
      caseId,
      successToast,
      errorToast,
      updateCommentMutation,
      queryClient,
    ]
  );

  const handleDeleteComment = useCallback(
    async (commentId: string, taskId: string) => {
      if (!(accountId || accountid)) {
        errorToast('Account ID is missing');
        throw new Error('Missing Account ID');
      }

      return new Promise<void>((resolve, reject) => {
        deleteCommentMutation.mutate(
          {
            account_rid: accountId || accountid || '',
            case_rid: caseId || '',
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
                account_rid: accountId || accountid || '',
                case_rid: caseId || '',
                task_rid: taskId,
                page: 1,
                limit: 100,
              };
              queryClient.invalidateQueries({
                queryKey: ['taskComments', commentsParams],
              });
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
      accountid,
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
      if (!(accountId || accountid)) {
        errorToast('Account ID is missing');
        throw new Error('Missing Account ID');
      }

      return new Promise<AddCollaboratorResponse>((resolve, reject) => {
        const payload: AddCollaboratorPayload = {
          case_rid: caseId || '',
          account_rid: accountId || accountid || '',
          rid: taskId,
          user_rid: userId,
          action_type: 'milestone',
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
                queryKey: ['collaborators', accountId || accountid, caseId, taskId],
              });

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
      accountid,
      caseId,
      addCollaboratorMutation,
      successToast,
      errorToast,
      queryClient,
    ]
  );

  const actionMenuItems = [
    {
      label: 'Edit',
      disabled: accountInActive,
      onClick: (row: ActivityList) => handleEdit(row),
      hide: false,
    },
  ];

  // Column visibility states
  const isModalOpen = Boolean(columnAnchorEl);
  const handlePopoverClose = () => setColumnAnchorEl(null);

  const modalId = isModalOpen
    ? `activity-${activityType || 'all'}-list-column-visibility-popover`
    : undefined;

  const RestrictedColumns = [
    { id: 'r_number', canHide: false, canDrag: false },
  ];

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(Object.fromEntries(columns.map((col) => [col.id, !col.hide])));

  const [columnOrder, setColumnOrder] = useState(columns.map((col) => col.id));

  const handleColumnsChange = (updatedColumns: ShowHideTableColumn[]) => {
    const newVisibility = Object.fromEntries(
      updatedColumns.map((col) => [col.id, !col.hide])
    );
    setColumnVisibility(newVisibility);
    setColumnOrder(updatedColumns.map((col) => col.id));
  };

  // Override R number column render for task activities to open modal
  const modifiedColumns = useMemo(() => {
    return columnOrder
      .map((id) => {
        const col = columns.find((c) => c.id === id)!;

        // Override the r_number column's render to intercept task clicks
        if (col.id === 'r_number' && col.render) {
          const originalRender = col.render;
          return {
            ...col,
            render: (row: ActivityList) => {
              // If it's a task, create our own clickable element
              if (row.activity_type?.toLowerCase() === 'task') {
                return (
                  <span
                    onClick={() => setSelectedTask(row)}
                    className='cursor-pointer !text-[#1755E7] !underline hover:underline hover:text-[#1755E7]'
                  >
                    {row.r_number}
                  </span>
                );
              }
              // For other activities, use original render
              return originalRender(row);
            },
          };
        }
        return col;
      })
      .filter((col) => columnVisibility[col.id]);
  }, [columnOrder, columns, columnVisibility, setSelectedTask]);

  return (
    <>
      <ManageColumnsPopover
        anchorEl={columnAnchorEl}
        open={isModalOpen}
        popoverId={modalId}
        onClose={handlePopoverClose}
        columns={columns}
        onColumnsChange={handleColumnsChange}
        columnRestrictions={RestrictedColumns}
      />

      <ListTable
        data={activityData}
        columns={modifiedColumns}
        getRowId={getRowId}
        hoverHighlight={false}
        tableStyle={{
          height: '100%',
          maxHeight: 'calc(100vh - 420px)',
          overflow: 'auto',
        }}
        stickyHeader={true}
        stickyColumnsCount={1}
        selectable={false}
        actionWidth={80}
        actionDisplayMode='dropdown'
        actionMenuItems={actionMenuItems}
        loading={isLoading}
        error={isError ? 'Failed to load activity data' : undefined}
        rowsPerPageOptions={[25, 50, 100]}
        rowsPerPage={tableParams.limit}
        currentPage={(tableParams.page ?? 1) - 1}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortBy={tableParams.sortBy}
        sortOrder={tableParams.sortOrder}
        onSort={handleSort}
      />

      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask.rid}
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          accountId={accountId || accountid || ''}
          caseId={
            selectedTask.attachment_level?.toLowerCase() === 'case'
              ? selectedTask.attach_to
              : ''
          }
          onTaskUpdate={handleTaskSaved}
          statusData={statusData}
          priorityData={priorityData}
          tagData={tagData}
          availableUsers={userData}
          roleOptions={roleOptionsQuery.data || []}
          checklistData={checklistData}
          fieldVisibility={{
            comments: true,
            collaborators: true,
            checklist: true,
            linkedType: true,
            linkTaskType: true,
            weightage: true,
            fiscalYear: selectedTask.attachment_level?.toLowerCase() !== 'account',
          }}
          fieldDisabled={{}}
          fiscalYear={selectedTask.fiscal_year}
          taskType='activity'
          onAddComment={handleAddComment}
          onUpdateComment={handleUpdateComment}
          onDeleteComment={handleDeleteComment}
          onAddCollaborator={handleAddCollaborator}
        />
      )}
    </>
  );
};

export default ActivityListTable;
