/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useTaskActivityDetails,
  fetchTaskActivityDetails,
} from '../../../services/activities/activities-service';
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
  // entityLevel,
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
          item.name === AllPermissions.CASES_WORKBREAKDOWN_VIEW_EDIT
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
        !permissionMap['task_description']?.read &&
        !permissionMap['task_description']?.edit,
      checklistTemplate:
        !permissionMap['checklist_template_rid']?.read &&
        !permissionMap['checklist_template_rid']?.edit,
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
      fiscalYear: false, // Force visible
    }),
    [permissionMap]
  );

  const fieldDisabledMap = useMemo(
    () => ({
      status: !permissionMap['status_rid']?.edit,
      priority: !permissionMap['priority_rid']?.edit,
      assignee: !permissionMap['assigned_to']?.edit,
      startDate: !permissionMap['effective_start_datetime']?.edit,
      endDate: !permissionMap['effective_end_datetime']?.edit,
      description: !permissionMap['task_description']?.edit,
      checklistTemplate: !permissionMap['checklist_template_rid']?.edit,
      tags: !permissionMap['tags']?.edit,
      weightage: !permissionMap['weightage_rid']?.edit,
      category: !permissionMap['task_category_rid']?.edit,
      linkedType: !permissionMap['relationship_connector_rid']?.edit,
      linkTaskType: !permissionMap['target_rid']?.edit,
      attachments: !permissionMap['attachments']?.edit,
      comments: !permissionMap['comments']?.edit,
      collaborators: !permissionMap['collaborators']?.edit,
      fiscalYear: false, // Force editable
    }),
    [permissionMap]
  );

  const { data } = useTaskActivityDetails(accountId, activityId, true);

  const effectiveCaseId =
    propCaseId || data?.attach_to || data?.attached_to || '';

  const caseTeamMembersQuery = useGetCaseTeamMembersDropdown(
    accountid || accountId || '',
    effectiveCaseId,
    !!(accountId || accountid) && !!effectiveCaseId
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
            ...(effectiveCaseId && { case_rid: effectiveCaseId }),
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
                ...(effectiveCaseId && { case_rid: effectiveCaseId }),
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
      effectiveCaseId,
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
            ...(effectiveCaseId && { case_rid: effectiveCaseId }),
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
                ...(effectiveCaseId && { case_rid: effectiveCaseId }),
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
      effectiveCaseId,
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
            ...(effectiveCaseId && { case_rid: effectiveCaseId }),
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
                ...(effectiveCaseId && { case_rid: effectiveCaseId }),
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
      effectiveCaseId,
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
                  effectiveCaseId,
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
        fiscalYear={'2025'}
        fiscalYears={fiscalYearOptions}
        taskType='activity'
        onAddComment={handleAddComment}
        onUpdateComment={handleUpdateComment}
        onDeleteComment={handleDeleteComment}
        onAddCollaborator={handleAddCollaborator}
        onFetchTaskDetails={async (taskId) => {
          if (!accountId) return null;
          try {
            const response = await fetchTaskActivityDetails(accountId, taskId);
            // Map TaskActivityDetails to Task
            const mappedTask: any = {
              id: response.rid,
              r_number: response.r_number,
              title: response.task_name,
              status: response.task_status_name || 'Open', // Default to Open if null
              priority: response.priority_name || 'Medium',
              priorityRid: response.priority_rid || undefined,
              assignee: {
                name: response.assigned_to_name || 'Unassigned',
                initials: response.assigned_to_name
                  ? response.assigned_to_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : 'UA',
                color: '#9CA3AF', // Default color
              },
              commentCount: 0, // Not in response
              createdAt: new Date(response.created_datetime),
              createdBy: response.created_by_name,
              modifiedBy: response.modified_by_name || undefined,
              description: response.task_description,
              checklist: response.checklists?.checklist_items?.map((item) => ({
                id: item.rid,
                text: item.checklist_item_name,
                completed: item.checklist_item_status_name === 'Completed',
              })),
              checklistName: response.checklist_name || undefined,
              checklistInfo: response.checklists
                ? {
                    rid: response.checklists.rid,
                    name: response.checklists.checklist_name,
                    description:
                      response.checklists.checklist_description || '',
                    totalItems: response.checklists.checklist_items_count,
                    completedItems: response.checklists.completed_items_count,
                  }
                : undefined,
              tags: response.tags,
              startDate: response.effective_start_datetime
                ? new Date(response.effective_start_datetime)
                : undefined,
              endDate: response.effective_end_datetime
                ? new Date(response.effective_end_datetime)
                : undefined,
              case_rid: response.attach_to || response.attached_to,
              fiscal_year: response.fiscal_year,
              weightage: response.weightage_value || undefined,
              category: response.task_category_name || undefined,
            };
            return mappedTask;
          } catch (error) {
            console.error('Error fetching task details:', error);
            return null;
          }
        }}
      />
    </div>
  );
};

export default TaskDetails;
