import React, { useState, useRef, useEffect } from 'react';
import { TaskCardProps } from './types';
import { EditIcon } from '../../assets';

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  showCommentCount,
  showProfileIndicator,
  onTaskEdit,
  onTaskClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditedTitle(task.title);
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

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editedTitle.trim() && editedTitle.trim() !== task.title) {
      onTaskEdit(task.id, { title: editedTitle.trim() });
    } else {
      setEditedTitle(task.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditedTitle(task.title);
      setIsEditing(false);
    }
  };

  const handleCardClick = () => {
    if (!isEditing) {
      onTaskClick(task);
    }
  };

  return (
    <div
      className='bg-white border border-slate-200 rounded-lg p-3 mb-2 hover:bg-slate-50 transition-colors duration-200 cursor-pointer relative group'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Edit Button */}
      {isHovered && !isEditing && (
        <button
          onClick={handleEditClick}
          className='absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-200 rounded'
        >
          <EditIcon size={12} className='text-gray-500 hover:text-gray-700' />
        </button>
      )}

      <div className='flex items-start gap-3 mb-2'>
        <div className='w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0'></div>
        {isEditing ? (
          <input
            ref={inputRef}
            type='text'
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSaveEdit}
            className='flex-1 text-slate-800 text-[13px] font-medium leading-relaxed bg-white border border-slate-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none'
          />
        ) : (
          <h3 className='text-slate-800 text-[13px] font-medium leading-relaxed'>
            {task.title}
          </h3>
        )}
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
