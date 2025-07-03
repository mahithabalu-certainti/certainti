/* eslint-disable @typescript-eslint/no-explicit-any */
// FilterControls.tsx
import {
  Checkbox,
  FormControl,
  MenuItem,
  MenuProps,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import { FilterState } from '../../consultant/types/account-filter';
import { useMemo } from 'react';
import { ArrowIcon, CalendarIcon } from '../../assets';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

function formatString(str: string | undefined): string {
  if (!str) return '';
  return str
    .split('_') // split on underscores
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // capitalize each word
    .join(' ');
}

export const SELECT_STYLES = {
  fontWeight: 600,
  fontSize: '12px',
  lineHeight: '30px',
  borderRadius: '2px',
  '& .MuiSelect-select': {
    fontWeight: 600,
    fontSize: '12px',
    lineHeight: '30px',
    color: '#425A76',
    py: 0,
    maxWidth: '100%',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#CBD6E2',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#CBD6E2',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#CBD6E2',
  },
  '& .MuiSelect-icon': {
    top: '40%',
  },
};
export const OPERATOR_STYLE = {
  maxWidth: '112px',
  minWidth: '112px',
  '& .MuiSelect-select': {
    display: 'flex',
    fontWeight: 600,
    fontSize: '12px',
    lineHeight: '30px',
    color: '#425A76',
    py: 0,
  },
};
export const MENU_PROPS: Partial<MenuProps> = {
  anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
  transformOrigin: { vertical: 'top', horizontal: 'left' },
  PaperProps: {
    style: {
      borderRadius: '0px 0px 8px 8px',
      border: '1px solid #CBD6E2',
      borderTop: 'none',
      marginTop: '1px',
      boxShadow: 'none',
      maxHeight: '200px',
      cursor: 'pointer',
    },
  },
  MenuListProps: {
    sx: {
      paddingTop: 0,
      paddingBottom: 0,
    },
  },
};

export const NewDateFilterControl: React.FC<{
  filterStates: Record<string, FilterState>;
  menuOption: { label: string; value: string }[];
  fieldName: string;
  state: FilterState;
  mode?: 'year' | 'date';
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
}) => {
  const option = formatString(filterStates?.[fieldName]?.date?.option);
  const isBetween = option === 'Between';
  const today = new Date();
  const sixYearsAgo = new Date();
  sixYearsAgo.setFullYear(today.getFullYear() - 6);
  const disableInput = option === 'Is Empty';

  return (
    <div className='flex gap-2 items-center'>
      <Select
        value={state.date?.option || 'equals'}
        onChange={(e) => onOptionChange(fieldName, e)}
        className='min-w-[110px] max-w-[110px] h-[28px]'
        IconComponent={(props) => <ArrowIcon alt='arrowIcon' {...props} />}
        sx={{ ...SELECT_STYLES, ...OPERATOR_STYLE }}
        MenuProps={MENU_PROPS}
      >
        {menuOption &&
          menuOption.map((menu) => (
            <MenuItem
              key={menu.label}
              value={menu.value}
              sx={{
                fontSize: '12px',
                color: '#425A76',
                fontWeight: 600,
                py: '1px',
              }}
            >
              {menu.label}
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
                  <ArrowIcon alt='arrowIcon' {...props} />
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
                maxDate={dayjs(today)}
                minDate={dayjs(sixYearsAgo)}
                value={dayjs(state.date?.value.from, 'YYYY-MM-DD')}
                disabled={disableInput}
                format='YYYY-MM-DD'
                onChange={(newValue) => {
                  onValueChange(
                    'from',
                    fieldName,
                    dayjs(newValue).format('YYYY-MM-DD')
                  );
                }}
                shouldDisableDate={(date) =>
                  dayjs(date).isAfter(dayjs(), 'day')
                }
                slots={{
                  openPickerIcon: () => (
                    <CalendarIcon alt='calendar' className='w-4 h-4' />
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
                        width: isBetween ? '50%' : '125px',
                      },
                    },
                    placeholder: 'YYYY-MM-DD',
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
              value={dayjs(state.date?.value.to, 'YYYY-MM-DD')}
              disabled={disableInput}
              format='YYYY-MM-DD'
              onChange={(newValue) => {
                onValueChange(
                  'to',
                  fieldName,
                  dayjs(newValue).format('YYYY-MM-DD')
                );
              }}
              shouldDisableDate={(date) => dayjs(date).isAfter(dayjs(), 'day')}
              slots={{
                openPickerIcon: () => (
                  <CalendarIcon alt='calendar' className='w-4 h-4' />
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
                      width: isBetween ? '50%' : '125px',
                    },
                  },
                  placeholder: 'YYYY-MM-DD',
                },
              }}
            />
          </LocalizationProvider>
        )}
      </div>
    </div>
  );
};

export const NewTextFilterControl: React.FC<{
  fieldName: string;
  state: FilterState;
  menuOption: { label: string; value: string }[];
  onOptionChange: (fieldName: string, event: SelectChangeEvent<string>) => void;
  onValueChange: (
    fieldName: string,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}> = ({ fieldName, state, menuOption, onOptionChange, onValueChange }) => {
  const selectedOption = state.text?.option;
  const hideInput = selectedOption === 'is_empty';
  return (
    <div className='flex gap-2 items-center'>
      <Select
        size='small'
        value={state.text?.option || 'contains'}
        onChange={(e) => onOptionChange(fieldName, e)}
        className='min-w-[110px] max-w-[110px] h-[28px]'
        IconComponent={(props) => <ArrowIcon alt='arrowIcon' {...props} />}
        sx={{ ...SELECT_STYLES, ...OPERATOR_STYLE }}
        MenuProps={MENU_PROPS}
      >
        {menuOption?.map((option) => (
          <MenuItem
            key={option.label}
            value={option.value}
            sx={{
              fontSize: '12px',
              color: '#425A76',
              fontWeight: 600,
              py: '1px',
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {!hideInput && (
        <TextField
          size='small'
          autoComplete='off'
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
              height: '11px',
              width: '153px',
            },
          }}
        />
      )}
    </div>
  );
};

export const NewMultiSelectFilterControl: React.FC<{
  fieldName: string;
  state: FilterState;
  options: string[];
  onChange: (fieldName: string, values: string[]) => void;
}> = ({ fieldName, state, options, onChange }) => {
  const selectedValues = useMemo(
    () => state.multiSelect?.values || [],
    [state.multiSelect?.values]
  );

  const menuItems = useMemo(() => {
    return options.map((option) => (
      <MenuItem
        key={option}
        value={option}
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
        <Checkbox
          disableRipple
          checked={selectedValues.includes(option)}
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
        {option}
      </MenuItem>
    ));
  }, [options, selectedValues]);

  return (
    <FormControl fullWidth>
      <Select
        multiple
        size='small'
        value={state.multiSelect?.values || []}
        onChange={(e) => onChange(fieldName, e.target.value as string[])}
        className='h-[28px]'
        IconComponent={(props) => <ArrowIcon alt='arrowIcon' {...props} />}
        renderValue={(selected) => (selected as string[]).join(', ')}
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
        {menuItems}
      </Select>
    </FormControl>
  );
};

export const NewNumberFilterControl: React.FC<{
  fieldName: string;
  state: FilterState;
  menuOption: { label: string; value: string }[];
  onOptionChange: (fieldName: string, event: SelectChangeEvent<string>) => void;
  onValueChange: (
    fieldName: string,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index?: number
  ) => void;
}> = ({ fieldName, state, menuOption, onOptionChange, onValueChange }) => {
  const option = state.number?.option || 'greater_than';
  const value = state.number?.value;
  const hasError = state.number?.error ?? false;

  const selectedOption = state.number?.option;
  const hideInput = selectedOption === 'is_empty';

  return (
    <div className='flex gap-2 items-center w-full'>
      <Select
        size='small'
        value={option}
        onChange={(e) => onOptionChange(fieldName, e)}
        className='min-w-[110px] max-w-[110px] h-[28px]'
        IconComponent={(props) => <ArrowIcon alt='arrowIcon' {...props} />}
        sx={{ ...SELECT_STYLES, ...OPERATOR_STYLE }}
        MenuProps={MENU_PROPS}
      >
        {menuOption?.map((option) => (
          <MenuItem
            key={option.label}
            value={option.value}
            sx={{
              fontSize: '12px',
              color: '#425A76',
              fontWeight: 600,
              py: '1px',
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {!hideInput && (
        <>
          {option === 'between' ? (
            <div className='flex gap-2 flex-1'>
              {[0, 1].map((i) => (
                <TextField
                  key={i}
                  type='number'
                  size='small'
                  autoComplete='off'
                  placeholder={i === 0 ? 'Min' : 'Max'}
                  value={Array.isArray(value) ? value[i] : ''}
                  onChange={(e) => onValueChange(fieldName, e, i)}
                  error={
                    hasError &&
                    (!value ||
                      (Array.isArray(value) && value[i]?.trim() === ''))
                  }
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
                      height: '11px',
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
              ))}
            </div>
          ) : (
            <TextField
              type='number'
              size='small'
              autoComplete='off'
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => onValueChange(fieldName, e)}
              placeholder='Enter a number'
              error={hasError && !value}
              inputProps={{ min: 0 }}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e') e.preventDefault();
              }}
              className='flex-1'
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
                  height: '11px',
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
        </>
      )}
    </div>
  );
};

export const NewStatusFilterControl: React.FC<{
  fieldName: string;
  state: FilterState;
  options: { value: string; label: string }[];
  onOptionChange: (fieldName: string, event: SelectChangeEvent<string>) => void;
}> = ({ fieldName, state, options, onOptionChange }) => (
  <FormControl fullWidth>
    <Select
      size='small'
      value={state.status?.value || 'Active'}
      onChange={(e) => onOptionChange(fieldName, e)}
      className='h-[28px]'
      IconComponent={(props) => <ArrowIcon alt='arrowIcon' {...props} />}
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
      {options?.map((option) => (
        <MenuItem
          key={option.label}
          value={option.value}
          sx={{
            fontSize: '12px',
            color: '#425A76',
            fontWeight: 600,
            py: '1px',
          }}
        >
          {option.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

export const NewBooleanFilterControl: React.FC<{
  fieldName: string;
  state: FilterState;
  onChange: (fieldName: string, value: boolean) => void;
}> = ({ fieldName, state, onChange }) => (
  <FormControl fullWidth>
    <Select
      size='small'
      value={state.boolean?.value ? 'true' : 'false'}
      onChange={(e) => onChange(fieldName, e.target.value === 'true')}
      className='h-[28px]'
      IconComponent={(props) => <ArrowIcon alt='arrowIcon' {...props} />}
      sx={SELECT_STYLES}
      MenuProps={MENU_PROPS}
    >
      <MenuItem
        value='true'
        sx={{ fontSize: '12px', color: '#425A76', fontWeight: 600, py: '1px' }}
      >
        Yes
      </MenuItem>
      <MenuItem
        value='false'
        sx={{ fontSize: '12px', color: '#425A76', fontWeight: 600, py: '1px' }}
      >
        No
      </MenuItem>
    </Select>
  </FormControl>
);

export const KeyContactFilterControl: React.FC<{
  filterStates: Record<string, FilterState>;
  menuOption: { label: string; value: string }[];
  valueOptions: { label: string; value: string }[];
  fieldName: string;
  state: FilterState;
  onOptionChange: (fieldName: string, event: SelectChangeEvent<string>) => void;
  onChange: (fieldName: string, type: 'role' | 'name', value: string) => void;
  disabled?: boolean;
}> = ({
  menuOption,
  valueOptions,
  fieldName,
  state,
  onOptionChange,
  onChange,
  disabled = false,
}) => {
  const keyContactState = state.keyContact || {
    role: { option: 'contains', value: '' },
    name: { option: 'contains', value: '' },
  };

  const isRoleEmpty = keyContactState.role.option === 'is_empty';
  const isNameEmpty = keyContactState.name.option === 'is_empty';
  const showRoleValue = !isRoleEmpty;
  const showNameFields =
    showRoleValue && (isRoleEmpty || !!keyContactState.role.value);
  const showNameValue = showNameFields && !isNameEmpty;
  const roleError = keyContactState.role?.error || false;
  const nameError = keyContactState.name?.error || false;

  const handleRoleOptionChange = (e: SelectChangeEvent<string>) => {
    onOptionChange(fieldName, {
      ...e,
      target: {
        ...e.target,
        name: 'roleOption',
      },
    } as SelectChangeEvent<string>);
  };

  const handleRoleValueChange = (e: SelectChangeEvent<string>) => {
    onChange(fieldName, 'role', e.target.value);
  };

  const handleNameOptionChange = (e: SelectChangeEvent<string>) => {
    onOptionChange(fieldName, {
      target: {
        value: e.target.value,
        name: 'nameOption',
      },
    } as SelectChangeEvent<string>);
  };

  const handleNameValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(fieldName, 'name', e.target.value);
  };

  return (
    <div className='flex gap-2 items-center flex-wrap'>
      <Select
        value={keyContactState.role.option}
        onChange={handleRoleOptionChange}
        className='min-w-[110px] max-w-[110px] h-[28px]'
        IconComponent={(props) => <ArrowIcon alt='arrowIcon' {...props} />}
        sx={{
          ...SELECT_STYLES,
          '& .MuiSelect-select': {
            display: 'flex',
            fontWeight: 600,
            fontSize: '12px',
            lineHeight: '30px',
            color: '#425A76',
            cursor: 'pointer',
            py: 0,
          },
        }}
        MenuProps={MENU_PROPS}
        disabled={disabled}
      >
        {menuOption.map((menu) => (
          <MenuItem
            key={menu.value}
            value={menu.value}
            sx={{
              fontSize: '12px',
              color: '#425A76',
              fontWeight: 600,
              py: '1px',
            }}
          >
            {menu.label}
          </MenuItem>
        ))}
      </Select>

      {/* Role Value Select - only show if not is_empty */}
      {showRoleValue && (
        <Select
          disabled={disabled}
          value={keyContactState.role.value}
          className='h-[28px] w-[181px] min-w-[181px] max-w-[181px]'
          IconComponent={(props) => <ArrowIcon alt='arrowIcon' {...props} />}
          onChange={handleRoleValueChange}
          sx={{
            ...SELECT_STYLES,
            ...(roleError && {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#FF0000 !important',
              },
            }),
          }}
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
              key={item.value}
              value={item.value}
              dense
              sx={{
                fontSize: '12px',
                color: '#425A76',
                fontWeight: 600,
                py: '1px',
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </Select>
      )}

      {/* Name Fields - only show if role is not empty and has value */}
      {showNameFields && (
        <>
          {/* Name Operator Select */}
          <Select
            value={keyContactState.name.option}
            onChange={handleNameOptionChange}
            className='min-w-[110px] max-w-[110px] h-[28px]'
            IconComponent={(props) => <ArrowIcon alt='arrowIcon' {...props} />}
            sx={{
              ...SELECT_STYLES,
              '& .MuiSelect-select': {
                display: 'flex',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '30px',
                color: '#425A76',
                py: 0,
              },
            }}
            MenuProps={MENU_PROPS}
            disabled={disabled}
          >
            {menuOption.map((menu) => (
              <MenuItem
                key={menu.value}
                value={menu.value}
                sx={{
                  fontSize: '12px',
                  color: '#425A76',
                  fontWeight: 600,
                  py: '1px',
                }}
              >
                {menu.label}
              </MenuItem>
            ))}
          </Select>

          {/* Name Text Input - only show if name operator is not is_empty */}
          {showNameValue && (
            <TextField
              size='small'
              autoComplete='off'
              value={
                keyContactState.name.value === 'true'
                  ? ''
                  : keyContactState.name.value
              }
              error={nameError && !keyContactState.name.value}
              onChange={handleNameValueChange}
              disabled={disabled}
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
                  height: '11px',
                  width: '153px',
                },
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export const EnumSelectFilterControl: React.FC<{
  filterStates: Record<string, FilterState>;
  menuOption: { label: string; value: string }[];
  valueOptions: { label: string; value: string }[];
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
  const option = formatString(filterStates?.[fieldName]?.enumSelect?.option);
  const isMultiple = option === 'In';
  const hideInput = option === 'Is Empty';
  const selectedValues: string[] = state?.enumSelect?.value || [];

  return (
    <div className='flex gap-2 items-center'>
      <Select
        value={state?.enumSelect?.option?.toLowerCase() ?? 'equals'}
        onChange={(e) => onOptionChange(fieldName, e)}
        className='min-w-[110px] max-w-[110px] h-[28px]'
        IconComponent={(props) => <ArrowIcon alt='arrowIcon' {...props} />}
        sx={{ ...SELECT_STYLES, ...OPERATOR_STYLE }}
        MenuProps={MENU_PROPS}
        name='option'
      >
        {menuOption.map((menu) => (
          <MenuItem
            key={menu.label}
            value={menu.value}
            sx={{
              fontSize: '12px',
              color: '#425A76',
              fontWeight: 600,
              py: '1px',
            }}
          >
            {menu.label}
          </MenuItem>
        ))}
      </Select>
      {!hideInput && (
        <FormControl fullWidth>
          <Select
            multiple={isMultiple}
            value={state.enumSelect?.value || []}
            name='value'
            onChange={(e) => onChange(fieldName, e.target.value as string[])}
            renderValue={(selected) => {
              if (isMultiple) {
                if (!Array.isArray(selected)) return '';
                return selected
                  .map(
                    (val) =>
                      valueOptions.find((opt) => opt.value === val)?.label ||
                      val
                  )
                  .join(', ');
              } else {
                const selectedValue = selected as unknown as string;
                const selectedOption = valueOptions.find(
                  (opt) => opt.value === selectedValue
                );
                return selectedOption ? selectedOption.label : '';
              }
            }}
            className='h-[28px] w-[181px] min-w-[181px] max-w-[181px]'
            IconComponent={(props) => <ArrowIcon alt='arrowIcon' {...props} />}
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
                key={item.label}
                value={item.value}
                dense
                sx={{
                  fontSize: '12px',
                  color: '#425A76',
                  fontWeight: 600,
                  py: '1px',
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
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </div>
  );
};
