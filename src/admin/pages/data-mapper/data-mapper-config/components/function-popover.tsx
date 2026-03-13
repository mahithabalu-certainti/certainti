import React from 'react';
import { Chip, Popover, Tooltip } from '@mui/material';
import TextButton from '../../../../../components/button/text-button';
import {
  FieldExpression,
  FunctionPopoverState,
  MappingItem,
} from '../mapping-table.types';

interface FunctionPopoverProps {
  functionPopover: FunctionPopoverState;
  setFunctionPopover: React.Dispatch<
    React.SetStateAction<FunctionPopoverState | null>
  >;
  setLocalMappings: React.Dispatch<React.SetStateAction<MappingItem[]>>;
  onMappingsChange: (mappings: MappingItem[]) => void;
  targetOptions: Record<string, Record<string, string>>;
  getPopoverFilteredOptions: (searchText: string) => string[];
  getPopoverDisplayName: (option: string) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildCalculationConfig: (expressions: FieldExpression[]) => any;
  functionPopoverInputRef: React.RefObject<HTMLInputElement>;
}

const FunctionPopover: React.FC<FunctionPopoverProps> = ({
  functionPopover,
  setFunctionPopover,
  setLocalMappings,
  onMappingsChange,
  targetOptions,
  getPopoverFilteredOptions,
  getPopoverDisplayName,
  buildCalculationConfig,
  functionPopoverInputRef,
}) => {
  const handleInputChange = (value: string): void => {
    setFunctionPopover({
      ...functionPopover,
      inputValue: value,
      error: undefined,
    });
  };

  // ─── Autocomplete select ────────────────────────────────────────────────────
  const handleAutocompleteSelect = (selectedValue: string): void => {
    const isCompleteProperty = selectedValue.includes('.');
    if (!isCompleteProperty) {
      const atIndex = functionPopover.inputValue.lastIndexOf('@');
      if (atIndex !== -1) {
        const newInputValue =
          functionPopover.inputValue.substring(0, atIndex + 1) +
          selectedValue +
          '.';
        setFunctionPopover({ ...functionPopover, inputValue: newInputValue });
      }
      return;
    }
    const [parent, child] = selectedValue.split('.', 2);
    const objectId = targetOptions[parent]?.[child] || '';
    if (objectId) {
      setFunctionPopover({
        ...functionPopover,
        args: [...functionPopover.args, { type: 'chip', value: selectedValue }],
        inputValue: '',
        error: undefined,
      });
    }
  };

  // ─── Key down ──────────────────────────────────────────────────────────────
  const handleKeyDown = (event: React.KeyboardEvent): void => {
    const currentInput = functionPopover.inputValue;

    if (event.key === 'Enter' && currentInput.trim().startsWith('#')) {
      event.preventDefault();
      const manualValue = currentInput.trim();
      if (manualValue.length > 1) {
        setFunctionPopover({
          ...functionPopover,
          args: [
            ...functionPopover.args,
            { type: 'manual', value: manualValue },
          ],
          inputValue: '',
          error: undefined,
        });
      }
      return;
    }

    const atIndex = currentInput.lastIndexOf('@');
    if (atIndex === -1) return;

    const searchText = currentInput.substring(atIndex + 1);
    const options = getPopoverFilteredOptions(searchText);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        break;
      case 'ArrowUp':
        event.preventDefault();
        break;
      case 'Enter':
        event.preventDefault();
        if (options.length > 0) {
          handleAutocompleteSelect(options[0]);
        }
        break;
    }
  };

  const removeFunctionPopoverChip = (indexToRemove: number): void => {
    setFunctionPopover({
      ...functionPopover,
      args: functionPopover.args.filter((_, index) => index !== indexToRemove),
    });
  };

  const handleSave = (): void => {
    if (
      functionPopover.inputValue.trim() &&
      !functionPopover.inputValue.trim().startsWith('@') &&
      !functionPopover.inputValue.trim().startsWith('#')
    ) {
      setFunctionPopover({
        ...functionPopover,
        error:
          'Invalid text in input field. Use @ for fields or # for manual values.',
      });
      return;
    }
    if (functionPopover.args.length < 2) {
      setFunctionPopover({
        ...functionPopover,
        error: `${functionPopover.type} function requires at least 2 arguments`,
      });
      return;
    }

    const functionArgs: string[] = functionPopover.args.map((arg) => {
      if (arg.type === 'chip') {
        const [parent, child] = arg.value.split('.', 2);
        return targetOptions[parent]?.[child] || '';
      }
      return arg.value;
    });

    const displayArgs = functionPopover.args.map((arg) => arg.value);

    setLocalMappings((prev) => {
      const updated = prev.map((m) => {
        if (m.rid === functionPopover.rid) {
          const newExpressions = [...(m.fieldExpressions || [])];
          const functionExpression: FieldExpression = {
            type: 'function',
            value: `${functionPopover.type}(${displayArgs.join(', ')})`,
            functionType: functionPopover.type,
            functionArgs: functionArgs,
          };
          if (functionPopover.editingIndex !== undefined) {
            newExpressions[functionPopover.editingIndex] = functionExpression;
          } else {
            newExpressions.push(functionExpression);
          }
          return {
            ...m,
            fieldExpressions: newExpressions,
            calculation_config: buildCalculationConfig(newExpressions),
            targetError: undefined,
            inputValue: '',
          };
        }
        return m;
      });
      onMappingsChange(updated);
      return updated;
    });

    setFunctionPopover(null);
  };

  const handleCancel = (): void => {
    setFunctionPopover(null);
  };

  const chipSx = (type: 'chip' | 'manual') => ({
    fontSize: '11px',
    height: '20px',
    maxWidth: '200px',
    borderRadius: '4px',
    backgroundColor: type === 'chip' ? '#f0f9ff' : '#f0fdf4',
    borderColor: type === 'chip' ? '#0176D3' : '#22c55e',
    color: type === 'chip' ? '#0176D3' : '#16a34a',
    margin: '1px',
    '& .MuiChip-deleteIcon': {
      fontSize: '14px',
      color: type === 'chip' ? '#0176D3' : '#16a34a',
      '&:hover': { color: '#ef4444' },
    },
    '& .MuiChip-label': {
      paddingLeft: '6px',
      paddingRight: '6px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  });

  return (
    <Popover
      open
      anchorEl={functionPopover.anchorEl}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      TransitionProps={{ timeout: 0 }}
      disableEnforceFocus
      disableAutoFocus
      disableRestoreFocus
      disableScrollLock
      hideBackdrop
      sx={{ pointerEvents: 'none', zIndex: 1100 }}
      slotProps={{
        paper: {
          sx: {
            pointerEvents: 'auto',
            zIndex: 1100,
            width: functionPopover.anchorEl
              ? functionPopover.anchorEl.clientWidth + 5
              : '450px',
            maxHeight: '400px',
            overflow: 'visible',
            mt: '3px',
          },
        },
      }}
    >
      <div className='flex flex-col p-4 gap-3'>
        {/* Header */}
        <div className='text-sm font-semibold text-gray-700'>
          Build {functionPopover.type} Function
        </div>

        {/* Field Container */}
        <div className='relative'>
          <div
            className={`w-full max-h-[100px] overflow-y-auto px-2 py-1 border rounded-[2px] flex flex-wrap items-start gap-1 cursor-text focus-within:border-2 ${
              functionPopover.error
                ? 'border-red-500 bg-[#FEF2F2] focus-within:border-red-500'
                : 'border-gray-300 bg-white focus-within:border-blue-400'
            }`}
            onClick={() => {
              functionPopoverInputRef.current?.focus();
            }}
          >
            {/* Chips */}
            {functionPopover.args.map((arg, idx) => (
              <Tooltip key={idx} title={arg.value} arrow placement='top'>
                <Chip
                  label={arg.value}
                  size='small'
                  variant='outlined'
                  onDelete={() => removeFunctionPopoverChip(idx)}
                  sx={chipSx(arg.type as 'chip' | 'manual')}
                />
              </Tooltip>
            ))}

            {/* Input Field */}
            <input
              ref={functionPopoverInputRef}
              type='text'
              value={functionPopover.inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                functionPopover.args.length === 0
                  ? 'Type @ to add fields or # for IDs'
                  : 'Add more...'
              }
              className='flex-1 min-w-0 border-none outline-none rounded-[2px] bg-transparent text-sm placeholder-gray-400 align-top'
              style={{ minWidth: '80px' }}
              autoFocus
            />
          </div>

          {/* Autocomplete Dropdown */}
          {functionPopover.inputValue.includes('@') && (
            <div
              className='absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto z-[10000]'
              style={{ maxHeight: '150px' }}
            >
              {getPopoverFilteredOptions(
                functionPopover.inputValue.substring(
                  functionPopover.inputValue.lastIndexOf('@') + 1
                )
              ).map((option, idx) => (
                <div
                  key={idx}
                  className='px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 hover:text-blue-800'
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAutocompleteSelect(option)}
                >
                  {getPopoverDisplayName(option)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {functionPopover.error && (
          <div className='text-xs text-red-600 -mt-1.5'>
            {functionPopover.error}
          </div>
        )}

        {/* Actions */}
        <div className='flex justify-end gap-2'>
          <TextButton
            label='Cancel'
            onClick={handleCancel}
            sx={{
              width: '70px',
              minWidth: '70px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label='Save'
            onClick={handleSave}
            disabled={functionPopover.args.length < 2}
            sx={{
              width: '64px',
              minWidth: '64px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
        </div>
      </div>
    </Popover>
  );
};

export default FunctionPopover;
