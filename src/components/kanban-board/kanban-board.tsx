import type React from 'react';
import { useEffect, useState } from 'react';
import type {
  KanbanBoardProps,
  KanbanColumn as KanbanColumnTypes,
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

const LoadingSkeleton: React.FC = () => (
  <div
    className='p-4 font-[13px]'
    style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
  >
    <div className='max-w-full overflow-x-auto'>
      <div className='flex items-start gap-3 pb-6'>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className='bg-[#f5f5f5] rounded-lg p-2 w-72 flex-shrink-0'
          >
            <div className='bg-white border border-[#E4E6E7] rounded-lg p-2 mb-2 animate-pulse'>
              <div className='h-4 bg-[#E4E6E7] rounded w-3/4'></div>
            </div>
            {[1, 2, 3].map((j) => (
              <div
                key={j}
                className='bg-white border border-[#E4E6E7] rounded-lg p-2 mb-2 animate-pulse'
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
  isDragable = false,
  isDragablebetweenBoards = false,
  isLoading = false,
  onTaskClick,
  onCreateTask,
  fieldVisibility,
  fieldDisabled,
  accountId,
  caseId,
  caseStartDate,
  caseEndDate,
}) => {
  const [columns, setColumns] = useState<KanbanColumnTypes[]>(data);

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

  const handleTaskClick = (taskId: string) => {
    if (onTaskClick) {
      onTaskClick(taskId);
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

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      {isDragable || isDragablebetweenBoards ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div
            className='p-4 font-[13px]'
            style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
          >
            <div className='max-w-full overflow-x-auto'>
              <div className='flex items-start gap-2 pb-30'>
                {columns.map((column) => (
                  <KanbanColumn
                    key={column.rid}
                    column={column}
                    showTaskCount={showTaskCount}
                    showCommentCount={showCommentCount}
                    showProfileIndicator={showProfileIndicator}
                    isCreateTaskDisabled={isCreateTaskDisabled}
                    isCreateTaskHide={isCreateTaskHide}
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
                    onCreateTask={onCreateTask}
                    fieldVisibility={fieldVisibility}
                    fieldDisabled={fieldDisabled}
                    accountId={accountId}
                    caseId={caseId}
                    caseStartDate={caseStartDate}
                    caseEndDate={caseEndDate}
                  />
                ))}
              </div>
            </div>
          </div>
        </DndContext>
      ) : (
        <div
          className='p-4 font-[13px]'
          style={{ fontFamily: "'Mulish', 'Lexend', sans-serif" }}
        >
          <div className='max-w-full overflow-x-auto'>
            <div className='flex items-start gap-2 pb-30'>
              {columns.map((column) => (
                <KanbanColumn
                  key={column.rid}
                  column={column}
                  showTaskCount={showTaskCount}
                  showCommentCount={showCommentCount}
                  showProfileIndicator={showProfileIndicator}
                  isCreateTaskDisabled={isCreateTaskDisabled}
                  isCreateTaskHide={isCreateTaskHide}
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
                  onCreateTask={onCreateTask}
                  fieldVisibility={fieldVisibility}
                  fieldDisabled={fieldDisabled}
                  accountId={accountId}
                  caseId={caseId}
                  caseStartDate={caseStartDate}
                  caseEndDate={caseEndDate}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KanbanBoard;
