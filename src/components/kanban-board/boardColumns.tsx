'use client';

import type React from 'react';
import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Card from './card';
import type { Board, DropdownOption, Task } from './types';
import DropdownMenu from './dropdownMenu';

// Inline icon components
const AddIcon = ({
  size = 16,
  className = '',
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    className={className}
  >
    <path
      d='M12 5v14M5 12h14'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const NotesIcon = () => (
  <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
    <path
      d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <polyline
      points='14,2 14,8 20,8'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <line
      x1='16'
      y1='13'
      x2='8'
      y2='13'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <line
      x1='16'
      y1='17'
      x2='8'
      y2='17'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const TrashIcon = () => (
  <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
    <path
      d='M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

interface BoardColumnProps {
  board: Board;
  boardIndex: number;
  onTaskCreate?: (boardId: string, taskTitle: string) => void;
  onTaskUpdate?: (
    boardId: string,
    taskId: string,
    updates: Partial<Task>
  ) => void;
  onTaskDelete?: (boardId: string, taskId: string) => void;
  onBoardDelete?: (boardId: string) => void;
  onBoardRename?: (boardId: string, newTitle: string) => void;
  customDropdownOptions?: DropdownOption[];
  allowCreateTask?: boolean;
  allowTaskInteraction?: boolean;
  allowTaskDelete?: boolean;
  allowBoardSwap?: boolean;
}

const BoardColumn: React.FC<BoardColumnProps> = ({
  board,
  boardIndex,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onBoardDelete,
  onBoardRename,
  customDropdownOptions = [],
  allowCreateTask = true,
  allowTaskInteraction = true,
  allowTaskDelete = true,
  allowBoardSwap = false,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState(board.title);

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: board.id,
    data: {
      type: 'board',
      board,
      boardIndex,
    },
  });

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: `board-${board.id}`,
      data: {
        type: 'board',
        board,
        boardIndex,
      },
      disabled: !allowBoardSwap,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (board.hidden) return null;

  const visibleTasks = board.tasks.filter((task) => !task.hidden);
  const canAddTask =
    allowCreateTask &&
    board.allowCreateTask !== false &&
    (!board.maxItems || visibleTasks.length < board.maxItems);

  const handleCreateTask = () => {
    if (newTaskTitle.trim() && onTaskCreate) {
      onTaskCreate(board.id, newTaskTitle.trim());
      setNewTaskTitle('');
      setIsCreatingTask(false);
    }
  };

  const handleRename = () => {
    if (newBoardTitle.trim() && onBoardRename) {
      onBoardRename(board.id, newBoardTitle.trim());
      setIsRenaming(false);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    if (onTaskDelete) {
      onTaskDelete(board.id, taskId);
    }
  };

  const handleBoardDelete = () => {
    if (
      onBoardDelete &&
      window.confirm(
        `Are you sure you want to delete "${board.title}"? This action cannot be undone.`
      )
    ) {
      onBoardDelete(board.id);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isRenaming) {
        handleRename();
      } else {
        handleCreateTask();
      }
    } else if (e.key === 'Escape') {
      if (isRenaming) {
        setIsRenaming(false);
        setNewBoardTitle(board.title);
      } else {
        setIsCreatingTask(false);
        setNewTaskTitle('');
      }
    }
  };

  const dropdownOptions: DropdownOption[] = [
    ...customDropdownOptions,
    ...(onBoardRename
      ? [
          {
            id: 'rename',
            label: 'Rename Board',
            icon: <NotesIcon />,
            action: () => setIsRenaming(true),
          },
        ]
      : []),
    ...(onBoardDelete
      ? [
          {
            id: 'delete',
            label: 'Delete Board',
            icon: <TrashIcon />,
            action: handleBoardDelete,
            variant: 'danger' as const,
          },
        ]
      : []),
  ];

  return (
    <div
      ref={allowBoardSwap ? setNodeRef : undefined}
      className='flex-shrink-0 w-80 bg-gray-50 overflow-hidden flex flex-col shadow-md'
      style={{
        ...style,
        borderRadius: '2px',
      }}
      {...(allowBoardSwap ? attributes : {})}
      {...(allowBoardSwap ? listeners : {})}
    >
      {/* Header - Make it draggable for board swapping */}
      <div
        className={`px-3 py-2 text-white font-medium flex items-center justify-between ${
          allowBoardSwap ? 'cursor-move' : ''
        }`}
        style={{
          backgroundColor: board.color,
          fontSize: '13px',
        }}
      >
        {isRenaming ? (
          <input
            type='text'
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleRename}
            className='bg-transparent border-none outline-none text-white placeholder-white/70 font-semibold flex-1'
            style={{ fontSize: '13px' }}
            autoFocus
          />
        ) : (
          <h3 className='font-semibold truncate' style={{ fontSize: '13px' }}>
            {board.title}
          </h3>
        )}
        <DropdownMenu options={dropdownOptions} />
      </div>

      <div
        ref={setDroppableNodeRef}
        className={`p-4 transition-colors duration-200 ${isOver ? 'bg-blue-50' : ''}`}
      >
        {/* Create Task Button */}
        {canAddTask && !isCreatingTask && (
          <div className='flex justify-center mb-4'>
            <button
              onClick={() => setIsCreatingTask(true)}
              className='
                w-7 h-7 bg-white border border-gray-300 rounded-full
                flex items-center justify-center text-gray-400 hover:text-gray-600
                hover:border-gray-400 transition-all duration-200 group
                focus:outline-none focus:ring-0
              '
              title='Add Task'
            >
              <AddIcon
                size={14}
                className='transition-transform group-hover:scale-110'
              />
            </button>
          </div>
        )}

        {/* Create Task Input */}
        {isCreatingTask && (
          <div className='space-y-2 mb-4'>
            <input
              type='text'
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={() => {
                if (!newTaskTitle.trim()) {
                  setIsCreatingTask(false);
                }
              }}
              placeholder='Enter task title...'
              className='w-full p-3 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none'
              style={{
                borderRadius: '2px',
                fontSize: '13px',
              }}
              autoFocus
            />
            <div className='flex gap-2'>
              <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim()}
                className='px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-0'
                style={{
                  borderRadius: '2px',
                  fontSize: '13px',
                }}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsCreatingTask(false);
                  setNewTaskTitle('');
                }}
                className='px-3 py-1 border border-gray-300 text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-0'
                style={{
                  borderRadius: '2px',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tasks with Sortable Context */}
        <SortableContext
          items={visibleTasks.map((task) => `task-${task.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className='space-y-3'>
            {visibleTasks.map((task) => (
              <Card
                key={task.id}
                task={task}
                boardId={board.id}
                disabled={
                  !allowTaskInteraction || board.allowTaskInteraction === false
                }
                allowDelete={allowTaskDelete}
                onTaskUpdate={(taskId, updates) =>
                  onTaskUpdate?.(board.id, taskId, updates)
                }
                onTaskDelete={handleTaskDelete}
              />
            ))}
          </div>
        </SortableContext>

        {/* Empty state when no tasks and can't add tasks */}
        {visibleTasks.length === 0 && !canAddTask && !isCreatingTask && (
          <div
            className='text-center text-gray-400 py-4'
            style={{ fontSize: '13px' }}
          >
            No tasks
          </div>
        )}

        {board.maxItems && visibleTasks.length >= board.maxItems && (
          <div
            className='text-amber-600 bg-amber-50 p-2 border border-amber-200 mt-4'
            style={{
              borderRadius: '2px',
              fontSize: '13px',
            }}
          >
            Maximum items reached ({board.maxItems})
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardColumn;
