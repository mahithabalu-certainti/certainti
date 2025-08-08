import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from './types';

interface SortableTaskCardProps {
  task: Task;
  boardId: string;
  disabled?: boolean;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({
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
    zIndex: isDragging ? 1000 : 'auto',
  };

  if (task.hidden) return null;

  const handleCheckboxChange = (e: React.MouseEvent) => {
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
        bg-white rounded-lg p-4 border border-gray-200 
        transition-all duration-200 cursor-move shadow-sm
        ${isDragging ? 'opacity-50 shadow-lg scale-105' : 'hover:shadow-md'}
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
          onChange={() => {}}
          onClick={handleCheckboxChange}
          disabled={task.disabled}
          className='mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 pointer-events-auto'
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

export default SortableTaskCard;
