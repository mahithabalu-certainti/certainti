'use client';
import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { KanbanColumnProps, Task } from './types';
import TaskCard from './task-card';
import { AddIcon } from '../../assets';

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  showTaskCount,
  showCommentCount,
  showProfileIndicator,
  isCreateTaskDisabled,
  isCreateTaskHide,
  onAddTask,
  onRenameColumn,
  onDeleteColumn,
  onTaskEdit,
  onTaskClick,
}) => {
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isRenamingColumn, setIsRenamingColumn] = useState(false);
  const [columnName, setColumnName] = useState(column.name);
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const columnInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const taskIds = column.tasks.map((task) => task.id);

  useEffect(() => {
    if (isCreatingTask && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreatingTask]);

  useEffect(() => {
    if (isRenamingColumn && columnInputRef.current) {
      columnInputRef.current.focus();
      columnInputRef.current.select();
    }
  }, [isRenamingColumn]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: newTaskTitle.trim(),
        status: 'To Do',
        assignee: {
          name: 'Unassigned',
          initials: 'U',
          color: '#94a3b8',
        },
        commentCount: 0,
        createdAt: new Date(),
        priority: 'Medium',
      };
      onAddTask(column.id, newTask, 'bottom');
      setNewTaskTitle('');
      setIsCreatingTask(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    } else if (e.key === 'Escape') {
      setNewTaskTitle('');
      setIsCreatingTask(false);
    }
  };

  const handleRenameColumn = () => {
    if (
      columnName.trim() &&
      columnName.trim() !== column.name &&
      onRenameColumn
    ) {
      onRenameColumn(column.id, columnName.trim());
    } else {
      setColumnName(column.name);
    }
    setIsRenamingColumn(false);
    setShowMenu(false);
  };

  const handleColumnKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameColumn();
    } else if (e.key === 'Escape') {
      setColumnName(column.name);
      setIsRenamingColumn(false);
    }
  };

  const handleDeleteColumn = () => {
    if (onDeleteColumn) {
      onDeleteColumn(column.id);
    }
    setShowMenu(false);
  };

  return (
    <div className='flex-shrink-0 w-80'>
      <div
        className='bg-[#f5f5f5] rounded-lg p-4'
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Column Header */}
        <div className='bg-white border border-slate-200 rounded-lg p-4 mb-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2 flex-1'>
              {isRenamingColumn ? (
                <input
                  ref={columnInputRef}
                  type='text'
                  value={columnName}
                  onChange={(e) => setColumnName(e.target.value)}
                  onKeyDown={handleColumnKeyDown}
                  onBlur={handleRenameColumn}
                  className='flex-1 bg-white text-slate-800 text-[13px] font-semibold px-2 py-1 rounded border border-slate-300 focus:border-blue-500 focus:outline-none'
                />
              ) : (
                <>
                  <h2 className='text-slate-800 text-[13px] font-semibold'>
                    {column.name}
                  </h2>
                  {showTaskCount && (
                    <span className='text-slate-500 text-[13px]'>
                      {column.taskCount}
                    </span>
                  )}
                </>
              )}
            </div>
            <div className='relative' ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className='p-1 hover:bg-slate-200 rounded transition-colors'
              >
                <AddIcon size={16} />
              </button>
              {showMenu && (
                <div className='absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[150px]'>
                  <button
                    onClick={() => {
                      setIsRenamingColumn(true);
                      setShowMenu(false);
                    }}
                    className='w-full text-left px-4 py-2 text-sm hover:bg-slate-100 transition-colors'
                  >
                    Rename
                  </button>
                  <button
                    onClick={handleDeleteColumn}
                    className='w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-100 transition-colors'
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div ref={setNodeRef} className='space-y-2 mb-4 min-h-[100px]'>
            {column.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                showCommentCount={showCommentCount}
                showProfileIndicator={showProfileIndicator}
                onTaskEdit={onTaskEdit}
                onTaskClick={onTaskClick}
              />
            ))}
          </div>
        </SortableContext>

        {/* Add Task */}
        {!isCreateTaskHide && (isHovered || isCreatingTask) && (
          <>
            {isCreatingTask ? (
              <div className='bg-white border border-slate-200 rounded-lg p-3'>
                <input
                  ref={inputRef}
                  type='text'
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {
                    if (!newTaskTitle.trim()) {
                      setIsCreatingTask(false);
                    }
                  }}
                  placeholder='Task name'
                  className='w-full bg-white text-slate-800 text-[13px] font-medium px-2 py-1 rounded border border-slate-300 focus:border-blue-500 focus:outline-none'
                />
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingTask(true)}
                disabled={isCreateTaskDisabled}
                className='w-full bg-white border border-slate-200 rounded-lg p-3 transition-colors duration-200 flex items-center gap-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <AddIcon className='w-4 h-[18px]' />
                <span className='text-[13px] font-medium'>Add task</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
