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
}

export interface KanbanColumn {
  id: string;
  name: string;
  tasks: Task[];
  taskCount: number;
}

export interface KanbanBoardProps {
  data: KanbanColumn[];
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
  task: Task;
  showCommentCount?: boolean;
  showProfileIndicator?: boolean;
  onEditTask?: (taskId: string, newTitle: string) => void;
  onTaskClick?: (task: Task) => void;
  statusData?: Array<{ id: string; name: string; color: string }>;
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
    task?: Task,
    position?: 'top' | 'bottom'
  ) => void;
  onRenameColumn?: (columnId: string, newName: string) => void;
  onDeleteColumn?: (columnId: string) => void;
  onEditTask?: (taskId: string, newTitle: string) => void;
  onTaskClick?: (task: Task) => void;
}

export interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: (taskId: string, updatedTask: Partial<Task>) => void;
  statusData?: Array<{ id: string; name: string; color: string }>;
  priorityData?: Array<{ id: string; name: string; color: string }>;
  tagData?: Array<{ id: string; name: string; color: string }>;
  availableUsers?: User[];
  activities?: Activity[];
}
