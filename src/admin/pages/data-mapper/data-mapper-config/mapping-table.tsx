import React, { useState, useEffect } from 'react';
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Autocomplete,
  Chip,
  Box,
  Typography,
} from '@mui/material';

interface ObjectItem {
  rid: string;
  parent_object: string;
  object_name: string;
  ref_table: string;
  field_name: string | null;
}

interface MappingItem {
  rid: string;
  field_label: string;
  field_id: string | null;
  object_rid: string[];
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
  const [localMappings, setLocalMappings] = useState<MappingItem[]>(
    mappings || []
  );

  useEffect(() => {
    // Only update if mappings actually changed and we don't have local changes
    if (mappings && mappings.length > 0 && localMappings.length === 0) {
      setLocalMappings(mappings);
    }
  }, [mappings]);

  // Group objects by parent_object for better organization
  const groupedOptions = React.useMemo(() => {
    const grouped: Record<string, ObjectItem[]> = {};
    if (Array.isArray(objectsList)) {
      objectsList.forEach((item) => {
        if (!grouped[item.parent_object]) {
          grouped[item.parent_object] = [];
        }
        grouped[item.parent_object].push(item);
      });
    }
    return grouped;
  }, [objectsList]);

  // Create options for autocomplete with hierarchical structure
  const autocompleteOptions = React.useMemo(() => {
    if (!Array.isArray(objectsList)) {
      return [];
    }

    const allOptions: any[] = [];

    // Add parent objects as options
    const parentObjects = Array.from(
      new Set(objectsList.map((item) => item.parent_object))
    );
    parentObjects.forEach((parent) => {
      allOptions.push({
        label: parent,
        value: `parent-${parent}`,
        parent_object: parent,
        object_name: parent,
        type: 'parent',
        isParent: true,
      });
    });

    // Add child objects as options
    objectsList.forEach((item) => {
      allOptions.push({
        label: `${item.parent_object} - ${item.object_name}`,
        value: item.rid,
        parent_object: item.parent_object,
        object_name: item.object_name,
        type: 'child',
        isParent: false,
        fullItem: item,
      });
    });

    return allOptions;
  }, [objectsList]);

  const getFilteredOptions = (inputValue: string, selectedParent?: string) => {
    if (!inputValue && !selectedParent) {
      // Show only parent objects when no input
      return autocompleteOptions.filter((option) => option.isParent);
    }

    if (selectedParent) {
      // Show child objects for selected parent
      return autocompleteOptions.filter(
        (option) => !option.isParent && option.parent_object === selectedParent
      );
    }

    // Filter parent objects based on input
    const parentMatches = autocompleteOptions.filter(
      (option) =>
        option.isParent &&
        option.parent_object.toLowerCase().includes(inputValue.toLowerCase())
    );

    // If input matches a parent exactly, show children
    const exactParentMatch = parentMatches.find(
      (option) =>
        option.parent_object.toLowerCase() === inputValue.toLowerCase()
    );

    if (exactParentMatch) {
      return autocompleteOptions.filter(
        (option) =>
          !option.isParent &&
          option.parent_object === exactParentMatch.parent_object
      );
    }

    return parentMatches;
  };

  const handleFieldIdChange = (index: number, value: string) => {
    const updatedMappings = [...localMappings];
    updatedMappings[index] = {
      ...updatedMappings[index],
      field_id: value,
    };
    setLocalMappings(updatedMappings);
    onMappingsChange(updatedMappings);
  };

  const handleTargetChange = (index: number, selectedOptions: any[]) => {
    const updatedMappings = [...localMappings];
    updatedMappings[index] = {
      ...updatedMappings[index],
      object_rid: selectedOptions.map((option) => option.value),
    };
    setLocalMappings(updatedMappings);
    onMappingsChange(updatedMappings);
  };

  const getSelectedTargets = (objectRids: string[]) => {
    return autocompleteOptions.filter(
      (option) => objectRids.includes(option.value) && !option.isParent
    );
  };

  const [inputValues, setInputValues] = useState<Record<number, string>>({});
  const [selectedParents, setSelectedParents] = useState<
    Record<number, string>
  >({});

  return (
    <TableContainer
      sx={{
        maxHeight: 'calc(100vh - 42px)',
        overflow: 'auto',
        minHeight: 'auto',
        height: 'fit-content',
        borderLeft: '1px solid #CBD6E2',
        borderBottom: '1px solid #CBD6E2',
        borderTop: '1px solid #CBD6E2',
      }}
    >
      <MuiTable
        stickyHeader
        sx={{
          height: '100%',
          borderCollapse: 'separate !important',
          borderSpacing: 0,
        }}
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
            },
          }}
        >
          <TableRow>
            <TableCell
              sx={{
                width: '40%',
                minWidth: '300px',
                maxWidth: '40%',
              }}
            >
              Field Label
            </TableCell>
            <TableCell
              sx={{
                width: '20%',
                minWidth: '150px',
                maxWidth: '20%',
              }}
            >
              Field ID
            </TableCell>
            <TableCell
              sx={{
                width: '40%',
                minWidth: '300px',
                maxWidth: '40%',
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
              padding: '0px',
              px: '8px',
              height: '32px',
              minHeight: '32px',
              maxHeight: '32px',
            },
          }}
        >
          {localMappings.map((mapping, index) => (
            <TableRow
              key={mapping.rid}
              hover
              sx={{
                '&:hover td': {
                  backgroundColor: '#f5f7fa',
                },
              }}
            >
              <TableCell
                sx={{
                  width: '40%',
                  minWidth: '300px',
                  maxWidth: '40%',
                  verticalAlign: 'middle',
                }}
              >
                <div className='font-medium text-[13px] text-[#2D3E4F] py-1'>
                  {mapping.field_label}
                </div>
              </TableCell>

              <TableCell
                sx={{
                  width: '20%',
                  minWidth: '150px',
                  maxWidth: '20%',
                  padding: '4px 8px !important',
                }}
              >
                <TextField
                  size='small'
                  value={mapping.field_id || ''}
                  onChange={(e) => handleFieldIdChange(index, e.target.value)}
                  placeholder='Enter Field ID'
                  sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      fontSize: '13px',
                      height: '24px',
                      '& fieldset': {
                        borderColor: '#CBD6E2',
                      },
                      '&:hover fieldset': {
                        borderColor: '#0176D3',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#0176D3',
                      },
                      '& input': {
                        padding: '4px 8px',
                      },
                    },
                  }}
                />
              </TableCell>

              <TableCell
                sx={{
                  width: '40%',
                  minWidth: '300px',
                  maxWidth: '40%',
                  padding: '4px 8px !important',
                }}
              >
                <Autocomplete
                  multiple
                  size='small'
                  options={getFilteredOptions(
                    inputValues[index] || '',
                    selectedParents[index]
                  )}
                  getOptionLabel={(option) =>
                    option.isParent ? option.parent_object : option.object_name
                  }
                  value={getSelectedTargets(mapping.object_rid || [])}
                  onInputChange={(_, newInputValue) => {
                    setInputValues((prev) => ({
                      ...prev,
                      [index]: newInputValue,
                    }));

                    // Reset selected parent if input changes
                    if (newInputValue !== selectedParents[index]) {
                      setSelectedParents((prev) => ({ ...prev, [index]: '' }));
                    }
                  }}
                  onChange={(_, newValue) => {
                    const selectedOptions = newValue as any[];

                    // Check if a parent was selected
                    const parentSelected = selectedOptions.find(
                      (option) => option.isParent
                    );
                    if (parentSelected) {
                      setSelectedParents((prev) => ({
                        ...prev,
                        [index]: parentSelected.parent_object,
                      }));
                      setInputValues((prev) => ({
                        ...prev,
                        [index]: parentSelected.parent_object,
                      }));
                      // Don't add parent to selection, just use it to filter children
                      return;
                    }

                    // Only add child objects to selection
                    const childOptions = selectedOptions.filter(
                      (option) => !option.isParent
                    );
                    handleTargetChange(index, childOptions);
                  }}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, tagIndex) => (
                      <Chip
                        key={option.value}
                        label={option.object_name}
                        size='small'
                        {...getTagProps({ index: tagIndex })}
                        sx={{
                          fontSize: '11px',
                          height: '20px',
                          '& .MuiChip-label': {
                            padding: '0 6px',
                          },
                        }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={
                        selectedParents[index]
                          ? `Select from ${selectedParents[index]}...`
                          : 'Type parent object name...'
                      }
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: '13px',
                          minHeight: '24px',
                          '& fieldset': {
                            borderColor: '#CBD6E2',
                          },
                          '&:hover fieldset': {
                            borderColor: '#0176D3',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#0176D3',
                          },
                          '& .MuiAutocomplete-input': {
                            padding: '2px 4px !important',
                          },
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component='li' {...props}>
                      <div>
                        <div
                          className={`font-medium text-[13px] ${option.isParent ? 'text-[#0176D3]' : 'text-[#2D3E4F]'}`}
                        >
                          {option.isParent
                            ? option.parent_object
                            : option.object_name}
                        </div>
                        {!option.isParent && (
                          <div className='text-[11px] text-[#7D98B6]'>
                            {option.parent_object}
                          </div>
                        )}
                        {option.isParent && (
                          <div className='text-[11px] text-[#7D98B6]'>
                            Parent Category
                          </div>
                        )}
                      </div>
                    </Box>
                  )}
                  sx={{
                    width: '100%',
                    '& .MuiAutocomplete-groupLabel': {
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#425A76',
                      backgroundColor: '#F8F9FA',
                    },
                  }}
                />
              </TableCell>
            </TableRow>
          ))}

          {(!localMappings || localMappings.length === 0) && (
            <TableRow sx={{ height: '32px' }}>
              <TableCell
                colSpan={3}
                align='center'
                sx={{
                  height: '32px !important',
                }}
              >
                <Typography sx={{ color: '#7D98B6', fontSize: '13px' }}>
                  No mapping data available
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
};

export default MappingTable;
