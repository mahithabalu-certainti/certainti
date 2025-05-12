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
import { Fragment } from 'react';
import { calendarIcon } from '../../../../../assets';
import { FilterState } from './filterType';

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
      <Box sx={{ p: 1, mt: 1, borderBottom: '1px solid #CBD6E2' }}>
        <FormControl
          fullWidth
          size='small'
          sx={{
            '.MuiInputBase-root': {
              fontSize: '12px',
              fontWeight: 300,
            },
          }}
        >
          <Select
            value={state.text?.option || 'equals'}
            onChange={(e) => onOptionChange(fieldName, e)}
            sx={{ height: '30px', minHeight: 20 }}
            MenuProps={{
              sx: {
                '& .MuiMenuItem-root': {
                  fontSize: '12px',
                  fontWeight: 300,
                },
              },
            }}
          >
            {menuOption &&
              menuOption.map((menu) => (
                <MenuItem key={menu.option} value={menu.value}>
                  {menu.option}
                </MenuItem>
              ))}
            {/* <MenuItem value='equals'>equals</MenuItem>
                    <MenuItem value='startsWith'>starts with</MenuItem> */}
          </Select>
        </FormControl>
        {!hideInput && (
          <TextField
            size='small'
            fullWidth
            placeholder='Type here'
            value={state.text?.value || ''}
            onChange={(e) => onValueChange(fieldName, e)}
            sx={{ mt: 1 }}
            slotProps={{
              input: {
                sx: { height: '30px', paddingY: 0, fontSize: '0.75rem' },
              },
            }}
          />
        )}
      </Box>
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
      <Box sx={{ p: 1, mt: 1, borderBottom: '1px solid #CBD6E2' }}>
        <FormControl
          fullWidth
          size='small'
          sx={{
            '.MuiInputBase-root': {
              fontSize: '12px',
              fontWeight: 300,
            },
          }}
        >
          <Select
            value={state.textCostAndSkill?.option.toLowerCase() || 'equals'}
            onChange={(e) => onOptionChange(fieldName, e)}
            sx={{ height: '30px', minHeight: 20 }}
            MenuProps={{
              sx: {
                '& .MuiMenuItem-root': {
                  fontSize: '12px',
                  fontWeight: 300,
                },
              },
            }}
          >
            {menuOption &&
              menuOption.map((menu) => (
                <MenuItem key={menu.option} value={menu.value}>
                  {menu.option}
                </MenuItem>
              ))}
            {/* <MenuItem value='equals'>equals</MenuItem>
                    <MenuItem value='startsWith'>starts with</MenuItem> */}
          </Select>
        </FormControl>
        {!hideInput && (
          <TextField
            size='small'
            fullWidth
            placeholder='Type here'
            value={state.textCostAndSkill?.value || ''}
            onChange={(e) => onValueChange(fieldName, e)}
            sx={{ mt: 1 }}
            slotProps={{
              input: {
                sx: { height: '30px', paddingY: 0, fontSize: '0.75rem' },
              },
            }}
          />
        )}
      </Box>
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
      <Box sx={{ p: 1, mt: 1, borderBottom: '1px solid #CBD6E2' }}>
        <FormControl
          fullWidth
          size='small'
          sx={{
            '.MuiInputBase-root': {
              fontSize: '12px',
              fontWeight: 300,
            },
          }}
        >
          <Select
            value={state.number?.option.toLowerCase() || 'equals'}
            onChange={(e) => onOptionChange(fieldName, e)}
            sx={{
              height: '30px',
              minHeight: 20,
            }}
            MenuProps={{
              sx: {
                '& .MuiMenuItem-root': {
                  fontSize: '12px',
                  fontWeight: 300,
                },
              },
            }}
          >
            {menuOption &&
              menuOption.map((menu) => (
                <MenuItem key={menu.option} value={menu.value}>
                  {menu.option}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        {
          <Box>
            {!hideInput && (
              <TextField
                size='small'
                fullWidth
                placeholder='Enter number'
                type='number'
                name='from'
                value={state.number?.value?.from || ''}
                onChange={(e) => onValueChange(fieldName, e)}
                inputProps={{ min: 0 }}
                sx={{
                  mt: 1,
                  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                  {
                    '-webkit-appearance': 'none',
                    margin: 0,
                  },
                  '& input[type=number]': {
                    '-moz-appearance': 'textfield',
                  },
                }}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') e.preventDefault();
                }}
                slotProps={{
                  input: {
                    sx: { height: '30px', paddingY: 0, fontSize: '0.75rem' },
                  },
                }}
              />
            )}
            {isBetween && (
              <TextField
                size='small'
                fullWidth
                placeholder='Enter number'
                type='number'
                name='to'
                value={state.number?.value?.to || ''}
                onChange={(e) => onValueChange(fieldName, e)}
                inputProps={{ min: 0 }}
                sx={{
                  mt: 1,
                  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                  {
                    '-webkit-appearance': 'none',
                    margin: 0,
                  },
                  '& input[type=number]': {
                    '-moz-appearance': 'textfield',
                  },
                }}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') e.preventDefault();
                }}
                slotProps={{
                  input: {
                    sx: { height: '30px', paddingY: 0, fontSize: '0.75rem' },
                  },
                }}
              />
            )}
          </Box>
        }
      </Box>
    );
  };

export const DateFilterControl: React.FC<{
  filterStates: Record<string, FilterState>;
  menuOption: { option: string; value: string }[];
  fieldName: string;
  state: FilterState;
  onOptionChange: (fieldName: string, event: SelectChangeEvent<any>) => void;
  onValueChange: (
    type: 'from' | 'to',
    fieldName: string,
    dateValue: string
  ) => void;
}> = ({
  filterStates,
  menuOption,
  fieldName,
  state,
  onOptionChange,
  onValueChange,
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
      <Box sx={{ p: 1, mt: 1, borderBottom: '1px solid #CBD6E2' }}>
        <FormControl
          fullWidth
          size='small'
          sx={{
            '.MuiInputBase-root': {
              fontSize: '12px',
              fontWeight: 300,
            },
          }}
        >
          <Select
            value={state.date?.option || 'equals'}
            onChange={(e) => onOptionChange(fieldName, e)}
            sx={{
              height: '30px',
              minHeight: 20,
            }}
            MenuProps={{
              sx: {
                '& .MuiMenuItem-root': {
                  fontSize: '12px',
                  fontWeight: 300,
                },
              },
            }}
          >
            {menuOption &&
              menuOption.map((menu) => (
                <MenuItem key={menu.option} value={menu.value}>
                  {menu.option}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <Box
          sx={{
            borderBottom: '1px solid #CBD6E2',
            '.MuiFormControl-root': {
              marginTop: '8px',
            },
          }}
        >
          {!disableInput && (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                name='from'
                maxDate={dayjs(today)}
                minDate={dayjs(sixYearsAgo)}
                value={dayjs(state.date?.value.from, 'MM/DD/YYYY')}
                disabled={disableInput}
                format='MM/DD/YYYY'
                onChange={(newValue) => {
                  onValueChange(
                    'from',
                    fieldName,
                    dayjs(newValue).format('MM/DD/YYYY')
                  );
                }}
                shouldDisableDate={(date) => dayjs(date).isAfter(dayjs(), 'day')}
                slots={{
                  openPickerIcon: () => (
                    <img src={calendarIcon} alt='calendar' className='w-6 h-5' />
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
                        borderRadius: 0,
                        fontSize: '12px',
                        fontWeight: 300,
                        '&.Mui-disabled': {
                          '& input': {
                            color: 'black',
                            WebkitTextFillColor: 'black',
                          },
                        },
                      },
                    },
                    placeholder: 'MM/DD/YYYY',
                  },
                }}
              />
            </LocalizationProvider>
          )}
          {isBetween && (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                name='to'
                maxDate={dayjs(today)}
                minDate={dayjs(sixYearsAgo)}
                sx={{ mt: 1 }}
                value={dayjs(state.date?.value.to, 'MM/DD/YYYY')}
                disabled={disableInput}
                format='MM/DD/YYYY'
                onChange={(newValue) => {
                  onValueChange(
                    'to',
                    fieldName,
                    dayjs(newValue).format('MM/DD/YYYY')
                  );
                }}
                shouldDisableDate={(date) => dayjs(date).isAfter(dayjs(), 'day')}
                slots={{
                  openPickerIcon: () => (
                    <img src={calendarIcon} alt='calendar' className='w-6 h-5' />
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
                        borderRadius: 0,
                        fontSize: '12px',
                        fontWeight: 300,

                        '&.Mui-disabled': {
                          '& input': {
                            color: 'black',
                            WebkitTextFillColor: 'black',
                          },
                        },
                      },
                    },
                    placeholder: 'MM/DD/YYYY',
                  },
                }}
              />
            </LocalizationProvider>
          )}
        </Box>
      </Box>
    );
  };

// export const EnumFilterControl: React.FC<{
//   filterStates: Record<string, FilterState>;
//   menuOption: { option: string; value: string }[];
//   valueOptions: { option: string; value: string }[];
//   fieldName: string;
//   state: FilterState;
//   onOptionChange: (fieldName: string, event: SelectChangeEvent<any>) => void;
//   onChange: (fieldName: string, isMultiple: boolean, svalues: string | string[]) => void;
// }> = ({
//   filterStates,
//   menuOption,
//   valueOptions,
//   fieldName,
//   state,
//   onOptionChange,
//   onChange,
// }) => {
//     const option = formatString(filterStates?.[fieldName]?.enum?.option);
//     const isMultiple = option === 'In';
//     const hideInput = option === 'Is Empty';

//     const handleOptionChange = (e: SelectChangeEvent<any>) => {
//       const newOption = e.target.value;
//       const newOptionFormatted = formatString(newOption);
//       const willBeMultiple = newOptionFormatted === 'In';
//       const willHideInput = newOptionFormatted === 'Is Empty';

//       // Reset values based on the new option type
//       if (willHideInput) {
//         onChange(fieldName, false, newOptionFormatted.toLowerCase());
//       } else if (willBeMultiple) {
//         onChange(fieldName, true, []);
//       } else {
//         onChange(fieldName, false, '');
//       }

//       // Then update the option
//       onOptionChange(fieldName, e);
//     };

//     // Handle value normalization based on selection mode
//     const currentValue = state.enum?.value as string | string[];
//     let normalizedValue: string | string[];

//     if (isMultiple) {
//       normalizedValue = Array.isArray(currentValue)
//         ? currentValue
//         : currentValue !== undefined && currentValue !== null
//           ? [currentValue]
//           : [];
//     } else {
//       normalizedValue = Array.isArray(currentValue)
//         ? currentValue[0] || ''
//         : currentValue || '';
//     }

//     const handleValueChange = (newValue: any) => {
//       if (isMultiple) {
//         const values = typeof newValue === 'string' ? newValue.split(',') : newValue;
//         onChange(fieldName, true, values);
//       } else if (hideInput) {
//         onChange(fieldName, false, option.toLowerCase());
//       } else {
//         onChange(fieldName, false, newValue);
//       }
//     };

//     return (
//       <Fragment>
//         <Box sx={{ p: 1, mt: 1, borderBottom: '1px solid #CBD6E2' }}>
//           <FormControl
//             fullWidth
//             size='small'
//             sx={{
//               '.MuiInputBase-root': {
//                 fontSize: '12px',
//                 fontWeight: 300,
//               },
//             }}
//           >
//             <Select
//               value={state?.enum?.option?.toLowerCase() ?? 'equals'}
//               onChange={handleOptionChange}  // Updated to use our custom handler
//               sx={{ height: '30px', minHeight: 20 }}
//               MenuProps={{
//                 sx: {
//                   '& .MuiMenuItem-root': {
//                     fontSize: '12px',
//                     fontWeight: 300,
//                   },
//                 },
//               }}
//               name='option'
//             >
//               {menuOption.map((menu) => (
//                 <MenuItem key={menu.option} value={menu.value}>
//                   {menu.option}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>
//         </Box>
//         {!hideInput && (
//           <Box sx={{ p: 1, mt: 1 }}>
//             <FormControl
//               fullWidth
//               size='small'
//               sx={{
//                 '.MuiInputBase-root': {
//                   fontSize: '12px',
//                   fontWeight: 300,
//                 },
//               }}
//             >
//               <Select
//                 multiple={isMultiple}
//                 value={normalizedValue}
//                 MenuProps={{
//                   sx: {
//                     '& .MuiMenuItem-root': {
//                       fontSize: '12px',
//                       fontWeight: 300,
//                     },
//                   },
//                 }}
//                 name='value'
//                 onChange={(e) => handleValueChange(e.target.value)}
//                 sx={{ height: '30px', minHeight: 20 }}
//                 renderValue={(selected) => {
//                   if (isMultiple) {
//                     const selectedArray = selected as string[];
//                     return selectedArray.length > 0
//                       ? selectedArray
//                         .map(val => valueOptions.find(m => m.value === val)?.option || val)
//                         .join(', ')
//                       : 'Select';
//                   } else {
//                     const selectedValue = selected as string;
//                     return valueOptions.find(m => m.value === selectedValue)?.option || 'Select';
//                   }
//                 }}
//                 displayEmpty
//               >
//                 {valueOptions.map((item) => (
//                   <MenuItem key={item.option} value={item.value}>
//                     {item.option}
//                   </MenuItem>
//                 ))}
//               </Select>
//             </FormControl>
//           </Box>
//         )}
//       </Fragment>
//     );
//   };

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
    const option = formatString(filterStates?.[fieldName]?.currencySelect?.option);
    const isMultiple = option === 'In';
    const hideInput = option === 'Is Empty';
    const selectedValues: string[] = state?.currencySelect?.value || [];

    return (
      <Fragment>
        <Box sx={{ p: 1, mt: 1, borderBottom: '1px solid #CBD6E2' }}>
          <FormControl
            fullWidth
            size='small'
            sx={{
              '.MuiInputBase-root': {
                fontSize: '12px',
                fontWeight: 300,
              },
            }}
          >
            <Select
              value={state?.currencySelect?.option?.toLowerCase() ?? 'equals'}
              onChange={(e) => onOptionChange(fieldName, e)}
              sx={{ height: '30px', minHeight: 20 }}
              MenuProps={{
                sx: {
                  '& .MuiMenuItem-root': {
                    fontSize: '12px',
                    fontWeight: 300,
                  },
                },
              }}
              name='option'
            >
              {menuOption.map((menu) => (
                <MenuItem key={menu.option} value={menu.value}>
                  {menu.option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {!hideInput && (
          <Box sx={{ p: 1, mt: 1 }}>
            <FormControl
              fullWidth
              size='small'
              sx={{
                '.MuiInputBase-root': {
                  fontSize: '12px',
                  fontWeight: 300,
                },
              }}
            >
              <Select
                multiple={isMultiple}
                value={state.currencySelect?.value || []}
                MenuProps={{
                  sx: {
                    '& .MuiMenuItem-root': {
                      fontSize: '12px',
                      fontWeight: 300,
                    },
                  },
                }}
                name='value'
                onChange={(e) =>
                  onChange(fieldName, e.target.value as string[])
                }
                sx={{ height: '30px', minHeight: 20 }}
                renderValue={(selected) => {
                  if (isMultiple) {
                    if (!Array.isArray(selected)) return '';
                    return selected
                      .map((val) => valueOptions.find((opt) => opt.value === val)?.option || val)
                      .join(', ');
                  } else {
                    const selectedValue = selected as unknown as string;
                    const selectedOption = valueOptions.find((opt) => opt.value === selectedValue);
                    return selectedOption ? selectedOption.option : '';
                  }
                }}
              >
                {valueOptions.map((item) => (
                  <MenuItem key={item.option} value={item.value}>
                    {isMultiple && <Checkbox
                      disableRipple
                      checked={selectedValues.includes(item.value)}
                      size="small"
                      sx={{
                        color: '#CBD6E2',
                        '&.Mui-checked': {
                          color: '#1755E7',
                        },
                      }}
                    />}
                    {item.option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Fragment>
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
    return (
      <Fragment>
        <Box sx={{ p: 1, mt: 1, borderBottom: '1px solid #CBD6E2' }}>
          <FormControl
            fullWidth
            size='small'
            sx={{
              '.MuiInputBase-root': {
                fontSize: '12px',
                fontWeight: 300,
              },
            }}
            disabled={disabled} 
          >
            <Select
              value={state?.enum?.option ?? 'equals'}
              onChange={(e) => onOptionChange(fieldName, e)}
              sx={{ height: '30px', minHeight: 20 }}
              MenuProps={{
                sx: {
                  '& .MuiMenuItem-root': {
                    fontSize: '12px',
                    fontWeight: 300,
                  },
                },
              }}
              name='option'
            >
              {menuOption.map((menu) => (
                <MenuItem key={menu.option} value={menu.value}>
                  {menu.option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {!hideInput && (
          <Box sx={{ p: 1, mt: 1 }}>
            <FormControl
              fullWidth
              size='small'
              sx={{
                '.MuiInputBase-root': {
                  fontSize: '12px',
                  fontWeight: 300,
                },
              }}
              disabled={disabled}
            >
              <Select
                multiple={isMultiple}
                value={state.enum?.value || []}
                MenuProps={{
                  sx: {
                    '& .MuiMenuItem-root': {
                      fontSize: '12px',
                      fontWeight: 300,
                    },
                  },
                }}
                name='value'
                onChange={(e) =>
                  onChange(fieldName, e.target.value as string[])
                }
                sx={{ height: '30px', minHeight: 20 }}
                renderValue={(selected) => {
                  if (isMultiple) {
                    if (!Array.isArray(selected)) return '';
                    return selected
                      .map((val) => valueOptions.find((opt) => opt.value === val)?.option || val)
                      .join(', ');
                  } else {
                    const selectedValue = selected as unknown as string;
                    const selectedOption = valueOptions.find((opt) => opt.value === selectedValue);
                    return selectedOption ? selectedOption.option : '';
                  }
                }}
              >
                {valueOptions.map((item) => (
                  <MenuItem key={item.option} value={item.value}>
                    {isMultiple && <Checkbox
                      disableRipple
                      checked={selectedValues.includes(item.value)}
                      size="small"
                      sx={{
                        color: '#CBD6E2',
                        '&.Mui-checked': {
                          color: '#1755E7',
                        },
                      }}
                    />}
                    {item.option}

                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Fragment>
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
      formattedFilters[fieldKey] = state.select.value;
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
  <Box sx={{ p: 1, mt: 1, borderBottom: '1px solid #CBD6E2' }}>
    <FormControl
      fullWidth
      size='small'
      sx={{
        '.MuiInputBase-root': {
          fontSize: '12px',
          fontWeight: 300,
        },
      }}
    >
      <Select
        value={state.select?.value}
        displayEmpty
        renderValue={(selected) => {
          if (!selected) {
            return <span style={{ color: '#aaa' }}>Select an option</span>;
          }
          return selected;
        }}
        onChange={(e) => onOptionChange(fieldName, e)}
        sx={{ height: '30px', minHeight: 20 }}
        MenuProps={{
          sx: {
            '& .MuiMenuItem-root': {
              fontSize: '12px',
              fontWeight: 300,
            },
          },
        }}
      >
        <MenuItem value='' disabled hidden>
          Select
        </MenuItem>
        {menuOption.map((menu) => (
          <MenuItem key={menu.option} value={menu.value}>
            {menu.option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Box>
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
  setFilterStates: React.Dispatch<React.SetStateAction<Record<string, FilterStateSkill>>>;
}

// Modify your existing SkillTypeFilterControl:
export const SkillTypeFilterControl: React.FC<SkillTypeFilterControlProps> = ({ 
  fieldName, 
  state, 
  menuOption, 
  onOptionChange,
  setFilterStates
}) => {
  const handleChange = (e: SelectChangeEvent<string>) => {
    onOptionChange(fieldName, e);
    // Reset the subtype when type changes
    setFilterStates(prev => ({
      ...prev,
      skill_subtype_rid: {
        select: {
          value: '',
          option: ''
        }
      }
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
            const selectedOption = menuOption.find(opt => opt.value === selected)?.option;
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
