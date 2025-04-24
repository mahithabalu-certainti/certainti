// FilterControls.tsx
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import { FilterState } from '../../consultant/types/account-filter';
import { useMemo } from 'react';

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
  options: string[];
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
          <MenuItem key={option} value={option} sx={{ fontSize: '14px' }}>
            {option}
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
            width: 200,
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
