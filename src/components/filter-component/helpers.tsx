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
import { arrowIcon } from '../../assets';

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
        sx={{ height: '30px', minHeight: 20, fontSize: '14px'}}
      >
        <MenuItem value='contains' sx={{ fontSize: '14px' }}>Contains</MenuItem>
        <MenuItem value='equals' sx={{ fontSize: '14px' }}>Equals</MenuItem>
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
          sx={{ height: '30px', minHeight: 20 , fontSize: '14px'}}
        >
          <MenuItem value='greater_than' sx={{ fontSize: '14px' }}>Greater Than</MenuItem>
          <MenuItem value='less_than' sx={{ fontSize: '14px' }}>Less Than</MenuItem>
          <MenuItem value='between' sx={{ fontSize: '14px' }}>Between</MenuItem>
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
                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
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
            '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
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
  options: { value: string; label: string; }[];
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
          <MenuItem key={option.label} value={option.value} sx={{ fontSize: '14px' }}>
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
          size="small"
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
      <FormControl fullWidth size="small">
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
            }
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


const SELECT_STYLES = {
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
    py: 0
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
};

const MENU_PROPS: Partial<MenuProps> = {
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

export const NewTextFilterControl: React.FC<{
  fieldName: string;
  state: FilterState;
  onOptionChange: (fieldName: string, event: SelectChangeEvent<string>) => void;
  onValueChange: (
    fieldName: string,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}> = ({ fieldName, state, onOptionChange, onValueChange }) => (
  <div className="flex gap-2 items-center">
    <Select
      size="small"
      value={state.text?.option || 'contains'}
      onChange={(e) => onOptionChange(fieldName, e)}
      className="min-w-[65px] max-w-[65px] h-[28px]"
      IconComponent={() => (
        <img src={arrowIcon} alt="arrowIcon" className="pr-3" />
      )}
      sx={SELECT_STYLES}
      MenuProps={MENU_PROPS}
    >
      <MenuItem value="equals" sx={{ fontSize: '14px', color: '#425A76', fontWeight: 600, py: '1px' }}>=</MenuItem>
      <MenuItem value="contains" sx={{ fontSize: '14px', color: '#425A76', fontWeight: 600, py: '1px' }}>∈</MenuItem>
      <MenuItem value="starts_with" sx={{ fontSize: '14px', color: '#425A76', fontWeight: 600, py: '1px' }}>↦</MenuItem>
      <MenuItem value="ends_with" sx={{ fontSize: '14px', color: '#425A76', fontWeight: 600, py: '1px' }}>⇥</MenuItem>
    </Select>
    <TextField
      size="small"
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
          width: '170px'
        },
      }}
    />
  </div>
);

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
          gap: '4px'
        }}
      >
        <Checkbox
          disableRipple
          checked={selectedValues.includes(option)}
          size="small"
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

  return(
  <FormControl fullWidth>
    <Select
      multiple
      size="small"
      value={state.multiSelect?.values || []}
      onChange={(e) => onChange(fieldName, e.target.value as string[])}
      className="h-[28px] mr-1.5"
      IconComponent={() => (
        <img src={arrowIcon} alt="arrowIcon" className="pr-3" />
      )}
      sx={SELECT_STYLES}
      MenuProps={MENU_PROPS}
    >
      {menuItems}
    </Select>
  </FormControl>
)};

export const NewNumberFilterControl: React.FC<{
  fieldName: string;
  state: FilterState;
  onOptionChange: (fieldName: string, event: SelectChangeEvent<string>) => void;
  onValueChange: (
    fieldName: string,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index?: number
  ) => void;
}> = ({ fieldName, state, onOptionChange, onValueChange }) => {
  const option = state.number?.option || 'equals';
  const value = state.number?.value;
  const hasError = state.number?.error ?? false;

  return (
    <div className="flex gap-2 items-center">
      <Select
        size="small"
        value={option}
        onChange={(e) => onOptionChange(fieldName, e)}
        className="min-w-[65px] max-w-[65px] h-[28px]"
        IconComponent={() => (
          <img src={arrowIcon} alt="arrowIcon" className="pr-3" />
        )}
        sx={SELECT_STYLES}
        MenuProps={MENU_PROPS}
      >
        <MenuItem value="equals" sx={{ fontSize: '12px', color: '#425A76', fontWeight: 600, py: '1px' }}>=</MenuItem>
        <MenuItem value="greater_than" sx={{ fontSize: '12px', color: '#425A76', fontWeight: 600, py: '1px' }}>&gt;</MenuItem>
        <MenuItem value="less_than" sx={{ fontSize: '12px', color: '#425A76', fontWeight: 600, py: '1px' }}>&lt;</MenuItem>
        <MenuItem value="between" sx={{ fontSize: '12px', color: '#425A76', fontWeight: 600, py: '1px' }}>⟷</MenuItem>
      </Select>
      
      {option === 'between' ? (
        <div className="flex gap-2">
          {[0, 1].map((i) => (
            <TextField
              key={i}
              type="number"
              size="small"
              placeholder={i === 0 ? 'Min' : 'Max'}
              value={Array.isArray(value) ? value[i] : ''}
              onChange={(e) => onValueChange(fieldName, e, i)}
              error={hasError && (!value || (Array.isArray(value) && value[i]?.trim() === ''))}
              inputProps={{ min: 0 }}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e') e.preventDefault();
              }}
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
                  width: '82px'
                },
                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
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
          type="number"
          size="small"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onValueChange(fieldName, e)}
          placeholder='Enter a number'
          error={hasError && !value}
          inputProps={{ min: 0 }}
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === 'e') e.preventDefault();
          }}
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
              width: '170px'
            },
            '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
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
  );
};

export const NewStatusFilterControl: React.FC<{
  fieldName: string;
  state: FilterState;
  options: { value: string; label: string; }[];
  onOptionChange: (fieldName: string, event: SelectChangeEvent<string>) => void;
}> = ({ fieldName, state, options, onOptionChange }) => (
  <FormControl fullWidth>
    <Select
      size="small"
      value={state.status?.value || 'Active'}
      onChange={(e) => onOptionChange(fieldName, e)}
      className="mr-1.5 h-[28px]"
      IconComponent={() => (
        <img src={arrowIcon} alt="arrowIcon" className="pr-3" />
      )}
      sx={SELECT_STYLES}
      MenuProps={MENU_PROPS}
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
      size="small"
      value={state.boolean?.value ? 'true' : 'false'}
      onChange={(e) => onChange(fieldName, e.target.value === 'true')}
      className="mr-1.5 h-[28px]"
      IconComponent={() => (
        <img src={arrowIcon} alt="arrowIcon" className="pr-3" />
      )}
      sx={SELECT_STYLES}
      MenuProps={MENU_PROPS}
    >
      <MenuItem value="true" sx={{ fontSize: '12px', color: '#425A76', fontWeight: 600, py: '1px' }}>Yes</MenuItem>
      <MenuItem value="false" sx={{ fontSize: '12px', color: '#425A76', fontWeight: 600, py: '1px' }}>No</MenuItem>
    </Select>
  </FormControl>
);
