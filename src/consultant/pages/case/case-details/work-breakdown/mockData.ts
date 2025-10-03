import { KanbanColumn } from '../../../../../components/kanban-board/types';

export const mockKanbanData: KanbanColumn[] = [
  {
    id: 'column-1',
    name: 'To Do',
    taskCount: 3,
    tasks: [
      {
        id: 'task-1',
        title: 'Design new landing page',
        status: 'To Do',
        assignee: {
          name: 'John Doe',
          initials: 'JD',
          color: '#3b82f6',
        },
        commentCount: 3,
        createdAt: new Date(),
        priority: 'High',
      },
      {
        id: 'task-2',
        title: 'Update user documentation',
        status: 'To Do',
        assignee: {
          name: 'Jane Smith',
          initials: 'JS',
          color: '#10b981',
        },
        commentCount: 1,
        createdAt: new Date(),
        priority: 'Medium',
      },
      {
        id: 'task-3',
        title: 'Fix mobile responsive issues',
        status: 'To Do',
        assignee: {
          name: 'Mike Johnson',
          initials: 'MJ',
          color: '#f59e0b',
        },
        commentCount: 5,
        createdAt: new Date(),
        priority: 'High',
      },
    ],
  },
  {
    id: 'column-2',
    name: 'In Progress',
    taskCount: 2,
    tasks: [
      {
        id: 'task-4',
        title: 'Implement authentication flow',
        status: 'In Progress',
        assignee: {
          name: 'Sarah Williams',
          initials: 'SW',
          color: '#8b5cf6',
        },
        commentCount: 7,
        createdAt: new Date(),
        priority: 'High',
      },
      {
        id: 'task-5',
        title: 'Create API endpoints',
        status: 'In Progress',
        assignee: {
          name: 'Tom Brown',
          initials: 'TB',
          color: '#ec4899',
        },
        commentCount: 2,
        createdAt: new Date(),
        priority: 'Medium',
      },
    ],
  },
  {
    id: 'column-3',
    name: 'Done',
    taskCount: 2,
    tasks: [
      {
        id: 'task-6',
        title: 'Setup project repository',
        status: 'Done',
        assignee: {
          name: 'Alice Cooper',
          initials: 'AC',
          color: '#06b6d4',
        },
        commentCount: 0,
        createdAt: new Date(),
        priority: 'Low',
      },
      {
        id: 'task-7',
        title: 'Configure CI/CD pipeline',
        status: 'Done',
        assignee: {
          name: 'Bob Wilson',
          initials: 'BW',
          color: '#14b8a6',
        },
        commentCount: 4,
        createdAt: new Date(),
        priority: 'Medium',
      },
    ],
  },
];
