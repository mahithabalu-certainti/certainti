import { caseServiceApi } from '../../../api/api';
import {
  getWorkBreakdownURL,
  getTaskDetailURL,
} from '../urls/work-breakdown-url';
import type { Task } from '../../../components/kanban-board/types';
import { useQuery, useMutation } from '@tanstack/react-query';

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
  case_rid: string;
  account_rid: string;
  rid: string;
  user_rid: string;
  action_type?: string;
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
  taskId: string
): Promise<Task | null> => {
  try {
    // Fetch task details from API
    const taskDetailResponse = await fetchTaskDetail(accountId, caseId, taskId);

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
      createdBy: taskDetailResponse.created_by_name,
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
      tags: taskDetailResponse.tags || [],
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
    };

    return task;
  } catch (error) {
    console.error(`Error fetching task details for ${taskId}:`, error);
    return null;
  }
};

export const fetchTaskDetail = async (
  accountId: string,
  caseId: string,
  taskId: string
): Promise<TaskDetailResponse> => {
  try {
    const url = getTaskDetailURL();
    const payload = {
      task_rid: taskId,
      account_rid: accountId,
      case_rid: caseId,
    };
    const response = await caseServiceApi.post<{
      statusCode: number;
      statusCodeValue: string;
      statusMessage: string;
      data: TaskDetailResponse;
    }>(url, payload);

    return response.data.data;
  } catch (error) {
    console.error(`Error fetching task details for ${taskId}:`, error);
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
    console.error(`Error fetching task activities for ${taskId}:`, error);
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
}

export interface CollaboratorsResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: CollaboratorData[];
}
export const fetchCollaborators = async (
  accountId: string,
  caseId: string,
  taskId: string
): Promise<CollaboratorData[]> => {
  try {
    const payload = {
      case_rid: caseId,
      account_rid: accountId,
      rid: taskId,
    };
    const response = await caseServiceApi.post<CollaboratorsResponse>(
      '/api/cases/task/collaborator/list',
      payload
    );

    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching collaborators for task ${taskId}:`, error);
    return [];
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
export const useAddCollaborator = () => {
  return useMutation({
    mutationFn: (payload: AddCollaboratorPayload) => addCollaborator(payload),
    onError: (error) => {
      console.error('Failed to add collaborator:', error);
    },
    onSuccess: (data) => {
      console.log('Collaborator added successfully:', data);
    },
  });
};

export const useGetTaskPriorities = () => {
  return useQuery({
    queryKey: ['taskPriorities'],
    queryFn: fetchTaskPriorities,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
};

export const useGetTaskStatuses = () => {
  return useQuery({
    queryKey: ['taskStatuses'],
    queryFn: fetchTaskStatuses,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
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
    retry: false,
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
    retry: 0,
  });
};

export const useGetCollaborators = (
  accountId: string,
  caseId: string,
  taskId: string,
  enabled: boolean = true
): ReturnType<typeof useQuery<CollaboratorData[], Error>> => {
  return useQuery<CollaboratorData[], Error>({
    queryKey: ['collaborators', accountId, caseId, taskId],
    queryFn: () => fetchCollaborators(accountId, caseId, taskId),
    enabled: enabled && !!accountId && !!caseId && !!taskId,
    retry: false,
  });
};

export const useGetTaskDetail = (
  accountId: string,
  caseId: string,
  taskId: string,
  enabled: boolean = true
): ReturnType<typeof useQuery<Task | null, Error>> => {
  return useQuery<Task | null, Error>({
    queryKey: ['taskDetail', accountId, caseId, taskId],
    queryFn: () => getTaskDetail(accountId, caseId, taskId),
    enabled: enabled && !!accountId && !!caseId && !!taskId,
    retry: false,
  });
};
