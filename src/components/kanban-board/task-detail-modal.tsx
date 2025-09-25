import React, { useState, useEffect } from 'react';
import { TaskDetailModalProps } from './types';
import {
  CalendarIcon,
  CloseIcon,
  FilterIcon,
  NotesIcon,
  UserIcon,
} from '../../assets';

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onTaskUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [comment, setComment] = useState('');

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    if (editedTask) {
      onTaskUpdate(task.id, editedTask);
      setIsEditing(false);
    }
  };

  const handleMarkComplete = () => {
    onTaskUpdate(task.id, { status: 'Done' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Modal: 20px top offset while staying docked to bottom */}
      <div
        className={`fixed top-8.5 bottom-0 right-0 w-96 bg-white text-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200'>
          <button
            onClick={handleMarkComplete}
            className='flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors text-white'
          >
            <span className='text-xs'>✓</span>
            Mark complete
          </button>

          <div className='flex items-center gap-2'>
            <button className='p-2 hover:bg-gray-100 rounded transition-colors'>
              <FilterIcon size={16} />
            </button>
            <button className='p-2 hover:bg-gray-100 rounded transition-colors'>
              <UserIcon size={16} />
            </button>
            <button className='p-2 hover:bg-gray-100 rounded transition-colors'>
              <NotesIcon size={16} />
            </button>
            <button
              onClick={onClose}
              className='p-2 hover:bg-gray-100 rounded transition-colors'
            >
              <CloseIcon size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-4 space-y-6'>
          {/* Task visibility notice */}
          <div className='text-sm text-gray-500'>
            This task is visible to everyone in My workspace.
          </div>

          {/* Task Title */}
          <div>
            {isEditing ? (
              <input
                type='text'
                value={editedTask?.title || ''}
                onChange={(e) =>
                  setEditedTask((prev) =>
                    prev ? { ...prev, title: e.target.value } : null
                  )
                }
                onBlur={handleSave}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                className='text-2xl font-bold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full text-gray-900'
                autoFocus
              />
            ) : (
              <h1
                className='text-2xl font-bold cursor-pointer hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1'
                onClick={() => setIsEditing(true)}
              >
                {task.title}
              </h1>
            )}
          </div>

          {/* Assignee */}
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium'>Assignee</span>
            <div className='flex items-center gap-2'>
              <div
                className='w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold'
                style={{ backgroundColor: task.assignee.color }}
              >
                {task.assignee.initials}
              </div>
              <span className='text-sm'>{task.assignee.name}</span>
              <span className='text-xs text-gray-500'>Recently assigned</span>
            </div>
          </div>

          {/* Due Date */}
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium'>Due date</span>
            <div className='flex items-center gap-2 text-sm'>
              <CalendarIcon size={16} />
              <span>
                {task.dueDate ? formatDate(task.dueDate) : 'Today – 26 Sep'}
              </span>
            </div>
          </div>

          {/* Projects */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium'>Projects</span>
            </div>
            <div className='flex items-center gap-2 mb-2'>
              <div className='w-3 h-3 bg-teal-400 rounded'></div>
              <span className='text-sm'>Cross-functional project plan</span>
              <span className='text-xs text-white bg-yellow-500 px-2 py-1 rounded'>
                To do
              </span>
            </div>
            <button className='text-sm text-gray-500 hover:text-gray-700 transition-colors'>
              Add to projects
            </button>
          </div>

          {/* Dependencies */}
          <div>
            <span className='text-sm font-medium'>Dependencies</span>
            <div className='mt-2'>
              <button className='text-sm text-gray-500 hover:text-gray-700 transition-colors'>
                Add dependencies
              </button>
            </div>
          </div>

          {/* Fields */}
          <div>
            <span className='text-sm font-medium mb-3 block'>Fields</span>
            <div className='space-y-2'>
              <div className='flex items-center justify-between p-3 bg-gray-50 rounded'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm'>Priority</span>
                </div>
                <span className='text-xs bg-yellow-500 text-white px-2 py-1 rounded font-medium'>
                  {task.priority || 'Medium'}
                </span>
              </div>
              <div className='flex items-center justify-between p-3 bg-gray-50 rounded'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm'>Status</span>
                </div>
                <span className='text-xs bg-yellow-500 text-white px-2 py-1 rounded font-medium'>
                  {task.status === 'High' ? 'At risk' : task.status}
                </span>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div>
            <div className='flex items-start gap-3 mb-4'>
              <div
                className='w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0'
                style={{ backgroundColor: task.assignee.color }}
              >
                {task.assignee.initials}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder='Add a comment'
                className='flex-1 bg-gray-50 border border-gray-300 rounded p-3 text-sm resize-none focus:border-blue-500 focus:outline-none min-h-[80px]'
              />
            </div>
          </div>

          {/* Collaborators */}
          <div className='border-t border-gray-200 pt-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Collaborators</span>
              <div className='flex items-center gap-2'>
                <div
                  className='w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold'
                  style={{ backgroundColor: task.assignee.color }}
                >
                  {task.assignee.initials}
                </div>
                <div className='w-6 h-6 rounded-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center'>
                  <UserIcon size={12} className='text-gray-500' />
                </div>
                <button className='text-xs text-gray-500 hover:text-gray-700 transition-colors'>
                  +
                </button>
                <button className='text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded transition-colors ml-4'>
                  Leave task
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskDetailModal;
