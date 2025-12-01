import type React from 'react';
import { useEffect } from 'react';
import type { TaskCardProps, TaskCard } from './types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CommentIcon, CustomChecklistIcon } from '../../assets';
import { generateInitials, generateColorFromName } from './helper';
import { Tooltip } from '@mui/material';

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
    const colors = {
      status: {
        // Status colors
        'To Do': { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' }, // Gray-100
        'In Progress': { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' }, // Blue-50
        Blocked: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' }, // Red-50
        Completed: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' }, // Emerald-50
        Active: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' }, // Emerald-50
        Inactive: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' }, // Red-50
      },
      priority: {
        // Priority colors
        Low: { bg: '#F0F9FF', text: '#075985', border: '#BAE6FD' }, // Sky-50
        Medium: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' }, // Amber-50
        High: { bg: '#FFF1F2', text: '#9F1239', border: '#FECDD3' }, // Rose-50
        Highest: { bg: '#FFF1F2', text: '#9F1239', border: '#FECDD3' }, // Rose-50
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent drag events from interfering with click
    if (isDragable || isDragablebetweenBoards) {
      e.stopPropagation();
    }
    onTaskClick?.(taskId);
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

  const statusColor = getColor(
    'status',
    (taskData.task_status_name || taskData.status_name) ?? ' '
  );
  const priorityColor = getColor('priority', taskData.priority_name ?? ' ');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDragable || isDragablebetweenBoards
        ? { ...attributes, ...listeners }
        : {})}
      onClick={handleCardClick}
      onDoubleClick={handleCardClick}
      className='bg-white border border-slate-200 rounded-lg p-3 mb-2 hover:bg-slate-50 transition-colors duration-200 group cursor-pointer'
    >
      <div className='flex items-center gap-1 mb-3'>
        <div className='w-2 h-2 bg-slate-300 rounded-full flex-shrink-0'></div>
        <div className='flex-1 flex items-start justify-between gap-2 min-w-0'>
          <Tooltip title={taskData.task_name} arrow placement='top'>
            <h3
              className='text-slate-800 text-[13px] font-medium leading-relaxed truncate cursor-pointer'
              style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
            >
              {taskData.task_name}
            </h3>
          </Tooltip>
          <div
            onClick={(e) => {
              e.stopPropagation();
              // Add link click handler here if needed
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
            }}
            className='cursor-pointer hover:bg-gray-100 rounded p-0.5'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth={1.5}
              stroke='currentColor'
              className='w-3.5 h-3.5 text-gray-400 flex-shrink-0'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244'
              />
            </svg>
          </div>
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
          {taskData.task_status_name || taskData.status_name}
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
              backgroundColor: generateColorFromName(taskData.assigned_to_name),
              color: '#374151',
              fontFamily: "'Mulish', 'Lexend', sans-serif",
              fontSize: '10px',
            }}
            title={taskData.assigned_to_name}
          >
            {generateInitials(taskData.assigned_to_name)}
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
                {taskData?.comments_count ?? 0}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCardComponent;
