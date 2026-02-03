import React from 'react';
import { TextField, MenuItem } from '@mui/material';
import {
  ListTableColumn,
  RenderFieldsProps,
  RowData,
  MultipleEditingCells,
} from './types';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { CalendarIcon, CloseIcon } from '../../assets';
import { checkDependencies, getDateConstraints } from './dependency-utils';
import { formatCostValue, removeFormatCostValue } from '../../common-utils';

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
  const renderedValue =
    column.render && column?.field?.renderValue ? column.render(row) : null;
  if (renderedValue !== null && typeof renderedValue === 'object') {
    return cleanCellValue(row[column.id] ?? '');
  }
  return cleanCellValue(renderedValue ?? row[column.id] ?? '');
};

export const getEditingCellValue = <T extends RowData>(
  row: T,
  column: ListTableColumn<T>
): string | number => {
  const rawValue = getCleanCellValue(row, column);

  if (column.field?.type !== 'select') {
    return rawValue ?? '';
  }

  const options = column.field?.options ?? [];

  const rawString = rawValue != null ? String(rawValue).toLowerCase() : '';

  const foundByValue = options.find((opt) => {
    if (opt.value == null) return false;
    return String(opt.value).toLowerCase() === rawString;
  });
  if (foundByValue) return optValueWithOriginalType(foundByValue.value);

  const foundByLabel = options.find((opt) => {
    if (opt.label == null) return false;
    return String(opt.label).toLowerCase() === rawString;
  });
  if (foundByLabel) return optValueWithOriginalType(foundByLabel.value);

  return '';
};

function optValueWithOriginalType(value: string | number): string | number {
  if (typeof value === 'number') return value;
  if (!isNaN(Number(value))) {
    // If the string looks like a number, return number
    return Number(value);
  }
  return value;
}

export const renderFields = <T extends RowData>({
  column,
  editingCell,
  handleValueChange,
  handleKeyDown,
  isSaving,
  rowData,
  allEditingCells = {},
}: RenderFieldsProps<T>) => {
  if (!editingCell || !rowData) return null;

  // Check dependencies
  const dependencies = checkDependencies(column, rowData, allEditingCells);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    handleValueChange(e.target.value);
  };

  const isFieldDisabled = isSaving || dependencies.isDisabled;
  const fieldError = editingCell.error || dependencies.errorMessage;
  const rawValue =
    (column.field?.prefix && column.field?.prefixRegex
      ? editingCell.value.toString().replace(column.field?.prefixRegex, '')
      : editingCell.value) || '';

  const commonProps = {
    value: column.field?.formatCostNumber
      ? formatCostValue(removeFormatCostValue(rawValue?.toString()))
      : rawValue,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    disabled: isFieldDisabled,
    size: 'small' as const,
    fullWidth: fieldError ? false : true,
    variant: 'outlined' as const,
    error: !!fieldError,
    placeholder: column.field?.placeholder || '',
    sx: {
      fontSize: '13px',
      width: '100%',
      '& .MuiOutlinedInput-input': {
        fontSize: '13px',
        padding: column.field?.prefix ? '5px 8px 5px 36px' : '5px 8px',
        height: '20px',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        border: fieldError ? '1px solid #ef4444' : 'none',
      },
      '& .MuiOutlinedInput-root': {
        '&.Mui-focused': {
          boxShadow: 'none',
        },
      },
      '.MuiSelect-select': {
        padding: '5px 8px',
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
      '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
        {
          WebkitAppearance: 'none',
          margin: 0,
        },
      '& input[type=number]': {
        MozAppearance: 'textfield',
      },
    },
  };

  const getTextAreaPosition = (rowId: string, colId: string) => {
    const cell = document.querySelector(`[data-editing='${rowId}-${colId}']`);
    const rect = cell?.getBoundingClientRect?.();
    const spaceBelow = rect ? window.innerHeight - rect.bottom : 999;
    return spaceBelow < 150 ? { bottom: 0 } : { top: 0 };
  };

  // Get options for select fields
  const columnOptions = column.field?.options || [];
  const loading = column.field?.loading || false;

  if (loading) {
    return (
      <div className='w-full h-[30px] px-2 flex items-center justify-start'>
        Loading...
      </div>
    );
  }

  switch (column?.field?.type) {
    case 'text':
      return (
        <div className='relative'>
          <TextField
            {...commonProps}
            type='text'
            autoFocus
            onChange={(e) => {
              const inputValue = e.target.value;

              if (column.field?.formatCostNumber) {
                const cleanValue = removeFormatCostValue(inputValue);
                if (/^\d*\.?\d*$/.test(cleanValue)) {
                  handleValueChange(cleanValue);
                }
              } else {
                handleChange(e);
              }
            }}
          />
          {column.field.prefix && (
            <span className='absolute left-0 top-1/2 -translate-y-1/2 text-sm border-r border-r-[#d1d5dc] px-1 py-1 pl-[10px]'>
              {column.field.prefix}
            </span>
          )}
        </div>
      );

    case 'select':
      return (
        <TextField
          select
          {...commonProps}
          key={`select-${editingCell.rowId}-${editingCell.columnId}-${isSaving}`}
          sx={{
            ...commonProps.sx,
            width:
              fieldError && typeof column.width === 'number'
                ? column.width - 18
                : '100%',
            pointerEvents: isSaving ? 'none' : 'auto',
          }}
          SelectProps={{
            displayEmpty: true,
            MenuProps: {
              PaperProps: {
                sx: {
                  maxWidth: column.width || 300,
                  maxHeight: 300,
                  marginTop: '4px',
                  ml: fieldError ? '9px' : 0,
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
          {columnOptions.map((option) => (
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
        </TextField>
      );

    case 'textarea':
      return (
        <div
          className='absolute w-full bg-[#fff]'
          style={{
            zIndex: 1,
            ...(typeof window !== 'undefined' &&
              getTextAreaPosition(editingCell.rowId, editingCell.columnId)),
          }}
        >
          <TextField
            {...commonProps}
            multiline
            minRows={3}
            maxRows={10}
            autoFocus
            sx={{
              width: '100%',
              '& .MuiOutlinedInput-root': {
                padding: '4px 0px 4px 8px !important',
                borderRadius: 0,
                bgcolor: fieldError ? '#FEF2F2' : '#fff',
                '& fieldset': {
                  border: `1px solid ${fieldError ? '#ef4444' : '#60A5FA'}`,
                },
                '&:hover fieldset': {
                  borderColor: fieldError ? '#ef4444' : '#60A5FA',
                },
                '&.Mui-focused fieldset': {
                  borderColor: fieldError ? '#ef4444' : '#60A5FA',
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
      return (
        <TextField
          {...commonProps}
          type='number'
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === 'e') e.preventDefault();
            handleKeyDown(e);
          }}
        />
      );

    case 'date': {
      const dateConstraints = getDateConstraints(
        column,
        rowData,
        allEditingCells
      );

      return (
        <div onKeyDown={handleKeyDown}>
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            localeText={{
              fieldMonthPlaceholder: (params) =>
                params.contentType === 'digit' ? 'MM' : params.format,
            }}
          >
            <DatePicker
              value={editingCell.value ? dayjs(editingCell.value) : null}
              onChange={(newValue) => {
                handleValueChange(
                  newValue ? dayjs(newValue).format('YYYY-MM-DD') : ''
                );
              }}
              format='YYYY-MMM-DD'
              disabled={isFieldDisabled}
              minDate={dateConstraints.minDate || dayjs('1950-01-01')}
              maxDate={dateConstraints.maxDate || undefined}
              disableFuture={dateConstraints.disableFuture}
              sx={{
                width:
                  fieldError && typeof column.width === 'number'
                    ? column.width - 20
                    : '100%',
                '& .MuiOutlinedInput-root': {
                  height: '32px',
                  borderRadius: '2px',
                  '&.Mui-disabled': {
                    '& input': {
                      color: 'black',
                      WebkitTextFillColor: 'black',
                    },
                  },
                  '& fieldset': {
                    border: fieldError ? '1px solid #ef4444' : 'none',
                  },
                  '&:hover fieldset': {
                    borderColor: fieldError ? '#ef4444' : 'transparent',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: fieldError ? '#ef4444' : '#transparent',
                  },
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent !important',
                },
                '& .MuiInputBase-input': {
                  fontSize: '12px',
                  padding: '5px 8px',
                  height: '20px',
                  color: editingCell.value === '' ? '#7D98B6' : 'black',
                },
              }}
              slotProps={{
                field: { clearable: !isFieldDisabled },
                clearButton: {
                  tabIndex: -1, // disable tab focus for clear button
                },
                openPickerButton: {
                  tabIndex: -1, // prevent focus on calendar icon
                },
                textField: {
                  size: 'small',
                  error: !!fieldError,
                  placeholder: column.field?.placeholder || 'YYYY-MM-DD',
                  InputProps: {
                    disabled: true,
                    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
                      e.preventDefault();
                      return false;
                    },
                  },
                },
                inputAdornment: {
                  position: 'end',
                },
              }}
              slots={{
                openPickerIcon: () => (
                  <React.Suspense fallback={null}>
                    <CalendarIcon alt='calendar' className='w-3 h-3' />
                  </React.Suspense>
                ),
                clearIcon: () => (
                  <React.Suspense fallback={null}>
                    <CloseIcon alt='calendar' className='w-[9px] h-[9px]' />
                  </React.Suspense>
                ),
              }}
            />
          </LocalizationProvider>
        </div>
      );
    }
    default:
      return null;
  }
};

export const validateCellValue = <T extends RowData>(
  value: string | number,
  column: ListTableColumn<T>,
  rowData?: T,
  allEditingCells?: MultipleEditingCells
): string | null => {
  const stringValue = String(value ?? '').trim();

  // Check dependencies first
  if (rowData && allEditingCells) {
    const dependencies = checkDependencies(column, rowData, allEditingCells);
    if (dependencies.errorMessage) {
      return dependencies.errorMessage;
    }

    if (dependencies.isRequired && !stringValue) {
      return 'This field is required';
    }
  } else if (column.field?.required && !stringValue) {
    return 'This field is required';
  }

  // Standard validation
  if (column.field?.validation && stringValue) {
    for (const validation of column.field.validation) {
      if (!validation.regex.test(stringValue)) {
        return validation.errorMessage;
      }
    }
  }

  return null;
};
