import React from 'react';
import { TaskCardProps } from './types';

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  showCommentCount,
  showProfileIndicator,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-teal-600 text-white';
      case 'High':
        return 'bg-red-500 text-white';
      case 'Complete':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-300 text-gray-800';
    }
  };

  return (
    <div className='bg-slate-700 border border-slate-600 rounded-lg p-4 mb-3 hover:bg-slate-600 transition-colors duration-200'>
      <div className='flex items-start gap-3 mb-3'>
        <div className='w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0'></div>
        <h3 className='text-white text-[13px] font-medium leading-relaxed'>
          {task.title}
        </h3>
      </div>

      <div className='flex items-center gap-2 mb-3'>
        <span
          className={`px-2 py-1 rounded-md text-[13px] font-medium ${getStatusColor('Done')}`}
        >
          Done
        </span>
        <span
          className={`px-2 py-1 rounded-md text-[13px] font-medium ${getStatusColor('High')}`}
        >
          High
        </span>
        <span
          className={`px-2 py-1 rounded-md text-[13px] font-medium ${getStatusColor('Complete')}`}
        >
          Complete
        </span>
      </div>

      <div className='flex items-center justify-between'>
        {showProfileIndicator && (
          <div
            className='w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-semibold'
            style={{ backgroundColor: task.assignee.color }}
          >
            {task.assignee.initials}
          </div>
        )}

        {showCommentCount && (
          <div className='flex items-center gap-1 text-gray-400'>
            {/* <MessageCircle size={16} /> */}
            <span className='text-[13px]'>{task.commentCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
