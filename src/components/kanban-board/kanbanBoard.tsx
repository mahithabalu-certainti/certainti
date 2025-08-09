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
import BoardColumn from './boardColumns';
import Card from './card';
import { AddIcon } from '../../assets';

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
    maxBoardsLimit,
    customDropdownOptions = [],
  } = config;

  const visibleBoards = (boards || []).filter((board) => !board.hidden);

  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;

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
    if (!over || !allowTaskMovement || !boards || !Array.isArray(boards))
      return;

    const activeData = active.data.current;
    const overData = over.data.current;

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

      const updatedBoards = boards.map((board) => {
        if (board.id === sourceBoardId) {
          return {
            ...board,
            tasks: board.tasks.filter((task) => task.id !== activeTaskId),
          };
        }
        if (board.id === targetBoardId) {
          return {
            ...board,
            tasks: [activeData.task, ...board.tasks],
          };
        }
        return board;
      });

      onBoardsChange(updatedBoards);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over || !boards || !Array.isArray(boards)) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (
      activeData?.type === 'board' &&
      overData?.type === 'board' &&
      allowSwapBoards
    ) {
      const activeIndex = boards.findIndex((b) => b.id === activeData.board.id);
      const overIndex = boards.findIndex((b) => b.id === overData.board.id);

      if (activeIndex !== overIndex) {
        onBoardsChange(arrayMove(boards, activeIndex, overIndex));
      }
      return;
    }

    if (activeData?.type === 'task' && overData?.type === 'task') {
      const activeTaskId = activeData.task.id;
      const overTaskId = overData.task.id;
      const activeBoardId = activeData.boardId;
      const overBoardId = overData.boardId;

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

        const overIndex = targetBoard.tasks.findIndex(
          (t) => t.id === overTaskId
        );

        const updatedBoards = boards.map((board) => {
          if (board.id === activeBoardId) {
            return {
              ...board,
              tasks: board.tasks.filter((task) => task.id !== activeTaskId),
            };
          }
          if (board.id === overBoardId) {
            const newTasks = [...board.tasks];
            newTasks.splice(overIndex, 0, activeData.task);
            return {
              ...board,
              tasks: newTasks,
            };
          }
          return board;
        });

        onBoardsChange(updatedBoards);
      }
    }

    if (activeData?.type === 'task' && overData?.type === 'board') {
      const activeTaskId = activeData.task.id;
      const sourceBoardId = activeData.boardId;
      const targetBoardId = overData.board.id;

      if (sourceBoardId === targetBoardId) return;

      const targetBoard = boards.find((b) => b.id === targetBoardId);
      if (!targetBoard) return;

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
          return {
            ...board,
            tasks: [activeData.task, ...board.tasks],
          };
        }
        return board;
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
    if (
      window.confirm(
        'Are you sure you want to delete this board? All tasks will be lost.'
      )
    ) {
      onBoardsChange(boards.filter((board) => board.id !== boardId));
    }
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
    <div className={`p-6 bg-gray-100 min-h-screen ${className}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          className='flex gap-6 overflow-x-auto pb-6'
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
                onBoardDelete={allowDeleteBoard ? handleBoardDelete : undefined}
                onBoardRename={handleBoardRename}
                customDropdownOptions={customDropdownOptions}
                allowCreateTask={allowCreateTask}
                allowTaskInteraction={allowTaskMovement}
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
            />
          ) : activeItem?.type === 'board' ? (
            <div className='flex-shrink-0 w-80'>
              <BoardColumn
                board={activeItem.board}
                boardIndex={0}
                allowBoardSwap={true}
                allowCreateTask={true}
                allowTaskInteraction={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
