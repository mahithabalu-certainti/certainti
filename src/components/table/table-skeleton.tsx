import React from 'react';
import { Box, TableCell, TableRow } from '@mui/material';

interface TableSkeletonProps {
  rowsPerPage: number;
  columnsCount: number;
  selectable?: boolean;
  hasActions?: boolean;
  borderHide?: boolean;
  stickyColumnsCount?: number;
}

const SELECTABLE_WIDTH = 32;
const ACTION_WIDTH = 50;
const DATA_WIDTH = 120;

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
  stickyColumnsCount = 0,
}) => {
  // calculate left offset for each sticky cell
  const getStickyLeft = (colIndex: number, stickyOffset: number) => {
    let left = 0;

    if (selectable) {
      left += SELECTABLE_WIDTH;
    }
    if (hasActions) {
      left += ACTION_WIDTH;
    }

    // each data column is 120px wide
    left += (colIndex - stickyOffset) * DATA_WIDTH;

    return left;
  };

  return (
    <>
      <style>{pulseAnimation}</style>
      {[...Array(rowsPerPage)].map((_, rowIndex) => (
        <TableRow
          key={`skeleton-${rowIndex}`}
          sx={borderHide ? { '& .MuiTableCell-root': { border: 'none' } } : {}}
        >
          {/* Selectable column */}
          {selectable && (
            <TableCell
              sx={{
                p: '0px !important',
                position: 'sticky',
                left: 0,
                zIndex: 3,
                background: '#fff',
                borderRight: (theme) => `1px solid ${theme.palette.divider}`,
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

          {/* Action column */}
          {hasActions && (
            <TableCell
              sx={{
                position: 'sticky',
                left: selectable ? SELECTABLE_WIDTH : 0,
                zIndex: 3,
                background: '#fff',
                // borderLeft: '1px solid #cbd6e2',
              }}
            >
              <Box
                sx={{
                  width: '20px',
                  height: 12,
                  borderRadius: '4px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  bgcolor: '#E4E6E7',
                  ml: '6px',
                }}
              />
            </TableCell>
          )}

          {/* Data columns */}
          {[...Array(columnsCount)].map((_, colIndex) => {
            const stickyOffset = (selectable ? 1 : 0) + (hasActions ? 1 : 0);

            // First data column always sticky
            const isAlwaysSticky = colIndex === 0;
            const isWithinStickyCount =
              colIndex < stickyColumnsCount - stickyOffset;

            const isSticky = isAlwaysSticky || isWithinStickyCount;

            return (
              <TableCell
                key={`skeleton-cell-${colIndex}`}
                sx={
                  isSticky
                    ? {
                        position: 'sticky',
                        left: getStickyLeft(
                          colIndex + stickyOffset,
                          stickyOffset
                        ),
                        zIndex: 2,
                        background: '#fff',
                        borderRight: (theme) =>
                          `1px solid ${theme.palette.divider}`,
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
        </TableRow>
      ))}
    </>
  );
};

export default TableSkeleton;
