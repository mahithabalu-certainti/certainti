/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  Checkbox,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { arrowIcon, calendarIcon } from '../../../../../assets';
import { FilterState } from './filterType';
import {
  MENU_PROPS,
  SELECT_STYLES,
} from '../../../../../components/filter-component/helpers';

function formatString(str: string | undefined): string {
  if (!str) return '';
  return str
    .split('_') // split on underscores
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // capitalize each word
    .join(' ');
}

export const TextFilterControl: React.FC<{
  filterStates: Record<string, FilterState>;
  menuOption: { option: string; value: string }[];
  fieldName: string;
  state: FilterState;
  onOptionChange: (fieldName: string, event: SelectChangeEvent<any>) => void;
  onValueChange: (
    fieldName: string,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}> = ({
  filterStates,
  menuOption,
  fieldName,
  state,
  onOptionChange,
  onValueChange,
}) => {
    const option = formatString(filterStates?.[fieldName]?.text?.option);
    const hideInput = option === 'Is Empty' || option === 'Is Not Empty';
    return (
      <div className='flex gap-2 items-center'>
        <Select
          value={state.text?.option || 'equals'}
          onChange={(e) => onOptionChange(fieldName, e)}
          className='min-w-[110px] max-w-[10px] h-[28px]'
          IconComponent={(props) => (
            <img src={arrowIcon} alt='arrowIcon' {...props} />
          )}
          sx={SELECT_STYLES}
          MenuProps={MENU_PROPS}
        >
          {menuOption &&
            menuOption.map((menu) => (
              <MenuItem
                key={menu.option}
                value={menu.value}
                sx={{
                  fontSize: '12px',
                  color: '#425A76',
                  fontWeight: 600,
                  py: '1px',
                }}
              >
                {menu.option}
              </MenuItem>
            ))}
          {/* <MenuItem value='equals'>equals</MenuItem>
                    <MenuItem value='startsWith'>starts with</MenuItem> */}
        </Select>
        {!hideInput && (
          <TextField
            size='small'
            value={state.text?.value || ''}
            onChange={(e) => onValueChange(fieldName, e)}
            placeholder='Type here'
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '2px',
                '& fieldset': {
                  borderColor: '#CBD6E2',
                },
                '&:hover fieldset': {
                  borderColor: '#CBD6E2',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#CBD6E2',
                },
              },
              '& .MuiInputBase-input': {
                fontSize: '12px',
                color: '#425A76',
                height: '12px',
                width: '153px',
              },
            }}
          />
        )}
      </div>
    );
  };

export const TextFilterControlForCostAndSKill: React.FC<{
  filterStates: Record<string, FilterState>;
  menuOption: { option: string; value: string }[];
  fieldName: string;
  state: FilterState;
  onOptionChange: (fieldName: string, event: SelectChangeEvent<any>) => void;
  onValueChange: (
    fieldName: string,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}> = ({
  filterStates,
  menuOption,
  fieldName,
  state,
  onOptionChange,
  onValueChange,
}) => {
    const option = formatString(
      filterStates?.[fieldName]?.textCostAndSkill?.option
    );
    const hideInput = option === 'Is Empty';
    return (
      <div className='flex gap-2 items-center'>
        <Select
          value={state.textCostAndSkill?.option.toLowerCase() || 'equals'}
          onChange={(e) => onOptionChange(fieldName, e)}
          className='min-w-[110px] max-w-[110px] h-[28px]'
          IconComponent={(props) => (
            <img src={arrowIcon} alt='arrowIcon' {...props} />
          )}
          sx={SELECT_STYLES}
          MenuProps={MENU_PROPS}
        >
          {menuOption &&
            menuOption.map((menu) => (
              <MenuItem
                key={menu.option}
                value={menu.value}
                sx={{
                  fontSize: '12px',
                  color: '#425A76',
                  fontWeight: 600,
                  py: '1px',
                }}
              >
                {menu.option}
              </MenuItem>
            ))}
          {/* <MenuItem value='equals'>equals</MenuItem>
                    <MenuItem value='startsWith'>starts with</MenuItem> */}
        </Select>
        {!hideInput && (
          <TextField
            size='small'
            value={state.textCostAndSkill?.value || ''}
            onChange={(e) => onValueChange(fieldName, e)}
            placeholder='Type here'
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '2px',
                '& fieldset': {
                  borderColor: '#CBD6E2',
                },
                '&:hover fieldset': {
                  borderColor: '#CBD6E2',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#CBD6E2',
                },
              },
              '& .MuiInputBase-input': {
                fontSize: '12px',
                color: '#425A76',
                height: '12px',
                width: '153px',
              },
            }}
          />
        )}
      </div>
    );
  };

export const NumberFilterControl: React.FC<{
  filterStates: Record<string, FilterState>;
  menuOption: { option: string; value: string }[];
  fieldName: string;
  state: FilterState;
  onOptionChange: (fieldName: string, event: SelectChangeEvent<any>) => void;
  onValueChange: (
    fieldName: string,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}> = ({
  filterStates,
  menuOption,
  fieldName,
  state,
  onOptionChange,
  onValueChange,
}) => {
    const option = formatString(filterStates?.[fieldName]?.number?.option);
    const isBetween = option === 'Between';
    const hideInput = option === 'Is Empty';
    return (
      <div className='flex gap-2 items-center'>
        <Select
          value={state.number?.option.toLowerCase() || 'equals'}
          onChange={(e) => onOptionChange(fieldName, e)}
          className='min-w-[110px] max-w-[110px] h-[28px]'
          IconComponent={(props) => (
            <img src={arrowIcon} alt='arrowIcon' {...props} />
          )}
          sx={SELECT_STYLES}
          MenuProps={MENU_PROPS}
        >
          {menuOption &&
            menuOption.map((menu) => (
              <MenuItem
                key={menu.option}
                value={menu.value}
                sx={{
                  fontSize: '12px',
                  color: '#425A76',
                  fontWeight: 600,
                  py: '1px',
                }}
              >
                {menu.option}
              </MenuItem>
            ))}
        </Select>
        <div className='flex gap-2 flex-1'>
          {!hideInput && (
            <TextField
              size='small'
              placeholder={isBetween ? 'Min' : 'Enter number'}
              type='number'
              name='from'
              value={state.number?.value?.from || ''}
              onChange={(e) => onValueChange(fieldName, e)}
              inputProps={{ min: 0 }}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e') e.preventDefault();
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '2px',
                  '& fieldset': {
                    borderColor: '#CBD6E2',
                  },
                  '&:hover fieldset': {
                    borderColor: '#CBD6E2',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#CBD6E2',
                  },
                },
                '& .MuiInputBase-input': {
                  fontSize: '12px',
                  color: '#425A76',
                  height: '12px',
                  width: isBetween ? '50%' : '153px',
                },
                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                {
                  '-webkit-appearance': 'none',
                  margin: 0,
                },
                '& input[type=number]': {
                  '-moz-appearance': 'textfield',
                },
              }}
            />
          )}
          {isBetween && (
            <TextField
              size='small'
              placeholder='Max'
              type='number'
              name='to'
              value={state.number?.value?.to || ''}
              onChange={(e) => onValueChange(fieldName, e)}
              inputProps={{ min: 0 }}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e') e.preventDefault();
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '2px',
                  '& fieldset': {
                    borderColor: '#CBD6E2',
                  },
                  '&:hover fieldset': {
                    borderColor: '#CBD6E2',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#CBD6E2',
                  },
                },
                '& .MuiInputBase-input': {
                  fontSize: '12px',
                  color: '#425A76',
                  height: '12px',
                },
                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                {
                  '-webkit-appearance': 'none',
                  margin: 0,
                },
                '& input[type=number]': {
                  '-moz-appearance': 'textfield',
                },
              }}
            />
          )}
        </div>
      </div>
    );
  };

export const DateFilterControl: React.FC<{
  filterStates: Record<string, FilterState>;
  menuOption: { option: string; value: string }[];
  fieldName: string;
  state: FilterState;
  mode?: 'year' | 'date';
  minDate?: Date;
  maxDate?: Date;
  onOptionChange: (fieldName: string, event: SelectChangeEvent<any>) => void;
  onValueChange: (
    type: 'from' | 'to',
    fieldName: string,
    dateValue: string,
    mode?: 'year' | 'date'
  ) => void;
}> = ({
  filterStates,
  menuOption,
  fieldName,
  state,
  onOptionChange,
  onValueChange,
  mode = 'date',
  minDate,
  maxDate
}) => {
    const option = formatString(filterStates?.[fieldName]?.date?.option);
    const isBetween = option === 'Between';
    const today = new Date();
    const sixYearsAgo = new Date();
    sixYearsAgo.setFullYear(today.getFullYear() - 6);
    const disableInput = option === 'Is Empty';
    // option === 'Is Not Empty' ||
    // option === 'This Month' ||
    // option === 'This Week' ||
    // option === 'This Quarter' ||
    // option === 'Last 7 Days' ||
    // option === 'Last 30 Days';
    return (
      <div className='flex gap-2 items-center'>
        <Select
          value={state.date?.option || 'equals'}
          onChange={(e) => onOptionChange(fieldName, e)}
          className='min-w-[110px] max-w-[110px] h-[28px]'
          IconComponent={(props) => (
            <img src={arrowIcon} alt='arrowIcon' {...props} />
          )}
          sx={SELECT_STYLES}
          MenuProps={MENU_PROPS}
        >
          {menuOption &&
            menuOption.map((menu) => (
              <MenuItem
                key={menu.option}
                value={menu.value}
                sx={{
                  fontSize: '12px',
                  color: '#425A76',
                  fontWeight: 600,
                  py: '1px',
                }}
              >
                {menu.option}
              </MenuItem>
            ))}
        </Select>
        <div className='flex gap-2'>
          {!disableInput &&
            (mode === 'year' ? (
              <FormControl fullWidth>
                <Select
                  value={state.date?.value.from || ''}
                  onChange={(e) =>
                    onValueChange('from', fieldName, e.target.value)
                  }
                  displayEmpty
                  inputProps={{ 'aria-label': 'Select Year' }}
                  IconComponent={(props) => (
                    <img src={arrowIcon} alt='arrowIcon' {...props} />
                  )}
                  sx={SELECT_STYLES}
                  MenuProps={MENU_PROPS}
                  className='h-[28px]'
                >
                  <MenuItem value='' disabled>
                    Select Year
                  </MenuItem>
                  {Array.from({ length: 6 }).map((_, index) => {
                    const year = new Date().getFullYear() - index;
                    return (
                      <MenuItem
                        key={year}
                        value={year.toString()}
                        sx={{
                          fontSize: '12px',
                          color: '#425A76',
                          fontWeight: 600,
                          py: '1px',
                        }}
                      >
                        {year}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            ) : (
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  name='from'
                  maxDate={maxDate ? dayjs(maxDate) : dayjs(today)}
                  minDate={minDate ? dayjs(minDate) : dayjs(sixYearsAgo)}
                  value={dayjs(state.date?.value.from, 'YYYY/MM/DD')}
                  disabled={disableInput}
                  format='YYYY/MM/DD'
                  onChange={(newValue) => {
                    onValueChange(
                      'from',
                      fieldName,
                      dayjs(newValue).format('YYYY/MM/DD')
                    );
                  }}
                  shouldDisableDate={(date) =>
                    dayjs(date).isAfter(dayjs(), 'day')
                  }
                  slots={{
                    openPickerIcon: () => (
                      <img
                        src={calendarIcon}
                        alt='calendar'
                        className='w-4 h-4'
                      />
                    ),
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      InputProps: {
                        disabled: true,
                        onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
                          e.preventDefault();
                          return false;
                        },
                      },
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '2px',
                          '&.Mui-disabled': {
                            '& input': {
                              color: '#425A76',
                              WebkitTextFillColor: '#425A76',
                            },
                          },
                          '& fieldset': {
                            borderColor: '#CBD6E2 !important',
                          },
                          height: '28px',
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '12px',
                          color: '#425A76',
                          width: isBetween ? '50%' : '140px',
                        },
                      },
                      placeholder: 'YYYY/MM/DD',
                    },
                  }}
                />
              </LocalizationProvider>
            ))}
          {isBetween && (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                name='to'
                maxDate={dayjs(today)}
                minDate={dayjs(sixYearsAgo)}
                sx={{ mt: 1 }}
                value={dayjs(state.date?.value.to, 'YYYY/MM/DD')}
                disabled={disableInput}
                format='YYYY/MM/DD'
                onChange={(newValue) => {
                  onValueChange(
                    'to',
                    fieldName,
                    dayjs(newValue).format('YYYY/MM/DD')
                  );
                }}
                shouldDisableDate={(date) => dayjs(date).isAfter(dayjs(), 'day')}
                slots={{
                  openPickerIcon: () => (
                    <img src={calendarIcon} alt='calendar' className='w-4 h-4' />
                  ),
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    InputProps: {
                      disabled: true,
                      onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
                        e.preventDefault();
                        return false;
                      },
                    },
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '2px',
                        '&.Mui-disabled': {
                          '& input': {
                            color: '#425A76',
                            WebkitTextFillColor: '#425A76',
                          },
                        },
                        '& fieldset': {
                          borderColor: '#CBD6E2 !important',
                        },
                        height: '28px',
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '12px',
                        color: '#425A76',
                        width: isBetween ? '50%' : '140px',
                      },
                    },
                    placeholder: 'YYYY/MM/DD',
                  },
                }}
              />
            </LocalizationProvider>
          )}
        </div>
      </div>
    );
  };

export const CurrencySelectFilterControl: React.FC<{
  filterStates: Record<string, FilterState>;
  menuOption: { option: string; value: string }[];
  valueOptions: { option: string; value: string }[];
  fieldName: string;
  state: FilterState;
  onOptionChange: (fieldName: string, event: SelectChangeEvent<any>) => void;
  onChange: (fieldName: string, values: string[]) => void;
}> = ({
  filterStates,
  menuOption,
  valueOptions,
  fieldName,
  state,
  onOptionChange,
  onChange,
}) => {
    const option = formatString(
      filterStates?.[fieldName]?.currencySelect?.option
    );
    const isMultiple = option === 'In';
    const hideInput = option === 'Is Empty';
    const selectedValues: string[] = state?.currencySelect?.value || [];

    return (
      <div className='flex gap-2 items-center'>
        <Select
          value={state?.currencySelect?.option?.toLowerCase() ?? 'equals'}
          onChange={(e) => onOptionChange(fieldName, e)}
          className='min-w-[110px] max-w-[110px] h-[28px]'
          IconComponent={(props) => (
            <img src={arrowIcon} alt='arrowIcon' {...props} />
          )}
          sx={SELECT_STYLES}
          MenuProps={MENU_PROPS}
          name='option'
        >
          {menuOption.map((menu) => (
            <MenuItem
              key={menu.option}
              value={menu.value}
              sx={{
                fontSize: '12px',
                color: '#425A76',
                fontWeight: 600,
                py: '1px',
              }}
            >
              {menu.option}
            </MenuItem>
          ))}
        </Select>
        {!hideInput && (
          <FormControl fullWidth>
            <Select
              multiple={isMultiple}
              value={state.currencySelect?.value || []}
              name='value'
              onChange={(e) => onChange(fieldName, e.target.value as string[])}
              renderValue={(selected) => {
                if (isMultiple) {
                  if (!Array.isArray(selected)) return '';
                  return selected
                    .map(
                      (val) =>
                        valueOptions.find((opt) => opt.value === val)?.option ||
                        val
                    )
                    .join(', ');
                } else {
                  const selectedValue = selected as unknown as string;
                  const selectedOption = valueOptions.find(
                    (opt) => opt.value === selectedValue
                  );
                  return selectedOption ? selectedOption.option : '';
                }
              }}
              className='h-[28px] w-[181px] min-w-[181px] max-w-[181px]'
              IconComponent={(props) => (
                <img src={arrowIcon} alt='arrowIcon' {...props} />
              )}
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
            >
              {valueOptions.map((item) => (
                <MenuItem
                  key={item.option}
                  value={item.value}
                  dense
                  sx={{
                    fontSize: '12px',
                    color: '#425A76',
                    fontWeight: 600,
                    py: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isMultiple && (
                    <Checkbox
                      disableRipple
                      checked={selectedValues.includes(item.value)}
                      size='small'
                      sx={{
                        color: '#CBD6E2',
                        '&.Mui-checked': {
                          color: '#1755E7',
                        },
                        padding: '0px',
                        mr: 1,
                      }}
                    />
                  )}
                  {item.option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </div>
    );
  };

export const EnumFilterControl: React.FC<{
  filterStates: Record<string, FilterState>;
  menuOption: { option: string; value: string }[];
  valueOptions: { option: string; value: string }[];
  fieldName: string;
  state: FilterState;
  onOptionChange: (fieldName: string, event: SelectChangeEvent<any>) => void;
  onChange: (fieldName: string, svalues: string[]) => void;
  disabled?: boolean;
}> = ({
  filterStates,
  menuOption,
  valueOptions,
  fieldName,
  state,
  onOptionChange,
  onChange,
  disabled = false,
}) => {
    const option = formatString(filterStates?.[fieldName]?.enum?.option);
    const isMultiple = option === 'In';
    const hideInput = option === 'Is Empty';
    const selectedValues: string[] = state?.enum?.value || [];
    console.log("disabled", disabled);

    return (
      <div className='flex gap-2 items-center'>
        <Select
          value={state?.enum?.option ?? 'equals'}
          onChange={(e) => onOptionChange(fieldName, e)}
          className='min-w-[110px] max-w-[110px] h-[28px]'
          IconComponent={(props) => (
            <img src={arrowIcon} alt='arrowIcon' {...props} />
          )}
          sx={SELECT_STYLES}
          MenuProps={MENU_PROPS}
          disabled={disabled}
          name='option'
        >
          {menuOption.map((menu) => (
            <MenuItem
              key={menu.option}
              value={menu.value}
              sx={{
                fontSize: '12px',
                color: '#425A76',
                fontWeight: 600,
                py: '1px',
              }}
            >
              {menu.option}
            </MenuItem>
          ))}
        </Select>
        {!hideInput && (
          <Select
            multiple={isMultiple}
            disabled={disabled}
            value={state.enum?.value || []}
            name='value'
            className='h-[28px] w-[181px] min-w-[181px] max-w-[181px]'
            IconComponent={(props) => (
              <img src={arrowIcon} alt='arrowIcon' {...props} />
            )}
            onChange={(e) => onChange(fieldName, e.target.value as string[])}
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
              if (isMultiple) {
                if (!Array.isArray(selected)) return '';
                return selected
                  .map(
                    (val) =>
                      valueOptions.find((opt) => opt.value === val)?.option || val
                  )
                  .join(', ');
              } else {
                const selectedValue = selected as unknown as string;
                const selectedOption = valueOptions.find(
                  (opt) => opt.value === selectedValue
                );
                return selectedOption ? selectedOption.option : '';
              }
            }}
          >
            {valueOptions.map((item) => (
              <MenuItem
                key={item.option}
                value={item.value}
                dense
                sx={{
                  fontSize: '12px',
                  color: '#425A76',
                  fontWeight: 600,
                  py: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {isMultiple && (
                  <Checkbox
                    disableRipple
                    checked={selectedValues.includes(item.value)}
                    size='small'
                    sx={{
                      color: '#CBD6E2',
                      '&.Mui-checked': {
                        color: '#1755E7',
                      },
                      padding: '0px',
                      mr: 1,
                    }}
                  />
                )}
                {item.option}
              </MenuItem>
            ))}
          </Select>
        )}
      </div>
    );
  };

export const formatFilterForApi = (
  filterStates: Record<string, FilterState>
) => {
  const formattedFilters: Record<string, any> = {};

  Object.entries(filterStates).forEach(([fieldName, state]) => {
    const fieldKey = fieldName.toLowerCase().replace(/\s+/g, '_');

    if (state.text) {
      const choosenOption = state.text.option;
      const value =
        formatString(choosenOption) === 'Is Empty' ||
          formatString(choosenOption) === 'Is Not Empty'
          ? true
          : state.text.value?.toString().trim();
      if (value) {
        formattedFilters[fieldKey] = { [choosenOption]: value };
      }
    } else if (state.textCostAndSkill) {
      const choosenOption = state.textCostAndSkill.option;
      const value =
        formatString(choosenOption) === 'Is Empty'
          ? // ||
          //   formatString(choosenOption) === 'Is Not Empty'
          true
          : state.textCostAndSkill.value?.toString().trim();
      if (value) {
        formattedFilters[fieldKey] = { [choosenOption]: value };
      }
    } else if (state.number) {
      const choosenOption = state.number.option;
      const boolOptions = formatString(choosenOption) === 'Is Empty';
      // || formatString(choosenOption) === 'Is Empty';
      const value = state.number.value;
      if (!boolOptions || value?.from || value?.to) {
        formattedFilters[fieldKey] = {
          [choosenOption]:
            formatString(choosenOption) === 'Between'
              ? [Number(value?.from), Number(value?.to)]
              : boolOptions
                ? true
                : Number(value?.from),
        };
      }
    } else if (state.enum && state.enum.option) {
      const choosenOption = state.enum.option;
      const value =
        formatString(choosenOption) === 'Is Empty'
          ? // ||formatString(choosenOption) === 'Is Not Empty'
          true
          : state.enum.value;
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        formattedFilters[fieldKey] = {
          [choosenOption]: value,
        };
      }
    } else if (state.currencySelect && state.currencySelect.option) {
      const choosenOption = state.currencySelect.option;
      const value =
        formatString(choosenOption) === 'Is Empty'
          ? // ||formatString(choosenOption) === 'Is Not Empty'
          true
          : state.currencySelect.value;
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        formattedFilters[fieldKey] = {
          [choosenOption]: value,
        };
      }
    } else if (state.date) {
      const option = state.date.option;
      const value = state.date.value;
      const boolOptions = formatString(option) === 'Is Empty';
      // || formatString(option) === 'Is Not Empty' ||
      // formatString(option) === 'This Month' ||
      // formatString(option) === 'This Week' ||
      // formatString(option) === 'This Quarter' ||
      // formatString(option) === 'Last 7 Days' ||
      // formatString(option) === 'Last 30 Days';
      if (value?.from || value?.to || boolOptions) {
        formattedFilters[fieldKey] = {
          [option]:
            formatString(option) === 'Between'
              ? [value.from?.toString(), value.to?.toString()]
              : boolOptions
                ? true
                : value.from?.toString(),
        };
      }
    } else if (state.select) {
      console.log('formattedFilters[fieldKey]', formattedFilters[fieldKey]);
      if (fieldKey === 'is_rd_qualified') {
        const selectedValue = state.select.value;
        formattedFilters[fieldKey] = {
          [selectedValue]: true,
        };
      } else {
        formattedFilters[fieldKey] = state.select.value;
      }
    }
  });

  return formattedFilters;
};

export const StatusFilterControl: React.FC<{
  fieldName: string;
  state: FilterState;
  menuOption: { option: string; value: string }[];
  onOptionChange: (fieldName: string, event: SelectChangeEvent<any>) => void;
}> = ({ fieldName, state, menuOption, onOptionChange }) => (
  <FormControl fullWidth size='small'>
    <Select
      value={state.select?.value}
      displayEmpty
      onChange={(e) => onOptionChange(fieldName, e)}
      className='h-[28px] w-[196px] min-w-[196px] max-w-[196px]'
      IconComponent={(props) => (
        <img src={arrowIcon} alt='arrowIcon' {...props} />
      )}
      sx={SELECT_STYLES}
      MenuProps={MENU_PROPS}
    >
      {menuOption?.map((menu) => (
        <MenuItem
          key={menu.option}
          value={menu.value}
          sx={{
            fontSize: '12px',
            color: '#425A76',
            fontWeight: 600,
            py: '1px',
          }}
        >
          {menu.option}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

// Import the FilterState type from your main file
// Since we don't have access to the full filterType.ts file, we'll recreate the necessary types based on usage

interface FilterSelectState {
  value: string;
  option: string;
}

// This should match the FilterState type from your filterType.ts
interface FilterStateSkill {
  text?: { option: string; value: string };
  textCostAndSkill?: { option: string; value: string };
  number?: { option: string; value: { min?: string; max?: string } };
  enum?: { option: string; value: string[] | string };
  currencySelect?: { option: string; value: string[] };
  date?: { option: string; value: { from?: string; to?: string } };
  select?: FilterSelectState;
  // Add other possible filter state types as needed
}

interface SkillTypeFilterControlProps {
  fieldName: string;
  state: FilterStateSkill;
  menuOption: { option: string; value: string }[];
  onOptionChange: (fieldName: string, event: SelectChangeEvent<any>) => void;
  setFilterStates: React.Dispatch<
    React.SetStateAction<Record<string, FilterStateSkill>>
  >;
}

// Modify your existing SkillTypeFilterControl:
export const SkillTypeFilterControl: React.FC<SkillTypeFilterControlProps> = ({
  fieldName,
  state,
  menuOption,
  onOptionChange,
  setFilterStates,
}) => {
  const handleChange = (e: SelectChangeEvent<string>) => {
    onOptionChange(fieldName, e);
    // Reset the subtype when type changes
    setFilterStates((prev) => ({
      ...prev,
      skill_subtype_rid: {
        select: {
          value: '',
          option: '',
        },
      },
    }));
  };
  return (
    <Box sx={{ p: 1, mt: 1, borderBottom: '1px solid #CBD6E2' }}>
      <FormControl fullWidth size='small'>
        <Select
          value={state.select?.value || ''}
          displayEmpty
          renderValue={(selected) => {
            if (!selected) {
              return <span style={{ color: '#aaa' }}>Select skill type</span>;
            }
            const selectedOption = menuOption.find(
              (opt) => opt.value === selected
            )?.option;
            return selectedOption || selected;
          }}
          onChange={handleChange}
          sx={{ height: '30px', minHeight: 20 }}
          MenuProps={{
            PaperProps: {
              sx: {
                '& .MuiMenuItem-root': {
                  fontSize: '12px',
                  fontWeight: 300,
                },
              },
            },
          }}
        >
          <MenuItem value='' disabled>
            Select
          </MenuItem>
          {menuOption.map((menu) => (
            <MenuItem key={menu.value} value={menu.value}>
              {menu.option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};
