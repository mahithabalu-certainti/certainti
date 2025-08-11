import type React from 'react';
export interface Task {
  id: string;
  title: string;
  completed?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  createdAt?: Date;
}

export interface Board {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  maxItems?: number;
  disabled?: boolean;
  hidden?: boolean;
  allowCreateTask?: boolean;
  allowTaskInteraction?: boolean;
}

export interface DropdownOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  disabled?: boolean;
  hidden?: boolean;
  variant?: 'default' | 'danger';
}

export interface KanbanConfig {
  allowCreateBoard?: boolean;
  allowDeleteBoard?: boolean;
  allowSwapBoards?: boolean;
  allowCreateTask?: boolean;
  allowTaskMovement?: boolean;
  allowTaskDelete?: boolean;
  maxBoardsLimit?: number;
  customDropdownOptions?: DropdownOption[];
}

export interface KanbanProps {
  boards: Board[];
  onBoardsChange: (boards: Board[]) => void;
  config?: KanbanConfig;
  className?: string;
}

export type ActiveItem =
  | { type: 'task'; task: Task; boardId: string }
  | { type: 'board'; board: Board; boardId: string };
