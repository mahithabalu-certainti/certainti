import { KanbanColumn, User } from './types';

export const mockUserData: User[] = [
  { id: '1', name: 'John Doe', initials: 'JD', color: '#3B82F6' },
  { id: '2', name: 'Jane Smith', initials: 'JS', color: '#10B981' },
  { id: '3', name: 'Mike Johnson', initials: 'MJ', color: '#F59E0B' },
  { id: '4', name: 'Sarah Wilson', initials: 'SW', color: '#EF4444' },
  { id: '5', name: 'David Brown', initials: 'DB', color: '#8B5CF6' },
];

export const mockKanbanData: KanbanColumn[] = [
  {
    id: 'todo',
    name: 'To Do',
    taskCount: 3,
    tasks: [
      {
        id: 'task-1',
        title: 'Design homepage wireframes',
        description: 'Create wireframes for the new homepage design including mobile responsive layouts',
        status: 'To Do',
        priority: 'High',
        assignee: {
          name: 'John Doe',
          initials: 'JD',
          color: '#3B82F6',
        },
        collaborators: [
          {
            name: 'Jane Smith',
            initials: 'JS',
            color: '#10B981',
          },
        ],
        tags: ['Design', 'UI/UX'],
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-15'),
        attachments: ['wireframe-v1.pdf', 'design-specs.figma'],
        commentCount: 5,
        createdAt: new Date('2025-10-28'),
        activities: [
          {
            id: 'task-1-activity-1',
            user: 'John Doe',
            action: 'created this task',
            date: '3 days ago',
          },
          {
            id: 'task-1-activity-2',
            user: 'Jane Smith',
            action: 'added this task to',
            link: 'Project Management',
            date: '2 days ago',
          },
          {
            id: 'task-1-activity-3',
            user: 'John Doe',
            action: 'set the priority to High',
            date: '1 day ago',
          },
        ],
      },
      {
        id: 'task-2',
        title: 'Set up development environment',
        description: 'Configure local development environment with all necessary tools and dependencies',
        status: 'To Do',
        priority: 'Medium',
        assignee: {
          name: 'Mike Johnson',
          initials: 'MJ',
          color: '#F59E0B',
        },
        tags: ['Development', 'Setup'],
        commentCount: 2,
        createdAt: new Date('2025-10-30'),
        activities: [
          {
            id: 'task-2-activity-1',
            user: 'Mike Johnson',
            action: 'created this task',
            date: '4 days ago',
          },
          {
            id: 'task-2-activity-2',
            user: 'David Brown',
            action: 'added development requirements',
            date: '2 days ago',
          },
        ],
      },
      {
        id: 'task-3',
        title: 'Research competitor analysis',
        status: 'To Do',
        priority: 'Low',
        assignee: {
          name: 'Sarah Wilson',
          initials: 'SW',
          color: '#EF4444',
        },
        commentCount: 1,
        createdAt: new Date('2025-11-01'),
        activities: [
          {
            id: 'task-3-activity-1',
            user: 'Sarah Wilson',
            action: 'created this task',
            date: '2 days ago',
          },
          {
            id: 'task-3-activity-2',
            user: 'John Doe',
            action: 'added research guidelines',
            date: '1 day ago',
          },
          {
            id: 'task-3-activity-3',
            user: 'Sarah Wilson',
            action: 'started competitor research',
            date: '4 hours ago',
          },
        ],
      },
    ],
  },
  {
    id: 'in-progress',
    name: 'In Progress',
    taskCount: 2,
    tasks: [
      {
        id: 'task-4',
        title: 'Implement user authentication',
        description: 'Build secure user authentication system with JWT tokens and password encryption',
        status: 'In Progress',
        priority: 'High',
        assignee: {
          name: 'David Brown',
          initials: 'DB',
          color: '#8B5CF6',
        },
        collaborators: [
          {
            name: 'John Doe',
            initials: 'JD',
            color: '#3B82F6',
          },
          {
            name: 'Mike Johnson',
            initials: 'MJ',
            color: '#F59E0B',
          },
        ],
        tags: ['Backend', 'Security'],
        startDate: new Date('2025-10-25'),
        endDate: new Date('2025-11-10'),
        attachments: ['auth-flow.png'],
        commentCount: 8,
        createdAt: new Date('2025-10-25'),
        activities: [
          {
            id: 'task-4-activity-1',
            user: 'David Brown',
            action: 'created this task',
            date: '9 days ago',
          },
          {
            id: 'task-4-activity-2',
            user: 'John Doe',
            action: 'added this task to',
            link: 'Security Sprint',
            date: '8 days ago',
          },
          {
            id: 'task-4-activity-3',
            user: 'Mike Johnson',
            action: 'added JWT implementation notes',
            date: '5 days ago',
          },
          {
            id: 'task-4-activity-4',
            user: 'David Brown',
            action: 'moved to In Progress',
            date: '3 days ago',
          },
        ],
      },
      {
        id: 'task-5',
        title: 'Create product landing page',
        status: 'In Progress',
        priority: 'Medium',
        assignee: {
          name: 'Jane Smith',
          initials: 'JS',
          color: '#10B981',
        },
        tags: ['Frontend', 'Marketing'],
        commentCount: 3,
        createdAt: new Date('2025-10-28'),
        activities: [
          {
            id: 'task-5-activity-1',
            user: 'Jane Smith',
            action: 'created this task',
            date: '6 days ago',
          },
          {
            id: 'task-5-activity-2',
            user: 'Sarah Wilson',
            action: 'provided marketing content',
            date: '4 days ago',
          },
          {
            id: 'task-5-activity-3',
            user: 'Jane Smith',
            action: 'started page development',
            date: '2 days ago',
          },
        ],
      },
    ],
  },
  {
    id: 'done',
    name: 'Done',
    taskCount: 2,
    tasks: [
      {
        id: 'task-6',
        title: 'Database schema design',
        description: 'Design and implement the database schema for user management and content storage',
        status: 'Done',
        priority: 'High',
        assignee: {
          name: 'Mike Johnson',
          initials: 'MJ',
          color: '#F59E0B',
        },
        tags: ['Database', 'Backend'],
        startDate: new Date('2025-10-15'),
        endDate: new Date('2025-10-25'),
        attachments: ['schema.sql', 'er-diagram.png'],
        commentCount: 12,
        createdAt: new Date('2025-10-15'),
        activities: [
          {
            id: 'task-6-activity-1',
            user: 'Mike Johnson',
            action: 'created this task',
            date: '19 days ago',
          },
          {
            id: 'task-6-activity-2',
            user: 'David Brown',
            action: 'reviewed database requirements',
            date: '15 days ago',
          },
          {
            id: 'task-6-activity-3',
            user: 'Mike Johnson',
            action: 'completed schema design',
            date: '10 days ago',
          },
          {
            id: 'task-6-activity-4',
            user: 'John Doe',
            action: 'approved schema implementation',
            date: '9 days ago',
          },
        ],
      },
      {
        id: 'task-7',
        title: 'Project requirements gathering',
        status: 'Done',
        assignee: {
          name: 'Sarah Wilson',
          initials: 'SW',
          color: '#EF4444',
        },
        tags: ['Planning'],
        commentCount: 6,
        createdAt: new Date('2025-10-10'),
        activities: [
          {
            id: 'task-7-activity-1',
            user: 'Sarah Wilson',
            action: 'created this task',
            date: '24 days ago',
          },
          {
            id: 'task-7-activity-2',
            user: 'John Doe',
            action: 'added stakeholder feedback',
            date: '20 days ago',
          },
          {
            id: 'task-7-activity-3',
            user: 'Sarah Wilson',
            action: 'finalized requirements document',
            date: '15 days ago',
          },
        ],
      },
    ],
  },
];
