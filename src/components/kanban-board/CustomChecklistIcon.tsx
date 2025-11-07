import React from 'react';

interface CustomChecklistIconProps {
  className?: string;
  style?: React.CSSProperties;
}

const CustomChecklistIcon: React.FC<CustomChecklistIconProps> = ({
  className = '',
  style,
}) => {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
      style={style}
    >
      <path
        d='M2 3H14C14.55 3 15 3.45 15 4V12C15 12.55 14.55 13 14 13H2C1.45 13 1 12.55 1 12V4C1 3.45 1.45 3 2 3ZM2.5 4.5V11.5H13.5V4.5H2.5ZM4 6.5L5.5 8L8.5 5L9.5 6L5.5 10L3 7.5L4 6.5ZM10.5 6H12.5V7H10.5V6ZM10.5 8H12.5V9H10.5V8Z'
        fill='currentColor'
      />
    </svg>
  );
};

export default CustomChecklistIcon;
