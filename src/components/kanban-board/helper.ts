import { Assignee, TaskDetails, User } from './types';

export const generateInitials = (name: string): string => {
  if (!name) return 'U';

  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

export const generateColorFromName = (name: string): string => {
  const colors = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F97316',
    '#6366F1',
    '#84CC16',
  ];

  if (!name) return colors[0];

  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
};

export const userToAssignee = (user: User): Assignee => {
  return {
    name: user.name,
    initials: user.initials || generateInitials(user.name),
    color: user.color || generateColorFromName(user.name),
  };
};

export const enrichUser = (user: User): User => {
  return {
    ...user,
    initials: user.initials || generateInitials(user.name),
    color: user.color || generateColorFromName(user.name),
  };
};

export const enrichUsers = (users: User[]): User[] => {
  return users.map(enrichUser);
};

export const enrichTaskDetails = (
  task: TaskDetails,
  users: User[]
): TaskDetails => {
  const enrichedAssignee =
    users.find((u) => u.name === task.assignee.name) || task.assignee;

  const enrichedCollaborators =
    task.collaborators?.map(
      (collaborator) =>
        users.find((u) => u.name === collaborator.name) || collaborator
    ) || [];

  return {
    ...task,
    assignee: {
      ...task.assignee,
      initials:
        enrichedAssignee.initials || generateInitials(enrichedAssignee.name),
      color: enrichedAssignee.color || generateColorFromName(enrichedAssignee.name),
    },
    collaborators: enrichedCollaborators.map((c) => ({
      ...c,
      initials: c.initials || generateInitials(c.name),
      color: c.color || generateColorFromName(c.name),
    })),
  };
};
