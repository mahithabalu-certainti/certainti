/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useEffect } from 'react';
import {
  Popover,
  Switch,
  FormControlLabel,
  Typography,
  Box,
  IconButton,
  Divider,
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

// Generic column interface that works with any table column type
export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

// Generic table column interface
interface BaseTableColumn {
  id: string;
  label: string;
  hide?: boolean;
  [key: string]: any;
}

interface SortableItemProps {
  id: string;
  column: ColumnConfig;
  onToggle: (id: string, visible: boolean) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  column,
  onToggle,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-2 bg-white border border-gray-200 rounded mb-1 ${
        isDragging ? 'shadow-lg' : 'hover:bg-gray-50'
      }`}
    >
      <div className='flex items-center flex-1'>
        <div
          {...attributes}
          {...listeners}
          className='cursor-grab active:cursor-grabbing mr-2 text-gray-400 hover:text-gray-600'
        >
          {/* <DragIndicator fontSize='small' /> */}☰
        </div>
        <Typography variant='body2' className='flex-1 text-sm text-gray-700'>
          {column.label}
        </Typography>
      </div>
      <FormControlLabel
        control={
          <Switch
            checked={column.visible}
            onChange={(e) => onToggle(id, e.target.checked)}
            size='small'
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#1976d2',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#1976d2',
              },
            }}
          />
        }
        label=''
        sx={{ margin: 0 }}
      />
    </div>
  );
};

interface ColumnVisibilityPopoverProps<T extends BaseTableColumn> {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  columns: T[];
  onColumnsChange: (columns: T[]) => void;
  storageKey?: string;
}

export const ColumnVisibilityPopover = <T extends BaseTableColumn>({
  anchorEl,
  open,
  onClose,
  columns,
  onColumnsChange,
  storageKey = 'table-column-visibility',
}: ColumnVisibilityPopoverProps<T>) => {
  // Initialize column configs from localStorage or default
  const initializeColumnConfigs = useCallback((): ColumnConfig[] => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const storedConfigs: ColumnConfig[] = JSON.parse(stored);

        // Merge with current columns to handle new/removed columns
        const configMap = new Map(
          storedConfigs.map((config) => [config.id, config])
        );

        return columns
          .map((col, index) => {
            const storedConfig = configMap.get(col.id);
            return {
              id: col.id,
              label: col.label,
              visible: storedConfig?.visible ?? !col.hide,
              order: storedConfig?.order ?? index,
            };
          })
          .sort((a, b) => a.order - b.order);
      }
    } catch (error) {
      console.warn(
        'Failed to load column visibility from localStorage:',
        error
      );
    }

    // Default configuration
    return columns.map((col, index) => ({
      id: col.id,
      label: col.label,
      visible: !col.hide,
      order: index,
    }));
  }, [columns, storageKey]);

  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(
    initializeColumnConfigs
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update column configs when columns prop changes
  useEffect(() => {
    setColumnConfigs(initializeColumnConfigs());
  }, [initializeColumnConfigs]);

  // Save to localStorage and update parent whenever configs change
  const updateColumnConfigs = useCallback(
    (configs: ColumnConfig[]) => {
      setColumnConfigs(configs);

      try {
        localStorage.setItem(storageKey, JSON.stringify(configs));
      } catch (error) {
        console.warn(
          'Failed to save column visibility to localStorage:',
          error
        );
      }

      // Generate updated columns based on current configuration
      const configMap = new Map(configs.map((config) => [config.id, config]));

      const updatedColumns = columns
        .map((col) => ({
          ...col,
          hide: !(configMap.get(col.id)?.visible ?? !col.hide),
        }))
        .sort((a, b) => {
          const orderA = configMap.get(a.id)?.order ?? 0;
          const orderB = configMap.get(b.id)?.order ?? 0;
          return orderA - orderB;
        });

      onColumnsChange(updatedColumns);
    },
    [columns, onColumnsChange, storageKey]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = columnConfigs.findIndex((col) => col.id === active.id);
      const newIndex = columnConfigs.findIndex((col) => col.id === over.id);

      const newColumns = arrayMove(columnConfigs, oldIndex, newIndex).map(
        (col, index) => ({
          ...col,
          order: index,
        })
      );

      updateColumnConfigs(newColumns);
    }
  };

  const handleToggle = (id: string, visible: boolean) => {
    const newColumns = columnConfigs.map((col) =>
      col.id === id ? { ...col, visible } : col
    );
    updateColumnConfigs(newColumns);
  };

  const handleSelectAll = () => {
    const newColumns = columnConfigs.map((col) => ({ ...col, visible: true }));
    updateColumnConfigs(newColumns);
  };

  const handleDeselectAll = () => {
    const newColumns = columnConfigs.map((col) => ({ ...col, visible: false }));
    updateColumnConfigs(newColumns);
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      PaperProps={{
        sx: {
          width: 320,
          maxHeight: 500,
          overflow: 'hidden',
        },
      }}
    >
      <Box className='p-4'>
        {/* Header */}
        <div className='flex items-center justify-between mb-3'>
          <Typography variant='h6' className='text-gray-800 font-semibold'>
            Show/Hide Fields
          </Typography>
          <IconButton
            onClick={onClose}
            size='small'
            className='text-gray-500 hover:text-gray-700'
          >
            {/* <CloseIcon fontSize='small' /> */}X
          </IconButton>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-2 mb-3'>
          <button
            onClick={handleSelectAll}
            className='px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors'
          >
            Show All
          </button>
          <button
            onClick={handleDeselectAll}
            className='px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors'
          >
            Hide All
          </button>
        </div>

        <Divider className='mb-3' />

        {/* Drag and Drop List */}
        <div className='max-h-80 overflow-y-auto'>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columnConfigs.map((col) => col.id)}
              strategy={verticalListSortingStrategy}
            >
              {columnConfigs.map((column) => (
                <SortableItem
                  key={column.id}
                  id={column.id}
                  column={column}
                  onToggle={handleToggle}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Footer Info */}
        <div className='mt-3 pt-3 border-t border-gray-200'>
          <Typography variant='caption' className='text-gray-500'>
            Drag items to reorder columns • Toggle switches to show/hide
          </Typography>
        </div>
      </Box>
    </Popover>
  );
};
