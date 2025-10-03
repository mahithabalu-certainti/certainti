export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'Done' | 'In Progress' | 'To Do';
  assignee: {
    name: string;
    initials: string;
    color: string;
  };
  commentCount: number;
  createdAt: Date;
  dueDate?: Date;
  priority: 'Low' | 'Medium' | 'High';
  project?: string;
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
  onTaskEdit: (taskId: string, updatedTask: Partial<Task>) => void;
  onTaskClick: (task: Task) => void;
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
  onTaskEdit: (taskId: string, updatedTask: Partial<Task>) => void;
  onTaskClick: (task: Task) => void;
}

export interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: (taskId: string, updatedTask: Partial<Task>) => void;
}
