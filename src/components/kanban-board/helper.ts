import { Assignee, User, Task, UserOption } from './types';

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





export const enrichUserOption = (userOption: UserOption): User => {
  return {
    id: userOption.rid,
    name: userOption.name,
    initials: generateInitials(userOption.name),
    color: generateColorFromName(userOption.name),
  };
};



export const enrichAssignee = (assignee: {
  name: string;
  initials?: string;
  color?: string;
}): Assignee => {
  return {
    name: assignee.name,
    initials: assignee.initials || generateInitials(assignee.name),
    color: assignee.color || generateColorFromName(assignee.name),
  };
};

export const normalizeTags = (
  tags: (string | { tag_name?: string; name?: string; tag_rid?: string })[]
): string[] => {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => {
      if (typeof tag === 'string') return tag;
      if (typeof tag === 'object' && tag.tag_name) return tag.tag_name;
      if (typeof tag === 'object' && tag.name) return tag.name;
      return '';
    })
    .filter(Boolean);
};

export const enrichTask = (task: Task): Task => {
  const enrichedTask = { ...task };

  if (enrichedTask.assignee) {
    enrichedTask.assignee = enrichAssignee(enrichedTask.assignee);
  }

  if (enrichedTask.collaborators && enrichedTask.collaborators.length > 0) {
    enrichedTask.collaborators = enrichedTask.collaborators.map(enrichAssignee);
  }

  if (enrichedTask.tags) {
    enrichedTask.tags = normalizeTags(enrichedTask.tags);
  }

  return enrichedTask;
};
