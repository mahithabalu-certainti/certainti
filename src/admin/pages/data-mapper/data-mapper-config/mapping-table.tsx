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
} from '@mui/material';
import { ErrorInfoIcon } from '../../../../assets';
import TruncateWithTooltip from '../../../../components/truncate-with-tooltip/truncate-with-tooltip';

interface ObjectItem {
  rid: string;
  parent_object: string;
  object_name: string;
  ref_table: string;
  field_name: string | null;
  field_type: 'line-item' | 'table';
}

interface FieldExpression {
  type: 'chip' | 'operator';
  value: string;
}

interface ObjectRidMap {
  [key: number]: string;
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
            const objectRidMap: ObjectRidMap = {};
            let index = 1;

            newExpressions.forEach((exp) => {
              if (exp.type === 'chip') {
                // Odd indices for object IDs
                const [parent, child] = exp.value.split('.', 2);
                const objectId = targetOptions[parent]?.[child] || '';
                if (objectId) {
                  objectRidMap[index] = objectId;
                  index += 2; // Next odd number
                }
              } else if (exp.type === 'operator') {
                // Even indices for operators - only add if there's a preceding chip
                if (index > 1) {
                  const operatorMap: Record<string, string> = {
                    '+': 'add',
                    '-': 'subtract',
                    '*': 'multiply',
                    '/': 'divide',
                  };
                  objectRidMap[index - 1] = operatorMap[exp.value] || exp.value;
                }
              }
            });

            return {
              ...mapping,
              fieldExpressions: newExpressions,
              calculation_config:
                Object.keys(objectRidMap).length > 0 ? objectRidMap : null,
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

      // Complete selection - add as chip
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
            const objectRidMap: ObjectRidMap = {};
            let index = 1;

            newExpressions.forEach((exp) => {
              if (exp.type === 'chip') {
                // Odd indices for object IDs
                const [parent, child] = exp.value.split('.', 2);
                const objectId = targetOptions[parent]?.[child] || '';
                if (objectId) {
                  objectRidMap[index] = objectId;
                  index += 2; // Next odd number
                }
              } else if (exp.type === 'operator') {
                // Even indices for operators - only add if there's a preceding chip
                if (index > 1) {
                  const operatorMap: Record<string, string> = {
                    '+': 'add',
                    '-': 'subtract',
                    '*': 'multiply',
                    '/': 'divide',
                  };
                  objectRidMap[index - 1] = operatorMap[exp.value] || exp.value;
                }
              }
            });

            const updatedMapping = {
              ...m,
              fieldExpressions: newExpressions,
              inputValue: '',
              calculation_config:
                Object.keys(objectRidMap).length > 0 ? objectRidMap : null,
              targetError: undefined, // Clear targetError when user makes changes
            };
            return updatedMapping;
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
          const objectRidMap: ObjectRidMap = {};
          let index = 1;

          newExpressions.forEach((exp) => {
            if (exp.type === 'chip') {
              // Odd indices for object IDs
              const [parent, child] = exp.value.split('.', 2);
              const objectId = targetOptions[parent]?.[child] || '';
              if (objectId) {
                objectRidMap[index] = objectId;
                index += 2; // Next odd number
              }
            } else if (exp.type === 'operator') {
              // Even indices for operators - only add if there's a preceding chip
              if (index > 1) {
                const operatorMap: Record<string, string> = {
                  '+': 'add',
                  '-': 'subtract',
                  '*': 'multiply',
                  '/': 'divide',
                };
                objectRidMap[index - 1] = operatorMap[exp.value] || exp.value;
              }
            }
          });

          const updatedMapping = {
            ...mapping,
            fieldExpressions: newExpressions,
            calculation_config:
              Object.keys(objectRidMap).length > 0 ? objectRidMap : null,
            targetError: undefined, // Clear targetError when user makes changes
          };
          return updatedMapping;
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
          const objectRidMap: ObjectRidMap = {};
          let index = 1;

          newExpressions.forEach((exp) => {
            if (exp.type === 'chip') {
              // Odd indices for object IDs
              const [parent, child] = exp.value.split('.', 2);
              const objectId = targetOptions[parent]?.[child] || '';
              if (objectId) {
                objectRidMap[index] = objectId;
                index += 2; // Next odd number
              }
            } else if (exp.type === 'operator') {
              // Even indices for operators - only add if there's a preceding chip
              if (index > 1) {
                const operatorMap: Record<string, string> = {
                  '+': 'add',
                  '-': 'subtract',
                  '*': 'multiply',
                  '/': 'divide',
                };
                objectRidMap[index - 1] = operatorMap[exp.value] || exp.value;
              }
            }
          });

          const updatedMapping = {
            ...mapping,
            fieldExpressions: newExpressions,
            calculation_config:
              Object.keys(objectRidMap).length > 0 ? objectRidMap : null,
            targetError: undefined, // Clear targetError when user makes changes
          };
          return updatedMapping;
        }
        return mapping;
      });
      onMappingsChange(updated);
      return updated;
    });
  };

  const handleKeyDown = (rid: string, event: React.KeyboardEvent): void => {
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

  const getFilteredOptions = (rid: string): string[] => {
    const mapping = localMappings.find((m) => m.rid === rid);
    if (!mapping) return [];

    const currentInput = mapping.inputValue || '';
    const atIndex = currentInput.lastIndexOf('@');

    if (atIndex === -1) return [];

    const searchText = currentInput.substring(atIndex + 1).toLowerCase();

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

    if (searchText === '') {
      const parents = Object.keys(filteredTargetOptions);
      return parents;
    }

    const dotCount = (searchText.match(/\./g) || []).length;

    if (dotCount >= 1) {
      const [parentKeyLower, childKeyLower = ''] = searchText.split('.', 2);

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
      key.toLowerCase().includes(searchText)
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
            >
              Target
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
                          <span className='h-[26px] w-5 flex items-center justify-center absolute top-[2px] bg-[#FEF2F2] right-[4px] cursor-pointer'>
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
                        className={`w-full h-full max-h-[90px] overflow-y-auto px-2 py-1 border rounded-[2px] flex flex-wrap items-start gap-1 cursor-text focus-within:border-2 ${
                          mapping.targetError
                            ? 'border-red-500 bg-[#FEF2F2] focus-within:border-red-500 pr-8'
                            : 'border-gray-300 bg-white focus-within:border-blue-400'
                        }`}
                        onClick={() => {
                          inputRefs.current[mapping.rid]?.focus();
                        }}
                      >
                        {(mapping.fieldExpressions || []).map((item, idx) => (
                          <div key={idx} className='flex items-center'>
                            {item.type === 'chip' ? (
                              <Chip
                                label={getDisplayName(item.value, mapping.rid)}
                                size='small'
                                variant='outlined'
                                onDelete={() => removeChip(mapping.rid, idx)}
                                sx={{
                                  fontSize: '11px',
                                  height: '20px',
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
                                  },
                                }}
                              />
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
                              ? 'Type @ to add fields or +, -, *, / for operators'
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
                          <span className='h-[26px] w-5 flex items-center justify-center absolute top-[2px] right-[4px] bg-[#FEF2F2] cursor-pointer'>
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
                            maxHeight: '200px',
                          }}
                        >
                          {getFilteredOptions(mapping.rid).map(
                            (option, idx) => {
                              const isSelected =
                                idx === (selectedOptionIndex[mapping.rid] || 0);
                              return (
                                <div
                                  key={idx}
                                  className={`px-3 py-2 text-sm cursor-pointer ${
                                    isSelected
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'hover:bg-gray-100'
                                  }`}
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
    </TableContainer>
  );
};

export default MappingTable;
