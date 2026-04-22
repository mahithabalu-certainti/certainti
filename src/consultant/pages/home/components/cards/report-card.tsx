import React from 'react';
import { Skeleton, Tooltip, Alert } from '@mui/material';
import { blendWithWhite, getDynamicSvgIcon } from '../../helpers';

interface ReportCardProps {
  title?: string;
  value?: string | number;
  color?: string;
  isLoading?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  tooltipMessage?: string;
}

const ReportCard: React.FC<ReportCardProps> = ({
  title,
  value,
  color = '#425A76',
  isLoading = false,
  onClick,
  disabled = false,
  tooltipMessage = '',
}) => {
  const bgColor = blendWithWhite(color, 0.9);

  if (isLoading) {
    return (
      <div className='flex flex-col justify-between bg-white rounded-lg border border-[#CBD6E2] overflow-hidden p-4'>
        <Skeleton variant='text' width='60%' height={20} />
        <div className='flex items-center justify-between mt-1.5'>
          <Skeleton variant='rectangular' width='40%' height={26} />
          <Skeleton variant='rounded' width={36} height={26} />
        </div>
      </div>
    );
  }

  const cardContent = (
    <div
      className={`flex flex-col justify-between bg-white rounded-lg border border-[#CBD6E2] overflow-hidden p-4 h-full ${
        onClick && !disabled
          ? 'cursor-pointer hover:shadow-md transition-shadow duration-200'
          : disabled
            ? 'cursor-not-allowed'
            : ''
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <div
        className='text-[#425A76] text-sm font-medium truncate'
        title={title}
      >
        {title}
      </div>

      {/* VALUE */}
      <div className='flex items-center justify-between text-3xl font-semibold text-[#2A2A2A] mt-1.5'>
        <div className='flex-1 truncate' title={String(value)}>
          {value}
        </div>
        <div
          className='h-9 w-9 flex items-center justify-center rounded-md text-lg flex-shrink-0'
          style={{ backgroundColor: bgColor }}
        >
          {getDynamicSvgIcon(title || '', 18, color)}
        </div>
      </div>
    </div>
  );
  return (
    <Tooltip
      title={
        <div>
          <Alert
            severity='warning'
            sx={{
              padding: '4px 8px',
              fontSize: '12px',
              alignItems: 'center',
              '& .MuiAlert-icon': {
                fontSize: '16px',
                padding: 0,
                marginRight: '8px',
              },
              '& .MuiAlert-message': {
                padding: 0,
                whiteSpace: 'pre-line',
              },
            }}
          >
            {tooltipMessage}
          </Alert>
        </div>
      }
      arrow
      placement='top'
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'transparent',
            padding: 0,
            maxWidth: 'none',
          },
        },
      }}
      disableHoverListener={!disabled}
    >
      {cardContent}
    </Tooltip>
  );
};

export default ReportCard;
