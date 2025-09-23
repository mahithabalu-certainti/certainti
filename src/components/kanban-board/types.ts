export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'Done' | 'High' | 'Complete';
  assignee: {
    name: string;
    initials: string;
    color: string;
  };
  commentCount: number;
  createdAt: Date;
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
}

export interface KanbanColumnProps {
  column: KanbanColumn;
  showTaskCount: boolean;
  showCommentCount: boolean;
  showProfileIndicator: boolean;
  isCreateTaskDisabled: boolean;
  isCreateTaskHide: boolean;
  onAddTask: (columnId: string) => void;
}
