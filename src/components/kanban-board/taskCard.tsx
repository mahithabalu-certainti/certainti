import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Task } from './types';

interface TaskCardProps {
  task: Task;
  boardId: string;
  disabled?: boolean;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  boardId,
  disabled = false,
  onTaskUpdate,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `${boardId}-${task.id}`,
      data: { task, boardId },
      disabled: disabled || task.disabled,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  if (task.hidden) return null;

  const handleCheckboxChange = () => {
    if (onTaskUpdate && !task.disabled) {
      onTaskUpdate(task.id, { completed: !task.completed });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white rounded-lg p-4 border border-gray-200 
        transition-opacity duration-200 cursor-move
        ${isDragging ? 'opacity-50' : 'hover:bg-gray-50'}
        ${task.disabled ? 'opacity-60 cursor-not-allowed' : ''}
        ${task.completed ? 'bg-gray-50' : ''}
      `}
      {...attributes}
      {...listeners}
      role='button'
      aria-label={`Task: ${task.title}`}
      aria-disabled={disabled || task.disabled}
    >
      <div className='flex items-start gap-3'>
        <input
          type='checkbox'
          checked={task.completed || false}
          onChange={handleCheckboxChange}
          disabled={task.disabled}
          className='mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500'
          aria-label={
            task.completed ? 'Mark task incomplete' : 'Mark task complete'
          }
        />
        <span
          className={`
            text-sm text-gray-700 flex-1
            ${task.completed ? 'line-through text-gray-500' : ''}
            ${task.disabled ? 'text-gray-400' : ''}
          `}
        >
          {task.title}
        </span>
      </div>
    </div>
  );
};

export default TaskCard;
