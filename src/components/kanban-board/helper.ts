import { Assignee, User, Task, UserOption } from './types';

export const generateInitials = (name: string): string => {
  if (!name) return 'UA';

  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

export const generateColorFromName = (name: string): string => {
  if (!name) return '#9CA3AF'; // Soft Gray for Unassigned

  const colors = [
    '#60A5FA', // Blue-400
    '#34D399', // Emerald-400
    '#FBBF24', // Amber-400
    '#F87171', // Red-400
    '#A78BFA', // Violet-400
    '#F472B6', // Pink-400
    '#2DD4BF', // Teal-400
    '#FB923C', // Orange-400
    '#818CF8', // Indigo-400
    '#A3E635', // Lime-400
    '#C084FC', // Purple-400
    '#4ADE80', // Green-400
    '#94A3B8', // Slate-400
    '#FB7185', // Rose-400
    '#38BDF8', // Sky-400
  ];

  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
};

export const TAG_COLORS = [
  '#2563EB', // Blue
  '#7C3AED', // Violet
  '#0D9488', // Teal
  '#16A34A', // Green
  '#CA8A04', // Amber
  '#DC2626', // Red
  '#9333EA', // Purple
  '#0284C7', // Sky
  '#059669', // Emerald
  '#EA580C', // Orange
  '#4F46E5', // Indigo
  '#0891B2', // Cyan
];

const hexToRgba = (hex: string, alpha = 0.14) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getTagColor = (index: number, prev?: string) => {
  let color = TAG_COLORS[index % TAG_COLORS.length];

  if (color === prev) {
    color = TAG_COLORS[(index + 1) % TAG_COLORS.length];
  }

  return {
    base: color,
    text: color,
    bg: hexToRgba(color),
    border: hexToRgba(color, 0.35),
  };
};

export const enrichUserOption = (userOption: UserOption): User => {
  return {
    id: userOption.rid,
    name: userOption.name,
    initials: generateInitials(userOption.name),
    color: generateColorFromName(userOption.name),
    profile_url: userOption.profile_url,
  };
};

export const enrichAssignee = (assignee: {
  name: string;
  initials?: string;
  color?: string;
  profile_url?: string | null;
}): Assignee => {
  return {
    name: assignee.name,
    initials: assignee.initials || generateInitials(assignee.name),
    color: assignee.color || generateColorFromName(assignee.name),
    profile_url: assignee.profile_url,
  };
};

export const normalizeTags = (
  tags: (
    | string
    | { tag_name?: string; name?: string; tag_rid?: string; rid?: string }
  )[]
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

export const normalizeTagsDetails = (
  tags: (
    | string
    | { tag_name?: string; name?: string; tag_rid?: string; rid?: string }
  )[]
): Array<{ id: string; name: string }> => {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => {
      if (typeof tag === 'object') {
        const id = tag.tag_rid || tag.rid;
        const name = tag.tag_name || tag.name;
        if (id && name) return { id, name };
      }
      return null;
    })
    .filter((t): t is { id: string; name: string } => t !== null);
};

export const enrichTask = (task: Task): Task => {
  const enrichedTask = { ...task };

  if (enrichedTask.assignee) {
    enrichedTask.assignee = enrichAssignee(enrichedTask.assignee);
  }

  if (enrichedTask.collaborators && enrichedTask.collaborators.length > 0) {
    enrichedTask.collaborators = enrichedTask.collaborators.map(enrichAssignee);
  }

  if (
    enrichedTask.tags &&
    enrichedTask.tags.length > 0 &&
    typeof enrichedTask.tags[0] === 'object'
  ) {
    // Populate tagsDetails first because normalizeTags modifies the array to strings (if it was objects)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    enrichedTask.tagsDetails = normalizeTagsDetails(enrichedTask.tags as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    enrichedTask.tags = normalizeTags(enrichedTask.tags as any);
  }

  return enrichedTask;
};
