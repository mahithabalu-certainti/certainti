import React from 'react';
import { Chip, IconButton, Popover, Tooltip } from '@mui/material';
import TextButton from '../../../../../components/button/text-button';
import {
  BracketItem,
  BracketPopoverState,
  ConditionalClause,
  ConditionalExpression,
  ConditionalPopoverState,
  FieldExpression,
  MappingItem,
} from '../mapping-table.types';
import { CloseIcon } from '../../../../../assets';

function clauseChipSx(type: string, value?: string) {
  const map: Record<string, { bg: string; border: string; color: string }> = {
    chip: { bg: '#eff6ff', border: '#3b82f6', color: '#1d4ed8' },
    manual: { bg: '#f0fdf4', border: '#22c55e', color: '#15803d' },
    number: { bg: '#fff7ed', border: '#f97316', color: '#c2410c' },
    bracket: { bg: '#fdf4e9', border: '#c2803b', color: '#7c4a15' },
  };
  const isLogical = value === '&&' || value === '||';
  const s =
    map[type] ??
    (isLogical
      ? { bg: '#fdf2f8', border: '#f472b6', color: '#9d174d' }
      : { bg: '#fef9c3', border: '#eab308', color: '#854d0e' });

  return {
    fontSize: '11px',
    height: '20px',
    maxWidth: '150px',
    backgroundColor: s.bg,
    borderColor: s.border,
    color: s.color,
    fontWeight: type === 'operator' ? 700 : 500,
    borderRadius: '4px',
    ...(type === 'bracket'
      ? { cursor: 'pointer', '&:hover': { backgroundColor: '#fae5c8' } }
      : {}),
    '& .MuiChip-deleteIcon': {
      fontSize: '14px',
      color: s.color,
      '&:hover': { color: '#dc2626' },
    },
    '& .MuiChip-label': {
      ...(type === 'operator'
        ? {
            paddingBottom: value === '*' ? '0px' : '2px',
            paddingTop: value === '*' ? '6px' : '0px',
          }
        : {}),
      ...(type === 'bracket'
        ? {
            paddingLeft: '6px',
            paddingRight: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }
        : {}),
    },
  };
}

interface ConditionalPopoverProps {
  conditionalPopover: ConditionalPopoverState;
  setConditionalPopover: React.Dispatch<
    React.SetStateAction<ConditionalPopoverState | null>
  >;
  setBracketPopover: React.Dispatch<
    React.SetStateAction<BracketPopoverState | null>
  >;
  setLocalMappings: React.Dispatch<React.SetStateAction<MappingItem[]>>;
  onMappingsChange: (mappings: MappingItem[]) => void;
  targetOptions: Record<string, Record<string, string>>;
  getPopoverFilteredOptions: (searchText: string) => string[];
  getPopoverDisplayName: (option: string) => string;
  buildBracketDisplayLabel: (items: BracketItem[], rid: string) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildCalculationConfig: (expressions: FieldExpression[]) => any;
  clauseInputRefs: React.MutableRefObject<
    Record<number, HTMLInputElement | null>
  >;
  clauseContainerRefs: React.MutableRefObject<
    Record<number, HTMLDivElement | null>
  >;
  returnInputRefs: React.MutableRefObject<
    Record<number, HTMLInputElement | null>
  >;
  returnContainerRefs: React.MutableRefObject<
    Record<number, HTMLDivElement | null>
  >;
}

const ConditionalPopover: React.FC<ConditionalPopoverProps> = ({
  conditionalPopover,
  setConditionalPopover,
  setBracketPopover,
  setLocalMappings,
  onMappingsChange,
  targetOptions,
  getPopoverFilteredOptions,
  getPopoverDisplayName,
  buildBracketDisplayLabel,
  buildCalculationConfig,
  clauseInputRefs,
  clauseContainerRefs,
  returnInputRefs,
  returnContainerRefs,
}) => {
  // ─── Clause condition handlers ──────────────────────────────────────────────
  const handleClauseInputChange = (index: number, value: string): void => {
    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[index] };
    clause.error = undefined;

    const operators = [
      '===',
      '!==',
      '<=',
      '>=',
      '&&',
      '||',
      '<',
      '>',
      '+',
      '-',
      '*',
      '/',
      '%',
    ];
    const potentialCompoundChars = ['<', '>', '=', '!', '&', '|'];
    const lastChar = value.slice(-1);
    const isPotentialCompound = potentialCompoundChars.includes(lastChar);
    const operatorMatch = operators.find((op) => value.endsWith(op));

    if (operatorMatch && (!isPotentialCompound || operatorMatch.length > 1)) {
      clause.expressions = [
        ...(clause.expressions || []),
        { type: 'operator', value: operatorMatch },
      ];
      clause.inputValue = '';
      clause.showAutocomplete = false;
      newClauses[index] = clause;
      setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
      return;
    }

    const atIndex = value.lastIndexOf('@');
    const shouldShow = atIndex !== -1;
    clause.inputValue = value;
    clause.showAutocomplete = shouldShow;
    if (shouldShow) clause.autocompleteIndex = 0;
    newClauses[index] = clause;
    setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
  };

  const handleClauseKeyDown = (
    index: number,
    event: React.KeyboardEvent
  ): void => {
    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[index] };
    clause.error = undefined;
    const currentInput = clause.inputValue || '';

    if (event.key === 'Enter') {
      event.preventDefault();

      if (clause.showAutocomplete) {
        const options = getPopoverFilteredOptions(
          currentInput.substring(currentInput.lastIndexOf('@') + 1)
        );
        if (options.length > 0) {
          handleClauseAutocompleteSelect(
            index,
            options[clause.autocompleteIndex || 0]
          );
          return;
        }
      }

      if (currentInput.trim() === '(') {
        const anchorEl =
          clauseContainerRefs.current[index] || conditionalPopover.anchorEl;
        if (anchorEl) {
          clause.inputValue = '';
          newClauses[index] = clause;
          setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
          setBracketPopover({
            rid: conditionalPopover.rid,
            items: [],
            inputValue: '',
            anchorEl,
            source: 'clause-condition',
            clauseIndex: index,
          });
        }
        return;
      }

      if (currentInput.trim().startsWith('#')) {
        clause.expressions = [
          ...(clause.expressions || []),
          { type: 'manual', value: currentInput.trim() },
        ];
        clause.inputValue = '';
        clause.showAutocomplete = false;
        newClauses[index] = clause;
        setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
        return;
      }

      const numberRegex = /^-?\d+(\.\d+)?$/;
      if (numberRegex.test(currentInput.trim())) {
        const decimalMatch = currentInput.trim().match(/\.(\d+)$/);
        if (decimalMatch && decimalMatch[1].length > 4) {
          clause.error = 'Maximum of 4 decimal places allowed for numbers';
          newClauses[index] = clause;
          setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
          return;
        }
        clause.expressions = [
          ...(clause.expressions || []),
          { type: 'number', value: currentInput.trim() },
        ];
        clause.inputValue = '';
        clause.showAutocomplete = false;
        newClauses[index] = clause;
        setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
        return;
      }

      const isFullOp = [
        '===',
        '!==',
        '&&',
        '||',
        '+',
        '-',
        '*',
        '/',
        '%',
        '>=',
        '<=',
        '>',
        '<',
      ].includes(currentInput.trim());
      if (isFullOp) {
        clause.expressions = [
          ...(clause.expressions || []),
          { type: 'operator', value: currentInput.trim() },
        ];
        clause.inputValue = '';
        clause.showAutocomplete = false;
        newClauses[index] = clause;
        setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
        return;
      }

      if (currentInput.trim()) {
        clause.error = `Invalid input: "${currentInput.trim()}". Please use @ for fields, # for manual, ( for brackets, or enter valid numbers/operators.`;
        newClauses[index] = clause;
        setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
      }
    }

    if (clause.showAutocomplete) {
      const options = getPopoverFilteredOptions(
        currentInput.substring(currentInput.lastIndexOf('@') + 1)
      );
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        clause.autocompleteIndex = Math.min(
          (clause.autocompleteIndex || 0) + 1,
          options.length - 1
        );
        newClauses[index] = clause;
        setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        clause.autocompleteIndex = Math.max(
          (clause.autocompleteIndex || 0) - 1,
          0
        );
        newClauses[index] = clause;
        setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
      }
    }
  };

  const handleClauseAutocompleteSelect = (
    index: number,
    selectedValue: string
  ): void => {
    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[index] };
    clause.error = undefined;
    const currentInput = clause.inputValue || '';
    const atIndex = currentInput.lastIndexOf('@');
    if (atIndex === -1) return;

    if (!selectedValue.includes('.')) {
      clause.inputValue =
        currentInput.substring(0, atIndex + 1) + selectedValue + '.';
      clause.showAutocomplete = true;
      clause.autocompleteIndex = 0;
    } else {
      clause.expressions = [
        ...(clause.expressions || []),
        { type: 'chip', value: selectedValue },
      ];
      clause.inputValue = '';
      clause.showAutocomplete = false;
    }
    newClauses[index] = clause;
    setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
  };

  const handleClauseRemoveChip = (
    clauseIndex: number,
    chipIndex: number
  ): void => {
    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[clauseIndex] };
    clause.error = undefined;
    const newExpressions = [...(clause.expressions || [])];
    newExpressions.splice(chipIndex, 1);
    clause.expressions = newExpressions;
    newClauses[clauseIndex] = clause;
    setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
  };

  // ─── Return field handlers ──────────────────────────────────────────────────
  const handleReturnInputChange = (index: number, value: string): void => {
    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[index] };
    clause.returnError = undefined;

    const operators = ['+', '-', '*', '/'];
    const operatorMatch = operators.find((op) => value.endsWith(op));

    if (operatorMatch && value.length > 0) {
      const beforeOperator = value.slice(0, -operatorMatch.length).trim();
      if (beforeOperator) {
        const atIndex = beforeOperator.lastIndexOf('@');
        if (atIndex !== -1) {
          const chipValue = beforeOperator.substring(atIndex);
          clause.returnExpressions = [
            ...(clause.returnExpressions || []),
            { type: 'manual', value: chipValue },
          ];
        } else if (
          beforeOperator.trim() &&
          !beforeOperator.trim().startsWith('@')
        ) {
          if (!isNaN(Number(beforeOperator.trim()))) {
            clause.returnExpressions = [
              ...(clause.returnExpressions || []),
              { type: 'number', value: beforeOperator.trim() },
            ];
          } else {
            clause.returnExpressions = [
              ...(clause.returnExpressions || []),
              { type: 'manual', value: beforeOperator.trim() },
            ];
          }
        }
      }
      const opMap: Record<string, string> = {
        '+': '+',
        '-': '-',
        '*': '*',
        '/': '/',
      };
      clause.returnExpressions = [
        ...(clause.returnExpressions || []),
        { type: 'operator', value: opMap[operatorMatch] },
      ];
      clause.returnInputValue = '';
    } else {
      clause.returnInputValue = value;
    }

    const atIndex = (clause.returnInputValue || '').lastIndexOf('@');
    const shouldShow = atIndex !== -1;
    clause.returnShowAutocomplete = shouldShow;
    if (shouldShow) clause.returnAutocompleteIndex = 0;

    newClauses[index] = clause;
    setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
  };

  const handleReturnKeyDown = (
    index: number,
    event: React.KeyboardEvent
  ): void => {
    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[index] };
    clause.returnError = undefined;
    const currentInput = clause.returnInputValue || '';

    if (event.key === 'Enter') {
      event.preventDefault();

      if (clause.returnShowAutocomplete) {
        const searchText = currentInput.substring(
          currentInput.lastIndexOf('@') + 1
        );
        const options = getPopoverFilteredOptions(searchText);
        const selectedOption = options[clause.returnAutocompleteIndex || 0];
        if (selectedOption) {
          handleReturnAutocompleteSelect(index, selectedOption);
        }
        return;
      }

      if (currentInput.trim() === '(') {
        const anchorEl =
          returnContainerRefs.current[index] || conditionalPopover.anchorEl;
        if (anchorEl) {
          clause.returnInputValue = '';
          newClauses[index] = clause;
          setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
          setBracketPopover({
            rid: conditionalPopover.rid,
            items: [],
            inputValue: '',
            anchorEl,
            source: 'clause-return',
            clauseIndex: index,
          });
        }
        return;
      }

      if (currentInput.trim().startsWith('#')) {
        const manualValue = currentInput.trim().substring(1).trim();
        if (manualValue) {
          clause.returnExpressions = [
            ...(clause.returnExpressions || []),
            { type: 'manual', value: `#${manualValue}` },
          ];
          clause.returnInputValue = '';
        }
      } else if (currentInput.trim() && !isNaN(Number(currentInput.trim()))) {
        const numberInput = currentInput.trim();
        const decimalMatch = numberInput.match(/\.(\d+)$/);
        if (decimalMatch && decimalMatch[1].length > 4) {
          clause.returnError =
            'Maximum of 4 decimal places allowed for numbers';
          newClauses[index] = clause;
          setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
          return;
        }
        clause.returnExpressions = [
          ...(clause.returnExpressions || []),
          { type: 'number', value: numberInput },
        ];
        clause.returnInputValue = '';
      }

      newClauses[index] = clause;
      setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
      return;
    }

    if (clause.returnShowAutocomplete) {
      const searchText = currentInput.substring(
        currentInput.lastIndexOf('@') + 1
      );
      const options = getPopoverFilteredOptions(searchText);
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          clause.returnAutocompleteIndex = Math.min(
            (clause.returnAutocompleteIndex || 0) + 1,
            options.length - 1
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          clause.returnAutocompleteIndex = Math.max(
            (clause.returnAutocompleteIndex || 0) - 1,
            0
          );
          break;
        case 'Escape':
          event.preventDefault();
          clause.returnShowAutocomplete = false;
          break;
      }
      newClauses[index] = clause;
      setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
    }
  };

  const handleReturnAutocompleteSelect = (
    index: number,
    selectedValue: string
  ): void => {
    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[index] };
    clause.returnError = undefined;
    const currentInput = clause.returnInputValue || '';
    const atIndex = currentInput.lastIndexOf('@');
    if (atIndex === -1) return;

    if (!selectedValue.includes('.')) {
      clause.returnInputValue =
        currentInput.substring(0, atIndex) + '@' + selectedValue + '.';
    } else {
      clause.returnExpressions = [
        ...(clause.returnExpressions || []),
        { type: 'chip', value: selectedValue },
      ];
      clause.returnInputValue = '';
      clause.returnShowAutocomplete = false;
    }
    newClauses[index] = clause;
    setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
  };

  const handleReturnRemoveChip = (
    clauseIndex: number,
    chipIndex: number
  ): void => {
    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[clauseIndex] };
    clause.returnError = undefined;
    const newExpressions = [...(clause.returnExpressions || [])];
    newExpressions.splice(chipIndex, 1);
    clause.returnExpressions = newExpressions;
    newClauses[clauseIndex] = clause;
    setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
  };

  // ─── Bracket chip click in clause condition ─────────────────────────────────
  const handleClauseBracketChipClick = (
    clauseIndex: number,
    chipIndex: number
  ): void => {
    const clause = conditionalPopover.clauses[clauseIndex];
    const expression = (clause.expressions || [])[chipIndex];
    if (!expression || expression.type !== 'bracket') return;
    const anchorEl =
      clauseContainerRefs.current[clauseIndex] || conditionalPopover.anchorEl;
    if (anchorEl) {
      setBracketPopover({
        rid: conditionalPopover.rid,
        items: expression.bracketItems || [],
        inputValue: '',
        anchorEl,
        source: 'clause-condition',
        clauseIndex,
        clauseChipEditIndex: chipIndex,
      });
    }
  };

  // ─── Bracket chip click in clause return ───────────────────────────────────
  const handleReturnBracketChipClick = (
    clauseIndex: number,
    chipIndex: number
  ): void => {
    const clause = conditionalPopover.clauses[clauseIndex];
    const expression = (clause.returnExpressions || [])[chipIndex];
    if (!expression || expression.type !== 'bracket') return;
    const anchorEl =
      returnContainerRefs.current[clauseIndex] || conditionalPopover.anchorEl;
    if (anchorEl) {
      setBracketPopover({
        rid: conditionalPopover.rid,
        items: expression.bracketItems || [],
        inputValue: '',
        anchorEl,
        source: 'clause-return',
        clauseIndex,
        clauseChipEditIndex: chipIndex,
      });
    }
  };

  const handleAddElseIf = (): void => {
    setConditionalPopover({
      ...conditionalPopover,
      clauses: [
        ...conditionalPopover.clauses,
        {
          type: 'ELSE_IF',
          condition: '',
          expressions: [],
          inputValue: '',
          result: '',
          returnExpressions: [],
          returnInputValue: '',
        },
      ],
    });
  };

  const handleAddElse = (): void => {
    setConditionalPopover({
      ...conditionalPopover,
      clauses: [
        ...conditionalPopover.clauses,
        {
          type: 'ELSE',
          result: '',
          returnExpressions: [],
          returnInputValue: '',
        },
      ],
    });
  };

  const handleRemoveClause = (index: number): void => {
    const newClauses = [...conditionalPopover.clauses];
    newClauses.splice(index, 1);
    setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
  };

  const handleSave = (): void => {
    const clauses = conditionalPopover.clauses;
    if (clauses.length === 0 || !clauses.some((c) => c.type === 'IF')) {
      setConditionalPopover({
        ...conditionalPopover,
        error: 'Please start the expression with an IF statement',
      });
      return;
    }

    const newClauses = [...clauses];
    let hasValidationErrors = false;
    const payloadParts: string[] = [];

    for (let i = 0; i < newClauses.length; i++) {
      const clause = { ...newClauses[i] };
      clause.error = undefined;
      clause.returnError = undefined;

      // Condition validation
      if (clause.type !== 'ELSE') {
        if (clause.inputValue && clause.inputValue.trim()) {
          clause.error =
            'Invalid text in input field. Use @ for fields or # for manual values.';
          hasValidationErrors = true;
        }

        const expressions = clause.expressions || [];
        if (expressions.length === 0 && !clause.inputValue) {
          clause.error =
            clause.type === 'IF'
              ? 'The IF condition cannot be empty'
              : 'Please enter a condition or remove this ELSE IF block';
          hasValidationErrors = true;
        } else if (expressions.length > 0) {
          expressions.forEach((exp) => {
            if (exp.type === 'number') {
              if (isNaN(Number(exp.value)) || exp.value.trim() === '') {
                clause.error = `Invalid number value: ${exp.value}`;
                hasValidationErrors = true;
              } else {
                const decimalMatch = exp.value.match(/\.(\d+)$/);
                if (decimalMatch && decimalMatch[1].length > 4) {
                  clause.error =
                    'Maximum of 4 decimal places allowed for numbers';
                  hasValidationErrors = true;
                }
              }
            }
          });

          const comparisonOps = ['===', '!==', '>', '<', '>=', '<='];
          const arithmeticOps = ['+', '-', '*', '/', '%'];
          const logicalOps = ['&&', '||'];

          const segments: FieldExpression[][] = [[]];
          expressions.forEach((exp) => {
            if (
              exp.type === 'operator' &&
              (exp.value === '&&' || exp.value === '||')
            ) {
              segments.push([]);
            } else {
              segments[segments.length - 1].push(exp);
            }
          });

          if (segments.some((seg) => seg.length > 0 && seg.length < 3)) {
            clause.error =
              'Each part of the condition must be fully defined (e.g., value === 10)';
            hasValidationErrors = true;
          }

          if (!clause.error) {
            if (expressions[0].type === 'operator') {
              clause.error =
                'A condition cannot start with a operator or (&&, ||) symbol';
              hasValidationErrors = true;
            } else if (
              expressions[expressions.length - 1].type === 'operator'
            ) {
              clause.error =
                'Condition cannot end with a operators or (&&, ||) symbol';
              hasValidationErrors = true;
            } else {
              let conditionComplete = false;
              for (let j = 0; j < expressions.length - 1; j++) {
                const current = expressions[j];
                const next = expressions[j + 1];
                const isCurrentOperator = current.type === 'operator';
                const isNextOperator = next.type === 'operator';

                if (!isCurrentOperator && !isNextOperator) {
                  clause.error =
                    'Please use && or || to connect multiple conditions';
                  hasValidationErrors = true;
                  break;
                }
                if (isCurrentOperator && isNextOperator) {
                  clause.error =
                    'The symbol sequence in the condition is invalid';
                  hasValidationErrors = true;
                  break;
                }
                if (isCurrentOperator) {
                  const opValue = current.value;
                  const isComparison = comparisonOps.includes(opValue);
                  const isArithmetic = arithmeticOps.includes(opValue);
                  const isLogical = logicalOps.includes(opValue);
                  if (conditionComplete && (isComparison || isArithmetic)) {
                    clause.error = `Invalid operator "${opValue}". Use && or || to connect conditions`;
                    hasValidationErrors = true;
                    break;
                  }
                  if ((isComparison || isArithmetic) && !isNextOperator) {
                    if (
                      j + 2 < expressions.length &&
                      expressions[j + 2].type === 'operator'
                    )
                      conditionComplete = true;
                  }
                  if (isLogical) conditionComplete = false;
                }
              }
            }
          }
        }
      }

      // Return field validation
      const returnExpressions = clause.returnExpressions || [];
      const returnInput = clause.returnInputValue || '';
      if (returnInput.trim()) {
        clause.returnError =
          'Invalid text in then field. Use @ for fields or # for manual values.';
        hasValidationErrors = true;
      }
      if (returnExpressions.length === 0 && !returnInput.trim()) {
        clause.returnError = 'Then value is required';
        hasValidationErrors = true;
      } else if (returnExpressions.length > 0) {
        returnExpressions.forEach((exp) => {
          if (exp.type === 'number') {
            if (isNaN(Number(exp.value)) || exp.value.trim() === '') {
              clause.returnError = `Invalid number value: ${exp.value}`;
              hasValidationErrors = true;
            } else {
              const decimalMatch = exp.value.match(/\.(\d+)$/);
              if (decimalMatch && decimalMatch[1].length > 4) {
                clause.returnError =
                  'Maximum of 4 decimal places allowed for numbers';
                hasValidationErrors = true;
              }
            }
          }
        });
        if (!clause.returnError) {
          if (returnExpressions[0].type === 'operator') {
            clause.returnError = 'Then value cannot start with an operator';
            hasValidationErrors = true;
          } else if (
            returnExpressions[returnExpressions.length - 1].type === 'operator'
          ) {
            clause.returnError = 'Then value cannot end with an operator';
            hasValidationErrors = true;
          } else {
            for (let j = 0; j < returnExpressions.length - 1; j++) {
              const current = returnExpressions[j];
              const next = returnExpressions[j + 1];
              if (current.type === 'operator' && next.type === 'operator') {
                clause.returnError = 'Cannot have consecutive operators';
                hasValidationErrors = true;
                break;
              }
              const isCurrentValue = [
                'chip',
                'manual',
                'number',
                'bracket',
              ].includes(current.type);
              const isNextValue = [
                'chip',
                'manual',
                'number',
                'bracket',
              ].includes(next.type);
              if (isCurrentValue && isNextValue) {
                clause.returnError = 'Missing operator between values';
                hasValidationErrors = true;
                break;
              }
            }
          }
        }
      }

      newClauses[i] = clause;
    }

    if (hasValidationErrors) {
      setConditionalPopover({
        ...conditionalPopover,
        clauses: newClauses,
        error: undefined,
      });
      return;
    }

    // Build payload
    const validClauses: ConditionalClause[] = [];
    for (let i = 0; i < newClauses.length; i++) {
      const clause = newClauses[i];

      let conditionStr = '';
      if (clause.type !== 'ELSE') {
        conditionStr = (clause.expressions || [])
          .map((exp) => {
            if (exp.type === 'chip') {
              const [parent, child] = exp.value.split('.', 2);
              return targetOptions[parent]?.[child] || '';
            } else if (exp.type === 'operator') {
              return ` ${exp.value} `;
            } else if (exp.type === 'bracket') {
              return exp.value;
            }
            return exp.value;
          })
          .join('');
      }

      const returnStr = (clause.returnExpressions || [])
        .map((exp) => {
          if (exp.type === 'chip') {
            const [parent, child] = exp.value.split('.', 2);
            return targetOptions[parent]?.[child] || '';
          } else if (exp.type === 'operator') {
            return ` ${exp.value} `;
          } else if (exp.type === 'bracket') {
            return exp.value;
          }
          return exp.value;
        })
        .join('');

      validClauses.push({
        ...clause,
        condition: conditionStr.trim(),
        result: returnStr.trim(),
        expressions: clause.expressions,
        returnExpressions: clause.returnExpressions,
      });

      if (clause.type === 'IF')
        payloadParts.push(
          `IF(${conditionStr.trim()}) { THEN ${returnStr.trim()} }`
        );
      else if (clause.type === 'ELSE_IF')
        payloadParts.push(
          `ELSE IF(${conditionStr.trim()}) { THEN ${returnStr.trim()} }`
        );
      else payloadParts.push(`ELSE { THEN ${returnStr.trim()} }`);
    }

    const payloadValue = payloadParts.join(' ');
    const conditionalExpression: ConditionalExpression = {
      clauses: validClauses,
    };

    setLocalMappings((prev) => {
      const updated = prev.map((m) => {
        if (m.rid === conditionalPopover.rid) {
          const newExpressions = [...(m.fieldExpressions || [])];
          const conditionalExp: FieldExpression = {
            type: 'conditional',
            value: payloadValue,
            conditionalData: conditionalExpression,
          };
          if (conditionalPopover.editingIndex !== undefined) {
            newExpressions[conditionalPopover.editingIndex] = conditionalExp;
          } else {
            newExpressions.push(conditionalExp);
          }
          return {
            ...m,
            fieldExpressions: newExpressions,
            calculation_config: buildCalculationConfig(newExpressions),
            inputValue: '',
          };
        }
        return m;
      });
      onMappingsChange(updated);
      return updated;
    });

    setConditionalPopover(null);
  };

  const handleCancel = (): void => {
    setConditionalPopover(null);
  };

  const renderClauseChip = (
    item: FieldExpression,
    chipIdx: number,
    clauseIndex: number,
    isReturn: boolean
  ) => {
    const onDelete = isReturn
      ? () => handleReturnRemoveChip(clauseIndex, chipIdx)
      : () => handleClauseRemoveChip(clauseIndex, chipIdx);

    if (item.type === 'bracket') {
      const label = `(${buildBracketDisplayLabel(item.bracketItems || [], conditionalPopover.rid)})`;
      return (
        <Tooltip key={chipIdx} title={label} arrow placement='top'>
          <Chip
            label={label}
            size='small'
            variant='outlined'
            onClick={() =>
              isReturn
                ? handleReturnBracketChipClick(clauseIndex, chipIdx)
                : handleClauseBracketChipClick(clauseIndex, chipIdx)
            }
            onDelete={onDelete}
            sx={clauseChipSx('bracket')}
          />
        </Tooltip>
      );
    }

    const title = item.value;
    return (
      <Tooltip key={chipIdx} title={title} arrow placement='top'>
        <Chip
          label={item.value}
          size='small'
          variant='outlined'
          onDelete={onDelete}
          sx={clauseChipSx(item.type, item.value)}
        />
      </Tooltip>
    );
  };

  return (
    <Popover
      open
      anchorEl={conditionalPopover.anchorEl}
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
            width: conditionalPopover.anchorEl
              ? conditionalPopover.anchorEl.clientWidth + 5
              : '500px',
            maxHeight: '700px',
            overflow: 'visible',
            mt: '3px',
          },
        },
      }}
    >
      <div className='flex flex-col p-4 gap-3 bg-[#fff]'>
        {/* Header */}
        <div className='text-sm font-semibold text-gray-700 mb-1'>
          Build (if / else / else if) Condition
        </div>

        <div className='max-h-[250px] overflow-y-auto flex flex-col gap-0 px-1'>
          {conditionalPopover.clauses.map((clause, index) => (
            <div
              key={index}
              className={`flex flex-col gap-2 py-2 px-3 border border-[#CBD6E2] rounded-lg bg-white mb-1 shadow-sm relative ${clause.showAutocomplete || clause.returnShowAutocomplete ? 'z-[100]' : 'z-[1]'}`}
            >
              {/* Remove Button */}
              {clause.type !== 'IF' && (
                <IconButton
                  size='small'
                  onClick={() => handleRemoveClause(index)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    padding: '2px',
                    color: '#dc2626',
                    '&:hover': { backgroundColor: '#fee2e2' },
                  }}
                >
                  <React.Suspense fallback={null}>
                    <CloseIcon className='w-4 h-4 p-0.5' />
                  </React.Suspense>
                </IconButton>
              )}

              {/* Condition Part */}
              {clause.type !== 'ELSE' && (
                <div className='flex flex-col gap-2'>
                  <div className='text-sm font-bold text-gray-800'>
                    {clause.type === 'IF' ? 'if (' : 'else if ('}
                  </div>
                  <div
                    className={`relative ${clause.showAutocomplete ? 'z-[100]' : 'z-[1]'}`}
                  >
                    <div
                      ref={(el) => (clauseContainerRefs.current[index] = el)}
                      className={`w-full min-h-[40px] max-h-[80px] overflow-y-auto px-2 py-1 rounded-[2px] border flex flex-wrap items-start gap-1.5 cursor-text transition-all ${clause.error ? 'border-red-500 bg-[#FEF2F2] focus-within:border-red-500' : 'border-gray-300 bg-white focus-within:border-blue-400'}`}
                      onClick={() => {
                        clauseInputRefs.current[index]?.focus();
                      }}
                    >
                      {(clause.expressions || []).map((item, chipIdx) => (
                        <div key={chipIdx}>
                          {renderClauseChip(item, chipIdx, index, false)}
                        </div>
                      ))}
                      <input
                        ref={(el) => (clauseInputRefs.current[index] = el)}
                        type='text'
                        value={clause.inputValue || ''}
                        onChange={(e) =>
                          handleClauseInputChange(index, e.target.value)
                        }
                        onKeyDown={(e) => handleClauseKeyDown(index, e)}
                        placeholder={
                          (clause.expressions || []).length === 0
                            ? 'Type @ fields, # for IDs, ( for brackets, &&, ||, operators...'
                            : 'Add more...'
                        }
                        className='flex-1 min-w-[120px] rounded-[2px] border-none outline-none bg-transparent text-sm placeholder-gray-400'
                        autoComplete='off'
                      />
                    </div>

                    {/* Clause Autocomplete */}
                    {clause.showAutocomplete &&
                      clauseContainerRefs.current[index] && (
                        <Popover
                          open
                          anchorEl={clauseContainerRefs.current[index]}
                          onClose={() => {
                            const newClauses = [...conditionalPopover.clauses];
                            newClauses[index].showAutocomplete = false;
                            setConditionalPopover({
                              ...conditionalPopover,
                              clauses: newClauses,
                            });
                          }}
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                          }}
                          transformOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                          }}
                          disableAutoFocus
                          disableEnforceFocus
                          slotProps={{
                            paper: {
                              sx: {
                                maxHeight: '200px',
                                width:
                                  (clauseContainerRefs.current[index]
                                    ?.clientWidth ?? 300) + 2,
                                mt: '4px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                border: '1px solid #d1d5db',
                                zIndex: 1300,
                              },
                            },
                          }}
                        >
                          <div className='bg-white max-h-[150px] overflow-y-auto'>
                            {getPopoverFilteredOptions(
                              (clause.inputValue || '').substring(
                                (clause.inputValue || '').lastIndexOf('@') + 1
                              )
                            ).map((option, idx) => (
                              <div
                                key={idx}
                                className='px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-50 last:border-0'
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() =>
                                  handleClauseAutocompleteSelect(index, option)
                                }
                              >
                                {getPopoverDisplayName(option)}
                              </div>
                            ))}
                          </div>
                        </Popover>
                      )}

                    {clause.error && (
                      <div className='text-xs text-red-600 mt-1'>
                        {clause.error}
                      </div>
                    )}
                  </div>
                  <div className='text-sm font-bold text-gray-800'>{` ) {`}</div>
                </div>
              )}

              {clause.type === 'ELSE' && (
                <div className='text-sm font-bold text-gray-800 mb-2'>
                  else {'{'}
                </div>
              )}

              {/* Return Field */}
              <div className='flex flex-col gap-2'>
                <label className='text-sm font-bold text-gray-800'>then</label>
                <div
                  className={`relative ${clause.returnShowAutocomplete ? 'z-[100]' : 'z-[1]'}`}
                >
                  <div
                    ref={(el) => (returnContainerRefs.current[index] = el)}
                    className={`w-full min-h-[40px] max-h-[80px] overflow-y-auto px-2 py-1 rounded-[2px] border flex flex-wrap items-start gap-1.5 cursor-text transition-all ${clause.returnError ? 'border-red-500 bg-[#FEF2F2] focus-within:border-red-500' : 'border-gray-300 bg-white focus-within:border-blue-400'}`}
                    onClick={() => {
                      returnInputRefs.current[index]?.focus();
                    }}
                  >
                    {(clause.returnExpressions || []).map((item, chipIdx) => (
                      <div key={chipIdx}>
                        {renderClauseChip(item, chipIdx, index, true)}
                      </div>
                    ))}
                    <input
                      ref={(el) => (returnInputRefs.current[index] = el)}
                      type='text'
                      value={clause.returnInputValue || ''}
                      onChange={(e) =>
                        handleReturnInputChange(index, e.target.value)
                      }
                      onKeyDown={(e) => handleReturnKeyDown(index, e)}
                      placeholder={
                        (clause.returnExpressions || []).length === 0
                          ? 'Type @ fields, # for IDs, ( for brackets, numbers...'
                          : 'Add more...'
                      }
                      className='flex-1 min-w-[120px] border-none outline-none rounded-[2px] bg-transparent text-sm placeholder-gray-400'
                    />
                  </div>

                  {/* Return Autocomplete */}
                  {clause.returnShowAutocomplete &&
                    returnContainerRefs.current[index] && (
                      <Popover
                        open
                        anchorEl={returnContainerRefs.current[index]}
                        onClose={() => {
                          const newClauses = [...conditionalPopover.clauses];
                          newClauses[index].returnShowAutocomplete = false;
                          setConditionalPopover({
                            ...conditionalPopover,
                            clauses: newClauses,
                          });
                        }}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'left',
                        }}
                        transformOrigin={{
                          vertical: 'top',
                          horizontal: 'left',
                        }}
                        disableAutoFocus
                        disableEnforceFocus
                        slotProps={{
                          paper: {
                            sx: {
                              maxHeight: '200px',
                              width:
                                (returnContainerRefs.current[index]
                                  ?.clientWidth ?? 300) + 2,
                              mt: '4px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                              border: '1px solid #d1d5db',
                              zIndex: 1300,
                            },
                          },
                        }}
                      >
                        <div className='bg-white max-h-[150px] overflow-y-auto'>
                          {getPopoverFilteredOptions(
                            (clause.returnInputValue || '').substring(
                              (clause.returnInputValue || '').lastIndexOf('@') +
                                1
                            )
                          ).map((option, idx) => (
                            <div
                              key={idx}
                              className='px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-50 last:border-0'
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() =>
                                handleReturnAutocompleteSelect(index, option)
                              }
                            >
                              {getPopoverDisplayName(option)}
                            </div>
                          ))}
                        </div>
                      </Popover>
                    )}

                  {clause.returnError && (
                    <div className='text-xs text-red-600 mt-1'>
                      {clause.returnError}
                    </div>
                  )}
                </div>
                <div className='text-sm font-bold text-gray-800'>{'}'}</div>
              </div>
            </div>
          ))}

          {conditionalPopover.error && (
            <div className='text-xs text-red-600 my-1'>
              {conditionalPopover.error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className='flex justify-between items-center'>
          <div className='flex gap-2'>
            <TextButton
              label='else'
              onClick={handleAddElse}
              disabled={conditionalPopover.clauses.some(
                (c) => c.type === 'ELSE'
              )}
              sx={{
                width: '50px',
                minWidth: '50px',
                fontSize: '13px',
                fontWeight: 400,
              }}
            />
            <TextButton
              label='else if'
              onClick={handleAddElseIf}
              disabled={conditionalPopover.clauses.some(
                (c) => c.type === 'ELSE'
              )}
              sx={{
                width: '60px',
                minWidth: '60px',
                fontSize: '13px',
                fontWeight: 400,
              }}
            />
          </div>
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
      </div>
    </Popover>
  );
};

export default ConditionalPopover;
