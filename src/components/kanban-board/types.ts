export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'Done' | 'In Progress' | 'To Do';
  priority?: 'Low' | 'Medium' | 'High';
  assignee: {
    name: string;
    initials: string;
    color: string;
  };
  collaborators?: Array<{
    name: string;
    initials: string;
    color: string;
  }>;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  attachments?: string[];
  commentAttachments?: string[];
  commentCount: number;
  createdAt: Date;
  activities?: Activity[];
}

export interface StatusOption {
  id: string;
  name: string;
  color: string;
}

export interface PriorityOption {
  id: string;
  name: string;
  color: string;
}

export interface TagOption {
  id: string;
  name: string;
  color: string;
}

export interface KanbanColumn {
  id: string;
  name: string;
  tasks: Task[];
  taskCount: number;
}

export interface KanbanBoardProps {
  data: KanbanColumn[];
  statusData?: StatusOption[];
  priorityData?: PriorityOption[];
  tagData?: TagOption[];
  userData?: User[];
  isCreateTaskDisabled?: boolean;
  isCreateTaskHide?: boolean;
  isCreateKanbanDisabled?: boolean;
  isCreateKanbanHide?: boolean;
  showCommentCount?: boolean;
  showTaskCount?: boolean;
  showProfileIndicator?: boolean;
}

export interface TaskCardProps {
  task: Task;
  showCommentCount: boolean;
  showProfileIndicator: boolean;
  onEditTask?: (taskId: string, newTitle: string) => void;
  onTaskClick?: (task: Task) => void;
  statusData?: StatusOption[];
  priorityData?: PriorityOption[];
  onTaskUpdate?: (taskId: string, updatedTask: Partial<Task>) => void;
}

export interface KanbanColumnProps {
  column: KanbanColumn;
  showTaskCount: boolean;
  showCommentCount: boolean;
  showProfileIndicator: boolean;
  isCreateTaskDisabled: boolean;
  isCreateTaskHide: boolean;
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

export interface User {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  link?: string;
  date: string;
}

export interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: (taskId: string, updatedTask: Partial<Task>) => void;
  statusData?: StatusOption[];
  priorityData?: PriorityOption[];
  tagData?: TagOption[];
  availableUsers?: User[];
  activities?: Activity[];
}
