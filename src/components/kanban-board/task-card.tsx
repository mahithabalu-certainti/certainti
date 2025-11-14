import type React from 'react';
import { useEffect } from 'react';
import type { TaskCardProps, TaskCard } from './types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CommentIcon, CustomChecklistIcon } from '../../assets';

interface ExtendedTaskCardProps extends TaskCardProps {
  isDragable?: boolean;
  isDragablebetweenBoards?: boolean;
  taskData?: TaskCard;
}

const TaskCardComponent: React.FC<ExtendedTaskCardProps> = ({
  taskId,
  taskData,
  showCommentCount,
  showProfileIndicator,
  onTaskClick,
  statusOptions,
  isDragable = false,
  isDragablebetweenBoards = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: taskId,
    data: { type: 'Task', taskId },
    disabled: !isDragable && !isDragablebetweenBoards,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (taskData) {
      // Perform any necessary side effects when taskData changes
    }
  }, [taskData]);

  const getColor = (type: 'status' | 'priority', value: string) => {
    if (type === 'status' && statusOptions) {
      // Use the new active/inactive status options with predefined colors
      const isActive = value.toLowerCase() === 'active';
      return {
        bg: isActive ? '#DCFCE7' : '#FEE2E2', // light green for active, light red for inactive
        text: isActive ? '#15803D' : '#DC2626', // dark green for active, dark red for inactive
        border: isActive ? '#BBF7D0' : '#FECACA', // green border for active, red border for inactive
      };
    }

    // Fallback to original color mapping for backward compatibility
    const colors = {
      status: {
        Active: { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' }, // green theme
        'To Do': { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' },
        'In Progress': { bg: '#EFF6FF', text: '#3730A3', border: '#DBEAFE' },
        Done: { bg: '#F0FDF4', text: '#166534', border: '#DCFCE7' },
        Inactive: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' }, // red theme
      },
      priority: {
        Low: { bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' },
        Medium: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
        High: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
      },
    } as const;

    const colorMap = colors[type];
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (colorMap as any)[value] || {
        bg: '#F9FAFB',
        text: '#374151',
        border: '#E5E7EB',
      }
    );
  };

  if (!taskData) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className='bg-white border border-slate-200 rounded-lg p-3 mb-2'
      >
        <div className='animate-pulse'>
          <div className='h-4 bg-slate-200 rounded w-3/4 mb-2'></div>
          <div className='h-3 bg-slate-200 rounded w-1/2'></div>
        </div>
      </div>
    );
  }

  const statusColor = getColor('status', taskData.task_status_name ?? ' ');
  const priorityColor = getColor('priority', taskData.priority_name ?? ' ');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDragable || isDragablebetweenBoards
        ? { ...attributes, ...listeners }
        : {})}
      onClick={() => onTaskClick?.(taskId)}
      onDoubleClick={() => onTaskClick?.(taskId)}
      className='bg-white border border-slate-200 rounded-lg p-3 mb-2 hover:bg-slate-50 transition-colors duration-200 group cursor-pointer'
    >
      <div className='flex items-center gap-1 mb-3'>
        <div className='w-2 h-2 bg-slate-300 rounded-full flex-shrink-0'></div>
        <div className='flex-1'>
          <h3
            className='text-slate-800 text-[13px] font-medium leading-relaxed'
            style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
          >
            {taskData.task_name}
          </h3>
        </div>
      </div>

      <div className='flex items-center gap-2 mb-3'>
        <div
          className='w-auto px-3 py-1 rounded text-[11px] font-medium'
          style={{
            backgroundColor: statusColor.bg,
            color: statusColor.text,
            border: `0.5px solid ${statusColor.border}`,
            fontFamily: "'Mulish', 'Lexend', sans-serif",
            fontSize: '13px',
          }}
        >
          {taskData.task_status_name}
        </div>

        <div
          className='w-auto px-3 py-1 rounded text-[11px] font-medium'
          style={{
            backgroundColor: priorityColor.bg,
            color: priorityColor.text,
            border: `0.5px solid ${priorityColor.border}`,
            fontFamily: "'Mulish', 'Lexend', sans-serif",
            fontSize: '13px',
          }}
        >
          {taskData.priority_name}
        </div>
      </div>

      <div className='flex items-center justify-between'>
        {showProfileIndicator && taskData.assigned_to_name && (
          <div
            className='w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold border border-white shadow-sm'
            style={{
              backgroundColor: '#E0F2FE',
              color: '#374151',
              fontFamily: "'Mulish', 'Lexend', sans-serif",
              fontSize: '13px',
            }}
            title={taskData.assigned_to_name}
          >
            {taskData.assigned_to_name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
        )}

        <div className='flex items-center gap-2 ml-auto'>
          {taskData.checklists_count > 0 && (
            <div className='flex items-center gap-1 text-gray-400'>
              <CustomChecklistIcon className='w-3 h-3 text-gray-400' />
              <span
                className='text-[13px]'
                style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
              >
                {taskData.checklists_count}
              </span>
            </div>
          )}

          {showCommentCount && (
            <div className='flex items-center gap-1 text-gray-400'>
              <CommentIcon className='w-3 h-3 text-gray-400' />
              <span
                className='text-[13px]'
                style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
              >
                0
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCardComponent;
