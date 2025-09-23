import React from 'react';
import { KanbanColumnProps } from './types';
import { AddIcon } from '../../assets';
import TaskCard from './task-card';

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  showTaskCount,
  showCommentCount,
  showProfileIndicator,
  isCreateTaskDisabled,
  isCreateTaskHide,
  onAddTask,
}) => {
  return (
    <div className='bg-[#f5f5f5] rounded-lg p-4 w-80 flex-shrink-0'>
      <div className='bg-slate-700 border border-slate-600 rounded-lg p-4 mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <h2 className='text-white text-[13px] font-semibold'>{column.name}</h2>
          {showTaskCount && (
            <span className='bg-slate-600 text-white px-2 py-1 rounded-full text-[13px]'>
              {column.taskCount}
            </span>
          )}
        </div>
      </div>

      <div className='space-y-3 mb-4'>
        {column.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            showCommentCount={showCommentCount}
            showProfileIndicator={showProfileIndicator}
          />
        ))}
      </div>

      {!isCreateTaskHide && (
        <button
          onClick={() => onAddTask(column.id)}
          disabled={isCreateTaskDisabled}
          data-column-id={column.id}
          className={`w-full flex items-center gap-2 p-3 rounded-lg border-2 border-dashed transition-colors duration-200 ${
            isCreateTaskDisabled
              ? 'border-slate-600 text-slate-500 cursor-not-allowed'
              : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
          }`}
        >
          <AddIcon size={18} />
          <span className='text-[13px] font-medium'>Add task</span>
        </button>
      )}
    </div>
  );
};

export default KanbanColumn;
