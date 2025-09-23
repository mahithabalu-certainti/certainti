import { KanbanColumn } from '../../../../../components/kanban-board/types';

export const mockKanbanData: KanbanColumn[] = [
  {
    id: '1',
    name: 'Kick-Off',
    taskCount: 2,
    tasks: [
      {
        id: '1',
        title: 'Kick-Off Meeting - PS Team & Tax/Finance Team',
        status: 'High',
        assignee: {
          name: 'Kevin V.',
          initials: 'KV',
          color: '#8B5CF6',
        },
        commentCount: 1,
        createdAt: new Date(),
      },
      {
        id: '2',
        title: 'Kick-Off Meeting - PS Team & Delivery Team Heads',
        status: 'High',
        assignee: {
          name: 'Kevin V.',
          initials: 'KV',
          color: '#8B5CF6',
        },
        commentCount: 1,
        createdAt: new Date(),
      },
    ],
  },
  {
    id: '2',
    name: 'In Progress',
    taskCount: 3,
    tasks: [
      {
        id: '3',
        title: 'Design System Implementation',
        status: 'High',
        assignee: {
          name: 'Sarah M.',
          initials: 'SM',
          color: '#EF4444',
        },
        commentCount: 3,
        createdAt: new Date(),
      },
      {
        id: '4',
        title: 'API Integration Testing',
        status: 'Complete',
        assignee: {
          name: 'Mike J.',
          initials: 'MJ',
          color: '#10B981',
        },
        commentCount: 0,
        createdAt: new Date(),
      },
      {
        id: '5',
        title: 'User Authentication Setup',
        status: 'Done',
        assignee: {
          name: 'Lisa K.',
          initials: 'LK',
          color: '#F59E0B',
        },
        commentCount: 2,
        createdAt: new Date(),
      },
    ],
  },
  {
    id: '3',
    name: 'Review',
    taskCount: 1,
    tasks: [
      {
        id: '6',
        title: 'Code Review - Authentication Module',
        status: 'High',
        assignee: {
          name: 'David R.',
          initials: 'DR',
          color: '#6366F1',
        },
        commentCount: 5,
        createdAt: new Date(),
      },
    ],
  },
];
