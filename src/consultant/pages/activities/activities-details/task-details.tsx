import React, { useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTaskActivityDetails } from '../../../services/activities/activities-service';
import { ActivityType } from '../../../types';
import {
  useGetCaseTeamMembersDropdown,
  useGetRoleOptions,
  useGetTagOptions,
} from '../../../services/case-team';
import {
  AddCollaboratorPayload,
  AddCollaboratorResponse,
  useAddCollaborator,
  useGetTaskPriorities,
  useGetTaskStatuses,
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

interface TaskDetailsProps {
  accountInActive: boolean;
  tabValue: ActivityType;
  entityLevel: 'account' | 'case' | 'project';
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ entityLevel }) => {
  const navigate = useNavigate();
  const { successToast, errorToast } = useToast();
  const queryClient = useQueryClient();
  const { accountid } = useParams();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountID') || '';
  const activityId = searchParams.get('activity_id') || '';

  const caseId = 'D001-8ed0b691-44ed-42fc-b046-c94e451ecb54';

  const caseTeamMembersQuery = useGetCaseTeamMembersDropdown(
    accountid || accountId || '',
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
                queryKey: [
                  'collaborators',
                  accountId || accountid,
                  caseId,
                  taskId,
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
      caseId,
      addCollaboratorMutation,
      successToast,
      errorToast,
      queryClient,
    ]
  );

  const { data } = useTaskActivityDetails(accountId, activityId, true);

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
        caseId={data?.attached_to || ''}
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
          fiscalYear: entityLevel === 'account',
        }}
        fieldDisabled={{}}
        fiscalYear={'2025'}
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
