/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, SelectChangeEvent } from '@mui/material';
import React, { useState } from 'react';
import { filterArrowRightIcon } from '../../../../../assets';
import { Button } from '../../../../../components/button';
import { getInitialStateForField } from '../../sidebar-pages/resources/utils';
import {
  DateFilterOption,
  dateOptions,
  EnumFilterOption,
  enumOptions,
  enumValueOptions,
  FieldConfig,
  FilterComponentProps,
  FilterState,
  NumberFilterOption,
  numberOptions,
  TextFilterOption,
  textOptions,
} from './filterType';
import {
  DateFilterControl,
  EnumFilterControl,
  formatFilterForApi,
  NumberFilterControl,
  TextFilterControl,
} from './helper';

// filter to use in resource, cost and skill list pages

const Filter: React.FC<FilterComponentProps> = ({
  filterMenu,
  setAppliedFilters,
  handleFilter,
}) => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [filterStates, setFilterStates] = useState<Record<string, FilterState>>(
    {}
  );

  const handleApplyFilters = () => {
    setAppliedFilters(formatFilterForApi(filterStates));
    handleFilter();
  };

  const resetFilter = () => {
    setAppliedFilters({});
    setFilterStates({});
    setSelectedFilters([]);
  };

  const handleClickFilterMenu = (fieldName: string) => {
    setSelectedFilters((prev) =>
      prev.includes(fieldName)
        ? prev.filter((item) => item !== fieldName)
        : [...prev, fieldName]
    );

    if (!filterStates[fieldName]) {
      const fieldConfig = filterMenu.find((f) => f.value === fieldName);
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
    const fieldConfig = filterMenu.find((f) => f.value === fieldName);
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
        case 'enum':
          return {
            ...prev,
            [fieldName]: {
              ...currentState,
              enum: {
                ...currentState.enum!,
                option: event.target.value as EnumFilterOption,
              },
            },
          };

        case 'date':
          return {
            ...prev,
            [fieldName]: {
              ...currentState,
              date: {
                ...currentState.date!,
                option: event.target.value as DateFilterOption,
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
    // setIsModified(true);
    const fieldConfig = filterMenu.find((f) => f.value === fieldName);
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
                value: {
                  ...currentState.number?.value,
                  [event.target.name]: event.target.value,
                },
              },
            },
          };
        default:
          return prev;
      }
    });
  };

  const handleEnumSelectChange = (
    fieldName: string,
    isMultiple: boolean,
    value: string[]
  ) => {
    setFilterStates((prev: any) => {
      return {
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          enum: {
            ...prev[fieldName].enum,
            value: isMultiple ? value : [value],
          },
        },
      };
    });
  };

  const handleDateChange = (type: string, fieldName: string, value: string) => {
    setFilterStates((prev: any) => {
      return {
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          date: {
            ...prev[fieldName].date,
            value: {
              ...prev[fieldName].date.value,
              [type]: value,
            },
          },
        },
      };
    });
  };

  const renderFilterControls = (field: FieldConfig) => {
    if (!selectedFilters.includes(field.value)) return null;

    const fieldState = filterStates[field.value] || {};

    switch (field.type) {
      case 'text':
        return (
          <TextFilterControl
            filterStates={filterStates}
            menuOption={textOptions}
            fieldName={field.value}
            state={fieldState}
            onOptionChange={handleFilterOptionChange}
            onValueChange={handleFilterValueChange}
          />
        );
      case 'number':
        return (
          <NumberFilterControl
            filterStates={filterStates}
            menuOption={numberOptions}
            fieldName={field.value}
            state={fieldState}
            onOptionChange={handleFilterOptionChange}
            onValueChange={handleFilterValueChange}
          />
        );
      case 'enum':
        return (
          <EnumFilterControl
            filterStates={filterStates}
            menuOption={enumOptions}
            valueOptions={enumValueOptions}
            fieldName={field.value}
            state={fieldState}
            onOptionChange={handleFilterOptionChange}
            onChange={handleEnumSelectChange}
          />
        );
      case 'date':
        return (
          <DateFilterControl
            filterStates={filterStates}
            menuOption={dateOptions}
            fieldName={field.value}
            state={fieldState}
            onOptionChange={handleFilterOptionChange}
            onValueChange={handleDateChange}
            // onChange={handleBooleanChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box className='absolute top-100 right-85 z-50 w-[248px] max-h-[568px] bg-white shadow-lg border border-[#CBD6E2] rounded'>
      <Box className='flex justify-between items-center p-2 border-b border-[#CBD6E2]'>
        <Box>Filters</Box>
        <Button
          onClick={resetFilter}
          label='Reset'
          variant='text'
          sx={{
            textDecoration: 'underline',
            '&:hover': {
              background: 'none',
              color: '#F16137',
              textDecoration: 'underline',
            },
          }}
        />
      </Box>
      {filterMenu &&
        filterMenu.map((item, index) => (
          <>
            <Box
              key={index}
              className='flex gap-2 justify-between items-center p-2 border-b border-[#CBD6E2]'
              onClick={() => handleClickFilterMenu(item.value as string)}
            >
              <Box className='text-[#2D3E4F] font-light text-sm'>
                {item.name}
              </Box>
              <Box className='text-[#2D3E4F] '>
                <img
                  src={filterArrowRightIcon}
                  alt='icon'
                  className='w-[16px] h-[16px]'
                />
              </Box>
            </Box>
            {renderFilterControls(item)}
          </>
        ))}
      <Box className='flex  justify-end items-center gap-2 p-2'>
        <Button
          onClick={handleFilter}
          label='Cancel'
          sx={{
            height: '32px',
            border: '1px solid #CBD6E2',
            color: '#7D98B6',
            borderRadius: '2px',
            '&:hover': {
              background: 'none',
              color: '#7D98B6',
            },
          }}
        />
        <Button
          label='Find'
          sx={{
            height: '32px',
            background: '#F16137',
            color: '#FFFFFF',
            borderRadius: '2px',
            '&:hover': {
              background: '#F16137',
              color: '#FFFFFF',
            },
          }}
          onClick={handleApplyFilters}
        />
      </Box>
    </Box>
  );
};

export default Filter;
