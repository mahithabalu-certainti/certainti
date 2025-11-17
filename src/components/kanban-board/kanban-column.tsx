import type React from 'react';
import { useState } from 'react';
import type { KanbanColumnProps, TaskCard } from './types';
import { useDroppable } from '@dnd-kit/core';
import { AddIcon } from '../../assets';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import TaskCardComponent from './task-card';
import TaskCreateModal from './task-create-modal';
import type { RoleOption } from '../../consultant/services/case-team/case-team-service';

interface ExtendedKanbanColumnProps extends KanbanColumnProps {
  isDragable?: boolean;
  isDragablebetweenBoards?: boolean;
  roleOptions?: RoleOption[];
  tagData?: Array<{ id: string; name: string }>;
  collaboratorData?: Array<{ rid: string; name: string; email?: string }>;
  availableUsers?: Array<{ rid: string; name: string; email?: string }>;
}

const KanbanColumn: React.FC<ExtendedKanbanColumnProps> = ({
  column,
  showTaskCount,
  showCommentCount,
  showProfileIndicator,
  isCreateTaskDisabled,
  isCreateTaskHide,
  onAddTask,
  onTaskClick,
  isDragable = false,
  isDragablebetweenBoards = false,
  statusData,
  statusOptions,
  priorityData,
  onTaskUpdate,
  onCreateTask,
  roleOptions = [],
  tagData = [],
  collaboratorData = [],
  availableUsers = [],
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { setNodeRef } = useDroppable({
    id: column.rid,
    data: { type: 'Column', column },
  });

  const handleCreateTask = async (columnId: string, task: TaskCard) => {
    try {
      if (onCreateTask) {
        await onCreateTask(columnId, task);
      }
      onAddTask(columnId, task, 'bottom');
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  };

  return (
    <div
      ref={setNodeRef}
      className='bg-[#f5f5f5] rounded-lg p-4 w-80 flex-shrink-0'
      style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
    >
      <div className='bg-white border border-slate-200 rounded-lg p-3 mb-2'>
        <div className='flex items-center gap-2'>
          <h2
            className='text-slate-800 text-[13px] font-semibold'
            style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
          >
            {column.milestone_name}
          </h2>
          {showTaskCount && (
            <span
              className='bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-[13px]'
              style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
            >
              {column.task_count}
            </span>
          )}
        </div>
      </div>

      <SortableContext
        items={column.tasks.map((t) => t.rid)}
        strategy={verticalListSortingStrategy}
        disabled={!isDragable && !isDragablebetweenBoards}
      >
        <div className='space-y-2 mb-2'>
          {column.tasks.map((taskCard) => (
            <TaskCardComponent
              key={taskCard.rid}
              taskId={taskCard.rid}
              taskData={taskCard}
              showCommentCount={showCommentCount}
              showProfileIndicator={showProfileIndicator}
              onTaskClick={onTaskClick}
              isDragable={isDragable}
              isDragablebetweenBoards={isDragablebetweenBoards}
              statusData={statusData}
              statusOptions={statusOptions}
              priorityData={priorityData}
              onTaskUpdate={onTaskUpdate}
            />
          ))}
        </div>
      </SortableContext>

      {!isCreateTaskHide && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          disabled={isCreateTaskDisabled}
          className={`w-full flex items-center gap-2 p-3 rounded-lg border-2 border-dashed transition-colors duration-200 ${
            isCreateTaskDisabled
              ? 'border-slate-300 text-slate-400 cursor-not-allowed'
              : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-600'
          }`}
          style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
        >
          <AddIcon size={18} />
          <span className='text-[13px] font-medium'>Add Task</span>
        </button>
      )}

      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTask={handleCreateTask}
        columnId={column.rid}
        columnName={column.milestone_name}
        statusData={statusData}
        priorityData={priorityData}
        tagData={tagData}
        collaboratorData={collaboratorData}
        availableUsers={availableUsers}
        roleOptions={roleOptions}
      />
    </div>
  );
};

export default KanbanColumn;
