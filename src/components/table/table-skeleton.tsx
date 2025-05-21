import React from 'react';
import { Box, TableCell, TableRow } from '@mui/material';

interface TableSkeletonProps {
  rowsPerPage: number;
  columnsCount: number;
  selectable?: boolean;
  hasActions?: boolean;
  borderHide?: boolean;
}

const pulseAnimation = `
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
    100% {
      opacity: 1;
    }
  }
`;

const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rowsPerPage,
  columnsCount,
  selectable = false,
  hasActions = false,
  borderHide = false,
}) => {
  return (
    <>
      <style>{pulseAnimation}</style>
      {[...Array(rowsPerPage)].map((_, index) => (
        <TableRow
          key={`skeleton-${index}`}
          sx={
            borderHide
              ? {
                  '& .MuiTableCell-root': {
                    border: 'none',
                  },
                }
              : {}
          }
        >
          {selectable && (
            <TableCell sx={{ p: '0px !important' }}>
              <Box className='!w-[32px] !h-[32px] flex items-center justify-center'>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    margin: '8px',
                    borderRadius: '2px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    bgcolor: '#E4E6E7',
                  }}
                />
              </Box>
            </TableCell>
          )}
          {[...Array(columnsCount)].map((_, colIndex) => (
            <TableCell key={`skeleton-cell-${colIndex}`}>
              <Box
                sx={{
                  height: 12,
                  borderRadius: '4px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  bgcolor: '#E4E6E7',
                  width: '80%',
                }}
              />
            </TableCell>
          ))}
          {hasActions && (
            <TableCell>
              <Box
                sx={{
                  width: 80,
                  height: 12,
                  borderRadius: '4px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  bgcolor: '#E4E6E7',
                }}
              />
            </TableCell>
          )}
        </TableRow>
      ))}
    </>
  );
};

export default TableSkeleton;
