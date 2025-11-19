import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CaseIcon } from '../../../../../assets';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { AllPermissions } from '../../../../../common-service';
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
  useGetUserOptions,
  useGetRoleOptions,
  useGetTagOptions,
} from '../../../../services/case-team/case-team-service';
import {
  transformPriorityData,
  transformStatusData,
  transformTagData,
} from './helper';
import { CaseTask } from './case-task';
import { getAssignGroupsFilterFields } from './case-task/helper';
import { ExportType } from '../../../../types';
import { ActivityMenuItem } from '../../../../types';
import { useToast } from '../../../../../hooks';
import { TaskCard } from '../../../../../components/kanban-board/types';
import { useGetTaskCheckListTypes } from '../../../../../admin/service/task-template/task-template-service';

const ConfigTabs: ResourceTabs[] = [
  {
    id: AllPermissions.ACCOUNT_ATTACHMENT_OVERVIEW,
    name: 'Overview',
    hide: false,
  },
];
interface WorkBreakDownProps {
  activityMenuItems: ActivityMenuItem[];
  setExportType: (type: ExportType) => void;
  setCaseTaskParams: (params: Record<string, unknown>) => void;
}

const WorkBreakDown: React.FC<WorkBreakDownProps> = ({
  setExportType,
  setCaseTaskParams,
  activityMenuItems,
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

  // Single source of truth for opened task
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

  const {
    data: kanbanData,
    isLoading,
    isError,
  } = useGetWorkBreakdownList(accountId || '', caseId || '');

  useEffect(() => {
    if (
      !searchParams.get('tab') &&
      searchParams.get('list') === 'workBreakdown'
    ) {
      searchParams.set('tab', 'milestone');
      navigate(`?${searchParams.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const userOptionsQuery = useGetUserOptions(accountId || '');
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
          taskData.tags.forEach((tagName: string) => {
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

        const taskPayload: CreateTaskPayload = {
          case_rid: caseId,
          account_rid: accountId,
          task_name: taskData.task_name || '',
          task_description: taskData.task_description || '',
          status_rid: taskData.status_rid || '',
          priority_rid: taskData.priority_rid || '',
          case_team_member_role_rid: taskData.case_team_member_role_rid || '',
          effective_start_datetime: taskData.effective_start_datetime || '',
          effective_end_datetime: taskData.effective_end_datetime || '',
          assigned_to: taskData.assigned_to || '',
          milestone_template_rid: columnId,
          checklist_template_rid:
            (
              taskData as Partial<TaskCard> & {
                checklist_template_rid?: string;
              }
            ).checklist_template_rid || '',
          tags: tagsArray.length > 0 ? tagsArray : undefined,
          workflow_connector: {
            source_rid: '',
            target_rid: [],
            relationship_connector_rid: '',
          },
        };

        createTaskMutation.mutate(taskPayload, {
          onSuccess: (response) => {
            if (response?.data?.rid) {
              successToast('Task created successfully');
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
              successToast('Comment added successfully');
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
    [accountId, caseId, successToast, errorToast, addCommentMutation]
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
              successToast('Comment updated successfully');
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
    [accountId, caseId, successToast, errorToast, updateCommentMutation]
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!accountId || !caseId) {
        errorToast('Account ID or Case ID is missing');
        throw new Error('Missing Account ID or Case ID');
      }

      return new Promise<void>((resolve, reject) => {
        deleteCommentMutation.mutate(
          {
            account_rid: accountId,
            case_rid: caseId,
            task_rid: '',
            rid: commentId,
            deleted_file_ids: [],
          },
          {
            onSuccess: () => {
              successToast('Comment deleted successfully');
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
    [accountId, caseId, successToast, errorToast, deleteCommentMutation]
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
              successToast('Collaborator added successfully');
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
    [accountId, caseId, addCollaboratorMutation, successToast, errorToast]
  );

  const filterFields =
    tabParam === 'case_task'
      ? getAssignGroupsFilterFields(memoizedStatus)
      : undefined;

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleSearchReset = () => {
    setResetSearch(false);
  };

  const getTitleIcon = () => {
    return (
      <CaseIcon
        alt='case-icon'
        className={`w-6 h-6 p-[5px] [&>path]:stroke-[#4ce547] bg-[#D2FFE3] !rounded-lg`}
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

  return (
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
        handleSorting={() => { }}
        sortFilterCount={0}
        setSortFilterCount={() => { }}
        showRefresh={tabParam === 'case_task' ? true : false}
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
      />
      <SectionHeaderTab
        tabs={tabs}
        onTabChange={handleTabChange}
        defaultValue={tabParam}
      />

      <div className='border border-t-0 border-[#CBD6E2]'>
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
                isLoading={isLoading}
                statusData={statusData}
                priorityData={priorityData}
                tagData={tagData}
                checklistData={checklistData}
                userData={userOptionsQuery.data || []}
                roleOptions={roleOptionsQuery.data || []}
                onTaskClick={setOpenTaskId}
                onCreateTask={handleCreateTask}
                onAddComment={handleAddComment}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
                onAddCollaborator={handleAddCollaborator}
                accountId={accountId || ''}
                caseId={caseId || ''}
              />
            )}

            {/* Clean Task Detail Modal – uses real React Query inside */}
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
                availableUsers={userOptionsQuery.data || []}
                roleOptions={roleOptionsQuery.data || []}
                checklistData={checklistData}
                fieldVisibility={{}}
                fieldDisabled={{}}
                onAddComment={handleAddComment}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
                onAddCollaborator={handleAddCollaborator}
              />
            )}
          </>
        )}
        {tabParam === 'case_task' && (
          <CaseTask
            caseId={caseId}
            reFetchData={Date.now()}
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
