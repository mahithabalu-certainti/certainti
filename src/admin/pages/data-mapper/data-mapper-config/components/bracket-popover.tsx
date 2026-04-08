import React from 'react';
import { Chip, Popover, Tooltip } from '@mui/material';
import TextButton from '../../../../../components/button/text-button';
import {
  BracketItem,
  BracketPopoverState,
  ConditionalPopoverState,
  FieldExpression,
  MappingItem,
} from '../mapping-table.types';

function buildBracketChipSx(
  type: BracketItem['type'],
  size: 'sm' | 'xs' = 'sm'
) {
  const isXs = size === 'xs';
  const map: Record<string, { bg: string; border: string; color: string }> = {
    chip: {
      bg: isXs ? '#eff6ff' : '#f0f9ff',
      border: isXs ? '#3b82f6' : '#0176D3',
      color: isXs ? '#1d4ed8' : '#0176D3',
    },
    manual: {
      bg: '#f0fdf4',
      border: '#22c55e',
      color: isXs ? '#15803d' : '#16a34a',
    },
    number: {
      bg: '#fff7ed',
      border: '#f97316',
      color: isXs ? '#c2410c' : '#ea580c',
    },
    bracket: { bg: '#fdf4e9', border: '#c2803b', color: '#7c4a15' },
    operator: { bg: '#fef9c3', border: '#eab308', color: '#854d0e' },
  };
  const s = map[type] ?? map.operator;
  return {
    fontSize: '11px',
    height: isXs ? '18px' : '20px',
    maxWidth: isXs ? '160px' : '180px',
    borderRadius: isXs ? '3px' : '4px',
    margin: isXs ? '0px' : '1px',
    backgroundColor: s.bg,
    borderColor: s.border,
    color: s.color,
    fontWeight: type === 'operator' ? 700 : 400,
    borderStyle: type === 'bracket' ? 'dashed' : 'solid',
    '& .MuiChip-deleteIcon': {
      fontSize: isXs ? '12px' : '14px',
      color: s.color,
      '&:hover': { color: '#ef4444' },
    },
    '& .MuiChip-label': {
      paddingLeft: isXs ? '4px' : '5px',
      paddingRight: isXs ? '4px' : '5px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  };
}

interface BracketPopoverProps {
  bracketPopover: BracketPopoverState;
  setBracketPopover: React.Dispatch<
    React.SetStateAction<BracketPopoverState | null>
  >;
  conditionalPopover: ConditionalPopoverState | null;
  setConditionalPopover: React.Dispatch<
    React.SetStateAction<ConditionalPopoverState | null>
  >;
  setLocalMappings: React.Dispatch<React.SetStateAction<MappingItem[]>>;
  onMappingsChange: (mappings: MappingItem[]) => void;
  targetOptions: Record<string, Record<string, string>>;
  getPopoverFilteredOptions: (searchText: string) => string[];
  getPopoverDisplayName: (option: string) => string;
  buildBracketDisplayLabel: (items: BracketItem[], rid: string) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildCalculationConfig: (expressions: FieldExpression[]) => any;
  bracketPopoverInputRef: React.RefObject<HTMLInputElement>;
}

const BracketPopover: React.FC<BracketPopoverProps> = ({
  bracketPopover,
  setBracketPopover,
  conditionalPopover,
  setConditionalPopover,
  setLocalMappings,
  onMappingsChange,
  targetOptions,
  getPopoverFilteredOptions,
  getPopoverDisplayName,
  buildBracketDisplayLabel,
  buildCalculationConfig,
  bracketPopoverInputRef,
}) => {
  // ─── Input change ───────────────────────────────────────────────────────────

  const handleInputChange = (value: string): void => {
    // Only auto-add simple operators that can't be extended
    const autoAddOps = ['+', '-', '*', '/', '%'];
    // Compound operators that should be auto-added when complete
    const compoundOps = ['<=', '>='];

    if (autoAddOps.includes(value)) {
      const targetList = bracketPopover.nestedMode
        ? bracketPopover.nestedItems || []
        : bracketPopover.items;
      const newItem: BracketItem = { type: 'operator', value };
      if (bracketPopover.nestedMode) {
        setBracketPopover({
          ...bracketPopover,
          nestedItems: [...targetList, newItem],
          inputValue: '',
          error: undefined,
        });
      } else {
        setBracketPopover({
          ...bracketPopover,
          items: [...targetList, newItem],
          inputValue: '',
          error: undefined,
        });
      }
      return;
    }

    // Auto-add compound operators when complete
    if (compoundOps.includes(value)) {
      const targetList = bracketPopover.nestedMode
        ? bracketPopover.nestedItems || []
        : bracketPopover.items;
      const newItem: BracketItem = { type: 'operator', value };
      if (bracketPopover.nestedMode) {
        setBracketPopover({
          ...bracketPopover,
          nestedItems: [...targetList, newItem],
          inputValue: '',
          error: undefined,
        });
      } else {
        setBracketPopover({
          ...bracketPopover,
          items: [...targetList, newItem],
          inputValue: '',
          error: undefined,
        });
      }
      return;
    }

    if (value === '(' && !bracketPopover.nestedMode) {
      setBracketPopover({
        ...bracketPopover,
        inputValue: '',
        nestedMode: true,
        nestedItems: [],
        error: undefined,
        showAutocomplete: false,
      });
      return;
    }

    if (value === ')' && bracketPopover.nestedMode) {
      const nestedItems = bracketPopover.nestedItems || [];
      const hasOp = nestedItems.some((it) => it.type === 'operator');
      if (nestedItems.length === 0 || !hasOp) {
        setBracketPopover({
          ...bracketPopover,
          inputValue: '',
          error:
            'Nested bracket must contain at least one operation (e.g., (#A * @B))',
        });
        return;
      }
      const nestedStr = nestedItems
        .map((it) =>
          it.type === 'chip'
            ? `@${it.value}`
            : it.type === 'bracket'
              ? it.value
              : it.value
        )
        .join(' ');
      const nestedValue = `(${nestedStr})`;
      const nestedBracketItem: BracketItem = {
        type: 'bracket',
        value: nestedValue,
        nestedItems,
      };
      setBracketPopover({
        ...bracketPopover,
        items: [...bracketPopover.items, nestedBracketItem],
        inputValue: '',
        nestedMode: false,
        nestedItems: [],
        error: undefined,
        showAutocomplete: false,
      });
      return;
    }

    const atIndex = value.lastIndexOf('@');
    const shouldShow = atIndex !== -1;
    setBracketPopover({
      ...bracketPopover,
      inputValue: value,
      error: undefined,
      showAutocomplete: shouldShow,
      autocompleteIndex: shouldShow ? 0 : bracketPopover.autocompleteIndex,
    });
  };

  // ─── Autocomplete select ────────────────────────────────────────────────────

  const handleAutocompleteSelect = (selectedValue: string): void => {
    const isCompleteProperty = selectedValue.includes('.');
    if (!isCompleteProperty) {
      const atIndex = bracketPopover.inputValue.lastIndexOf('@');
      if (atIndex !== -1) {
        const newInputValue =
          bracketPopover.inputValue.substring(0, atIndex + 1) +
          selectedValue +
          '.';
        setBracketPopover({
          ...bracketPopover,
          inputValue: newInputValue,
          showAutocomplete: true,
          autocompleteIndex: 0,
        });
      }
      return;
    }
    const chipItem: BracketItem = { type: 'chip', value: selectedValue };
    if (bracketPopover.nestedMode) {
      setBracketPopover({
        ...bracketPopover,
        nestedItems: [...(bracketPopover.nestedItems || []), chipItem],
        inputValue: '',
        showAutocomplete: false,
        error: undefined,
      });
    } else {
      setBracketPopover({
        ...bracketPopover,
        items: [...bracketPopover.items, chipItem],
        inputValue: '',
        showAutocomplete: false,
        error: undefined,
      });
    }
  };

  // ─── Key down ──────────────────────────────────────────────────────────────

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    const currentInput = bracketPopover.inputValue;

    if (event.key === 'Enter') {
      event.preventDefault();

      if (bracketPopover.showAutocomplete) {
        const searchText = currentInput.substring(
          currentInput.lastIndexOf('@') + 1
        );
        const options = getPopoverFilteredOptions(searchText);
        const selected = options[bracketPopover.autocompleteIndex || 0];
        if (selected) {
          handleAutocompleteSelect(selected);
          return;
        }
      }

      if (
        currentInput.trim().startsWith('#') &&
        currentInput.trim().length > 1
      ) {
        const manualItem: BracketItem = {
          type: 'manual',
          value: currentInput.trim(),
        };
        if (bracketPopover.nestedMode) {
          setBracketPopover({
            ...bracketPopover,
            nestedItems: [...(bracketPopover.nestedItems || []), manualItem],
            inputValue: '',
            showAutocomplete: false,
            error: undefined,
          });
        } else {
          setBracketPopover({
            ...bracketPopover,
            items: [...bracketPopover.items, manualItem],
            inputValue: '',
            showAutocomplete: false,
            error: undefined,
          });
        }
        return;
      }

      const numberRegex = /^-?\d+(\.\d+)?$/;
      if (numberRegex.test(currentInput.trim())) {
        const numberInput = currentInput.trim();
        const decimalMatch = numberInput.match(/\.(\d+)$/);
        if (decimalMatch && decimalMatch[1].length > 4) {
          setBracketPopover({
            ...bracketPopover,
            error: 'Maximum of 4 decimal places allowed for numbers',
          });
          return;
        }
        const numItem: BracketItem = { type: 'number', value: numberInput };
        if (bracketPopover.nestedMode) {
          setBracketPopover({
            ...bracketPopover,
            nestedItems: [...(bracketPopover.nestedItems || []), numItem],
            inputValue: '',
            showAutocomplete: false,
            error: undefined,
          });
        } else {
          setBracketPopover({
            ...bracketPopover,
            items: [...bracketPopover.items, numItem],
            inputValue: '',
            showAutocomplete: false,
            error: undefined,
          });
        }
        return;
      }

      // Check if it's a valid operator (including < and >)
      const validOperators = ['+', '-', '*', '/', '%', '<', '>', '<=', '>='];
      if (validOperators.includes(currentInput.trim())) {
        const opItem: BracketItem = {
          type: 'operator',
          value: currentInput.trim(),
        };
        if (bracketPopover.nestedMode) {
          setBracketPopover({
            ...bracketPopover,
            nestedItems: [...(bracketPopover.nestedItems || []), opItem],
            inputValue: '',
            showAutocomplete: false,
            error: undefined,
          });
        } else {
          setBracketPopover({
            ...bracketPopover,
            items: [...bracketPopover.items, opItem],
            inputValue: '',
            showAutocomplete: false,
            error: undefined,
          });
        }
        return;
      }

      if (currentInput.trim()) {
        setBracketPopover({
          ...bracketPopover,
          error: `Invalid input "${currentInput.trim()}". Use @ for fields, # for manual IDs, or numbers. Operators (+,-,*,/,%,<,>,<=,>=) are auto-added when typed.`,
        });
      }
      return;
    }

    if (event.key === 'Escape') {
      if (bracketPopover.nestedMode) {
        setBracketPopover({
          ...bracketPopover,
          nestedMode: false,
          nestedItems: [],
          inputValue: '',
          showAutocomplete: false,
        });
        return;
      }
      setBracketPopover({ ...bracketPopover, showAutocomplete: false });
      return;
    }

    if (bracketPopover.showAutocomplete) {
      const searchText = currentInput.substring(
        currentInput.lastIndexOf('@') + 1
      );
      const options = getPopoverFilteredOptions(searchText);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setBracketPopover({
          ...bracketPopover,
          autocompleteIndex: Math.min(
            (bracketPopover.autocompleteIndex || 0) + 1,
            options.length - 1
          ),
        });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setBracketPopover({
          ...bracketPopover,
          autocompleteIndex: Math.max(
            (bracketPopover.autocompleteIndex || 0) - 1,
            0
          ),
        });
      }
    }
  };

  // ─── Remove item ───────────────────────────────────────────────────────────

  const removeBracketItem = (
    indexToRemove: number,
    fromNested = false
  ): void => {
    if (fromNested) {
      setBracketPopover({
        ...bracketPopover,
        nestedItems: (bracketPopover.nestedItems || []).filter(
          (_, i) => i !== indexToRemove
        ),
      });
    } else {
      setBracketPopover({
        ...bracketPopover,
        items: bracketPopover.items.filter((_, i) => i !== indexToRemove),
      });
    }
  };

  // ─── Validation ────────────────────────────────────────────────────────────

  const validateBracketExpression = (items: BracketItem[]): string | null => {
    if (items.length === 0) return 'Bracket expression cannot be empty';
    const hasOperator = items.some((it) => it.type === 'operator');
    if (!hasOperator)
      return 'Bracket expression must contain at least one operator (e.g., (#A - #B))';
    if (items[0].type === 'operator')
      return 'Bracket expression cannot start with an operator';
    if (items[items.length - 1].type === 'operator')
      return 'Bracket expression cannot end with an operator';

    for (let i = 0; i < items.length - 1; i++) {
      const cur = items[i];
      const nxt = items[i + 1];
      if (cur.type === 'operator' && nxt.type === 'operator')
        return `Invalid: consecutive operators "${cur.value}${nxt.value}" are not allowed`;
      const isValue = (it: BracketItem) =>
        it.type === 'chip' ||
        it.type === 'manual' ||
        it.type === 'number' ||
        it.type === 'bracket';
      if (isValue(cur) && isValue(nxt))
        return 'Missing operator between values';
    }

    for (const it of items) {
      if (it.type === 'number') {
        const decMatch = it.value.match(/\.(\d+)$/);
        if (decMatch && decMatch[1].length > 4)
          return 'Maximum of 4 decimal places allowed for numbers';
      }
      if (
        it.type === 'bracket' &&
        it.nestedItems &&
        it.nestedItems.length > 0
      ) {
        const nestedError = validateBracketExpression(it.nestedItems);
        if (nestedError) return `Inside nested bracket: ${nestedError}`;
      }
    }
    return null;
  };

  // ─── Save ──────────────────────────────────────────────────────────────────

  const handleSave = (): void => {
    if (bracketPopover.nestedMode) {
      setBracketPopover({
        ...bracketPopover,
        error: 'Close the nested bracket first by typing ) in the input field.',
      });
      return;
    }
    if (bracketPopover.inputValue.trim()) {
      setBracketPopover({
        ...bracketPopover,
        error:
          'Please press Enter to confirm the current input before saving, or clear it.',
      });
      return;
    }

    const validationError = validateBracketExpression(bracketPopover.items);
    if (validationError) {
      setBracketPopover({ ...bracketPopover, error: validationError });
      return;
    }

    const buildInnerStr = (items: BracketItem[]): string =>
      items
        .map((it) => {
          if (it.type === 'chip') {
            const [parent, child] = it.value.split('.', 2);
            const objectId = targetOptions[parent]?.[child];
            return objectId || it.value;
          } else if (it.type === 'bracket' && it.nestedItems) {
            return `(${buildInnerStr(it.nestedItems)})`;
          }
          return it.value;
        })
        .join(' ');

    const bracketValue = `(${buildInnerStr(bracketPopover.items)})`;
    const bracketExpression: FieldExpression = {
      type: 'bracket',
      value: bracketValue,
      bracketItems: bracketPopover.items,
    };

    // Save to clause condition field
    if (
      bracketPopover.source === 'clause-condition' &&
      conditionalPopover &&
      bracketPopover.clauseIndex !== undefined
    ) {
      const newClauses = [...conditionalPopover.clauses];
      const clause = { ...newClauses[bracketPopover.clauseIndex] };
      const newExpressions = [...(clause.expressions || [])];
      if (bracketPopover.clauseChipEditIndex !== undefined) {
        newExpressions[bracketPopover.clauseChipEditIndex] = bracketExpression;
      } else {
        newExpressions.push(bracketExpression);
      }
      clause.expressions = newExpressions;
      clause.inputValue = '';
      clause.error = undefined;
      newClauses[bracketPopover.clauseIndex] = clause;
      setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
      setBracketPopover(null);
      return;
    }

    // Save to clause return field
    if (
      bracketPopover.source === 'clause-return' &&
      conditionalPopover &&
      bracketPopover.clauseIndex !== undefined
    ) {
      const newClauses = [...conditionalPopover.clauses];
      const clause = { ...newClauses[bracketPopover.clauseIndex] };
      const newExpressions = [...(clause.returnExpressions || [])];
      if (bracketPopover.clauseChipEditIndex !== undefined) {
        newExpressions[bracketPopover.clauseChipEditIndex] = bracketExpression;
      } else {
        newExpressions.push(bracketExpression);
      }
      clause.returnExpressions = newExpressions;
      clause.returnInputValue = '';
      clause.returnError = undefined;
      newClauses[bracketPopover.clauseIndex] = clause;
      setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
      setBracketPopover(null);
      return;
    }

    // Save to main field
    setLocalMappings((prev) => {
      const updated = prev.map((m) => {
        if (m.rid === bracketPopover.rid) {
          const newExpressions = [...(m.fieldExpressions || [])];
          if (bracketPopover.editingIndex !== undefined) {
            newExpressions[bracketPopover.editingIndex] = bracketExpression;
          } else {
            newExpressions.push(bracketExpression);
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

    setBracketPopover(null);
  };

  const handleCancel = (): void => {
    setBracketPopover(null);
  };

  return (
    <Popover
      open
      anchorEl={bracketPopover.anchorEl}
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
            width: bracketPopover.anchorEl
              ? bracketPopover.anchorEl.clientWidth + 5
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
        <div className='flex items-center gap-2'>
          <span className='text-sm font-semibold text-gray-700'>
            Build Bracket Expression
          </span>
          <span className='text-xs text-gray-400'>( ... )</span>
        </div>
        <div className='text-xs text-gray-500 -mt-1'>
          Supports: <span>@field</span>, <span>#manual</span>, numbers,
          operators <span>+ - * / % &lt; &gt; &lt;= &gt;=</span> and{' '}
          <span>(</span> for nested sub-expressions
        </div>

        {/* Field Container */}
        <div className='relative'>
          <div
            className={`w-full max-h-[140px] overflow-y-auto px-2 py-1 border rounded-[2px] flex flex-wrap items-start gap-1 cursor-text focus-within:border-2 ${
              bracketPopover.error
                ? 'border-red-500 bg-[#FEF2F2] focus-within:border-red-500'
                : bracketPopover.nestedMode
                  ? 'border-teal-400 bg-white border-2'
                  : 'border-gray-300 bg-white focus-within:border-blue-400'
            }`}
            onClick={() => bracketPopoverInputRef.current?.focus()}
          >
            <span className='text-[13px] font-extrabold text-teal-600 self-center'>
              ({' '}
            </span>

            {/* Main item chips */}
            {bracketPopover.items.map((item, idx) => (
              <Tooltip
                key={idx}
                title={
                  item.type === 'chip'
                    ? getPopoverDisplayName(item.value)
                    : item.type === 'bracket' && item.nestedItems
                      ? `(${buildBracketDisplayLabel(item.nestedItems, bracketPopover.rid)})`
                      : item.value
                }
                arrow
                placement='top'
              >
                <Chip
                  label={
                    item.type === 'chip'
                      ? getPopoverDisplayName(item.value)
                      : item.type === 'bracket' && item.nestedItems
                        ? `(${buildBracketDisplayLabel(item.nestedItems, bracketPopover.rid)})`
                        : item.value
                  }
                  size='small'
                  variant='outlined'
                  onDelete={() => removeBracketItem(idx)}
                  sx={buildBracketChipSx(item.type)}
                />
              </Tooltip>
            ))}

            {/* Nested mode in-progress builder */}
            {bracketPopover.nestedMode && (
              <div className='flex items-center gap-1 flex-wrap border border-dashed border-teal-400 bg-teal-50 rounded px-1.5 py-0.5 mx-0.5 w-full'>
                <span className='text-[12px] font-extrabold text-[#7c4a15]'>
                  ({' '}
                </span>
                {(bracketPopover.nestedItems || []).map((nit, nIdx) => (
                  <Tooltip
                    key={nIdx}
                    title={
                      nit.type === 'chip'
                        ? getPopoverDisplayName(nit.value)
                        : nit.value
                    }
                    arrow
                    placement='top'
                  >
                    <Chip
                      label={
                        nit.type === 'chip'
                          ? getPopoverDisplayName(nit.value)
                          : nit.value
                      }
                      size='small'
                      variant='outlined'
                      onDelete={() => removeBracketItem(nIdx, true)}
                      sx={buildBracketChipSx(nit.type, 'xs')}
                    />
                  </Tooltip>
                ))}
                <input
                  ref={bracketPopoverInputRef}
                  type='text'
                  value={bracketPopover.inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    (bracketPopover.nestedItems || []).length === 0
                      ? '@ field, # ID, number...'
                      : 'Add more...'
                  }
                  className='flex-1 min-w-0 border-none outline-none bg-transparent text-sm placeholder-gray-400'
                  style={{ minWidth: '60px' }}
                  autoFocus
                />
                <span className='text-[12px] font-extrabold text-[#7c4a15]'>
                  {' '}
                  )
                </span>
              </div>
            )}

            {/* Normal input */}
            {!bracketPopover.nestedMode && (
              <input
                ref={bracketPopoverInputRef}
                type='text'
                value={bracketPopover.inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  bracketPopover.items.length === 0
                    ? '@ field, # ID, number, ( for nested...'
                    : 'Add more...'
                }
                className='flex-1 min-w-0 border-none outline-none rounded-[2px] bg-transparent text-sm placeholder-gray-400 align-top'
                style={{ minWidth: '80px' }}
                autoFocus
              />
            )}

            <span className='text-[13px] font-extrabold text-teal-600 self-center'>
              {' '}
              )
            </span>
          </div>

          {/* Autocomplete */}
          {bracketPopover.showAutocomplete && (
            <div
              className='absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto z-[10000]'
              style={{ maxHeight: '150px' }}
            >
              {getPopoverFilteredOptions(
                bracketPopover.inputValue.substring(
                  bracketPopover.inputValue.lastIndexOf('@') + 1
                )
              ).map((option, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-2 text-sm cursor-pointer ${idx === (bracketPopover.autocompleteIndex || 0) ? 'bg-blue-100 text-blue-800' : 'hover:bg-blue-50 hover:text-blue-700'}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAutocompleteSelect(option)}
                >
                  {getPopoverDisplayName(option)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nested mode hint */}
        {bracketPopover.nestedMode && (
          <div className='text-xs -mt-1 flex items-center gap-1.5 flex-wrap'>
            <span>Building nested bracket - type</span>
            <span className='bg-teal-50 border border-teal-300 rounded px-1 py-0.5'>
              )
            </span>
            <span>to close it,</span>
            <span className='bg-teal-50 border border-teal-300 rounded px-1 py-0.5'>
              Esc
            </span>
            <span>to cancel</span>
          </div>
        )}

        {/* Error */}
        {bracketPopover.error && (
          <div className='text-xs text-red-600 -mt-1.5'>
            {bracketPopover.error}
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

export default BracketPopover;
