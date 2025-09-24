'use client';
import type React from 'react';
import { useState } from 'react';

import {
  KanbanBoardProps,
  KanbanColumn as KanbanColumnType,
  Task,
} from './types';
import KanbanColumn from './kanban-column';
import { AddIcon } from '../../assets';

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  data,
  isCreateTaskDisabled = false,
  isCreateTaskHide = false,
  showCommentCount = true,
  showTaskCount = true,
  showProfileIndicator = true,
}) => {
  const [columns, setColumns] = useState<KanbanColumnType[]>(data);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const handleAddTask = (
    columnId: string,
    task?: Task,
    position: 'top' | 'bottom' = 'bottom'
  ) => {
    if (task) {
      // Direct task creation (from inline input)
      setColumns(
        columns.map((column) =>
          column.id === columnId
            ? {
                ...column,
                tasks:
                  position === 'top'
                    ? [task, ...column.tasks]
                    : [...column.tasks, task],
                taskCount: column.taskCount + 1,
              }
            : column
        )
      );
    }
  };

  const handleRenameColumn = (columnId: string, newName: string) => {
    setColumns(
      columns.map((column) =>
        column.id === columnId
          ? {
              ...column,
              name: newName,
            }
          : column
      )
    );
  };

  const handleDeleteColumn = (columnId: string) => {
    setColumns(columns.filter((column) => column.id !== columnId));
  };

  const handleAddSection = () => {
    setIsCreatingSection(true);
    setNewSectionName('');
  };

  const handleCreateSection = () => {
    if (newSectionName.trim()) {
      const newColumn: KanbanColumnType = {
        id: `column-${Date.now()}`,
        name: newSectionName.trim(),
        tasks: [],
        taskCount: 0,
      };
      setColumns([...columns, newColumn]);
      setIsCreatingSection(false);
      setNewSectionName('');
    }
  };

  const handleCancelCreateSection = () => {
    setIsCreatingSection(false);
    setNewSectionName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSection();
    } else if (e.key === 'Escape') {
      handleCancelCreateSection();
    }
  };

  return (
    <div className='min-h-screen p-4'>
      <div className='max-w-full overflow-x-auto'>
        <div className='flex items-start gap-6 pb-6'>
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              showTaskCount={showTaskCount}
              showCommentCount={showCommentCount}
              showProfileIndicator={showProfileIndicator}
              isCreateTaskDisabled={isCreateTaskDisabled}
              isCreateTaskHide={isCreateTaskHide}
              onAddTask={handleAddTask}
              onRenameColumn={handleRenameColumn}
              onDeleteColumn={handleDeleteColumn}
            />
          ))}

          <div className='flex-shrink-0 w-80'>
            {isCreatingSection ? (
              <div className='bg-[#f5f5f5] rounded-lg p-4'>
                <div className='bg-slate-700 border border-slate-600 rounded-lg p-4 mb-4'>
                  <input
                    type='text'
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleCancelCreateSection}
                    placeholder='Enter section name'
                    className='w-full bg-slate-600 text-white text-[13px] font-semibold px-2 py-1 rounded border border-slate-500 focus:border-blue-500 focus:outline-none'
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              <div className='bg-[#f5f5f5] rounded-lg p-4'>
                <button
                  onClick={handleAddSection}
                  className='w-full bg-slate-700 border border-slate-600 rounded-lg p-4 mb-4 transition-colors duration-200 flex items-center justify-center gap-2 text-slate-300 hover:text-white hover:bg-slate-600'
                >
                  <AddIcon className='w-4 h-[26px]' />
                  <span className='text-[13px] font-semibold'>Add Section</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
