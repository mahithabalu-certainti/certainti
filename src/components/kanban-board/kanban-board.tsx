import { lazy, Suspense, useMemo, useState } from 'react';
import {
  KanbanBoardProps,
  KanbanColumn as KanbanColumnTypes,
  TaskDetails,
  TaskField,
} from './types';
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './kanban-column';
import { AddIcon } from '../../assets';
import { enrichTaskDetails } from './helper';

const TaskDetailModal = lazy(() => import('./task-detail-modal'));

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  data,
  taskDetails: initialTaskDetails,
  isCreateTaskDisabled = false,
  isCreateTaskHide = false,
  showCommentCount = true,
  showTaskCount = true,
  showProfileIndicator = true,
  statusData,
  priorityData,
  tagData,
  userData = [],
  isDragable = false,
  isDragablebetweenBoards = false,
}) => {
  const [columns, setColumns] = useState<KanbanColumnTypes[]>(data);
  const [taskDetails, setTaskDetails] =
    useState<Record<string, TaskDetails>>(initialTaskDetails);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [selectedTask, setSelectedTask] = useState<TaskDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fieldConfig: Partial<
    Record<TaskField, { isDisabled?: boolean; isHidden?: boolean }>
  > = {
    // Example configuration:
    // priority: { isDisabled: true },
    // description: { isHidden: true },
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddTask = (
    columnId: string,
    task?: TaskDetails,
    position: 'top' | 'bottom' = 'bottom'
  ) => {
    if (task) {
      const newTask = { taskId: task.id, rid: `task-${Date.now()}` };
      setColumns((prev) =>
        prev.map((column) =>
          column.id === columnId
            ? {
                ...column,
                tasks:
                  position === 'top'
                    ? [newTask, ...column.tasks]
                    : [...column.tasks, newTask],
                taskCount: column.taskCount + 1,
              }
            : column
        )
      );
      setTaskDetails((prev) => ({ ...prev, [task.id]: task }));
    }
  };

  const handleRenameColumn = (columnId: string, newName: string) => {
    setColumns(
      columns.map((column) =>
        column.id === columnId
          ? {
              ...column,
              name: newName,
            }
          : column
      )
    );
  };

  const handleDeleteColumn = (columnId: string) => {
    setColumns(columns.filter((column) => column.id !== columnId));
  };

  const handleAddSection = () => {
    setIsCreatingSection(true);
    setNewSectionName('');
  };

  const handleCreateSection = () => {
    if (newSectionName.trim()) {
      const newColumn: KanbanColumnTypes = {
        id: `column-${Date.now()}`,
        name: newSectionName.trim(),
        tasks: [],
        taskCount: 0,
      };
      setColumns([...columns, newColumn]);
      setIsCreatingSection(false);
      setNewSectionName('');
    }
  };

  const handleCancelCreateSection = () => {
    setIsCreatingSection(false);
    setNewSectionName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSection();
    } else if (e.key === 'Escape') {
      handleCancelCreateSection();
    }
  };

  const handleTaskClick = (task: TaskDetails) => {
    const enrichedTask = enrichTaskDetails(task, userData);
    setSelectedTask(enrichedTask);
    setIsModalOpen(true);
  };

  const handleTaskUpdate = (
    taskId: string,
    updatedTask: Partial<TaskDetails>
  ) => {
    setTaskDetails((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], ...updatedTask },
    }));

    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, ...updatedTask });
    }
  };

  const handleDragStart = () => {
    // Drag start logic can be added here if needed in the future
    if (isDragable || isDragablebetweenBoards) {
      // Currently no action needed on drag start
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!isDragablebetweenBoards) return;

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    const activeColumn = columns.find((col) =>
      col.tasks.some((t) => t.taskId === activeId)
    );
    const overColumn = columns.find((col) => {
      if (col.tasks.some((t) => t.taskId === overId)) return true;
      return col.id === overId;
    });

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) {
      return;
    }

    setColumns((prev) => {
      const activeTaskIndex = activeColumn.tasks.findIndex(
        (t) => t.taskId === activeId
      );
      const [movedTask] = activeColumn.tasks.splice(activeTaskIndex, 1);

      const overTaskIndex = overColumn.tasks.findIndex(
        (t) => t.taskId === overId
      );
      if (overTaskIndex !== -1) {
        overColumn.tasks.splice(overTaskIndex, 0, movedTask);
      } else {
        overColumn.tasks.push(movedTask);
      }

      return prev.map((col) => {
        if (col.id === activeColumn.id) {
          return { ...col, taskCount: col.tasks.length };
        }
        if (col.id === overColumn.id) {
          return { ...col, taskCount: col.tasks.length };
        }
        return col;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isDragable && !isDragablebetweenBoards) return;

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    const activeColumn = columns.find((col) =>
      col.tasks.some((t) => t.taskId === activeId)
    );
    const overColumn = columns.find((col) => {
      if (col.tasks.some((t) => t.taskId === overId)) return true;
      return col.id === overId;
    });

    if (!activeColumn) return;

    // Same column reordering
    if (overColumn && activeColumn.id === overColumn.id && isDragable) {
      const activeIndex = activeColumn.tasks.findIndex(
        (t) => t.taskId === activeId
      );
      const overIndex = activeColumn.tasks.findIndex(
        (t) => t.taskId === overId
      );

      if (activeIndex !== overIndex) {
        setColumns((prev) =>
          prev.map((col) => {
            if (col.id === activeColumn.id) {
              return {
                ...col,
                tasks: arrayMove(col.tasks, activeIndex, overIndex),
              };
            }
            return col;
          })
        );
      }
    }
  };

  const memoizedColumns = useMemo(() => columns, [columns]);

  if (isDragable || isDragablebetweenBoards) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className='min-h-screen p-4'>
          <div className='max-w-full overflow-x-auto'>
            <div className='flex items-start gap-6 pb-6'>
              {memoizedColumns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  taskDetails={taskDetails}
                  showTaskCount={showTaskCount}
                  showCommentCount={showCommentCount}
                  showProfileIndicator={showProfileIndicator}
                  isCreateTaskDisabled={isCreateTaskDisabled}
                  isCreateTaskHide={isCreateTaskHide}
                  onAddTask={handleAddTask}
                  onRenameColumn={handleRenameColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onTaskClick={handleTaskClick}
                  isDragablebetweenBoards={isDragablebetweenBoards}
                />
              ))}

              {!isCreateTaskHide && (
                <div className='flex-shrink-0 w-80'>
                  {isCreatingSection ? (
                    <div className='bg-[#f5f5f5] rounded-lg p-4'>
                      <div className='bg-white border border-slate-200 rounded-lg p-4 mb-4'>
                        <input
                          type='text'
                          value={newSectionName}
                          onChange={(e) => setNewSectionName(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={handleCancelCreateSection}
                          placeholder='Enter section name'
                          className='w-full bg-white text-slate-800 text-[13px] font-semibold px-2 py-1 rounded border border-slate-300 focus:border-blue-500 focus:outline-none'
                          autoFocus
                        />
                      </div>
                    </div>
                  ) : (
                    <div className='bg-[#f5f5f5] rounded-lg p-4'>
                      <button
                        onClick={handleAddSection}
                        className='w-full bg-white border border-slate-200 rounded-lg p-4 mb-4 transition-colors duration-200 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      >
                        <AddIcon className='w-4 h-[18px]' />
                        <span className='text-[13px] font-semibold'>
                          Add Section
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <Suspense fallback={null}>
          {isModalOpen && selectedTask && (
            <TaskDetailModal
              task={selectedTask}
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onTaskUpdate={handleTaskUpdate}
              statusData={statusData}
              priorityData={priorityData}
              tagData={tagData}
              availableUsers={userData}
              activities={selectedTask?.activities || []}
              fieldConfig={fieldConfig}
            />
          )}
        </Suspense>
      </DndContext>
    );
  }

  return (
    <div className='min-h-screen p-4'>
      <div className='max-w-full overflow-x-auto'>
        <div className='flex items-start gap-6 pb-6'>
          {memoizedColumns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              taskDetails={taskDetails}
              showTaskCount={showTaskCount}
              showCommentCount={showCommentCount}
              showProfileIndicator={showProfileIndicator}
              isCreateTaskDisabled={isCreateTaskDisabled}
              isCreateTaskHide={isCreateTaskHide}
              onAddTask={handleAddTask}
              onRenameColumn={handleRenameColumn}
              onDeleteColumn={handleDeleteColumn}
              onTaskClick={handleTaskClick}
              isDragable={isDragable}
              isDragablebetweenBoards={isDragablebetweenBoards}
            />
          ))}

          {!isCreateTaskHide && (
            <div className='flex-shrink-0 w-80'>
              {isCreatingSection ? (
                <div className='bg-[#f5f5f5] rounded-lg p-4'>
                  <div className='bg-white border border-slate-200 rounded-lg p-4 mb-4'>
                    <input
                      type='text'
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={handleCancelCreateSection}
                      placeholder='Enter section name'
                      className='w-full bg-white text-slate-800 text-[13px] font-semibold px-2 py-1 rounded border border-slate-300 focus:border-blue-500 focus:outline-none'
                      autoFocus
                    />
                  </div>
                </div>
              ) : (
                <div className='bg-[#f5f5f5] rounded-lg p-4'>
                  <button
                    onClick={handleAddSection}
                    className='w-full bg-white border border-slate-200 rounded-lg p-4 mb-4 transition-colors duration-200 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  >
                    <AddIcon className='w-4 h-[18px]' />
                    <span className='text-[13px] font-semibold'>
                      Add Section
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        {isModalOpen && selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onTaskUpdate={handleTaskUpdate}
            statusData={statusData}
            priorityData={priorityData}
            tagData={tagData}
            availableUsers={userData}
            activities={selectedTask?.activities || []}
            fieldConfig={fieldConfig}
          />
        )}
      </Suspense>
    </div>
  );
};

export default KanbanBoard;
