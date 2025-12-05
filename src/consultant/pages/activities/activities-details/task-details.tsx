/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetActivityStatus } from '../../../services/activities/activities-service';
import { ActivityType } from '../../../types';
import {
  useGetRoleOptions,
  useGetTagOptions,
  useGetUserOptions,
} from '../../../services/case-team';
import {
  AddCollaboratorPayload,
  AddCollaboratorResponse,
  useAddCollaborator,
  useGetTaskPriorities,
} from '../../../services/work-breakdown/work-breakdown-service';
import { useGetTaskCheckListTypes } from '../../../../admin/service/task-template/task-template-service';
import {
  useAddTaskComment,
  useDeleteTaskComment,
  useUpdateTaskComment,
} from '../../../services/case-task/case-task-service';
import {
  transformPriorityData,
  transformStatusData,
  transformTagData,
} from '../../case/case-details/work-breakdown/helper';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../../hooks';
import TaskDetailModal from '../../../../components/kanban-board/task-detail-modal';
import { AllPermissions } from '../../../../common-service';
import { fiscalYears as commonFiscalYears } from '../../../../common-utils/common-utils';
import { RootState } from '../../../../store/store';

interface TaskDetailsProps {
  accountInActive: boolean;
  tabValue: ActivityType;
  entityLevel: 'account' | 'case' | 'project';
  caseId?: string;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({
  entityLevel,
  caseId: propCaseId,
}) => {
  const navigate = useNavigate();
  const { successToast, errorToast } = useToast();
  const queryClient = useQueryClient();
  const { accountid } = useParams();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const activityId = searchParams.get('activity_id') || '';

  const { permission } = useSelector((state: RootState) => state.permission);

  const fiscalYearOptions = useMemo(
    () =>
      commonFiscalYears.map((fy: { value: string; label: string }) => fy.value),
    []
  );

  const caseTaskViewEditFields = useMemo(
    () =>
      permission?.find(
        (item: { name: string; fields?: any[] }) =>
          item.name === AllPermissions.ACTIVITY_TASK_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    caseTaskViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [caseTaskViewEditFields]);

  const fieldHiddenMap = useMemo(
    () => ({
      taskName:
        !permissionMap['task_name']?.read && !permissionMap['task_name']?.edit,
      status:
        !permissionMap['status_rid']?.read &&
        !permissionMap['status_rid']?.edit,
      priority:
        !permissionMap['priority_rid']?.read &&
        !permissionMap['priority_rid']?.edit,
      assignee:
        !permissionMap['assigned_to']?.read &&
        !permissionMap['assigned_to']?.edit,
      startDate:
        !permissionMap['effective_start_datetime']?.read &&
        !permissionMap['effective_start_datetime']?.edit,
      endDate:
        !permissionMap['effective_end_datetime']?.read &&
        !permissionMap['effective_end_datetime']?.edit,
      description:
        !permissionMap['description']?.read &&
        !permissionMap['description']?.edit,
      checklistTemplate:
        !permissionMap['checklists']?.read &&
        !permissionMap['checklists']?.edit,
      checklist:
        !permissionMap['checklists']?.read &&
        !permissionMap['checklists']?.edit,
      tags: !permissionMap['tags']?.read && !permissionMap['tags']?.edit,
      weightage: true,
      category: true,
      linkedType: true,
      linkTaskType: true,
      attachments:
        !permissionMap['attachments']?.read &&
        !permissionMap['attachments']?.edit,
      comments:
        !permissionMap['comments']?.read && !permissionMap['comments']?.edit,
      collaborators:
        !permissionMap['collaborators']?.read &&
        !permissionMap['collaborators']?.edit,
      fiscalYear:
        entityLevel !== 'account' ||
        (!permissionMap['fiscal_year']?.read &&
          !permissionMap['fiscal_year']?.edit),
    }),
    [permissionMap, entityLevel]
  );

  const fieldDisabledMap = useMemo(
    () => ({
      taskName: !permissionMap['task_name']?.edit,
      status: !permissionMap['status_rid']?.edit,
      priority: !permissionMap['priority_rid']?.edit,
      assignee: !permissionMap['assigned_to']?.edit,
      startDate: !permissionMap['effective_start_datetime']?.edit,
      endDate: !permissionMap['effective_end_datetime']?.edit,
      description: !permissionMap['description']?.edit,
      checklistTemplate: !permissionMap['checklists']?.edit,
      checklist: !permissionMap['checklists']?.edit,
      tags: !permissionMap['tags']?.edit,
      weightage: !permissionMap['weightage_rid']?.edit,
      category: !permissionMap['task_category_rid']?.edit,
      linkedType: !permissionMap['relationship_connector_rid']?.edit,
      linkTaskType: !permissionMap['target_rid']?.edit,
      attachments: !permissionMap['attachments']?.edit,
      comments: !permissionMap['comments']?.edit,
      collaborators: !permissionMap['collaborators']?.edit,
      fiscalYear: !permissionMap['fiscal_year']?.edit,
    }),
    [permissionMap]
  );

  const effectiveCaseId = propCaseId;

  const userOptionsQuery = useGetUserOptions(
    accountid || accountId || '',
    true
  );
  const roleOptionsQuery = useGetRoleOptions();
  const prioritiesQuery = useGetTaskPriorities();
  const statusesQuery = useGetActivityStatus('Task');
  const checklistQuery = useGetTaskCheckListTypes();
  const addCommentMutation = useAddTaskComment();
  const updateCommentMutation = useUpdateTaskComment();
  const deleteCommentMutation = useDeleteTaskComment();
  const addCollaboratorMutation = useAddCollaborator();

  const tagOptionsQuery = useGetTagOptions(
    {
      task_rid: '',
      account_rid: accountId || accountid || '',
      case_rid: effectiveCaseId,
      action: 'create',
    },
    !!(accountId || accountid) && !!effectiveCaseId
  );

  const tagData = useMemo(
    () => transformTagData(tagOptionsQuery.data || []),
    [tagOptionsQuery.data]
  );

  const userData = useMemo(() => {
    if (userOptionsQuery.data && Array.isArray(userOptionsQuery.data)) {
      return userOptionsQuery.data.map((member) => ({
        rid: member.rid,
        name: member.name,
      }));
    }
    return [];
  }, [userOptionsQuery.data]);

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

  const statusData = useMemo(() => {
    if (statusesQuery.data?.data?.activityStatus) {
      const mappedStatuses = statusesQuery.data.data.activityStatus.map(
        (s) => ({
          rid: s.rid || '',
          task_status_name: s.status_name,
        })
      );
      return transformStatusData(mappedStatuses);
    }
    return [];
  }, [statusesQuery.data]);

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
            task_rid: taskId,
            comments: commentText,
            files: files,
            task_type: 'activity',
          },
          {
            onSuccess: () => {
              const message =
                addCommentMutation.data?.statusMessage ||
                'Comment added successfully';
              successToast(message);
              const commentsParams = {
                account_rid: accountId || accountid || '',
                task_rid: taskId,
                page: 1,
                limit: 100,
                task_type: 'activity',
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
            task_rid: taskId,
            rid: commentId,
            comments: commentText,
            files: files,
            deleted_file_ids: deletedFileIds,
            task_type: 'activity',
          },
          {
            onSuccess: () => {
              const message =
                updateCommentMutation.data?.statusMessage ||
                'Comment updated successfully';
              successToast(message);
              const commentsParams = {
                account_rid: accountId || accountid || '',
                task_rid: taskId,
                page: 1,
                limit: 100,
                task_type: 'activity',
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
            task_rid: taskId,
            rid: commentId,
            deleted_file_ids: [],
            task_type: 'activity',
          },
          {
            onSuccess: () => {
              const message =
                deleteCommentMutation.data?.statusMessage ||
                'Comment deleted successfully';
              successToast(message);
              const commentsParams = {
                account_rid: accountId || accountid || '',
                task_rid: taskId,
                page: 1,
                limit: 100,
                task_type: 'activity',
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
          ...(effectiveCaseId && { case_rid: effectiveCaseId }),
          account_rid: accountId || accountid || '',
          rid: taskId,
          user_rid: userId,
          task_type: 'activity',
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
                queryKey: [
                  'collaborators',
                  accountId || accountid,
                  effectiveCaseId,
                  taskId,
                  'activity',
                ],
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
      effectiveCaseId,
      addCollaboratorMutation,
      successToast,
      errorToast,
      queryClient,
    ]
  );

  //Back handler
  const handleBackClick = () => {
    searchParams.delete('activity_id');
    searchParams.delete('activity_type');
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  return (
    <div>
      <TaskDetailModal
        taskId={activityId}
        isOpen={true}
        onClose={handleBackClick}
        accountId={accountId || accountid || ''}
        caseId={effectiveCaseId || ''}
        onTaskUpdate={handleTaskSaved}
        statusData={statusData}
        priorityData={priorityData}
        tagData={tagData}
        availableUsers={userData}
        roleOptions={roleOptionsQuery.data || []}
        checklistData={checklistData}
        fieldVisibility={fieldHiddenMap}
        fieldDisabled={fieldDisabledMap}
        fiscalYear={null}
        fiscalYears={fiscalYearOptions}
        taskType='activity'
        onAddComment={handleAddComment}
        onUpdateComment={handleUpdateComment}
        onDeleteComment={handleDeleteComment}
        onAddCollaborator={handleAddCollaborator}
      />
    </div>
  );
};

export default TaskDetails;
