'use client';

import React from 'react';
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { ActiveItem, Board, KanbanProps, Task } from './types';

import Card from './card';
import BoardColumn from './boardColumns';

const AddIcon = ({ className = '' }: { className?: string }) => (
  <svg
    width='16'
    height='16'
    viewBox='0 0 24 24'
    fill='none'
    className={className}
  >
    <path
      d='M12 5v14M5 12h14'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const KanbanBoard: React.FC<KanbanProps> = ({
  boards = [],
  onBoardsChange,
  config = {},
  className = '',
}) => {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    })
  );

  const [activeItem, setActiveItem] = React.useState<ActiveItem | null>(null);

  if (!boards || !Array.isArray(boards)) {
    return (
      <div className={`p-6 bg-gray-100 min-h-screen ${className}`}>
        <div className='text-center text-gray-500' style={{ fontSize: '13px' }}>
          No boards available
        </div>
      </div>
    );
  }

  const {
    allowCreateBoard = true,
    allowDeleteBoard = true,
    allowSwapBoards = true,
    allowCreateTask = true,
    allowTaskMovement = true,
    allowTaskDelete = true,
    maxBoardsLimit,
    customDropdownOptions = [],
  } = config;

  const visibleBoards = (boards || []).filter((board) => !board.hidden);

  // Find the full board object and its index for the DragOverlay
  const draggedBoard =
    activeItem?.type === 'board'
      ? boards.find((b) => b.id === activeItem.board.id)
      : null;

  const draggedBoardIndex =
    activeItem?.type === 'board' && draggedBoard
      ? boards.findIndex((b) => b.id === draggedBoard.id)
      : -1;

  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Direct swap function for boards
  const swapBoards = (
    boards: Board[],
    fromIndex: number,
    toIndex: number
  ): Board[] => {
    const newBoards = [...boards];
    [newBoards[fromIndex], newBoards[toIndex]] = [
      newBoards[toIndex],
      newBoards[fromIndex],
    ];
    return newBoards;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;

    console.log('Drag start:', data); // Debug log

    if (data?.type === 'task') {
      setActiveItem({
        type: 'task',
        task: data.task,
        boardId: data.boardId,
      });
    } else if (data?.type === 'board') {
      setActiveItem({
        type: 'board',
        board: data.board,
        boardId: data.board.id,
      });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !boards || !Array.isArray(boards)) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Only handle task movement in dragOver, not board swapping
    if (
      activeData?.type === 'task' &&
      overData?.type === 'board' &&
      allowTaskMovement
    ) {
      const activeTaskId = activeData.task.id;
      const sourceBoardId = activeData.boardId;
      const targetBoardId = overData.board.id;

      if (sourceBoardId === targetBoardId) return;

      const sourceBoard = boards.find((b) => b.id === sourceBoardId);
      const targetBoard = boards.find((b) => b.id === targetBoardId);

      if (!sourceBoard || !targetBoard) return;

      const targetVisibleTasks = targetBoard.tasks.filter((t) => !t.hidden);
      if (
        targetBoard.maxItems &&
        targetVisibleTasks.length >= targetBoard.maxItems
      ) {
        return;
      }

      const updatedBoards = boards.map((board) => {
        if (board.id === sourceBoardId) {
          return {
            ...board,
            tasks: board.tasks.filter((task) => task.id !== activeTaskId),
          };
        }
        if (board.id === targetBoardId) {
          const newTasks = [...board.tasks];
          if (!newTasks.find((t) => t.id === activeData.task.id)) {
            newTasks.unshift(activeData.task);
          }
          return {
            ...board,
            tasks: newTasks,
          };
        }
        return board;
      });

      onBoardsChange(updatedBoards);
      if (active.data.current) {
        active.data.current.boardId = targetBoardId;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over || !boards || !Array.isArray(boards)) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    console.log('Drag end:', { activeData, overData, allowSwapBoards }); // Debug log

    // Handle board swapping - direct swap only
    if (
      activeData?.type === 'board' &&
      overData?.type === 'board' &&
      allowSwapBoards
    ) {
      console.log('Board swap detected'); // Debug log

      const activeIndex = boards.findIndex((b) => b.id === activeData.board.id);
      const overIndex = boards.findIndex((b) => b.id === overData.board.id);

      console.log('Board indices:', { activeIndex, overIndex }); // Debug log

      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        console.log('Performing board swap'); // Debug log
        const swappedBoards = swapBoards(boards, activeIndex, overIndex);
        onBoardsChange(swappedBoards);
      }
      return;
    }

    // Handle task to task sorting within the same board or between boards
    if (activeData?.type === 'task' && overData?.type === 'task') {
      const activeTaskId = activeData.task.id;
      const overTaskId = overData.task.id;
      const activeBoardId = activeData.boardId;
      const overBoardId = overData.boardId;

      // Same board reordering
      if (activeBoardId === overBoardId) {
        const board = boards.find((b) => b.id === activeBoardId);
        if (!board) return;

        const activeIndex = board.tasks.findIndex((t) => t.id === activeTaskId);
        const overIndex = board.tasks.findIndex((t) => t.id === overTaskId);

        if (activeIndex !== overIndex) {
          const updatedBoards = boards.map((b) => {
            if (b.id === activeBoardId) {
              return {
                ...b,
                tasks: arrayMove(b.tasks, activeIndex, overIndex),
              };
            }
            return b;
          });
          onBoardsChange(updatedBoards);
        }
      } else {
        // Cross-board task movement
        const sourceBoard = boards.find((b) => b.id === activeBoardId);
        const targetBoard = boards.find((b) => b.id === overBoardId);

        if (!sourceBoard || !targetBoard) return;

        const targetVisibleTasks = targetBoard.tasks.filter((t) => !t.hidden);
        if (
          targetBoard.maxItems &&
          targetVisibleTasks.length >= targetBoard.maxItems
        ) {
          return;
        }

        const activeTaskIndex = sourceBoard.tasks.findIndex(
          (t) => t.id === activeTaskId
        );
        const [movedTask] = sourceBoard.tasks.splice(activeTaskIndex, 1);

        const overTaskIndex = targetBoard.tasks.findIndex(
          (t) => t.id === overTaskId
        );
        targetBoard.tasks.splice(overTaskIndex, 0, movedTask);

        const updatedBoards = boards.map((b) => {
          if (b.id === sourceBoard.id) return sourceBoard;
          if (b.id === targetBoard.id) return targetBoard;
          return b;
        });

        onBoardsChange(updatedBoards);
      }
    }

    // Handle task to board drop (when not already handled in dragOver)
    if (activeData?.type === 'task' && overData?.type === 'board') {
      const activeTaskId = activeData.task.id;
      const sourceBoardId = activeData.boardId;
      const targetBoardId = overData.board.id;

      if (sourceBoardId === targetBoardId) return;

      const sourceBoard = boards.find((b) => b.id === sourceBoardId);
      const targetBoard = boards.find((b) => b.id === targetBoardId);

      if (!sourceBoard || !targetBoard) return;

      const targetVisibleTasks = targetBoard.tasks.filter((t) => !t.hidden);
      if (
        targetBoard.maxItems &&
        targetVisibleTasks.length >= targetBoard.maxItems
      ) {
        return;
      }

      const activeTaskIndex = sourceBoard.tasks.findIndex(
        (t) => t.id === activeTaskId
      );
      const [movedTask] = sourceBoard.tasks.splice(activeTaskIndex, 1);
      targetBoard.tasks.push(movedTask);

      const updatedBoards = boards.map((b) => {
        if (b.id === sourceBoard.id) return sourceBoard;
        if (b.id === targetBoard.id) return targetBoard;
        return b;
      });

      onBoardsChange(updatedBoards);
    }
  };

  const handleTaskCreate = (boardId: string, taskTitle: string) => {
    const newTask: Task = {
      id: generateId(),
      title: taskTitle,
      completed: false,
      createdAt: new Date(),
    };

    const updatedBoards = boards.map((board) => {
      if (board.id === boardId) {
        return {
          ...board,
          tasks: [newTask, ...board.tasks],
        };
      }
      return board;
    });

    onBoardsChange(updatedBoards);
  };

  const handleTaskUpdate = (
    boardId: string,
    taskId: string,
    updates: Partial<Task>
  ) => {
    const updatedBoards = boards.map((board) => {
      if (board.id === boardId) {
        return {
          ...board,
          tasks: board.tasks.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          ),
        };
      }
      return board;
    });

    onBoardsChange(updatedBoards);
  };

  const handleTaskDelete = (boardId: string, taskId: string) => {
    const updatedBoards = boards.map((board) => {
      if (board.id === boardId) {
        return {
          ...board,
          tasks: board.tasks.filter((task) => task.id !== taskId),
        };
      }
      return board;
    });

    onBoardsChange(updatedBoards);
  };

  const handleBoardCreate = () => {
    const colors = [
      '#8B5CF6',
      '#EC4899',
      '#06B6D4',
      '#F59E0B',
      '#10B981',
      '#EF4444',
    ];
    const newBoard: Board = {
      id: generateId(),
      title: `New Board ${boards.length + 1}`,
      color: colors[boards.length % colors.length],
      tasks: [],
      maxItems: 10,
    };

    onBoardsChange([...boards, newBoard]);
  };

  const handleBoardDelete = (boardId: string) => {
    const updatedBoards = boards.filter((board) => board.id !== boardId);
    onBoardsChange(updatedBoards);
  };

  const handleBoardRename = (boardId: string, newTitle: string) => {
    const updatedBoards = boards.map((board) => {
      if (board.id === boardId) {
        return { ...board, title: newTitle };
      }
      return board;
    });
    onBoardsChange(updatedBoards);
  };

  const canCreateBoard =
    allowCreateBoard && (!maxBoardsLimit || boards.length < maxBoardsLimit);

  return (
    <div className={`p-6 min-h-screen ${className}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          className='flex gap-6 overflow-x-auto pb-6 items-start'
          role='region'
          aria-label='Kanban Board'
        >
          <SortableContext
            items={visibleBoards.map((board) => `board-${board.id}`)}
            strategy={horizontalListSortingStrategy}
          >
            {visibleBoards.map((board, index) => (
              <BoardColumn
                key={board.id}
                board={board}
                boardIndex={index}
                onTaskCreate={allowCreateTask ? handleTaskCreate : undefined}
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={allowTaskDelete ? handleTaskDelete : undefined}
                onBoardDelete={allowDeleteBoard ? handleBoardDelete : undefined}
                onBoardRename={handleBoardRename}
                customDropdownOptions={customDropdownOptions}
                allowCreateTask={allowCreateTask}
                allowTaskInteraction={allowTaskMovement}
                allowTaskDelete={allowTaskDelete}
                allowBoardSwap={allowSwapBoards}
              />
            ))}
          </SortableContext>

          {canCreateBoard && (
            <div className='flex-shrink-0 w-80'>
              <button
                onClick={handleBoardCreate}
                className='
                  w-full h-32 border-2 border-dashed border-gray-300
                  flex items-center justify-center text-gray-500 hover:border-gray-400
                  hover:text-gray-600 transition-all duration-200 group bg-white/50
                  focus:outline-none focus:ring-0
                '
                style={{ borderRadius: '2px' }}
                title='Create New Board'
              >
                <div className='text-center'>
                  <AddIcon className='w-3 p-[1px]' />
                  <span className='font-medium' style={{ fontSize: '13px' }}>
                    Add Board
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>

        <DragOverlay>
          {activeItem?.type === 'task' ? (
            <Card
              task={activeItem.task}
              boardId={activeItem.boardId}
              disabled={false}
              allowDelete={allowTaskDelete}
            />
          ) : activeItem?.type === 'board' && draggedBoard ? (
            <div className='flex-shrink-0 w-80'>
              <BoardColumn
                board={draggedBoard}
                boardIndex={draggedBoardIndex}
                customDropdownOptions={customDropdownOptions}
                allowCreateTask={allowCreateTask}
                allowTaskInteraction={allowTaskMovement}
                allowTaskDelete={allowTaskDelete}
                allowBoardSwap={allowSwapBoards}
                onTaskCreate={undefined}
                onTaskUpdate={undefined}
                onTaskDelete={undefined}
                onBoardDelete={undefined}
                onBoardRename={undefined}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
