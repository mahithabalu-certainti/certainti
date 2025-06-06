import { Tooltip } from '@mui/material';
import React, { ReactNode, useEffect, useRef, useState } from 'react';

interface TruncateWithTooltipProps {
  text: string;
  maxWidth?: number; // Optional max width in pixels
  className?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
}

const TruncateWithTooltip = ({
  text,
  maxWidth,
  className = '',
  children,
  style = {},
}: TruncateWithTooltipProps) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      const element = textRef.current;
      if (element) {
        setIsOverflowing(
          element.scrollWidth > element.clientWidth ||
            element.scrollHeight > element.clientHeight
        );
      }
    };

    checkOverflow();

    // Add resize listener to recheck on window resize
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  const contentStyle = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: maxWidth ? `${maxWidth}px` : '100%',
    ...style,
  };

  return isOverflowing ? (
    <Tooltip title={text} arrow placement='top'>
      <div ref={textRef} style={contentStyle} className={className}>
        {children || text}
      </div>
    </Tooltip>
  ) : (
    <div ref={textRef} style={contentStyle} className={className}>
      {children || text}
    </div>
  );
};

export default TruncateWithTooltip;
