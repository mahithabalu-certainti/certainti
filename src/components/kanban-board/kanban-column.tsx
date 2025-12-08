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
  { bg: '#F3E8FF', text: '#6B21A8', border: '#E9D5FF' }, // Purple
  { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' }, // Blue
  { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' }, // Green
  { bg: '#F0FDFA', text: '#0F766E', border: '#CCFBF1' }, // Teal
  { bg: '#FFF1F2', text: '#9F1239', border: '#FECDD3' }, // Rose
  { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' }, // Indigo
  { bg: '#FCE7F3', text: '#9D174D', border: '#FBCFE8' }, // Pink
  { bg: '#ECFEFF', text: '#155E75', border: '#CFFAFE' }, // Cyan
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
        className='border rounded-lg p-2 mb-1'
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
              className='px-2 py-1 rounded-full text-[13px]'
              style={{
                fontFamily: "'Mulish', 'Lexend', sans-serif",
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                color: headerColor.text,
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
          disabled={isCreateTaskDisabled}
          className={`w-full flex items-center gap-2 p-2 rounded-lg border-2 border-dashed transition-colors duration-200 ${
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
    </div>
  );
};

export default KanbanColumn;
