import React from 'react';
import { Chip, Popover, Tooltip } from '@mui/material';
import {
  FieldExpression,
  MappingItem,
  SumOfPopoverState,
} from '../mapping-table.types';
import TextButton from '../../../../../components/button/text-button';

interface SumOfPopoverProps {
  sumOfPopover: SumOfPopoverState;
  setSumOfPopover: React.Dispatch<
    React.SetStateAction<SumOfPopoverState | null>
  >;
  setLocalMappings: React.Dispatch<React.SetStateAction<MappingItem[]>>;
  onMappingsChange: (mappings: MappingItem[]) => void;
  targetOptions: Record<string, Record<string, string>>;
  getPopoverFilteredOptions: (searchText: string) => string[];
  getPopoverDisplayName: (option: string) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildCalculationConfig: (expressions: FieldExpression[]) => any;
  sumOfPopoverInputRef: React.RefObject<HTMLInputElement>;
}

const SumOfPopover: React.FC<SumOfPopoverProps> = ({
  sumOfPopover,
  setSumOfPopover,
  setLocalMappings,
  onMappingsChange,
  targetOptions,
  getPopoverFilteredOptions,
  getPopoverDisplayName,
  buildCalculationConfig,
  sumOfPopoverInputRef,
}) => {
  const handleInputChange = (value: string): void => {
    setSumOfPopover({
      ...sumOfPopover,
      inputValue: value,
      error: undefined,
      showAutocomplete: value.includes('@'),
      autocompleteIndex: 0,
    });
  };

  // ─── Key down ──────────────────────────────────────────────────────────────
  const handleKeyDown = (event: React.KeyboardEvent): void => {
    const currentInput = sumOfPopover.inputValue || '';

    if (event.key === 'Enter') {
      event.preventDefault();

      if (sumOfPopover.showAutocomplete) {
        const searchText = currentInput.substring(
          currentInput.lastIndexOf('@') + 1
        );
        const options = getPopoverFilteredOptions(searchText);
        if (options.length > 0) {
          handleAutocompleteSelect(
            options[sumOfPopover.autocompleteIndex || 0]
          );
          return;
        }
      }

      if (
        currentInput.trim().startsWith('#') &&
        currentInput.trim().length > 1
      ) {
        setSumOfPopover({
          ...sumOfPopover,
          selectedArg: { type: 'manual', value: currentInput.trim() },
          inputValue: '',
          showAutocomplete: false,
          error: undefined,
        });
        return;
      }

      if (currentInput.trim()) {
        setSumOfPopover({
          ...sumOfPopover,
          error: 'Use @ to select a field or # for a manual value',
        });
      }
      return;
    }

    if (
      event.key === 'Backspace' &&
      !currentInput &&
      sumOfPopover.selectedArg
    ) {
      event.preventDefault();
      setSumOfPopover({ ...sumOfPopover, selectedArg: undefined });
      return;
    }

    if (sumOfPopover.showAutocomplete) {
      const searchText = currentInput.substring(
        currentInput.lastIndexOf('@') + 1
      );
      const options = getPopoverFilteredOptions(searchText);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSumOfPopover({
          ...sumOfPopover,
          autocompleteIndex: Math.min(
            (sumOfPopover.autocompleteIndex || 0) + 1,
            options.length - 1
          ),
        });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSumOfPopover({
          ...sumOfPopover,
          autocompleteIndex: Math.max(
            (sumOfPopover.autocompleteIndex || 0) - 1,
            0
          ),
        });
      }
    }
  };

  // ─── Autocomplete select ────────────────────────────────────────────────────
  const handleAutocompleteSelect = (selectedValue: string): void => {
    const isComplete = selectedValue.includes('.');
    if (!isComplete) {
      setSumOfPopover({
        ...sumOfPopover,
        inputValue: `@${selectedValue}.`,
        showAutocomplete: true,
        autocompleteIndex: 0,
      });
      return;
    }
    setSumOfPopover({
      ...sumOfPopover,
      selectedArg: { type: 'chip', value: selectedValue },
      inputValue: '',
      showAutocomplete: false,
      error: undefined,
    });
  };

  const handleSave = (): void => {
    if (!sumOfPopover.selectedArg) {
      setSumOfPopover({
        ...sumOfPopover,
        error: 'Please select a field (@) or enter a manual value (#)',
      });
      return;
    }
    if (sumOfPopover.inputValue.trim()) {
      setSumOfPopover({
        ...sumOfPopover,
        error: 'Please clear the input or press Enter to confirm before saving',
      });
      return;
    }

    let argPayload = '';
    if (sumOfPopover.selectedArg.type === 'chip') {
      const [parent, child] = sumOfPopover.selectedArg.value.split('.', 2);
      const objectId = targetOptions[parent]?.[child] || '';
      argPayload = objectId || sumOfPopover.selectedArg.value;
    } else {
      argPayload = sumOfPopover.selectedArg.value;
    }

    const sumValue = `SUM(${argPayload})`;
    const sumExpression: FieldExpression = {
      type: 'sumOf',
      value: sumValue,
      sumOfArg: sumOfPopover.selectedArg,
    };

    setLocalMappings((prev) => {
      const updated = prev.map((m) => {
        if (m.rid === sumOfPopover.rid) {
          const newExpressions = [...(m.fieldExpressions || [])];
          if (sumOfPopover.editingIndex !== undefined) {
            newExpressions[sumOfPopover.editingIndex] = sumExpression;
          } else {
            newExpressions.push(sumExpression);
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

    setSumOfPopover(null);
  };

  const handleCancel = (): void => {
    setSumOfPopover(null);
  };

  const chipSx = (type: 'chip' | 'manual') => ({
    fontSize: '11px',
    height: '20px',
    maxWidth: '180px',
    backgroundColor: type === 'chip' ? '#f0f9ff' : '#f0fdf4',
    borderColor: type === 'chip' ? '#0176D3' : '#22c55e',
    color: type === 'chip' ? '#0176D3' : '#16a34a',
    margin: '1px',
    borderRadius: '4px',
    '& .MuiChip-deleteIcon': {
      fontSize: '14px',
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
      anchorEl={sumOfPopover.anchorEl}
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
            zIndex: 1200,
            width: sumOfPopover.anchorEl
              ? sumOfPopover.anchorEl.clientWidth + 5
              : '350px',
            maxHeight: '300px',
            overflow: 'visible',
            mt: '3px',
          },
        },
      }}
    >
      <div className='flex flex-col p-4 gap-3'>
        {/* Header */}
        <div className='text-sm font-semibold text-[#4d7c0f]'>
          Build Sum Expression
        </div>

        {/* Input Area */}
        <div className='flex flex-wrap items-center gap-1 border border-gray-300 rounded px-2 py-1.5 bg-white min-h-[32px]'>
          <span className='text-[12px] font-bold text-[#4d7c0f]'>SUM(</span>

          {sumOfPopover.selectedArg && (
            <Tooltip
              title={
                sumOfPopover.selectedArg.type === 'chip'
                  ? getPopoverDisplayName(sumOfPopover.selectedArg.value)
                  : sumOfPopover.selectedArg.value
              }
              arrow
              placement='top'
            >
              <Chip
                label={
                  sumOfPopover.selectedArg.type === 'chip'
                    ? getPopoverDisplayName(sumOfPopover.selectedArg.value)
                    : sumOfPopover.selectedArg.value
                }
                size='small'
                variant='outlined'
                onDelete={() =>
                  setSumOfPopover({ ...sumOfPopover, selectedArg: undefined })
                }
                sx={chipSx(sumOfPopover.selectedArg.type)}
              />
            </Tooltip>
          )}

          {!sumOfPopover.selectedArg && (
            <input
              ref={sumOfPopoverInputRef}
              type='text'
              value={sumOfPopover.inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Type @ for fields or # for manual...'
              className='flex-1 min-w-0 border-none outline-none rounded-[2px] bg-transparent text-sm placeholder-gray-400'
              style={{ minWidth: '80px' }}
              autoFocus
            />
          )}

          <span className='text-[12px] font-bold text-[#4d7c0f]'>)</span>
        </div>

        {/* Autocomplete dropdown */}
        {sumOfPopover.showAutocomplete && (
          <div
            className='bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto -mt-2'
            style={{ maxHeight: '120px' }}
          >
            {getPopoverFilteredOptions(
              (sumOfPopover.inputValue || '').substring(
                (sumOfPopover.inputValue || '').lastIndexOf('@') + 1
              )
            ).map((option, optIdx) => (
              <div
                key={optIdx}
                className={`px-3 py-2 text-sm cursor-pointer ${optIdx === (sumOfPopover.autocompleteIndex || 0) ? 'bg-blue-100 text-blue-800' : 'hover:bg-blue-50 hover:text-blue-700'}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleAutocompleteSelect(option)}
              >
                {option.includes('.') ? getPopoverDisplayName(option) : option}
              </div>
            ))}
          </div>
        )}

        {/* Usage hint */}
        <div className='text-xs text-gray-500 -mt-1'>
          Use <span className='font-medium'>@</span> to select a field or{' '}
          <span className='font-medium'>#</span> for a manual value
        </div>

        {/* Error */}
        {sumOfPopover.error && (
          <div className='text-xs text-red-600 -mt-1.5'>
            {sumOfPopover.error}
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

export default SumOfPopover;
