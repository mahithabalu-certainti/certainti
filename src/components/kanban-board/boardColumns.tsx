import React, { useState } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Board, DropdownOption, Task } from './types';
import { AddIcon, DeleteIcon } from '../../assets';
import DropdownMenu from './dropdownMenu';
import TaskCard from './taskCard';

interface BoardColumnProps {
  board: Board;
  boardIndex: number;
  onTaskCreate?: (boardId: string, taskTitle: string) => void;
  onTaskUpdate?: (
    boardId: string,
    taskId: string,
    updates: Partial<Task>
  ) => void;
  onBoardDelete?: (boardId: string) => void;
  onBoardDuplicate?: (boardId: string) => void;
  customDropdownOptions?: DropdownOption[];
  allowCreateTask?: boolean;
  allowTaskInteraction?: boolean;
  allowBoardSwap?: boolean;
}

const BoardColumn: React.FC<BoardColumnProps> = ({
  board,
  boardIndex,
  onTaskCreate,
  onTaskUpdate,
  onBoardDelete,
  onBoardDuplicate,
  customDropdownOptions = [],
  allowCreateTask = true,
  allowTaskInteraction = true,
  allowBoardSwap = false,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: board.id,
    data: { board, boardIndex },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `board-${board.id}`,
    data: { board, boardIndex, type: 'board' },
    disabled: !allowBoardSwap,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateTask();
    } else if (e.key === 'Escape') {
      setIsCreatingTask(false);
      setNewTaskTitle('');
    }
  };

  const dropdownOptions: DropdownOption[] = [
    ...customDropdownOptions,
    ...(onBoardDuplicate
      ? [
          {
            id: 'duplicate',
            label: 'Duplicate Board',
            // icon: <Copy size={16} />,
            action: () => onBoardDuplicate(board.id),
          },
        ]
      : []),
    ...(onBoardDelete
      ? [
          {
            id: 'delete',
            label: 'Delete Board',
            icon: <DeleteIcon size={16} />,
            action: () => onBoardDelete(board.id),
            variant: 'danger' as const,
          },
        ]
      : []),
  ];

  return (
    <div
      ref={allowBoardSwap ? setDraggableNodeRef : undefined}
      style={style}
      className={`
        flex-shrink-0 w-80 bg-gray-50 rounded-lg overflow-hidden shadow-sm
        transition-all duration-200
        ${isDragging ? 'opacity-90' : ''}
        ${board.disabled ? 'opacity-60' : ''}
      `}
      {...(allowBoardSwap ? attributes : {})}
      {...(allowBoardSwap ? listeners : {})}
    >
      {/* Header */}
      <div
        className='px-4 py-3 text-white font-medium text-sm flex items-center justify-between'
        style={{ backgroundColor: board.color }}
      >
        <h3 className='font-semibold truncate'>{board.title}</h3>
        <DropdownMenu options={dropdownOptions} />
      </div>

      {/* Content Area */}
      <div ref={setDroppableNodeRef} className='p-4 space-y-3 min-h-32 flex-1'>
        {/* Create Task Button */}
        {canAddTask && !isCreatingTask && (
          <div className='group'>
            <button
              onClick={() => setIsCreatingTask(true)}
              className='
                w-full p-3 border-2 border-dashed border-gray-300 rounded-lg
                flex items-center justify-center text-gray-500 hover:border-gray-400 
                hover:text-gray-600 transition-all duration-200 group
              '
              title='Create Task'
            >
              <AddIcon
                size={20}
                className='transition-transform group-hover:scale-110'
              />
            </button>
          </div>
        )}

        {/* Create Task Input */}
        {isCreatingTask && (
          <div className='space-y-2'>
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
              className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              autoFocus
            />
            <div className='flex gap-2'>
              <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim()}
                className='px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50'
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsCreatingTask(false);
                  setNewTaskTitle('');
                }}
                className='px-3 py-1 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50'
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tasks */}
        {visibleTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            boardId={board.id}
            disabled={
              !allowTaskInteraction || board.allowTaskInteraction === false
            }
            onTaskUpdate={(taskId, updates) =>
              onTaskUpdate?.(board.id, taskId, updates)
            }
          />
        ))}

        {/* Max Items Warning */}
        {board.maxItems && visibleTasks.length >= board.maxItems && (
          <div className='text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200'>
            Maximum items reached ({board.maxItems})
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardColumn;
