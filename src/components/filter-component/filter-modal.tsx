/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import { arrowIcon, checkedIcon, closeIcon } from '../../assets';
import {
  Menu,
  MenuItem,
  Popover,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import {
  DateOptions,
  FilterModalProps,
  FilterState,
  NumberFilterOption,
  TextFilterOption,
} from '../../consultant/types/account-filter';
import {
  getInitialStateForField,
  formatFilterForApi,
  clearFilters,
  storeFilters,
  getStoredFilters,
} from './utils';
import {
  NewTextFilterControl,
  NewMultiSelectFilterControl,
  NewNumberFilterControl,
  NewStatusFilterControl,
  NewBooleanFilterControl,
  SELECT_STYLES,
  MENU_PROPS,
  DateFilterControl,
} from './helpers';
import { useLocation } from 'react-router-dom';

const systemFilters = ['Touched Records', 'Untouched Records', 'Record Action'];

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  filterAnchorEl,
  filterId,
  setAppliedFilters,
  filterFields,
  setPage,
  handleCloseFilter,
}) => {
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [filterStates, setFilterStates] = useState<Record<string, FilterState>>(
    {}
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const saved = getStoredFilters();
    if (saved) {
      const selected = Object.keys(saved);
      setSelectedFilters(selected);
      setFilterStates(saved as Record<string, FilterState>);
      setAppliedFilters(
        formatFilterForApi(saved as Record<string, FilterState>)
      );
    }
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      clearFilters();
      setSelectedFilters([]);
      setFilterStates({});
      setAppliedFilters({});
    };

    const currentPathname = location.pathname;

    const unListen = () => {
      if (window.location.pathname !== currentPathname) {
        handleRouteChange();
      }
    };

    return unListen;
  }, [location.pathname]);

  const handleFilterSelect = (field: string) => {
    const fieldConfig = filterFields.find((f) => f.name === field);
    if (fieldConfig) {
      setSelectedFilters((prev) => [...prev, field]);
      setFilterStates((prev) => ({
        ...prev,
        [field]: getInitialStateForField(fieldConfig),
      }));
    }
    handleClose();
  };

  const handleFilterOptionChange = (
    fieldName: string,
    event: SelectChangeEvent<any>
  ) => {
    setFilterStates(
      (prev: Record<string, FilterState>): Record<string, FilterState> => {
        const currentState = prev[fieldName];
        if (!currentState) return prev;

        const fieldConfig = filterFields.find((f) => f.name === fieldName);
        if (!fieldConfig) return prev;

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
          case 'date':
            return {
              ...prev,
              [fieldName]: {
                ...currentState,
                date: {
                  ...currentState.date!,
                  option: event.target.value as DateOptions,
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
      }
    );
  };

  const handleFilterValueChange = (
    fieldName: string,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index?: number,
    targetKey: 'value' | 'toValue' = 'value'
  ) => {
    setPage(1);
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
            const valueArray = Array.isArray(currentState.number.value)
              ? currentState.number.value
              : ['', ''];

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
            };
          }
        case 'date':
          return {
            ...prev,
            [fieldName]: {
              ...currentState,
              date: {
                ...currentState.date!,
                [targetKey]: event.target.value,
              },
            },
          };
        default:
          return prev;
      }
    });
  };

  const handleMultiSelectChange = (fieldName: string, values: string[]) => {
    setFilterStates((prev) => ({
      ...prev,
      [fieldName]: { multiSelect: { values } },
    }));
  };

  const handleBooleanChange = (fieldName: string, value: boolean) => {
    setFilterStates((prev) => ({
      ...prev,
      [fieldName]: { boolean: { option: 'equals', value } },
    }));
  };

  const handleApplyFilters = () => {
    setPage(1);
    const updatedStates = { ...filterStates };
    let hasInvalid = false;

    for (const key in updatedStates) {
      const state = updatedStates[key];

      if (state.date) {
        const isValueEmpty = !state.date.value?.trim();
        const isToValueEmpty =
          state.date.option === 'between' && !state.date.toValue?.trim();

        if (isValueEmpty || isToValueEmpty) {
          hasInvalid = true;
        }
      }

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
        const isEmpty =
          !Array.isArray(state.multiSelect.values) ||
          state.multiSelect.values.length === 0;
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
    if (!Object.keys(filterStates).length) return null;

    setSelectedFilters([]);
    setFilterStates({});
    setAppliedFilters({});
    clearFilters();
  };

  const renderFilterControl = (fieldName: string) => {
    const fieldConfig = filterFields.find((f) => f.name === fieldName);
    if (!fieldConfig) return null;

    const state = filterStates[fieldName];

    switch (fieldConfig.type) {
      case 'text':
        return (
          <NewTextFilterControl
            fieldName={fieldName}
            state={state}
            onOptionChange={handleFilterOptionChange}
            onValueChange={handleFilterValueChange}
          />
        );
      case 'multi-select':
        return (
          <NewMultiSelectFilterControl
            fieldName={fieldName}
            state={state}
            options={fieldConfig.options as string[]}
            onChange={handleMultiSelectChange}
          />
        );
      case 'number':
        return (
          <NewNumberFilterControl
            fieldName={fieldName}
            state={state}
            onOptionChange={handleFilterOptionChange}
            onValueChange={handleFilterValueChange}
          />
        );
      case 'status':
        return (
          <NewStatusFilterControl
            fieldName={fieldName}
            state={state}
            options={fieldConfig.options as { value: string; label: string }[]}
            onOptionChange={handleFilterOptionChange}
          />
        );
      case 'boolean':
        return (
          <NewBooleanFilterControl
            fieldName={fieldName}
            state={state}
            onChange={handleBooleanChange}
          />
        );
      case 'date':
        return (
          <DateFilterControl
            fieldName={fieldName}
            state={state}
            onOptionChange={handleFilterOptionChange}
            onValueChange={handleFilterValueChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Popover
      id={filterId}
      open={isOpen}
      anchorEl={filterAnchorEl}
      onClose={handleCloseFilter}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          boxShadow: 'none',
          bgcolor: 'transparent',
          mt: 0.5,
        },
      }}
    >
      <div className='h-auto min-h-[165px] w-[530px] min-w-[530px] max-w-[530px] flex flex-col gap-4 bg-white rounded-[8px] p-6 border border-[#CBD6E2]'>
        <div className='flex justify-between items-center'>
          <h2 className='text-[16px] font-bold text-[#2D3E4F]'>Filters</h2>
          <div className='flex justify-end gap-4'>
            <button
              onClick={handleApplyFilters}
              className='text-[12px] font-medium text-[#425A76] underline cursor-pointer hover:text-[#131a20]'
            >
              Apply
            </button>
            <button
              onClick={handleResetFilters}
              className='text-[12px] font-medium text-[#425A76] underline cursor-pointer hover:text-[#FF6666]'
            >
              Clear
            </button>
          </div>
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
              {selectedFilters.map((fieldName) => {
                const fieldConfig = filterFields.find(
                  (f) => f.name === fieldName
                );
                return fieldConfig ? (
                  <div key={fieldName}>
                    <div className='flex items-center gap-2'>
                      <div className='flex-1 flex items-center gap-2 w-[450px] max-w-[450px]'>
                        <div className='flex items-center gap-1'>
                          <Select
                            size='small'
                            value={fieldName}
                            className='min-w-[173px] max-w-[173px] h-[28px]'
                            IconComponent={(props) => (
                              <img src={arrowIcon} alt='arrowIcon' {...props} />
                            )}
                            onChange={(e) => {
                              const newFieldName = e.target.value;
                              const newFieldConfig = filterFields.find(
                                (f) => f.name === newFieldName
                              );
                              if (newFieldConfig) {
                                setSelectedFilters((prev) => {
                                  const index = prev.indexOf(fieldName);
                                  const newFilters = [...prev];
                                  newFilters[index] = newFieldName;
                                  return newFilters;
                                });
                                setFilterStates((prev) => {
                                  const newState = { ...prev };
                                  delete newState[fieldName];
                                  newState[newFieldName] =
                                    getInitialStateForField(newFieldConfig);
                                  return newState;
                                });
                              }
                            }}
                            sx={SELECT_STYLES}
                            MenuProps={{
                              ...MENU_PROPS,
                              PaperProps: {
                                ...MENU_PROPS.PaperProps,
                                style: {
                                  ...(MENU_PROPS.PaperProps?.style || {}),
                                  width: 100,
                                  maxWidth: 100,
                                  maxHeight: 200,
                                },
                              },
                            }}
                            renderValue={(selected) => {
                              const selectedField = filterFields.find(
                                (f) => f.name === selected
                              );
                              return (
                                <div className='flex items-center gap-1'>
                                  <img
                                    src={checkedIcon}
                                    alt='checked'
                                    className='w-3'
                                  />
                                  <span className='pt-0.5'>
                                    {selectedField?.label || selected}
                                  </span>
                                </div>
                              );
                            }}
                          >
                            {filterFields.map((field) => (
                              <MenuItem
                                key={field.name}
                                value={field.name}
                                disabled={
                                  selectedFilters.includes(field.name) &&
                                  field.name !== fieldName
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
                                {field.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </div>
                        {renderFilterControl(fieldName)}
                      </div>
                      <button
                        onClick={() => {
                          const newSelectedFilters = selectedFilters.filter(
                            (f) => f !== fieldName
                          );
                          if (newSelectedFilters.length === 0) {
                            handleResetFilters();
                          } else {
                            setSelectedFilters(newSelectedFilters);
                            setFilterStates((prev) => {
                              const newState = { ...prev };
                              delete newState[fieldName];
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
          {/* <div className='flex justify-end gap-2'>
            <button
              className='text-[12px] rounded-[2px] text-[#425A76] h-[24px] flex items-center px-2 border border-[#CBD6E2] cursor-pointer'
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #E4E6E7 100%)',
              }}
              onClick={handleCloseFilter}
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
          </div> */}
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
        {filterFields.filter((field) => !selectedFilters.includes(field.name))
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
          filterFields
            .filter((field) => !selectedFilters.includes(field.name))
            .map((field) => (
              <MenuItem
                key={field.name}
                onClick={() => handleFilterSelect(field.name)}
                sx={{
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '30px',
                  color: '#425A76',
                  py: '1px',
                }}
              >
                <img src={checkedIcon} alt='checked' className='w-4 mr-1' />
                {field.label}
              </MenuItem>
            ))
        )}
      </Menu>
    </Popover>
  );
};

export default FilterModal;
