import type React from 'react';
import { useEffect } from 'react';
import type { TaskCardProps, TaskCard } from './types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CommentIcon, CustomChecklistIcon } from '../../assets';
import { generateInitials, getTagColor } from './helper';
import { Tooltip } from '@mui/material';
import { formatDateToYyyyMmmDd } from '../../common-utils';
import { getSvgIcon } from '../navbar/helper';

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

  console.log(taskData);

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

  const tags = Array.isArray(taskData.tags)
    ? taskData.tags.map((t, i) =>
        typeof t === 'string' ? { rid: i + 1, tag_name: t } : t
      )
    : [];

  const isDueTodayOrPast = (dateStr?: string) => {
    if (!dateStr) return false;
    const [year, month, day] = dateStr.split('-').map(Number);

    const dueDate = new Date(year, month - 1, day); // LOCAL date
    dueDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dueDate <= today;
  };

  const isOverdue = isDueTodayOrPast(taskData.effective_end_datetime || '');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDragable || isDragablebetweenBoards
        ? { ...attributes, ...listeners }
        : {})}
      onClick={handleCardClick}
      onDoubleClick={handleCardClick}
      className='bg-white border border-slate-200 rounded-lg p-2 mb-1 hover:bg-slate-50 transition-colors duration-200 group cursor-pointer'
    >
      <div className='flex items-center gap-1 mb-2'>
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
          {/* <div
            onClick={(e) => {
              e.stopPropagation();
              // Add link click handler here if needed
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
            }}
            className='cursor-pointer hover:bg-gray-100 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
          >
            <LinkTaskIcon className='w-3.5 h-3.5 text-gray-400 flex-shrink-0' />
          </div> */}
        </div>
      </div>

      {(taskData.task_status_name ||
        taskData.status_name ||
        taskData.priority_name) && (
        <div className='flex items-center gap-2 mb-2'>
          {(taskData.task_status_name || taskData.status_name) && (
            <div
              className='w-auto px-2 h-[19px] rounded text-[11px] font-medium flex items-center justify-center'
              style={{
                backgroundColor: statusColor.bg,
                color: statusColor.text,
                border: `0.5px solid ${statusColor.border}`,
                fontFamily: "'Mulish', 'Lexend', sans-serif",
              }}
            >
              {taskData.task_status_name || taskData.status_name}
            </div>
          )}

          {taskData.priority_name && (
            <div
              className='w-auto px-2 h-[19px] rounded text-[11px] font-medium flex items-center justify-center'
              style={{
                backgroundColor: priorityColor.bg,
                color: priorityColor.text,
                border: `0.5px solid ${priorityColor.border}`,
                fontFamily: "'Mulish', 'Lexend', sans-serif",
              }}
            >
              {taskData.priority_name}
            </div>
          )}
          {taskData?.is_flagged && <div>{getSvgIcon('flag', '#FF0000')}</div>}
        </div>
      )}

      <div className='flex items-center justify-between'>
        {showProfileIndicator && taskData.assigned_to_name && (
          <div
            className='w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shadow-sm'
            style={{
              backgroundColor: '#F3E8FF',
              color: '#6B21A8',
              fontFamily: "'Mulish', 'Lexend', sans-serif",
              fontSize: '10px',
            }}
            title={taskData.assigned_to_name}
          >
            {taskData.profile_url && (
              <img
                src={taskData.profile_url}
                alt='user-profile-img'
                className='w-full h-full object-cover rounded-full'
                onError={(e) => {
                  e.currentTarget.style.display = 'none'; // hide broken image
                  const fallback = e.currentTarget
                    .nextElementSibling as HTMLElement;
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
            )}

            {/* Initials fallback */}
            <span className={taskData.profile_url ? 'hidden' : ''}>
              {generateInitials(taskData.assigned_to_name)}
            </span>
          </div>
        )}

        <div className='flex items-center gap-2 ml-auto'>
          {taskData.checklists_count > 0 &&
            (() => {
              const isCompleted =
                taskData.completed_checklist_items_count ===
                taskData.checklists_count;

              return (
                <div className='flex items-center gap-1'>
                  <div className='w-3.5 h-3.5 flex items-center justify-center'>
                    <CustomChecklistIcon
                      className='w-3 h-3 mt-0.5'
                      style={{ color: isCompleted ? '#15803D' : '#9CA3AF' }}
                    />
                  </div>
                  <span
                    className='text-[10px] text-gray-400 h-3.5'
                    style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
                  >
                    {`${taskData.completed_checklist_items_count} / ${taskData.checklists_count}`}
                  </span>
                </div>
              );
            })()}

          {showCommentCount && (
            <div className='flex items-center gap-1 text-gray-400'>
              <div className='w-3.5 h-3.5 flex items-center justify-center'>
                <CommentIcon className='w-4 h-4 mt-1 text-gray-400' />
              </div>
              <span
                className='text-[10px] h-3.5'
                style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
              >
                {taskData?.comments_count ?? 0}
              </span>
            </div>
          )}

          {/* Attachments */}
          <div className='flex items-center gap-0.5 text-gray-400'>
            <div className='w-3.5 h-3.5 flex items-center justify-center'>
              <svg
                className='w-3 h-4 mt-0.5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13'
                />
              </svg>
            </div>
            <span
              className='text-[10px] h-3.5'
              style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
            >
              {taskData.attachment_count ?? 0}
            </span>
          </div>

          {/* Due Date */}
          {taskData.effective_end_datetime && (
            <Tooltip
              title={`Due: ${formatDateToYyyyMmmDd(taskData.effective_end_datetime)}`}
              arrow
              placement='top'
            >
              <div className={`flex items-center gap-1 text-gray-400`}>
                <div
                  className='w-3.5 h-3.5 flex items-center justify-center'
                  style={{
                    color: isOverdue ? '#DC2626' : '#9CA3AF',
                  }}
                >
                  <svg
                    className='w-3 h-3 mt-0.5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                    />
                  </svg>
                </div>
              </div>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Tags Section */}
      {tags && tags.length > 0 && (
        <div className='mt-2 border-t border-slate-200 py-1.5'>
          <div className='flex items-center gap-1 flex-wrap'>
            {(() => {
              let prevColor: string | undefined;

              return tags.map((item, index) => {
                const tagColor = getTagColor(index, prevColor);
                prevColor = tagColor.base;

                return (
                  <div
                    key={item.rid}
                    className='w-auto px-1.5 h-[18px] rounded text-[10px] font-medium flex items-center justify-center'
                    style={{
                      backgroundColor: tagColor.bg,
                      color: tagColor.text,
                      border: `0.5px solid ${tagColor.border}`,
                      fontFamily: "'Mulish', 'Lexend', sans-serif",
                    }}
                  >
                    {item.tag_name}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCardComponent;
