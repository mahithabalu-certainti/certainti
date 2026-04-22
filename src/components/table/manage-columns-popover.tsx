import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Popover,
  Switch,
  FormControlLabel,
  Typography,
  Tooltip,
  TextField,
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
import {
  ManageColumnsPopoverProps,
  ShowHideColumnConfig,
  ShowHideSortableItemProps,
  ShowHideTableColumn,
} from './types';

const SortableItem: React.FC<ShowHideSortableItemProps> = ({
  id,
  column,
  restriction,
  onToggle,
  disableDrag = false,
}) => {
  const canDrag = restriction?.canDrag !== false && !disableDrag;
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
    opacity: isDragging ? 0.7 : 1,
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
      className={`flex items-center justify-between p-2 bg-white border border-[#CBD6E2] rounded mb-1 ${
        canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      } ${isDragging ? 'shadow-lg' : 'hover:bg-gray-50'} ${
        !canDrag || !canHide ? 'bg-gray-50' : 'bg-white'
      }`}
    >
      <div className='flex items-center flex-1 gap-2'>
        <div className={`pl-1 ${canDrag ? 'text-[#425A76]' : 'text-gray-400'}`}>
          {'☰'}
        </div>
        <Typography
          variant='body2'
          className={`flex-1 text-sm ${
            !canDrag || !canHide
              ? 'text-gray-400'
              : 'text-[#425A76] font-medium'
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
                  color: canHide ? '#2e7d32' : '#9e9e9e',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: canHide ? '#2e7d32' : '#9e9e9e',
                },
                '& .MuiSwitch-switchBase.Mui-disabled': {
                  color: '#bdbdbd',
                },
                '& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track': {
                  backgroundColor: '#212121',
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
      <Tooltip title={restriction.tooltip} placement='left' arrow>
        {itemContent}
      </Tooltip>
    );
  }

  return itemContent;
};

const ManageColumnsPopover = <T extends ShowHideTableColumn>({
  anchorEl,
  open,
  popoverId,
  onClose,
  columns,
  onColumnsChange,
  initialConfigs,
  columnRestrictions = [],
}: ManageColumnsPopoverProps<T>) => {
  const visibleColumns = useMemo(
    () => columns.filter((column) => !column.hide),
    [columns]
  );
  const restrictionMap = useMemo(
    () =>
      new Map(
        columnRestrictions.map((restriction) => [
          String(restriction.id),
          restriction,
        ])
      ),
    [columnRestrictions]
  );

  const initializeColumnConfigs = useCallback((): ShowHideColumnConfig[] => {
    if (initialConfigs && initialConfigs.length > 0) {
      const configMap = new Map(
        initialConfigs.map((config) => [String(config.id), config])
      );

      return visibleColumns
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

    return visibleColumns.map((col, index) => {
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
  }, [visibleColumns, initialConfigs, restrictionMap]);

  const [columnConfigs, setColumnConfigs] = useState<ShowHideColumnConfig[]>(
    () => initializeColumnConfigs()
  );

  const [searchTerm, setSearchTerm] = useState('');

  const filteredColumns = useMemo(() => {
    if (!searchTerm.trim()) return columnConfigs;
    return columnConfigs.filter((col) =>
      col.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, columnConfigs]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const currentColumnIds = visibleColumns.map((col) => String(col.id));
    const configColumnIds = columnConfigs.map((config) => config.id);

    const columnsChanged =
      currentColumnIds.length !== configColumnIds.length ||
      !currentColumnIds.every((id) => configColumnIds.includes(id));

    if (columnsChanged) {
      const newConfigs = initializeColumnConfigs();
      setColumnConfigs(newConfigs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleColumns]);

  const updateColumnConfigs = useCallback(
    (configs: ShowHideColumnConfig[]) => {
      setColumnConfigs(configs);

      const configMap = new Map(configs.map((config) => [config.id, config]));

      const updatedColumns = visibleColumns
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
    [visibleColumns, onColumnsChange, restrictionMap]
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

  const handleSelectAll = () => {
    const newColumns = columnConfigs.map((col) => ({ ...col, visible: true }));
    updateColumnConfigs(newColumns);
  };

  return (
    <Popover
      id={popoverId}
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          boxShadow: '0px 4px 15px 11px #0000001A',
          bgcolor: 'transparent',
          mt: 0.5,
          borderRadius: '8px',
          border: '1px solid #CBD6E2',
        },
      }}
    >
      <div className='p-4 bg-white man-h-[500px] w-[320px] min-w-[320px] max-w-[320px] overflow-hidden'>
        <div className='flex items-center justify-between mb-3'>
          <h2 className='text-lg font-semibold'> Show/Hide Fields</h2>
          <button
            role='button'
            onClick={onClose}
            className='cursor-pointer hover:bg-gray-200 p-2 rounded-full'
          >
            <React.Suspense fallback={null}>
              <CloseIcon />
            </React.Suspense>
          </button>
        </div>
        <div className='flex items-center justify-between gap-3 pb-2 mb-2 border-b border-[#CBD6E2]'>
          <TextField
            size='small'
            placeholder='Search fields...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '2px',
                '& fieldset': {
                  border: '1px solid #CBD6E2',
                },
                '&:hover fieldset': {
                  border: '1px solid #CBD6E2',
                },
                '&.Mui-focused fieldset': {
                  border: '1px solid #60A5FA',
                },
              },
              '& .MuiInputBase-input': {
                fontSize: '12px',
                color: '#425A76',
                height: '11px',
                width: '150px',
              },
            }}
          />
          <div className='flex items-center w-[150px]'>
            <h2 className='text-[13px] font-semibold text-[#2D3E4F]'>
              Show All
            </h2>
            <Switch
              checked={columnConfigs.every((col) => col.visible)}
              // disabled={columnConfigs.every((col) => col.visible)}
              onChange={(e) => {
                if (!columnConfigs.every((col) => col.visible)) {
                  if (e.target.checked) {
                    handleSelectAll();
                  }
                }
              }}
              size='small'
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#2e7d32',
                  cursor: columnConfigs.every((col) => col.visible)
                    ? 'default'
                    : 'pointer',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#2e7d32',
                },
              }}
            />
          </div>
        </div>

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
              {filteredColumns.length > 0 ? (
                filteredColumns.map((column) => (
                  <SortableItem
                    key={column.id}
                    id={column.id}
                    column={column}
                    restriction={restrictionMap.get(column.id)}
                    onToggle={handleToggle}
                    disableDrag={!!searchTerm}
                  />
                ))
              ) : (
                <div className='flex items-center justify-center py-4'>
                  <Typography variant='body2' className='text-gray-500'>
                    No results found
                  </Typography>
                </div>
              )}
            </SortableContext>
          </DndContext>
        </div>

        <div className='mt-3 pt-3 border-t border-[#CBD6E2]'>
          <Typography variant='caption' className='text-gray-500'>
            Drag items to reorder columns • Toggle switches to show/hide
          </Typography>
        </div>
      </div>
    </Popover>
  );
};

export default ManageColumnsPopover;
