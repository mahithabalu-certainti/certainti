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
        sx={{ height: '30px', minHeight: 20 }}
      >
        <MenuItem value='contains'>contains</MenuItem>
        <MenuItem value='equals'>equals</MenuItem>
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
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}> = ({ fieldName, state, onOptionChange, onValueChange }) => (
  <Box sx={{ pl: 3, mt: 1 }}>
    <FormControl fullWidth size='small'>
      <Select
        value={state.number?.option || 'greater_than'}
        onChange={(e) => onOptionChange(fieldName, e)}
        sx={{ height: '30px', minHeight: 20 }}
      >
        <MenuItem value='greater_than'>Greater Than</MenuItem>
        <MenuItem value='less_than'>Less Than</MenuItem>
        <MenuItem value='between'>Between</MenuItem>
      </Select>
    </FormControl>
    <TextField
      size='small'
      fullWidth
      placeholder='Enter number'
      type='number'
      value={state.number?.value || ''}
      onChange={(e) => onValueChange(fieldName, e)}
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
        if (e.key === '-' || e.key === 'e') {
          e.preventDefault();
        }
      }}
      slotProps={{
        input: {
          sx: { height: '30px', paddingY: 0, fontSize: '0.75rem' },
        },
      }}
    />
  </Box>
);

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
        sx={{ height: '30px', minHeight: 20 }}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>
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
              checked={value === true}
              onChange={() => onChange(fieldName, true)}
            />
          }
          label='Yes'
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={value === false}
              onChange={() => onChange(fieldName, false)}
            />
          }
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
      <MenuItem key={option} value={option} dense>
        <Checkbox checked={selectedValues.includes(option)} size="small" />
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
              fontSize: '0.875rem',
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
