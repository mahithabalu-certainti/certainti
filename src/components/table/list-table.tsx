import {
  Box,
  Checkbox,
  IconButton,
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { ListTableProps, RowData, SortOrder } from './types';
import TablePagination from './pagination';
import TableSortHeader from './sort-header';
import TableActionButton from './action-button';
import { TruncateWithTooltip } from '../truncate-with-tooltip';
import TableSkeleton from './table-skeleton';

const ListTable = <T extends RowData>({
  data = [],
  columns,
  getRowId,
  hoverHighlight = false,
  tableStyle,
  stickyHeader = false,
  stickyColumnsCount = 0,
  // Selection
  selectable = false,
  onSelectionChange,
  // Actions
  actionWidth = 100,
  actionDisplayMode = 'dropdown',
  actionMenuItems = [],
  // State
  loading = false,
  error,
  // Pagination
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  rowsPerPage = 10,
  currentPage = 0,
  totalItems = 0,
  onPageChange,
  onRowsPerPageChange,
  // Sorting
  sortBy,
  sortOrder = 'ASC',
  onSort,
}: ListTableProps<T>) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Handle row selection
  const handleRowSelect = (rowId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  // Handle select all
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(data.map(getRowId));
      setSelectedRows(allIds);
      onSelectionChange?.(Array.from(allIds));
    } else {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSortChange = (property: string, direction: SortOrder) => {
    onSort?.(property, direction);
  };

  const paginatedData = onPageChange
    ? data
    : data.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

  return (
    <>
      <TableContainer sx={tableStyle}>
        <MuiTable
          stickyHeader={stickyHeader}
          sx={{
            borderCollapse: 'separate !important',
            borderSpacing: 0,
            '& .MuiTableCell-root': {
              borderBottom: '1px solid #CBD6E2',
              borderRight: '1px solid #CBD6E2',
            },
          }}
        >
          <TableHead
            sx={{
              '& .MuiTableCell-root': {
                fontWeight: 600,
                fontSize: '13px',
                lineHeight: '21px',
                color: '#2A2A2A',
                padding: '0px',
                px: '8px',
                height: '28px',
                bgcolor: '#FCFCFC',
                borderRight: '1px solid #CBD6E2 !important',
                borderBottom: '1px solid #CBD6E2 !important',
              },
            }}
          >
            <TableRow>
              {/* Select all checkbox */}
              {selectable && (
                <TableCell
                  sx={{
                    position: 'sticky',
                    left: 0,
                    background: '#fff',
                    zIndex: 11,
                    width: '32px',
                    maxWidth: '32px',
                    minWidth: '32px',
                    padding: '0px !important',
                    borderRight: '1px solid #CBD6E2',
                    borderBottom: '1px solid #CBD6E2 !important',
                  }}
                >
                  <Box className='flex items-center justify-center !h-[28px] !w-[32px]'>
                    <Checkbox
                      size='small'
                      indeterminate={
                        selectedRows.size > 0 && selectedRows.size < data.length
                      }
                      checked={
                        data.length > 0 && selectedRows.size === data.length
                      }
                      onChange={handleSelectAll}
                      disabled={data.length === 0 || loading}
                      inputProps={{ 'aria-label': 'select all rows' }}
                      disableRipple
                      sx={{
                        color: '#CBD6E2',
                        '&.Mui-checked': {
                          color: '#1755E7',
                        },
                        '&.MuiCheckbox-indeterminate': {
                          color: '#1755E7',
                        },
                      }}
                    />
                  </Box>
                </TableCell>
              )}

              {columns.map((column) =>
                column.sortable ? (
                  <TableSortHeader
                    key={column.id}
                    columnId={column.sortId}
                    label={column.label}
                    orderBy={sortBy || ''}
                    order={sortOrder.toLowerCase() as SortOrder}
                    onSortChange={handleSortChange}
                    sx={{
                      width: column.width || 160,
                      minWidth: column.width || 160,
                      maxWidth: column.width || 160,
                      ...(column.sx || {}),
                      left: selectable ? '32px' : 0,
                    }}
                  />
                ) : (
                  <TableCell
                    key={column.id}
                    sx={{
                      width: column.width || 160,
                      minWidth: column.width || 160,
                      maxWidth: column.width || 160,
                      ...(column.sx || {}),
                      left: selectable ? '32px' : 0,
                    }}
                  >
                    {column.label}
                  </TableCell>
                )
              )}

              {actionMenuItems?.length > 0 && (
                <TableCell
                  sx={{
                    width: actionWidth,
                    minWidth: actionWidth,
                    maxWidth: actionWidth,
                  }}
                >
                  Action
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody
            sx={{
              '& .MuiTableCell-root': {
                fontWeight: 500,
                fontSize: '13px',
                lineHeight: '21px',
                color: '#425A76',
                padding: '0px',
                px: '8px',
                height: '32px',
                minHeight: '32px',
                maxHeight: '32px',
                borderRight: '1px solid #CBD6E2 !important',
                borderBottom: '1px solid #CBD6E2 !important',
              },
            }}
          >
            {/* Loading state */}
            {loading && (
              <TableSkeleton
                rowsPerPage={rowsPerPage}
                columnsCount={columns.length}
                selectable={selectable}
                hasActions={actionMenuItems?.length > 0}
                stickyColumnsCount={stickyColumnsCount}
              />
            )}

            {/* Error state */}
            {error && !loading && (
              <TableRow sx={{ height: '32px' }}>
                <TableCell
                  colSpan={
                    columns.length +
                    (selectable ? 1 : 0) +
                    (actionMenuItems?.length > 0 ? 1 : 0)
                  }
                  align='center'
                >
                  <Typography color='error'>{error}</Typography>
                </TableCell>
              </TableRow>
            )}

            {/* Empty state */}
            {!loading && !error && data.length == 0 && (
              <TableRow sx={{ height: '32px' }}>
                <TableCell
                  colSpan={
                    columns.length +
                    (selectable ? 1 : 0) +
                    (actionMenuItems?.length > 0 ? 1 : 0)
                  }
                  align='center'
                >
                  <Typography>No data available</Typography>
                </TableCell>
              </TableRow>
            )}

            {/* Data rows */}
            {!loading &&
              !error &&
              paginatedData?.map((row) => {
                const rowId = getRowId(row);
                return (
                  <TableRow
                    key={rowId}
                    hover
                    selected={selectedRows.has(rowId)}
                    className={`${hoverHighlight ? 'group' : ''}`}
                    sx={{
                      '&:hover td': {
                        backgroundColor: '#f5f7fa',
                      },
                      '&.Mui-selected td': {
                        backgroundColor: '#f5f7fa',
                      },
                      '&.Mui-selected:hover td': {
                        backgroundColor: '#f5f7fa',
                      },
                    }}
                  >
                    {/* Row checkbox */}
                    {selectable && (
                      <TableCell
                        sx={{
                          position: 'sticky',
                          left: 0,
                          background: '#fff',
                          zIndex: 7,
                          width: '32px',
                          maxWidth: '32px',
                          minWidth: '32px',
                          padding: '0 !important',
                          borderRight: '1px solid #CBD6E2 !important',
                          borderBottom: '1px solid #CBD6E2 !important',
                        }}
                      >
                        <Box className='flex items-center justify-center !h-[32px] !w-[32px]'>
                          <Checkbox
                            size='small'
                            checked={selectedRows.has(rowId)}
                            onChange={() => handleRowSelect(rowId)}
                            inputProps={{
                              'aria-label': `select row ${rowId}`,
                            }}
                            disableRipple
                            sx={{
                              color: '#CBD6E2',
                              '&.Mui-checked': {
                                color: '#1755E7',
                              },
                            }}
                          />
                        </Box>
                      </TableCell>
                    )}

                    {/* Data cells */}
                    {columns.map((column) => {
                      const isStatus = column.id === 'status';
                      const statusValue = row[column.id];
                      const cellValue = column.render
                        ? column.render(row)
                        : row[column.id];
                      const displayValue =
                        cellValue !== null &&
                          cellValue !== undefined &&
                          cellValue !== ''
                          ? cellValue
                          : '-';

                      return (
                        <TableCell
                          key={`${rowId}-${column.id}`}
                          sx={{
                            width: column.width || 160,
                            minWidth: column.width || 160,
                            maxWidth: column.width || 160,
                            ...(column.sx || {}),
                            zIndex: column.sticky ? 6 : 'auto',
                            left: selectable ? '32px' : 0,
                          }}
                          className={`${hoverHighlight &&
                            (isStatus
                              ? `${statusValue === 'Active' ? 'group-hover:!text-[#199806]' : 'group-hover:!text-[#f44336]'} group-hover:underline`
                              : 'group-hover:!text-blue-600 group-hover:underline')
                            } cursor-context-menu`}
                        >
                          <TruncateWithTooltip
                            text={String(displayValue)}
                            maxWidth={Number(column.width)}
                          >
                            {displayValue as React.ReactNode}
                          </TruncateWithTooltip>
                        </TableCell>
                      );
                    })}

                    {/* Action buttons */}
                    {actionMenuItems && actionMenuItems.length > 0 && (
                      <TableCell
                        sx={{
                          padding: '0px !important',
                          whiteSpace: 'nowrap',
                          width: actionWidth,
                          minWidth: actionWidth,
                          maxWidth: actionWidth,
                          height: '32px !important',
                          minHeight: '32px !important',
                          maxHeight: '32px !important',
                        }}
                      >
                        {actionDisplayMode === 'icon' ? (
                          <Box className='w-full inline-flex items-center justify-center gap-2'>
                            {actionMenuItems.map((item, index) => (
                              <Tooltip
                                key={index}
                                title={`Click to ${item.label.toLowerCase()}`}
                                slotProps={{
                                  tooltip: {
                                    sx: {
                                      backgroundColor: '#fff',
                                      color: 'rgba(0, 0, 0, 0.87)',
                                      boxShadow: 2,
                                      borderRadius: '4px',
                                    },
                                  },
                                }}
                              >
                                <IconButton
                                  size='small'
                                  onClick={() => item.onClick(row)}
                                >
                                  <img
                                    src={item.icon?.toString()}
                                    alt='actionIcon'
                                    className='w-4 h-4'
                                    style={item.iconStyle}
                                  />
                                </IconButton>
                              </Tooltip>
                            ))}
                          </Box>
                        ) : (
                          <TableActionButton
                            actions={actionMenuItems.map((item) => ({
                              ...item,
                              onClick: () => item.onClick(row),
                            }))}
                          />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
          </TableBody>
        </MuiTable>
      </TableContainer>

      {/* Pagination */}
      {(onPageChange || onRowsPerPageChange) && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          count={totalItems}
          rowsPerPage={rowsPerPage}
          page={currentPage}
          onPageChange={(newPage) => onPageChange?.(newPage)}
          onRowsPerPageChange={(newPageSize) =>
            onRowsPerPageChange?.(newPageSize)
          }
        />
      )}
    </>
  );
};

export default ListTable;
