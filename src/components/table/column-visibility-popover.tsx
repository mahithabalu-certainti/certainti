/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useEffect } from 'react';
import {
  Popover,
  Switch,
  FormControlLabel,
  Typography,
  Box,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CloseIcon } from '../../assets';

// Generic column interface
export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

export interface ColumnRestriction {
  id: string;
  canHide?: boolean;
  canDrag?: boolean;
  tooltip?: string;
}

interface BaseTableColumn {
  id: string;
  label: string;
  hide?: boolean;
  [key: string]: any;
}

interface SortableItemProps {
  id: string;
  column: ColumnConfig;
  restriction?: ColumnRestriction;
  onToggle: (id: string, visible: boolean) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  column,
  restriction,
  onToggle,
}) => {
  const canDrag = restriction?.canDrag !== false;
  const canHide = restriction?.canHide !== false;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !canDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (canHide) {
      onToggle(id, e.target.checked);
    }
  };

  const dragListeners = canDrag
    ? {
        ...listeners,
        onPointerDown: (e: React.PointerEvent) => {
          const toggleArea = (e.target as Element).closest('.toggle-area');
          if (toggleArea) return;
          listeners?.onPointerDown?.(e);
        },
      }
    : {};

  const itemContent = (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...dragListeners}
      className={`flex items-center justify-between p-2 bg-white border border-gray-200 rounded mb-1 ${
        canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      } ${isDragging ? 'shadow-lg' : 'hover:bg-gray-50'} ${
        !canDrag || !canHide ? 'bg-gray-50 border-gray-300' : ''
      }`}
    >
      <div className='flex items-center flex-1'>
        <div className={`mr-2 ${canDrag ? 'text-gray-400' : 'text-gray-300'}`}>
          {'☰'}
        </div>
        <Typography
          variant='body2'
          className={`flex-1 text-sm ${
            !canDrag || !canHide ? 'text-gray-500 font-medium' : 'text-gray-700'
          }`}
        >
          {column.label}
        </Typography>
      </div>
      <div className='toggle-area cursor-default p-2 -m-2'>
        <FormControlLabel
          control={
            <Switch
              checked={column.visible}
              onChange={handleToggleChange}
              disabled={!canHide}
              size='small'
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: canHide ? '#1976d2' : '#9e9e9e',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: canHide ? '#1976d2' : '#9e9e9e',
                },
                '& .MuiSwitch-switchBase.Mui-disabled': {
                  color: '#bdbdbd',
                },
                '& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track': {
                  backgroundColor: '#e0e0e0',
                },
              }}
            />
          }
          label=''
          sx={{ margin: 0 }}
        />
      </div>
    </div>
  );

  if ((!canDrag || !canHide) && restriction?.tooltip) {
    return (
      <Tooltip title={restriction.tooltip} placement='left'>
        {itemContent}
      </Tooltip>
    );
  }

  return itemContent;
};

interface ColumnVisibilityPopoverProps<T extends BaseTableColumn> {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  columns: T[];
  onColumnsChange: (columns: T[]) => void;
  initialConfigs?: ColumnConfig[];
  columnRestrictions?: ColumnRestriction[];
}

export const ColumnVisibilityPopover = <T extends BaseTableColumn>({
  anchorEl,
  open,
  onClose,
  columns,
  onColumnsChange,
  initialConfigs,
  columnRestrictions = [],
}: ColumnVisibilityPopoverProps<T>) => {
  const restrictionMap = new Map(
    columnRestrictions.map((restriction) => [
      String(restriction.id),
      restriction,
    ])
  );

  const initializeColumnConfigs = useCallback((): ColumnConfig[] => {
    if (initialConfigs && initialConfigs.length > 0) {
      const configMap = new Map(
        initialConfigs.map((config) => [String(config.id), config])
      );

      return columns
        .map((col, index) => {
          const storedConfig = configMap.get(String(col.id));
          const restriction = restrictionMap.get(String(col.id));
          const defaultVisible = !col.hide;
          const visible =
            restriction?.canHide === false
              ? true
              : (storedConfig?.visible ?? defaultVisible);

          return {
            id: String(col.id),
            label: col.label,
            visible,
            order: storedConfig?.order ?? index,
          };
        })
        .sort((a, b) => a.order - b.order);
    }

    return columns.map((col, index) => {
      const restriction = restrictionMap.get(String(col.id));
      const defaultVisible = !col.hide;
      const visible = restriction?.canHide === false ? true : defaultVisible;

      return {
        id: String(col.id),
        label: col.label,
        visible,
        order: index,
      };
    });
  }, [columns, initialConfigs, restrictionMap]);

  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(() =>
    initializeColumnConfigs()
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const currentColumnIds = columns.map((col) => String(col.id));
    const configColumnIds = columnConfigs.map((config) => config.id);

    const columnsChanged =
      currentColumnIds.length !== configColumnIds.length ||
      !currentColumnIds.every((id) => configColumnIds.includes(id));

    if (columnsChanged) {
      const newConfigs = initializeColumnConfigs();
      setColumnConfigs(newConfigs);
    }
  }, [columns]);

  const updateColumnConfigs = useCallback(
    (configs: ColumnConfig[]) => {
      setColumnConfigs(configs);

      const configMap = new Map(configs.map((config) => [config.id, config]));

      const updatedColumns = columns
        .map((col) => {
          const config = configMap.get(String(col.id));
          const restriction = restrictionMap.get(String(col.id));

          let hide = !(config?.visible ?? !col.hide);
          if (restriction?.canHide === false) hide = false;

          return {
            ...col,
            hide,
          };
        })
        .sort((a, b) => {
          const orderA = configMap.get(String(a.id))?.order ?? 0;
          const orderB = configMap.get(String(b.id))?.order ?? 0;
          return orderA - orderB;
        });

      onColumnsChange(updatedColumns);
    },
    [columns, onColumnsChange, restrictionMap]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;

    if (!overId || activeId === overId) return;

    const overRestriction = restrictionMap.get(overId);
    const activeRestriction = restrictionMap.get(activeId);

    if (
      overRestriction?.canDrag === false ||
      activeRestriction?.canDrag === false
    ) {
      return;
    }

    const oldIndex = columnConfigs.findIndex((col) => col.id === activeId);
    const newIndex = columnConfigs.findIndex((col) => col.id === overId);

    const newColumns = arrayMove(columnConfigs, oldIndex, newIndex).map(
      (col, index) => ({
        ...col,
        order: index,
      })
    );

    updateColumnConfigs(newColumns);
  };

  const handleToggle = (id: string, visible: boolean) => {
    const restriction = restrictionMap.get(id);
    if (restriction?.canHide === false) return;

    const newColumns = columnConfigs.map((col) =>
      col.id === id ? { ...col, visible } : col
    );
    updateColumnConfigs(newColumns);
  };

  const sortableItems = columnConfigs.filter(
    (col) => restrictionMap.get(col.id)?.canDrag !== false
  );

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      PaperProps={{ sx: { width: 320, maxHeight: 500, overflow: 'hidden' } }}
    >
      <Box className='p-4'>
        <div className='flex items-center justify-between mb-3'>
          <Typography variant='h6' className='text-gray-800 font-semibold'>
            Show/Hide Fields
          </Typography>
          <div
            onClick={onClose}
            className='border text-gray-500 rounded-full p-1 cursor-pointer transition-colors group'
            role='button'
            tabIndex={0}
            aria-label='Close'
          >
            <CloseIcon
              size='small'
              className='text-gray-500 group-hover:text-gray-700 h-2 w-2'
            />
          </div>
        </div>

        <Divider className='mb-3' />

        <div className='max-h-80 overflow-y-auto'>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortableItems.map((col) => col.id)}
              strategy={verticalListSortingStrategy}
            >
              {columnConfigs.map((column) => (
                <SortableItem
                  key={column.id}
                  id={column.id}
                  column={column}
                  restriction={restrictionMap.get(column.id)}
                  onToggle={handleToggle}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className='mt-3 pt-3 border-t border-gray-200'>
          <Typography variant='caption' className='text-gray-500'>
            Drag items to reorder columns • Toggle switches to show/hide
          </Typography>
        </div>
      </Box>
    </Popover>
  );
};
