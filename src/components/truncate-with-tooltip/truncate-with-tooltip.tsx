import { IconButton, Tooltip, TooltipProps } from '@mui/material';
import React, { ReactNode, Suspense, useEffect, useRef, useState } from 'react';
import { CopyIcon, TickIcon } from '../../assets';

function extractTextFromReactNode(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (React.isValidElement(node) && node.props.children) {
    return extractTextFromReactNode(node.props.children);
  }
  if (Array.isArray(node)) {
    return node.map(extractTextFromReactNode).join('');
  }
  return '';
}

interface TruncateWithTooltipProps {
  text?: string;
  maxWidth?: number | string;
  className?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
  placement?: TooltipProps['placement'];
  enableCopy?: boolean;
  alwaysShowTooltip?: boolean;
  tooltipMaxWidth?: number | string;
}

const TruncateWithTooltip = ({
  text,
  maxWidth,
  className = '',
  children,
  style = {},
  placement = 'top',
  enableCopy = true,
  alwaysShowTooltip = false,
  tooltipMaxWidth = '50vw',
}: TruncateWithTooltipProps) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const contentToRender = children ?? text;
  const textForTooltipAndCopy = contentToRender
    ? extractTextFromReactNode(contentToRender)
    : text || '';

  const handleCopy = (valueToCopy: string) => {
    navigator.clipboard.writeText(valueToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

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
  }, [contentToRender]);

  const contentStyle = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth:
      typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth || '100%',
    ...style,
  };

  const tooltipContent = enableCopy ? (
    <div className='flex items-center gap-1'>
      <span className='break-all'>{textForTooltipAndCopy}</span>
      <IconButton
        size='small'
        onClick={(e) => {
          e.stopPropagation();
          handleCopy(textForTooltipAndCopy);
        }}
      >
        {copied ? (
          <TickIcon alt='tick-icon' className='w-3.5 h-3.5' />
        ) : (
          <CopyIcon alt='copy-icon' className='w-3.5 h-3.5' />
        )}
      </IconButton>
    </div>
  ) : (
    textForTooltipAndCopy
  );

  const content = (
    <div ref={textRef} style={contentStyle} className={className}>
      {contentToRender}
    </div>
  );

  return alwaysShowTooltip || isOverflowing ? (
    <Tooltip
      title={<Suspense fallback={null}>{tooltipContent}</Suspense>}
      arrow
      placement={placement}
      componentsProps={{
        tooltip: {
          sx: {
            maxWidth: tooltipMaxWidth,
          },
        },
      }}
    >
      {content}
    </Tooltip>
  ) : (
    content
  );
};

export default TruncateWithTooltip;
