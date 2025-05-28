import React from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import { TruncateWithTooltip } from '../truncate-with-tooltip';

interface InfoSectionColumn {
  items: {
    label: string;
    value: string | React.ReactNode;
  }[];
}

interface InfoSectionProps {
  columns: InfoSectionColumn[];
  className?: string;
  loading?: boolean;
  error?: boolean;
}

const InfoSection: React.FC<InfoSectionProps> = ({
  columns,
  className = '',
  loading = false,
  error,
}) => {
  const renderValue = (value: string | React.ReactNode) => {
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'active' || lowerValue === 'inactive') {
        return (
          <Typography
            component='span'
            sx={{
              fontSize: '16px',
              color: lowerValue === 'active' ? '#199806' : '#f44336',
              fontWeight: 700,
            }}
          >
            {value === 'Active' ? 'Active' : 'In-Active'}
          </Typography>
        );
      }
    }
    return value;
  };

  const columnWidth =
    columns && columns.length > 0 ? `${100 / columns.length}%` : '100%';
  const loadingColumns = ['20%', '20%', '20%', '20%', '20%'];

  if (error) {
    return (
      <Box
        className={`flex items-center justify-center p-4 border-b-2 border-[#CBD6E2] bg-white min-h-[160px] text-red-500 ${className}`}
      >
        Failed to Load details
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        className={`flex items-center p-4 border-b-2 border-[#CBD6E2] bg-white min-h-[160px] max-h-[160px] ${className}`}
        sx={{ gap: '0 16px' }}
      >
        {loadingColumns.map((width, colIndex) => (
          <Box
            key={colIndex}
            sx={{
              width,
              display: 'flex',
              flexDirection: 'column',
              gap: '28px',
            }}
          >
            {[1, 2].map((item) => (
              <Box key={item}>
                <Skeleton variant='text' width='60%' height={20} />
                <Skeleton variant='text' width='80%' height={20} />
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      className={`flex p-4 border-b-2 border-[#CBD6E2] bg-white min-h-[112px] ${className}`}
      sx={{ gap: '0 16px' }}
    >
      {columns?.map((column, colIndex) => (
        <Box
          key={colIndex}
          sx={{
            width: columnWidth,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {column?.items?.map((item, itemIndex) => (
            <Box key={itemIndex}>
              <Typography
                variant='caption'
                sx={{
                  color: '#7D98B6',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'block',
                  mb: 0.5,
                }}
              >
                {item.label}
              </Typography>
              <TruncateWithTooltip
                text={String(item.value)}
                className='font-bold text-[16px] text-[#2D3E4F] '
              >
                {renderValue(item.value)}
              </TruncateWithTooltip>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

export default InfoSection;
