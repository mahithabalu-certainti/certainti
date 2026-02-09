import React, { useState, useEffect, useRef } from 'react';
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  Popover,
  IconButton,
} from '@mui/material';
import { CloseIcon, ErrorInfoIcon } from '../../../../assets';
import TruncateWithTooltip from '../../../../components/truncate-with-tooltip/truncate-with-tooltip';
import TextButton from '../../../../components/button/text-button';

interface ObjectItem {
  rid: string;
  parent_object: string;
  object_name: string;
  ref_table: string;
  field_name: string | null;
  field_type: 'line-item' | 'table';
}

interface ConditionalClause {
  type: 'IF' | 'ELSE_IF' | 'ELSE';
  condition?: string;
  expressions?: FieldExpression[]; // Store chips for this clause
  inputValue?: string; // Store text input for this clause
  showAutocomplete?: boolean;
  autocompleteIndex?: number;
  result: string;
  error?: string; // Individual error message
}

interface ConditionalExpression {
  clauses: ConditionalClause[];
}

interface FieldExpression {
  type: 'chip' | 'operator' | 'manual' | 'function' | 'number' | 'conditional';
  value: string;
  functionType?: 'MIN' | 'MAX';
  functionArgs?: string[]; // Array of arguments (object RIDs or manual values)
  conditionalData?: ConditionalExpression;
}

interface ObjectRidMap {
  [key: number]: string | number;
}

interface MappingItem {
  rid: string;
  field_label: string;
  field_id: string | null;
  calculation_config: ObjectRidMap | null;
  field_type: 'line-item' | 'table';
  fieldExpressions?: FieldExpression[];
  inputValue?: string;
  fieldIdError?: string;
  targetError?: string;
}

interface MappingTableProps {
  mappings: MappingItem[];
  objectsList: ObjectItem[];
  onMappingsChange: (mappings: MappingItem[]) => void;
  formType?: 'fillable' | 'non-fillable';
}

const MappingTable: React.FC<MappingTableProps> = ({
  mappings,
  objectsList,
  onMappingsChange,
  formType,
}) => {
  const [localMappings, setLocalMappings] = useState<MappingItem[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState<
    Record<string, boolean>
  >({});
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<
    Record<string, number>
  >({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Function popover state
  const [functionPopover, setFunctionPopover] = useState<{
    rid: string;
    type: 'MIN' | 'MAX';
    args: FieldExpression[]; // Store as expressions (chip or manual)
    inputValue: string;
    anchorEl: HTMLElement | null;
    editingIndex?: number; // If editing existing function
    error?: string; // Error message for validation
  } | null>(null);

  const functionPopoverInputRef = useRef<HTMLInputElement | null>(null);
  const clauseInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const clauseContainerRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Conditional popover state
  const [conditionalPopover, setConditionalPopover] = useState<{
    rid: string;
    clauses: ConditionalClause[];
    anchorEl: HTMLElement | null;
    editingIndex?: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (mappings && mappings.length > 0) {
      if (localMappings.length === 0) {
        // INITIALIZATION (First Load)
        // Initialize mappings with fieldExpressions from calculation_config if not present
        const initializedMappings = mappings.map((mapping) => {
          let fieldExpressions = mapping.fieldExpressions || [];

          // If we have calculation_config but no fieldExpressions, convert calculation_config to fieldExpressions
          if (mapping.calculation_config && fieldExpressions.length === 0) {
            const objectRidMap = mapping.calculation_config as ObjectRidMap;
            const sortedKeys = Object.keys(objectRidMap)
              .map(Number)
              .sort((a, b) => a - b);

            fieldExpressions = sortedKeys
              .map((key) => {
                const value = objectRidMap[key];
                const isEven = key % 2 === 0;

                if (isEven) {
                  // Even keys are operators
                  const operatorMap: Record<string, string> = {
                    add: '+',
                    subtract: '-',
                    multiply: '*',
                    divide: '/',
                  };
                  return {
                    type: 'operator' as const,
                    value: operatorMap[value] || value,
                  };
                } else {
                  // Check if this is a MIN or MAX function
                  if (
                    typeof value === 'string' &&
                    (value.startsWith('MIN(') || value.startsWith('MAX('))
                  ) {
                    const functionType = value.startsWith('MIN(')
                      ? 'MIN'
                      : 'MAX';
                    // Extract arguments from MIN(...) or MAX(...)
                    const argsMatch = value.match(/^(MIN|MAX)\((.*)\)$/);
                    if (argsMatch && argsMatch[2]) {
                      const argsString = argsMatch[2];
                      const args = argsString
                        .split(',')
                        .map((arg) => arg.trim());

                      // Convert args to display format
                      const displayArgs = args.map((arg) => {
                        if (arg.startsWith('#')) {
                          return arg; // Manual entry
                        } else {
                          // Object RID - find the corresponding parent.child
                          const objectItem = objectsList.find(
                            (obj) => obj.rid === arg
                          );
                          if (objectItem) {
                            return `@${objectItem.parent_object}.${objectItem.object_name}`;
                          }
                          return arg;
                        }
                      });

                      return {
                        type: 'function' as const,
                        value: `${functionType}(${displayArgs.join(', ')})`,
                        functionType: functionType as 'MIN' | 'MAX',
                        functionArgs: args,
                      };
                    }
                  }

                  // Check if this is a manual entry (starts with #)
                  if (typeof value === 'string' && value.startsWith('#')) {
                    return {
                      type: 'manual' as const,
                      value: value,
                    };
                  }

                  // Check if this is a number entry (numeric value or number type)
                  if (typeof value === 'number') {
                    return {
                      type: 'number' as const,
                      value: value.toString(),
                    };
                  }

                  if (typeof value === 'string') {
                    const numberRegex = /^-?\d+(\.\d+)?$/;
                    if (numberRegex.test(value)) {
                      return {
                        type: 'number' as const,
                        value: value,
                      };
                    }
                  }

                  // Check if this is a conditional expression
                  if (typeof value === 'string' && value.startsWith('IF(')) {
                    // Check if we already have fieldExpressions with conditionalData
                    const existingConditional = mapping.fieldExpressions?.find(
                      (exp) => exp.type === 'conditional' && exp.conditionalData
                    );

                    if (existingConditional?.conditionalData) {
                      // Use existing structured data instead of re-parsing
                      return existingConditional;
                    }

                    // Only parse if we don't have structured data (first-time load from backend)
                    const parseConditionalString = (
                      str: string
                    ): ConditionalClause[] => {
                      const clauses: ConditionalClause[] = [];
                      const regex = /(IF|ELSE IF|ELSE)\((.*?)\)/g;
                      let match;

                      while ((match = regex.exec(str)) !== null) {
                        const type =
                          match[1] === 'ELSE IF'
                            ? 'ELSE_IF'
                            : (match[1] as 'IF' | 'ELSE');
                        const content = match[2];

                        if (type === 'ELSE') {
                          // Skip ELSE() suffix for the builder UI
                          continue;
                        } else {
                          // Tokenizer that preserves #... manual values with spaces
                          const tokenize = (input: string): string[] => {
                            const tokens: string[] = [];
                            let current = '';
                            let inManualValue = false;

                            for (let i = 0; i < input.length; i++) {
                              const char = input[i];

                              if (char === '#' && !inManualValue) {
                                // Start of manual value
                                if (current.trim()) {
                                  tokens.push(current.trim());
                                  current = '';
                                }
                                inManualValue = true;
                                current = char;
                              } else if (char === ' ' && !inManualValue) {
                                // Space outside manual value - token separator
                                if (current.trim()) {
                                  tokens.push(current.trim());
                                  current = '';
                                }
                              } else if (char === ' ' && inManualValue) {
                                // Check if next token is an operator or RID (end of manual value)
                                const remaining = input.substring(i + 1);
                                const nextToken = remaining.split(' ')[0];
                                const isOperator = [
                                  '===',
                                  '!==',
                                  '&&',
                                  '||',
                                  '+',
                                  '-',
                                  '*',
                                  '/',
                                  '%',
                                  '>',
                                  '<',
                                  '>=',
                                  '<=',
                                ].includes(nextToken);
                                const isRid = objectsList.some(
                                  (obj) => obj.rid === nextToken
                                );

                                if (isOperator || isRid) {
                                  // End manual value
                                  if (current.trim()) {
                                    tokens.push(current.trim());
                                    current = '';
                                  }
                                  inManualValue = false;
                                } else {
                                  // Space is part of manual value
                                  current += char;
                                }
                              } else {
                                current += char;
                              }
                            }

                            // Push remaining token
                            if (current.trim()) {
                              tokens.push(current.trim());
                            }

                            return tokens;
                          };

                          const parts = tokenize(content);
                          const expressions: FieldExpression[] = parts
                            .map((part) => {
                              if (!part) return null;

                              // Check if part is an RID
                              const objectItem = objectsList.find(
                                (obj) => obj.rid === part
                              );
                              if (objectItem) {
                                return {
                                  type: 'chip',
                                  value: `${objectItem.parent_object}.${objectItem.object_name}`,
                                };
                              }

                              // Check for operators
                              const isOperator = [
                                '===',
                                '!==',
                                '&&',
                                '||',
                                '+',
                                '-',
                                '*',
                                '/',
                                '%',
                                '>',
                                '<',
                                '>=',
                                '<=',
                              ].includes(part);
                              if (isOperator) {
                                return { type: 'operator', value: part };
                              }

                              // Check for numbers
                              if (!isNaN(Number(part)) && part.trim() !== '') {
                                return { type: 'number', value: part };
                              }

                              // Fallback to manual (includes #... values)
                              return { type: 'manual', value: part };
                            })
                            .filter(Boolean) as FieldExpression[];

                          clauses.push({
                            type,
                            condition: content,
                            result: content,
                            expressions:
                              expressions.length > 0
                                ? expressions
                                : [{ type: 'manual', value: content }],
                            inputValue: '',
                          });
                        }
                      }
                      return clauses;
                    };

                    const clauses = parseConditionalString(value);

                    if (clauses.length > 0) {
                      return {
                        type: 'conditional' as const,
                        value: value,
                        conditionalData: { clauses },
                      };
                    }
                  }

                  // Odd keys are object IDs - find the corresponding parent.child
                  const objectItem = objectsList.find(
                    (obj) => obj.rid === value
                  );
                  if (objectItem) {
                    return {
                      type: 'chip' as const,
                      value: `${objectItem.parent_object}.${objectItem.object_name}`,
                    };
                  }
                  return null;
                }
              })
              .filter(Boolean) as FieldExpression[];
          }

          return {
            ...mapping,
            fieldExpressions,
            inputValue: mapping.inputValue || '',
          };
        });
        setLocalMappings(initializedMappings);
        onMappingsChange(initializedMappings); // Notify parent with fieldExpressions
      } else {
        // UPDATE (Sync Errors)
        // If localMappings exists, sync ONLY the errors from incoming mappings prop
        setLocalMappings((prev) =>
          prev.map((localMap) => {
            const propMap = mappings.find((m) => m.rid === localMap.rid);
            if (propMap) {
              // Only update if errors have changed
              if (
                localMap.fieldIdError !== propMap.fieldIdError ||
                localMap.targetError !== propMap.targetError
              ) {
                return {
                  ...localMap,
                  fieldIdError: propMap.fieldIdError,
                  targetError: propMap.targetError,
                };
              }
            }
            return localMap;
          })
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappings, objectsList, localMappings.length]);

  // Monitor input value changes to update autocomplete
  useEffect(() => {
    localMappings.forEach((mapping) => {
      const inputValue = mapping.inputValue || '';
      const atIndex = inputValue.lastIndexOf('@');

      if (atIndex !== -1) {
        const afterAt = inputValue.substring(atIndex + 1);
        // If we have a dot (parent selected), ensure autocomplete shows children
        if (afterAt.includes('.')) {
          setShowAutocomplete((prev) => ({ ...prev, [mapping.rid]: true }));
        }
      }
    });
  }, [localMappings]);

  // Build hierarchical target options from objectsList
  const targetOptions = React.useMemo(() => {
    const options: Record<string, Record<string, string>> = {};

    if (!Array.isArray(objectsList)) {
      return options;
    }

    objectsList.forEach((item) => {
      if (!options[item.parent_object]) {
        options[item.parent_object] = {};
      }
      options[item.parent_object][item.object_name] = item.rid;
    });

    return options;
  }, [objectsList]);

  const buildCalculationConfig = (
    expressions: FieldExpression[]
  ): ObjectRidMap | null => {
    const objectRidMap: ObjectRidMap = {};
    let currentIndex = 1;

    expressions.forEach((exp) => {
      if (exp.type === 'chip') {
        const [parent, child] = exp.value.split('.', 2);
        const objectId = targetOptions[parent]?.[child] || '';
        if (objectId) {
          objectRidMap[currentIndex] = objectId;
          currentIndex += 2;
        }
      } else if (exp.type === 'manual') {
        objectRidMap[currentIndex] = exp.value;
        currentIndex += 2;
      } else if (exp.type === 'number') {
        objectRidMap[currentIndex] = parseFloat(exp.value);
        currentIndex += 2;
      } else if (exp.type === 'function') {
        if (exp.functionType && exp.functionArgs) {
          const funcStr = `${exp.functionType}(${exp.functionArgs.join(', ')})`;
          objectRidMap[currentIndex] = funcStr;
          currentIndex += 2;
        }
      } else if (exp.type === 'conditional') {
        objectRidMap[currentIndex] = exp.value;
        currentIndex += 2;
      } else if (exp.type === 'operator') {
        if (currentIndex > 1) {
          const operatorMap: Record<string, string> = {
            '+': 'add',
            '-': 'subtract',
            '*': 'multiply',
            '/': 'divide',
          };
          objectRidMap[currentIndex - 1] = operatorMap[exp.value] || exp.value;
        }
      }
    });

    return Object.keys(objectRidMap).length > 0 ? objectRidMap : null;
  };

  const handleFieldIdChange = (rid: string, value: string): void => {
    const updatedMappings = localMappings.map((mapping) => {
      if (mapping.rid === rid) {
        // Only clear fieldIdError if it exists, don't validate
        return { ...mapping, field_id: value, fieldIdError: undefined };
      }
      return mapping;
    });
    setLocalMappings(updatedMappings);
    onMappingsChange(updatedMappings);
  };

  const handleInputChange = (rid: string, value: string): void => {
    const lastChar = value.slice(-1);
    const isOperator = ['+', '-', '*', '/'].includes(lastChar);

    if (isOperator && value.length === 1) {
      setLocalMappings((prev) => {
        const updated = prev.map((mapping) => {
          if (mapping.rid === rid) {
            const newExpressions = [
              ...(mapping.fieldExpressions || []),
              { type: 'operator' as const, value: lastChar },
            ];

            // Rebuild ObjectRidMap from expressions
            return {
              ...mapping,
              fieldExpressions: newExpressions,
              calculation_config: buildCalculationConfig(newExpressions),
              targetError: undefined,
              inputValue: '',
            };
          }
          return mapping;
        });
        onMappingsChange(updated);
        return updated;
      });
      return;
    }

    setLocalMappings((prev) =>
      prev.map((mapping) => {
        if (mapping.rid === rid) {
          return { ...mapping, inputValue: value, targetError: undefined };
        }
        return mapping;
      })
    );

    const atIndex = value.lastIndexOf('@');
    const shouldShow = atIndex !== -1 && atIndex >= 0;
    setShowAutocomplete((prev) => ({ ...prev, [rid]: shouldShow }));
    setSelectedOptionIndex((prev) => ({ ...prev, [rid]: 0 }));

    // Update parent component
    const updated = localMappings.map((m) =>
      m.rid === rid ? { ...m, inputValue: value, targetError: undefined } : m
    );
    onMappingsChange(updated);
  };

  const handleInputBlur = (rid: string): void => {
    setTimeout(() => {
      setShowAutocomplete((prev) => ({ ...prev, [rid]: false }));
    }, 150);
  };

  const handleAutocompleteSelect = (
    rid: string,
    selectedValue: string
  ): void => {
    const mapping = localMappings.find((m) => m.rid === rid);
    if (!mapping) return;

    const currentInput = mapping.inputValue || '';
    const atIndex = currentInput.lastIndexOf('@');

    if (atIndex !== -1) {
      // Check if selectedValue contains a dot (parent.child format)
      // If it has a dot, it's a complete selection; if not, it's just a parent
      const isCompleteProperty = selectedValue.includes('.');

      if (!isCompleteProperty) {
        // User selected a parent, add dot and show children
        const newInputValue =
          currentInput.substring(0, atIndex + 1) + selectedValue + '.';

        // Update the mapping with new input value
        const updatedMappings = localMappings.map((m) => {
          if (m.rid === rid) {
            return {
              ...m,
              inputValue: newInputValue,
            };
          }
          return m;
        });

        setLocalMappings(updatedMappings);

        // Ensure autocomplete stays open
        setShowAutocomplete((prev) => ({ ...prev, [rid]: true }));
        setSelectedOptionIndex((prev) => ({ ...prev, [rid]: 0 }));

        return;
      }

      // Complete selection - add as chip (normal mode)
      const beforeAt = currentInput.substring(0, atIndex).trim();
      setLocalMappings((prev) => {
        const updated = prev.map((m) => {
          if (m.rid === rid) {
            const newExpressions = [...(m.fieldExpressions || [])];

            if (beforeAt && ['+', '-', '*', '/'].includes(beforeAt)) {
              newExpressions.push({
                type: 'operator' as const,
                value: beforeAt,
              });
            }

            newExpressions.push({
              type: 'chip' as const,
              value: selectedValue,
            });

            // Build ObjectRidMap from expressions
            return {
              ...m,
              fieldExpressions: newExpressions,
              inputValue: '',
              calculation_config: buildCalculationConfig(newExpressions),
              targetError: undefined, // Clear targetError when user makes changes
            };
          }
          return m;
        });
        onMappingsChange(updated);
        return updated;
      });
    }

    setShowAutocomplete((prev) => ({ ...prev, [rid]: false }));
  };

  const removeChip = (rid: string, indexToRemove: number): void => {
    setLocalMappings((prev) => {
      const updated = prev.map((mapping) => {
        if (mapping.rid === rid) {
          const newExpressions = (mapping.fieldExpressions || []).filter(
            (_, index) => index !== indexToRemove
          );

          // Rebuild ObjectRidMap from remaining expressions
          return {
            ...mapping,
            fieldExpressions: newExpressions,
            calculation_config: buildCalculationConfig(newExpressions),
            targetError: undefined, // Clear targetError when user makes changes
          };
        }
        return mapping;
      });
      onMappingsChange(updated);
      return updated;
    });
  };

  const removeOperator = (rid: string, indexToRemove: number): void => {
    setLocalMappings((prev) => {
      const updated = prev.map((mapping) => {
        if (mapping.rid === rid) {
          const newExpressions = (mapping.fieldExpressions || []).filter(
            (_, index) => index !== indexToRemove
          );

          // Rebuild ObjectRidMap from remaining expressions
          return {
            ...mapping,
            fieldExpressions: newExpressions,
            calculation_config: buildCalculationConfig(newExpressions),
            targetError: undefined, // Clear targetError when user makes changes
          };
        }
        return mapping;
      });
      onMappingsChange(updated);
      return updated;
    });
  };

  const handleKeyDown = (rid: string, event: React.KeyboardEvent): void => {
    const mapping = localMappings.find((m) => m.rid === rid);
    const currentInput = mapping?.inputValue || '';

    // Check if user typed MIN or MAX and pressed Enter
    if (event.key === 'Enter') {
      const functionInput = currentInput.trim().toUpperCase();

      if (functionInput === 'MIN' || functionInput === 'MAX') {
        event.preventDefault();

        // Open function popover
        const containerElement = containerRefs.current[rid];
        if (containerElement) {
          setFunctionPopover({
            rid,
            type: functionInput as 'MIN' | 'MAX',
            args: [],
            inputValue: '',
            anchorEl: containerElement,
          });

          // Don't clear the main input - keep MIN/MAX visible
        }
        return;
      }

      // Check if user typed IF and pressed Enter
      if (functionInput === 'IF') {
        event.preventDefault();

        // Open conditional popover
        const containerElement = containerRefs.current[rid];
        if (containerElement) {
          setConditionalPopover({
            rid,
            clauses: [
              {
                type: 'IF',
                condition: '',
                expressions: [],
                inputValue: '',
                result: '',
              },
            ],
            anchorEl: containerElement,
          });
        }
        return;
      }

      // Handle manual entry mode (when input starts with # and NOT in popover)
      if (currentInput.trim().startsWith('#')) {
        event.preventDefault();
        const manualValue = currentInput.trim();

        if (manualValue.length > 1) {
          // Must have content after #
          setLocalMappings((prev) => {
            const updated = prev.map((m) => {
              if (m.rid === rid) {
                const newExpressions = [...(m.fieldExpressions || [])];

                newExpressions.push({
                  type: 'manual' as const,
                  value: manualValue,
                });

                // Build ObjectRidMap from expressions
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
        }
        return;
      }

      // Handle number entry (when input is a valid number)
      const numberInput = currentInput.trim();
      // Regex: optional minus, digits, optional decimal with any number of places
      const numberRegex = /^-?\d+(\.\d+)?$/;

      if (numberRegex.test(numberInput)) {
        event.preventDefault();
        const numberValue = numberInput;

        setLocalMappings((prev) => {
          const updated = prev.map((m) => {
            if (m.rid === rid) {
              const newExpressions = [...(m.fieldExpressions || [])];

              newExpressions.push({
                type: 'number' as const,
                value: numberValue,
              });

              // Build ObjectRidMap from expressions
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
        return;
      }
    }

    if (!showAutocomplete[rid]) return;

    const options = getFilteredOptions(rid);
    const currentIndex = selectedOptionIndex[rid] || 0;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedOptionIndex((prev) => ({
          ...prev,
          [rid]: Math.min(currentIndex + 1, options.length - 1),
        }));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedOptionIndex((prev) => ({
          ...prev,
          [rid]: Math.max(currentIndex - 1, 0),
        }));
        break;
      case 'Enter':
        event.preventDefault();
        if (options[currentIndex]) {
          handleAutocompleteSelect(rid, options[currentIndex]);
        }
        break;
      case 'Escape': {
        const mapping = localMappings.find((m) => m.rid === rid);
        if (mapping) {
          const currentInput = mapping.inputValue || '';
          const atIndex = currentInput.lastIndexOf('@');

          if (atIndex !== -1) {
            const afterAt = currentInput.substring(atIndex + 1);
            const dotCount = (afterAt.match(/\./g) || []).length;

            if (afterAt && (dotCount < 1 || afterAt.endsWith('.'))) {
              setLocalMappings((prev) =>
                prev.map((m) => {
                  if (m.rid === rid) {
                    return { ...m, inputValue: '' };
                  }
                  return m;
                })
              );
            }
          }
        }

        setShowAutocomplete((prev) => ({ ...prev, [rid]: false }));
        break;
      }
    }
  };

  // Function popover handlers
  const handleFunctionPopoverInputChange = (value: string): void => {
    if (!functionPopover) return;

    setFunctionPopover({
      ...functionPopover,
      inputValue: value,
      error: undefined, // Clear error when user types
    });
  };

  const handleFunctionPopoverAutocompleteSelect = (
    selectedValue: string
  ): void => {
    if (!functionPopover) return;

    const isCompleteProperty = selectedValue.includes('.');

    if (!isCompleteProperty) {
      // User selected a parent, add dot
      const atIndex = functionPopover.inputValue.lastIndexOf('@');
      if (atIndex !== -1) {
        const newInputValue =
          functionPopover.inputValue.substring(0, atIndex + 1) +
          selectedValue +
          '.';
        setFunctionPopover({
          ...functionPopover,
          inputValue: newInputValue,
        });
      }
      return;
    }

    // Complete selection - add as chip
    const [parent, child] = selectedValue.split('.', 2);
    const objectId = targetOptions[parent]?.[child] || '';

    if (objectId) {
      setFunctionPopover({
        ...functionPopover,
        args: [
          ...functionPopover.args,
          { type: 'chip' as const, value: selectedValue },
        ],
        inputValue: '',
        error: undefined, // Clear error when adding chip
      });
    }
  };

  const handleFunctionPopoverKeyDown = (event: React.KeyboardEvent): void => {
    if (!functionPopover) return;

    const currentInput = functionPopover.inputValue;

    // Handle manual entry
    if (event.key === 'Enter' && currentInput.trim().startsWith('#')) {
      event.preventDefault();
      const manualValue = currentInput.trim();

      if (manualValue.length > 1) {
        setFunctionPopover({
          ...functionPopover,
          args: [
            ...functionPopover.args,
            { type: 'manual' as const, value: manualValue },
          ],
          inputValue: '',
          error: undefined, // Clear error when adding manual entry
        });
      }
      return;
    }

    // Handle autocomplete navigation
    const atIndex = currentInput.lastIndexOf('@');
    if (atIndex === -1) return;

    const searchText = currentInput.substring(atIndex + 1);
    const options = getPopoverFilteredOptions(searchText);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        // Handle arrow down for autocomplete
        break;
      case 'ArrowUp':
        event.preventDefault();
        // Handle arrow up for autocomplete
        break;
      case 'Enter':
        event.preventDefault();
        if (options.length > 0) {
          handleFunctionPopoverAutocompleteSelect(options[0]);
        }
        break;
    }
  };

  const getPopoverFilteredOptions = (searchText: string): string[] => {
    const rid = functionPopover?.rid || conditionalPopover?.rid;
    if (!rid) return [];

    // Reuse main getFilteredOptions function with custom search text
    return getFilteredOptions(rid, searchText);
  };

  const getPopoverDisplayName = (option: string): string => {
    const rid = functionPopover?.rid || conditionalPopover?.rid;
    if (!rid) return option;

    // Reuse main getDisplayName function
    return getDisplayName(option, rid);
  };

  const removeFunctionPopoverChip = (indexToRemove: number): void => {
    if (!functionPopover) return;

    setFunctionPopover({
      ...functionPopover,
      args: functionPopover.args.filter((_, index) => index !== indexToRemove),
    });
  };

  const handleFunctionPopoverSave = (): void => {
    if (!functionPopover) return;

    // Validate: check for invalid text in input field
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

    // Validate: must have at least 2 arguments
    if (functionPopover.args.length < 2) {
      setFunctionPopover({
        ...functionPopover,
        error: `${functionPopover.type} function requires at least 2 arguments`,
      });
      return;
    }

    // Convert args to payload format (object RIDs or manual values)
    const functionArgs: string[] = functionPopover.args.map((arg) => {
      if (arg.type === 'chip') {
        const [parent, child] = arg.value.split('.', 2);
        return targetOptions[parent]?.[child] || '';
      } else {
        return arg.value; // Manual entry
      }
    });

    // Convert args to display format
    const displayArgs = functionPopover.args.map((arg) => arg.value);

    // Add or update function expression
    setLocalMappings((prev) => {
      const updated = prev.map((m) => {
        if (m.rid === functionPopover.rid) {
          const newExpressions = [...(m.fieldExpressions || [])];

          const functionExpression: FieldExpression = {
            type: 'function' as const,
            value: `${functionPopover.type}(${displayArgs.join(', ')})`,
            functionType: functionPopover.type,
            functionArgs: functionArgs,
          };

          // Check if we're editing an existing function
          if (functionPopover.editingIndex !== undefined) {
            // Replace the existing function
            newExpressions[functionPopover.editingIndex] = functionExpression;
          } else {
            // Add new function
            newExpressions.push(functionExpression);
          }

          // Build ObjectRidMap from expressions
          return {
            ...m,
            fieldExpressions: newExpressions,
            calculation_config: buildCalculationConfig(newExpressions),
            targetError: undefined,
            inputValue: '', // Clear the MIN/MAX text from main input
          };
        }
        return m;
      });
      onMappingsChange(updated);
      return updated;
    });

    // Close popover
    setFunctionPopover(null);
  };

  const handleFunctionPopoverCancel = (): void => {
    setFunctionPopover(null);
  };

  const handleFunctionChipClick = (rid: string, index: number): void => {
    const mapping = localMappings.find((m) => m.rid === rid);
    if (!mapping) return;

    const expression = mapping.fieldExpressions?.[index];
    if (!expression || expression.type !== 'function') return;

    // Convert function args back to FieldExpression format for editing
    const args: FieldExpression[] =
      expression.functionArgs?.map((arg) => {
        if (arg.startsWith('#')) {
          return { type: 'manual' as const, value: arg };
        } else {
          // Find the object by RID
          const objectItem = objectsList.find((obj) => obj.rid === arg);
          if (objectItem) {
            return {
              type: 'chip' as const,
              value: `${objectItem.parent_object}.${objectItem.object_name}`,
            };
          }
          return { type: 'manual' as const, value: arg };
        }
      }) || [];

    const containerElement = containerRefs.current[rid];
    if (containerElement) {
      setFunctionPopover({
        rid,
        type: expression.functionType || 'MIN',
        args,
        inputValue: '',
        anchorEl: containerElement,
        editingIndex: index,
      });
    }
  };

  // Conditional popover handlers - Chip-based building
  const handleClauseInputChange = (index: number, value: string): void => {
    if (!conditionalPopover) return;

    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[index] };

    // Clear error on change
    clause.error = undefined;

    // Check for operators - IMPORTANT: Check longer operators first!
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

    // Don't auto-add if user might be typing a compound operator
    // For example, if value ends with '<', they might be typing '<='
    const potentialCompoundChars = ['<', '>', '=', '!', '&', '|'];
    const lastChar = value.slice(-1);
    const isPotentialCompound = potentialCompoundChars.includes(lastChar);

    // Only check for operator match if:
    // 1. It's not a potential compound start, OR
    // 2. It's a complete multi-char operator
    const operatorMatch = operators.find((op) => value.endsWith(op));

    if (operatorMatch && (!isPotentialCompound || operatorMatch.length > 1)) {
      // Add operator chip
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

    // Check for autocomplete trigger
    const atIndex = value.lastIndexOf('@');
    const shouldShow = atIndex !== -1 && atIndex >= 0;

    clause.inputValue = value;
    clause.showAutocomplete = shouldShow;
    if (shouldShow) {
      clause.autocompleteIndex = 0;
    }

    newClauses[index] = clause;
    setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
  };

  const handleClauseKeyDown = (
    index: number,
    event: React.KeyboardEvent
  ): void => {
    if (!conditionalPopover) return;

    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[index] };
    clause.error = undefined;
    const currentInput = clause.inputValue || '';

    if (event.key === 'Enter') {
      event.preventDefault();

      // 1. Check Autocomplete Selection
      if (clause.showAutocomplete) {
        const options = getPopoverFilteredOptions(
          currentInput.substring(currentInput.lastIndexOf('@') + 1)
        );
        if (options.length > 0) {
          const selectedOption = options[clause.autocompleteIndex || 0];
          handleClauseAutocompleteSelect(index, selectedOption);
          return;
        }
      }

      // 2. Manual Entry (#)
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

      // 3. Number Entry
      const numberInput = currentInput.trim();
      const numberRegex = /^-?\d+(\.\d+)?$/;
      if (numberRegex.test(numberInput)) {
        // Validate max 3 decimal places
        const decimalMatch = numberInput.match(/\.(\d+)$/);
        if (decimalMatch && decimalMatch[1].length > 3) {
          clause.error = 'Maximum of 3 decimal places allowed for numbers';
          newClauses[index] = clause;
          setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
          return;
        }
        clause.expressions = [
          ...(clause.expressions || []),
          { type: 'number', value: numberInput },
        ];
        clause.inputValue = '';
        clause.showAutocomplete = false;
        newClauses[index] = clause;
        setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
        return;
      }

      // 4. Operator Entry (Manual)
      const opInput = currentInput.trim();
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
      ].includes(opInput);
      if (isFullOp) {
        clause.expressions = [
          ...(clause.expressions || []),
          { type: 'operator', value: opInput },
        ];
        clause.inputValue = '';
        clause.showAutocomplete = false;
        newClauses[index] = clause;
        setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
        return;
      }

      // 5. Invalid Input Fallback
      if (currentInput.trim()) {
        clause.error = `Invalid input: "${currentInput.trim()}". Please use @ for fields, # for manual, or enter valid numbers/operators.`;
        newClauses[index] = clause;
        setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
      }
    }

    // Autocomplete Navigation
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
    if (!conditionalPopover) return;
    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[index] };
    clause.error = undefined;
    const currentInput = clause.inputValue || '';

    const atIndex = currentInput.lastIndexOf('@');
    if (atIndex === -1) return;

    const isCompleteProperty = selectedValue.includes('.');

    if (!isCompleteProperty) {
      // Parent selected, append dot and keep autocomplete open
      const newInputValue =
        currentInput.substring(0, atIndex + 1) + selectedValue + '.';
      clause.inputValue = newInputValue;
      // Keep autocomplete open
      clause.showAutocomplete = true;
      clause.autocompleteIndex = 0;
    } else {
      // Complete selection -> Add Chip
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
    if (!conditionalPopover) return;
    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[clauseIndex] };
    clause.error = undefined;

    const newExpressions = [...(clause.expressions || [])];
    newExpressions.splice(chipIndex, 1);

    clause.expressions = newExpressions;
    newClauses[clauseIndex] = clause;
    setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
  };

  const handleAddElseIf = (): void => {
    if (!conditionalPopover) return;

    setConditionalPopover({
      ...conditionalPopover,
      clauses: [
        ...conditionalPopover.clauses,
        {
          type: 'ELSE_IF',
          condition: '',
          expressions: [], // Initialize with empty expressions for the new input
          inputValue: '',
          result: '',
        },
      ],
    });
  };

  const handleRemoveClause = (index: number): void => {
    if (!conditionalPopover) return;

    const newClauses = [...conditionalPopover.clauses];
    newClauses.splice(index, 1);

    setConditionalPopover({
      ...conditionalPopover,
      clauses: newClauses,
    });
  };

  const handleConditionalPopoverSave = (): void => {
    if (!conditionalPopover) return;

    const clauses = conditionalPopover.clauses;

    // Validation: Ensure IF exists
    if (clauses.length === 0 || !clauses.some((c) => c.type === 'IF')) {
      setConditionalPopover({
        ...conditionalPopover,
        error: 'Please start the expression with an IF statement',
      });
      return;
    }

    // Clear loop for validation and payload construction
    const newClauses = [...clauses];
    let hasValidationErrors = false;
    const payloadParts: string[] = [];

    // First pass: Validate ALL clauses and collect errors
    for (let i = 0; i < newClauses.length; i++) {
      const clause = { ...newClauses[i] };
      // Clear previous error
      clause.error = undefined;

      // Rule: Invalid input validation (Check for uncommitted text)
      if (clause.inputValue && clause.inputValue.trim()) {
        clause.error = `Invalid text in input field. Use @ for fields or # for manual values.`;
        hasValidationErrors = true;
      }

      // Validation Logic for Expressions
      const expressions = clause.expressions || [];

      if (expressions.length === 0 && !clause.inputValue) {
        if (clause.type === 'IF') {
          clause.error = 'The IF condition cannot be empty';
          hasValidationErrors = true;
        } else if (clause.type === 'ELSE_IF') {
          clause.error =
            'Please enter a condition or remove this ELSE IF block';
          hasValidationErrors = true;
        }
      } else if (expressions.length > 0) {
        // Rule: Number validation (Check for valid numbers in chips)
        expressions.forEach((exp) => {
          if (exp.type === 'number') {
            if (isNaN(Number(exp.value)) || exp.value.trim() === '') {
              clause.error = `Invalid number value: ${exp.value}`;
              hasValidationErrors = true;
            } else {
              // Validate max 3 decimal places
              const decimalMatch = exp.value.match(/\.(\d+)$/);
              if (decimalMatch && decimalMatch[1].length > 3) {
                clause.error = `Number entries has too many decimal places. Maximum of 3 allowed.`;
                hasValidationErrors = true;
              }
            }
          }
        });

        if (hasValidationErrors) {
          // Continue to collect other errors or stop? Let's keep checking for logic errors.
        }

        // Define operator categories
        const comparisonOps = ['===', '!==', '>', '<', '>=', '<='];
        const arithmeticOps = ['+', '-', '*', '/', '%'];
        const logicalOps = ['&&', '||'];

        // Rule 0: Minimum 3 chips for each sub-condition (split by &&, ||)
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
        // Rule 1: Cannot start with operator
        if (expressions[0].type === 'operator') {
          clause.error =
            'A condition cannot start with a operator or (&&, ||) symbol';
          hasValidationErrors = true;
        }
        // Rule 2: Cannot end with operator
        else if (expressions[expressions.length - 1].type === 'operator') {
          clause.error =
            'Condition cannot end with a operators or (&&, ||) symbol';
          hasValidationErrors = true;
        } else {
          // Sequence Rules with strict operator validation
          let conditionComplete = false; // Track when a complete condition exists (operand + operator + operand)

          for (let j = 0; j < expressions.length - 1; j++) {
            const current = expressions[j];
            const next = expressions[j + 1];

            const isCurrentOperator = current.type === 'operator';
            const isNextOperator = next.type === 'operator';

            const isCurrentOperand = !isCurrentOperator;
            const isNextOperand = !isNextOperator;

            // Rule 3: Operand followed by Operand (Missing Operator)
            if (isCurrentOperand && isNextOperand) {
              clause.error =
                'Please use && or || to connect multiple conditions';
              hasValidationErrors = true;
              break; // Stop checking this clause
            }

            // Rule 4: Operator followed by Operator (Duplicate Operator)
            if (isCurrentOperator && isNextOperator) {
              clause.error = 'The symbol sequence in the condition is invalid';
              hasValidationErrors = true;
              break;
            }

            // NEW Rule 5: Track condition completion and validate operator usage
            if (isCurrentOperator) {
              const opValue = current.value;
              const isComparison = comparisonOps.includes(opValue);
              const isArithmetic = arithmeticOps.includes(opValue);
              const isLogical = logicalOps.includes(opValue);

              // If we already have a complete condition and next operator is not logical
              if (conditionComplete && (isComparison || isArithmetic)) {
                clause.error = `Invalid operator "${opValue}". Use && or || to connect conditions`;
                hasValidationErrors = true;
                break;
              }

              // Mark condition as complete after: operand + (comparison/arithmetic) + operand
              if ((isComparison || isArithmetic) && isNextOperand) {
                // Check if operand after this operator completes the condition
                if (
                  j + 2 < expressions.length &&
                  expressions[j + 2].type === 'operator'
                ) {
                  conditionComplete = true;
                }
              }

              // Reset completion flag after logical operator
              if (isLogical) {
                conditionComplete = false;
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
        error: undefined, // Clear global error
      });
      return;
    }

    // Second pass: Construct Payload (only if no errors)
    const validClauses: ConditionalClause[] = [];
    for (let i = 0; i < newClauses.length; i++) {
      const clause = newClauses[i];
      // Build string from expressions
      const conditionStr = (clause.expressions || [])
        .map((exp) => {
          if (exp.type === 'chip') {
            const [parent, child] = exp.value.split('.', 2);
            const objectId = targetOptions[parent]?.[child] || '';
            return objectId;
          } else if (exp.type === 'operator') {
            return ` ${exp.value} `;
          } else {
            return exp.value;
          }
        })
        .join('');

      if (!conditionStr.trim()) continue;

      const validClause = {
        ...clause,
        condition: conditionStr.trim(),
        result: conditionStr.trim(),
        expressions: clause.expressions,
      };
      validClauses.push(validClause);

      if (clause.type === 'IF') {
        payloadParts.push(`IF(${conditionStr.trim()})`);
      } else if (clause.type === 'ELSE_IF') {
        payloadParts.push(`ELSE IF(${conditionStr.trim()})`);
      }
    }

    // Always append ELSE()
    payloadParts.push('ELSE()');
    const payloadValue = payloadParts.join(' ');

    const conditionalExpression: ConditionalExpression = {
      clauses: validClauses,
    };

    setLocalMappings((prev) => {
      const updated = prev.map((m) => {
        if (m.rid === conditionalPopover.rid) {
          const newExpressions = [...(m.fieldExpressions || [])];

          const conditionalExp: FieldExpression = {
            type: 'conditional' as const,
            value: payloadValue, // This is the string representation like IF(...) ELSE IF(...)
            conditionalData: conditionalExpression,
          };

          if (conditionalPopover.editingIndex !== undefined) {
            newExpressions[conditionalPopover.editingIndex] = conditionalExp;
          } else {
            newExpressions.push(conditionalExp);
          }

          // Build ObjectRidMap for payload from all expressions (sequential odd/even index logic)
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

  const handleConditionalPopoverCancel = (): void => {
    setConditionalPopover(null);
  };

  const handleConditionalChipClick = (rid: string, index: number): void => {
    const mapping = localMappings.find((m) => m.rid === rid);
    if (!mapping) return;

    const expression = mapping.fieldExpressions?.[index];
    if (!expression || expression.type !== 'conditional') return;

    if (!expression.conditionalData) return;

    const containerElement = containerRefs.current[rid];
    if (containerElement) {
      // Load clauses and ensure expressions exist
      const loadedClauses = expression.conditionalData.clauses.map((c) => ({
        ...c,
        // If expressions missing (legacy), convert condition string to manual chip
        expressions:
          c.expressions ||
          (c.condition
            ? [{ type: 'manual' as const, value: c.condition }]
            : []),
        inputValue: '',
        showAutocomplete: false,
        autocompleteIndex: 0,
      }));

      setConditionalPopover({
        rid,
        clauses: loadedClauses,
        anchorEl: containerElement,
        editingIndex: index,
      });
    }
  };

  const getFilteredOptions = (
    rid: string,
    customSearchText?: string
  ): string[] => {
    const mapping = localMappings.find((m) => m.rid === rid);
    if (!mapping) return [];

    let searchText: string;

    if (customSearchText !== undefined) {
      // Called from popover with custom search text
      searchText = customSearchText;
    } else {
      // Called from main field - extract from inputValue
      const currentInput = mapping.inputValue || '';
      const atIndex = currentInput.lastIndexOf('@');

      if (atIndex === -1) return [];

      searchText = currentInput.substring(atIndex + 1);
    }

    const lowerSearchText = searchText.toLowerCase();

    // Filter objectsList by field_type to match the mapping's field_type
    const filteredObjectsList = objectsList.filter(
      (obj) => obj.field_type === mapping.field_type
    );

    // Build targetOptions from filtered objects
    const filteredTargetOptions: Record<string, Record<string, string>> = {};
    filteredObjectsList.forEach((item) => {
      if (!filteredTargetOptions[item.parent_object]) {
        filteredTargetOptions[item.parent_object] = {};
      }
      filteredTargetOptions[item.parent_object][item.object_name] = item.rid;
    });

    if (lowerSearchText === '') {
      const parents = Object.keys(filteredTargetOptions);
      return parents;
    }

    const dotCount = (lowerSearchText.match(/\./g) || []).length;

    if (dotCount >= 1) {
      const [parentKeyLower, childKeyLower = ''] = lowerSearchText.split(
        '.',
        2
      );

      // Find the actual parent key (case-insensitive match)
      const actualParentKey = Object.keys(filteredTargetOptions).find(
        (key) => key.toLowerCase() === parentKeyLower
      );

      if (actualParentKey && filteredTargetOptions[actualParentKey]) {
        const children = filteredTargetOptions[actualParentKey];

        // If childKey is empty (e.g., "Case."), show all children
        if (childKeyLower === '') {
          const allChildren = Object.keys(children).map(
            (child) => `${actualParentKey}.${child}`
          );
          return allChildren;
        }

        // Otherwise filter children based on childKey (case-insensitive)
        const filteredChildren = Object.keys(children).filter((child) =>
          child.toLowerCase().includes(childKeyLower)
        );

        const result = filteredChildren.map(
          (child) => `${actualParentKey}.${child}`
        );
        return result;
      }

      return [];
    }

    // Filter parent objects (case-insensitive)
    const filteredKeys = Object.keys(filteredTargetOptions).filter((key) =>
      key.toLowerCase().includes(lowerSearchText)
    );

    return filteredKeys;
  };

  const getDisplayName = (optionValue: string, rid: string): string => {
    const dotCount = (optionValue.match(/\./g) || []).length;

    if (dotCount === 1) {
      // parent.child format - show as is
      return optionValue;
    } else {
      // parent only - show count of children filtered by field_type
      const mapping = localMappings.find((m) => m.rid === rid);
      if (!mapping) return optionValue;

      // Filter objectsList by field_type to match the mapping's field_type
      const filteredObjectsList = objectsList.filter(
        (obj) => obj.field_type === mapping.field_type
      );

      // Build targetOptions from filtered objects
      const filteredTargetOptions: Record<string, Record<string, string>> = {};
      filteredObjectsList.forEach((item) => {
        if (!filteredTargetOptions[item.parent_object]) {
          filteredTargetOptions[item.parent_object] = {};
        }
        filteredTargetOptions[item.parent_object][item.object_name] = item.rid;
      });

      const parentData = filteredTargetOptions[optionValue];
      if (parentData) {
        const childCount = Object.keys(parentData).length;
        return `${optionValue} (${childCount})`;
      }
      return optionValue;
    }
  };

  return (
    <TableContainer
      sx={{
        boxShadow: 'none',
        overflow: 'auto',
        maxHeight: 'calc(100vh - 290px)',
        minHeight: 'auto',
        height: 'fit-content',
        border: '1px solid #CBD6E2',
        borderRadius: 1,
      }}
    >
      <MuiTable
        stickyHeader
        sx={{
          minWidth: 650,
          height: '100%',
          borderCollapse: 'separate !important',
          borderSpacing: 0,
          '& .MuiTableCell-root': {
            borderBottom: '1px solid #CBD6E2',
            borderRight: '1px solid #CBD6E2',
          },
          '& .MuiTableRow-root:last-child .MuiTableCell-root': {
            borderBottom: 'none',
          },
        }}
        aria-label='data-mapping-table'
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
              borderBottom: '1px solid #CBD6E2 !important',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            },
            '& .MuiTableCell-root:first-of-type': {
              borderTopLeftRadius: '4px',
            },
            '& .MuiTableCell-root:last-child': {
              borderTopRightRadius: '4px',
            },
          }}
        >
          <TableRow>
            <TableCell
              sx={{
                width: formType === 'non-fillable' ? '35%' : '30%',
              }}
            >
              Field Label
            </TableCell>
            {formType !== 'non-fillable' && (
              <TableCell
                sx={{
                  width: '20%',
                }}
                className='flex items-center justify-between'
              >
                <span>Field ID</span>
                <span>
                  <Tooltip
                    title={
                      'Go to "Original Form" tab, select a field to copy its Field ID, then paste it here to map the field.'
                    }
                    arrow
                    placement='top'
                    slotProps={{
                      tooltip: {
                        sx: {
                          mr: 1,
                        },
                      },
                    }}
                  >
                    <span className='h-[21px] w-5 flex items-center justify-center absolute top-1 right-[4px] cursor-pointer'>
                      <React.Suspense fallback={null}>
                        <ErrorInfoIcon
                          alt='error'
                          className='w-5 h-3.5 [&>path]:fill-[#9fa0a1]'
                        />
                      </React.Suspense>
                    </span>
                  </Tooltip>
                </span>
              </TableCell>
            )}
            <TableCell
              sx={{
                width: formType === 'non-fillable' ? '15%' : '10%',
              }}
            >
              Field Type
            </TableCell>
            <TableCell
              sx={{
                width: formType === 'non-fillable' ? '50%' : '40%',
              }}
              className='flex items-center justify-between'
            >
              <span>Target</span>
              <span>
                <Tooltip
                  title={
                    'How to add fields to Target:\n• Type @ to select fields from dropdown (e.g., @Parent.Child)\n• Type # for manual text entry, then press Enter (e.g., #Custom Value)\n• Enter numbers directly, then press Enter (e.g., 10, 10.5, 10.555) - max 3 decimal places\n• Type MIN or MAX for functions, then press Enter\n• Type IF for conditional expressions (IF/ELSE IF), then press Enter\n• Use operators: +, -, *, / between values'
                  }
                  arrow
                  placement='top'
                  slotProps={{
                    tooltip: {
                      sx: {
                        mr: 1,
                        whiteSpace: 'pre-line',
                      },
                    },
                  }}
                >
                  <span className='h-[21px] w-5 flex items-center justify-center absolute top-1 right-[4px] cursor-pointer'>
                    <React.Suspense fallback={null}>
                      <ErrorInfoIcon
                        alt='error'
                        className='w-5 h-3.5 [&>path]:fill-[#9fa0a1]'
                      />
                    </React.Suspense>
                  </span>
                </Tooltip>
              </span>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody
          sx={{
            '& .MuiTableCell-root': {
              fontWeight: 500,
              fontSize: '13px',
              lineHeight: '21px',
              color: '#425A76',
              p: '8px',
              verticalAlign: 'top',
              borderRight: '1px solid #CBD6E2 !important',
              borderBottom: '1px solid #CBD6E2 !important',
            },
            '& .MuiTableRow-root:last-child .MuiTableCell-root': {
              borderBottom: 'none !important',
            },
          }}
        >
          {localMappings.length > 0 &&
            localMappings.map((mapping) => (
              <TableRow key={mapping.rid}>
                <TableCell
                  sx={{ p: '8px', maxHeight: '90px', verticalAlign: 'top' }}
                >
                  <TruncateWithTooltip
                    text={mapping.field_label}
                    maxHeight='90px'
                    tooltipMaxWidth={'20vw'}
                    style={
                      {
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal', // Override default nowrap
                        textOverflow: 'clip', // Override ellipsis for multi-line
                      } as React.CSSProperties
                    }
                  />
                </TableCell>
                {formType !== 'non-fillable' && (
                  <TableCell sx={{ p: '8px' }}>
                    <div
                      className={`flex relative w-full h-full ${mapping.fieldIdError ? 'bg-[#FEF2F2]' : ''}`}
                    >
                      <textarea
                        value={mapping.field_id || ''}
                        onChange={(e) => {
                          handleFieldIdChange(mapping.rid, e.target.value);
                          // auto-grow height
                          e.target.style.height = 'auto';
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        placeholder='Enter Field ID'
                        className={`w-full h-full min-h-[32px] max-h-[90px] px-2 py-1 border rounded-[2px] text-sm outline-none focus:border-2 resize-none overflow-y-auto ${
                          mapping.fieldIdError
                            ? 'border-red-500 bg-[#FEF2F2] focus:border-red-500'
                            : 'border-gray-300 focus:border-blue-400'
                        }`}
                      />
                      {mapping.fieldIdError && (
                        <Tooltip
                          title={mapping.fieldIdError}
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
                          <span className='h-[26px] w-5 flex items-center justify-center absolute top-[1px] bg-[#FEF2F2] right-[4px] cursor-pointer'>
                            <React.Suspense fallback={null}>
                              <ErrorInfoIcon
                                alt='error'
                                className='w-5 h-3.5'
                              />
                            </React.Suspense>
                          </span>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                )}
                <TableCell sx={{ p: '8px' }}>
                  <span className='text-[13px] font-medium text-[#425A76] capitalize'>
                    {mapping.field_type}
                  </span>
                </TableCell>
                <TableCell
                  sx={{
                    position: 'relative',
                    overflow: 'visible',
                    p: '8px',
                  }}
                >
                  <div className='relative h-full'>
                    <div className='relative w-full h-full'>
                      <div
                        ref={(el) => (containerRefs.current[mapping.rid] = el)}
                        className={`w-full h-full max-h-[90px] overflow-y-auto px-2 py-1 border rounded-[2px] flex flex-wrap items-start gap-1 cursor-text ${
                          mapping.targetError
                            ? 'border-red-500 bg-[#FEF2F2] border-2 pr-8'
                            : functionPopover?.rid === mapping.rid ||
                                conditionalPopover?.rid === mapping.rid
                              ? 'border-blue-400 bg-white border-2'
                              : 'border-gray-300 bg-white focus-within:border-2 focus-within:border-blue-400'
                        }`}
                        onClick={() => {
                          inputRefs.current[mapping.rid]?.focus();
                        }}
                      >
                        {(mapping.fieldExpressions || []).map((item, idx) => (
                          <div key={idx} className='flex items-center'>
                            {item.type === 'chip' ? (
                              <Tooltip
                                title={getDisplayName(item.value, mapping.rid)}
                                arrow
                                placement='top'
                              >
                                <Chip
                                  label={getDisplayName(
                                    item.value,
                                    mapping.rid
                                  )}
                                  size='small'
                                  variant='outlined'
                                  onDelete={() => removeChip(mapping.rid, idx)}
                                  sx={{
                                    fontSize: '11px',
                                    height: '20px',
                                    maxWidth: '200px',
                                    backgroundColor: '#f0f9ff',
                                    borderColor: '#0176D3',
                                    color: '#0176D3',
                                    margin: '1px',
                                    '& .MuiChip-deleteIcon': {
                                      fontSize: '14px',
                                      color: '#0176D3',
                                      '&:hover': {
                                        color: '#ef4444',
                                      },
                                    },
                                    '& .MuiChip-label': {
                                      paddingLeft: '6px',
                                      paddingRight: '6px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    },
                                  }}
                                />
                              </Tooltip>
                            ) : item.type === 'manual' ? (
                              <Tooltip title={item.value} arrow placement='top'>
                                <Chip
                                  label={item.value}
                                  size='small'
                                  variant='outlined'
                                  onDelete={() => removeChip(mapping.rid, idx)}
                                  sx={{
                                    fontSize: '11px',
                                    height: '20px',
                                    maxWidth: '200px',
                                    backgroundColor: '#f0fdf4',
                                    borderColor: '#22c55e',
                                    color: '#16a34a',
                                    margin: '1px',
                                    '& .MuiChip-deleteIcon': {
                                      fontSize: '14px',
                                      color: '#16a34a',
                                      '&:hover': {
                                        color: '#ef4444',
                                      },
                                    },
                                    '& .MuiChip-label': {
                                      paddingLeft: '6px',
                                      paddingRight: '6px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    },
                                  }}
                                />
                              </Tooltip>
                            ) : item.type === 'function' ? (
                              <Tooltip title={item.value} arrow placement='top'>
                                <Chip
                                  label={item.value}
                                  size='small'
                                  variant='outlined'
                                  onClick={() =>
                                    handleFunctionChipClick(mapping.rid, idx)
                                  }
                                  onDelete={() => removeChip(mapping.rid, idx)}
                                  sx={{
                                    fontSize: '11px',
                                    height: '20px',
                                    maxWidth: '200px',
                                    backgroundColor: '#f3e8ff',
                                    borderColor: '#9333ea',
                                    color: '#7e22ce',
                                    margin: '1px',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      backgroundColor: '#e9d5ff',
                                    },
                                    '& .MuiChip-deleteIcon': {
                                      fontSize: '14px',
                                      color: '#7e22ce',
                                      '&:hover': {
                                        color: '#ef4444',
                                      },
                                    },
                                    '& .MuiChip-label': {
                                      paddingLeft: '6px',
                                      paddingRight: '6px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    },
                                  }}
                                />
                              </Tooltip>
                            ) : item.type === 'number' ? (
                              <Tooltip title={item.value} arrow placement='top'>
                                <Chip
                                  label={item.value}
                                  size='small'
                                  variant='outlined'
                                  onDelete={() => removeChip(mapping.rid, idx)}
                                  sx={{
                                    fontSize: '11px',
                                    height: '20px',
                                    maxWidth: '200px',
                                    backgroundColor: '#fff7ed',
                                    borderColor: '#f97316',
                                    color: '#ea580c',
                                    margin: '1px',
                                    '& .MuiChip-deleteIcon': {
                                      fontSize: '14px',
                                      color: '#ea580c',
                                      '&:hover': {
                                        color: '#ef4444',
                                      },
                                    },
                                    '& .MuiChip-label': {
                                      paddingLeft: '6px',
                                      paddingRight: '6px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    },
                                  }}
                                />
                              </Tooltip>
                            ) : item.type === 'conditional' ? (
                              <Tooltip title={item.value} arrow placement='top'>
                                <Chip
                                  label={item.value}
                                  size='small'
                                  variant='outlined'
                                  onClick={() =>
                                    handleConditionalChipClick(mapping.rid, idx)
                                  }
                                  onDelete={() => removeChip(mapping.rid, idx)}
                                  sx={{
                                    fontSize: '11px',
                                    height: '20px',
                                    maxWidth: '200px',
                                    backgroundColor: '#fdf2f8',
                                    borderColor: '#f472b6',
                                    color: '#9d174d',
                                    margin: '1px',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      backgroundColor: '#cffafe',
                                    },
                                    '& .MuiChip-deleteIcon': {
                                      fontSize: '14px',
                                      color: '#9d174d',
                                      '&:hover': {
                                        color: '#ef4444',
                                      },
                                    },
                                    '& .MuiChip-label': {
                                      paddingLeft: '6px',
                                      paddingRight: '6px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    },
                                  }}
                                />
                              </Tooltip>
                            ) : (
                              <Chip
                                label={item.value}
                                size='small'
                                variant='outlined'
                                onDelete={() =>
                                  removeOperator(mapping.rid, idx)
                                }
                                sx={{
                                  fontSize: '14px',
                                  height: '20px',
                                  maxWidth: '60px',
                                  backgroundColor: '#f7fa3245',
                                  borderColor: '#b9bb3dff',
                                  color: '#000',
                                  margin: '1px',
                                  '& .MuiChip-deleteIcon': {
                                    fontSize: '14px',
                                    color: '#616220ff',
                                    '&:hover': {
                                      color: '#ef4444',
                                    },
                                  },
                                  '& .MuiChip-label': {
                                    paddingLeft: '6px',
                                    paddingRight: '6px',
                                    paddingBottom:
                                      item.value === '*' ? '0px' : '2px',
                                    paddingTop:
                                      item.value === '*' ? '6px' : '0px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  },
                                }}
                              />
                            )}
                          </div>
                        ))}

                        <input
                          ref={(el) => (inputRefs.current[mapping.rid] = el)}
                          type='text'
                          value={mapping.inputValue || ''}
                          onChange={(e) =>
                            handleInputChange(mapping.rid, e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(mapping.rid, e)}
                          onBlur={() => handleInputBlur(mapping.rid)}
                          placeholder={
                            (mapping.fieldExpressions || []).length === 0
                              ? 'Type @ fields, # manual, numbers, MIN/MAX, IF/ELSE IF or +, -, *, / for operators'
                              : 'Add more...'
                          }
                          className='flex-1 min-w-0 border-none outline-none rounded-[2px] bg-transparent text-sm placeholder-gray-400 align-top'
                          style={{ minWidth: '80px' }}
                        />
                      </div>

                      {mapping.targetError && (
                        <Tooltip
                          title={mapping.targetError}
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
                          <span className='h-[24px] w-5 flex items-center justify-center absolute top-[2px] right-[4px] bg-[#FEF2F2] cursor-pointer'>
                            <React.Suspense fallback={null}>
                              <ErrorInfoIcon
                                alt='error'
                                className='w-5 h-3.5'
                              />
                            </React.Suspense>
                          </span>
                        </Tooltip>
                      )}
                    </div>

                    {showAutocomplete[mapping.rid] &&
                      getFilteredOptions(mapping.rid).length > 0 && (
                        <div
                          className='absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto'
                          style={{
                            zIndex: 9999,
                            maxHeight: '150px',
                          }}
                        >
                          {getFilteredOptions(mapping.rid).map(
                            (option, idx) => {
                              return (
                                <div
                                  key={idx}
                                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 hover:text-blue-800`}
                                  onMouseEnter={() =>
                                    setSelectedOptionIndex((prev) => ({
                                      ...prev,
                                      [mapping.rid]: idx,
                                    }))
                                  }
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() =>
                                    handleAutocompleteSelect(
                                      mapping.rid,
                                      option
                                    )
                                  }
                                >
                                  {getDisplayName(option, mapping.rid)}
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          {localMappings.length === 0 && (
            <TableRow sx={{ height: '32px' }}>
              <TableCell colSpan={4} align='center'>
                <span>No data available</span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </MuiTable>

      {/* Function Popover Dialog */}
      <Popover
        open={Boolean(functionPopover)}
        anchorEl={functionPopover?.anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        TransitionProps={{
          timeout: 0, // Remove animation for instant appearance
        }}
        slotProps={{
          paper: {
            sx: {
              width: functionPopover?.anchorEl
                ? functionPopover.anchorEl.clientWidth + 5
                : '450px',
              maxHeight: '400px',
              overflow: 'visible',
              mt: '3px',
            },
          },
        }}
      >
        {functionPopover && (
          <div className='flex flex-col p-4 gap-3'>
            {/* Header */}
            <div className='text-sm font-semibold text-gray-700'>
              Build {functionPopover.type} Function
            </div>

            {/* Field Container - Same as Target Field */}
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
                      key={idx}
                      label={arg.value}
                      size='small'
                      variant='outlined'
                      onDelete={() => removeFunctionPopoverChip(idx)}
                      sx={{
                        fontSize: '11px',
                        height: '20px',
                        maxWidth: '200px',
                        backgroundColor:
                          arg.type === 'chip' ? '#f0f9ff' : '#f0fdf4',
                        borderColor:
                          arg.type === 'chip' ? '#0176D3' : '#22c55e',
                        color: arg.type === 'chip' ? '#0176D3' : '#16a34a',
                        margin: '1px',
                        '& .MuiChip-deleteIcon': {
                          fontSize: '14px',
                          color: arg.type === 'chip' ? '#0176D3' : '#16a34a',
                          '&:hover': {
                            color: '#ef4444',
                          },
                        },
                        '& .MuiChip-label': {
                          paddingLeft: '6px',
                          paddingRight: '6px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        },
                      }}
                    />
                  </Tooltip>
                ))}

                {/* Input Field */}
                <input
                  ref={functionPopoverInputRef}
                  type='text'
                  value={functionPopover.inputValue}
                  onChange={(e) =>
                    handleFunctionPopoverInputChange(e.target.value)
                  }
                  onKeyDown={handleFunctionPopoverKeyDown}
                  placeholder={
                    functionPopover.args.length === 0
                      ? 'Type @ to add fields or # for manual entry'
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
                      onClick={() =>
                        handleFunctionPopoverAutocompleteSelect(option)
                      }
                    >
                      {getPopoverDisplayName(option)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {functionPopover.error && (
              <div className='text-xs text-red-600 -mt-1.5'>
                {functionPopover.error}
              </div>
            )}

            {/* Action Buttons */}
            <div className='flex justify-end gap-2'>
              <TextButton
                label='Cancel'
                onClick={handleFunctionPopoverCancel}
                sx={{
                  width: '70px',
                  minWidth: '70px',
                  fontSize: '13px',
                  fontWeight: 400,
                }}
              />
              <TextButton
                label='Save'
                onClick={handleFunctionPopoverSave}
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
        )}
      </Popover>

      {/* Conditional Popover Dialog */}
      <Popover
        open={Boolean(conditionalPopover)}
        anchorEl={conditionalPopover?.anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        TransitionProps={{
          timeout: 0,
        }}
        slotProps={{
          paper: {
            sx: {
              width: conditionalPopover?.anchorEl
                ? conditionalPopover.anchorEl.clientWidth + 5
                : '500px',
              maxHeight: '600px',
              overflow: 'visible',
              mt: '3px',
            },
          },
        }}
      >
        {conditionalPopover && (
          <div className='flex flex-col p-4 gap-3'>
            {/* Header */}
            <div className='text-sm font-semibold text-gray-700'>
              {`Build (IF / ELSE IF) Condition`}
            </div>

            <div className='max-h-[250px] overflow-y-auto flex flex-col gap-3 px-1'>
              {conditionalPopover.clauses.map((clause, index) => (
                <div
                  key={index}
                  className={`flex flex-col gap-1 ${clause.showAutocomplete ? 'z-[100]' : 'z-[1]'}`}
                >
                  <div className='flex items-center justify-between'>
                    <label
                      className={`text-xs font-bold text-gray-700 ${clause.type === 'IF' ? '' : 'mt-2'}`}
                    >
                      {clause.type === 'IF'
                        ? 'IF'
                        : clause.type === 'ELSE_IF'
                          ? 'ELSE IF'
                          : 'ELSE'}
                    </label>
                    {clause.type === 'ELSE_IF' && (
                      <IconButton
                        size='small'
                        onClick={() => handleRemoveClause(index)}
                        sx={{
                          padding: '2px',
                          color: '#dc2626',
                          '&:hover': {
                            backgroundColor: '#fee2e2',
                          },
                        }}
                      >
                        <React.Suspense fallback={null}>
                          <CloseIcon className='w-4 h-4 p-0.5' />
                        </React.Suspense>
                      </IconButton>
                    )}
                  </div>

                  <div
                    className={`relative ${clause.showAutocomplete ? 'z-[100]' : 'z-[1]'}`}
                  >
                    <div
                      ref={(el) => (clauseContainerRefs.current[index] = el)}
                      className={`w-full min-h-[40px] max-h-[120px] overflow-y-auto px-2 py-1 border rounded-[2px] flex flex-wrap items-start gap-1 cursor-text focus-within:border-2 ${
                        clause.error
                          ? 'border-red-500 bg-[#FEF2F2] focus-within:border-red-500'
                          : 'border-gray-300 bg-white focus-within:border-blue-400'
                      }`}
                      onClick={() => {
                        // Focus logic
                      }}
                    >
                      {/* Chips */}
                      {(clause.expressions || []).map((item, chipIdx) => (
                        <div key={chipIdx}>
                          {item.type === 'chip' ? (
                            <Tooltip title={item.value} arrow placement='top'>
                              <Chip
                                label={item.value}
                                size='small'
                                variant='outlined'
                                onDelete={() =>
                                  handleClauseRemoveChip(index, chipIdx)
                                }
                                sx={{
                                  fontSize: '11px',
                                  height: '20px',
                                  maxWidth: '150px',
                                  backgroundColor: '#f0f9ff',
                                  borderColor: '#3b82f6',
                                  color: '#1e40af',
                                  margin: '1px',
                                  '& .MuiChip-deleteIcon': {
                                    fontSize: '14px',
                                    color: '#1e40af',
                                    '&:hover': { color: '#ef4444' },
                                  },
                                }}
                              />
                            </Tooltip>
                          ) : item.type === 'manual' ? (
                            <Tooltip title={item.value} arrow placement='top'>
                              <Chip
                                label={item.value}
                                size='small'
                                variant='outlined'
                                onDelete={() =>
                                  handleClauseRemoveChip(index, chipIdx)
                                }
                                sx={{
                                  fontSize: '11px',
                                  height: '20px',
                                  maxWidth: '150px',
                                  backgroundColor: '#f0fdf4',
                                  borderColor: '#22c55e',
                                  color: '#16a34a',
                                  margin: '1px',
                                  '& .MuiChip-deleteIcon': {
                                    fontSize: '14px',
                                    color: '#16a34a',
                                    '&:hover': { color: '#ef4444' },
                                  },
                                }}
                              />
                            </Tooltip>
                          ) : item.type === 'number' ? (
                            <Tooltip title={item.value} arrow placement='top'>
                              <Chip
                                label={item.value}
                                size='small'
                                variant='outlined'
                                onDelete={() =>
                                  handleClauseRemoveChip(index, chipIdx)
                                }
                                sx={{
                                  fontSize: '11px',
                                  height: '20px',
                                  maxWidth: '150px',
                                  backgroundColor: '#fff7ed',
                                  borderColor: '#f97316',
                                  color: '#ea580c',
                                  margin: '1px',
                                  '& .MuiChip-deleteIcon': {
                                    fontSize: '14px',
                                    color: '#ea580c',
                                    '&:hover': { color: '#ef4444' },
                                  },
                                }}
                              />
                            </Tooltip>
                          ) : item.type === 'operator' ? (
                            <Chip
                              label={item.value}
                              size='small'
                              variant='outlined'
                              onDelete={() =>
                                handleClauseRemoveChip(index, chipIdx)
                              }
                              sx={{
                                fontSize: '11px',
                                height: '20px',
                                backgroundColor:
                                  item.value === '&&' || item.value === '||'
                                    ? '#fdf2f8'
                                    : '#fef9c3',
                                borderColor:
                                  item.value === '&&' || item.value === '||'
                                    ? '#f472b6'
                                    : '#eab308',
                                color:
                                  item.value === '&&' || item.value === '||'
                                    ? '#9d174d'
                                    : '#a16207',
                                margin: '1px',
                                '& .MuiChip-deleteIcon': {
                                  fontSize: '14px',
                                  color:
                                    item.value === '&&' || item.value === '||'
                                      ? '#9d174d'
                                      : '#a16207',
                                  '&:hover': { color: '#ef4444' },
                                },
                                '& .MuiChip-label': {
                                  paddingBottom:
                                    item.value === '*' ? '0px' : '2px',
                                  paddingTop:
                                    item.value === '*' ? '6px' : '0px',
                                },
                              }}
                            />
                          ) : null}
                        </div>
                      ))}

                      {/* Input */}
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
                            ? 'Type @ fields, # manual, numbers, &&,|| for conditions or +, -, *, / for operators'
                            : 'Add more...'
                        }
                        className='flex-1 min-w-0 border-none outline-none rounded-[2px] bg-transparent text-sm placeholder-gray-400'
                        style={{ minWidth: '150px' }}
                      />
                    </div>

                    {/* Autocomplete */}
                    {clause.showAutocomplete &&
                      clauseContainerRefs.current[index] && (
                        <Popover
                          open={true}
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
                                  clauseContainerRefs.current[index]
                                    ?.clientWidth + 2 || '300px',
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
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 hover:text-blue-800`}
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

                    {/* Individual Clause Error */}
                    {clause.error && (
                      <div className='text-xs text-red-600 mt-1'>
                        {clause.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Error Message */}
              {conditionalPopover.error && (
                <div className='text-xs text-red-600 my-1'>
                  {conditionalPopover.error}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className='flex justify-between mt-2'>
              <TextButton
                label='Add ELSE IF'
                onClick={handleAddElseIf}
                sx={{
                  width: 'auto',
                  minWidth: '100px',
                  fontSize: '13px',
                  fontWeight: 400,
                }}
              />
              <div className='flex justify-end gap-2'>
                <TextButton
                  label='Cancel'
                  onClick={handleConditionalPopoverCancel}
                  sx={{
                    width: '70px',
                    minWidth: '70px',
                    fontSize: '13px',
                    fontWeight: 400,
                  }}
                />
                <TextButton
                  label='Save'
                  onClick={handleConditionalPopoverSave}
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
        )}
      </Popover>
    </TableContainer>
  );
};

export default MappingTable;
