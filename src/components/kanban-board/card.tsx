'use client';

import type React from 'react';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from './types';

interface CardProps {
  task: Task;
  boardId: string;
  disabled?: boolean;
  allowDelete?: boolean;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete?: (taskId: string) => void;
}

const Card: React.FC<CardProps> = ({
  task,
  boardId,
  disabled = false,
  allowDelete = true,
  onTaskUpdate,
  onTaskDelete,
}) => {
  const [showDeleteIcon, setShowDeleteIcon] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
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
    // Toggle delete icon visibility when radio button is clicked
    if (allowDelete && onTaskDelete) {
      setShowDeleteIcon(!showDeleteIcon);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTaskDelete && !task.disabled) {
      onTaskDelete(task.id);
    }
  };

  const DeleteIcon = () => (
    <svg
      width='12'
      height='12'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M3 6H5H21'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white p-3 border border-gray-200 shadow-sm
        cursor-move relative
        ${task.disabled ? 'opacity-60 cursor-not-allowed' : ''}
        ${task.completed ? 'bg-gray-50' : ''}
        ${showDeleteIcon ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
      `}
      {...attributes}
      {...listeners}
      role='button'
      aria-label={`Task: ${task.title}`}
      aria-disabled={disabled || task.disabled}
    >
      <div className='flex items-start gap-3'>
        <input
          type='radio'
          name={`multiselect-${task.id}`}
          checked={task.completed || false}
          onChange={() => {}}
          onClick={handleRadioChange}
          disabled={task.disabled}
          className='mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 pointer-events-auto focus:outline-none'
          aria-label={
            task.completed ? 'Mark task incomplete' : 'Mark task complete'
          }
        />

        <span
          className={`
            text-gray-700 flex-1
            ${task.disabled ? 'text-gray-400' : ''}
          `}
          style={{ fontSize: '13px' }}
        >
          {task.title}
        </span>

        {showDeleteIcon && allowDelete && onTaskDelete && (
          <button
            onClick={handleDelete}
            disabled={task.disabled}
            className='
              p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded
              transition-colors duration-200 pointer-events-auto
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-0
            '
            aria-label='Delete task'
            title='Delete task'
          >
            <DeleteIcon />
          </button>
        )}
      </div>
    </div>
  );
};

export default Card;
