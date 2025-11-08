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

export interface TaskDetails {
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
}

export interface KanbanTask {
  taskId: string;
  rid?: string;
}

export interface KanbanColumn {
  id: string;
  name: string;
  tasks: KanbanTask[];
  taskCount: number;
  rid?: string;
}

export interface KanbanBoardProps {
  data: KanbanColumn[];
  taskDetails: Record<string, TaskDetails>;
  isCreateTaskDisabled?: boolean;
  isCreateTaskHide?: boolean;
  showCommentCount?: boolean;
  showTaskCount?: boolean;
  showProfileIndicator?: boolean;
  statusData?: Array<{ id: string; name: string; color: string }>;
  priorityData?: Array<{ id: string; name: string; color: string }>;
  tagData?: Array<{ id: string; name: string; color: string }>;
  userData?: User[];
  isDragable?: boolean;
  isDragablebetweenBoards?: boolean;
}

export interface TaskCardProps {
  task: KanbanTask;
  taskDetails: TaskDetails;
  showCommentCount?: boolean;
  showProfileIndicator?: boolean;
  onEditTask?: (taskId: string, newTitle: string) => void;
  onTaskClick?: (task: TaskDetails) => void;
  statusData?: Array<{ id: string; name: string; color: string }>;
  priorityData?: Array<{ id: string; name: string; color: string }>;
  onTaskUpdate?: (taskId: string, updatedTask: Partial<TaskDetails>) => void;
}

export interface KanbanColumnProps {
  column: KanbanColumn;
  taskDetails: Record<string, TaskDetails>;
  showTaskCount?: boolean;
  showCommentCount?: boolean;
  showProfileIndicator?: boolean;
  isCreateTaskDisabled?: boolean;
  isCreateTaskHide?: boolean;
  onAddTask: (
    columnId: string,
    task?: TaskDetails,
    position?: 'top' | 'bottom'
  ) => void;
  onRenameColumn?: (columnId: string, newName: string) => void;
  onDeleteColumn?: (columnId: string) => void;
  onEditTask?: (taskId: string, newTitle: string) => void;
  onTaskClick?: (task: TaskDetails) => void;
}

export type TaskField =
  | 'status'
  | 'assignee'
  | 'tags'
  | 'priority'
  | 'startDate'
  | 'endDate'
  | 'description'
  | 'checklist'
  | 'attachments'
  | 'comments';

export interface TaskDetailModalProps {
  task: TaskDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: (taskId: string, updatedTask: Partial<TaskDetails>) => void;
  statusData?: Array<{ id: string; name: string; color: string }>;
  priorityData?: Array<{ id: string; name: string; color: string }>;
  tagData?: Array<{ id: string; name: string; color: string }>;
  availableUsers?: User[];
  activities?: Activity[];
  fieldConfig?: Partial<
    Record<TaskField, { isDisabled?: boolean; isHidden?: boolean }>
  >;
}
