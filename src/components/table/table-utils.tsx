import React from 'react';
import { TextField, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { ListTableColumn, RenderFieldsProps, RowData } from './types';

export function cleanCellValue(raw: unknown): string {
  if (raw == null || raw === '-' || raw === '--') return '';
  if (React.isValidElement(raw)) return '';
  if (raw instanceof Date) return raw.toISOString();
  if (typeof raw === 'object') return '';
  return String(raw);
}

export const getCleanCellValue = <T extends RowData>(
  row: T,
  column: ListTableColumn<T>
) => {
  const renderedValue = column.render ? column.render(row) : null;
  if (renderedValue !== null && typeof renderedValue === 'object') {
    return cleanCellValue(row[column.id] ?? '');
  }
  return cleanCellValue(renderedValue ?? row[column.id] ?? '');
};

export const renderFields = <T extends RowData>({
  column,
  editingCell,
  handleValueChange,
  handleKeyDown,
  isSaving,
}: RenderFieldsProps<T>) => {
  if (!editingCell) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    handleValueChange(e.target.value);
  };

  const handleSelectChange = (e: SelectChangeEvent<string | number>) => {
    handleValueChange(e.target.value);
  };

  const commonProps = {
    value: editingCell.value || '',
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    disabled: isSaving,
    size: 'small' as const,
    fullWidth: true,
    variant: 'outlined' as const,
    error: !!editingCell.error,
    placeholder: column.field?.placeholder || '',
    sx: {
      fontSize: '13px',
      width: '100%',
      '& .MuiOutlinedInput-input': {
        fontSize: '13px',
        padding: '6px 8px',
        height: '20px',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        border: editingCell.error ? '1px solid #ef4444' : 'none',
      },
      '& .MuiOutlinedInput-root': {
        '&.Mui-focused': {
          boxShadow: 'none',
        },
      },
      '.MuiSelect-select': {
        padding: '6px 8px',
        color: editingCell.value === '' ? '#7D98B6' : 'black',
      },
      '&.Mui-disabled': {
        backgroundColor: '#f3f4f6',
      },
      '& .MuiOutlinedInput-notchedOutline': {
        border: 'none',
        borderRadius: '2px',
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        border: 'none',
      },
      '& svg': {
        color: '#7D98B6',
      },
    },
  };

  switch (column?.field?.type) {
    case 'text':
      return <TextField {...commonProps} type='text' autoFocus />;
    case 'select':
      return (
        <Select
          {...commonProps}
          displayEmpty
          value={editingCell.value}
          onChange={handleSelectChange}
          MenuProps={{
            PaperProps: {
              sx: {
                maxWidth: column.width || 300,
                maxHeight: 300,
                marginTop: '4px',
                boxShadow:
                  'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
                '& .MuiMenuItem-root': {
                  fontSize: '13px',
                  padding: '6px 12px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              },
            },
          }}
        >
          {column?.field?.placeholder && (
            <MenuItem
              value=''
              sx={{
                color: '#425A76',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              {column?.field?.placeholder}
            </MenuItem>
          )}
          {column?.field?.options?.map((option) => (
            <MenuItem
              key={option.value}
              title={option.label}
              value={option.value}
              sx={{
                color: '#425A76',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>
      );
    case 'textarea':
      return (
        <div className='absolute top-0 left-0 w-full z-30 bg-white'>
          <TextField
            {...commonProps}
            multiline
            minRows={3}
            maxRows={10}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                padding: '4px 0px 4px 8px !important',
                borderRadius: 0,
                '& fieldset': {
                  border: `1px solid ${editingCell.error ? '#ef4444' : '#60A5FA'}`,
                },
                '&:hover fieldset': {
                  borderColor: editingCell.error ? '#ef4444' : '#60A5FA',
                },
                '&.Mui-focused fieldset': {
                  borderColor: editingCell.error ? '#ef4444' : '#60A5FA',
                },
              },
              '& .MuiOutlinedInput-input': {
                fontSize: '13px',
                lineHeight: 1.4,
              },
              '& textarea': {
                resize: 'none',
              },
            }}
          />
        </div>
      );
    case 'number':
      return <TextField {...commonProps} type='number' />;
    default:
      return null;
  }
};

export const validateCellValue = <T extends RowData>(
  value: string,
  column: ListTableColumn<T>
): string | null => {
  let error = null;

  if (column.field?.required && !value.trim()) {
    error = 'This field is required';
  } else if (column.field?.validation) {
    for (const validation of column.field.validation) {
      if (!validation.regex.test(value)) {
        error = validation.errorMessage;
        break;
      }
    }
  }

  return error;
};
