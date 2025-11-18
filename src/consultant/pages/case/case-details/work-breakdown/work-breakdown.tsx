import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { CaseIcon } from '../../../../../assets';
import { SectionHeaderTab, SectionTabPanel } from '../../../../../components';
import SectionHeader from '../../../../../components/details-section/section-header';
import { ResourceTabs } from '../../../account-details-sidebar/sidebar-pages/resources/resources';
import { AllPermissions } from '../../../../../common-service';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import KanbanBoard from '../../../../../components/kanban-board/kanban-board';
import { useGetWorkBreakdownList } from '../../../../../hooks/use-work-breakdown';
import {
  getTaskDetail,
  fetchTaskActivities,
  useGetTaskPriorities,
  useGetTaskStatuses,
  fetchCollaborators,
} from '../../../../services/work-breakdown/work-breakdown-service';
import {
  fetchTaskCommentsList,
  fetchTaskAttachmentsList,
  useCreateCaseTask,
  CreateTaskPayload,
  addTaskComment,
  updateTaskComment,
  deleteTaskComment,
} from '../../../../services/case-task/case-task-service';
import {
  useGetUserOptions,
  useGetTagOptions,
  useGetRoleOptions,
} from '../../../../services/case-team/case-team-service';
import {
  transformActivities,
  transformComments,
  transformAttachments,
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

  const {
    data: kanbanData,
    isLoading,
    isError,
  } = useGetWorkBreakdownList(accountId || '', caseId || '');

  const userOptionsQuery = useGetUserOptions(accountId || '');
  const tagOptionsQuery = useGetTagOptions();
  const roleOptionsQuery = useGetRoleOptions();
  const prioritiesQuery = useGetTaskPriorities();
  const statusesQuery = useGetTaskStatuses();

  const tagData = transformTagData(tagOptionsQuery.data || []);

  const priorityData = useMemo(
    () => transformPriorityData(prioritiesQuery.data || []),
    [prioritiesQuery.data]
  );

  const statusData = useMemo(
    () => transformStatusData(statusesQuery.data || []),
    [statusesQuery.data]
  );

  const createTaskMutation = useCreateCaseTask();

  const tabParam = searchParams.get('tab') || 'milestone';
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [reFetchData, setReFetchData] = useState<number>(Date.now());
  const [count, setCount] = useState<number>(0);
  const [columnAnchorEl, setColumnAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);
  const [seachText, setSearchText] = useState('');
  const [resetSearch, setResetSearch] = useState(false);

  useEffect(() => {
    if (
      !searchParams.get('tab') &&
      searchParams.get('list') === 'workBreakdown'
    ) {
      searchParams.set('tab', 'milestone');
      navigate(`?${searchParams.toString()}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleSearchReset = () => {
    setResetSearch(false);
  };

  const memoizedStatus = useMemo(
    () =>
      statusesQuery?.data?.map((status) => ({
        option: status.task_status_name,
        value: status.rid,
      })) || [],
    [statusesQuery?.data]
  );

  const filterFields =
    tabParam === 'case_task'
      ? getAssignGroupsFilterFields(memoizedStatus)
      : undefined;

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
    setReFetchData(Date.now());
  };

  const handleColumnVisibility = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const handleCreateTask = useCallback(
    async (columnId: string, taskData: Partial<TaskCard>) => {
      if (!accountId || !caseId) {
        errorToast('Account ID or Case ID is missing');
        throw new Error('Missing Account ID or Case ID');
      }

      try {
        // Process tags - separate existing from new tags
        const existingTagRids: string[] = [];
        const newTags: string[] = [];

        if (taskData.tags) {
          taskData.tags.forEach((tagName: string) => {
            const existingTag = tagData?.find((t) => t.name === tagName);
            if (existingTag) {
              existingTagRids.push(existingTag.id);
            } else {
              newTags.push(tagName);
            }
          });
        }

        // Build tag_rid - can be single string or array of strings
        let tagRid: string | string[] | undefined;
        if (existingTagRids.length > 0) {
          tagRid =
            existingTagRids.length === 1 ? existingTagRids[0] : existingTagRids;
        }

        // Build tags array for new custom tags
        const tagsPayload =
          newTags.length > 0 ? newTags.map((name) => ({ name })) : undefined;

        // Build the complete API payload
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
          milestone_template_rid: columnId,
          checklist_template_rid: '',
        };

        // Add tag_rid if we have existing tags
        if (tagRid !== undefined) {
          taskPayload.tag_rid = tagRid;
          taskPayload.is_new_tag = false;
        }

        // Add tags array if we have new tags
        if (tagsPayload !== undefined) {
          taskPayload.tags = tagsPayload;
          taskPayload.is_new_tag = true;
        }

        // If no tags at all, set is_new_tag to false
        if (tagRid === undefined && tagsPayload === undefined) {
          taskPayload.is_new_tag = false;
        }

        console.log('Creating task with payload:', taskPayload);
        const response = await createTaskMutation.mutateAsync(taskPayload);

        if (response?.data?.rid) {
          successToast('Task created successfully');
          setReFetchData(Date.now());
        } else {
          throw new Error(response?.statusMessage || 'Failed to create task');
        }
      } catch (error) {
        const errorMessage =
          (error as { response?: { data?: { statusMessage?: string } } })
            ?.response?.data?.statusMessage ||
          (error as Error)?.message ||
          'Failed to create task';
        errorToast(errorMessage);
        console.error('Error creating task:', error);
        throw error;
      }
    },
    [accountId, caseId, tagData, createTaskMutation, successToast, errorToast]
  );

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

  const handleFetchTaskDetails = useCallback(
    async (taskId: string) => {
      console.log('handleFetchTaskDetails called for taskId:', taskId);
      if (!accountId || !caseId) {
        console.warn('Account ID or Case ID is missing');
        return null;
      }

      try {
        const taskData = await getTaskDetail(accountId, caseId, taskId);

        if (!taskData) {
          return null;
        }

        return taskData;
      } catch (error) {
        console.error('Failed to fetch task details:', error);
        return null;
      }
    },
    [accountId, caseId]
  );

  const handleFetchTaskActivities = useCallback(
    async (taskId: string) => {
      if (!accountId || !caseId) {
        console.warn('Missing Account ID or Case ID is missing');
        return [];
      }

      try {
        const activitiesData = await fetchTaskActivities(
          accountId,
          caseId,
          taskId
        );

        const transformedActivities = transformActivities(activitiesData);

        return transformedActivities;
      } catch (error) {
        console.error('Failed to fetch task activities:', error);
        return [];
      }
    },
    [accountId, caseId]
  );

  const handleFetchTaskComments = useCallback(
    async (taskId: string) => {
      if (!accountId || !caseId) {
        return [];
      }
      try {
        const commentsResponse = await fetchTaskCommentsList({
          account_rid: accountId,
          case_rid: caseId,
          task_rid: taskId,
          page: 1,
          limit: 100,
        });

        const transformedComments = transformComments(
          commentsResponse?.data?.data || []
        );
        return transformedComments;
      } catch (error) {
        console.error('Failed to fetch task comments:', error);
        return [];
      }
    },
    [accountId, caseId]
  );

  const handleFetchTaskAttachments = useCallback(
    async (taskId: string) => {
      if (!accountId || !caseId) {
        return [];
      }
      try {
        const attachmentsResponse = await fetchTaskAttachmentsList({
          account_rid: accountId,
          case_rid: caseId,
          task_rid: taskId,
          page: 1,
          limit: 100,
        });

        const transformedAttachments = transformAttachments(
          attachmentsResponse?.data?.data || []
        );
        return transformedAttachments;
      } catch (error) {
        console.error('Failed to fetch task attachments:', error);
        return [];
      }
    },
    [accountId, caseId]
  );

  const handleFetchCollaborators = useCallback(
    async (taskId: string) => {
      if (!accountId || !caseId) {
        console.warn('Account ID or Case ID is missing');
        return [];
      }

      try {
        const collaboratorsData = await fetchCollaborators(
          accountId,
          caseId,
          taskId
        );

        return collaboratorsData;
      } catch (error) {
        console.error('Failed to fetch collaborators:', error);
        return [];
      }
    },
    [accountId, caseId]
  );

  const handleAddComment = useCallback(
    async (taskId: string, commentText: string) => {
      if (!accountId || !caseId) {
        errorToast('Account ID or Case ID is missing');
        throw new Error('Missing Account ID or Case ID');
      }

      try {
        await addTaskComment({
          account_rid: accountId,
          case_rid: caseId,
          task_rid: taskId,
          comments: commentText,
        });

        // Refetch comments to get the updated list (will be displayed by TaskDetailModal)
        await fetchTaskCommentsList({
          account_rid: accountId,
          case_rid: caseId,
          task_rid: taskId,
          page: 1,
          limit: 100,
        });

        successToast('Comment added successfully');
      } catch (error) {
        const errorMessage =
          (error as { response?: { data?: { statusMessage?: string } } })
            ?.response?.data?.statusMessage ||
          (error as Error)?.message ||
          'Failed to add comment';
        errorToast(errorMessage);
        console.error('Error adding comment:', error);
        throw error;
      }
    },
    [accountId, caseId, successToast, errorToast]
  );

  const handleUpdateComment = useCallback(
    async (commentId: string, commentText: string) => {
      if (!accountId || !caseId) {
        errorToast('Account ID or Case ID is missing');
        throw new Error('Missing Account ID or Case ID');
      }

      try {
        await updateTaskComment({
          account_rid: accountId,
          case_rid: caseId,
          task_rid: '',
          rid: commentId,
          comments: commentText,
        });

        successToast('Comment updated successfully');
      } catch (error) {
        const errorMessage =
          (error as { response?: { data?: { statusMessage?: string } } })
            ?.response?.data?.statusMessage ||
          (error as Error)?.message ||
          'Failed to update comment';
        errorToast(errorMessage);
        console.error('Error updating comment:', error);
        throw error;
      }
    },
    [accountId, caseId, successToast, errorToast]
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!accountId || !caseId) {
        errorToast('Account ID or Case ID is missing');
        throw new Error('Missing Account ID or Case ID');
      }

      try {
        await deleteTaskComment({
          account_rid: accountId,
          case_rid: caseId,
          task_rid: '',
          rid: commentId,
          deleted_file_ids: [],
        });

        successToast('Comment deleted successfully');
      } catch (error) {
        const errorMessage =
          (error as { response?: { data?: { statusMessage?: string } } })
            ?.response?.data?.statusMessage ||
          (error as Error)?.message ||
          'Failed to delete comment';
        errorToast(errorMessage);
        console.error('Error deleting comment:', error);
        throw error;
      }
    },
    [accountId, caseId, successToast, errorToast]
  );

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
        handleSorting={() => {}}
        sortFilterCount={0}
        setSortFilterCount={() => {}}
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
                onFetchTaskDetails={handleFetchTaskDetails}
                onFetchTaskActivities={handleFetchTaskActivities}
                onFetchTaskComments={handleFetchTaskComments}
                onFetchTaskAttachments={handleFetchTaskAttachments}
                onFetchCollaborators={handleFetchCollaborators}
                showCommentCount={true}
                showTaskCount={true}
                showProfileIndicator={true}
                isDragable={true}
                isLoading={isLoading}
                statusData={statusData}
                priorityData={priorityData}
                tagData={tagData}
                userData={userOptionsQuery.data || []}
                roleOptions={roleOptionsQuery.data || []}
                onCreateTask={handleCreateTask}
                onAddComment={handleAddComment}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
              />
            )}
          </>
        )}
        {tabParam === 'case_task' && (
          <CaseTask
            caseId={caseId}
            reFetchData={reFetchData}
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
