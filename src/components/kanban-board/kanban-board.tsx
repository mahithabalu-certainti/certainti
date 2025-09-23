import React, { useState } from 'react';
import { KanbanBoardProps, KanbanColumn as KanbanColumnType } from './types';
import KanbanColumn from './kanban-column';
import TextButton from '../button/text-button';

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  data,
  isCreateTaskDisabled = false,
  isCreateTaskHide = false,
  showCommentCount = true,
  showTaskCount = true,
  showProfileIndicator = true,
}) => {
  const [columns, setColumns] = useState<KanbanColumnType[]>(data);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

  const handleAddTask = (columnId: string) => {
    setSelectedColumnId(columnId);
    // Get the button position to show modal nearby
    const button = document.querySelector(
      `[data-column-id="${columnId}"]`
    ) as HTMLElement;
    if (button) {
      const rect = button.getBoundingClientRect();
      setModalPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
    setShowAddTaskModal(true);
  };

  const handleCreateTask = () => {
    if (newTaskTitle.trim() && selectedColumnId) {
      const newTask = {
        id: Date.now().toString(),
        title: newTaskTitle,
        status: 'High' as const,
        assignee: {
          name: 'New User',
          initials: 'NU',
          color: '#8B5CF6',
        },
        commentCount: 0,
        createdAt: new Date(),
      };

      setColumns(
        columns.map((column) =>
          column.id === selectedColumnId
            ? {
                ...column,
                tasks: [...column.tasks, newTask],
                taskCount: column.taskCount + 1,
              }
            : column
        )
      );

      setNewTaskTitle('');
      setShowAddTaskModal(false);
      setSelectedColumnId('');
    }
  };

  return (
    <div className='min-h-screen p-4'>
      <div className='max-w-full overflow-x-auto'>
        <div className='flex items-start gap-6 pb-6'>
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              showTaskCount={showTaskCount}
              showCommentCount={showCommentCount}
              showProfileIndicator={showProfileIndicator}
              isCreateTaskDisabled={isCreateTaskDisabled}
              isCreateTaskHide={isCreateTaskHide}
              onAddTask={handleAddTask}
            />
          ))}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div
          className='absolute z-50'
          style={{
            top: `${modalPosition.top}px`,
            left: `${modalPosition.left}px`,
          }}
        >
          <div className='bg-slate-800 p-4 rounded-lg w-80 shadow-lg border border-slate-600'>
            <h3 className='text-white text-[13px] font-semibold mb-3'>
              Add New Task
            </h3>
            <textarea
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder='Enter Task name...'
              rows={2}
              className='w-full p-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none mb-3 resize-none text-[13px]'
              autoFocus
            />
            <div className='flex gap-2'>
              <TextButton
                label='Add Task'
                onClick={handleCreateTask}
                sx={{ flex: 1 }}
              />
              <TextButton
                label='Cancel'
                onClick={() => {
                  setShowAddTaskModal(false);
                  setNewTaskTitle('');
                  setSelectedColumnId('');
                }}
                sx={{ flex: 1 }}
                color='inherit'
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
