import { IconButton, Tooltip, TooltipProps } from '@mui/material';
import React, { ReactNode, Suspense, useEffect, useRef, useState } from 'react';
import { CopyIcon, TickIcon } from '../../assets';

function extractTextFromReactNode(node: React.ReactNode): string {
  if (node === null || node === undefined) {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractTextFromReactNode).join('');
  }
  if (React.isValidElement(node)) {
    const props = node.props as {
      children?: React.ReactNode;
      dangerouslySetInnerHTML?: { __html: string };
    };

    if (props.children !== undefined) {
      return extractTextFromReactNode(props.children);
    }

    if (props.dangerouslySetInnerHTML?.__html) {
      const html = props.dangerouslySetInnerHTML.__html;
      return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .trim();
    }
  }
  return '';
}

interface TruncateWithTooltipProps {
  text?: string;
  maxWidth?: number | string;
  maxHeight?: number | string;
  className?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
  placement?: TooltipProps['placement'];
  enableCopy?: boolean;
  alwaysShowTooltip?: boolean;
  tooltipMaxWidth?: number | string;
  whiteSpace?: 'nowrap' | 'normal' | 'pre-wrap' | 'pre-line' | 'break-spaces';
}

const TruncateWithTooltip = ({
  text,
  maxWidth,
  maxHeight,
  className = '',
  children,
  style = {},
  placement = 'top',
  enableCopy = true,
  alwaysShowTooltip = false,
  tooltipMaxWidth = '50vw',
  whiteSpace = 'nowrap',
}: TruncateWithTooltipProps) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const contentToRender = children ?? text;
  const extractedText = contentToRender
    ? extractTextFromReactNode(contentToRender)
    : '';

  const textForTooltipAndCopy = extractedText || (text ?? '');

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
    whiteSpace: whiteSpace,
    maxWidth:
      typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth || '100%',
    ...(maxHeight && {
      maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
    }),
    ...style,
  };

  const tooltipContent = enableCopy ? (
    <div className='flex items-start gap-1'>
      <span
        style={{
          overflowY: 'auto',
          maxHeight: '200px',
          display: 'block',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {textForTooltipAndCopy}
      </span>
      <IconButton
        size='small'
        onClick={(e) => {
          e.stopPropagation();
          handleCopy(textForTooltipAndCopy);
        }}
      >
        {copied ? (
          <Suspense fallback={null}>
            <TickIcon alt='tick-icon' className='w-3.5 h-3.5' />
          </Suspense>
        ) : (
          <Suspense fallback={null}>
            <CopyIcon alt='copy-icon' className='w-3.5 h-3.5' />
          </Suspense>
        )}
      </IconButton>
    </div>
  ) : (
    <span
      style={{
        overflowY: 'auto',
        maxHeight: '200px',
        display: 'block',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}
    >
      {textForTooltipAndCopy}
    </span>
  );

  const content = (
    <div ref={textRef} style={contentStyle} className={className}>
      {contentToRender}
    </div>
  );

  return alwaysShowTooltip || isOverflowing ? (
    <Tooltip
      title={tooltipContent}
      arrow
      placement={placement}
      PopperProps={{
        sx: {
          zIndex: 10000, // Ensure it's above the modal (9999)
        },
      }}
      componentsProps={{
        tooltip: {
          sx: {
            maxWidth: tooltipMaxWidth,
            mr: 1,
            padding: '8px 10px',
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
