import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { ActiveItem, Board, KanbanProps, Task } from './types';
import BoardColumn from './boardColumns';
import TaskCard from './taskCard';
import { AddIcon } from '../../assets';

const KanbanBoard: React.FC<KanbanProps> = ({
  boards,
  onBoardsChange,
  config = {},
  className = '',
}) => {
  const [activeItem, setActiveItem] = React.useState<ActiveItem | null>(null);

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

  const {
    allowCreateBoard = true,
    allowDeleteBoard = true,
    allowSwapBoards = true,
    allowCreateTask = true,
    allowTaskMovement = true,
    maxBoardsLimit,
    customDropdownOptions = [],
  } = config;

  const visibleBoards = boards.filter((board) => !board.hidden);

  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;

    if (data?.task) {
      setActiveItem({
        task: data.task,
        boardId: data.boardId,
        type: 'task',
      });
    } else if (data?.board) {
      setActiveItem({
        board: data.board,
        boardId: data.board.id,
        type: 'board',
      });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !allowTaskMovement) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (
      activeData?.task &&
      overData?.board &&
      activeData.boardId !== overData.board.id
    ) {
      const sourceBoard = boards.find((b) => b.id === activeData.boardId);
      const targetBoard = overData.board;

      if (!sourceBoard || !targetBoard) return;

      const targetVisibleTasks = targetBoard.tasks.filter(
        (t: Task) => !t.hidden
      );
      if (
        targetBoard.maxItems &&
        targetVisibleTasks.length >= targetBoard.maxItems
      ) {
        return;
      }

      const updatedBoards = boards.map((board) => {
        if (board.id === activeData.boardId) {
          return {
            ...board,
            tasks: board.tasks.filter((task) => task.id !== activeData.task.id),
          };
        }
        if (board.id === targetBoard.id) {
          return {
            ...board,
            tasks: [...board.tasks, activeData.task],
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

    if (!over) return;

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
          tasks: [...board.tasks, newTask],
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

  const handleBoardDuplicate = (boardId: string) => {
    const boardToDuplicate = boards.find((board) => board.id === boardId);
    if (boardToDuplicate) {
      const duplicatedBoard: Board = {
        ...boardToDuplicate,
        id: generateId(),
        title: `${boardToDuplicate.title} (Copy)`,
        tasks: boardToDuplicate.tasks.map((task) => ({
          ...task,
          id: generateId(),
        })),
      };
      onBoardsChange([...boards, duplicatedBoard]);
    }
  };

  const canCreateBoard =
    allowCreateBoard && (!maxBoardsLimit || boards.length < maxBoardsLimit);

  return (
    <div className={`p-6 bg-gray-100 min-h-screen ${className}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          className='flex gap-6 overflow-x-auto pb-6'
          role='region'
          aria-label='Kanban Board'
        >
          {visibleBoards.map((board, index) => (
            <BoardColumn
              key={board.id}
              board={board}
              boardIndex={index}
              onTaskCreate={allowCreateTask ? handleTaskCreate : undefined}
              onTaskUpdate={handleTaskUpdate}
              onBoardDelete={allowDeleteBoard ? handleBoardDelete : undefined}
              onBoardDuplicate={handleBoardDuplicate}
              customDropdownOptions={customDropdownOptions}
              allowCreateTask={allowCreateTask}
              allowTaskInteraction={allowTaskMovement}
              allowBoardSwap={allowSwapBoards}
            />
          ))}

          {canCreateBoard && (
            <div className='flex-shrink-0 w-80'>
              <button
                onClick={handleBoardCreate}
                className='
                  w-full h-32 border-2 border-dashed border-gray-300 rounded-lg
                  flex items-center justify-center text-gray-500 hover:border-gray-400 
                  hover:text-gray-600 transition-all duration-200 group bg-white/50
                '
                title='Create New Board'
              >
                <div className='text-center'>
                  <AddIcon
                    size={24}
                    className='mx-auto mb-2 transition-transform group-hover:scale-110'
                  />
                  <span className='text-sm font-medium'>Add Board</span>
                </div>
              </button>
            </div>
          )}
        </div>

        <DragOverlay>
          {activeItem?.type === 'task' ? (
            <div className='transform scale-105 opacity-90 shadow-xl'>
              <TaskCard
                task={activeItem.task}
                boardId={activeItem.boardId}
                disabled={false}
              />
            </div>
          ) : activeItem?.type === 'board' ? (
            <div className='w-80 opacity-95 shadow-xl transform scale-105'>
              <BoardColumn
                board={activeItem.board}
                boardIndex={0}
                allowBoardSwap={false}
                allowCreateTask={false}
                allowTaskInteraction={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
