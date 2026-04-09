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
  index: number;
}

const HEADER_COLORS = [
  { bg: '#6488C4', text: '#FFFFFF', border: '#6488C4' }, // Darker Pastel Blue
  { bg: '#78B8A0', text: '#FFFFFF', border: '#78B8A0' }, // Darker Pastel Mint
  { bg: '#C888A8', text: '#FFFFFF', border: '#C888A8' }, // Darker Pastel Pink
  { bg: '#D88886', text: '#FFFFFF', border: '#D88886' }, // Darker Pastel Rose
  { bg: '#70A0C0', text: '#FFFFFF', border: '#70A0C0' }, // Darker Pastel Light Blue
  { bg: '#88B8A8', text: '#FFFFFF', border: '#88B8A8' }, // Darker Pastel Sage
  { bg: '#C888A8', text: '#FFFFFF', border: '#C888A8' }, // Darker Pastel Pink
  { bg: '#8898C8', text: '#FFFFFF', border: '#8898C8' }, // Darker Pastel Powder Blue
  { bg: '#B878B8', text: '#FFFFFF', border: '#B878B8' }, // Darker Pastel Lavender
];

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
  index,
  isCaseClosed,
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

  const headerColor = HEADER_COLORS[index % HEADER_COLORS.length];

  return (
    <div
      ref={setNodeRef}
      className='bg-[#f5f5f5] rounded-lg p-0.5 w-60 flex-shrink-0'
      style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
    >
      <div
        className='border rounded-lg p-1.5 mb-1'
        style={{
          backgroundColor: headerColor.bg,
          borderColor: headerColor.border,
        }}
      >
        <div className='flex items-center gap-2'>
          <h2
            className='text-[14px] font-semibold'
            style={{
              fontFamily: "'Mulish', 'Lexend', sans-serif",
              color: headerColor.text,
            }}
          >
            {column.milestone_name}
          </h2>
          {showTaskCount && (
            <span
              className='px-2 py-0.5 rounded-full text-[13px]'
              style={{
                fontFamily: "'Mulish', 'Lexend', sans-serif",
                backgroundColor: 'transparent',
                border: '1px solid #FFFFFF',
                borderRadius: '8px',
                color: '#FFFFFF',
              }}
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
          disabled={isCreateTaskDisabled || isCaseClosed}
          className={`w-full flex items-center gap-2 p-2 rounded-lg border-2 border-dashed transition-colors duration-200 ${
            isCreateTaskDisabled || isCaseClosed
              ? 'border-slate-300 text-slate-400 cursor-not-allowed'
              : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-600 cursor-pointer'
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
