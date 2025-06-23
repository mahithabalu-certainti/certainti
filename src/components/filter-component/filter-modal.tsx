/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import { ArrowIcon, CheckedIcon, CloseIcon } from '../../assets';
import {
  Menu,
  MenuItem,
  Popover,
  Select,
  SelectChangeEvent,
  Tooltip,
} from '@mui/material';
import {
  DateOptions,
  DateValueOptions,
  EnumSelectFilterOption,
  enumSelectOperators,
  FilterModalProps,
  FilterState,
  NumberFilterOption,
  numberOperators,
  textfieldOperators,
  TextFilterOption,
} from '../../consultant/types/account-filter';
import {
  getInitialStateForField,
  formatFilterForApi,
  clearFilters,
  storeFilters,
  getStoredFilters,
  validateFilters,
} from './utils';
import {
  NewTextFilterControl,
  NewMultiSelectFilterControl,
  NewNumberFilterControl,
  NewStatusFilterControl,
  NewBooleanFilterControl,
  SELECT_STYLES,
  MENU_PROPS,
  KeyContactFilterControl,
  NewDateFilterControl,
  EnumSelectFilterControl,
} from './helpers';
import { useLocation } from 'react-router-dom';

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  filterAnchorEl,
  filterId,
  setAppliedFilters,
  filterFields,
  setPage,
  handleCloseFilter,
  handleSorting,
}) => {
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [filterStates, setFilterStates] = useState<Record<string, FilterState>>(
    {}
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [selectedSystemFilters, setSelectedSystemFilters] = useState<string[]>(
    []
  );
  const [currentSort, setCurrentSort] = useState<string | null>(null);
  const [isApplyDisabled, setIsApplyDisabled] = useState(true);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const systemFilters = filterFields.filter(
    (field) => field.type === 'system' || field.type === 'system-sort'
  );
  const regularFilters = filterFields.filter(
    (field) => field.type !== 'system' && field.type !== 'system-sort'
  );

  const handleModalClose = () => {
    const saved = getStoredFilters();
    if (saved) {
      const selected = Object.keys(saved);
      const savedFilters = saved as Record<string, FilterState>;
      setSelectedFilters(selected);
      setFilterStates(saved as Record<string, FilterState>);
      const systemFilter = savedFilters['system_filter'];
      if (systemFilter && systemFilter.system?.values) {
        setSelectedSystemFilters(systemFilter.system.values);
      }
    } else {
      setSelectedFilters([]);
      setFilterStates({});
      setSelectedSystemFilters([]);
    }
    handleCloseFilter();
  };

  useEffect(() => {
    const saved = getStoredFilters();
    if (saved) {
      const selected = Object.keys(saved);
      const savedFilters = saved as Record<string, FilterState>;
      setSelectedFilters(selected);
      setFilterStates(saved as Record<string, FilterState>);
      const systemFilter = savedFilters['system_filter'];
      if (systemFilter && systemFilter.system?.values) {
        setSelectedSystemFilters(systemFilter.system.values);
      }
      setAppliedFilters(
        formatFilterForApi(saved as Record<string, FilterState>)
      );
    }
  }, []);

  useEffect(() => {
    const saved = getStoredFilters();
    if (filterFields.length > 0 && !saved) {
      // Automatically select the first field if no saved filters exist
      const firstField = filterFields[0];
      setSelectedFilters([firstField.name]);
      setFilterStates({
        [firstField.name]: getInitialStateForField(firstField),
      });
    }
  }, [filterFields]);

  useEffect(() => {
    const hasInvalid = validateFilters(filterStates);
    setIsApplyDisabled(hasInvalid);
  }, [filterStates]);

  useEffect(() => {
    const handleRouteChange = () => {
      clearFilters();
      setSelectedFilters([]);
      setFilterStates({});
      setAppliedFilters({});
      setSelectedSystemFilters([]);
      setCurrentSort(null);
      handleSorting?.('', 'desc');
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
          case 'enumSelect':
            return {
              ...prev,
              [fieldName]: {
                ...currentState,
                enumSelect: {
                  ...currentState.enumSelect!,
                  option: event.target.value as EnumSelectFilterOption,
                  value: [],
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
          case 'keyContact': {
            const key = event.target.name; // 'roleOption' or 'nameOption'
            const value = event.target.value;

            const keyContact = currentState.keyContact || {
              role: { option: 'contains', value: '' },
              name: { option: 'contains', value: '' },
            };

            if (key === 'roleOption') {
              return {
                ...prev,
                [fieldName]: {
                  ...currentState,
                  keyContact: {
                    ...keyContact,
                    role: {
                      option: value,
                      value:
                        value === 'is_empty' ? 'true' : keyContact.role.value,
                    },
                  },
                },
              };
            }

            if (key === 'nameOption') {
              return {
                ...prev,
                [fieldName]: {
                  ...currentState,
                  keyContact: {
                    ...keyContact,
                    name: {
                      option: value,
                      value:
                        value === 'is_empty' ? 'true' : keyContact.name.value,
                    },
                  },
                },
              };
            }

            return prev;
          }
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

  const handleSystemFilter = (fieldName: string, filterValue: string) => {
    setSelectedSystemFilters((prevSelected) => {
      const updatedSelected = prevSelected.includes(filterValue)
        ? prevSelected.filter((val) => val !== filterValue) // remove
        : [...prevSelected, filterValue]; // add

      const updatedFilterStates = { ...filterStates };

      if (updatedSelected.length === 0) {
        delete updatedFilterStates[fieldName];
      } else {
        updatedFilterStates[fieldName] = {
          system: { values: updatedSelected },
        };
      }

      setFilterStates(updatedFilterStates);
      const formattedFilters = formatFilterForApi(updatedFilterStates);
      setAppliedFilters(formattedFilters);
      storeFilters(updatedFilterStates);

      return updatedSelected;
    });
  };

  const handleSortingSelection = (sortValue: string) => {
    if (currentSort === sortValue) {
      setCurrentSort(null);
      handleSorting?.('', 'desc');
    } else {
      setCurrentSort(sortValue);
      const parts = sortValue.split('_');
      const direction = parts.pop() as 'asc' | 'desc';
      const field = parts.join('_');
      handleSorting?.(field, direction);
    }
  };

  const handleBooleanChange = (fieldName: string, value: boolean) => {
    setFilterStates((prev) => ({
      ...prev,
      [fieldName]: { boolean: { option: 'equals', value } },
    }));
  };

  const handleKeyContactSelectChange = (
    fieldName: string,
    type: 'role' | 'name',
    value: string
  ) => {
    setFilterStates((prev: Record<string, FilterState>) => {
      const currentState = prev[fieldName] || {};
      const keyContact = currentState.keyContact || {
        role: { option: 'contains', value: '' },
        name: { option: 'contains', value: '' },
      };

      // If changing name option to 'is_empty', clear the name value
      if (type === 'name' && value === 'is_empty') {
        return {
          ...prev,
          [fieldName]: {
            ...currentState,
            keyContact: {
              ...keyContact,
              name: {
                option: 'is_empty',
                value: 'true',
              },
            },
          },
        };
      }

      return {
        ...prev,
        [fieldName]: {
          ...currentState,
          keyContact: {
            ...keyContact,
            [type]: {
              ...keyContact[type],
              value: value,
            },
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

  const handleEnumSelectChange = (fieldName: string, value: string[]) => {
    setFilterStates((prev: any) => {
      return {
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          enumSelect: {
            ...prev[fieldName].enumSelect,
            value: value,
          },
        },
      };
    });
  };

  const handleApplyFilters = () => {
    const updatedStates = { ...filterStates };
    const hasInvalid = validateFilters(updatedStates);

    if (hasInvalid) {
      setFilterStates(updatedStates);
      setIsApplyDisabled(true);
      return;
    }

    setPage(1);
    setAppliedFilters(formatFilterForApi(filterStates));
    storeFilters(filterStates);
  };

  const handleResetFilters = () => {
    if (!Object.keys(filterStates).length) return null;
    handleCloseFilter();
    setSelectedFilters([]);
    setFilterStates({});
    setAppliedFilters({});
    setSelectedSystemFilters([]);
    setCurrentSort(null);
    handleSorting?.('', 'desc');
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
            menuOption={fieldConfig.operatorOption || textfieldOperators}
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
            menuOption={fieldConfig.operatorOption || numberOperators}
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
      case 'enumSelect':
        return (
          <EnumSelectFilterControl
            filterStates={filterStates}
            menuOption={fieldConfig.operatorOption || enumSelectOperators}
            valueOptions={
              (fieldConfig.options as { label: string; value: string }[]) || []
            }
            fieldName={fieldName}
            state={state}
            onOptionChange={handleFilterOptionChange}
            onChange={handleEnumSelectChange}
          />
        );
      case 'date':
        return (
          <NewDateFilterControl
            filterStates={filterStates}
            menuOption={fieldConfig.operatorOption || DateValueOptions}
            fieldName={fieldName}
            state={state}
            onOptionChange={handleFilterOptionChange}
            onValueChange={handleDateChange}
            mode={'date'}
            // onChange={handleBooleanChange}
          />
        );
      case 'keyContact':
        return (
          <KeyContactFilterControl
            filterStates={filterStates}
            menuOption={
              fieldConfig.operatorOption as { label: string; value: string }[]
            }
            valueOptions={
              fieldConfig.options as { label: string; value: string }[]
            }
            fieldName={fieldName}
            state={state}
            onOptionChange={handleFilterOptionChange}
            onChange={handleKeyContactSelectChange}
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
      onClose={handleModalClose}
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
          boxShadow: '0px 4px 15px 11px #0000001A',
          bgcolor: 'transparent',
          mt: 0.5,
          borderRadius: '8px',
          border: '1px solid #CBD6E2',
        },
      }}
    >
      <div className='h-auto min-h-[165px] w-[550px] min-w-[550px] max-w-[550px] flex flex-col gap-4 bg-white p-6'>
        <div className='flex justify-between items-center'>
          <h2 className='text-[16px] font-bold text-[#2D3E4F]'>Filters</h2>
          <div className='flex justify-end gap-4'>
            <Tooltip
              title={
                isApplyDisabled ? 'Fill all added filter fields to apply' : ''
              }
              disableHoverListener={!isApplyDisabled}
              placement='top'
              arrow
            >
              <span className='text-[12px] font-medium text-[#425A76]'>
                <button
                  onClick={handleApplyFilters}
                  disabled={isApplyDisabled}
                  className='text-[12px] font-medium text-[#425A76] underline cursor-pointer hover:text-[#131a20] disabled:opacity-45'
                >
                  Apply
                </button>
              </span>
            </Tooltip>
            <button
              onClick={handleResetFilters}
              className='text-[12px] font-medium text-[#425A76] underline cursor-pointer hover:text-[#FF6666]'
            >
              Clear
            </button>
          </div>
        </div>

        {systemFilters.length > 0 && (
          <div>
            <h3 className='text-[13px] font-bold text-[#425A76] mb-2'>
              System Define filters
            </h3>
            <div className='flex gap-2 flex-wrap'>
              {/* Render system filters */}
              {systemFilters
                .filter((filter) => filter.type === 'system')
                .flatMap((systemFilter) =>
                  systemFilter.options?.map((field: any) => (
                    <button
                      key={field.value}
                      className={`border rounded-full px-1.5 h-[24px] text-[12px] font-normal flex items-center gap-0.5 cursor-pointer ${
                        selectedSystemFilters.includes(field.value)
                          ? 'bg-[#E6F9EA] border-[#34C759] text-[#0F5132]'
                          : 'border-[#CBD6E2] text-[#425A76] hover:bg-gray-50'
                      }`}
                      onClick={() =>
                        handleSystemFilter('system_filter', field.value)
                      }
                    >
                      <CheckedIcon
                        alt='checked-icon'
                        className='w-3 h-3 mt-[0.3px]'
                        style={{
                          filter: selectedSystemFilters.includes(field.value)
                            ? 'invert(56%) sepia(96%) saturate(676%) hue-rotate(80deg) brightness(95%) contrast(101%)'
                            : 'none',
                        }}
                      />
                      {field.label}
                    </button>
                  ))
                )}

              {/* Render sort options */}
              {systemFilters
                .filter((filter) => filter.type === 'system-sort')
                .flatMap((sortFilter) =>
                  sortFilter.options?.map((field: any) => (
                    <button
                      key={field.value}
                      className={`border rounded-full px-1.5 h-[24px] text-[12px] font-normal flex items-center gap-0.5 cursor-pointer ${
                        currentSort === field.value
                          ? 'bg-[#E6F9EA] border-[#34C759] text-[#0F5132]'
                          : 'border-[#CBD6E2] text-[#425A76] hover:bg-gray-50'
                      }`}
                      onClick={() => handleSortingSelection(field.value)}
                    >
                      <CheckedIcon
                        alt='checked-icon'
                        className='w-3 h-3 mt-[0.3px]'
                        style={{
                          filter:
                            currentSort === field.value
                              ? 'invert(56%) sepia(96%) saturate(676%) hue-rotate(80deg) brightness(95%) contrast(101%)'
                              : 'none',
                        }}
                      />
                      {field.label}
                    </button>
                  ))
                )}
            </div>
          </div>
        )}

        {selectedFilters.length > 0 && (
          <div className='flex-1'>
            <h3 className='text-[13px] font-bold text-[#425A76] mb-2'>
              All filters
            </h3>
            <div className='flex flex-col gap-3 mb-1 pt-1 -mr-6 min-h-[40px] overflow-y-auto max-h-[150px]'>
              {selectedFilters.map((fieldName) => {
                const fieldConfig = regularFilters.find(
                  (f) => f.name === fieldName
                );
                return fieldConfig ? (
                  <div key={fieldName}>
                    <div className='flex items-center gap-2'>
                      <div className='flex-1 flex items-start gap-2 w-[480px] max-w-[480px]'>
                        <div className='flex flex-col items-center gap-1'>
                          <Select
                            size='small'
                            value={fieldName}
                            className='min-w-[173px] max-w-[173px] h-[28px]'
                            IconComponent={(props) => (
                              <ArrowIcon alt='arrowIcon' {...props} />
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
                                  <CheckedIcon alt='checked' className='w-3' />
                                  <span className='max-w-[173px] text-ellipsis overflow-hidden'>
                                    {selectedField?.label || selected}
                                  </span>
                                </div>
                              );
                            }}
                          >
                            {regularFilters.map((field) => (
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
                                  overflow: 'hidden',
                                }}
                              >
                                <CheckedIcon
                                  alt='checked'
                                  className='w-4 h-4'
                                  style={{ flexShrink: 0 }}
                                />
                                {field.label}
                              </MenuItem>
                            ))}
                          </Select>
                          {fieldConfig.name === 'key_contact' &&
                            filterStates?.key_contact?.keyContact?.role
                              ?.value &&
                            filterStates?.key_contact?.keyContact?.role
                              ?.option !== 'is_empty' && (
                              <div className='mt-1 rounded-[2px] min-w-[173px] max-w-[173px] h-[28px] border border-[#CBD6E2]'>
                                <div className='flex items-center justify-between pl-3.5 pr-[7px] text-[12px] text-[#425A76] h-full font-semibold'>
                                  <div className='flex items-center gap-1'>
                                    <CheckedIcon
                                      alt='checked'
                                      className='w-3'
                                    />
                                    <span>Name</span>
                                  </div>
                                  {/* <img src={arrowIcon} alt='arrowIcon' /> */}
                                </div>
                              </div>
                            )}
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
                        <CloseIcon
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

        <div className='flex-1 flex items-end justify-between mt-1'>
          <button
            ref={buttonRef}
            onClick={handleClick}
            className='text-[14px] font-bold text-[#425A76] flex items-center gap-1 cursor-pointer'
          >
            <span className='font-normal text-[16px]'>+</span> Add Filter By
            Fields
            <ArrowIcon alt='arrowIcon' className='mt-0.5' />
          </button>
        </div>
      </div>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            minWidth: 170,
            maxWidth: 170,
            borderRadius: '8px',
            border: '1px solid #CBD6E2',
            boxShadow: 'none',
            maxHeight: 250,
          },
        }}
      >
        {regularFilters.filter((field) => !selectedFilters.includes(field.name))
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
          regularFilters
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
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                <CheckedIcon
                  alt='checked'
                  className='w-4 h-4 mr-1'
                  style={{ flexShrink: 0 }}
                />
                {field.label}
              </MenuItem>
            ))
        )}
      </Menu>
    </Popover>
  );
};

export default FilterModal;
