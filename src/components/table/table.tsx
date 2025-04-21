import {
  Button,
  Checkbox,
  CircularProgress,
  Table as MuiTable,
  Paper,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { RowData, SortDirection, TableProps } from './types';

const Table = <T extends RowData>({
  data = [],
  columns,
  getRowId,
  // Selection
  selectable = false,
  onSelectionChange,
  // Actions
  onEdit,
  onDelete,
  onView,
  // State
  loading = false,
  error,
  // Pagination
  rowsPerPage = 10,
  currentPage = 0,
  totalItems = 0,
  onPageChange,
  onRowsPerPageChange,
  // Sorting
  sortBy,
  sortOrder = 'ASC',
  onSort,
}: TableProps<T>) => {
  // Row selection state
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

  // Handle sorting
  const handleSort = (columnId: string) => {
    if (!onSort || !columns.find((col) => col.sort === columnId)?.sortable)
      return;

    const isCurrentSort = columnId === sortBy;
    const newOrder: SortDirection = isCurrentSort
      ? sortOrder === 'ASC'
        ? 'DESC'
        : 'ASC'
      : 'ASC';

    onSort(columnId, newOrder);
  };

  // Calculate paginated data
  const paginatedData = onPageChange
    ? data
    : data.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

  return (
    <Paper sx={{ overflowX: 'auto', width: '100%' }}>
      <TableContainer>
        <MuiTable>
          <TableHead
            sx={{
              '& .MuiTableCell-root': {
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '21px',
                color: '#2A2A2A',
                padding: '8px',
              },
            }}
          >
            <TableRow>
              {/* Select all checkbox */}
              {selectable && (
                <TableCell padding='checkbox'>
                  <Checkbox
                    indeterminate={
                      selectedRows.size > 0 && selectedRows.size < data.length
                    }
                    checked={
                      data.length > 0 && selectedRows.size === data.length
                    }
                    onChange={handleSelectAll}
                    disabled={data.length === 0 || loading}
                    inputProps={{ 'aria-label': 'select all rows' }}
                  />
                </TableCell>
              )}

              {/* Column headers */}
              {columns.map((column) => (
                // <TableCell
                //   key={column.id}
                //   onClick={() => column.sortable && handleSort(column.id)}
                //   sx={{
                //     cursor: column.sortable ? 'pointer' : 'default',
                //     fontWeight: sortBy === column.id ? 'bold' : 'normal',
                //     minWidth: 120,
                //   }}
                // >
                //   <div className='flex items-center'>
                //     {column.header}
                //     {column.sortable && sortBy === column.id && (
                //       <span className='ml-1'
                //       >
                //         {sortOrder === 'ASC' ? '↑' : '↓'}
                //       </span>
                //     )}
                //   </div>
                // </TableCell>
                <TableCell
                  key={column.id}
                  sx={{
                    cursor: 'default',
                    fontWeight: sortBy === column.id ? 'bold' : 'normal',
                    width: column.width || 120,
                    minWidth: column.width || 120,
                    maxWidth: column.width || 'auto', 
                  }}
                >
                  <div className='flex items-center'>
                    {column.header}

                    {column.sortable && (
                      <>
                        {sortBy === column.sort && (
                          <span
                            className='ml-1 cursor-pointer'
                            onClick={(e) => {
                              e.stopPropagation();
                              if (column.sort) {
                                if (column.sort) {
                                  handleSort(column.sort);
                                }
                              }
                            }}
                          >
                            {sortOrder === 'ASC' ? '↑' : '↓'}
                          </span>
                        )}
                        {sortBy !== column.sort && (
                          <span
                            className='ml-1 cursor-pointer text-gray-400'
                            onClick={(e) => {
                              e.stopPropagation();
                              if (column.sort) {
                                handleSort(column.sort);
                              }
                            }}
                          >
                            ↕
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              ))}

              {/* Action column */}
              {(onEdit || onDelete || onView) && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>

          <TableBody
            sx={{
              '& .MuiTableCell-root': {
                fontWeight: 300,
                fontSize: '14px',
                lineHeight: '21px',
                color: '#425A76',
                padding: '6px',
              },
            }}
          >
            {/* Loading state */}
            {loading && (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    (selectable ? 1 : 0) +
                    (onEdit || onDelete || onView ? 1 : 0)
                  }
                  align='center'
                >
                  <CircularProgress />
                </TableCell>
              </TableRow>
            )}

            {/* Error state */}
            {error && !loading && (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    (selectable ? 1 : 0) +
                    (onEdit || onDelete || onView ? 1 : 0)
                  }
                  align='center'
                >
                  <Typography color='error'>{error}</Typography>
                </TableCell>
              </TableRow>
            )}

            {/* Empty state */}
            {!loading && !error && data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    (selectable ? 1 : 0) +
                    (onEdit || onDelete || onView ? 1 : 0)
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
                  >
                    {/* Row checkbox */}
                    {selectable && (
                      <TableCell padding='checkbox'>
                        <Checkbox
                          checked={selectedRows.has(rowId)}
                          onChange={() => handleRowSelect(rowId)}
                          inputProps={{ 'aria-label': `select row ${rowId}` }}
                        />
                      </TableCell>
                    )}

                    {/* Data cells */}
                    {columns.map((column) => (
                      <TableCell key={`${rowId}-${column.id}`}
                        sx={{
                          width: column.width || 120,
                          minWidth: column.width || 120,
                          maxWidth: column.width || 'auto',
                          wordWrap: 'break-word'
                        }}
                      >
                        {column.render
                          ? column.render(row)
                          : (row[column.id] as React.ReactNode)}
                      </TableCell>
                    ))}

                    {/* Action buttons */}
                    {(onEdit || onDelete || onView) && (
                      <TableCell sx={{ whiteSpace: 'nowrap', width:'150px', minWidth: '150px', maxWidth: '150px' }}>
                        {onView && (
                          <Tooltip
                            arrow
                            title='Click to view'
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
                            <Button
                              variant='outlined'
                              size='small'
                              color='primary'
                              sx={{ mr: 1 }}
                              onClick={() => onView(row)}
                            >
                              View
                            </Button>
                          </Tooltip>
                        )}
                        {onEdit && (
                          <Tooltip
                            arrow
                            title='Click to edit'
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
                            <Button
                              variant='outlined'
                              size='small'
                              color='secondary'
                              sx={{ mr: 1 }}
                              onClick={() => onEdit(row)}
                            >
                              Edit
                            </Button>
                          </Tooltip>
                        )}
                        {onDelete && (
                          <Tooltip
                            arrow
                            title='Click to delete'
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
                            <Button
                              variant='outlined'
                              size='small'
                              color='error'
                              onClick={() => onDelete(row)}
                            >
                              Delete
                            </Button>
                          </Tooltip>
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
          rowsPerPageOptions={[5, 10, 25, 50]}
          component='div'
          count={totalItems}
          rowsPerPage={rowsPerPage}
          page={currentPage}
          onPageChange={(_, newPage) => onPageChange?.(newPage)}
          onRowsPerPageChange={(e) =>
            onRowsPerPageChange?.(parseInt(e.target.value, 10))
          }
        />
      )}
    </Paper>
  );
};

export default Table;
