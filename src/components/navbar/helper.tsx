export const getRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
};

export const getIconFromMessage = (message: string): string => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('order') || lowerMessage.includes('shipped')) {
    return 'package';
  } else if (
    lowerMessage.includes('password') ||
    lowerMessage.includes('login')
  ) {
    return 'security';
  } else if (
    lowerMessage.includes('subscription') ||
    lowerMessage.includes('renew')
  ) {
    return 'update';
  } else if (lowerMessage.includes('promo') || lowerMessage.includes('off')) {
    return 'offer';
  } else if (lowerMessage.includes('profile')) {
    return 'profile';
  } else if (
    lowerMessage.includes('message') ||
    lowerMessage.includes('support')
  ) {
    return 'message';
  } else if (lowerMessage.includes('payment') || lowerMessage.includes('$')) {
    return 'payment';
  } else if (lowerMessage.includes('report')) {
    return 'report';
  } else if (
    lowerMessage.includes('security') ||
    lowerMessage.includes('suspicious')
  ) {
    return 'alert';
  } else {
    return 'info';
  }
};

export const PROJECT_COLORS = [
  '#40E0D0',
  '#FFA500',
  '#EEEE00',
  '#00BFFF',
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

export const getRandomColorForId = (id: string): string => {
  // Use the notification ID to generate a deterministic but varied color
  const idNumber = parseInt(id, 10) || 0;
  const colorIndex = idNumber % PROJECT_COLORS.length;
  return PROJECT_COLORS[colorIndex];
};

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

export const getSvgIcon = (name: string, color: string = '#425A76') => {
  const icons: Record<string, JSX.Element> = {
    info: (
      <svg width='16' height='16' viewBox='0 0 24 24' fill={color}>
        <circle cx='12' cy='12' r='10' />
        <rect x='11' y='10' width='2' height='7' fill='white' />
        <rect x='11' y='6' width='2' height='2' fill='white' />
      </svg>
    ),

    update: (
      <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
        <path
          d='M12 5v2l3-3-3-3v2a9 9 0 1 0 9 9h-2a7 7 0 1 1 -7-7z'
          fill={color}
        />
      </svg>
    ),

    favorite: (
      <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
        <path
          d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
          2 5.42 4.42 3 7.5 3c1.74 0 3.41 1.01 
          4.5 2.09C13.09 4.01 14.76 3 16.5 3 
          19.58 3 22 5.42 22 8.5c0 3.78-3.4 
          6.86-8.55 11.54L12 21.35z'
          fill={color}
        />
      </svg>
    ),

    group: (
      <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
        <circle cx='9' cy='8' r='4' fill={color} />
        <circle cx='17' cy='8' r='3' fill={color} />
        <path
          d='M2 22c0-4 3-7 7-7s7 3 7 7'
          stroke={color}
          strokeWidth='2'
          fill='none'
        />
        <path
          d='M14 22c0-3 2-5 5-5'
          stroke={color}
          strokeWidth='2'
          fill='none'
        />
      </svg>
    ),

    payment: (
      <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
        <rect x='3' y='6' width='18' height='12' rx='2' fill={color} />
        <rect x='3' y='9' width='18' height='3' fill='white' />
      </svg>
    ),

    bell: (
      <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
        <path
          d='M12 24a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 24zM18 16v-5a6 
          6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 
          0 6 11v5l-2 2v1h16v-1z'
        />
      </svg>
    ),

    done: (
      <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
        <path d='M20 6L9 17l-5-5' stroke={color} strokeWidth='2' fill='none' />
      </svg>
    ),

    close: (
      <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
        <path d='M6 6l12 12M6 18L18 6' stroke={color} strokeWidth='2' />
      </svg>
    ),

    package: (
      <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
        <path
          d='M12 2l8 4v6l-8 4-8-4V6l8-4zM4 8l8 4m0 0l8-4m-8 4v8m-4-4l4 2m4-2l-4 2'
          stroke={color}
          strokeWidth='2'
          fill='none'
        />
      </svg>
    ),

    security: (
      <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
        <path
          d='M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z'
          fill={color}
        />
        <path d='M9 12l2 2 4-4' stroke='white' strokeWidth='2' fill='none' />
      </svg>
    ),

    offer: (
      <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
        <path
          d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
          fill={color}
        />
      </svg>
    ),

    profile: (
      <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
        <circle cx='12' cy='8' r='4' fill={color} />
        <path
          d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'
          stroke={color}
          strokeWidth='2'
          fill='none'
        />
      </svg>
    ),

    message: (
      <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
        <rect x='3' y='6' width='18' height='12' rx='2' fill={color} />
        <polyline
          points='3 10 12 15 21 10'
          stroke='white'
          strokeWidth='2'
          fill='none'
        />
      </svg>
    ),

    report: (
      <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
        <rect x='5' y='4' width='14' height='16' rx='2' fill={color} />
        <rect x='9' y='8' width='6' height='4' fill='white' />
        <rect x='9' y='14' width='6' height='2' fill='white' />
      </svg>
    ),

    alert: (
      <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
        <path
          d='M12 2L1 21h22L12 2zM13 16h-2v-2h2v2zm0-4h-2V8h2v4z'
          fill={color}
        />
      </svg>
    ),
  };

  return icons[name] || icons['info'];
};
