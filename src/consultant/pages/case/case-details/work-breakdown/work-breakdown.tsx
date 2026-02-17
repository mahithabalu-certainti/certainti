/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { WorkBreakdownIcon } from '../../../../../assets';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { AccessRestricted } from '../../../../../components/account-restricted';
import { AllModules, AllPermissions } from '../../../../../common-service';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import KanbanBoard from '../../../../../components/kanban-board/kanban-board';
import TaskDetailModal from '../../../../../components/kanban-board/task-detail-modal';
import {
  useGetWorkBreakdownList,
  useGetTaskPriorities,
  useGetTaskStatuses,
  useAddCollaborator,
  AddCollaboratorPayload,
  AddCollaboratorResponse,
} from '../../../../services/work-breakdown/work-breakdown-service';
import {
  useCreateCaseTask,
  CreateTaskPayload,
  useAddTaskComment,
  useUpdateTaskComment,
  useDeleteTaskComment,
} from '../../../../services/case-task/case-task-service';
import {
  useGetRoleOptions,
  useGetTagOptions,
  useGetCaseTeamMembersDropdown,
} from '../../../../services/case-team/case-team-service';
import {
  transformPriorityData,
  transformStatusData,
  transformTagData,
} from './helper';
import { CaseTask } from './case-task';
import { getAssignGroupsFilterFields } from './case-task/helper';
import { ActivityDropdownItem, ColorCode, ExportType } from '../../../../types';
import { useToast } from '../../../../../hooks';
import { TaskCard } from '../../../../../components/kanban-board/types';
import { useGetTaskCheckListTypes } from '../../../../../admin/service/task-template/task-template-service';
import { checkPermission } from '../../../../../common-utils';

const ConfigTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
];
interface WorkBreakDownProps {
  activityMenuItems: ActivityDropdownItem[];
  setExportType: (type: ExportType) => void;
  setCaseTaskParams: (params: Record<string, unknown>) => void;
  caseStartDate?: string | null;
  caseEndDate?: string | null;
  isActionItemsExpanded?: boolean;
  setIsActionItemsExpanded?: (expanded: boolean) => void;
  isCaseTeamCreated?: boolean;
  refetchCaseDetails: () => void;
}

const WorkBreakDown: React.FC<WorkBreakDownProps> = ({
  setExportType,
  setCaseTaskParams,
  activityMenuItems,
  caseStartDate,
  caseEndDate,
  isActionItemsExpanded,
  setIsActionItemsExpanded,
  isCaseTeamCreated,
  refetchCaseDetails,
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { caseId } = useParams<{
    caseId: string;
  }>();
  const accountId = searchParams.get('accountID');
  const { successToast, errorToast } = useToast();
  const tabParam = searchParams.get('tab') || 'milestone';
  const queryClient = useQueryClient();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [seachText, setSearchText] = useState('');
  const [resetSearch, setResetSearch] = useState(false);
  const [isManualRefresh, setIsManualRefresh] = useState(false);

  const { permission, modules } = useSelector(
    (state: RootState) => state.permission
  );

  const isWorkBreakdownEnable = checkPermission(
    modules,
    AllModules.WORKBREAKDOWN
  );
  const isCreateTaskEnabled = checkPermission(
    permission,
    AllPermissions.CASES_WORKBREAKDOWN_CREATE
  );

  if (!isWorkBreakdownEnable) return <AccessRestricted />;

  const caseTaskViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.CASES_WORKBREAKDOWN_VIEW_EDIT
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

  const {
    data: kanbanData,
    isLoading,
    isError,
    isFetching,
  } = useGetWorkBreakdownList(accountId || '', caseId || '');

  // Reset manual refresh flag when fetching completes
  useEffect(() => {
    if (!isFetching && isManualRefresh) {
      setIsManualRefresh(false);
    }
  }, [isFetching, isManualRefresh]);

  useEffect(() => {
    if (
      !searchParams.get('tab') &&
      searchParams.get('list') === 'workBreakdown'
    ) {
      searchParams.set('tab', 'milestone');
      navigate(`?${searchParams.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const isCaseTeamViewEnable = checkPermission(
    permission,
    AllPermissions.CASES_TEAM_VIEW_EDIT
  );

  const caseTeamMembersQuery = useGetCaseTeamMembersDropdown(
    accountId || '',
    caseId || '',
    !!accountId && !!caseId && isCaseTeamViewEnable
  );
  const roleOptionsQuery = useGetRoleOptions();
  const prioritiesQuery = useGetTaskPriorities();
  const statusesQuery = useGetTaskStatuses();
  const checklistQuery = useGetTaskCheckListTypes();
  const createTaskMutation = useCreateCaseTask();
  const addCommentMutation = useAddTaskComment();
  const updateCommentMutation = useUpdateTaskComment();
  const deleteCommentMutation = useDeleteTaskComment();
  const addCollaboratorMutation = useAddCollaborator();
  const tagOptionsQuery = useGetTagOptions(
    {
      task_rid: '',
      account_rid: accountId || '',
      case_rid: caseId || '',
      action: 'create',
    },
    !!accountId && !!caseId
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
        profile_url: member.profile_url,
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

  const memoizedStatus = useMemo(
    () =>
      statusesQuery?.data?.map((status) => ({
        option: status.task_status_name,
        value: status.rid,
      })) || [],
    [statusesQuery?.data]
  );

  // Refetch assignees when task modal opens (create or edit)
  useEffect(() => {
    if (openTaskId !== null && isCaseTeamViewEnable) {
      caseTeamMembersQuery.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTaskId, isCaseTeamViewEnable]);

  const handleTaskSaved = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['kanbanBoardData', accountId, caseId],
    });
  }, [queryClient, accountId, caseId]);

  const handleCreateTask = useCallback(
    async (columnId: string, taskData: Partial<TaskCard>) => {
      if (!accountId || !caseId) {
        errorToast('Account ID or Case ID is missing');
        throw new Error('Missing Account ID or Case ID');
      }

      return new Promise<void>((resolve, reject) => {
        const tagsArray: Array<{ tag_rid: string; is_new_tag: boolean }> = [];
        if (taskData.tags && taskData.tags.length > 0) {
          (taskData.tags as string[]).forEach((tagName: string) => {
            const existingTag = tagData?.find((t) => t.name === tagName);
            if (existingTag) {
              tagsArray.push({
                tag_rid: existingTag.id,
                is_new_tag: false,
              });
            } else {
              tagsArray.push({
                tag_rid: tagName,
                is_new_tag: true,
              });
            }
          });
        }

        // Get status_rid from statusData based on status_name or use provided status_rid
        let statusRid = taskData.status_rid || '';
        if (!statusRid && taskData.task_status_name) {
          const statusItem = statusData?.find(
            (s) => s.name === taskData.task_status_name
          );
          statusRid = statusItem?.id || '';
        }
        // If still empty, try to find "To Do" as default
        if (!statusRid) {
          const defaultStatus = statusData?.find((s) => s.name === 'To Do');
          statusRid = defaultStatus?.id || '';
        }

        const taskPayload: CreateTaskPayload = {
          case_rid: caseId,
          account_rid: accountId,
          task_name: taskData.task_name || '',
          task_description: taskData.task_description || '',
          status_rid: statusRid,
          priority_rid: taskData.priority_rid || '',
          effective_start_datetime: taskData.effective_start_datetime || '',
          effective_end_datetime: taskData.effective_end_datetime || '',
          milestone_template_rid: columnId,
          checklist_template_rid:
            (
              taskData as Partial<TaskCard> & {
                checklist_template_rid?: string;
                workflow_connector?: {
                  source_rid: string;
                  relationship_connector_rid?: string;
                  target_rid?: string[];
                };
                weightage_rid?: string;
                task_category_rid?: string;
              }
            ).checklist_template_rid || '',
          tags: tagsArray,
          workflow_connector:
            (
              taskData as Partial<TaskCard> & {
                workflow_connector?: {
                  source_rid: string;
                  relationship_connector_rid?: string;
                  target_rid?: string[];
                  is_new_changes?: boolean;
                };
              }
            ).workflow_connector || {},
          ...((
            taskData as Partial<TaskCard> & {
              weightage_rid?: string;
            }
          ).weightage_rid && {
            weightage_rid: (
              taskData as Partial<TaskCard> & {
                weightage_rid?: string;
              }
            ).weightage_rid,
          }),
          ...((
            taskData as Partial<TaskCard> & {
              task_category_rid?: string;
            }
          ).task_category_rid && {
            task_category_rid: (
              taskData as Partial<TaskCard> & {
                task_category_rid?: string;
              }
            ).task_category_rid,
          }),
          assigned_to: taskData.assigned_to ?? '',
        };

        createTaskMutation.mutate(taskPayload, {
          onSuccess: (response) => {
            if (response?.data?.rid) {
              const message =
                response?.statusMessage || 'Task created successfully';
              successToast(message);
              handleTaskSaved();
              resolve();
            } else {
              const errorMessage =
                response?.statusMessage || 'Failed to create task';
              errorToast(errorMessage);
              reject(new Error(errorMessage));
            }
          },
          onError: (error) => {
            const errorMessage =
              (error as { response?: { data?: { statusMessage?: string } } })
                ?.response?.data?.statusMessage ||
              error?.message ||
              'Failed to create task';
            errorToast(errorMessage);
            console.error('Error creating task:', error);
            reject(error);
          },
        });
      });
    },
    [
      accountId,
      caseId,
      createTaskMutation,
      successToast,
      errorToast,
      tagData,
      statusData,
      handleTaskSaved,
    ]
  );

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
              setOpenTaskId(taskId);
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
              // Invalidate both comments and attachments queries
              queryClient.invalidateQueries({
                queryKey: ['taskComments', commentsParams],
              });
              queryClient.invalidateQueries({
                queryKey: ['taskAttachments', commentsParams],
              });
              // Refetch kanban board to update comment counts
              queryClient.invalidateQueries({
                queryKey: ['kanbanBoardData', accountId, caseId],
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
              // Refetch kanban board to update comment counts
              queryClient.invalidateQueries({
                queryKey: ['kanbanBoardData', accountId, caseId],
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
              // Refetch kanban board to update comment counts
              queryClient.invalidateQueries({
                queryKey: ['kanbanBoardData', accountId, caseId],
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
                queryKey: ['collaborators', accountId, caseId, taskId],
              });
              // Refetch kanban board to update task data
              queryClient.invalidateQueries({
                queryKey: ['kanbanBoardData', accountId, caseId],
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
      caseId,
      addCollaboratorMutation,
      successToast,
      errorToast,
      queryClient,
    ]
  );

  const assigneeOptions = useMemo(
    () =>
      userData.map((user) => ({
        option: user.name,
        value: user.rid,
      })),
    [userData]
  );

  const roleOptions = useMemo(
    () =>
      roleOptionsQuery?.data?.map((role) => ({
        option: role.role_name,
        value: role.rid,
      })),
    [roleOptionsQuery]
  );

  const filterFields =
    tabParam === 'case_task'
      ? getAssignGroupsFilterFields(
          permissionMap,
          memoizedStatus,
          assigneeOptions,
          roleOptions
        )
      : undefined;

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleSearchReset = () => {
    setResetSearch(false);
  };

  const getTitleIcon = () => {
    return (
      <WorkBreakdownIcon
        alt='case-icon'
        className={`[&>path]:stroke-[${ColorCode.accountTextColor}] w-[14px] h-[14px]`}
      />
    );
  };

  const tabs = [
    { label: 'Milestone', value: 'milestone' },
    { label: 'Case Task', value: 'case_task' },
  ];

  const handleTabChange = (value: string) => {
    searchParams.set('tab', value);
    navigate(`?${searchParams.toString()}`, { replace: true });
  };

  const onRefreshClick = () => {
    setIsManualRefresh(true);
    queryClient.invalidateQueries({
      queryKey: ['kanbanBoardData', accountId, caseId],
    });
  };

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const headerButtons = [
    {
      label: 'Show/Hide Fields',
      variant: 'outlined' as const,
      disabled: false,
      onClick: handleColumnVisibility,
      sx: { width: '125px', minWidth: '125px' },
      hide: tabParam !== 'case_task',
    },
  ];

  const fieldHiddenMap = useMemo(
    () => ({
      all_activities: !permissionMap['all_activities']?.read,
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
        !permissionMap['task_description']?.read &&
        !permissionMap['task_description']?.edit,
      checklistTemplate:
        !permissionMap['checklist_template_rid']?.read &&
        !permissionMap['checklist_template_rid']?.edit,
      checklist:
        !permissionMap['checklist_template_rid']?.read &&
        !permissionMap['checklist_template_rid']?.edit,
      tags: !permissionMap['tags']?.read && !permissionMap['tags']?.edit,
      weightage:
        !permissionMap['weightage_rid']?.read &&
        !permissionMap['weightage_rid']?.edit,
      category:
        !permissionMap['task_category_rid']?.read &&
        !permissionMap['task_category_rid']?.edit,
      linkedType:
        !permissionMap['relationship_connector_rid']?.read &&
        !permissionMap['relationship_connector_rid']?.edit,
      linkTaskType:
        !permissionMap['target_rid']?.read &&
        !permissionMap['target_rid']?.edit,
      attachments:
        !permissionMap['attachments']?.read &&
        !permissionMap['attachments']?.edit,
      comments:
        !permissionMap['comments']?.read && !permissionMap['comments']?.edit,
      collaborators:
        !permissionMap['collaborators']?.read &&
        !permissionMap['collaborators']?.edit,
      fiscalYear: true,
    }),
    [permissionMap]
  );

  const fieldDisabledMap = useMemo(
    () => ({
      taskName: !permissionMap['task_name']?.edit,
      status: !permissionMap['status_rid']?.edit,
      priority: !permissionMap['priority_rid']?.edit,
      assignee: !permissionMap['assigned_to']?.edit,
      startDate: !permissionMap['effective_start_datetime']?.edit,
      endDate: !permissionMap['effective_end_datetime']?.edit,
      description: !permissionMap['task_description']?.edit,
      checklistTemplate: !permissionMap['checklist_template_rid']?.edit,
      checklist: !permissionMap['checklist_template_rid']?.edit,
      tags: !permissionMap['tags']?.edit,
      weightage: !permissionMap['weightage_rid']?.edit,
      category: !permissionMap['task_category_rid']?.edit,
      linkedType: !permissionMap['relationship_connector_rid']?.edit,
      linkTaskType: !permissionMap['target_rid']?.edit,
      attachments: !permissionMap['attachments']?.edit,
      comments: !permissionMap['comments']?.edit,
      collaborators: !permissionMap['collaborators']?.edit,
    }),
    [permissionMap]
  );

  return (
    <>
      {!isActionItemsExpanded && (
        <>
          <SectionTabPanel
            tabs={ConfigTabs}
            filterMenu={filterFields}
            filterVisibility={tabParam !== 'milestone'}
            showFilter={showFilter}
            contextKey={`case`}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            setCurrentPage={setCurrentPage}
            handleFilter={handleFilter}
            handleSorting={() => {}}
            sortFilterCount={0}
            setSortFilterCount={() => {}}
            showRefresh={tabParam === 'milestone'}
            onRefreshClick={onRefreshClick}
            // hideTabPanel={hideSection}
            showSearch={tabParam === 'case_task' ? true : false}
            searchDisabled={false}
            searchPlaceholder='Search'
            onSearch={(text) => setSearchText(text)}
            searchReset={resetSearch}
            onSearchReset={handleSearchReset}
            showAddActivity={true}
            activityMenuItems={activityMenuItems}
          />
          <SectionHeader
            title={'Action Items'}
            titleIcon={getTitleIcon()}
            buttons={headerButtons}
            count={count}
            showItemCount={tabParam === 'case_task'}
            hideSection={false}
            iconBg={ColorCode.caseBgColor}
            bgType='circle'
          />
        </>
      )}
      <SectionHeaderTab
        tabs={tabs}
        onTabChange={handleTabChange}
        defaultValue={tabParam}
        isExpanded={isActionItemsExpanded}
        onToggleExpand={
          tabParam === 'milestone' && setIsActionItemsExpanded
            ? () => setIsActionItemsExpanded(!isActionItemsExpanded)
            : undefined
        }
      />

      <div
        className={`border border-t-0 border-[#CBD6E2] ${
          isActionItemsExpanded
            ? 'max-h-[calc(100vh-200px)]'
            : 'max-h-[calc(100vh-418px)]'
        } overflow-auto`}
      >
        {tabParam === 'milestone' && (
          <>
            {isError ? (
              <div className='flex items-center justify-center h-full p-40 text-red-500'>
                Error loading data.
              </div>
            ) : kanbanData?.data && kanbanData.data.length === 0 ? (
              <div className='flex items-center justify-center h-full p-40 text-gray-500'>
                {kanbanData.statusMessage || 'No data available'}
              </div>
            ) : (
              <KanbanBoard
                data={kanbanData?.data || []}
                isLoading={isLoading || isManualRefresh}
                statusData={statusData}
                priorityData={priorityData}
                tagData={tagData}
                checklistData={checklistData}
                isExpanded={isActionItemsExpanded}
                userData={userData}
                roleOptions={roleOptionsQuery.data || []}
                onTaskClick={setOpenTaskId}
                isCreateTaskHide={!isCreateTaskEnabled}
                onCreateTask={handleCreateTask}
                onAddComment={handleAddComment}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
                onAddCollaborator={handleAddCollaborator}
                accountId={accountId || ''}
                caseId={caseId || ''}
                fieldVisibility={{ fiscalYear: true }}
                caseStartDate={caseStartDate}
                caseEndDate={caseEndDate}
              />
            )}
            {openTaskId && (
              <TaskDetailModal
                taskId={openTaskId}
                isOpen={true}
                onClose={() => setOpenTaskId(null)}
                accountId={accountId!}
                caseId={caseId!}
                onTaskUpdate={handleTaskSaved}
                statusData={statusData}
                priorityData={priorityData}
                tagData={tagData}
                availableUsers={userData}
                roleOptions={roleOptionsQuery.data || []}
                checklistData={checklistData}
                fieldVisibility={fieldHiddenMap}
                fieldDisabled={fieldDisabledMap}
                onAddComment={handleAddComment}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
                onAddCollaborator={handleAddCollaborator}
                caseStartDate={caseStartDate}
                caseEndDate={caseEndDate}
                isCaseTeamCreated={isCaseTeamCreated}
                refetchCaseDetails={refetchCaseDetails}
              />
            )}
          </>
        )}
        {tabParam === 'case_task' && (
          <CaseTask
            caseId={caseId}
            setCount={setCount}
            filterParams={{
              page: currentPage,
              filters: appliedFilters,
              limit: 100,
              entity_type: '',
            }}
            setColumnAnchorEl={setColumnAnchorEl}
            columnAnchorEl={columnAnchorEl}
            searchValue={seachText}
            setExportType={setExportType}
            setCaseTaskParams={setCaseTaskParams}
          />
        )}
      </div>
    </>
  );
};

export default WorkBreakDown;
