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
import React, { useState, useMemo, useEffect } from 'react';
import TablePagination from './pagination';
import TableSortHeader from './sort-header';
import TableActionButton from './action-button';
import { TruncateWithTooltip } from '../truncate-with-tooltip';
import TableSkeleton from './table-skeleton';
import {
  EditingCell,
  ExpandedState,
  ListTableProps,
  RowData,
  SortOrder,
} from './types';
import {
  getEditingCellValue,
  renderFields,
  validateCellValue,
} from './table-utils';
import { ArrowDownIcon, ChildAccountIcon, ErrorInfoIcon } from '../../assets';

const ListTable = <T extends RowData>({
  data = [],
  columns,
  getRowId,
  parentBorder = true,
  expandable = false,
  childrenKey = 'child',
  grandchildrenKey = 'grandchild',
  maxNestingLevel = 3,
  editDisableLevel = [],
  hoverHighlight = false,
  tableStyle,
  stickyHeader = false,
  stickyColumnsCount = 0,
  // Selection
  hideHeaderSelect = false,
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
  // Expansion
  expandAllParent = false,
  expandAllChild = false,
}: ListTableProps<T>) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedRows, setExpandedRows] = useState<ExpandedState>({});

  // handle initial expansion
  useEffect(() => {
    if (expandAllParent || expandAllChild) {
      const newExpandedRows: ExpandedState = {};

      data.forEach((parent) => {
        const parentId = getRowId(parent);
        const children = parent[childrenKey] as T[] | undefined;

        const shouldExpandParent =
          expandAllParent && children && children.length > 0;
        if (shouldExpandParent || expandAllChild) {
          newExpandedRows[parentId] = {
            expanded: true,
            level: 0,
            children: {},
          };

          if (expandAllChild && children && children.length > 0) {
            children.forEach((child) => {
              const childId = getRowId(child);
              if (newExpandedRows[parentId].children) {
                newExpandedRows[parentId].children[childId] = {
                  expanded: true,
                  level: 1,
                  children: {},
                };
              }
            });
          }
        }
      });

      setExpandedRows(newExpandedRows);
    }
  }, [data, expandAllParent, expandAllChild, childrenKey, getRowId]);

  // Handle row expansion
  const toggleRowExpansion = (rowId: string, level: number = 0) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: {
        expanded: !prev[rowId]?.expanded,
        level,
        children: prev[rowId]?.children || {},
      },
    }));
  };

  // handle Row Select
  const handleRowSelect = (
    rowId: string,
    row: T & { _level: number; _type: string }
  ) => {
    const newSelected = new Set(selectedRows);

    // Function to get all child IDs recursively
    const getAllChildIds = (parentId: string): string[] => {
      const childIds: string[] = [];
      const parentRow = flattenedData.find(
        (item) => getRowId(item) === parentId
      );

      if (parentRow) {
        const children = parentRow[childrenKey] as T[];
        if (children && children.length > 0) {
          children.forEach((child) => {
            const childId = getRowId(child);
            childIds.push(childId);
            childIds.push(...getAllChildIds(childId));
          });
        }

        // Handle grandchildren if this is a child row
        if (parentRow._level === 1 && grandchildrenKey) {
          const grandchildren = parentRow[grandchildrenKey] as T[];
          if (grandchildren && grandchildren.length > 0) {
            grandchildren.forEach((gc) => {
              childIds.push(`${parentId}-gc-${grandchildren.indexOf(gc)}`);
            });
          }
        }
      }

      return childIds;
    };

    // Function to get all parent IDs
    const getAllParentIds = (childId: string): string[] => {
      const parentIds: string[] = [];
      const childRow = flattenedData.find((item) => getRowId(item) === childId);

      if (childRow && childRow._parentId) {
        parentIds.push(childRow._parentId);
        parentIds.push(...getAllParentIds(childRow._parentId));
      }

      return parentIds;
    };

    if (newSelected.has(rowId)) {
      // Deselect the row and all its children
      newSelected.delete(rowId);
      const childIds = getAllChildIds(rowId);
      childIds.forEach((id) => newSelected.delete(id));

      // If deselecting a child, check if we need to deselect parents
      if (row._level > 0) {
        const parentIds = getAllParentIds(rowId);
        parentIds.forEach((parentId) => {
          const parentChildren = flattenedData.filter(
            (item) => item._parentId === parentId
          );
          const allChildrenDeselected = parentChildren.every(
            (child) => !newSelected.has(getRowId(child))
          );
          if (allChildrenDeselected) {
            newSelected.delete(parentId);
          }
        });
      }
    } else {
      // Select the row and all its children
      newSelected.add(rowId);
      const childIds = getAllChildIds(rowId);
      childIds.forEach((id) => newSelected.add(id));

      // If selecting a child or grandchild, select all parents
      if (row._level > 0) {
        const parentIds = getAllParentIds(rowId);
        parentIds.forEach((parentId) => newSelected.add(parentId));
      }
    }

    setSelectedRows(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  //handle SelectAll
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(flattenedData.map(getRowId));
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

  const handleSave = async () => {
    if (!editingCell || !onCellEdit) return;
    const column = columns.find((col) => col.id === editingCell.columnId);
    if (!column) return;

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
      await onCellEdit(
        editingCell.rowId,
        editingCell.columnId,
        editingCell.value
      );
      setEditingCell(null);
    } catch (error) {
      console.error('Error saving cell value:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter') {
      handleSave();
    }
  };

  useEffect(() => {
    if (!editingCell) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Skip if clicking on any picker elements
      const isPickerElement = target.closest(
        '.MuiPickersPopper-root, .MuiDialog-root, .MuiCalendarOrClockPicker-root, .MuiPaper-root, .MuiPopover-root'
      );

      if (isPickerElement) return;

      const isEditingCell = target.closest(
        `[data-editing="${editingCell.rowId}-${editingCell.columnId}"]`
      );
      if (!isEditingCell) {
        handleSave();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingCell]);

  const handleValueChange = (value: string | number) => {
    if (editingCell) {
      setEditingCell({ ...editingCell, value: value, error: null });
    }
  };

  // Flatten nested data for display
  const flattenedData = useMemo(() => {
    const flatten = (
      items: T[],
      level: number = 0
    ): Array<
      T & {
        _level: number;
        _parentId?: string;
        _type: 'parent' | 'child' | 'grandchild';
      }
    > => {
      const result: Array<
        T & {
          _level: number;
          _parentId?: string;
          _type: 'parent' | 'child' | 'grandchild';
        }
      > = [];

      items.forEach((item) => {
        const itemId = getRowId(item);
        const enhancedItem = {
          ...item,
          _level: level,
          _type: (level === 0
            ? 'parent'
            : level === 1
              ? 'child'
              : 'grandchild') as 'parent' | 'child' | 'grandchild',
        };

        result.push(enhancedItem);

        // Add children if expanded and they exist
        if (expandable && expandedRows[itemId]?.expanded) {
          const children = item[childrenKey] as T[];
          if (children && children.length > 0 && level < maxNestingLevel - 1) {
            const childrenWithParent = children.map((child) => ({
              ...child,
              _parentId: itemId,
            }));
            result.push(...flatten(childrenWithParent, level + 1));
          }

          // Add grandchildren (fiscal year projects) if this is a child and it's expanded
          if (level === 1 && grandchildrenKey) {
            const grandchildren = item[grandchildrenKey] as T[];
            if (grandchildren && grandchildren.length > 0) {
              const grandchildrenItems = grandchildren.map((gc, index) => ({
                ...gc,
                rid: `${itemId}-gc-${index}`,
                account_name: `${gc.fiscal_year || '-'}`,
                _parentId: itemId,
                _level: level + 1,
                _type: 'grandchild' as const,
              }));
              result.push(
                ...(grandchildrenItems as Array<
                  T & {
                    _level: number;
                    _parentId?: string;
                    _type: 'parent' | 'child' | 'grandchild';
                  }
                >)
              );
            }
          }
        }
      });

      return result;
    };

    return flatten(data);
  }, [
    data,
    expandedRows,
    expandable,
    childrenKey,
    grandchildrenKey,
    maxNestingLevel,
    getRowId,
  ]);

  const isAvailableAction = actionMenuItems.some((it) => !it.hide);

  const renderExpandIcon = (
    row: T & { _level: number; _type: string },
    rowId: string
  ) => {
    if (!expandable) return null;

    const hasChildren = (row[childrenKey] as T[])?.length > 0;
    const hasGrandchildren =
      row._level === 1 && (row[grandchildrenKey] as T[])?.length > 0;

    if (!hasChildren && !hasGrandchildren) {
      return <div className='h-[10px] w-[22px] inline-flex'></div>;
    }
    const isExpanded = expandedRows[rowId]?.expanded;
    return (
      <IconButton
        aria-label='expand row'
        size='small'
        disableRipple
        className='!p-0 !pr-1 !mt-0.5'
        onClick={() => toggleRowExpansion(rowId, row._level)}
      >
        <ArrowDownIcon
          alt={isExpanded ? 'arrowUp' : 'arrowDown'}
          style={{
            transform: isExpanded ? '' : 'rotate(-90deg)',
            filter:
              'brightness(0) saturate(100%) invert(25%) sepia(16%) saturate(592%) hue-rotate(164deg) brightness(93%) contrast(91%)',
          }}
          className='h-[18px] w-[18px] mb-1'
        />
      </IconButton>
    );
  };

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
                bgcolor: component === 'account' ? '#fff' : '#FCFCFC',
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
                    borderRight: hideHeaderSelect
                      ? 'none !important'
                      : '1px solid #CBD6E2',
                    borderBottom: '1px solid #CBD6E2 !important',
                  }}
                >
                  {!hideHeaderSelect && (
                    <Box className='flex items-center justify-center !h-[28px] !w-[32px]'>
                      <Checkbox
                        size='small'
                        indeterminate={
                          selectedRows.size > 0 &&
                          selectedRows.size < flattenedData.length
                        }
                        checked={
                          flattenedData.length > 0 &&
                          selectedRows.size === flattenedData.length
                        }
                        onChange={handleSelectAll}
                        disabled={flattenedData.length === 0 || loading}
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
                  )}
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
                rowsPerPage={
                  component === 'account'
                    ? 20
                    : rowsPerPage > 20
                      ? 20
                      : rowsPerPage
                }
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
            {!loading && !error && flattenedData.length === 0 && (
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
              flattenedData?.map((row, i) => {
                const rowId = getRowId(row);
                const conditionItems = conditionMenuItems?.(row);
                const rowLevel = row._level || 0;
                const isExpanded = expandedRows[rowId]?.expanded;
                const isLastChildInGroup = () => {
                  if (rowLevel === 0) return false;
                  const nextRow = flattenedData[i + 1];
                  return !nextRow || nextRow._level < rowLevel;
                };

                return (
                  <React.Fragment key={`${rowId}-${i}`}>
                    <TableRow
                      key={`${rowId}-${i}`}
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
                        ...(!parentBorder && rowLevel === 0
                          ? {
                              '& .MuiTableCell-root': {
                                border: 'none !important',
                                borderBottom: isExpanded
                                  ? '1px solid #CBD6E2 !important'
                                  : 'none',
                              },
                            }
                          : {}),
                      }}
                    >
                      {/* Row checkbox */}
                      {selectable && (
                        <TableCell
                          sx={{
                            position: 'sticky',
                            left: 0,
                            background:
                              expandable && isExpanded ? '#ECECEC' : '#fff',
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
                              onChange={() => handleRowSelect(rowId, row)}
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

                        const isFirstDataColumn = column.id === columns[0].id;
                        const isChildRows = isFirstDataColumn && rowLevel !== 0;

                        return (
                          <TableCell
                            key={`${rowId}-${column.id}`}
                            data-editing={
                              isEditing ? `${rowId}-${column.id}` : undefined
                            }
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
                              outline:
                                isEditing && column.field?.type !== 'textarea'
                                  ? `1px solid ${
                                      editingCell.error ? '#ef4444' : '#60A5FA'
                                    }`
                                  : undefined,

                              outlineOffset: isEditing ? '-1px' : undefined,
                              ...(isEditing &&
                                editingCell.error && {
                                  backgroundColor: '#FEF2F2 !important',
                                }),
                              background:
                                expandable && isExpanded ? '#ECECEC' : '#fff',
                            }}
                            className={`${
                              hoverHighlight &&
                              component !== 'account' &&
                              (isStatus
                                ? `${statusValue === 'Active' ? 'group-hover:!text-[#199806]' : 'group-hover:!text-[#f44336]'}`
                                : 'group-hover:!text-[#1755E7]')
                            } cursor-context-menu`}
                            onDoubleClick={() => {
                              if (editDisableLevel?.includes(row._level)) {
                                return;
                              }
                              if (!column.editable) return;
                              if (
                                editingCell &&
                                editingCell.value !== editingCell.originalValue
                              ) {
                                return;
                              }
                              const editingValue = getEditingCellValue(
                                row,
                                column
                              );
                              setEditingCell({
                                rowId,
                                columnId,
                                value: editingValue,
                                originalValue: editingValue,
                                error: null,
                              });
                            }}
                          >
                            {isEditing ? (
                              <div className='box-border !h-[31px] !max-h-[31px] relative'>
                                {renderFields({
                                  column,
                                  editingCell,
                                  handleValueChange,
                                  handleKeyDown,
                                  isSaving,
                                })}

                                {editingCell.error &&
                                  column.field?.type !== 'select' && (
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
                                      <span className='h-[26px] w-5 flex items-center justify-center absolute top-[3px] bg-[#FEF2F2] right-[2px] cursor-pointer'>
                                        <ErrorInfoIcon
                                          alt='error'
                                          className='w-5 h-3.5'
                                        />
                                      </span>
                                    </Tooltip>
                                  )}
                              </div>
                            ) : (
                              <div
                                className={
                                  isChildRows
                                    ? `flex items-center gap-1 ${rowLevel === 2 ? 'ml-[32px]' : 'ml-[15px]'}`
                                    : isFirstDataColumn
                                      ? 'flex'
                                      : ''
                                }
                              >
                                {expandable &&
                                  isFirstDataColumn &&
                                  renderExpandIcon(row, rowId)}
                                {isChildRows && (
                                  <div className='flex items-center justify-center w-[18px] h-[17px] bg-[#425A76] rounded-[4px]'>
                                    <ChildAccountIcon
                                      alt='childAccountIcon'
                                      className='w-[9px] h-[10px]'
                                    />
                                  </div>
                                )}
                                <TruncateWithTooltip
                                  maxWidth={Number(column.width)}
                                  className={
                                    component === 'account' &&
                                    rowLevel === 0 &&
                                    expandable &&
                                    isFirstDataColumn
                                      ? `inline-flex items-center rounded-[4px] !text-[14px] px-2 h-[26px] !font-semibold cursor-pointer group-hover:underline`
                                      : ''
                                  }
                                  style={
                                    component === 'account' &&
                                    rowLevel === 0 &&
                                    expandable &&
                                    isFirstDataColumn
                                      ? {
                                          background: `linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7)), ${row?.bgColor}`,
                                          color: row?.color as
                                            | string
                                            | undefined,
                                        }
                                      : undefined
                                  }
                                >
                                  {displayValue as React.ReactNode}
                                </TruncateWithTooltip>
                              </div>
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
                            background:
                              expandable && isExpanded ? '#ECECEC' : '#fff',
                          }}
                        >
                          {conditionItems.length > 0 ? (
                            <Box className='w-full inline-flex items-center gap-2'>
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
                              background:
                                expandable && isExpanded ? '#ECECEC' : '#fff',
                            }}
                          >
                            {editDisableLevel?.includes(row._level) ? (
                              <span className='w-full flex items-center justify-center'>
                                -
                              </span>
                            ) : (
                              <>
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
                              </>
                            )}
                          </TableCell>
                        )}
                    </TableRow>
                    {component === 'account' &&
                      rowLevel > 0 &&
                      isLastChildInGroup() && (
                        <TableRow
                          sx={{
                            '& .MuiTableCell-root': {
                              border: 'none !important',
                              height: '6px !important',
                              padding: 0,
                            },
                          }}
                        >
                          <TableCell
                            colSpan={
                              columns.length +
                              (selectable ? 1 : 0) +
                              (actionMenuItems?.length > 0 ? 1 : 0) +
                              (conditionMenuItems ? 1 : 0)
                            }
                          />
                        </TableRow>
                      )}
                    {component === 'account' &&
                      !parentBorder &&
                      rowLevel === 0 &&
                      !isExpanded && (
                        <TableRow
                          sx={{
                            '& .MuiTableCell-root': {
                              border: 'none !important',
                              height: '6px !important',
                              padding: 0,
                            },
                          }}
                        >
                          <TableCell
                            colSpan={
                              columns.length +
                              (selectable ? 1 : 0) +
                              (actionMenuItems?.length > 0 ? 1 : 0) +
                              (conditionMenuItems ? 1 : 0)
                            }
                          />
                        </TableRow>
                      )}
                  </React.Fragment>
                );
              })}

            {!loading && !error && flattenedData.length > 0 && (
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
        (loading || error || flattenedData.length > 0) && (
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
