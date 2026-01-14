import React, { useState, useEffect } from 'react';
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
} from '@mui/material';

interface ObjectItem {
  rid: string;
  parent_object: string;
  object_name: string;
  ref_table: string;
  field_name: string | null;
}

interface FieldExpression {
  type: 'chip' | 'operator';
  value: string;
}

interface MappingItem {
  rid: string;
  field_label: string;
  field_id: string | null;
  object_rid: string[];
  fieldExpressions?: FieldExpression[];
  inputValue?: string;
}

interface MappingTableProps {
  mappings: MappingItem[];
  objectsList: ObjectItem[];
  onMappingsChange: (mappings: MappingItem[]) => void;
}

const MappingTable: React.FC<MappingTableProps> = ({
  mappings,
  objectsList,
  onMappingsChange,
}) => {
  const [localMappings, setLocalMappings] = useState<MappingItem[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState<
    Record<string, boolean>
  >({});
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    if (mappings && mappings.length > 0) {
      // Initialize mappings with fieldExpressions and inputValue if not present
      const initializedMappings = mappings.map((mapping) => ({
        ...mapping,
        fieldExpressions: mapping.fieldExpressions || [],
        inputValue: mapping.inputValue || '',
      }));
      setLocalMappings(initializedMappings);
    }
  }, [mappings]);

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
    const updatedMappings = localMappings.map((mapping) =>
      mapping.rid === rid ? { ...mapping, field_id: value } : mapping
    );
    setLocalMappings(updatedMappings);
    onMappingsChange(updatedMappings);
  };

  const handleInputChange = (rid: string, value: string): void => {
    const lastChar = value.slice(-1);
    const isOperator = ['+', '-', '*', '/'].includes(lastChar);

    if (isOperator && value.length === 1) {
      setLocalMappings((prev) =>
        prev.map((mapping) => {
          if (mapping.rid === rid) {
            return {
              ...mapping,
              fieldExpressions: [
                ...(mapping.fieldExpressions || []),
                { type: 'operator' as const, value: lastChar },
              ],
              inputValue: '',
            };
          }
          return mapping;
        })
      );
      return;
    }

    setLocalMappings((prev) =>
      prev.map((mapping) => {
        if (mapping.rid === rid) {
          return { ...mapping, inputValue: value };
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
      m.rid === rid ? { ...m, inputValue: value } : m
    );
    onMappingsChange(updated);
  };

  const handleInputBlur = (rid: string): void => {
    const mapping = localMappings.find((m) => m.rid === rid);
    if (!mapping) return;

    const currentInput = mapping.inputValue || '';
    const atIndex = currentInput.lastIndexOf('@');

    if (atIndex !== -1) {
      const afterAt = currentInput.substring(atIndex + 1);
      const dotCount = (afterAt.match(/\./g) || []).length;

      if (
        (afterAt && dotCount < 1) ||
        (dotCount >= 1 && afterAt.endsWith('.'))
      ) {
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
      const dotCount = (selectedValue.match(/\./g) || []).length;
      const isCompleteProperty = dotCount === 1; // parent.child format

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

            // Extract RIDs from chips for object_rid array
            const objectRids = newExpressions
              .filter((exp) => exp.type === 'chip')
              .map((exp) => {
                const [parent, child] = exp.value.split('.');
                return targetOptions[parent]?.[child] || '';
              })
              .filter(Boolean);

            return {
              ...m,
              fieldExpressions: newExpressions,
              inputValue: '',
              object_rid: objectRids,
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

          // Update object_rid array
          const objectRids = newExpressions
            .filter((exp) => exp.type === 'chip')
            .map((exp) => {
              const [parent, child] = exp.value.split('.');
              return targetOptions[parent]?.[child] || '';
            })
            .filter(Boolean);

          return {
            ...mapping,
            fieldExpressions: newExpressions,
            object_rid: objectRids,
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
          return {
            ...mapping,
            fieldExpressions: (mapping.fieldExpressions || []).filter(
              (_, index) => index !== indexToRemove
            ),
          };
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

    if (searchText === '') {
      const parents = Object.keys(targetOptions);
      return parents;
    }

    const dotCount = (searchText.match(/\./g) || []).length;

    if (dotCount >= 1) {
      const [parentKeyLower, childKeyLower = ''] = searchText.split('.');

      // Find the actual parent key (case-insensitive match)
      const actualParentKey = Object.keys(targetOptions).find(
        (key) => key.toLowerCase() === parentKeyLower
      );

      if (actualParentKey && targetOptions[actualParentKey]) {
        const children = targetOptions[actualParentKey];

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
    const filteredKeys = Object.keys(targetOptions).filter((key) =>
      key.toLowerCase().includes(searchText)
    );

    return filteredKeys;
  };

  const getDisplayName = (optionValue: string): string => {
    const dotCount = (optionValue.match(/\./g) || []).length;

    if (dotCount === 1) {
      // parent.child format - show as is
      return optionValue;
    } else {
      // parent only - show count of children
      const parentData = targetOptions[optionValue];
      if (parentData) {
        const childCount = Object.keys(parentData).length;
        return `${optionValue} (${childCount})`;
      }
      return optionValue;
    }
  };

  return (
    <TableContainer
      component={Paper}
      sx={{
        boxShadow: 'none',
        border: '1px solid #f1f1f1',
        mt: 1,
        mb: 2,
        overflow: 'visible',
      }}
    >
      <MuiTable sx={{ minWidth: 650 }} aria-label='data mapping table'>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f3f4f6' }}>
            <TableCell
              sx={{
                fontWeight: 'bold',
                width: '30%',
                borderRight: '1px solid #f1f1f1',
                borderBottom: '1px solid #f1f1f1',
                padding: '8px',
              }}
            >
              Field Label
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 'bold',
                width: '20%',
                borderRight: '1px solid #f1f1f1',
                borderBottom: '1px solid #f1f1f1',
                padding: '8px',
              }}
            >
              Field ID
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 'bold',
                width: '50%',
                borderBottom: '1px solid #f1f1f1',
                padding: '8px',
              }}
            >
              Target
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {localMappings.map((mapping) => (
            <TableRow
              key={mapping.rid}
              sx={{
                '&:last-child td': {
                  borderBottom: '1px solid #f1f1f1',
                },
              }}
            >
              <TableCell
                sx={{
                  borderRight: '1px solid #f1f1f1',
                  borderBottom: '1px solid #f1f1f1',
                  padding: '8px',
                }}
              >
                {mapping.field_label}
              </TableCell>
              <TableCell
                sx={{
                  borderRight: '1px solid #f1f1f1',
                  borderBottom: '1px solid #f1f1f1',
                  padding: '8px',
                }}
              >
                <input
                  type='text'
                  value={mapping.field_id || ''}
                  onChange={(e) =>
                    handleFieldIdChange(mapping.rid, e.target.value)
                  }
                  placeholder='Enter Field ID'
                  className='w-full px-2 py-1 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                />
              </TableCell>
              <TableCell
                sx={{
                  borderBottom: '1px solid #f1f1f1',
                  padding: '8px',
                  position: 'relative', // Enable absolute positioning for dropdown
                  overflow: 'visible', // Allow dropdown to overflow cell
                }}
              >
                <div className='relative'>
                  <div className='relative w-full'>
                    <div className='min-h-[32px] w-full border border-gray-300 rounded-sm px-3 py-1 bg-white flex flex-wrap items-center gap-1 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500'>
                      {(mapping.fieldExpressions || []).map((item, idx) => (
                        <div key={idx} className='flex items-center'>
                          {item.type === 'chip' ? (
                            <Chip
                              label={getDisplayName(item.value)}
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
                              onDelete={() => removeOperator(mapping.rid, idx)}
                              sx={{
                                fontSize: '11px',
                                height: '20px',
                                backgroundColor: '#f3f4f6',
                                borderColor: '#9ca3af',
                                color: '#4b5563',
                                margin: '1px',
                                '& .MuiChip-deleteIcon': {
                                  fontSize: '14px',
                                  color: '#ef4444',
                                },
                                '& .MuiChip-label': {
                                  paddingLeft: '6px',
                                  paddingRight: '6px',
                                },
                              }}
                            />
                          )}
                        </div>
                      ))}

                      <input
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
                        className='flex-1 min-w-0 border-none outline-none bg-transparent text-sm placeholder-gray-400'
                        style={{ minWidth: '80px' }}
                      />
                    </div>
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
                        {getFilteredOptions(mapping.rid).map((option, idx) => {
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
                                handleAutocompleteSelect(mapping.rid, option)
                              }
                            >
                              {getDisplayName(option)}
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
};

export default MappingTable;
