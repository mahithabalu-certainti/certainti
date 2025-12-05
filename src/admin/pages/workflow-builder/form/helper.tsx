/// RULE BUILDER TYPES
export type LogicalOperator = 'AND' | 'OR';

export interface Trigger {
  id: string;
  name: string;
  description: string;
  category: string;
  badge?: string;
  requiresConfig?: boolean;
}

export interface Condition {
  id: string;
  category: string;
  name: string;
  field: string;
  operator: string;
  value: string | string[];
  fieldType:
    | 'text'
    | 'number'
    | 'boolean'
    | 'select'
    | 'multiselect'
    | 'date'
    | 'logical'
    | null;
  conditionTypeId?: string;
  logicalOperator?: LogicalOperator;
}

export interface ConditionCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: ConditionField[];
}

export interface ConditionField {
  id: string;
  name: string;
  type:
    | 'text'
    | 'number'
    | 'boolean'
    | 'select'
    | 'multiselect'
    | 'date'
    | 'logical';
  operators: string[];
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface Action {
  id: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  badge?: 'NEW' | 'POPULAR';
  // Add any additional fields you need for action configuration
  fields?: ActionField[];
}

export interface ActionField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'number' | 'date';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}

export interface RuleComponent {
  id: string;
  type: 'condition' | 'action' | 'branch';
  data: Condition | Action | { name: string };
}

export type ComponentType = 'for-each' | 'if' | 'then' | null;

export interface ConditionType {
  rid: string;
  name: string;
  condition_type: string; // 'if' or 'then' or other types
  description?: string;
}

export interface Rule {
  id: string;
  name: string;
  trigger: Trigger | null;
  conditions: Condition[];
  actions: Action[];
  isActive: boolean;
  conditionType?: ConditionType | null;
}

export const COMMON_SELECT_STYLES = {
  height: '32px',
  fontSize: '13px',
  padding: '6px 4px',
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    border: '2px solid #60A5FA',
  },
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused': { boxShadow: 'none' },
  },
  '.MuiSelect-select': {
    padding: '6px 6px',
  },
  '&.Mui-disabled': { backgroundColor: '#f3f4f6' },
  '& .MuiOutlinedInput-notchedOutline': {
    borderRadius: '2px',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    border: '1px solid #CBD6E2',
  },
  '& .MuiSvgIcon-root': {
    color: '#7D98B6',
  },
};

export const COMMON_MENU_PROPS = {
  PaperProps: {
    sx: {
      maxWidth: 300,
      maxHeight: 200,
      marginTop: '4px',
      boxShadow:
        'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
      '& .MuiMenuItem-root': {
        fontSize: '13px',
        padding: '6px 12px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
    },
  },
};

export const getSelectStyles = (hasError: boolean, isEmpty: boolean) => ({
  ...COMMON_SELECT_STYLES,
  '.MuiSelect-select': {
    ...COMMON_SELECT_STYLES['.MuiSelect-select'],
    color: isEmpty ? '#7D98B6' : 'black',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: hasError ? '1px solid #ef4444' : '1px solid #CBD6E2',
    borderRadius: '2px',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    border: hasError ? '1px solid #ef4444' : '1px solid #CBD6E2',
  },
});

export const PROJECT_COLORS = [
  '#40E0D0',
  '#FFA500',
  '#EEEE00',
  '#00BFFF',
  '#B8B8B8',
  '#FF7256',
  '#CCCC33',
  '#DDA0DD',
  '#66CDAA',
  '#FFDAB9',
  '#CDB38B',
  '#98FB98',
  '#FFD700',
  '#B0E0E6',
  '#C5B8FF',
  '#BDB76B',
  '#66CDAA',
  '#EEE0E5',
  '#FFA07A',
  '#7FFFD4',
  '#BEBEBE',
  '#FFB6C1',
  '#32CD32',
  '#CDB5CD',
  '#A2CD5A',
];

export const blendWithWhite = (hex: string, alpha = 0.6) => {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  const newR = Math.round(r * (1 - alpha) + 255 * alpha);
  const newG = Math.round(g * (1 - alpha) + 255 * alpha);
  const newB = Math.round(b * (1 - alpha) + 255 * alpha);

  return (
    '#' +
    newR.toString(16).padStart(2, '0') +
    newG.toString(16).padStart(2, '0') +
    newB.toString(16).padStart(2, '0')
  );
};

export const getCategoryColor = (categoryName: string): string => {
  const hash = getHash(categoryName.toLowerCase().trim());
  const index = hash % PROJECT_COLORS.length;
  return blendWithWhite(PROJECT_COLORS[index]);
};

// --------------------------------------------------------------
// --- Simple Hash ---
const getHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
  }
  return Math.abs(hash);
};

export const getDynamicSvgIcon = (name: string, size = 20): JSX.Element => {
  const hash = getHash(name);
  const color = '#444b51';
  const shapeType = hash % 10; // 🔟 shapes now

  switch (shapeType) {
    case 0:
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill={color}>
          <circle cx='12' cy='12' r='9' />
        </svg>
      );

    case 1:
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill={color}>
          <rect x='5' y='5' width='14' height='14' rx='3' />
        </svg>
      );

    case 2:
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill={color}>
          <polygon points='12,3 21,20 3,20' />
        </svg>
      );

    case 3:
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill={color}>
          <path d='M12 3L20 9V15L12 21L4 15V9L12 3Z' />
        </svg>
      );

    case 4:
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill={color}>
          <path d='M4 12L12 4L20 12L12 20L4 12Z' />
        </svg>
      );

    case 5: // 🌀 Concentric circles
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill='none'>
          <circle cx='12' cy='12' r='9' stroke={color} strokeWidth='2' />
          <circle cx='12' cy='12' r='5' fill={color} />
        </svg>
      );

    case 6: // ⬡ Hexagon with hole
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill='none'>
          <path
            d='M7 4h10l5 8-5 8H7L2 12 7 4Z'
            stroke={color}
            strokeWidth='2'
          />
          <circle cx='12' cy='12' r='2.5' fill={color} />
        </svg>
      );

    case 7: // 🧩 Overlapping shapes
      return (
        <svg width={size} height={size} viewBox='0 0 24 24'>
          <circle cx='10' cy='12' r='6' fill={color} opacity='0.5' />
          <rect
            x='8'
            y='6'
            width='10'
            height='10'
            rx='2'
            fill={color}
            opacity='0.8'
          />
        </svg>
      );

    case 8: // 🟢 Star pattern
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill={color}>
          <path d='M12 3l2.8 6h6.2l-5 4 2 8-6-4-6 4 2-8-5-4h6.2L12 3Z' />
        </svg>
      );

    case 9: // 🌿 Leaf pattern (organic)
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill='none'>
          <path
            d='M12 3C6 8 6 18 12 21c6-3 6-13 0-18Z'
            fill={color}
            stroke={color}
            strokeWidth='1'
          />
        </svg>
      );

    default:
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill={color}>
          <rect x='4' y='4' width='16' height='16' rx='4' />
        </svg>
      );
  }
};
