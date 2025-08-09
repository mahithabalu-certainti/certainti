'use client';

import type React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from './types';

interface CardProps {
  task: Task;
  boardId: string;
  disabled?: boolean;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
}

const Card: React.FC<CardProps> = ({
  task,
  boardId,
  disabled = false,
  onTaskUpdate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `task-${task.id}`,
    data: {
      type: 'task',
      task,
      boardId,
    },
    disabled: disabled || task.disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderRadius: '2px',
  };

  if (task.hidden) return null;

  const handleRadioChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTaskUpdate && !task.disabled) {
      onTaskUpdate(task.id, { completed: !task.completed });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white p-3 border border-gray-200 shadow-sm
        cursor-move
        ${isDragging ? 'opacity-50' : ''}
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
        {/* Multi-select radio button - allows multiple selections */}
        <input
          type='radio'
          name={`multiselect-${task.id}`}
          checked={task.completed || false}
          onChange={() => {}}
          onClick={handleRadioChange}
          disabled={task.disabled}
          className='mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 pointer-events-auto'
          aria-label={
            task.completed ? 'Mark task incomplete' : 'Mark task complete'
          }
        />

        {/* Task text - no strikethrough */}
        <span
          className={`
            text-gray-700 flex-1
            ${task.disabled ? 'text-gray-400' : ''}
          `}
          style={{ fontSize: '13px' }}
        >
          {task.title}
        </span>
      </div>
    </div>
  );
};

export default Card;
