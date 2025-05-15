import { Box, Skeleton, Typography } from '@mui/material';
import React from 'react';
import { TruncateWithTooltip } from '../../../components';

interface AccountInfoColumn {
  items: {
    label: string;
    value: string | React.ReactNode;
  }[];
}

interface AccountInfoProps {
  columns: AccountInfoColumn[];
  className?: string;
  loading?: boolean;
  error?: boolean;
}

export const AccountInfo: React.FC<AccountInfoProps> = ({
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
              fontWeight: 500,
            }}
          >
            {value === 'Active'? 'Active' : 'In-Active'}
          </Typography>
        );
      }
      // if (lowerValue === 'yes' || lowerValue === 'no') {
      //   return (
      //     <Typography
      //       component='span'
      //       sx={{
      //         color: lowerValue === 'yes' ? '#00A854' : '#F44336',
      //         fontWeight: 500,
      //       }}
      //     >
      //       {value}
      //     </Typography>
      //   );
      // }
    }
    return value;
  };

  // Column width configuration
  const columnWidths = ['20%', '20%', '20%', '20%', '20%'];

  if (error) {
    return (
      <Box
        className={`p-6 border-b-1 border-gray-300 text-red-500 ${className}`}
      >
        Failed to Load
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        className={`flex p-6 bg-white border-b-1 border-gray-300 ${className}`}
        sx={{ gap: '0 16px' }}
      >
        {columnWidths.map((width, colIndex) => (
          <Box
            key={colIndex}
            sx={{
              width,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {[1, 2, 3].map((item) => (
              <Box key={item}>
                <Skeleton variant='text' width='60%' height={10} />
                <Skeleton variant='text' width='80%' height={10} />
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      className={`flex p-5 border-b-2 border-[#CBD6E2] bg-white min-h-[160px] ${className} `}
      sx={{
        gap: '0 16px',
      }}
    >
      {columns?.map((column, colIndex) => (
        <Box
          key={colIndex}
          sx={{
            width: columnWidths[colIndex],
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {column?.items?.map((item, itemIndex) => (
            <Box key={itemIndex}>
              <Typography
                variant='caption'
                sx={{
                  color: '#7D98B6',
                  fontSize: '13px',
                  fontWeight: 400,
                  display: 'block',
                  mb: 0.5,
                }}
              >
                {item.label}
              </Typography>
              {/* <Typography
                variant='body2'
                sx={{
                  color: '#333',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}
              >
                <TruncateWithTooltip
                  text={String(item.value)}
                  className='font-medium'
                >
                  {renderValue(item.value)}
                </TruncateWithTooltip>
              </Typography> */}
              <TruncateWithTooltip
                text={String(item.value)}
                className='font-medium text-[18px] text-[#2D3E4F] '
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
