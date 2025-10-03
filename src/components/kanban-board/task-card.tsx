'use client';

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TaskCardProps } from './types';
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
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const statusSelectRef = useRef<HTMLSelectElement>(null);
  const prioritySelectRef = useRef<HTMLSelectElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditingStatus && statusSelectRef.current) {
      statusSelectRef.current.focus();
    }
  }, [isEditingStatus]);

  useEffect(() => {
    if (isEditingPriority && prioritySelectRef.current) {
      prioritySelectRef.current.focus();
    }
  }, [isEditingPriority]);

  useEffect(() => {
    setEditedTitle(task.title);
  }, [task.title]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-teal-400 text-white';
      case 'In Progress':
        return 'bg-blue-400 text-white';
      case 'To Do':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-300 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-400 text-white';
      case 'Medium':
        return 'bg-orange-400 text-white';
      case 'Low':
        return 'bg-green-400 text-white';
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

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingStatus(true);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as 'Done' | 'In Progress' | 'To Do';
    onTaskEdit(task.id, { status: newStatus });
    setIsEditingStatus(false);
  };

  const handleStatusBlur = () => {
    setIsEditingStatus(false);
  };

  const handlePriorityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingPriority(true);
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPriority = e.target.value as 'Low' | 'Medium' | 'High';
    onTaskEdit(task.id, { priority: newPriority });
    setIsEditingPriority(false);
  };

  const handlePriorityBlur = () => {
    setIsEditingPriority(false);
  };

  const handleCardClick = () => {
    if (!isEditing && !isEditingStatus && !isEditingPriority) {
      onTaskClick(task);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className='bg-white border border-slate-200 rounded-lg p-3 mb-2 hover:bg-slate-50 transition-colors duration-200 cursor-grab active:cursor-grabbing relative group shadow-md hover:shadow-lg'
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
        {/* Status Badge */}
        {isEditingStatus ? (
          <select
            ref={statusSelectRef}
            value={task.status}
            onChange={handleStatusChange}
            onBlur={handleStatusBlur}
            onClick={(e) => e.stopPropagation()}
            className='px-2 py-1 rounded-md text-[13px] font-medium border border-slate-300 focus:border-blue-500 focus:outline-none bg-white'
          >
            <option value='To Do'>To Do</option>
            <option value='In Progress'>In Progress</option>
            <option value='Done'>Done</option>
          </select>
        ) : (
          <button
            onClick={handleStatusClick}
            className={`px-2 py-1 rounded-md text-[13px] font-medium ${getStatusColor(task.status)} hover:opacity-80 transition-opacity`}
          >
            {task.status}
          </button>
        )}

        {/* Priority Badge */}
        {isEditingPriority ? (
          <select
            ref={prioritySelectRef}
            value={task.priority}
            onChange={handlePriorityChange}
            onBlur={handlePriorityBlur}
            onClick={(e) => e.stopPropagation()}
            className='px-2 py-1 rounded-md text-[13px] font-medium border border-slate-300 focus:border-blue-500 focus:outline-none bg-white'
          >
            <option value='Low'>Low</option>
            <option value='Medium'>Medium</option>
            <option value='High'>High</option>
          </select>
        ) : (
          <button
            onClick={handlePriorityClick}
            className={`px-2 py-1 rounded-md text-[13px] font-medium ${getPriorityColor(task.priority)} hover:opacity-80 transition-opacity`}
          >
            {task.priority}
          </button>
        )}
      </div>

      <div className='flex items-center justify-between'>
        {showProfileIndicator && (
          <div
            className='w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-semibold'
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
