import { caseServiceApi } from '../../../api/api';
import {
  getWorkBreakdownURL,
  getTaskDetailURL,
} from '../urls/work-breakdown-url';
import {
  normalizeTags,
  normalizeTagsDetails,
} from '../../../components/kanban-board/helper';
import type { Task } from '../../../components/kanban-board/types';
import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';

export interface KanbanBoardData {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: KanbanColumn[];
}

export interface KanbanColumn {
  rid: string;
  milestone_name: string;
  tasks: TaskCard[];
  task_count: number;
}

export interface AddCollaboratorPayload {
  case_rid?: string;
  account_rid: string;
  rid: string;
  user_rid: string;
  action_type?: string;
  task_type?: string;
}
export interface AddCollaboratorResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data?: {
    rid?: string;
    [key: string]: unknown;
  };
}

type Tag = {
  rid: string;
  tag_name: string;
};

export interface TaskCard {
  rid: string;
  sequence_no: number;
  r_number: string;
  task_name: string;
  created_by: string;
  status_rid: string;
  assigned_to: string | null;
  priority_rid: string;
  task_type_rid: string;
  effort_in_days: number;
  checklists_count: number;
  completed_checklist_items_count: number;
  comments_count: number;
  task_description: string | null;
  reminder_interval: number;
  effective_end_datetime: string;
  effective_start_datetime: string;
  case_team_member_role_rid: string;
  milestone_template_rid: string;
  priority_name: string;
  assigned_to_name: string | null;
  case_team_member_role_name: string;
  task_type_name: string;
  status_name: string;
  task_status_rid: string;
  task_status_name: string;
  profile_url: string | null;
  attachment_count?: number | null;
  tags?: string[] | Tag[];
  is_flagged?: boolean;
}
export interface TaskDetailResponse {
  rid: string;
  r_number: string;
  task_name: string;
  created_by: string;
  created_by_name: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  modified_by?: string;
  modified_by_name?: string;
  priority_rid: string;
  priority_name: string;
  task_status_rid: string;
  task_status_name: string;
  created_datetime: string;
  task_description?: string;
  effective_start_datetime?: string;
  effective_end_datetime?: string;
  is_flagged?: boolean;
  checklists?: {
    rid: string;
    task_rid: string;
    checklist_name: string;
    checklist_description: string;
    checklist_items_count: number;
    completed_items_count: number;
    checklist_items: Array<{
      rid: string;
      status_rid: string;
      checklist_item_status_name: string;
      checklist_item_name: string;
      checklist_item_description: string | null;
    }>;
  };
  effort_in_days?: number;
  reminder_interval?: number;
  collaborators?: Array<{ name: string }>;
  activities?: Array<{
    id?: string;
    user: string;
    action: string;
    date: string;
    link?: string;
  }>;
  attachments?: string[];
  tags?: string[];
  case_team_member_role_name?: string;
  task_type_name?: string;
  case_team_member_role_rid?: string;
  milestone_template_rid?: string;
  sequence_no?: number;
  weightage_rid?: string;
  weightage_value?: number;
  task_category_rid?: string;
  task_category_name?: string;
  workflow_connector?: Array<{
    rid: string;
    source_rid: string;
    target_rid: string;
    relationship_connector_rid: string;
    source_task_name: string;
    target_task_name: string;
    relationship_name: string;
  }>;
  fiscal_year?: string;
}

// Helper function to generate initials from name
const generateInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Helper function to generate a color based on name (consistent for same name)
const generateColorFromName = (name: string): string => {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash = hash & hash;
  }

  return colors[Math.abs(hash) % colors.length];
};

export const getTaskDetail = async (
  accountId: string,
  caseId: string,
  taskId: string,
  taskType?: string
): Promise<Task | null> => {
  try {
    // Fetch task details from API
    const taskDetailResponse = await fetchTaskDetail(
      accountId,
      caseId,
      taskId,
      taskType
    );

    if (!taskDetailResponse) {
      return null;
    }

    // Generate initials and color from assignee name
    const assigneeName = taskDetailResponse.assigned_to_name || 'Unassigned';
    const assigneeInitials = generateInitials(assigneeName);
    const assigneeColor = generateColorFromName(assigneeName);

    // Transform checklist items from API response
    const checklistItems =
      taskDetailResponse.checklists?.checklist_items?.map((item) => ({
        id: item.rid,
        text: item.checklist_item_name,
        completed: item.checklist_item_status_name === 'Done',
      })) || [];

    const task: Task = {
      id: taskDetailResponse.rid,
      r_number: taskDetailResponse.r_number,
      title: taskDetailResponse.task_name,
      status: taskDetailResponse.task_status_name,
      priority: taskDetailResponse.priority_name,
      assignee: {
        name: assigneeName,
        initials: assigneeInitials,
        color: assigneeColor,
      },
      is_flagged: taskDetailResponse?.is_flagged,
      createdBy: taskDetailResponse.created_by_name,
      created_by_rid: taskDetailResponse.created_by,
      modifiedBy: taskDetailResponse.modified_by_name,
      description: taskDetailResponse.task_description,
      commentCount: 0,
      createdAt: taskDetailResponse.created_datetime
        ? new Date(taskDetailResponse.created_datetime)
        : new Date(),
      checklist: checklistItems,
      checklistName: taskDetailResponse.checklists?.checklist_name,
      checklistInfo: taskDetailResponse.checklists
        ? {
            rid: taskDetailResponse.checklists.rid,
            name: taskDetailResponse.checklists.checklist_name,
            description: taskDetailResponse.checklists.checklist_description,
            totalItems: taskDetailResponse.checklists.checklist_items_count,
            completedItems: taskDetailResponse.checklists.completed_items_count,
          }
        : undefined,
      tags: normalizeTags(taskDetailResponse.tags || []),
      tagsDetails: normalizeTagsDetails(taskDetailResponse.tags || []),
      collaborators: [],
      startDate: taskDetailResponse.effective_start_datetime
        ? new Date(taskDetailResponse.effective_start_datetime)
        : undefined,
      endDate: taskDetailResponse.effective_end_datetime
        ? new Date(taskDetailResponse.effective_end_datetime)
        : undefined,
      attachments: taskDetailResponse.attachments || [],
      commentAttachments: [],
      activities: taskDetailResponse.activities || [],
      sequenceNo: taskDetailResponse.sequence_no,
      statusRid: taskDetailResponse.task_status_rid,
      priorityRid: taskDetailResponse.priority_rid,
      caseTeamMemberRoleName: taskDetailResponse.case_team_member_role_name,
      weightage: taskDetailResponse.weightage_value?.toString(),
      weightageRid: taskDetailResponse.weightage_rid,
      category: taskDetailResponse.task_category_name,
      categoryRid: taskDetailResponse.task_category_rid,
      workflow_connector: taskDetailResponse.workflow_connector,
      linkedType:
        taskDetailResponse.workflow_connector &&
        taskDetailResponse.workflow_connector.length > 0
          ? taskDetailResponse.workflow_connector[0].relationship_name
          : undefined,
      linkTaskTypes:
        taskDetailResponse.workflow_connector &&
        taskDetailResponse.workflow_connector.length > 0
          ? taskDetailResponse.workflow_connector.map(
              (wc) => wc.target_task_name
            )
          : [],
      fiscal_year: taskDetailResponse.fiscal_year
        ? String(taskDetailResponse.fiscal_year)
        : undefined,
    };

    return task;
  } catch (error) {
    console.error(`Error fetching task details for ${taskId}: `, error);
    return null;
  }
};

export const fetchTaskDetail = async (
  accountId: string,
  caseId: string,
  taskId: string,
  taskType?: string
): Promise<TaskDetailResponse> => {
  try {
    const url = getTaskDetailURL();
    const payload = {
      task_rid: taskId,
      account_rid: accountId,
      ...(taskType && taskType !== 'milestone'
        ? { task_type: taskType }
        : { case_rid: caseId }),
    };
    const response = await caseServiceApi.post<{
      statusCode: number;
      statusCodeValue: string;
      statusMessage: string;
      data: TaskDetailResponse;
    }>(url, payload);

    return response.data.data;
  } catch (error) {
    console.error(`Error fetching task details for ${taskId}: `, error);
    throw error;
  }
};

export interface TaskActivity {
  rid: string;
  r_number: string;
  created_by: string;
  case_rid: string;
  created_datetime: string;
  attribute_name: string;
  old_value: string | null;
  new_value: string;
  task_rid: string;
  created_by_name: string;
  profile_url: string | null;
}

export interface TaskActivitiesData {
  page: number;
  limit: number;
  total_result: number;
  data: TaskActivity[];
}

export interface TaskActivitiesResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: TaskActivitiesData;
}

export const fetchTaskActivities = async (
  accountId: string,
  caseId: string,
  taskId: string
): Promise<TaskActivity[]> => {
  try {
    const payload = {
      page: 1,
      limit: 100,
      account_rid: accountId,
      case_rid: caseId,
      task_rid: taskId,
    };

    const response = await caseServiceApi.post<TaskActivitiesResponse>(
      '/api/cases/task/activity/list',
      payload
    );

    if (response.data?.data?.data) {
      return response.data.data.data;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching task activities for ${taskId}: `, error);
    return [];
  }
};

export interface PriorityData {
  rid: string;
  priority_name: string;
}

export interface StatusData {
  rid: string;
  task_status_name: string;
}

export interface PriorityResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: PriorityData[];
}

export interface StatusResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: StatusData[];
}

export const fetchTaskPriorities = async (): Promise<PriorityData[]> => {
  try {
    const response = await caseServiceApi.get<PriorityResponse>(
      '/api/cases/task/priority'
    );

    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching task priorities:', error);
    return [];
  }
};

export const fetchTaskStatuses = async (): Promise<StatusData[]> => {
  try {
    const response = await caseServiceApi.get<StatusResponse>(
      '/api/cases/task/status'
    );

    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching task statuses:', error);
    return [];
  }
};
export interface CollaboratorData {
  assigned_to: string;
  assigned_to_name: string;
  profile_url: string | null;
}

export interface CollaboratorsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: CollaboratorData[];
}
export const fetchCollaborators = async (
  accountId: string,
  caseId: string | undefined,
  taskId: string,
  taskType?: string
): Promise<CollaboratorData[]> => {
  try {
    const payload: Record<string, unknown> = {
      account_rid: accountId,
      rid: taskId,
    };

    if (caseId) {
      payload.case_rid = caseId;
    }

    if (taskType) {
      payload.task_type = taskType;
    }

    const response = await caseServiceApi.post<CollaboratorsResponse>(
      '/api/cases/task/collaborator/list',
      payload
    );

    if (response.data && response.data.data) {
      const collaboratorsList = response.data.data;
      if (Array.isArray(collaboratorsList)) {
        return collaboratorsList;
      }
    }
    console.log('No collaborators data found in response:', response.data);
    return [];
  } catch (error) {
    console.error(`Error fetching collaborators for task ${taskId}: `, error);
    throw error;
  }
};
export const getKanbanBoardData = async (
  accountId: string,
  caseId: string
): Promise<KanbanBoardData> => {
  const url = getWorkBreakdownURL(accountId, caseId);
  const response = await caseServiceApi.get<KanbanBoardData>(url);
  if (response.data?.data) {
    response.data.data = response.data.data.map((column) => ({
      ...column,
      tasks: column.tasks.map((task) => ({
        ...task,
        task_status_name: task.task_status_name || task.status_name || '',
      })),
    }));
  }

  return response.data;
};

export const addCollaborator = async (
  payload: AddCollaboratorPayload
): Promise<AddCollaboratorResponse> => {
  try {
    const enrichedPayload = {
      ...payload,
      action_type: payload.action_type || 'milestone',
    };
    const response = await caseServiceApi.post<AddCollaboratorResponse>(
      '/api/cases/task/collaborator/add',
      enrichedPayload
    );
    return response.data;
  } catch (error) {
    console.error('Error adding collaborator:', error);
    throw error;
  }
};
export const useAddCollaborator = (options?: {
  onSuccess?: (data: AddCollaboratorResponse) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (payload: AddCollaboratorPayload) => addCollaborator(payload),
    onSuccess: (data) => {
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      console.error('Failed to add collaborator:', error);
      if (options?.onError) {
        options.onError(error);
      }
    },
  });
};

export const useGetTaskPriorities = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['taskPriorities'],
    queryFn: fetchTaskPriorities,
    enabled: enabled,
  });
};

export const useGetTaskStatuses = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['taskStatuses'],
    queryFn: fetchTaskStatuses,
    enabled: enabled,
    staleTime: Infinity, // Cache data forever until manually invalidated
    gcTime: Infinity, // Never delete from cache
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};

export const useGetWorkBreakdownList = (
  accountId: string,
  caseId: string
): ReturnType<typeof useQuery<KanbanBoardData, Error>> => {
  return useQuery<KanbanBoardData, Error>({
    queryKey: ['kanbanBoardData', accountId, caseId],
    queryFn: () => getKanbanBoardData(accountId, caseId),
    enabled: !!accountId && !!caseId,
  });
};
export const useGetTaskActivities = (
  accountId: string,
  caseId: string,
  taskId: string,
  enabled: boolean = true
): ReturnType<typeof useQuery<TaskActivity[], Error>> => {
  return useQuery<TaskActivity[], Error>({
    queryKey: ['taskActivities', accountId, caseId, taskId],
    queryFn: () => fetchTaskActivities(accountId, caseId, taskId),
    enabled: enabled && !!accountId && !!caseId && !!taskId,
  });
};

// Fetch Task Activities with Pagination
export interface TaskActivitiesListParams {
  account_rid: string;
  case_rid?: string;
  task_rid: string;
  page: number;
  limit: number;
  task_type?: string;
}

export const fetchTaskActivitiesWithPagination = async (
  params: TaskActivitiesListParams
): Promise<TaskActivitiesResponse> => {
  try {
    const payload: Record<string, unknown> = {
      account_rid: params.account_rid,
      task_rid: params.task_rid,
      page: params.page,
      limit: params.limit,
    };

    if (params.case_rid) {
      payload.case_rid = params.case_rid;
    }

    if (params.task_type) {
      payload.task_type = params.task_type;
    }

    const response = await caseServiceApi.post<TaskActivitiesResponse>(
      '/api/cases/task/activity/list',
      payload
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching task activities:', error);
    throw error;
  }
};

// Infinite Scrolling Task Activities (Limit: 5 per page)
export interface InfiniteTaskActivitiesParams {
  case_rid?: string;
  account_rid: string;
  task_rid: string;
  task_type?: string;
}

export const useInfiniteTaskActivities = (
  params: InfiniteTaskActivitiesParams,
  options?: {
    enabled?: boolean;
  }
) => {
  return useInfiniteQuery<TaskActivitiesResponse, Error>({
    queryKey: ['taskActivitiesInfinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetchTaskActivitiesWithPagination({
        account_rid: params.account_rid,
        case_rid: params.case_rid,
        task_rid: params.task_rid,
        task_type: params.task_type,
        page: pageParam as number,
        limit: 5, // Load 5 activities per page
      });
      return response;
    },
    getNextPageParam: (
      lastPage: TaskActivitiesResponse,
      allPages: TaskActivitiesResponse[]
    ) => {
      // If the last page has no data, there are no more pages.
      if (!lastPage.data.data || lastPage.data.data.length === 0) {
        return undefined;
      }

      // If the number of records in the last page is less than the limit,
      // it means we've reached the end.
      if (lastPage.data.data.length < 5) {
        return undefined;
      }

      // Otherwise, return the next page number
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 0,
    gcTime: 0,
    retry: 0,
    enabled: !!(
      params.account_rid &&
      params.task_rid &&
      options?.enabled !== false
    ),
  });
};
export const useGetCollaborators = (
  accountId: string,
  caseId: string | undefined,
  taskId: string,
  enabled: boolean = true,
  taskType?: string
): ReturnType<typeof useQuery<CollaboratorData[], Error>> => {
  return useQuery<CollaboratorData[], Error>({
    queryKey: ['collaborators', accountId, caseId, taskId, taskType],
    queryFn: () => fetchCollaborators(accountId, caseId, taskId, taskType),
    enabled: enabled && !!accountId && !!taskId,
  });
};

export const useGetTaskDetail = (
  accountId: string,
  caseId: string,
  taskId: string,
  enabled: boolean = true,
  taskType?: string
): ReturnType<typeof useQuery<Task | null, Error>> => {
  return useQuery<Task | null, Error>({
    queryKey: ['taskDetail', accountId, caseId, taskId, taskType],
    queryFn: () => getTaskDetail(accountId, caseId, taskId, taskType),
    enabled: enabled && !!accountId && (!!caseId || !!taskType) && !!taskId,
  });
};
export const useGetTaskDetailData = (
  accountId: string,
  caseId: string,
  taskId: string,
  enabled: boolean = true,
  taskType?: string
): ReturnType<typeof useQuery<TaskDetailResponse | null, Error>> => {
  return useQuery<TaskDetailResponse | null, Error>({
    queryKey: ['taskDetailData', accountId, caseId, taskId, taskType],
    queryFn: async () => {
      try {
        return await fetchTaskDetail(accountId, caseId, taskId, taskType);
      } catch (error) {
        console.error(`Error fetching task detail data for ${taskId}: `, error);
        return null;
      }
    },
    enabled: enabled && !!accountId && (!!caseId || !!taskType) && !!taskId,
  });
};

export interface UpdateChecklistStatusPayload {
  task_rid: string;
  case_rid?: string;
  account_rid: string;
  checklist_rid: string;
  rid: string;
  status_rid: string;
}

export const updateChecklistStatus = async (
  payload: UpdateChecklistStatusPayload
) => {
  const response = await caseServiceApi.put(
    '/api/cases/task/checklist/status',
    payload
  );
  return response.data;
};

export interface DeleteCollaboratorPayload {
  case_rid?: string;
  account_rid: string;
  rid: string;
  assigned_to: string;
  task_type?: string;
}

export interface DeleteCollaboratorResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data?: {
    rid?: string;
    [key: string]: unknown;
  };
}

export const deleteCollaborator = async (
  payload: DeleteCollaboratorPayload
): Promise<DeleteCollaboratorResponse> => {
  try {
    const requestPayload: Record<string, unknown> = {
      account_rid: payload.account_rid,
      rid: payload.rid,
      assigned_to: payload.assigned_to,
    };

    if (payload.case_rid) {
      requestPayload.case_rid = payload.case_rid;
    }

    if (payload.task_type) {
      requestPayload.task_type = payload.task_type;
    }

    const response = await caseServiceApi.post<DeleteCollaboratorResponse>(
      '/api/cases/task/collaborator/delete',
      requestPayload
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting collaborator:', error);
    throw error;
  }
};

export const useDeleteCollaborator = (options?: {
  onSuccess?: (data: DeleteCollaboratorResponse) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (payload: DeleteCollaboratorPayload) =>
      deleteCollaborator(payload),
    onSuccess: (data) => {
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      console.error('Failed to delete collaborator:', error);
      if (options?.onError) {
        options.onError(error);
      }
    },
  });
};
