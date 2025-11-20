import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type {
  KanbanBoardProps,
  KanbanColumn as KanbanColumnTypes,
  TaskCard,
} from './types';
import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './kanban-column';
import { AddIcon } from '../../assets';

const LoadingSkeleton: React.FC = () => (
  <div
    className='min-h-screen p-4 font-[13px]'
    style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
  >
    <div className='max-w-full overflow-x-auto'>
      <div className='flex items-start gap-6 pb-6'>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className='bg-[#f5f5f5] rounded-lg p-4 w-80 flex-shrink-0'
          >
            <div className='bg-white border border-[#E4E6E7] rounded-lg p-3 mb-2 animate-pulse'>
              <div className='h-4 bg-[#E4E6E7] rounded w-3/4'></div>
            </div>
            {[1, 2, 3].map((j) => (
              <div
                key={j}
                className='bg-white border border-[#E4E6E7] rounded-lg p-3 mb-2 animate-pulse'
              >
                <div className='h-4 bg-[#E4E6E7] rounded w-3/4 mb-2'></div>
                <div className='h-3 bg-[#E4E6E7] rounded w-1/2'></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  data,
  isCreateTaskDisabled = false,
  isCreateTaskHide = false,
  showCommentCount = true,
  showTaskCount = true,
  showProfileIndicator = true,
  statusData,
  statusOptions,
  priorityData,
  tagData,
  checklistData = [],
  userData = [],
  roleOptions = [],
  isDragable = true,
  isDragablebetweenBoards = false,
  isLoading = false,
  onTaskClick,
  onCreateTask,
}) => {
  const [columns, setColumns] = useState<KanbanColumnTypes[]>(data);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  useEffect(() => {
    setColumns(data);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Function to determine which status data to use
  const getEffectiveStatusData = () => {
    if (statusOptions) {
      // Convert statusOptions to the expected format for backward compatibility
      return statusOptions.map((option) => ({
        id: option.value,
        name: option.label,
        color: option.value.toLowerCase() === 'active' ? '#10B981' : '#EF4444',
      }));
    }
    return statusData;
  };

  const effectiveStatusData = getEffectiveStatusData();

  const handleAddTask = (
    columnId: string,
    task?: TaskCard,
    position: 'top' | 'bottom' = 'bottom'
  ) => {
    if (task) {
      setColumns(
        columns.map((column) =>
          column.rid === columnId
            ? {
                ...column,
                tasks:
                  position === 'top'
                    ? [task, ...column.tasks]
                    : [...column.tasks, task],
                task_count: column.task_count + 1,
              }
            : column
        )
      );
    }
  };

  const handleRenameColumn = (columnId: string, newName: string) => {
    setColumns(
      columns.map((column) =>
        column.rid === columnId
          ? {
              ...column,
              milestone_name: newName,
            }
          : column
      )
    );
  };

  const handleDeleteColumn = (columnId: string) => {
    setColumns(columns.filter((column) => column.rid !== columnId));
  };

  const handleTaskClick = (taskId: string) => {
    // Call the parent's onTaskClick if provided
    if (onTaskClick) {
      onTaskClick(taskId);
    }
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
      if (column.tasks.some((t) => t.rid === active.id)) {
        sourceColumnId = column.rid;
      }
      if (column.tasks.some((t) => t.rid === over.id)) {
        targetColumnId = column.rid;
      }
    }

    if (columns.some((c) => c.rid === over.id)) {
      targetColumnId = over.id as string;
    }

    if (!sourceColumnId || !targetColumnId) return;
    if (sourceColumnId === targetColumnId) return;

    const sourceColumn = columns.find((c) => c.rid === sourceColumnId);
    const targetColumn = columns.find((c) => c.rid === targetColumnId);

    if (!sourceColumn || !targetColumn) return;

    const taskIndex = sourceColumn.tasks.findIndex((t) => t.rid === active.id);
    if (taskIndex === -1) return;

    const [movedTask] = sourceColumn.tasks.splice(taskIndex, 1);

    setColumns([
      ...columns.map((col) => {
        if (col.rid === sourceColumnId) {
          return {
            ...col,
            tasks: sourceColumn.tasks,
            task_count: col.task_count - 1,
          };
        }
        if (col.rid === targetColumnId) {
          return {
            ...col,
            tasks: [...targetColumn.tasks, movedTask],
            task_count: col.task_count + 1,
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
      if (column.tasks.some((t) => t.rid === active.id)) {
        sourceColumnId = column.rid;
      }
    }

    if (!sourceColumnId) return;

    for (const column of columns) {
      if (column.tasks.some((t) => t.rid === over.id)) {
        targetColumnId = column.rid;
        overTaskId = over.id as string;
        break;
      }
    }

    if (!targetColumnId && columns.some((c) => c.rid === over.id)) {
      targetColumnId = over.id as string;
    }

    if (!targetColumnId) return;

    const sourceColumn = columns.find((c) => c.rid === sourceColumnId)!;
    const targetColumn = columns.find((c) => c.rid === targetColumnId)!;

    if (sourceColumnId === targetColumnId && isDragable) {
      const activeIndex = sourceColumn.tasks.findIndex(
        (t) => t.rid === active.id
      );
      const overIndex = overTaskId
        ? sourceColumn.tasks.findIndex((t) => t.rid === overTaskId)
        : sourceColumn.tasks.length - 1;

      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        const newTasks = arrayMove(sourceColumn.tasks, activeIndex, overIndex);

        const updatedTasks = newTasks.map((task, index) => ({
          ...task,
          sequence_no: index + 1,
        }));

        console.log('[v0] Tasks reordered within column:', {
          columnId: sourceColumnId,
          columnName: sourceColumn.milestone_name,
          updatedSequence: updatedTasks.map((t) => ({
            rid: t.rid,
            task_name: t.task_name,
            sequence_no: t.sequence_no,
          })),
        });

        setColumns(
          columns.map((col) =>
            col.rid === sourceColumnId ? { ...col, tasks: updatedTasks } : col
          )
        );
      }
    } else if (sourceColumnId !== targetColumnId && isDragablebetweenBoards) {
      const taskIndex = sourceColumn.tasks.findIndex(
        (t) => t.rid === active.id
      );
      if (taskIndex === -1) return;

      const [movedTask] = sourceColumn.tasks.splice(taskIndex, 1);

      const sourceUpdated = sourceColumn.tasks.map((task, index) => ({
        ...task,
        sequence_no: index + 1,
      }));

      const targetUpdated = targetColumn.tasks.map((task, index) => ({
        ...task,
        sequence_no: index + 1,
      }));

      const movedTaskUpdated = {
        ...movedTask,
        sequence_no: targetUpdated.length + 1,
      };
      setColumns(
        columns.map((col) => {
          if (col.rid === sourceColumnId) {
            return {
              ...col,
              tasks: sourceUpdated,
              task_count: col.task_count - 1,
            };
          }
          if (col.rid === targetColumnId) {
            return {
              ...col,
              tasks: [...targetUpdated, movedTaskUpdated],
              task_count: col.task_count + 1,
            };
          }
          return col;
        })
      );
    }
  };

  const memoizedColumns = useMemo(() => columns, [columns]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      {isDragable || isDragablebetweenBoards ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div
            className='min-h-screen p-4 font-[13px]'
            style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
          >
            <div className='max-w-full overflow-x-auto'>
              <div className='flex items-start gap-6 pb-6'>
                {memoizedColumns.map((column) => (
                  <KanbanColumn
                    key={column.rid}
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
                    statusData={effectiveStatusData}
                    statusOptions={statusOptions}
                    priorityData={priorityData}
                    roleOptions={roleOptions}
                    tagData={tagData}
                    checklistData={checklistData}
                    collaboratorData={[]}
                    availableUsers={userData}
                    onTaskUpdate={handleTaskUpdate}
                    onCreateTask={onCreateTask}
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
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (newSectionName.trim()) {
                                  const newColumn: KanbanColumnTypes = {
                                    rid: `column-${Date.now()}`,
                                    milestone_name: newSectionName.trim(),
                                    tasks: [],
                                    task_count: 0,
                                  };
                                  setColumns([...columns, newColumn]);
                                  setIsCreatingSection(false);
                                  setNewSectionName('');
                                }
                              } else if (e.key === 'Escape') {
                                setIsCreatingSection(false);
                                setNewSectionName('');
                              }
                            }}
                            onBlur={() => {
                              setIsCreatingSection(false);
                              setNewSectionName('');
                            }}
                            placeholder='Enter section name'
                            className='w-full bg-white text-slate-800 text-[13px] font-semibold px-2 py-1 rounded border border-slate-300 focus:border-blue-500 focus:outline-none'
                            style={{
                              fontFamily: "'Mulish', 'Lexend', sans-serif",
                            }}
                            autoFocus
                          />
                        </div>
                      </div>
                    ) : (
                      <div className='bg-[#f5f5f5] rounded-lg p-4'>
                        <button
                          onClick={() => setIsCreatingSection(true)}
                          className='w-full bg-white border border-slate-200 rounded-lg p-4 mb-4 transition-colors duration-200 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                          style={{
                            fontFamily: "'Mulish', 'Lexend', sans-serif",
                          }}
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
        </DndContext>
      ) : (
        <div
          className='min-h-screen p-4 font-[13px]'
          style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
        >
          <div className='max-w-full overflow-x-auto'>
            <div className='flex items-start gap-6 pb-6'>
              {memoizedColumns.map((column) => (
                <KanbanColumn
                  key={column.rid}
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
                  statusData={effectiveStatusData}
                  statusOptions={statusOptions}
                  priorityData={priorityData}
                  roleOptions={roleOptions}
                  tagData={tagData}
                  checklistData={checklistData}
                  collaboratorData={[]}
                  availableUsers={userData}
                  onTaskUpdate={handleTaskUpdate}
                  onCreateTask={onCreateTask}
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
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (newSectionName.trim()) {
                                const newColumn: KanbanColumnTypes = {
                                  rid: `column-${Date.now()}`,
                                  milestone_name: newSectionName.trim(),
                                  tasks: [],
                                  task_count: 0,
                                };
                                setColumns([...columns, newColumn]);
                                setIsCreatingSection(false);
                                setNewSectionName('');
                              }
                            } else if (e.key === 'Escape') {
                              setIsCreatingSection(false);
                              setNewSectionName('');
                            }
                          }}
                          onBlur={() => {
                            setIsCreatingSection(false);
                            setNewSectionName('');
                          }}
                          placeholder='Enter section name'
                          className='w-full bg-white text-slate-800 text-[13px] font-semibold px-2 py-1 rounded border border-slate-300 focus:border-blue-500 focus:outline-none'
                          style={{
                            fontFamily: "'Mulish', 'Lexend', sans-serif",
                          }}
                          autoFocus
                        />
                      </div>
                    </div>
                  ) : (
                    <div className='bg-[#f5f5f5] rounded-lg p-4'>
                      <button
                        onClick={() => setIsCreatingSection(true)}
                        className='w-full bg-white border border-slate-200 rounded-lg p-4 mb-4 transition-colors duration-200 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                        style={{
                          fontFamily: "'Mulish', 'Lexend', sans-serif",
                        }}
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
      )}
    </>
  );
};

export default KanbanBoard;
