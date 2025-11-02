import { useEffect, useRef, useState } from 'react';
import { TaskCardProps } from './types';
import { PencilIcon } from '../../assets';

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  showCommentCount,
  showProfileIndicator,
  onEditTask,
  onTaskClick,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditTitle(task.title);
  }, [task.title]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-teal-400 text-white';
      case 'High':
        return 'bg-red-400 text-white';
      case 'Complete':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-300 text-gray-800';
    }
  };

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle.trim() !== task.title && onEditTask) {
      onEditTask(task.id, editTitle.trim());
    } else {
      setEditTitle(task.title); // Reset if no change or empty
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      onClick={() => onTaskClick?.(task)}
      className='bg-white border border-slate-200 rounded-lg p-3 mb-2 hover:bg-slate-50 transition-colors duration-200 group cursor-pointer'
    >
      <div className='flex items-start gap-3 mb-2'>
        <div className='w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0'></div>
        <div className='flex-1 flex items-center justify-between'>
          {isEditing ? (
            <input
              ref={inputRef}
              type='text'
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleSaveEdit}
              className='flex-1 bg-white text-slate-800 text-[13px] font-medium px-2 py-1 rounded border border-slate-300 focus:border-blue-500 focus:outline-none'
            />
          ) : (
            <h3 className='text-slate-800 text-[13px] font-medium leading-relaxed flex-1'>
              {task.title}
            </h3>
          )}

          {!isEditing && onEditTask && (
            <button
              onClick={() => setIsEditing(true)}
              className='opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-slate-200 ml-2'
              title='Edit task'
            >
              <PencilIcon
                size={14}
                className='text-slate-500 hover:text-slate-700'
              />
            </button>
          )}
        </div>
      </div>

      <div className='flex items-center gap-2 mb-2'>
        <span
          className={`px-2 py-1 rounded-md text-[13px] font-medium ${getStatusColor('Done')}`}
        >
          Done
        </span>
        <span
          className={`px-2 py-1 rounded-md text-[13px] font-medium ${getStatusColor('High')}`}
        >
          High
        </span>
        <span
          className={`px-2 py-1 rounded-md text-[13px] font-medium ${getStatusColor('Complete')}`}
        >
          Complete
        </span>
      </div>

      <div className='flex items-center justify-between'>
        {showProfileIndicator && (
          <div
            className='w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-semibold'
            style={{ backgroundColor: task.assignee.color }}
          >
            {task.assignee.initials}
          </div>
        )}

        {showCommentCount && (
          <div className='flex items-center gap-1 text-gray-400'>
            <span className='text-[13px]'>{task.commentCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
