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
  ExpandedState,
  ListTableProps,
  RowData,
  SortOrder,
  MultipleEditingCells,
  FieldChangeEvent,
  CellEditData,
  ModalState,
  FieldChangeValue,
  DependencyRowData,
  ListTableColumn,
} from './types';
import { getEditingCellValue, renderFields } from './table-utils';
import {
  shouldEnableMultipleEdit,
  validateDependentFields,
  getFieldsToReset,
  shouldShowModalForValue,
  getDependentValue,
} from './dependency-utils';
import ModalDialog from './modal-dialog';
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
  onFieldChange,
  // Expansion
  expandAllParent = false,
  expandAllChild = false,
  skillTypeIds,
}: ListTableProps<T>) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCells, setEditingCells] = useState<MultipleEditingCells>({});
  const [isSaving, setIsSaving] = useState(false);
  const [expandedRows, setExpandedRows] = useState<ExpandedState>({});
  const [modalState, setModalState] = useState<ModalState>({
    open: false,
    fields: [],
    rowId: '',
    columnId: '',
    skillTypeIsOthers: false,
    skillSubtypeIsOthers: false,
    anchorEl: null,
  });

  const visibleColumns = useMemo(
    () => columns.filter((column) => !column.hide),
    [columns]
  );

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
    if (Object.keys(editingCells).length === 0 || !onCellEdit) return;

    // Get the row data for validation
    const firstEditingCell = Object.values(editingCells)[0];
    const rowData = flattenedData.find(
      (row) => getRowId(row) === firstEditingCell.rowId
    );

    if (!rowData) return;

    // Validate all editing cells
    const errors = validateDependentFields(
      visibleColumns,
      rowData,
      editingCells
    );

    if (Object.keys(errors).length > 0) {
      // Update editing cells with errors
      setEditingCells((prev) => {
        const updated = { ...prev };
        Object.keys(errors).forEach((cellKey) => {
          if (updated[cellKey]) {
            updated[cellKey].error = errors[cellKey];
          }
        });
        return updated;
      });
      return;
    }

    // Check if any values actually changed
    const changedCells = Object.values(editingCells).filter(
      (cell) => cell.originalValue !== cell.value
    );

    if (changedCells.length === 0) {
      handleCancel();
      return;
    }
    setIsSaving(true);
    try {
      const updates: CellEditData[] = changedCells.map((cell) => ({
        columnId: cell.columnId,
        value: cell.value,
      }));

      await onCellEdit(firstEditingCell.rowId, updates);
      setEditingCells({});
    } catch (error) {
      console.error('Error saving cell value:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingCells({});
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter') {
      handleSave();
    }
  };

  useEffect(() => {
    if (Object.keys(editingCells).length === 0) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // If modal is open, do nothing
      if (modalState.open) return;
      // Skip if clicking on any picker elements
      const isPickerElement = target.closest(
        '.MuiPickersPopper-root, .MuiDialog-root, .MuiCalendarOrClockPicker-root, .MuiPaper-root, .MuiPopover-root'
      );

      if (isPickerElement) return;

      // Check if clicking on any editing cell
      const isEditingCell = Object.keys(editingCells).some((cellKey) => {
        const cell = editingCells[cellKey];
        return target.closest(
          `[data-editing="${cell.rowId}-${cell.columnId}"]`
        );
      });

      if (!isEditingCell) {
        handleSave();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingCells, modalState.open]);

  const handleValueChange = async (cellKey: string, value: string | number) => {
    setEditingCells((prev) => {
      const updated = { ...prev };
      const cell = updated[cellKey];

      if (!cell) return prev;

      // Get the column for this cell
      const column = visibleColumns.find((col) => col.id === cell.columnId);
      if (!column) return prev;

      const oldValue = cell.value;
      const rowData = flattenedData.find((row) => getRowId(row) === cell.rowId);

      // Update the current cell value
      updated[cellKey] = {
        ...cell,
        value,
        error: null,
      };

      // Check if this value change should trigger a modal
      const modalCheck = shouldShowModalForValue(
        column,
        value,
        rowData,
        updated
      );
      if (modalCheck.shouldShow && modalCheck.modalFields) {
        // For skill type/subtype, determine which fields to show in modal
        let skillTypeIsOthers = false;
        let skillSubtypeIsOthers = false;

        if (
          cell.columnId === 'skill_type_name' ||
          cell.columnId === 'skill_subtype_name'
        ) {
          // Get current values for both fields from updated editing cells
          const currentSkillType =
            cell.columnId === 'skill_type_name'
              ? value
              : getDependentValue('skill_type_name', rowData || {}, updated);
          const currentSkillSubtype =
            cell.columnId === 'skill_subtype_name'
              ? value
              : getDependentValue('skill_subtype_name', rowData || {}, updated);

          skillTypeIsOthers =
            currentSkillType === skillTypeIds?.othersSkillTypeId;
          skillSubtypeIsOthers =
            currentSkillSubtype === skillTypeIds?.othersSkillSubTypeId;
        }

        const anchorEl = document.querySelector(`[data-editing="${cellKey}"]`);

        setModalState({
          open: true,
          fields: modalCheck.modalFields,
          rowId: cell.rowId,
          columnId: cell.columnId,
          skillTypeIsOthers,
          skillSubtypeIsOthers,
          anchorEl: anchorEl as HTMLElement,
        });

        return updated;
      } else {
        // If there was a modal open and this change does NOT require modal, close/reset it
        if (modalState.open) {
          setModalState({
            open: false,
            fields: [],
            rowId: '',
            columnId: '',
            skillTypeIsOthers: false,
            skillSubtypeIsOthers: false,
            anchorEl: null,
          });
        }
      }

      // Get fields that should be reset due to this change
      const fieldsToReset = getFieldsToReset(
        visibleColumns,
        cell.columnId,
        value,
        oldValue
      );

      // Reset dependent fields
      fieldsToReset.forEach((fieldId) => {
        const resetCellKey = Object.keys(updated).find(
          (key) =>
            updated[key].columnId === fieldId &&
            updated[key].rowId === cell.rowId
        );
        if (resetCellKey) {
          updated[resetCellKey] = {
            ...updated[resetCellKey],
            value: '',
            error: null,
          };
        }
      });

      return updated;
    });

    // Trigger onChange callback if configured
    const column = visibleColumns.find(
      (col) => col.id === editingCells[cellKey]?.columnId
    );
    if (column?.field?.onChange && onFieldChange) {
      const rowData = flattenedData.find(
        (row) => getRowId(row) === editingCells[cellKey]?.rowId
      );
      if (rowData) {
        const changeEvent: FieldChangeEvent = {
          rowId: editingCells[cellKey].rowId,
          columnId: editingCells[cellKey].columnId,
          value: value as FieldChangeValue,
          oldValue: editingCells[cellKey].value as FieldChangeValue,
          rowData: rowData as DependencyRowData,
        };

        try {
          await onFieldChange(changeEvent);
        } catch (error) {
          console.error('Error in field change callback:', error);
        }
      }
    }
  };

  const handleModalSubmit = async (
    modalData: Record<string, FieldChangeValue>
  ) => {
    if (!onCellEdit) return;

    setIsSaving(true);
    try {
      const cellKey = `${modalState.rowId}-${modalState.columnId}`;
      const currentCell = editingCells[cellKey];

      if (!currentCell) {
        throw new Error('Editing cell not found');
      }

      const updates: CellEditData[] = [
        {
          columnId: modalState.columnId,
          value: currentCell.value, // The selected dropdown value
          modalData: modalData, // The additional form data
        },
      ];
      // Add modal data fields as separate entries
      Object.entries(modalData).forEach(([columnId, value]) => {
        updates.push({
          columnId,
          value,
        });
      });

      // Include other cell edits if needed
      Object.entries(editingCells).forEach(([key, cell]) => {
        if (key !== cellKey && key.startsWith(`${modalState.rowId}-`)) {
          updates.push({
            columnId: cell.columnId,
            value: cell.value,
          });
        }
      });

      await onCellEdit(modalState.rowId, updates);
      setModalState((prev) => ({ ...prev, open: false }));
      setEditingCells({});
    } catch (error) {
      console.error('Error submitting modal data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCellDoubleClick = (
    rowId: string,
    column: ListTableColumn<T>,
    row: T & { _level: number; _type: string },
    editingCells: MultipleEditingCells,
    cellKey: string
  ) => {
    if (editDisableLevel?.includes(row._level)) {
      return;
    }
    if (!column.editable) return;
    if (Object.keys(editingCells).length > 0) {
      return;
    }

    // Determine which fields to enable for editing
    const fieldsToEdit = shouldEnableMultipleEdit(visibleColumns, column.id);
    const newEditingCells: MultipleEditingCells = {};

    fieldsToEdit.forEach((fieldId) => {
      const targetColumn = visibleColumns.find((col) => col.id === fieldId);
      if (targetColumn?.editable) {
        let editingValue: string | number;

        if (targetColumn.field?.getFieldData) {
          const value = targetColumn.field.getFieldData(row, fieldId);
          if (value !== undefined && value !== '') {
            editingValue = value;
          } else {
            editingValue = getEditingCellValue(row, targetColumn);
          }
        } else {
          editingValue = getEditingCellValue(row, targetColumn);
        }
        const key = `${rowId}-${fieldId}`;
        // Check if modal should open for this initial value
        const modalCheck = shouldShowModalForValue(
          targetColumn,
          editingValue,
          row,
          newEditingCells
        );
        if (modalCheck.shouldShow && modalCheck.modalFields) {
          let skillTypeIsOthers = false;
          let skillSubtypeIsOthers = false;

          if (
            targetColumn.id === 'skill_type_name' ||
            targetColumn.id === 'skill_subtype_name'
          ) {
            const currentSkillType =
              targetColumn.id === 'skill_type_name'
                ? editingValue
                : getDependentValue('skill_type_name', row, newEditingCells);

            const currentSkillSubtype =
              targetColumn.id === 'skill_subtype_name'
                ? editingValue
                : getDependentValue('skill_subtype_name', row, newEditingCells);

            skillTypeIsOthers =
              currentSkillType === skillTypeIds?.othersSkillTypeId;
            skillSubtypeIsOthers =
              currentSkillSubtype === skillTypeIds?.othersSkillSubTypeId;
          }
          const anchorEl = document.querySelector(
            `[data-editing="${cellKey}"]`
          );

          setModalState({
            open: true,
            fields: modalCheck.modalFields || [],
            rowId: rowId,
            columnId: targetColumn.id,
            skillTypeIsOthers,
            skillSubtypeIsOthers,
            anchorEl: anchorEl as HTMLElement,
          });
        }
        newEditingCells[key] = {
          rowId,
          columnId: fieldId,
          value: editingValue,
          originalValue: editingValue,
          error: null,
          isDependent: fieldId !== column.id,
        };
      }
    });

    setEditingCells(newEditingCells);
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

              {visibleColumns.map((column) =>
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
                columnsCount={
                  visibleColumns.length + (conditionMenuItems ? 1 : 0)
                }
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
                    visibleColumns.length +
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
                    visibleColumns.length +
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
                      {visibleColumns.map((column) => {
                        const cellKey = `${rowId}-${column.id}`;
                        const isEditing = editingCells[cellKey];
                        // const columnId = column.id;
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

                        const isFirstDataColumn =
                          column.id === visibleColumns[0].id;
                        const isChildRows = isFirstDataColumn && rowLevel !== 0;

                        return (
                          <TableCell
                            key={`${rowId}-${column.id}`}
                            data-editing={`${rowId}-${column.id}`}
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
                                      isEditing.error ? '#ef4444' : '#60A5FA'
                                    }`
                                  : undefined,

                              outlineOffset: isEditing ? '-1px' : undefined,
                              ...(isEditing &&
                                isEditing.error && {
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
                              handleCellDoubleClick(
                                rowId,
                                column,
                                row,
                                editingCells,
                                cellKey
                              );
                            }}
                          >
                            {isEditing ? (
                              <div className='box-border !h-[31px] !max-h-[31px] relative'>
                                {renderFields({
                                  column,
                                  editingCell: isEditing,
                                  handleValueChange: (value) =>
                                    handleValueChange(cellKey, value),
                                  handleKeyDown,
                                  isSaving,
                                  rowData: row,
                                  allEditingCells: editingCells,
                                })}

                                {isEditing.error && (
                                  <Tooltip
                                    title={isEditing.error}
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
                                    <span
                                      className={`h-[26px] w-6 flex items-center justify-center absolute ${column?.field?.type === 'textarea' ? '-top-[3px] bg-[#FEF2F2] right-[1px] z-40' : 'top-[3px] right-0'} cursor-pointer`}
                                    >
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
                              visibleColumns.length +
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
                              visibleColumns.length +
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
                    visibleColumns.length +
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

      {/* Modal Dialog */}
      <ModalDialog
        open={modalState.open}
        fields={modalState.fields}
        onClose={() => {
          setModalState((prev) => ({ ...prev, open: false }));
          handleCancel();
        }}
        onSubmit={handleModalSubmit}
        loading={isSaving}
        skillTypeIsOthers={modalState.skillTypeIsOthers}
        skillSubtypeIsOthers={modalState.skillSubtypeIsOthers}
        anchorEl={modalState.anchorEl}
      />

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
