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
import TaskDetailModal from './task-detail-modal';

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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddTask = (
    columnId: string,
    task?: Task,
    position: 'top' | 'bottom' = 'bottom'
  ) => {
    if (task) {
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

  const handleTaskEdit = (taskId: string, updatedTask: Partial<Task>) => {
    setColumns(
      columns.map((column) => ({
        ...column,
        tasks: column.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updatedTask } : task
        ),
      }))
    );

    // Update selected task if it's the one being edited
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, ...updatedTask });
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
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
    <div className='min-h-screen p-4 relative'>
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
              onTaskEdit={handleTaskEdit}
              onTaskClick={handleTaskClick}
            />
          ))}

          <div className='flex-shrink-0 w-80'>
            {isCreatingSection ? (
              <div className='bg-[#f5f5f5] rounded-lg p-4'>
                <div className='bg-white border border-slate-200 rounded-lg p-4 mb-4'>
                  <input
                    type='text'
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleCancelCreateSection}
                    placeholder='Enter section name'
                    className='w-full bg-white text-slate-800 text-[13px] font-semibold px-2 py-1 rounded border border-slate-300 focus:border-blue-500 focus:outline-none'
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              <div className='bg-[#f5f5f5] rounded-lg p-4'>
                <button
                  onClick={handleAddSection}
                  className='w-full bg-white border border-slate-200 rounded-lg p-4 mb-4 transition-colors duration-200 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                >
                  <AddIcon className='w-4 h-[18px]' />
                  <span className='text-[13px] font-semibold'>Add Section</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onTaskUpdate={handleTaskEdit}
      />
    </div>
  );
};

export default KanbanBoard;
