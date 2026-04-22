/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Menu,
  MenuItem,
  Popover,
  Select,
  SelectChangeEvent,
  Tooltip,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { getInitialStateForField } from '../../sidebar-pages/resources/utils';
import {
  DateFilterOption,
  dateOptions,
  EnumFilterOption,
  enumOptions,
  FieldConfig,
  FilterComponentProps,
  FilterState,
  NumberFilterOption,
  numberOptions,
  TextFilterOption,
  TextFilterOptionForCostAndSkill,
  textOptionForCostAndSkill,
  textOptions,
  TimeFilterOption,
  timeOptions,
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
  TimeFilterControl,
} from './helper';
import {
  applyFilterOnChanges,
  clearFilters,
  getStoredFilters,
  resetFilter,
  storeFilters,
  validateFilters,
} from './utils';
import { useLocation } from 'react-router-dom';
import { ArrowIcon, CheckedIcon, CloseIcon } from '../../../../../assets';
import { MENU_PROPS, SELECT_STYLES } from '../../../../../components';

const Filter: React.FC<FilterComponentProps> = ({
  value,
  isOpen,
  filterAnchorEl,
  filterId,
  filterMenu,
  setAppliedFilters,
  handleCloseFilter,
  setCurrentPage,
  setCurrentSkillType,
  setCurrentCountry,
  handleSorting,
  mode,
  onFilterChange,
  resetFilterTrigger,
}) => {
  const location = useLocation();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [filterStates, setFilterStates] = useState<Record<string, FilterState>>(
    {}
  );

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [selectedSystemFilters, setSelectedSystemFilters] = useState<string[]>(
    []
  );
  const [currentSort, setCurrentSort] = useState<string | null>(null);
  const [isApplyDisabled, setIsApplyDisabled] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const systemFilters = filterMenu.filter(
    (field) => field.type === 'system' || field.type === 'system-sort'
  );
  const regularFilters = filterMenu.filter(
    (field) =>
      field.type !== 'system' && field.type !== 'system-sort' && !field.hide
  );

  useEffect(() => {
    handleResetFilter();
  }, [value]);

  useEffect(() => {
    const saved = getStoredFilters(value || 'resource');
    if (isOpen && saved && onFilterChange) {
      const savedFilters = saved as Record<string, FilterState>;
      applyFilterOnChanges(savedFilters, filterMenu, onFilterChange);
    }
    if (regularFilters.length > 0 && !saved) {
      // Automatically select the first field if no saved filters exist
      const firstField = regularFilters[0];
      setSelectedFilters([firstField.value]);
      setFilterStates({
        [firstField.value]: getInitialStateForField(firstField),
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (setCurrentSkillType) {
      if (filterStates?.skill_type_rid?.enum?.value) {
        const skillTypeValue = Array.isArray(
          filterStates?.skill_type_rid?.enum?.value
        )
          ? filterStates?.skill_type_rid?.enum?.value
          : [filterStates?.skill_type_rid?.enum?.value];

        const skillSubTypeValue = Array.isArray(
          filterStates?.skill_sub_type?.enum?.value
        )
          ? filterStates?.skill_sub_type?.enum?.value
          : [filterStates?.skill_sub_type?.enum?.value];

        setCurrentSkillType({
          skill_type_rid: skillTypeValue,
          skill_subtype_rid: skillSubTypeValue,
        });
      }
    }

    if (setCurrentCountry) {
      const country = Array.isArray(filterStates?.country_rid?.enum?.value)
        ? filterStates?.country_rid?.enum?.value
        : [filterStates?.country_rid?.enum?.value];

      setCurrentCountry(country as string[]);
    }
  }, [
    filterStates?.skill_type_rid?.enum?.value,
    filterStates?.country_rid?.enum?.value,
    filterStates?.skill_sub_type?.enum?.value,
  ]);

  const handleModalClose = () => {
    const saved = getStoredFilters(value || 'resource');
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
    }
    handleCloseFilter();
  };

  useEffect(() => {
    const saved = getStoredFilters(value || 'resource');
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
    const currentPathname = location.pathname;

    const unListen = () => {
      if (window.location.pathname !== currentPathname) {
        localStorage.removeItem(`allProjects`);
        clearFilters(value);
        setSelectedSystemFilters([]);
        setCurrentSort(null);
        handleSorting?.('', 'desc');
      }
    };

    return unListen;
  }, [location.pathname]);

  useEffect(() => {
    const hasInvalid = validateFilters(filterStates);
    setIsApplyDisabled(hasInvalid);
  }, [filterStates]);

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

  const handleApplyFilters = () => {
    const updatedStates = { ...filterStates };
    const hasInvalid = validateFilters(updatedStates);

    if (hasInvalid) {
      setFilterStates(updatedStates);
      setIsApplyDisabled(true);
      return;
    }
    const formattedFilters = formatFilterForApi(filterStates);
    setAppliedFilters(formattedFilters);
    if (setCurrentPage) {
      setCurrentPage(0);
    }
    storeFilters(filterStates, value || 'resource');
  };

  const handleResetFilter = (clearSort: boolean = false) => {
    if (!Object.keys(filterStates).length && !resetFilterTrigger) return null;
    clearFilters(value || 'resource');
    setSelectedSystemFilters([]);
    if (clearSort) {
      setCurrentSort(null);
      handleSorting?.('', 'desc');
    }
    resetFilter({
      setAppliedFilters,
      setFilterStates,
      setSelectedFilters,
    });
    handleCloseFilter();
  };

  // React to resetFilterTrigger changes from parent component
  useEffect(() => {
    if (resetFilterTrigger !== undefined && resetFilterTrigger > 0) {
      handleResetFilter(true);
    }
  }, [resetFilterTrigger]);

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
        case 'time':
          return {
            ...prev,
            [fieldName]: {
              ...currentState,
              time: {
                ...currentState.time!,
                option: event.target.value as TimeFilterOption,
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
    const newValue = event.target.value;
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
    // Call onChange if configured
    if (fieldConfig?.onChange && !fieldConfig.hide) {
      onFilterChange?.(fieldName, newValue);
    }
  };

  const handleEnumSelectChange = (
    fieldName: string,
    // isMultiple: boolean,
    value: string[] | string
  ) => {
    const fieldConfig = filterMenu.find((f) => f.value === fieldName);
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
    // Call onChange if configured
    if (fieldConfig?.onChange && !fieldConfig.hide) {
      onFilterChange?.(fieldName, value);
    }
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
      storeFilters(updatedFilterStates, value || 'resource');

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

  const handleDateChange = (type: string, fieldName: string, value: string) => {
    const fieldConfig = filterMenu.find((f) => f.value === fieldName);
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
    // Call onChange if configured
    if (fieldConfig?.onChange && !fieldConfig.hide) {
      onFilterChange?.(fieldName, value);
    }
  };

  const handleTimeChange = (type: string, fieldName: string, value: string) => {
    const fieldConfig = filterMenu.find((f) => f.value === fieldName);
    setFilterStates((prev: any) => {
      return {
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          time: {
            ...prev[fieldName].time,
            value: {
              ...prev[fieldName].time.value,
              [type]: value,
            },
          },
        },
      };
    });
    // Call onChange if configured
    if (fieldConfig?.onChange && !fieldConfig.hide) {
      onFilterChange?.(fieldName, value);
    }
  };

  const disableDependantFilterFields = (
    filterFieldName: string,
    field: FieldConfig,
    fieldState: FilterState
  ) => {
    const fieldValue = filterStates[filterFieldName]?.enum?.value;
    const enabled = !!fieldValue && !!fieldValue[0];
    return (
      <EnumFilterControl
        filterStates={filterStates}
        menuOption={
          field?.required
            ? (field?.filterOptions ?? enumOptions)
            : (field.operatorOption ?? enumOptions)
        }
        valueOptions={field.options as { option: string; value: string }[]}
        fieldName={field.value}
        state={fieldState}
        onOptionChange={handleFilterOptionChange}
        onChange={handleEnumSelectChange}
        disabled={!enabled}
      />
    );
  };

  const renderFilterControls = (fieldName: string) => {
    if (!selectedFilters.includes(fieldName)) return null;

    const field = filterMenu.find((f) => f.value === fieldName);
    if (!field) return null;

    const fieldState = filterStates[field.value] || {};
    // let enabled = false;
    if (field.value === 'skill_subtype_rid') {
      return disableDependantFilterFields('skill_type_rid', field, fieldState);
    }

    if (field.value === 'region_rid') {
      return disableDependantFilterFields('country_rid', field, fieldState);
    }
    if (field.dependsOn) {
      return disableDependantFilterFields(field.dependsOn, field, fieldState);
    }

    switch (field.type) {
      case 'text':
        return (
          <TextFilterControl
            filterStates={filterStates}
            menuOption={
              field?.required
                ? (field?.filterOptions ?? textOptions)
                : (field.operatorOption ?? textOptions)
            }
            // menuOption={field.operatorOption || textOptions}
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
            menuOption={
              field?.required
                ? (field?.filterOptions ?? textOptionForCostAndSkill)
                : textOptionForCostAndSkill
            }
            // menuOption={textOptionForCostAndSkill}
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
            menuOption={field.operatorOption || numberOptions}
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
            menuOption={
              field?.required
                ? (field?.filterOptions ?? enumOptions)
                : (field.operatorOption ?? enumOptions)
            }
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
            menuOption={field.operatorOption || dateOptions}
            fieldName={field.value}
            state={fieldState}
            minDate={field.minDate}
            maxDate={field.maxDate}
            onOptionChange={handleFilterOptionChange}
            onValueChange={handleDateChange}
            mode={mode as 'date' | 'year'}
            isFutureDateEnabled={field.isFutureDateEnabled}
            // onChange={handleBooleanChange}
          />
        );
      case 'time':
        return (
          <TimeFilterControl
            filterStates={filterStates}
            menuOption={field.operatorOption || timeOptions}
            fieldName={field.value}
            state={fieldState}
            onOptionChange={handleFilterOptionChange}
            onValueChange={handleTimeChange}
            timeFormat={field.timeFormat}
            minutesStep={field.minutesStep}
            minTime={field.minTime}
            maxTime={field.maxTime}
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
              onClick={() => handleResetFilter(true)}
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
            <div className='flex justify-between gap-2 flex-wrap'>
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
                        {field.option}
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
                        {field.option}
                      </button>
                    ))
                  )}
              </div>
            </div>
          </div>
        )}

        {selectedFilters.length > 0 && (
          <div className='flex-1'>
            <h3 className='text-[13px] font-bold text-[#425A76] mb-2'>
              All filters
            </h3>
            <div className='flex flex-col gap-3 mb-1 pt-1 -mr-6 min-h-[40px] overflow-y-auto max-h-[150px]'>
              {selectedFilters.map((fieldValue) => {
                const fieldConfig = regularFilters.find(
                  (f) => f.value === fieldValue
                );
                return fieldConfig ? (
                  <div key={fieldValue}>
                    <div className='flex items-center gap-2'>
                      <div className='flex-1 flex items-center gap-2 w-[480px] max-w-[480px]'>
                        <div className='flex items-center gap-1'>
                          <Select
                            size='small'
                            value={fieldValue}
                            className='min-w-[173px] max-w-[173px] h-[28px]'
                            IconComponent={(props) => (
                              <ArrowIcon alt='arrowIcon' {...props} />
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
                              const selectedField = filterMenu.find(
                                (f) => f.value === selected
                              );
                              return (
                                <div className='flex items-center gap-1'>
                                  <CheckedIcon
                                    alt='checked'
                                    className='w-3 mt-[1px] shrink-0'
                                  />
                                  <span className='max-w-[173px] text-ellipsis overflow-hidden'>
                                    {selectedField?.name || selected}
                                  </span>
                                </div>
                              );
                            }}
                          >
                            {regularFilters.map((field) => (
                              <MenuItem
                                title={field.name}
                                key={field.value}
                                value={field.value}
                                disabled={
                                  selectedFilters.includes(field.value) &&
                                  field.value !== fieldValue
                                }
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '13px',
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
                          if (
                            fieldValue === 'skill_type_rid' &&
                            selectedFilters.includes('skill_subtype_rid')
                          ) {
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
                              fieldToRemove.forEach(
                                (field) => delete newState[field]
                              );
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
        {regularFilters.filter(
          (field) => !selectedFilters.includes(field.value)
        ).length === 0 ? (
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
            .filter((field) => !selectedFilters.includes(field.value))
            .map((field) => (
              <MenuItem
                title={field.name}
                key={field.name}
                onClick={() => handleFilterSelect(field.value)}
                sx={{
                  fontWeight: 600,
                  fontSize: '13px',
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
                {field.name}
              </MenuItem>
            ))
        )}
      </Menu>
    </Popover>
  );
};

export default Filter;
