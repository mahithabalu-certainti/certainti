import React from 'react';
import { Box, TableCell, TableRow } from '@mui/material';

interface TableSkeletonProps {
  rowsPerPage: number;
  columnsCount: number;
  selectable?: boolean;
  hasActions?: boolean;
  borderHide?: boolean;
  stickyColumnsCount?: number; // NEW PROP
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
  stickyColumnsCount = 0, // NEW PROP DEFAULT
}) => {
  // Helper to calculate left offset for sticky columns
  const getStickyLeft = (colIndex: number) => {
    // If selectable, first column is selectable, so colIndex 0 is selectable
    // Each sticky column after selectable shifts right
    let left = 0;
    if (selectable && colIndex === 0) return 0;
    if (selectable) left += 56; // typical checkbox cell width
    left += (colIndex - (selectable ? 1 : 0)) * 120; // assume 120px per column
    return left;
  };

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
            <TableCell
              sx={{
                p: '0px !important',
                ...(stickyColumnsCount > 0 && {
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  background: '#fff',
                }),
              }}
            >
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
          {[...Array(columnsCount)].map((_, colIndex) => {
            const isSticky =
              colIndex < (stickyColumnsCount - (selectable ? 1 : 0));
            return (
              <TableCell
                key={`skeleton-cell-${colIndex}`}
                sx={
                  isSticky
                    ? {
                        position: 'sticky',
                        left: getStickyLeft(colIndex + (selectable ? 1 : 0)),
                        zIndex: 1,
                        background: '#fff',
                      }
                    : undefined
                }
              >
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
            );
          })}
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
