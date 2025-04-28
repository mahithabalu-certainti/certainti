import {
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  Table as MuiTable,
  Paper,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { RowData, SortDirection, TableProps } from './types';
import TablePagination from './pagination';
import { arrowDownIcon, arrowUpIcon, editIcon, eyeIcon } from '../../assets';

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
    <>
    <Paper sx={{ overflowX: 'auto', boxShadow: 'none', width: '100%', borderBottom: '1px solid #CBD6E2',borderRadius: '0px' }}>
      <TableContainer>
        <MuiTable>
          <TableHead
            sx={{
              '& .MuiTableCell-root': {
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '21px',
                color: '#2A2A2A',
                padding: '0px',
                pl: 1,
                minHeight: '42px',
              },
            }}
          >
            <TableRow>
              {/* Select all checkbox */}
              {selectable && (
                <TableCell padding='checkbox' sx={{ padding: '0px !important' }}>
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
                            className='cursor-pointer'
                            onClick={(e) => {
                              e.stopPropagation();
                              if (column.sort) {
                                if (column.sort) {
                                  handleSort(column.sort);
                                }
                              }
                            }}
                          >
                            {sortOrder === 'ASC' ? (
                                <div className='inline-flex flex-col justify-center items-center pl-0.5 cursor-pointer mt-0.5'>
                                  <img
                                    src={arrowUpIcon}
                                    alt='sort-up-active'
                                    className='w-4 h-4'
                                    style={{
                                      filter: 'brightness(0) saturate(100%)',
                                    }}
                                  />
                                  <img
                                    src={arrowDownIcon}
                                    alt='sort-down-inactive'
                                    className='w-4 h-4 filter grayscale brightness-0 opacity-50 mt-[-9px]'
                                  />
                                </div>
                              ) : (
                                <div className='inline-flex flex-col justify-center items-center pl-0.5 cursor-pointer mt-0.5'>
                                  <img
                                    src={arrowUpIcon}
                                    alt='sort-up-inactive'
                                    className='w-4 h-4 filter grayscale brightness-0 opacity-50'
                                  />
                                  <img
                                    src={arrowDownIcon}
                                    alt='sort-down-active'
                                    className='w-4 h-4 mt-[-9px]'
                                    style={{
                                      filter: 'brightness(0) saturate(100%)',
                                    }}
                                  />
                                </div>
                              )}
                          </span>
                        )}
                        {sortBy !== column.sort && (
                            <div
                              className='inline-flex flex-col justify-center items-center pl-0.5 cursor-pointer mt-0.5'
                              onClick={(e) => {
                                e.stopPropagation();
                                if (column.sort) {
                                  handleSort(column.sort);
                                }
                              }}
                            >
                              <img
                                src={arrowUpIcon}
                                alt='sort-up'
                                className='w-4 h-4 filter grayscale brightness-0 opacity-50'
                              />
                              <img
                                src={arrowDownIcon}
                                alt='sort-down'
                                className='w-4 h-4 filter grayscale brightness-0 opacity-50 mt-[-9px]'
                              />
                            </div>
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
                padding: '0px',
                pl: 1,
                minHeight: '36px',
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
                    className='group'
                  >
                    {/* Row checkbox */}
                    {selectable && (
                      <TableCell padding='checkbox' sx={{ padding: '0px !important' }}>
                        <Checkbox
                          checked={selectedRows.has(rowId)}
                          onChange={() => handleRowSelect(rowId)}
                          inputProps={{ 'aria-label': `select row ${rowId}` }}
                          disableRipple
                          sx={{
                            color: '#CBD6E2',
                            '&.Mui-checked': {
                              color: '#1755E7',
                            },
                          }}
                        />
                      </TableCell>
                    )}

                    {/* Data cells */}
                    {columns.map((column) => {
                      const isStatus = column.id === 'status';
                      const statusValue = row[column.id];
                                  
                     return (
                      <TableCell key={`${rowId}-${column.id}`}
                        sx={{
                          width: column.width || 120,
                          minWidth: column.width || 120,
                          maxWidth: column.width || 'auto',
                          wordWrap: 'break-word'
                        }}
                        className={`${
                          isStatus
                            ? `${statusValue === 'Active' ? 'group-hover:!text-[#199806]' : 'group-hover:!text-[#f44336]'} group-hover:underline`
                            : 'group-hover:!text-blue-600 group-hover:underline'
                        }`}
                      >
                        {column.render
                          ? column.render(row)
                          : (row[column.id] as React.ReactNode)}
                      </TableCell>
                    )})}

                    {/* Action buttons */}
                    {(onEdit || onDelete || onView) && (
                      <TableCell sx={{ whiteSpace: 'nowrap', width:'100px', minWidth: '100px', maxWidth: '100px' }}>
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
                            <IconButton
                              size='small'
                              sx={{ mr: 1.5 }}
                              onClick={() => onView(row)}
                            >
                              <img src={eyeIcon} alt='viewIcon' className='w-5 h-5' />
                            </IconButton>
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
                            <IconButton
                              size='small'
                              onClick={() => onEdit(row)}
                            >
                              <img 
                              src={editIcon} 
                              alt='editIcon'
                              style={{
                                filter:
                                  'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
                              }}
 
                              className='w-4 h-4'
                              />
                            </IconButton>
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
                              sx={{ textTransform: 'capitalize' }}
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
    </Paper>
      {/* Pagination */}
      {(onPageChange || onRowsPerPageChange) && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          count={totalItems}
          rowsPerPage={rowsPerPage}
          page={currentPage}
          onPageChange={(newPage) => onPageChange?.(newPage)}
          onRowsPerPageChange={(newPageSize) => onRowsPerPageChange?.(newPageSize)}
        />
      )}
  </>
  );
};

export default Table;
