import {
  TextField,
  MenuItem,
  Select,
  FormControl,
  OutlinedInput,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Tooltip,
} from '@mui/material';
import { FormField } from '../../consultant/types';
import { ErrorInfoIcon } from '../../assets';
import React, { useEffect, useRef, useState } from 'react';

type FormData = {
  [key: string]: string | string[];
};

type FormBuilderProps = {
  fields: FormField[];
  formData: FormData;
  setFormData: (data: FormData) => void;
  onFormChange?: (formData: FormData) => void;
  onValidationChange?: (hasErrors: boolean) => void;
};

type FieldErrors = {
  [key: string]: string | null;
};

export const FormBuilder: React.FC<FormBuilderProps> = ({
  fields,
  formData,
  setFormData,
  onFormChange,
  onValidationChange,
}) => {
  const [showOtherFields, setShowOtherFields] = useState<{
    [key: string]: boolean;
  }>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const formRef = useRef<HTMLFormElement>(null);

  // Initialize form state
  useEffect(() => {
    if (Object.keys(formData).length === 0) {
      setShowOtherFields({});
      setFieldErrors({});
      setTouchedFields(new Set());
    }
  }, [formData]);

  useEffect(() => {
    if (onValidationChange) {
      const hasErrors = Object.values(fieldErrors).some(
        (error) => error !== null
      );
      onValidationChange(hasErrors);
    }
  }, [fieldErrors, onValidationChange]);

  const validateField = (
    fieldId: string,
    value: string | string[]
  ): string | null => {
    const isOthersField = fieldId.endsWith('_others');
    const baseFieldId = isOthersField
      ? fieldId.replace(/_others$/, '')
      : fieldId;

    const field = fields.find((f) => f.id === baseFieldId);
    if (!field) return null;

    // Skip validation for main select fields (only validate "others" fields)
    if (field.type === 'select' && !isOthersField) {
      return null;
    }

    // Skip validation if the field is empty and not required
    if (
      !field.required &&
      (!value || (Array.isArray(value) && value.length === 0))
    ) {
      return null;
    }

    // Handle required validation
    if (
      field.required &&
      (!value || (Array.isArray(value) && value.length === 0))
    ) {
      return 'This field is required';
    }

    // Run all validation rules if they exist
    if (field.validation) {
      const stringValue = Array.isArray(value) ? value.join('') : value;

      for (const validation of field.validation) {
        if (!validation.regex.test(stringValue)) {
          return validation.errorMessage;
        }
      }
    }

    return null;
  };

  const handleChange = (fieldId: string, value: string | string[]) => {
    if (typeof value === 'string') {
      value = value.replace(/\r?\n|\r/g, ' ').trim();
    }

    let updated = { ...formData, [fieldId]: value };

    const field = fields.find((f) => f.id === fieldId);
    if (field?.type === 'select') {
      const othersValue = field.options?.find(
        (opt) => opt.label.toLowerCase() === 'others'
      )?.value;

      const isOthersSelected = value === othersValue;

      setShowOtherFields((prev) => ({
        ...prev,
        [fieldId]: isOthersSelected,
      }));

      if (!isOthersSelected) {
        const otherFieldId = `${fieldId}_others`;
        if (updated[otherFieldId]) {
          updated = { ...updated, [otherFieldId]: '' };
          setFieldErrors((prev) => ({ ...prev, [otherFieldId]: null }));
        }
      }
    }

    setFormData(updated);
    if (onFormChange) onFormChange(updated);

    // Real-time validation when field has been touched and has an error
    if (touchedFields.has(fieldId) && fieldErrors[fieldId]) {
      const error = validateField(fieldId, value);
      setFieldErrors((prev) => ({ ...prev, [fieldId]: error }));
    }
  };

  const handleBlur = (fieldId: string) => {
    // Mark field as touched
    if (!touchedFields.has(fieldId)) {
      setTouchedFields((prev) => new Set(prev).add(fieldId));
    }

    const field = fields.find((f) => f.id === fieldId);

    // Only validate if it's an "others" field or not a select field
    if (
      (field?.type !== 'select' || fieldId.endsWith('_others')) &&
      (field?.required || formData[fieldId])
    ) {
      const error = validateField(fieldId, formData[fieldId] || '');
      setFieldErrors((prev) => ({ ...prev, [fieldId]: error }));
    }

    // Handle "others" field validation if needed
    if (field?.type === 'select' && showOtherFields[fieldId]) {
      const otherFieldId = `${fieldId}_others`;
      if (!touchedFields.has(otherFieldId)) {
        setTouchedFields((prev) => new Set(prev).add(otherFieldId));
      }
      if (formData[otherFieldId]) {
        const otherError = validateField(
          otherFieldId,
          formData[otherFieldId] || ''
        );
        setFieldErrors((prev) => ({ ...prev, [otherFieldId]: otherError }));
      }
    }
  };

  // Group fields into rows for better layout
  const groupedFields: FormField[][] = [];
  let currentRow: FormField[] = [];
  let currentRowFieldCount = 0;

  for (const field of fields) {
    const showOther = showOtherFields[field.id];
    const fieldCount = field.type === 'select' && showOther ? 2 : 1;

    if (field.type === 'textarea') {
      if (currentRow.length > 0) {
        groupedFields.push(currentRow);
        currentRow = [];
        currentRowFieldCount = 0;
      }
      groupedFields.push([field]);
    } else {
      if (currentRowFieldCount + fieldCount > 3) {
        if (currentRow.length > 0) {
          groupedFields.push(currentRow);
          currentRow = [];
          currentRowFieldCount = 0;
        }
      }
      currentRow.push(field);
      currentRowFieldCount += fieldCount;
    }
  }

  if (currentRow.length > 0) {
    groupedFields.push(currentRow);
  }

  const commonStyles = {
    height: 32,
    fontSize: 13,
    fontWeight: 500,
    borderRadius: '2px',
    backgroundColor: 'white',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#CBD6E2',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#60A5FA',
      borderWidth: '1px',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#60A5FA',
    },
  };

  const errorStyles = {
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#ef4444 !important',
      borderWidth: '1px !important',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#ef4444 !important',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#ef4444 !important',
    },
  };

  return (
    <form ref={formRef} className='bg-white px-4 py-4 space-y-3'>
      {groupedFields.map((row, rowIndex) => (
        <div
          key={`row-${row.map((f) => f.id).join('-')}`}
          className='grid grid-cols-1 md:grid-cols-3 gap-6'
        >
          {row.map((field) => {
            const value = formData[field.id] || '';
            const showOther = showOtherFields[field.id];
            const error = fieldErrors[field.id];
            const isTouched = touchedFields.has(field.id);
            const showError = isTouched && error;

            return (
              <React.Fragment key={`field-${field.id}`}>
                <div
                  className={
                    field.type === 'textarea'
                      ? 'md:col-span-3'
                      : 'md:col-span-1'
                  }
                >
                  <FormControl fullWidth size='small' required={field.required}>
                    <label
                      htmlFor={field.id}
                      className='text-sm font-semibold text-[#2C3E50] mb-1 block'
                    >
                      {field.label}
                      {field.required && (
                        <span className='text-red-500'> *</span>
                      )}
                    </label>

                    <div className='relative'>
                      {['text', 'email', 'number'].includes(field.type) && (
                        <TextField
                          id={field.id}
                          type={field.type}
                          value={value}
                          onChange={(e) =>
                            handleChange(field.id, e.target.value)
                          }
                          onBlur={() => handleBlur(field.id)}
                          placeholder={
                            field.placeholder || `Enter ${field.label}`
                          }
                          fullWidth
                          required={field.required}
                          InputProps={{
                            sx: {
                              ...commonStyles,
                              ...(showError ? errorStyles : {}),
                            },
                          }}
                          inputProps={{
                            style: { fontSize: 13, textAlign: 'left' },
                          }}
                        />
                      )}

                      {field.type === 'textarea' && (
                        <TextField
                          id={field.id}
                          value={value}
                          onChange={(e) =>
                            handleChange(field.id, e.target.value)
                          }
                          onBlur={() => handleBlur(field.id)}
                          placeholder={
                            field.placeholder || `Enter ${field.label}`
                          }
                          required={field.required}
                          multiline
                          rows={field.rows || 3}
                          fullWidth
                          InputProps={{
                            sx: {
                              ...commonStyles,
                              height: 'auto',
                              padding: '0 !important',
                              ...(showError ? errorStyles : {}),
                              '& .MuiInputBase-input': {
                                lineHeight: '1.4 !important',
                                fontFamily: 'inherit',
                                '&::placeholder': {
                                  opacity: 0.7,
                                  color: '#7D98B6',
                                  lineHeight: '1.4 !important',
                                  padding: '0 !important',
                                  margin: '0 !important',
                                  transform: 'none !important',
                                  position: 'relative',
                                  top: '0 !important',
                                  left: '0 !important',
                                },
                              },
                              '& .MuiOutlinedInput-root': {
                                padding: '0 !important',
                              },
                            },
                          }}
                          inputProps={{
                            style: {
                              fontSize: 13,
                              textAlign: 'left',
                              padding: '6px 12px',
                              lineHeight: '1.4',
                              resize: 'vertical',
                            },
                          }}
                        />
                      )}

                      {field.type === 'select' && (
                        <>
                          <Select
                            id={field.id}
                            value={value}
                            onChange={(e) =>
                              handleChange(field.id, e.target.value)
                            }
                            onBlur={() => handleBlur(field.id)}
                            displayEmpty
                            fullWidth
                            input={
                              <OutlinedInput
                                placeholder={`Choose ${field.label}`}
                              />
                            }
                            sx={{
                              ...commonStyles,
                              ...(showError ? errorStyles : {}),
                              '.MuiSelect-select': {
                                padding: '6px',
                                fontSize: 13,
                                color: value === '' ? '#7D98B6' : '#425A76',
                              },
                              '& svg': { color: '#7D98B6' },
                            }}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  maxHeight: 300,
                                  boxShadow:
                                    'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
                                  '& .MuiMenuItem-root': {
                                    fontSize: '13px',
                                    padding: '6px 12px',
                                  },
                                },
                              },
                            }}
                          >
                            <MenuItem value=''>
                              {`Choose ${field.label}`}
                            </MenuItem>
                            {field.options?.map((option, index) => (
                              <MenuItem
                                key={`${field.id}-${option.value}-${index}`}
                                value={option.value}
                              >
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </>
                      )}
                      {field.type === 'radio' && (
                        <RadioGroup
                          row
                          name={field.id}
                          value={value}
                          onChange={(e) =>
                            handleChange(field.id, e.target.value)
                          }
                          onBlur={() => handleBlur(field.id)}
                        >
                          {field.options?.map((option, index) => (
                            <FormControlLabel
                              key={`${field.id}-${option.value}-${index}`}
                              value={option.value}
                              control={<Radio size='small' />}
                              label={option.label}
                              sx={{
                                '.MuiFormControlLabel-label': { fontSize: 13 },
                              }}
                            />
                          ))}
                        </RadioGroup>
                      )}

                      {field.type === 'checkbox' && (
                        <div className='space-y-1'>
                          {field.options?.map((option, index) => {
                            const checked = (
                              (formData[field.id] as string[]) || []
                            ).includes(option.value);

                            return (
                              <FormControlLabel
                                key={`${field.id}-${option.value}-${index}`}
                                control={
                                  <Checkbox
                                    size='small'
                                    checked={checked}
                                    onChange={(e) => {
                                      const current =
                                        (formData[field.id] as string[]) || [];
                                      const updated = e.target.checked
                                        ? [...current, option.value]
                                        : current.filter(
                                            (v) => v !== option.value
                                          );
                                      handleChange(field.id, updated);
                                    }}
                                    onBlur={() => handleBlur(field.id)}
                                  />
                                }
                                label={option.label}
                                sx={{
                                  '.MuiFormControlLabel-label': {
                                    fontSize: 13,
                                  },
                                }}
                              />
                            );
                          })}
                        </div>
                      )}

                      {showError && (
                        <Tooltip
                          title={error}
                          arrow
                          placement='top'
                          slotProps={{
                            tooltip: {
                              sx: {
                                color: '#B91C1C',
                                fontSize: '12px',
                                fontWeight: 500,
                              },
                            },
                          }}
                        >
                          <span
                            className={`h-[26px] w-6 flex items-center justify-center absolute ${
                              field.type === 'textarea'
                                ? '-top-[3px] right-[1px] z-40'
                                : 'top-[3px] right-0'
                            } cursor-pointer`}
                          >
                            <ErrorInfoIcon alt='error' className='w-5 h-3.5' />
                          </span>
                        </Tooltip>
                      )}
                    </div>
                  </FormControl>
                </div>

                {field.type === 'select' && showOther && (
                  <div className='md:col-span-1'>
                    <FormControl fullWidth size='small'>
                      <label
                        htmlFor={`${field.id}-other`}
                        className='text-sm font-semibold text-[#2C3E50] mb-1 block'
                      >
                        {field.label} - others
                      </label>
                      <div className='relative'>
                        <TextField
                          id={`${field.id}_others`}
                          value={
                            (formData[`${field.id}_others`] as string) || ''
                          }
                          onChange={(e) =>
                            handleChange(`${field.id}_others`, e.target.value)
                          }
                          onBlur={() => handleBlur(`${field.id}_others`)}
                          placeholder={`Specify ${field.label}`}
                          fullWidth
                          InputProps={{
                            sx: {
                              ...commonStyles,
                              ...(fieldErrors[`${field.id}_others`]
                                ? errorStyles
                                : {}),
                            },
                          }}
                          inputProps={{
                            style: { fontSize: 13, textAlign: 'left' },
                          }}
                        />
                        {fieldErrors[`${field.id}_others`] && (
                          <Tooltip
                            title={fieldErrors[`${field.id}_others`]}
                            arrow
                            placement='top'
                            slotProps={{
                              tooltip: {
                                sx: {
                                  color: '#B91C1C',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                },
                              },
                            }}
                          >
                            <span
                              className={`h-[26px] w-6 flex items-center justify-center absolute top-[3px] right-0 cursor-pointer`}
                            >
                              <ErrorInfoIcon
                                alt='error'
                                className='w-5 h-3.5'
                              />
                            </span>
                          </Tooltip>
                        )}
                      </div>
                    </FormControl>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      ))}
    </form>
  );
};
