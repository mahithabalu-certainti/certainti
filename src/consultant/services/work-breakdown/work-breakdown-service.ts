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

/**
 * Fetch task details from API and transform to Task interface
 * @param accountId - Account ID
 * @param caseId - Case ID
 * @param taskId - Task ID (rid)
 * @returns Task object or null if not found
 */
export const getTaskDetail = async (
  accountId: string,
  caseId: string,
  taskId: string
): Promise<Task | null> => {
  console.log('account Id : ', accountId);
  console.log('case Id : ', caseId);
  // TODO: Remove mock data and uncomment API implementation when backend is ready
  // MOCK DATA - Remove this section and uncomment the API call below
  const mockTask: Task = {
    id: taskId,
    title: 'Schedule Team Meetings internally',
    status: 'In Progress' as const,
    priority: 'Medium' as const,
    assignee: {
      name: 'John Doe',
      initials: 'JD',
      color: '#3B82F6',
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
    collaborators: [
      { name: 'Jane Smith', initials: 'JS', color: '#10B981' },
      { name: 'Mike Johnson', initials: 'MJ', color: '#F59E0B' },
    ],
    startDate: new Date('2025-11-05'),
    endDate: new Date('2025-11-08'),
    attachments: ['agenda.pdf', 'minutes.docx'],
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

  /* API Implementation 
  try {
    const url = getTaskDetailURL(accountId, caseId, taskId);
    const response = await caseServiceApi.get<TaskDetailResponse>(url);

    if (!response.data) {
      return null;
    }

    // Transform API response to Task interface
    const apiTask = response.data;
    const task: Task = {
      id: apiTask.rid,
      title: apiTask.task_name,
      status: (apiTask.status_name || 'To Do') as
        | 'To Do'
        | 'In Progress'
        | 'Done',
      priority: (apiTask.priority_name || 'Medium') as
        | 'Low'
        | 'Medium'
        | 'High',
      assignee: {
        name: apiTask.assigned_to_name || 'Unassigned',
        initials: (apiTask.assigned_to_name || 'U')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase(),
        color: '#3B82F6',
      },
      description: apiTask.task_description,
      commentCount: 0,
      createdAt: apiTask.created_at ? new Date(apiTask.created_at) : new Date(),
      checklist: apiTask.checklist_items || [],
      tags: apiTask.tags || [],
      collaborators: apiTask.collaborators || [],
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
