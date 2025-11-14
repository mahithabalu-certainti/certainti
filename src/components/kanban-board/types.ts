export interface Assignee {
  name: string;
  initials: string;
  color: string;
}

export interface User extends Assignee {
  id: string;
}

export interface Activity {
  id?: string;
  user: string;
  action: string;
  date: string;
  link?: string;
}

export interface Comment {
  id?: string;
  user: string;
  text: string;
  date: string;
  initials?: string;
  color?: string;
  attachments?: string[];
}

// New interface for simple status options (active/inactive)
export interface StatusOption {
  label: string;
  value: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'To Do' | 'In Progress' | 'Done';
  priority?: 'Low' | 'Medium' | 'High';
  assignee: Assignee;
  commentCount: number;
  createdAt: Date;
  description?: string;
  checklist?: Array<{ id: string; text: string; completed: boolean }>;
  tags?: string[];
  collaborators?: Assignee[];
  startDate?: Date;
  endDate?: Date;
  attachments?: string[];
  commentAttachments?: string[];
  activities?: Activity[];
  sequenceNo?: number;
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
  task_status_name?: string;
}

export interface KanbanColumn {
  rid: string;
  milestone_name: string;
  tasks: TaskCard[];
  task_count: number;
}

export interface FieldVisibility {
  assignee?: boolean;
  status?: boolean;
  priority?: boolean;
  tags?: boolean;
  startDate?: boolean;
  endDate?: boolean;
  description?: boolean;
  attachments?: boolean;
  comments?: boolean;
  collaborators?: boolean;
  checklist?: boolean;
  activities?: boolean;
}

export interface FieldDisabled {
  assignee?: boolean;
  status?: boolean;
  priority?: boolean;
  tags?: boolean;
  startDate?: boolean;
  endDate?: boolean;
  description?: boolean;
  attachments?: boolean;
  comments?: boolean;
  collaborators?: boolean;
  checklist?: boolean;
}

export interface UserOption {
  rid: string;
  name: string;
  email?: string;
  status?: string;
}

export interface KanbanBoardProps {
  data: KanbanColumn[];
  isCreateTaskDisabled?: boolean;
  isCreateTaskHide?: boolean;
  showCommentCount?: boolean;
  showTaskCount?: boolean;
  showProfileIndicator?: boolean;
  statusData?: Array<{ id: string; name: string; color: string }>;
  statusOptions?: StatusOption[]; // New prop for active/inactive status
  priorityData?: Array<{ id: string; name: string; color: string }>;
  tagData?: Array<{ id: string; name: string; color: string }>;
  userData?: UserOption[];
  isDragable?: boolean;
  isDragablebetweenBoards?: boolean;
  onFetchTaskDetails?: (taskId: string) => Promise<Task | null>;
  onFetchTaskActivities?: (taskId: string) => Promise<Activity[]>;
  fieldVisibility?: FieldVisibility;
  fieldDisabled?: FieldDisabled;
  isLoading?: boolean;
}

export interface TaskCardProps {
  taskId: string;
  showCommentCount?: boolean;
  showProfileIndicator?: boolean;
  onEditTask?: (taskId: string, newTitle: string) => void;
  onTaskClick?: (taskId: string) => void;
  statusData?: Array<{ id: string; name: string; color: string }>;
  statusOptions?: StatusOption[]; // New prop for active/inactive status
  priorityData?: Array<{ id: string; name: string; color: string }>;
  onTaskUpdate?: (taskId: string, updatedTask: Partial<Task>) => void;
}

export interface KanbanColumnProps {
  column: KanbanColumn;
  showTaskCount?: boolean;
  showCommentCount?: boolean;
  showProfileIndicator?: boolean;
  isCreateTaskDisabled?: boolean;
  isCreateTaskHide?: boolean;
  onAddTask: (
    columnId: string,
    task?: TaskCard,
    position?: 'top' | 'bottom'
  ) => void;
  onRenameColumn?: (columnId: string, newName: string) => void;
  onDeleteColumn?: (columnId: string) => void;
  onEditTask?: (taskId: string, newTitle: string) => void;
  onTaskClick?: (taskId: string) => void;
  statusData?: Array<{ id: string; name: string; color: string }>;
  statusOptions?: StatusOption[]; // New prop for active/inactive status
  priorityData?: Array<{ id: string; name: string; color: string }>;
  onTaskUpdate?: (taskId: string, updatedTask: Partial<Task>) => void;
  onFetchTaskDetails?: (taskId: string) => Promise<Task | null>;
}

export interface TaskDetailModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: (taskId: string, updatedTask: Partial<Task>) => void;
  statusData?: Array<{ id: string; name: string; color: string }>;
  statusOptions?: StatusOption[]; // New prop for active/inactive status
  priorityData?: Array<{ id: string; name: string; color: string }>;
  tagData?: Array<{ id: string; name: string; color: string }>;
  availableUsers?: UserOption[];
  onFetchTaskDetails?: (taskId: string) => Promise<Task | null>;
  onFetchTaskActivities?: (taskId: string) => Promise<Activity[]>;
  onFetchTaskComments?: (taskId: string) => Promise<Comment[]>;
  fieldVisibility?: FieldVisibility;
  fieldDisabled?: FieldDisabled;
}
