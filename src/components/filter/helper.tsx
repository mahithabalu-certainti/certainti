// FilterControls.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Box,
    FormControl,
    MenuItem,
    Select,
    SelectChangeEvent,
    TextField,
} from '@mui/material';
import { FilterState } from './filterType';
import { Fragment } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { calendarIcon } from '../../assets';

function formatString(str: string | undefined): string {
    if (!str) return '';
    return str
        .split('_')                        // split on underscores
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // capitalize each word
        .join(' ');
}

export const TextFilterControl: React.FC<{
    filterStates: Record<string, FilterState>,
    menuOption: { option: string, value: string }[],
    fieldName: string;
    state: FilterState;
    onOptionChange: (fieldName: string, event: SelectChangeEvent<any>) => void;
    onValueChange: (
        fieldName: string,
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => void;
}> = ({ filterStates, menuOption, fieldName, state, onOptionChange, onValueChange }) =>

    (

        <Box sx={{ pl: 2, mt: 1 }}>
            <FormControl fullWidth size='small' sx={{
                '.MuiInputBase-root': {
                    fontSize: '12px',
                    fontWeight: 300,
                }
            }}>
                <Select
                    value={state.text?.option || 'Contains'}
                    onChange={(e) => onOptionChange(fieldName, e)}
                    sx={{ height: '30px', minHeight: 20 }}
                    MenuProps={{
                        sx: {
                            '& .MuiMenuItem-root': {
                                fontSize: '12px',
                                fontWeight: 300,
                            }
                        }
                    }}
                >
                    {menuOption && menuOption.map((menu) => (
                        <MenuItem key={menu.option} value={menu.value}>{menu.option}</MenuItem>
                    ))}
                    {/* <MenuItem value='equals'>equals</MenuItem>
                    <MenuItem value='startsWith'>starts with</MenuItem> */}
                </Select>
            </FormControl>
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
        </Box>
    );

export const NumberFilterControl: React.FC<{
    filterStates: Record<string, FilterState>,
    menuOption: { option: string, value: string }[],
    fieldName: string;
    state: FilterState;
    onOptionChange: (fieldName: string, event: SelectChangeEvent<any>) => void;
    onValueChange: (
        fieldName: string,
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => void;
}> = ({ filterStates, menuOption, fieldName, state, onOptionChange, onValueChange }) => {
    // const [optionTypes, setOptionType] = useState({})
    const isBetween = formatString(filterStates?.[fieldName]?.number?.option) === 'Between';
    const isEmpty = formatString(filterStates?.[fieldName]?.number?.option) === 'Is Empty';
    const isNotEmpty = formatString(filterStates?.[fieldName]?.number?.option) === 'Is Not Empty';


    return (
        <Box sx={{ p: 1, mt: 1, borderBottom: '1px solid #CBD6E2' }}>
            <FormControl fullWidth size='small' sx={{
                '.MuiInputBase-root': {
                    fontSize: '12px',
                    fontWeight: 300,
                }
            }}>
                <Select
                    value={state.number?.option || 'Equals'}
                    onChange={(e) => onOptionChange(fieldName, e)}
                    sx={{
                        height: '30px', minHeight: 20,
                    }}
                    MenuProps={{
                        sx: {
                            '& .MuiMenuItem-root': {
                                fontSize: '12px',
                                fontWeight: 300,
                            }
                        }
                    }}
                >
                    {menuOption && menuOption.map((menu) => (
                        <MenuItem key={menu.option} value={menu.value}>{menu.option}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            {<Box>
                <TextField
                    size='small'
                    fullWidth
                    disabled={isEmpty || isNotEmpty}
                    placeholder='Enter number'
                    type='number'
                    name="from"
                    value={state.number?.value?.from || ''}
                    onChange={(e) => onValueChange(fieldName, e)}
                    sx={{ mt: 1 }}
                    slotProps={{
                        input: {
                            sx: { height: '30px', paddingY: 0, fontSize: '0.75rem' },
                        },
                    }}
                />
                {isBetween &&
                    <TextField
                        size='small'
                        fullWidth
                        placeholder='Enter number'
                        type='number'
                        name="to"
                        value={state.number?.value?.to || ''}
                        onChange={(e) => onValueChange(fieldName, e)}
                        sx={{ mt: 1 }}
                        slotProps={{
                            input: {
                                sx: { height: '30px', paddingY: 0, fontSize: '0.75rem' },
                            },
                        }}
                    />
                }

            </Box>}
        </Box>
    )
}

export const DateFilterControl: React.FC<{
    filterStates: Record<string, FilterState>,
    menuOption: { option: string, value: string }[],
    fieldName: string;
    state: FilterState;
    onOptionChange: (fieldName: string, event: SelectChangeEvent<any>) => void;
    onValueChange: (
        type: 'from' | 'to',
        fieldName: string,
        dateValue: string
    ) => void;
}> = ({ filterStates, menuOption, fieldName, state, onOptionChange, onValueChange }) => {
    const isBetween = formatString(filterStates?.[fieldName]?.date?.option) === 'Between';
    const disableInput = formatString(filterStates?.[fieldName]?.date?.option) === 'Is Empty' ||
        formatString(filterStates?.[fieldName]?.date?.option) === 'Is Not Empty' ||
        formatString(filterStates?.[fieldName]?.date?.option) === 'This Month';
    return (
        <Box sx={{ p: 1, mt: 1, borderBottom: '1px solid #CBD6E2' }}>
            <FormControl fullWidth size='small' sx={{
                '.MuiInputBase-root': {
                    fontSize: '12px',
                    fontWeight: 300,
                }
            }}>
                <Select
                    value={state.date?.option || 'Equals'}
                    onChange={(e) => onOptionChange(fieldName, e)}
                    sx={{
                        height: '30px', minHeight: 20,
                    }}
                    MenuProps={{
                        sx: {
                            '& .MuiMenuItem-root': {
                                fontSize: '12px',
                                fontWeight: 300,
                            }
                        }
                    }}
                >
                    {menuOption && menuOption.map((menu) => (
                        <MenuItem key={menu.option} value={menu.value}>{menu.option}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Box sx={{
                borderBottom: '1px solid #CBD6E2', '.MuiFormControl-root': {
                    marginTop: '8px'
                }
            }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        name='from'
                        value={dayjs(state.date?.value.from, 'YYYY/MM/DD')}
                        disabled={disableInput}
                        format="YYYY/MM/DD"
                        onChange={(newValue) => {
                            onValueChange('from', fieldName, dayjs(newValue).format('YYYY/MM/DD'));
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
                                placeholder: 'YYYY/MM/DD'
                            },
                        }}
                    />
                </LocalizationProvider>
                {isBetween && <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        name='to'
                        sx={{ mt: 1 }}
                        value={dayjs(state.date?.value.to, 'YYYY/MM/DD')}
                        disabled={disableInput}
                        format="YYYY/MM/DD"
                        onChange={(newValue) => {
                            onValueChange('to', fieldName, dayjs(newValue).format('YYYY/MM/DD'));
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
                                placeholder: 'YYYY/MM/DD'
                            },
                        }}
                    />
                </LocalizationProvider>}
            </Box>
        </Box>
    )
}



export const EnumFilterControl: React.FC<{
    filterStates: Record<string, FilterState>,
    menuOption: { option: string, value: string }[],
    valueOptions: { option: string, value: string }[],
    fieldName: string;
    state: FilterState;
    onOptionChange: (fieldName: string, event: SelectChangeEvent<any>) => void;
    onChange: (fieldName: string, isMultiple: boolean, values: string[]) => void
}> = ({ filterStates, menuOption, valueOptions, fieldName, state, onOptionChange, onChange }) => {

    const isMultiple = formatString(filterStates?.[fieldName]?.enum?.option) === 'In' || formatString(filterStates?.[fieldName]?.enum?.option) === 'Not In';

    return (
        <Fragment>
            <Box sx={{ pl: 1, mt: 1 }}>
                <FormControl fullWidth size='small' sx={{
                    '.MuiInputBase-root': {
                        fontSize: '12px',
                        fontWeight: 300,
                    }
                }}>
                    <Select
                        value={state.enum?.option || 'Equals'}
                        onChange={(e) => onOptionChange(fieldName, e)}
                        sx={{ height: '30px', minHeight: 20 }}
                        MenuProps={{
                            sx: {
                                '& .MuiMenuItem-root': {
                                    fontSize: '12px',
                                    fontWeight: 300,
                                }
                            }
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
            <Box sx={{ pl: 1, mt: 1 }}>
                <FormControl fullWidth size='small' sx={{
                    '.MuiInputBase-root': {
                        fontSize: '12px',
                        fontWeight: 300,
                    }
                }}>
                    <Select
                        multiple={isMultiple}
                        value={(state.enum?.value) || []}
                        MenuProps={{
                            sx: {
                                '& .MuiMenuItem-root': {
                                    fontSize: '12px',
                                    fontWeight: 300,
                                }
                            }
                        }}
                        name='value'
                        onChange={(e) => onChange(fieldName, isMultiple, e.target.value as string[])}
                        sx={{ height: '30px', minHeight: 20 }}
                        renderValue={(selected) => Array.isArray(selected) ? selected.join(', ') : ''}
                    >
                        {valueOptions.map((item) => (
                            <MenuItem key={item.option} value={item.value}>
                                {item.option}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
        </Fragment>
    )
};



