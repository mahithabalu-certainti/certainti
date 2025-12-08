import type React from 'react';
import { useMemo } from 'react';
import type { KanbanColumnProps } from './types';
import { useDroppable } from '@dnd-kit/core';
import { AddIcon } from '../../assets';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import TaskCardComponent from './task-card';
import type { RoleOption } from '../../consultant/services/case-team/case-team-service';

interface ExtendedKanbanColumnProps extends KanbanColumnProps {
  isDragable?: boolean;
  isDragablebetweenBoards?: boolean;
  roleOptions?: RoleOption[];
  collaboratorData?: Array<{ rid: string; name: string; email?: string }>;
  availableUsers?: Array<{ rid: string; name: string; email?: string }>;
  onCreateModalOpen?: () => void;
  onOpenCreateTask?: (columnId: string, columnName: string) => void;
}

const KanbanColumn: React.FC<ExtendedKanbanColumnProps> = ({
  column,
  showTaskCount,
  showCommentCount,
  showProfileIndicator,
  isCreateTaskDisabled,
  isCreateTaskHide,
  onTaskClick,
  isDragable = false,
  isDragablebetweenBoards = false,
  statusData,
  statusOptions,
  priorityData,
  onOpenCreateTask,
  onCreateModalOpen,
}) => {
  const { setNodeRef } = useDroppable({
    id: column.rid,
    data: { type: 'Column', column },
  });

  const uniqueTasks = useMemo(() => {
    const seen = new Set();
    return column.tasks.filter((task) => {
      const duplicate = seen.has(task.rid);
      seen.add(task.rid);
      return !duplicate;
    });
  }, [column.tasks]);

  return (
    <div
      ref={setNodeRef}
      className='bg-[#f5f5f5] rounded-lg p-0.5 w-60 flex-shrink-0'
      style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
    >
      <div className='bg-white border border-slate-200 rounded-lg p-2 mb-1'>
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
        items={uniqueTasks.map((t) => t.rid)}
        strategy={verticalListSortingStrategy}
        disabled={!isDragable && !isDragablebetweenBoards}
      >
        <div className='space-y-1.5 mb-2'>
          {uniqueTasks.map((taskCard) => (
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
            />
          ))}
        </div>
      </SortableContext>

      {!isCreateTaskHide && (
        <button
          onClick={() => {
            if (onOpenCreateTask) {
              onOpenCreateTask(column.rid, column.milestone_name);
            }
            onCreateModalOpen?.();
          }}
          disabled={isCreateTaskDisabled}
          className={`w-full flex items-center gap-2 p-2 rounded-lg border-2 border-dashed transition-colors duration-200 ${isCreateTaskDisabled
              ? 'border-slate-300 text-slate-400 cursor-not-allowed'
              : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-600'
            }`}
          style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
        >
          <AddIcon size={18} />
          <span className='text-[13px] font-medium'>Add Task</span>
        </button>
      )}
    </div>
  );
};

export default KanbanColumn;
