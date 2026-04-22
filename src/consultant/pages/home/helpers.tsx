import { PROJECT_COLORS } from '../../../admin/pages/workflow-builder/form/helper';

const getHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export const getDynamicSvgIcon = (
  name: string,
  size = 18,
  iconColor?: string
): JSX.Element => {
  const normalized = name.toLowerCase().trim();
  const hash = getHash(name);
  const hue = hash % 360;
  const fallbackColor = `hsl(${hue}, 65%, 45%)`;
  const shapeType = hash % 8;

  const color = iconColor || fallbackColor;

  // 🧠 Step 1: Recognized name-based icons
  switch (true) {
    // ❤️ Cases by Health Status
    case normalized.includes('health status'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#DC2626'}
          strokeWidth='2'
          strokeLinecap='round'
        >
          <path d='M3 12h3l2-4 4 8 2-4h5' />
          <circle cx='19' cy='12' r='2' />
        </svg>
      );

    // 📅 My Meetings
    case normalized.includes('meetings'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#2563EB'}
          strokeWidth='2'
          strokeLinecap='round'
        >
          <rect x='3' y='4' width='18' height='18' rx='2' />
          <path d='M16 2v4M8 2v4M3 10h18' />
          <circle cx='12' cy='16' r='1' />
        </svg>
      );

    // ⚡ Weekly Productivity (fixed)
    case normalized.includes('productivity'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 28 28'
          fill='none'
          stroke={iconColor || '#10B981'}
          strokeWidth='2.3'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M4 18l7-7 5 5 9-9' />
        </svg>
      );

    // 🧑‍💼 Consultants Workload (fixed)
    case normalized.includes('workload'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 28 28'
          fill='none'
          stroke={iconColor || '#9333EA'}
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <circle cx='9' cy='9' r='4' /> {/* moved slightly down */}
          <circle cx='19' cy='9' r='4' />
          <path d='M3 25c0-5 4-8 8-8s8 3 8 8' />
          <path d='M15 25c0-5 4-8 8-8' />
        </svg>
      );

    // 🔔 Pending Follow-ups
    case normalized.includes('follow'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#F59E0B'}
          strokeWidth='2'
          strokeLinecap='round'
        >
          <path d='M12 22a2 2 0 002-2H10a2 2 0 002 2z' />
          <path d='M6 16v-5a6 6 0 1112 0v5l1 2H5l1-2z' />
        </svg>
      );

    // ⛔ Overdue Approvals
    case normalized.includes('approvals'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#DC2626'}
          strokeWidth='2'
          strokeLinecap='round'
        >
          <rect x='3' y='4' width='14' height='16' rx='2' />
          <path d='M7 8h6M7 12h6M7 16h3' />
          <circle cx='18' cy='8' r='2' />
          <path d='M16 7l2 2M20 7l-2 2' />
        </svg>
      );

    // 📋 Open Tasks
    case normalized.includes('open tasks'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#0EA5E9'}
          strokeWidth='2'
          strokeLinecap='round'
        >
          <path d='M9 11l3 3L22 4' />
          <rect x='3' y='4' width='14' height='16' rx='2' />
        </svg>
      );

    // ⏳ Due Today / Overdue Tasks
    case normalized.includes('due today'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#EAB308'}
          strokeWidth='2'
          strokeLinecap='round'
        >
          <rect x='3' y='4' width='18' height='18' rx='2' />
          <path d='M16 2v4M8 2v4M3 10h18' />
          <path d='M12 12v4l2 1' />
        </svg>
      );

    // 📆 Upcoming Tasks (Next 7 Days)
    case normalized.includes('upcoming tasks'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#3B82F6'}
          strokeWidth='2'
          strokeLinecap='round'
        >
          <rect x='3' y='4' width='18' height='18' rx='2' />
          <path d='M16 2v4M8 2v4M3 10h18' />
          <path d='M12 14l2 2 3-3' />
        </svg>
      );

    // ✅ Completed Tasks This Week
    case normalized.includes('completed tasks'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#16A34A'}
          strokeWidth='2'
          strokeLinecap='round'
        >
          <circle cx='12' cy='12' r='9' />
          <path d='M9 12l2 2 4-4' />
        </svg>
      );

    // 💼 Total Project Value Overview
    case normalized.includes('project value'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#0EA5E9'}
          strokeWidth='2'
          strokeLinecap='round'
        >
          <rect x='2' y='6' width='20' height='14' rx='2' />
          <path d='M16 6V4H8v2' />
        </svg>
      );

    // 🔬 Global R&D Detailed Cost Summary
    case normalized.includes('detailed cost'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#7C3AED'}
          strokeWidth='2'
          strokeLinecap='round'
        >
          <circle cx='10' cy='10' r='6' />
          <path d='M14 14l4 4' />
        </svg>
      );

    // 🌍 Global R&D Cost Approved - World map
    case normalized.includes('world map') || normalized.includes('global r&d'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#1D4ED8'}
          strokeWidth='2'
          strokeLinecap='round'
        >
          <circle cx='12' cy='12' r='9' />
          <path d='M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20' />
        </svg>
      );

    // 📈 Trend
    case normalized.includes('trend') ||
      normalized.includes('growth') ||
      normalized.includes('increase') ||
      normalized.includes('arrow-up'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 26 26'
          fill='none'
          stroke={iconColor || '#16A34A'}
          strokeWidth='2.2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <polyline points='3,18 9,12 13,16 22,7' />
          <polyline points='17,7 22,7 22,12' />
        </svg>
      );

    // 💲 Finance
    case normalized.includes('dollar') ||
      normalized.includes('revenue') ||
      normalized.includes('money') ||
      normalized.includes('finance') ||
      normalized.includes('price'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#2563EB'}
          strokeWidth='2.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <line x1='12' y1='2' x2='12' y2='22' />
          <path d='M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' />
        </svg>
      );

    // 📊 Chart
    case normalized.includes('chart') ||
      normalized.includes('bar') ||
      normalized.includes('analytics') ||
      normalized.includes('report'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#9333EA'}
          strokeWidth='2.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <rect x='4' y='12' width='3' height='8' rx='1' />
          <rect x='10' y='8' width='3' height='12' rx='1' />
          <rect x='16' y='4' width='3' height='16' rx='1' />
        </svg>
      );

    // 👥 Accounts
    case normalized.includes('account'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#0EA5E9'}
          strokeWidth='2'
        >
          <circle cx='9' cy='8' r='4' />
          <path d='M17 11c1.7 0 3 1.3 3 3s-1.3 3-3 3' />
          <path d='M3 20c0-4 3-6 6-6s6 2 6 6' />
        </svg>
      );

    // 📁 Cases
    case normalized.includes('case'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#6366F1'}
          strokeWidth='2'
        >
          <path d='M3 7h18v12H3z' />
          <path d='M8 7V5h8v2' />
        </svg>
      );

    // 📝 Tasks
    case normalized.includes('task'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#22C55E'}
          strokeWidth='2'
        >
          <path d='M9 11l3 3L22 4' />
          <rect x='3' y='5' width='14' height='14' rx='2' />
        </svg>
      );

    // ⚠ Overdue
    case normalized.includes('due') || normalized.includes('overdue'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#F59E0B'}
          strokeWidth='2'
        >
          <path d='M12 9v4' />
          <circle cx='12' cy='17' r='1' />
          <path d='M10.3 2.3L1 20h22L13.7 2.3a2 2 0 00-3.4 0z' />
        </svg>
      );

    // 📅 Upcoming / Week
    case normalized.includes('upcoming') || normalized.includes('week'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#3B82F6'}
          strokeWidth='2'
        >
          <rect x='3' y='4' width='18' height='18' rx='2' />
          <path d='M16 2v4M8 2v4M3 10h18' />
        </svg>
      );

    // 🎯 Completed
    case normalized.includes('completed'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#10B981'}
          strokeWidth='2'
        >
          <circle cx='12' cy='12' r='10' />
          <path d='M9 12l2 2 4-4' />
        </svg>
      );

    // ⏸ Stalled
    case normalized.includes('stalled') || normalized.includes('paused'):
      return (
        <svg
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke={iconColor || '#EF4444'}
          strokeWidth='2'
        >
          <rect x='6' y='5' width='4' height='14' rx='1' />
          <rect x='14' y='5' width='4' height='14' rx='1' />
        </svg>
      );
  }

  // 🌀 Fallback
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
    default:
      return (
        <svg width={size} height={size} viewBox='0 0 24 24' fill={color}>
          <path d='M4 12L12 4L20 12L12 20L4 12Z' />
        </svg>
      );
  }
};

export const blendWithWhite = (hex: string, alpha = 0.9) => {
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

export const DONUT_COLORS = {
  projectCost: '#4CAF50', // Green
  fteCost: '#03A9F4', // Light Blue
  subconCost: '#FF9800', // Orange
  nonlaborCost: '#9C27B0', // Purple
};

// Format date function
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTo12HourWithMinutes = (time24: string) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  let hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour === 0 ? 12 : hour;
  return `${hour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

export const getPriorityColor = (priority?: string) => {
  const normalized = (priority || '').toLowerCase().trim();
  switch (normalized) {
    case 'high':
      return { border: '#EF4444', bg: '#EF444412' };
    case 'medium':
      return { border: '#F59E0B', bg: '#F59E0B12' };
    case 'low':
      return { border: '#8B5CF6', bg: '#8B5CF612' };
    default:
      return { border: '#64748B', bg: '#64748B12' };
  }
};

export const getPriorityBadge = (priority?: string) => {
  const normalized = (priority || '').toLowerCase().trim();
  switch (normalized) {
    case 'high': // red-500
      return { bg: '#EF44442E', text: '#7F1D1D' };

    case 'medium': // amber-500
      return { bg: '#F59E0B2E', text: '#78350F' };

    case 'low': // purple-500
      return { bg: '#8B5CF62E', text: '#4C1D95' };

    default: // slate-500
      return { bg: '#64748B2E', text: '#1E293B' };
  }
};

export const getStatusBadge = (status?: string) => {
  const normalized = (status || '').toLowerCase().trim().replace(/\s+/g, '-');
  switch (normalized) {
    case 'in-progress': // blue-500
      return { bg: '#3B82F62E', text: '#1E3A8A' };

    case 'completed': // green-500
      return { bg: '#10B9812E', text: '#064E3B' };

    case 'overdue': // red-500
      return { bg: '#EF44442E', text: '#7F1D1D' };

    case 'due-today': // amber-500
      return { bg: '#F59E0B2E', text: '#78350F' };

    case 'to-do': // slate-500
      return { bg: '#64748B2E', text: '#1E293B' };

    default: // slate-500
      return { bg: '#64748B2E', text: '#1E293B' };
  }
};

// Convert "John Smith" → "JS"
export const getInitials = (name?: string) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  const first = parts[0]?.[0] || '';
  const last = parts[1]?.[0] || '';
  return (first + last).toUpperCase();
};

// Format amount for annotations
export const formatAmount = (amount: number): string => {
  const fmt = (val: number, suffix: string) => {
    const fixed = val.toFixed(1);
    return fixed.endsWith('.0')
      ? `${Math.round(val)}${suffix}`
      : `${fixed}${suffix}`;
  };

  if (amount >= 1_000_000_000_000) return fmt(amount / 1_000_000_000_000, 'T');
  if (amount >= 1_000_000_000) return fmt(amount / 1_000_000_000, 'B');
  if (amount >= 1_000_000) return fmt(amount / 1_000_000, 'M');
  if (amount >= 1_000) return fmt(amount / 1_000, 'K');
  return `${amount}`;
};

/** Sign-aware compact notation: -1.2M, 500K, 0 */
export const formatAmountWithSign = (amount: number): string => {
  if (amount < 0) return `-${formatAmount(Math.abs(amount))}`;
  return formatAmount(amount);
};

/**
 * Generates human-readable axis ticks spanning [minVal, maxVal].
 * Uses a single step based on the overall range.
 * Always includes 0. Capped at 20 ticks.
 */
export const generateChartTicks = (
  minVal: number,
  maxVal: number
): { v: number; f: string }[] => {
  if (minVal === 0 && maxVal === 0) {
    return [{ v: 0, f: '0' }];
  }

  const range = Math.max(Math.abs(maxVal), Math.abs(minVal));
  const scale = [
    10, 50, 100, 200, 500, 1_000, 5_000, 10_000, 50_000, 100_000, 500_000,
    1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000, 50_000_000,
    100_000_000, 200_000_000, 500_000_000, 1_000_000_000, 2_000_000_000,
    5_000_000_000, 10_000_000_000, 20_000_000_000, 50_000_000_000,
    100_000_000_000, 200_000_000_000, 500_000_000_000, 1_000_000_000_000,
    5_000_000_000_000,
  ];

  let step = scale[scale.length - 1]; // fallback
  for (const s of scale) {
    if (range / s <= 8) {
      step = s;
      break;
    }
  }

  const ticks: { v: number; f: string }[] = [];
  const lower = minVal < 0 ? Math.floor(minVal / step) * step : 0;
  const upper = Math.ceil(maxVal / step) * step;

  const maxTicks = 20;
  for (let i = lower; i <= upper; i += step) {
    ticks.push({ v: i, f: formatAmountWithSign(i) });
    if (ticks.length >= maxTicks) break;
  }
  return ticks;
};

export const COMMON_SELECT_STYLES = {
  height: '28px',
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
    borderRadius: '2px',
  },
});

export const getTrendIcon = (trend?: string, size = 16): JSX.Element => {
  const getIconContent = () => {
    switch (trend) {
      case 'up':
        return (
          <>
            <polyline points='7 7 17 7 17 17' />
            <line x1='7' y1='17' x2='17' y2='7' />
          </>
        );
      case 'down':
        return (
          <>
            <polyline points='17 7 17 17 7 17' />
            <line x1='7' y1='7' x2='17' y2='17' />
          </>
        );
      case 'stable':
        return (
          <>
            <line x1='5' y1='12' x2='19' y2='12' />
            <polyline points='12 5 19 12 12 19' />
          </>
        );
      default:
        return <circle cx='12' cy='12' r='1' />;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      {getIconContent()}
    </svg>
  );
};

export const getTrendColor = (trend?: string): string => {
  switch (trend) {
    case 'up':
      return 'text-green-600';
    case 'down':
      return 'text-red-600';
    case 'stable':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};

export const getAvatarColor = (name?: string) => {
  if (!name || name.toLowerCase() === 'unassigned') {
    return '#D1D5DB';
  }

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % PROJECT_COLORS.length;
  return PROJECT_COLORS[index];
};

export const colorMap: Record<string, string> = {
  GREEN: '#008000 ',
  RED: '#FF0000',
  ORANGE: '#FFA500',
};
