import { useEffect, useRef, useState } from 'react';
import { KanbanColumnProps } from './types';
import { useDroppable } from '@dnd-kit/core';
import { AddIcon, ChevronDownIcon } from '../../assets';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import TaskCard from './task-card';

interface ExtendedKanbanColumnProps extends KanbanColumnProps {
  isDragable?: boolean;
  isDragablebetweenBoards?: boolean;
}

const KanbanColumn: React.FC<ExtendedKanbanColumnProps> = ({
  column,
  showTaskCount,
  showCommentCount,
  showProfileIndicator,
  isCreateTaskDisabled,
  isCreateTaskHide,
  onAddTask,
  onRenameColumn,
  onDeleteColumn,
  onEditTask,
  onTaskClick,
  isDragable = false,
  isDragablebetweenBoards = false,
}) => {
  const [isAddingTaskAtTop, setIsAddingTaskAtTop] = useState(false);
  const [isAddingTaskAtBottom, setIsAddingTaskAtBottom] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newBottomTaskTitle, setNewBottomTaskTitle] = useState('');
  const [, setIsHoveringHeader] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRenamingColumn, setIsRenamingColumn] = useState(false);
  const [columnName, setColumnName] = useState(column.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const columnNameRef = useRef<HTMLInputElement>(null);

  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { type: 'Column', column },
  });

  useEffect(() => {
    if (isAddingTaskAtTop && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingTaskAtTop]);

  useEffect(() => {
    if (isAddingTaskAtBottom && bottomInputRef.current) {
      bottomInputRef.current.focus();
    }
  }, [isAddingTaskAtBottom]);

  useEffect(() => {
    if (isRenamingColumn && columnNameRef.current) {
      columnNameRef.current.focus();
      columnNameRef.current.select();
    }
  }, [isRenamingColumn]);

  useEffect(() => {
    setColumnName(column.name);
  }, [column.name]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleAddTaskAtTop = () => {
    if (newTaskTitle.trim()) {
      const newTask = {
        id: Date.now().toString(),
        title: newTaskTitle,
        status: 'To Do' as const,
        assignee: {
          name: 'New User',
          initials: 'NU',
          color: '#8B5CF6',
        },
        commentCount: 0,
        createdAt: new Date(),
      };

      onAddTask(column.id, newTask, 'top');
      setNewTaskTitle('');
      setIsAddingTaskAtTop(false);
    }
  };

  const handleAddTaskAtBottom = () => {
    if (newBottomTaskTitle.trim()) {
      const newTask = {
        id: Date.now().toString(),
        title: newBottomTaskTitle,
        status: 'To Do' as const,
        assignee: {
          name: 'New User',
          initials: 'NU',
          color: '#8B5CF6',
        },
        commentCount: 0,
        createdAt: new Date(),
      };

      onAddTask(column.id, newTask, 'bottom');
      setNewBottomTaskTitle('');
      setIsAddingTaskAtBottom(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTaskAtTop();
    } else if (e.key === 'Escape') {
      setIsAddingTaskAtTop(false);
      setNewTaskTitle('');
    }
  };

  const handleBottomKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTaskAtBottom();
    } else if (e.key === 'Escape') {
      setIsAddingTaskAtBottom(false);
      setNewBottomTaskTitle('');
    }
  };

  const handleRenameColumn = () => {
    setIsRenamingColumn(true);
    setIsDropdownOpen(false);
  };

  const handleSaveColumnName = () => {
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
  };

  const handleColumnNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveColumnName();
    } else if (e.key === 'Escape') {
      setColumnName(column.name);
      setIsRenamingColumn(false);
    }
  };

  const handleDeleteColumn = () => {
    if (onDeleteColumn) {
      onDeleteColumn(column.id);
    }
    setIsDropdownOpen(false);
  };

  return (
    <div
      ref={setNodeRef}
      className='bg-[#f5f5f5] rounded-lg p-4 w-80 flex-shrink-0'
    >
      <div
        className='bg-white border border-slate-200 rounded-lg p-3 mb-2 flex items-center justify-between group'
        onMouseEnter={() => setIsHoveringHeader(true)}
        onMouseLeave={() => setIsHoveringHeader(false)}
      >
        <div className='flex items-center gap-2'>
          {isRenamingColumn ? (
            <input
              ref={columnNameRef}
              type='text'
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              onKeyDown={handleColumnNameKeyPress}
              onBlur={handleSaveColumnName}
              className='bg-white text-slate-800 text-[13px] font-semibold px-2 py-1 rounded border border-slate-300 focus:border-blue-500 focus:outline-none min-w-0'
            />
          ) : (
            <h2 className='text-slate-800 text-[13px] font-semibold'>
              {column.name}
            </h2>
          )}
          {showTaskCount && (
            <span className='bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-[13px]'>
              {column.taskCount}
            </span>
          )}
        </div>

        <div className='flex items-center gap-1'>
          {!isCreateTaskHide && (
            <button
              onClick={() => setIsAddingTaskAtTop(true)}
              disabled={isCreateTaskDisabled}
              className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-slate-100 ${
                isCreateTaskDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
              title='Add Task'
            >
              <AddIcon
                size={16}
                className='text-slate-500 hover:text-slate-700'
              />
            </button>
          )}

          {!isCreateTaskHide && (
            <div className='relative' ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className='opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-slate-100 cursor-pointer'
                title='More options'
              >
                <ChevronDownIcon
                  size={16}
                  className='text-slate-500 hover:text-slate-700'
                />
              </button>

              {isDropdownOpen && (
                <div className='absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]'>
                  <button
                    onClick={handleRenameColumn}
                    className='w-full text-left px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-100 transition-colors'
                  >
                    Rename Section
                  </button>
                  <button
                    onClick={handleDeleteColumn}
                    className='w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors'
                  >
                    Delete Section
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isAddingTaskAtTop && (
        <div className='mb-2'>
          <input
            ref={inputRef}
            type='text'
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={() => {
              if (!newTaskTitle.trim()) {
                setIsAddingTaskAtTop(false);
              }
            }}
            placeholder='Enter task name'
            className='w-full p-3 bg-white text-slate-800 rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none text-[13px] placeholder-slate-500'
          />
        </div>
      )}

      <SortableContext
        items={column.tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
        disabled={!isDragable && !isDragablebetweenBoards}
      >
        <div className='space-y-2 mb-2'>
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              showCommentCount={showCommentCount}
              showProfileIndicator={showProfileIndicator}
              onEditTask={onEditTask}
              onTaskClick={onTaskClick}
              isDragable={isDragable}
              isDragablebetweenBoards={isDragablebetweenBoards}
            />
          ))}
        </div>
      </SortableContext>

      {isAddingTaskAtBottom && (
        <div className='mb-2'>
          <input
            ref={bottomInputRef}
            type='text'
            value={newBottomTaskTitle}
            onChange={(e) => setNewBottomTaskTitle(e.target.value)}
            onKeyDown={handleBottomKeyPress}
            onBlur={() => {
              if (!newBottomTaskTitle.trim()) {
                setIsAddingTaskAtBottom(false);
              }
            }}
            placeholder='Enter task name'
            className='w-full p-3 bg-white text-slate-800 rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none text-[13px] placeholder-slate-500'
          />
        </div>
      )}

      {!isCreateTaskHide && (
        <button
          onClick={() => setIsAddingTaskAtBottom(true)}
          disabled={isCreateTaskDisabled}
          className={`w-full flex items-center gap-2 p-3 rounded-lg border-2 border-dashed transition-colors duration-200 ${
            isCreateTaskDisabled
              ? 'border-slate-300 text-slate-400 cursor-not-allowed'
              : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-600'
          }`}
        >
          <AddIcon size={18} />
          <span className='text-[13px] font-medium'>Add Task</span>
        </button>
      )}
    </div>
  );
};

export default KanbanColumn;
