import { lazy, Suspense, useMemo, useState } from 'react';
import {
  KanbanBoardProps,
  KanbanColumn as KanbanColumnTypes,
  TaskCard,
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

const TaskDetailModal = lazy(() => import('./task-detail-modal'));

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  data,
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
  onFetchTaskDetails,
  fieldVisibility = {},
  fieldDisabled = {},
}) => {
  const [columns, setColumns] = useState<KanbanColumnTypes[]>(data);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddTask = (
    columnId: string,
    task?: TaskCard,
    position: 'top' | 'bottom' = 'bottom'
  ) => {
    if (task) {
      setColumns(
        columns.map((column) =>
          column.id === columnId
            ? {
                ...column,
                tasks:
                  position === 'top'
                    ? [task, ...column.tasks]
                    : [...column.tasks, task],
                taskCount: column.taskCount + 1,
              }
            : column
        )
      );
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
        rid: `col-${Date.now()}`,
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

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTaskUpdate = (taskId: string, updatedTask: Partial<any>) => {
    // This is handled by the parent or can trigger re-fetch
    console.log('Task updated:', taskId, updatedTask);
  };

  const handleDragStart = () => {
    if (isDragable || isDragablebetweenBoards) {
      // Currently no action needed on drag start
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!isDragablebetweenBoards) return;

    const { active, over } = event;
    if (!over) return;

    let sourceColumnId: string | null = null;
    let targetColumnId: string | null = null;

    for (const column of columns) {
      if (column.tasks.some((t) => t.taskId === active.id)) {
        sourceColumnId = column.id;
      }
      if (column.tasks.some((t) => t.taskId === over.id)) {
        targetColumnId = column.id;
      }
    }

    if (columns.some((c) => c.id === over.id)) {
      targetColumnId = over.id as string;
    }

    if (!sourceColumnId || !targetColumnId) return;
    if (sourceColumnId === targetColumnId) return;

    const sourceColumn = columns.find((c) => c.id === sourceColumnId);
    const targetColumn = columns.find((c) => c.id === targetColumnId);

    if (!sourceColumn || !targetColumn) return;

    const taskIndex = sourceColumn.tasks.findIndex(
      (t) => t.taskId === active.id
    );
    if (taskIndex === -1) return;

    const [movedTask] = sourceColumn.tasks.splice(taskIndex, 1);

    setColumns([
      ...columns.map((col) => {
        if (col.id === sourceColumnId) {
          return {
            ...col,
            tasks: sourceColumn.tasks,
            taskCount: col.taskCount - 1,
          };
        }
        if (col.id === targetColumnId) {
          return {
            ...col,
            tasks: [...targetColumn.tasks, movedTask],
            taskCount: col.taskCount + 1,
          };
        }
        return col;
      }),
    ]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isDragable && !isDragablebetweenBoards) return;

    const { active, over } = event;
    if (!over) return;

    let sourceColumnId: string | null = null;
    let targetColumnId: string | null = null;
    let overTaskId: string | null = null;

    for (const column of columns) {
      if (column.tasks.some((t) => t.taskId === active.id)) {
        sourceColumnId = column.id;
      }
    }

    if (!sourceColumnId) return;

    for (const column of columns) {
      if (column.tasks.some((t) => t.taskId === over.id)) {
        targetColumnId = column.id;
        overTaskId = over.id as string;
        break;
      }
    }

    if (!targetColumnId && columns.some((c) => c.id === over.id)) {
      targetColumnId = over.id as string;
    }

    if (!targetColumnId) return;

    const sourceColumn = columns.find((c) => c.id === sourceColumnId)!;
    const targetColumn = columns.find((c) => c.id === targetColumnId)!;

    if (sourceColumnId === targetColumnId && isDragable) {
      const activeIndex = sourceColumn.tasks.findIndex(
        (t) => t.taskId === active.id
      );
      const overIndex = overTaskId
        ? sourceColumn.tasks.findIndex((t) => t.taskId === overTaskId)
        : sourceColumn.tasks.length - 1;

      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        const newTasks = arrayMove(sourceColumn.tasks, activeIndex, overIndex);
        setColumns(
          columns.map((col) =>
            col.id === sourceColumnId ? { ...col, tasks: newTasks } : col
          )
        );
      }
    } else if (sourceColumnId !== targetColumnId && isDragablebetweenBoards) {
      const taskIndex = sourceColumn.tasks.findIndex(
        (t) => t.taskId === active.id
      );
      if (taskIndex === -1) return;

      const [movedTask] = sourceColumn.tasks.splice(taskIndex, 1);

      setColumns(
        columns.map((col) => {
          if (col.id === sourceColumnId) {
            return {
              ...col,
              tasks: sourceColumn.tasks,
              taskCount: col.taskCount - 1,
            };
          }
          if (col.id === targetColumnId) {
            return {
              ...col,
              tasks: [...targetColumn.tasks, movedTask],
              taskCount: col.taskCount + 1,
            };
          }
          return col;
        })
      );
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
                  statusData={statusData}
                  priorityData={priorityData}
                  onTaskUpdate={handleTaskUpdate}
                  onFetchTaskDetails={onFetchTaskDetails}
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
          {isModalOpen && selectedTaskId && (
            <TaskDetailModal
              taskId={selectedTaskId}
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onTaskUpdate={handleTaskUpdate}
              statusData={statusData}
              priorityData={priorityData}
              tagData={tagData}
              availableUsers={userData}
              onFetchTaskDetails={onFetchTaskDetails}
              fieldVisibility={fieldVisibility}
              fieldDisabled={fieldDisabled}
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
              statusData={statusData}
              priorityData={priorityData}
              onTaskUpdate={handleTaskUpdate}
              onFetchTaskDetails={onFetchTaskDetails}
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
        {isModalOpen && selectedTaskId && (
          <TaskDetailModal
            taskId={selectedTaskId}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onTaskUpdate={handleTaskUpdate}
            statusData={statusData}
            priorityData={priorityData}
            tagData={tagData}
            availableUsers={userData}
            onFetchTaskDetails={onFetchTaskDetails}
            fieldVisibility={fieldVisibility}
            fieldDisabled={fieldDisabled}
          />
        )}
      </Suspense>
    </div>
  );
};

export default KanbanBoard;
