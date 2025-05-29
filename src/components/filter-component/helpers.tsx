/* eslint-disable @typescript-eslint/no-explicit-any */
// FilterControls.tsx
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  MenuItem,
  MenuProps,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import { FilterState } from '../../consultant/types/account-filter';
import { useMemo } from 'react';
import { DateValueOptions } from '../../consultant/types/account-filter';
import { arrowIcon, checkedIcon } from '../../assets';

export const SELECT_STYLES = {
  fontWeight: 600,
  fontSize: '12px',
  lineHeight: '30px',
  borderRadius: '2px',
  '& .MuiSelect-select': {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: 600,
    fontSize: '12px',
    lineHeight: '30px',
    color: '#425A76',
    py: 0,
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
    },
  },
  MenuListProps: {
    sx: {
      paddingTop: 0,
      paddingBottom: 0,
    },
  },
};

export const TextFilterControl: React.FC<{
  fieldName: string;
  state: FilterState;
  onOptionChange: (fieldName: string, event: SelectChangeEvent<string>) => void;
  onValueChange: (
    fieldName: string,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}> = ({ fieldName, state, onOptionChange, onValueChange }) => (
  <Box sx={{ pl: 3, mt: 1 }}>
    <FormControl fullWidth size='small'>
      <Select
        value={state.text?.option || 'contains'}
        onChange={(e) => onOptionChange(fieldName, e)}
        sx={{ height: '30px', minHeight: 20, fontSize: '14px' }}
      >
        <MenuItem value='contains' sx={{ fontSize: '14px' }}>
          Contains
        </MenuItem>
        <MenuItem value='equals' sx={{ fontSize: '14px' }}>
          Equals
        </MenuItem>
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
  fieldName: string;
  state: FilterState;
  onOptionChange: (fieldName: string, event: SelectChangeEvent<string>) => void;
  onValueChange: (
    fieldName: string,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index?: number
  ) => void;
}> = ({ fieldName, state, onOptionChange, onValueChange }) => {
  const option = state.number?.option || 'greater_than';
  const value = state.number?.value;
  const hasError = state.number?.error ?? false;

  return (
    <Box sx={{ pl: 3, mt: 1 }}>
      <FormControl fullWidth size='small'>
        <Select
          value={option}
          onChange={(e) => onOptionChange(fieldName, e)}
          sx={{ height: '30px', minHeight: 20, fontSize: '14px' }}
        >
          <MenuItem value='greater_than' sx={{ fontSize: '14px' }}>
            Greater Than
          </MenuItem>
          <MenuItem value='less_than' sx={{ fontSize: '14px' }}>
            Less Than
          </MenuItem>
          <MenuItem value='between' sx={{ fontSize: '14px' }}>
            Between
          </MenuItem>
        </Select>
      </FormControl>

      {option === 'between' ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
          {[0, 1].map((i) => (
            <TextField
              key={i}
              size='small'
              fullWidth
              placeholder={i === 0 ? 'Min' : 'Max'}
              type='number'
              value={Array.isArray(value) ? value[i] : ''}
              onChange={(e) => onValueChange(fieldName, e, i)}
              error={hasError && (!value || value[i].trim() === '')}
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
          ))}
        </Box>
      ) : (
        <TextField
          size='small'
          fullWidth
          placeholder='Enter number'
          type='number'
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onValueChange(fieldName, e)}
          error={hasError && !value}
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
          inputProps={{ min: 0 }}
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
  );
};

export const StatusFilterControl: React.FC<{
  fieldName: string;
  state: FilterState;
  options: { value: string; label: string }[];
  onOptionChange: (fieldName: string, event: SelectChangeEvent<string>) => void;
}> = ({ fieldName, state, options, onOptionChange }) => (
  <Box sx={{ pl: 3, mt: 1 }}>
    <FormControl fullWidth size='small'>
      <Select
        value={state.status?.value || 'Active'}
        onChange={(e) => onOptionChange(fieldName, e)}
        sx={{ height: '30px', minHeight: 20, fontSize: '14px' }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.label}
            value={option.value}
            sx={{ fontSize: '14px' }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Box>
);

export const BooleanFilterControl: React.FC<{
  fieldName: string;
  state: FilterState;
  onChange: (fieldName: string, checked: boolean) => void;
}> = ({ fieldName, state, onChange }) => {
  const value = state.boolean?.value ?? false;

  return (
    <Box sx={{ pl: 3, mt: 1 }}>
      <FormGroup row>
        <FormControlLabel
          control={
            <Checkbox
              disableRipple
              checked={value === true}
              onChange={() => onChange(fieldName, true)}
              sx={{
                color: '#CBD6E2',
                '&.Mui-checked': {
                  color: '#1755E7',
                },
              }}
            />
          }
          sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
          label='Yes'
        />
        <FormControlLabel
          control={
            <Checkbox
              disableRipple
              checked={value === false}
              onChange={() => onChange(fieldName, false)}
              sx={{
                color: '#CBD6E2',
                '&.Mui-checked': {
                  color: '#1755E7',
                },
              }}
            />
          }
          sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
          label='No'
        />
      </FormGroup>
    </Box>
  );
};

export const MultiSelectFilterControl: React.FC<{
  fieldName: string;
  state: FilterState;
  options: string[];
  onChange: (fieldName: string, values: string[]) => void;
}> = ({ fieldName, state, options, onChange }) => {
  const selectedValues = state.multiSelect?.values || [];

  const menuItems = useMemo(() => {
    return options.map((option) => (
      <MenuItem key={option} value={option} dense sx={{ fontSize: '14px' }}>
        <Checkbox
          disableRipple
          checked={selectedValues.includes(option)}
          size='small'
          sx={{
            color: '#CBD6E2',
            '&.Mui-checked': {
              color: '#1755E7',
            },
          }}
        />
        {option}
      </MenuItem>
    ));
  }, [options, selectedValues]);

  return (
    <Box sx={{ pl: 2.5, mt: 1 }}>
      <FormControl fullWidth size='small'>
        <Select
          multiple
          value={selectedValues}
          onChange={(e) => onChange(fieldName, e.target.value as string[])}
          sx={{
            height: 'auto',
            minHeight: 30,
            '& .MuiSelect-select': {
              py: 0.5,
              fontSize: '14px',
            },
          }}
          renderValue={(selected) => (selected as string[]).join(', ')}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 200,
                width: 200,
              },
            },
          }}
        >
          {menuItems}
        </Select>
      </FormControl>
    </Box>
  );
};

export const DateFilterControl: React.FC<{
  fieldName: string;
  state: FilterState;
  onOptionChange: (fieldName: string, event: SelectChangeEvent<string>) => void;
  onValueChange: (
    fieldName: string,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index?: number,
    targetKey?: 'value' | 'toValue'
  ) => void;
}> = ({ fieldName, state, onOptionChange, onValueChange }) => (
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
      {DateValueOptions.map((option) => (
        <MenuItem
          key={option.value}
          value={option.value}
          sx={{
            fontSize: '13px',
            color: '#425A76',
            fontWeight: 600,
            py: '1px',
          }}
        >
          {option.label}
        </MenuItem>
      ))}
    </Select>
    <TextField
      size='small'
      autoComplete='off'
      fullWidth
      placeholder='MM-DD-YYYY'
      value={state.date?.value || ''}
      onChange={(e) => onValueChange(fieldName, e, undefined, 'value')}
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
          width: state.date?.option === 'between' ? '50%' : '153px',
        },
      }}
    />
    {state.date?.option === 'between' && (
      <TextField
        size='small'
        autoComplete='off'
        fullWidth
        placeholder='MM-DD-YYYY'
        value={state.date?.toValue || ''}
        onChange={(e) => onValueChange(fieldName, e, undefined, 'toValue')}
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
        }}
      />
    )}
  </div>
);

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
        IconComponent={(props) => (
          <img src={arrowIcon} alt='arrowIcon' {...props} />
        )}
        sx={SELECT_STYLES}
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
  const selectedValues = state.multiSelect?.values || [];

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
        IconComponent={(props) => (
          <img src={arrowIcon} alt='arrowIcon' {...props} />
        )}
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
        IconComponent={(props) => (
          <img src={arrowIcon} alt='arrowIcon' {...props} />
        )}
        sx={SELECT_STYLES}
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
      IconComponent={(props) => (
        <img src={arrowIcon} alt='arrowIcon' {...props} />
      )}
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
        IconComponent={(props) => (
          <img src={arrowIcon} alt='arrowIcon' {...props} />
        )}
        sx={SELECT_STYLES}
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
          IconComponent={(props) => (
            <img src={arrowIcon} alt='arrowIcon' {...props} />
          )}
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
          <div className='absolute left-[24px] rounded-[2px] mt-9 min-w-[173px] max-w-[173px] h-[28px] border border-[#CBD6E2]'>
            <div className='flex items-center justify-between pl-3.5 pr-[7px] text-[12px] text-[#425A76] h-full font-semibold'>
              <div className='flex items-center gap-1'>
                <img src={checkedIcon} alt='checked' className='w-3' />
                <span>Name</span>
              </div>
              <img src={arrowIcon} alt='arrowIcon' />
            </div>
          </div>
          {/* Name Operator Select */}
          <Select
            value={keyContactState.name.option}
            onChange={handleNameOptionChange}
            className='min-w-[110px] max-w-[110px] h-[28px]'
            IconComponent={(props) => (
              <img src={arrowIcon} alt='arrowIcon' {...props} />
            )}
            sx={SELECT_STYLES}
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
