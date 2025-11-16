import { caseServiceApi } from '../../../api/api';
import {
  getWorkBreakdownURL,
  getTaskDetailURL,
} from '../urls/work-breakdown-url';
import { Task, Assignee } from '../../../components/kanban-board/types';

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
}

export const getKanbanBoardData = async (
  accountId: string,
  caseId: string
): Promise<KanbanBoardData> => {
  const url = getWorkBreakdownURL(accountId, caseId);
  const response = await caseServiceApi.get<KanbanBoardData>(url);
  return response.data;
};

export interface TaskDetailResponse {
  rid: string;
  task_name: string;
  task_description?: string;
  status_rid: string;
  status_name: string;
  priority_rid: string;
  priority_name: string;
  assigned_to?: string;
  assigned_to_name?: string;
  effective_start_datetime?: string;
  effective_end_datetime?: string;
  effort_in_days: number;
  reminder_interval: number;
  checklist_items?: Array<{ id: string; text: string; completed: boolean }>;
  collaborators?: Assignee[];
  activities?: Array<{
    id?: string;
    user: string;
    action: string;
    date: string;
    link?: string;
  }>;
  attachments?: string[];
  tags?: string[];
  created_at?: string;
  created_by?: string;
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
    hash = hash & hash; // Convert to 32bit integer
  }

  return colors[Math.abs(hash) % colors.length];
};

export const getTaskDetail = async (
  accountId: string,
  caseId: string,
  taskId: string
): Promise<Task | null> => {
  console.log('account Id : ', accountId);
  console.log('case Id : ', caseId);

  // MOCK DATA
  const assigneeName = 'John Doe';
  const collaboratorNames = ['Jane Smith', 'Mike Johnson'];

  const mockTask: Task = {
    id: taskId,
    title: 'Schedule Team Meetings internally',
    status: 'In Progress' as const,
    priority: 'Medium' as const,
    assignee: {
      name: assigneeName,
      initials: generateInitials(assigneeName),
      color: generateColorFromName(assigneeName),
    },
    description: 'Reviewing the projects which are added to Cases',
    commentCount: 2,
    createdAt: new Date('2025-11-05'),
    checklist: [
      { id: '1', text: 'Prepare agenda', completed: true },
      { id: '2', text: 'Send invites', completed: true },
      { id: '3', text: 'Setup meeting room', completed: false },
      { id: '4', text: 'Test audio/video', completed: false },
    ],
    tags: ['Meeting', 'Internal'],
    collaborators: collaboratorNames.map((name) => ({
      name,
      initials: generateInitials(name),
      color: generateColorFromName(name),
    })),
    startDate: new Date('2025-11-05'),
    endDate: new Date('2025-11-08'),
    attachments: [],
    commentAttachments: [],
    activities: [
      {
        id: '1',
        user: 'John Doe',
        action: 'created this task',
        date: '2 days ago',
      },
      {
        id: '2',
        user: 'Jane Smith',
        action: 'marked checklist item as complete',
        date: '1 day ago',
      },
    ],
    sequenceNo: 1,
  };

  return mockTask;

  /* COMMENTED OUT - API Implementation (uncomment when backend is ready)
  try {
    const url = getTaskDetailURL(accountId, caseId, taskId);
    const response = await caseServiceApi.get<TaskDetailResponse>(url);

    if (!response.data) {
      return null;
    }

    // Transform API response to Task interface
    const apiTask = response.data;
    
    // Generate initials and color from assignee name
    const assigneeName = apiTask.assigned_to_name || 'Unassigned';
    const assigneeInitials = generateInitials(assigneeName);
    const assigneeColor = generateColorFromName(assigneeName);
    
    // Generate initials and colors for collaborators
    const collaborators = (apiTask.collaborators || []).map((collab) => ({
      name: collab.name,
      initials: generateInitials(collab.name),
      color: generateColorFromName(collab.name),
    }));
    
    const task: Task = {
      id: apiTask.rid,
      title: apiTask.task_name,
      status: (apiTask.status_name || 'To Do') as
        | 'To Do'
        | 'In Progress'
        | 'Done',
      priority: (apiTask.priority_name || 'Medium') as
        | 'Lowest'
        | 'Low'
        | 'Medium'
        | 'High'
        | 'Highest',
      assignee: {
        name: assigneeName,
        initials: assigneeInitials,
        color: assigneeColor,
      },
      description: apiTask.task_description,
      commentCount: 0,
      createdAt: apiTask.created_at ? new Date(apiTask.created_at) : new Date(),
      checklist: apiTask.checklist_items || [],
      tags: apiTask.tags || [],
      collaborators,
      startDate: apiTask.effective_start_datetime
        ? new Date(apiTask.effective_start_datetime)
        : undefined,
      endDate: apiTask.effective_end_datetime
        ? new Date(apiTask.effective_end_datetime)
        : undefined,
      attachments: apiTask.attachments || [],
      commentAttachments: [],
      activities: apiTask.activities || [],
      sequenceNo: apiTask.sequence_no,
    };

    return task;
  } catch (error) {
    console.error(`Error fetching task details for ${taskId}:`, error);
    return null;
  }
  */
};

export const fetchTaskDetail = async (
  accountId: string,
  caseId: string,
  taskId: string
): Promise<TaskDetailResponse> => {
  try {
    const url = getTaskDetailURL(accountId, caseId, taskId);
    const response = await caseServiceApi.get<TaskDetailResponse>(url);
    return response.data;
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
