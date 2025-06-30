/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  Checkbox,
  IconButton,
  MenuItem,
  Table as MuiTable,
  Select,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { ListTableColumn, ListTableProps, RowData, SortOrder } from './types';
import TablePagination from './pagination';
import TableSortHeader from './sort-header';
import TableActionButton from './action-button';
import { TruncateWithTooltip } from '../truncate-with-tooltip';
import TableSkeleton from './table-skeleton';
import { CloseIcon, ErrorInfoIcon, NewTickIcon } from '../../assets';

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
  conditionMenuItems,
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
  component,
  onCellEdit,
}: ListTableProps<T>) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    columnId: string;
    originalValue: string;
    value: string;
    error?: string | null;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  // Shared validation function
  const validateCellValue = (
    value: string,
    column: ListTableColumn<T>
  ): string | null => {
    let error = null;

    if (column.field?.required && !value.trim()) {
      error = 'This field is required';
    } else if (column.field?.validation) {
      for (const validation of column.field.validation) {
        if (!validation.regex.test(value)) {
          error = validation.errorMessage;
          break;
        }
      }
    }

    return error;
  };

  // Handle save changes
  const handleSave = async () => {
    if (!editingCell || !onCellEdit) return;

    const column = columns.find((col) => col.id === editingCell.columnId);
    if (!column) return;

    // The value can be a number, but validation rules are regex-based, so convert to string.
    const error = validateCellValue(editingCell.value, column);
    if (error) {
      setEditingCell((prev) => (prev ? { ...prev, error } : null));
      return;
    }

    if (editingCell.originalValue === editingCell.value) {
      handleCancel();
      return;
    }

    setIsSaving(true);
    try {
      // Per user request, convert to number if the column type is 'number'
      let finalValue: string | number = editingCell.value;
      if (column.field?.type === 'number') {
        finalValue = Number(editingCell.value);
        if (isNaN(finalValue)) {
          setEditingCell((prev) =>
            prev ? { ...prev, error: 'Invalid number' } : null
          );
          setIsSaving(false);
          return;
        }
      }
      await onCellEdit(editingCell.rowId, editingCell.columnId, finalValue);
      setEditingCell(null);
    } catch (error) {
      console.error('Error saving cell value:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    console.log('cancel called...');
    setEditingCell(null);
  };

  // Handle key events (Escape to cancel, Enter to save)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter') {
      handleSave();
    }
  };

  // Handle value change in edit input
  const handleValueChange = (value: string | number) => {
    if (editingCell) {
      setEditingCell({ ...editingCell, value: String(value), error: null });
    }
  };

  // Render edit input based on column type
  const renderFields = (column: ListTableColumn<T>) => {
    if (!editingCell) return null;

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const value = e.target.value;
      handleValueChange(value);
    };

    const commonProps = {
      value: editingCell.value || '',
      onChange: handleChange,
      onKeyDown: handleKeyDown,
      disabled: isSaving,
      size: 'small' as const,
      fullWidth: true,
      variant: 'outlined' as const,
      error: !!editingCell.error,
      placeholder: column.field?.placeholder || '',
      sx: {
        fontSize: '13px',
        width: '100%',
        '& .MuiOutlinedInput-input': {
          fontSize: '13px',
          padding: '6px 8px',
          height: '20px',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          border: editingCell.error ? '1px solid #ef4444' : 'none',
        },
        '& .MuiOutlinedInput-root': {
          '&.Mui-focused': {
            boxShadow: 'none',
          },
        },
        '.MuiSelect-select': {
          padding: '6px 8px',
          color: editingCell.value === '' ? '#7D98B6' : 'black',
        },
        '&.Mui-disabled': {
          backgroundColor: '#f3f4f6',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          border: 'none',
          borderRadius: '2px',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
        '& svg': {
          color: '#7D98B6',
        },
      },
    };

    switch (column?.field?.type) {
      case 'text':
        return <TextField {...commonProps} type='text' autoFocus />;
      case 'select':
        return (
          <Select
            {...commonProps}
            value={editingCell.value}
            onChange={(e) => handleValueChange(e.target.value)}
            MenuProps={{
              PaperProps: {
                sx: {
                  maxWidth: column.width || 300,
                  maxHeight: 300,
                  marginTop: '4px',
                  boxShadow:
                    'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
                  '& .MuiMenuItem-root': {
                    fontSize: '13px',
                    padding: '6px 12px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                },
              },
            }}
          >
            {column?.field?.options?.map((option) => (
              <MenuItem
                key={option.value}
                value={option.value}
                sx={{
                  color: '#425A76',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                {option.label}
              </MenuItem>
            ))}
          </Select>
        );
      case 'textarea':
        return (
          <div className='absolute top-0 left-0 w-full z-30 bg-white'>
            <TextField
              {...commonProps}
              multiline
              minRows={3}
              maxRows={10}
              autoFocus
              sx={{
                '& .MuiOutlinedInput-input': {
                  fontSize: '13px',
                  borderRadius: '2px',
                  padding: '0px',
                  lineHeight: 1.4,
                },
                '& textarea': {
                  resize: 'none',
                },
              }}
            />
          </div>
        );
      case 'number':
        return <TextField {...commonProps} type='number' />;
      default:
        return null;
    }
  };

  const paginatedData = onPageChange
    ? data
    : data.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

  const isAvailableAction = actionMenuItems.some((it) => !it.hide);

  return (
    <>
      <TableContainer sx={tableStyle}>
        <MuiTable
          stickyHeader={stickyHeader}
          sx={{
            height: '100%',
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
                      textAlign: 'left',
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
                      textAlign: 'left',
                    }}
                  >
                    {column.label}
                  </TableCell>
                )
              )}
              {typeof conditionMenuItems === 'function' && (
                <TableCell
                  sx={{
                    padding: '0px 8px',
                    width: 280,
                    minWidth: 110,
                    maxWidth: 280,
                  }}
                >
                  Status Action
                </TableCell>
              )}

              {actionMenuItems?.length > 0 && isAvailableAction && (
                <TableCell
                  sx={{
                    width: actionWidth,
                    minWidth: actionWidth,
                    maxWidth: actionWidth,
                    textAlign: 'center',
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
                rowsPerPage={rowsPerPage > 20 ? 20 : rowsPerPage}
                columnsCount={columns.length + (conditionMenuItems ? 1 : 0)}
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
                    (actionMenuItems?.length > 0 ? 1 : 0) +
                    (conditionMenuItems ? 1 : 0)
                  }
                  align='center'
                >
                  <Typography color='error'>{error}</Typography>
                </TableCell>
              </TableRow>
            )}

            {/* Empty state */}
            {!loading && !error && data.length === 0 && (
              <TableRow sx={{ height: '32px' }}>
                <TableCell
                  colSpan={
                    columns.length +
                    (selectable ? 1 : 0) +
                    (actionMenuItems?.length > 0 ? 1 : 0) +
                    (conditionMenuItems ? 1 : 0)
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
              paginatedData?.map((row, i) => {
                const rowId = getRowId(row);
                const conditionItems = conditionMenuItems?.(row);
                return (
                  <TableRow
                    key={i}
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
                          padding: '0px !important',
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
                      const isEditing =
                        editingCell?.rowId === rowId &&
                        editingCell?.columnId === column.id;
                      const hasValueChanged =
                        isEditing &&
                        editingCell &&
                        String(editingCell.value) !==
                          String(editingCell.originalValue);
                      const columnId = column.id;
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
                            padding: isEditing
                              ? '0px 0px !important'
                              : '0px 8px !important',
                            outline: isEditing
                              ? `2px solid ${
                                  editingCell.error ? '#ef4444' : '#60A5FA'
                                }`
                              : undefined,
                            outlineOffset: isEditing ? '-2px' : undefined, // Draws 1px inside, 1px outside
                            ...(isEditing && { zIndex: 12 }), // Lifts cell above others
                            ...(isEditing &&
                              editingCell.error && {
                                backgroundColor: '#FEF2F2',
                              }),
                          }}
                          className={`${
                            hoverHighlight &&
                            (isStatus
                              ? `${statusValue === 'Active' ? 'group-hover:!text-[#199806]' : 'group-hover:!text-[#f44336]'}`
                              : 'group-hover:!text-[#1755E7]')
                          } cursor-context-menu`}
                          onDoubleClick={() => {
                            if (!column.editable) return;

                            if (
                              editingCell &&
                              editingCell.value !== editingCell.originalValue
                            ) {
                              return;
                            }
                            const cellValue = row[column.id];
                            setEditingCell({
                              rowId,
                              columnId,
                              value: cellValue == null ? '' : String(cellValue),
                              originalValue:
                                cellValue == null ? '' : String(cellValue),
                              error: null,
                            });
                          }}
                        >
                          {isEditing ? (
                            <div className='box-border !h-[32px] !max-h-[32px] relative'>
                              {renderFields(column)}
                              {editingCell.error &&
                                column.field?.type === 'text' && (
                                  <Tooltip
                                    title={editingCell.error}
                                    arrow
                                    placement='top'
                                    slotProps={{
                                      tooltip: {
                                        sx: {
                                          backgroundColor: '#FEF2F2',
                                          mr: 1,
                                        },
                                      },
                                    }}
                                  >
                                    <span className='h-[28px] w-5 flex items-center justify-center absolute top-[3px] bg-[#FEF2F2] right-[2px] cursor-pointer'>
                                      <ErrorInfoIcon
                                        alt='error'
                                        className='w-5 h-3.5'
                                      />
                                    </span>
                                  </Tooltip>
                                )}
                              {hasValueChanged && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '50%',
                                    transform: 'translate(110%, -50%)',
                                    zIndex: 999,
                                    display: 'flex',
                                    gap: 1,
                                    alignItems: 'center',
                                  }}
                                >
                                  <button
                                    onClick={handleSave}
                                    disabled={isSaving || !!editingCell?.error}
                                    className='w-7 h-7 flex items-center justify-center bg-[#A9E3A2] rounded-[2px] shadow-[0_2px_8px_rgba(0,0,0,0.1)] cursor-pointer transition-all duration-200 hover:brightness-95 hover:shadow-[0_3px_10px_rgba(0,0,0,0.15)] disabled:opacity-50'
                                  >
                                    <NewTickIcon
                                      className='w-3 h-3'
                                      style={{
                                        filter: 'brightness(0) saturate(100%)',
                                      }}
                                    />
                                  </button>

                                  <button
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className='w-7 h-7 flex items-center justify-center bg-[#FBB6AE] rounded-[2px] shadow-[0_2px_8px_rgba(0,0,0,0.1)] cursor-pointer transition-all duration-200 hover:brightness-95 hover:shadow-[0_3px_10px_rgba(0,0,0,0.15)] disabled:opacity-50'
                                  >
                                    <CloseIcon
                                      className='w-2.5 h-2.5'
                                      style={{
                                        filter: 'brightness(0) saturate(100%)',
                                      }}
                                    />
                                  </button>
                                </Box>
                              )}
                            </div>
                          ) : (
                            <TruncateWithTooltip
                              maxWidth={Number(column.width)}
                            >
                              {displayValue as React.ReactNode}
                            </TruncateWithTooltip>
                          )}
                        </TableCell>
                      );
                    })}

                    {Array.isArray(conditionItems) && (
                      <TableCell
                        sx={{
                          padding: '0px 8px',
                          width: 280,
                          minWidth: 110,
                          maxWidth: 280,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {conditionItems.length > 0 ? (
                          <Box className='w-full inline-flex items-center  gap-2'>
                            {conditionItems.map((item, index) => {
                              if (item.hide) return null;
                              return (
                                <button
                                  key={index}
                                  onClick={() => item.onClick(row)}
                                  disabled={item.disabled}
                                  className={item.className}
                                >
                                  {item.icon && (
                                    <item.icon
                                      alt='actionIcon'
                                      style={{
                                        width: '14px',
                                        height: '14px',
                                        ...item.iconStyle,
                                      }}
                                    />
                                  )}

                                  {item.label}
                                </button>
                              );
                            })}
                          </Box>
                        ) : (
                          <Typography
                            component='span'
                            sx={{
                              color: '#6b7280',
                              display: 'inline-block',
                              width: '100%',
                              textAlign: 'center',
                            }}
                          >
                            -
                          </Typography>
                        )}
                      </TableCell>
                    )}

                    {/* Action buttons */}
                    {actionMenuItems &&
                      actionMenuItems.length > 0 &&
                      isAvailableAction && (
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
                              {actionMenuItems.map((item, index) => {
                                if (item.hide) return null;
                                return (
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
                                      {item.icon && (
                                        <item.icon
                                          alt='actionIcon'
                                          className='w-4 h-4'
                                          style={item.iconStyle}
                                        />
                                      )}
                                    </IconButton>
                                  </Tooltip>
                                );
                              })}
                            </Box>
                          ) : (
                            <TableActionButton
                              actions={actionMenuItems.map((item) => ({
                                ...item,
                                disabled:
                                  component === 'global-project'
                                    ? row.account_status === 'inactive'
                                    : item.disabled,
                                onClick: () => item.onClick(row),
                              }))}
                            />
                          )}
                        </TableCell>
                      )}
                  </TableRow>
                );
              })}
            {!loading && !error && data.length > 0 && (
              <TableRow sx={{ height: '10px !important' }}>
                <TableCell
                  colSpan={
                    columns.length +
                    (selectable ? 1 : 0) +
                    (actionMenuItems?.length > 0 ? 1 : 0) +
                    (conditionMenuItems ? 1 : 0)
                  }
                  sx={{ height: '10px !important' }}
                ></TableCell>
              </TableRow>
            )}
          </TableBody>
        </MuiTable>
      </TableContainer>

      {/* Pagination */}
      {(onPageChange || onRowsPerPageChange) &&
        (loading || error || data.length > 0) && (
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
