import { useEffect, useRef, useState } from 'react';
import { TaskCardProps } from './types';
import { PencilIcon, CommentIcon } from '../../assets';
import CustomChecklistIcon from './CustomChecklistIcon';
import { MenuItem, Select, SelectChangeEvent } from '@mui/material';

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  showCommentCount,
  showProfileIndicator,
  onEditTask,
  onTaskClick,
  statusData,
  priorityData,
  onTaskUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditTitle(task.title);
  }, [task.title]);

  const getColor = (type: 'status' | 'priority', value: string) => {
    const colors = {
      status: {
        'To Do': { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' },
        'In Progress': { bg: '#EFF6FF', text: '#3730A3', border: '#DBEAFE' },
        Done: { bg: '#F0FDF4', text: '#166534', border: '#DCFCE7' },
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

  const getAssigneeColor = (originalColor: string) => {
    const assigneeColors = [
      '#E0F2FE',
      '#F0FDF4',
      '#FEF3C7',
      '#E7E5E4',
      '#F3E8FF',
      '#FCE7F3',
    ];

    const hash = originalColor.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return assigneeColors[Math.abs(hash) % assigneeColors.length];
  };

  const handleStatusChange = (
    event: SelectChangeEvent<'Done' | 'In Progress' | 'To Do'>
  ) => {
    if (onTaskUpdate) {
      onTaskUpdate(task.id, {
        status: event.target.value as 'Done' | 'In Progress' | 'To Do',
      });
    }
  };

  const handlePriorityChange = (
    event: SelectChangeEvent<'Low' | 'Medium' | 'High'>
  ) => {
    if (onTaskUpdate) {
      onTaskUpdate(task.id, {
        priority: event.target.value as 'Low' | 'Medium' | 'High',
      });
    }
  };

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle.trim() !== task.title && onEditTask) {
      onEditTask(task.id, editTitle.trim());
    } else {
      setEditTitle(task.title);
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  // Calculate checklist progress
  const getChecklistProgress = () => {
    if (!task.checklist || task.checklist.length === 0) return null;

    const completedItems = task.checklist.filter(
      (item) => item.completed
    ).length;
    const totalItems = task.checklist.length;
    const percentage = Math.round((completedItems / totalItems) * 100);

    return {
      completed: completedItems,
      total: totalItems,
      percentage,
    };
  };

  const checklistProgress = getChecklistProgress();

  return (
    <div
      onClick={() => onTaskClick?.(task)}
      className='bg-white border border-slate-200 rounded-lg p-3 mb-2 hover:bg-slate-50 transition-colors duration-200 group cursor-pointer'
    >
      <div className='flex items-center gap-1 mb-3'>
        <div className='w-2 h-2 bg-slate-300 rounded-full flex-shrink-0'></div>
        <div className='flex-1 flex items-center justify-between'>
          {isEditing ? (
            <input
              ref={inputRef}
              type='text'
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleSaveEdit}
              className='flex-1 bg-white text-slate-800 text-[13px] font-medium px-2 py-1 rounded border border-slate-300 focus:border-blue-500 focus:outline-none'
            />
          ) : (
            <h3 className='text-slate-800 text-[13px] font-medium leading-relaxed flex-1'>
              {task.title}
            </h3>
          )}

          {!isEditing && onEditTask && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className='opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-slate-200 ml-2'
              title='Edit task'
            >
              <PencilIcon
                size={14}
                className='text-slate-500 hover:text-slate-700'
              />
            </button>
          )}
        </div>
      </div>

      {/* Select Options Row - Two selects in one row */}
      <div className='flex items-center gap-2 mb-3'>
        {/* Status Select */}
        <div className='w-[80px]' onClick={(e) => e.stopPropagation()}>
          <Select
            name='status'
            className='custom-select-no-arrow w-full h-full'
            onChange={handleStatusChange}
            value={task.status || ''}
            displayEmpty
            fullWidth
            size='small'
            disabled={true}
            MenuProps={{
              PaperProps: {
                sx: {
                  maxWidth: 300,
                  maxHeight: 300,
                  marginTop: '4px',
                  zIndex: 40,
                  boxShadow:
                    'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
                  '& .MuiMenuItem-root': {
                    fontSize: '11px',
                    padding: '4px 8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                },
              },
            }}
            sx={{
              height: '28px',
              fontSize: '11px',
              '& .MuiSelect-icon': {
                display: 'none',
              },
              '& .MuiOutlinedInput-root': {
                '&.Mui-disabled': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '0.5px solid #E2E8F0',
                  },
                },
              },
              '.MuiSelect-select': {
                padding: '4px 4px 4px 8px !important',
                minHeight: 'unset !important',
                color: task.status
                  ? `${getColor('status', task.status).text} !important`
                  : '#7D98B6 !important',
                backgroundColor: task.status
                  ? `${getColor('status', task.status).bg} !important`
                  : 'transparent !important',
                fontSize: '11px !important',
                fontWeight: '500',
                '&.Mui-disabled': {
                  WebkitTextFillColor: task.status
                    ? `${getColor('status', task.status).text} !important`
                    : '#7D98B6 !important',
                  backgroundColor: task.status
                    ? `${getColor('status', task.status).bg} !important`
                    : 'transparent !important',
                },
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: '0.5px solid #E2E8F0',
                borderRadius: '4px',
              },
            }}
          >
            {(
              statusData || [
                { id: '1', name: 'To Do', color: '#gray' },
                { id: '2', name: 'In Progress', color: '#blue' },
                { id: '3', name: 'Done', color: '#green' },
              ]
            ).map((status) => (
              <MenuItem
                sx={{
                  color: '#425A76',
                  fontSize: '11px',
                  fontWeight: '500',
                }}
                key={status.id}
                value={status.name}
                title={status.name}
              >
                {status.name}
              </MenuItem>
            ))}
          </Select>
        </div>

        {/* Priority Select */}
        <div className='w-[80px]' onClick={(e) => e.stopPropagation()}>
          <Select
            name='priority'
            className='custom-select-no-arrow w-full h-full'
            onChange={handlePriorityChange}
            value={task.priority || ''}
            displayEmpty
            fullWidth
            size='small'
            disabled={true}
            MenuProps={{
              PaperProps: {
                sx: {
                  maxWidth: 300,
                  maxHeight: 300,
                  marginTop: '4px',
                  zIndex: 40,
                  boxShadow:
                    'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
                  '& .MuiMenuItem-root': {
                    fontSize: '11px',
                    padding: '4px 8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                },
              },
            }}
            sx={{
              height: '28px',
              fontSize: '11px',
              '& .MuiSelect-icon': {
                display: 'none',
              },
              '& .MuiOutlinedInput-root': {
                '&.Mui-disabled': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '0.5px solid #E2E8F0',
                  },
                },
              },
              '.MuiSelect-select': {
                padding: '4px 4px 4px 8px !important',
                minHeight: 'unset !important',
                color: task.priority
                  ? `${getColor('priority', task.priority).text} !important`
                  : '#7D98B6 !important',
                backgroundColor: task.priority
                  ? `${getColor('priority', task.priority).bg} !important`
                  : 'transparent !important',
                fontSize: '11px !important',
                fontWeight: '500',
                '&.Mui-disabled': {
                  WebkitTextFillColor: task.priority
                    ? `${getColor('priority', task.priority).text} !important`
                    : '#7D98B6 !important',
                  backgroundColor: task.priority
                    ? `${getColor('priority', task.priority).bg} !important`
                    : 'transparent !important',
                },
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: '0.5px solid #E2E8F0',
                borderRadius: '4px',
              },
            }}
            renderValue={(value) => {
              if (!value)
                return (
                  <span style={{ color: '#7D98B6', fontSize: '11px' }}>
                    Priority
                  </span>
                );
              return value;
            }}
          >
            <MenuItem
              value=''
              sx={{ color: '#425A76', fontSize: '11px', fontWeight: '500' }}
            >
              Select Priority
            </MenuItem>
            {(
              priorityData || [
                { id: '1', name: 'Low', color: '#gray' },
                { id: '2', name: 'Medium', color: '#yellow' },
                { id: '3', name: 'High', color: '#red' },
              ]
            ).map((priority) => (
              <MenuItem
                sx={{
                  color: '#425A76',
                  fontSize: '11px',
                  fontWeight: '500',
                }}
                key={priority.id}
                value={priority.name}
                title={priority.name}
              >
                {priority.name}
              </MenuItem>
            ))}
          </Select>
        </div>
      </div>

      <div className='flex items-center justify-between'>
        {showProfileIndicator && (
          <div
            className='w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold border border-white shadow-sm'
            style={{
              backgroundColor: getAssigneeColor(task.assignee.color),
              color: '#374151',
            }}
          >
            {task.assignee.initials}
          </div>
        )}

        <div className='flex items-center gap-2 ml-auto'>
          {/* Progress Indicator for Checklist */}
          {checklistProgress && (
            <div className='flex items-center gap-1 text-gray-400'>
              <CustomChecklistIcon className='w-3 h-3 text-gray-400' />
              <span className='text-[11px]'>
                {checklistProgress.completed}/{checklistProgress.total}
              </span>
            </div>
          )}

          {/* Comments Count */}
          {showCommentCount && (
            <div className='flex items-center gap-1 text-gray-400'>
              <CommentIcon className='w-3 h-3 text-gray-400' />
              <span className='text-[11px]'>{task.commentCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
