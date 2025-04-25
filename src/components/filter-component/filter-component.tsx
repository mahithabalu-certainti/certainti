/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { arrowDownIcon, searchIcon } from '../../assets';
import {
  FieldConfig,
  FilterComponentProps,
  FilterState,
  NumberFilterOption,
  TextFilterOption,
} from '../../consultant/types/account-filter';
import {
  BooleanFilterControl,
  MultiSelectFilterControl,
  NumberFilterControl,
  StatusFilterControl,
  TextFilterControl,
} from './helpers';
import { clearFilters, formatFilterForApi, getInitialStateForField, getStoredFilters, storeFilters } from './utils';
import { useLocation } from 'react-router-dom';

const FilterComponent: React.FC<FilterComponentProps> = ({
  setAppliedFilters,
  searchTerm,
  setSearchTerm,
  filterFields,
  filterLabel,
}) => {
  const location = useLocation();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [filterStates, setFilterStates] = useState<Record<string, FilterState>>(
    {}
  );
  const [showFilters, setShowFilters] = useState(true);
  const filterApplied = selectedFilters.length > 0;

  const filteredFields = filterFields.filter((field) =>
    field.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const saved = getStoredFilters();
    if (saved) {
      const selected = Object.keys(saved);
      setSelectedFilters(selected);
      setFilterStates(saved as Record<string, FilterState>);
      setAppliedFilters(formatFilterForApi(saved as Record<string, FilterState>));
    }
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      clearFilters();
      setSelectedFilters([]);
      setFilterStates({});
      setAppliedFilters({});
    };

    let currentPathname = location.pathname;

    const unlisten = () => {
      if (window.location.pathname !== currentPathname) {
        handleRouteChange();
      }
    };

    return unlisten;
  }, [location.pathname]);

  const handleCheckboxChange = (fieldName: string) => {
    setSelectedFilters((prev) =>
      prev.includes(fieldName)
        ? prev.filter((item) => item !== fieldName)
        : [...prev, fieldName]
    );
  
    if (selectedFilters.includes(fieldName)) {
      setFilterStates((prev) => {
        const newState = { ...prev };
        delete newState[fieldName];
        setAppliedFilters(formatFilterForApi(newState));

        if (Object.keys(newState).length === 0) {
          clearFilters();
        } else {
          storeFilters(newState);
        }

        return newState;
      });
    } else {
      const fieldConfig = filterFields.find((f) => f.name === fieldName);
      if (fieldConfig) {
        setFilterStates((prev) => ({
          ...prev,
          [fieldName]: getInitialStateForField(fieldConfig),
        }));
      }
    }
  };

  const handleFilterOptionChange = (
    fieldName: string,
    event: SelectChangeEvent<any>
  ) => {
    const fieldConfig = filterFields.find((f) => f.name === fieldName);
    if (!fieldConfig) return;

    setFilterStates((prev) => {
      const currentState = prev[fieldName] || {};
      switch (fieldConfig.type) {
        case 'text':
          return {
            ...prev,
            [fieldName]: {
              ...currentState,
              text: {
                ...currentState.text!,
                option: event.target.value as TextFilterOption,
              },
            },
          };
        case 'number':
          return {
            ...prev,
            [fieldName]: {
              ...currentState,
              number: {
                ...currentState.number!,
                option: event.target.value as NumberFilterOption,
              },
            },
          };
        case 'status':
          return {
            ...prev,
            [fieldName]: {
              ...currentState,
              status: {
                ...currentState.status!,
                value: event.target.value,
              },
            },
          };
        default:
          return prev;
      }
    });
  };

  const handleFilterValueChange = (
    fieldName: string,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index?: number
  ) => {
    const fieldConfig = filterFields.find((f) => f.name === fieldName);
    if (!fieldConfig) return;

    setFilterStates((prev) => {
      const currentState = prev[fieldName] || {};
      switch (fieldConfig.type) {
        case 'text':
          return {
            ...prev,
            [fieldName]: {
              ...currentState,
              text: {
                ...currentState.text!,
                value: event.target.value,
              },
            },
          };
        case 'number':
          if (currentState.number?.option === 'between') {
            const valueArray = Array.isArray(currentState.number.value) ? currentState.number.value : ['', ''];
            
            if (typeof index === 'number') {
              valueArray[index] = event.target.value;
            }


            return {
              ...prev,
              [fieldName]: {
                ...currentState,
                number: {
                  option: 'between',
                  value: [...valueArray] as [string, string],
                },
              },
            };
          } else {
            return {
              ...prev,
              [fieldName]: {
                ...currentState,
                number: {
                  ...currentState.number!,
                  value: event.target.value,
                },
              },
            }
          }
        default:
          return prev;
      }
    });
  };

  const handleBooleanChange = (fieldName: string, checked: boolean) => {
    setFilterStates((prev) => ({
      ...prev,
      [fieldName]: { boolean: { option: 'equals', value: checked } },
    }));
  };

  const handleMultiSelectChange = (fieldName: string, values: string[]) => {
    setFilterStates((prev) => ({
      ...prev,
      [fieldName]: { multiSelect: { values } },
    }));
  };

  const handleApplyFilters = () => {
    const updatedStates = { ...filterStates };
    let hasInvalid = false;
  
    for (const key in updatedStates) {
      const state = updatedStates[key];
  
      if (state.text) {
        const isEmpty = !state.text.value.trim();
        if (isEmpty) hasInvalid = true;
      }
  
      if (state.number) {
        const { option, value } = state.number;
        let hasError = false;
  
        if (option === 'between') {
          hasError = !Array.isArray(value) || value.some((v) => !v.trim());
        } else {
          hasError = !value || (typeof value === 'string' && !value.trim());
        }
  
        state.number.error = hasError;
        if (hasError) hasInvalid = true;
      }
  
      if (state.status) {
        const isEmpty = !state.status.value.trim();
        if (isEmpty) hasInvalid = true;
      }
  
      if (state.boolean) {
        const isInvalid = typeof state.boolean.value !== 'boolean';
        if (isInvalid) hasInvalid = true;
      }
  
      if (state.multiSelect) {
        const isEmpty = !Array.isArray(state.multiSelect.values) || state.multiSelect.values.length === 0;
        if (isEmpty) hasInvalid = true;
      }
    }
  
    if (hasInvalid) {
      setFilterStates(updatedStates);
      return;
    }

    setAppliedFilters(formatFilterForApi(filterStates));
    storeFilters(filterStates);
  };

  const handleResetFilters = () => {
    setSelectedFilters([]);
    setFilterStates({});
    setAppliedFilters({});
    clearFilters();
  };

  const renderFilterControls = (field: FieldConfig) => {
    if (!selectedFilters.includes(field.name)) return null;

    const fieldState = filterStates[field.name] || {};

    switch (field.type) {
      case 'text':
        return (
          <TextFilterControl
            fieldName={field.name}
            state={fieldState}
            onOptionChange={handleFilterOptionChange}
            onValueChange={handleFilterValueChange}
          />
        );
      case 'number':
        return (
          <NumberFilterControl
            fieldName={field.name}
            state={fieldState}
            onOptionChange={handleFilterOptionChange}
            onValueChange={handleFilterValueChange}
          />
        );
      case 'status':
        return (
          <StatusFilterControl
            fieldName={field.name}
            state={fieldState}
            options={field.options || []}
            onOptionChange={handleFilterOptionChange}
          />
        );
      case 'boolean':
        return (
          <BooleanFilterControl
            fieldName={field.name}
            state={fieldState}
            onChange={handleBooleanChange}
          />
        );
      case 'multi-select':
        return (
          <MultiSelectFilterControl
            fieldName={field.name}
            state={fieldState}
            options={field.options || []}
            onChange={handleMultiSelectChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography
        variant='subtitle1'
        sx={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#2D3E4F',
          lineHeight: '30px',
          mb: 1,
        }}
      >
        {filterLabel || 'Filter by'}
      </Typography>
      <TextField
        placeholder='Search'
        variant='outlined'
        size='small'
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{
          mb: 1,
          '& .MuiOutlinedInput-root': {
            maxWidth: '220px',
            height: '36px',
            borderRadius: '26px',
            color: '#2D3E4F',
            fontSize: '12px',
            fontWeight: 400,
            lineHeight: '20px',
            '& fieldset': {
              borderColor: '#ccc',
            },
            '&:hover fieldset': {
              borderColor: '#CBD6E2',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3f51b5',
            },
            '& input::placeholder': {
              color: '#7D98B6',
              opacity: 1,
            },
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <img
                src={searchIcon}
                alt='Search'
                style={{
                  width: 20,
                  height: 20,
                  filter:
                    'brightness(0) saturate(100%) invert(22%) sepia(15%) saturate(1726%) hue-rotate(169deg) brightness(91%) contrast(87%)',
                }}
              />
            </InputAdornment>
          ),
        }}
      />

      <Typography
        variant='subtitle1'
        sx={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#2D3E4F',
          lineHeight: '30px',
        }}
        className='flex items-center gap-1 cursor-pointer'
        onClick={() => setShowFilters(!showFilters)}
      >
        <img
          src={arrowDownIcon}
          alt='arrow'
          style={{
            width: 20,
            height: 20,
            filter:
              'brightness(0) saturate(100%) invert(22%) sepia(15%) saturate(1726%) hue-rotate(169deg) brightness(91%) contrast(87%)',
            transform: showFilters ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.2s ease-in-out',
          }}
        />
        Filter By Fields
      </Typography>

      {showFilters && (
        <>
          {filterApplied && (
            <Box className='flex items-center gap-2 w-full'>
              <Button
                variant='outlined'
                color='secondary'
                disableRipple
                onClick={handleResetFilters}
                sx={{
                  height: '30px',
                  minHeight: '30x',
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#F16137',
                }}
              >
                Reset
              </Button>

              <Button
                variant='outlined'
                color='primary'
                onClick={handleApplyFilters}
                sx={{
                  height: '30px',
                  minHeight: '30x',
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#2D3E4F',
                }}
              >
                Apply
              </Button>
            </Box>
          )}

          {filteredFields.map((field) => (
            <Box key={field.name}>
              <FormControlLabel
                control={
                  <Checkbox
                    disableRipple
                    checked={selectedFilters.includes(field.name)}
                    onChange={() => handleCheckboxChange(field.name)}
                    sx={{
                      color: '#CBD6E2',
                      '&.Mui-checked': {
                        color: '#1755E7',
                      },
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 400,
                      lineHeight: '30px',
                      color: '#2D3E4F',
                    }}
                  >
                    {field.label}
                  </Typography>
                }
              />
              {renderFilterControls(field)}
            </Box>
          ))}
        </>
      )}
    </Box>
  );
};

export default FilterComponent;
