/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  SelectChangeEvent,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import {
  FieldConfig,
  FilterComponentProps,
  FilterState,
  NumberFilterOption,
  TextFilterOption,
} from '../../../types/account-filter';
import {
  BooleanFilterControl,
  MultiSelectFilterControl,
  NumberFilterControl,
  StatusFilterControl,
  TextFilterControl,
} from './helpers';
import { fields, formatFilterForApi, getInitialStateForField } from './utils';

const FilterComponent: React.FC<FilterComponentProps> = ({
  setAppliedFilters,
}) => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [filterStates, setFilterStates] = useState<Record<string, FilterState>>(
    {}
  );
  const [isModified, setIsModified] = useState(false);

  const handleCheckboxChange = (fieldName: string) => {
    setIsModified(true);
    setSelectedFilters((prev) =>
      prev.includes(fieldName)
        ? prev.filter((item) => item !== fieldName)
        : [...prev, fieldName]
    );

    if (!filterStates[fieldName]) {
      const fieldConfig = fields.find((f) => f.name === fieldName);
      if (!fieldConfig) return;

      setFilterStates((prev) => ({
        ...prev,
        [fieldName]: getInitialStateForField(fieldConfig),
      }));
    }
  };

  const handleFilterOptionChange = (
    fieldName: string,
    event: SelectChangeEvent<any>
  ) => {
    setIsModified(true);
    const fieldConfig = fields.find((f) => f.name === fieldName);
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
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setIsModified(true);
    const fieldConfig = fields.find((f) => f.name === fieldName);
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
          return {
            ...prev,
            [fieldName]: {
              ...currentState,
              number: {
                ...currentState.number!,
                value: event.target.value,
              },
            },
          };
        default:
          return prev;
      }
    });
  };

  const handleBooleanChange = (fieldName: string, checked: boolean) => {
    setIsModified(true);
    setFilterStates((prev) => ({
      ...prev,
      [fieldName]: { boolean: { option: 'equals', value: checked } },
    }));
  };

  const handleMultiSelectChange = (fieldName: string, values: string[]) => {
    setIsModified(true);
    setFilterStates((prev) => ({
      ...prev,
      [fieldName]: { multiSelect: { values } },
    }));
  };

  const handleApplyFilters = () => {
    setIsModified(false);
    setAppliedFilters(formatFilterForApi(filterStates));
  };

  const handleResetFilters = () => {
    setSelectedFilters([]);
    setFilterStates({});
    setAppliedFilters({});
    setIsModified(false);
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
    <Box sx={{ width: 320, p: 2 }}>
      {/* <Typography variant='subtitle1' sx={{ fontSize: '16px', fontWeight: 600, color: '#2D3E4F', lineHeight: '30px' }}>
        Filter Accounts by
      </Typography> */}
      <Typography
        variant='subtitle1'
        sx={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#2D3E4F',
          lineHeight: '30px',
        }}
      >
        Filter By Fields
      </Typography>

      {isModified && (
        <Box className='flex items-center justify-end gap-2 w-full'>
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

      {fields.map((field) => (
        <Box key={field.name}>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedFilters.includes(field.name)}
                onChange={() => handleCheckboxChange(field.name)}
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
                {field.name}
              </Typography>
            }
          />
          {renderFilterControls(field)}
        </Box>
      ))}
    </Box>
  );
};

export default FilterComponent;
