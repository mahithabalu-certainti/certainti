/* eslint-disable @typescript-eslint/no-explicit-any */
import { Menu, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { arrowIcon, checkedIcon, closeIcon } from '../../../../../assets';
import { getInitialStateForField } from '../../sidebar-pages/resources/utils';
import {
  DateFilterOption,
  dateOptions,
  EnumFilterOption,
  enumOptions,
  FilterComponentProps,
  FilterState,
  NumberFilterOption,
  numberOptions,
  TextFilterOption,
  TextFilterOptionForCostAndSkill,
  textOptionForCostAndSkill,
  textOptions,
} from './filterType';
import {
  CurrencySelectFilterControl,
  DateFilterControl,
  EnumFilterControl,
  formatFilterForApi,
  NumberFilterControl,
  StatusFilterControl,
  TextFilterControl,
  TextFilterControlForCostAndSKill,
} from './helper';
import { resetFilter } from './utils';
import {
  MENU_PROPS,
  SELECT_STYLES,
} from '../../../../../components/filter-component/helpers';

const systemFilters = ['Touched Records', 'Untouched Records', 'Record Action'];

// filter to use in resource, cost and skill list pages
const Filter: React.FC<FilterComponentProps> = ({
  filterMenu,
  setAppliedFilters,
  handleFilter,
  savedFilterStates = {},
  onFilterStatesChange,
  savedSelectedFilters = [],
  onSelectedFiltersChange,
  setCurrentPage,
  mode,
}) => {
  const [selectedFilters, setSelectedFilters] =
    useState<string[]>(savedSelectedFilters);
  const [filterStates, setFilterStates] =
    useState<Record<string, FilterState>>(savedFilterStates);

  //new
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  // const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  // const [filterStates, setFilterStates] = useState<Record<string, FilterState>>(
  //   {}
  // );
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleFilterSelect = (field: string) => {
    const fieldConfig = filterMenu.find((f) => f.value === field);
    if (fieldConfig) {
      setSelectedFilters((prev) => [...prev, field]);
      setFilterStates((prev) => ({
        ...prev,
        [field]: getInitialStateForField(fieldConfig),
      }));
    }
    handleClose();
  };

  // Update parent component when local states change
  useEffect(() => {
    if (onFilterStatesChange) {
      onFilterStatesChange(filterStates);
    }
  }, [filterStates, onFilterStatesChange]);

  useEffect(() => {
    if (onSelectedFiltersChange) {
      onSelectedFiltersChange(selectedFilters);
    }
  }, [selectedFilters, onSelectedFiltersChange]);

  const handleApplyFilters = () => {
    const formattedFilters = formatFilterForApi(filterStates);
    setAppliedFilters(formattedFilters);
    setCurrentPage(0);
    // handleFilter();
  };

  const handleResetFilter = () => {
    if (!Object.keys(filterStates).length) return null;

    resetFilter({
      setAppliedFilters,
      setFilterStates,
      setSelectedFilters,
      onFilterStatesChange,
      onSelectedFiltersChange,
    });
  };

  // const handleClickFilterMenu = (fieldName: string) => {
  //   setSelectedFilters((prev) =>
  //     prev.includes(fieldName)
  //       ? prev.filter((item) => item !== fieldName)
  //       : [...prev, fieldName]
  //   );

  //   if (!filterStates[fieldName]) {
  //     const fieldConfig = filterMenu.find((f) => f.value === fieldName);
  //     if (!fieldConfig) return;

  //     setFilterStates((prev) => ({
  //       ...prev,
  //       [fieldName]: getInitialStateForField(fieldConfig),
  //     }));
  //   }
  // };

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
        case 'textCostAndSkill':
          return {
            ...prev,
            [fieldName]: {
              ...currentState,
              textCostAndSkill: {
                ...currentState.textCostAndSkill!,
                option: event.target.value as TextFilterOptionForCostAndSkill,
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
                value: [],
              },
            },
          };
        case 'currencySelect':
          return {
            ...prev,
            [fieldName]: {
              ...currentState,
              currencySelect: {
                ...currentState.currencySelect!,
                option: event.target.value as EnumFilterOption,
                value: [],
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
        case 'select':
          return {
            ...prev,
            [fieldName]: {
              ...currentState,
              select: {
                ...currentState.select!,
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
        case 'textCostAndSkill':
          return {
            ...prev,
            [fieldName]: {
              ...currentState,
              textCostAndSkill: {
                ...currentState.textCostAndSkill!,
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
    // isMultiple: boolean,
    value: string[] | string
  ) => {
    setFilterStates((prev: any) => {
      return {
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          enum: {
            ...prev[fieldName].enum,
            // value: isMultiple ? value : [value]
            value: value,
          },
        },
      };
    });
  };
  const handleCurrencySelectChange = (fieldName: string, value: string[]) => {
    setFilterStates((prev: any) => {
      return {
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          currencySelect: {
            ...prev[fieldName].currencySelect,
            value: value,
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

  const renderFilterControls = (fieldName: string) => {
    if (!selectedFilters.includes(fieldName)) return null;

    const field = filterMenu.find((f) => f.value === fieldName);
    if (!field) return null;

    const fieldState = filterStates[field.value] || {};
    let enabled = false;
    if (field.value === 'skill_subtype_rid') {
      const skillTypeValue = filterStates['skill_type_rid']?.enum?.value;
      enabled = !!skillTypeValue && !!skillTypeValue[0]; // Only enable if skill type is selected

      return (
        <EnumFilterControl
          filterStates={filterStates}
          menuOption={enumOptions}
          valueOptions={field.options as { option: string; value: string }[]}
          fieldName={field.value}
          state={fieldState}
          onOptionChange={handleFilterOptionChange}
          onChange={handleEnumSelectChange}
          disabled={!enabled}
        />
      );
    }

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
      case 'textCostAndSkill':
        return (
          <TextFilterControlForCostAndSKill
            filterStates={filterStates}
            menuOption={textOptionForCostAndSkill}
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
            valueOptions={field.options as { option: string; value: string }[]}
            fieldName={field.value}
            state={fieldState}
            onOptionChange={handleFilterOptionChange}
            onChange={handleEnumSelectChange}
          />
        );
      case 'currencySelect':
        return (
          <CurrencySelectFilterControl
            filterStates={filterStates}
            menuOption={enumOptions}
            valueOptions={field.options || []}
            fieldName={field.value}
            state={fieldState}
            onOptionChange={handleFilterOptionChange}
            onChange={handleCurrencySelectChange}
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
            mode={mode as 'date' | 'year'}
            // onChange={handleBooleanChange}
          />
        );
      case 'select':
        return (
          <StatusFilterControl
            menuOption={field.options as { option: string; value: string }[]}
            fieldName={field.value}
            state={fieldState}
            onOptionChange={handleFilterOptionChange}
          />
        );
      default:
        return null;
    }
  };
  return (
    <>
      <div className='h-auto min-h-[165px] w-[530px] min-w-[530px] max-w-[530px] mt-1 flex flex-col gap-4 bg-white rounded-[8px] p-6 border border-[#CBD6E2]'>
        <div className='flex justify-between items-center'>
          <h2 className='text-[16px] font-bold text-[#2D3E4F]'>Filters</h2>
          <button
            onClick={handleResetFilter}
            className='text-[12px] font-medium text-[#425A76] underline cursor-pointer hover:text-[#FF6666]'
          >
            Clear
          </button>
        </div>

        <div>
          <h3 className='text-[13px] font-bold text-[#425A76] mb-2'>
            System Define filters
          </h3>
          <div className='flex gap-2 flex-wrap'>
            {systemFilters.map((label) => (
              <span
                key={label}
                className='border border-[#CBD6E2] cursor-pointer rounded-full px-1 h-[24px] text-[12px] font-normal flex items-center gap-0.5 text-[#425A76]'
              >
                <img src={checkedIcon} alt='checked-icon' />
                {label}
              </span>
            ))}
          </div>
        </div>

        {selectedFilters.length > 0 && (
          <div className='flex-1'>
            <h3 className='text-[13px] font-bold text-[#425A76] mb-2'>
              All filters
            </h3>
            <div className='flex flex-col gap-3 mb-1 pt-1 -mr-6 min-h-[80px] overflow-y-auto max-h-[150px]'>
              {selectedFilters.map((fieldValue) => {
                const fieldConfig = filterMenu.find(
                  (f) => f.value === fieldValue
                );
                return fieldConfig ? (
                  <div key={fieldValue}>
                    <div className='flex items-center gap-2'>
                      <div className='flex-1 flex items-center gap-2 w-[450px] max-w-[450px]'>
                        <div className='flex items-center gap-1'>
                          <Select
                            size='small'
                            value={fieldValue}
                            className='min-w-[173px] max-w-[173px] h-[28px]'
                            IconComponent={(props) => (
                              <img src={arrowIcon} alt='arrowIcon' {...props} />
                            )}
                            onChange={(e) => {
                              const newFieldValue = e.target.value;
                              const newFieldConfig = filterMenu.find(
                                (f) => f.value === newFieldValue
                              );
                              if (newFieldConfig) {
                                setSelectedFilters((prev) => {
                                  const index = prev.indexOf(fieldValue);
                                  const newFilters = [...prev];
                                  newFilters[index] = newFieldValue;
                                  return newFilters;
                                });
                                setFilterStates((prev) => {
                                  const newState = { ...prev };
                                  delete newState[fieldValue];
                                  newState[newFieldValue] =
                                    getInitialStateForField(newFieldConfig);
                                  return newState;
                                });
                              }
                            }}
                            sx={SELECT_STYLES}
                            MenuProps={MENU_PROPS}
                            renderValue={(selected) => {
                              const selectedField = filterMenu.find(
                                (f) => f.value === selected
                              );
                              return (
                                <div className='flex items-center gap-1'>
                                  <img
                                    src={checkedIcon}
                                    alt='checked'
                                    className='w-3'
                                  />
                                  <span className='pt-0.5'>
                                    {selectedField?.name || selected}
                                  </span>
                                </div>
                              );
                            }}
                          >
                            {filterMenu.map((field) => (
                              <MenuItem
                                key={field.value}
                                value={field.value}
                                disabled={
                                  selectedFilters.includes(field.value) &&
                                  field.value !== fieldValue
                                }
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '14px',
                                  lineHeight: '30px',
                                  color: '#425A76',
                                  py: '1px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <img
                                  src={checkedIcon}
                                  alt='checked'
                                  className='w-4'
                                />
                                {field.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </div>
                        {renderFilterControls(fieldValue)}
                      </div>
                      <button
                        onClick={() => {
                          const fieldToRemove = [fieldValue];
                          
                          // If clearing skill_type_rid, also remove skill_subtype_rid
                          if (fieldValue === 'skill_type_rid' && selectedFilters.includes('skill_subtype_rid')) {
                            fieldToRemove.push('skill_subtype_rid');
                          }
                          
                          const newSelectedFilters = selectedFilters.filter(
                            (f) => !fieldToRemove.includes(f)
                          );
                          
                          if (newSelectedFilters.length === 0) {
                            handleResetFilter();
                          } else {
                            setSelectedFilters(newSelectedFilters);
                            setFilterStates((prev) => {
                              const newState = { ...prev };
                              fieldToRemove.forEach(field => delete newState[field]);
                              return newState;
                            });
                          }
                        }}
                        className='cursor-pointer pl-1'
                      >
                        <img
                          src={closeIcon}
                          alt='closeIcon'
                          className='w-[12px] h-[12px]'
                        />
                      </button>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        <div className='flex items-center justify-between mt-1'>
          <button
            ref={buttonRef}
            onClick={handleClick}
            className='text-[14px] font-bold text-[#425A76] flex items-center gap-1 cursor-pointer'
          >
            <span className='font-normal text-[16px]'>+</span> Add Filter By
            Fields
            <img src={arrowIcon} alt={'arrowIcon'} className='mt-0.5' />
          </button>
          <div className='flex justify-end gap-2'>
            <button
              className='text-[12px] rounded-[2px] text-[#425A76] h-[24px] flex items-center px-2 border border-[#CBD6E2] cursor-pointer'
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
              }}
              onClick={handleFilter}
            >
              Close
            </button>
            <button
              className='text-[12px] rounded-[2px] text-[#425A76] h-[24px] flex items-center px-2 border border-[#CBD6E2] cursor-pointer'
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
              }}
              onClick={handleApplyFilters}
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            minWidth: 170,
            borderRadius: '8px',
            border: '1px solid #CBD6E2',
            boxShadow: 'none',
          },
        }}
      >
        {filterMenu.filter((field) => !selectedFilters.includes(field.value))
          .length === 0 ? (
          <MenuItem
            disabled
            sx={{
              fontWeight: 600,
              fontSize: '14px',
              lineHeight: '30px',
              color: '#425A76',
              py: '1px',
              justifyContent: 'center',
            }}
          >
            No fields available
          </MenuItem>
        ) : (
          filterMenu
            .filter((field) => !selectedFilters.includes(field.value))
            .map((field) => (
              <MenuItem
                key={field.name}
                onClick={() => handleFilterSelect(field.value)}
                sx={{
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '30px',
                  color: '#425A76',
                  py: '1px',
                }}
              >
                <img src={checkedIcon} alt='checked' className='w-4 mr-1' />
                {field.name}
              </MenuItem>
            ))
        )}
      </Menu>
    </>
  );
};

export default Filter;
