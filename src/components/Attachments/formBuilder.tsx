import { TextField, MenuItem, Select, FormControl } from '@mui/material';
import { FormField, OthersEnum, SelectOption } from '../../consultant/types';
import React, { useEffect } from 'react';
import { getFormFields } from './helpers';

type FormData = {
  [key: string]: string | string[];
};

interface FieldOptionType {
  fiscalYears: SelectOption[];
  docCategories: SelectOption[];
  docTypes: SelectOption[];
}

type FormBuilderProps = {
  fieldOptions: FieldOptionType;
  formData: FormData;
  setFormData: (data: FormData) => void;
  onFormChange?: (formData: FormData) => void;
  onValidationChange?: (hasErrors: boolean) => void;
  fieldErrors: FieldErrors;
  setFieldErrors: (
    errors: FieldErrors | ((prev: FieldErrors) => FieldErrors)
  ) => void;
};

export type FieldErrors = {
  [key: string]: string | null;
};

export const FormBuilder: React.FC<FormBuilderProps> = ({
  fieldOptions,
  formData,
  setFormData,
  onFormChange,
  onValidationChange,
  fieldErrors,
  setFieldErrors,
}) => {
  const formFields = getFormFields(
    fieldOptions.fiscalYears,
    fieldOptions.docCategories,
    fieldOptions.docTypes
  );

  useEffect(() => {
    if (onValidationChange) {
      const hasErrors = Object.values(fieldErrors).some(
        (error) => error !== null
      );
      onValidationChange(hasErrors);
    }
  }, [fieldErrors, onValidationChange]);

  const handleChange = (fieldId: string, value: string | string[]) => {
    if (typeof value === 'string') {
      value = value.replace(/\r?\n|\r/g, ' ').trim();
    }

    const updated = { ...formData, [fieldId]: value };
    const changedField = formFields.find((f) => f.id === fieldId);

    if (changedField?.resetDependsFields) {
      changedField.resetDependsFields.forEach((depFieldId) => {
        updated[depFieldId] = '';
        setFieldErrors((prev) => ({ ...prev, [depFieldId]: null }));
      });
    }

    setFormData(updated);
    if (onFormChange) onFormChange(updated);

    setFieldErrors((prev) => ({ ...prev, [fieldId]: null }));
  };

  const shouldShowField = (field: FormField): boolean => {
    if (field.id === 'document_category_other') {
      const categoryField = formFields.find(
        (f) => f.id === 'document_category_rid'
      );
      const selectedOption = categoryField?.options?.find(
        (opt) => opt.value === formData.document_category_rid
      );
      return selectedOption?.label.toLowerCase() === OthersEnum.Others;
    }

    if (field.id === 'document_type_others') {
      const typeField = formFields.find((f) => f.id === 'document_type_rid');
      const selectedOption = typeField?.options?.find(
        (opt) => opt.value === formData.document_type_rid
      );
      return selectedOption?.label.toLowerCase() === OthersEnum.Others;
    }

    return !field.hide;
  };

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
    backgroundColor: '#FEF2F2',
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
    <form className='bg-white px-4 py-4 space-y-3'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {formFields.filter(shouldShowField).map((field) => {
          const value = formData[field.id] || '';
          const error = fieldErrors[field.id];
          const showError = !!error;

          return (
            <div
              key={field.id}
              className={field.fullWidth ? 'md:col-span-3' : 'md:col-span-1'}
            >
              <FormControl fullWidth size='small' required={field.required}>
                <label
                  htmlFor={field.id}
                  className='text-sm font-semibold text-[#2C3E50] mb-1 block'
                >
                  {field.label}
                  {field.required && <span className='text-red-500'> *</span>}
                </label>
                <div className='relative'>
                  {['text', 'email', 'number'].includes(field.type) && (
                    <TextField
                      id={field.id}
                      type={field.type}
                      value={value}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      placeholder={field.placeholder || `Enter ${field.label}`}
                      fullWidth
                      required={field.required}
                      InputProps={{
                        sx: {
                          ...commonStyles,
                          ...(showError ? errorStyles : {}),
                          '& .MuiInputBase-input::placeholder': {
                            color: '#7D98B6',
                            opacity: 1,
                          },
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
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      placeholder={field.placeholder || `Enter ${field.label}`}
                      required={field.required}
                      multiline
                      minRows={4}
                      maxRows={4}
                      fullWidth
                      InputProps={{
                        sx: {
                          ...commonStyles,
                          height: 'auto',
                          padding: '0 !important',
                          ...(showError ? errorStyles : {}),
                          '& .MuiInputBase-input::placeholder': {
                            color: '#7D98B6',
                            opacity: 1,
                          },
                        },
                      }}
                      inputProps={{
                        style: {
                          fontSize: 13,
                          textAlign: 'left',
                          padding: '6px 12px',
                          lineHeight: '1.4',
                          resize: 'none',
                        },
                      }}
                    />
                  )}

                  {field.type === 'select' && (
                    <Select
                      id={field.id}
                      value={value}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      displayEmpty
                      fullWidth
                      MenuProps={{
                        anchorOrigin: {
                          vertical: 'bottom',
                          horizontal: 'left',
                        },
                        transformOrigin: {
                          vertical: 'top',
                          horizontal: 'left',
                        },
                        PaperProps: {
                          sx: {
                            mt: 0.5,
                            borderRadius: '4px',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
                            minHeight: '180px',
                            maxHeight: '250px',
                            overflowY: 'auto',
                            '& .MuiMenuItem-root': {
                              fontSize: '13px',
                              color: '#425A76',
                              padding: '6px 12px',
                              fontWeight: 500,
                            },
                          },
                        },
                      }}
                      sx={{
                        ...commonStyles,
                        ...(showError ? errorStyles : {}),
                        '.MuiSelect-select': {
                          padding: '6px 12px',
                          fontSize: '13px',
                          color: value === '' ? '#7D98B6' : '#425A76',
                          fontWeight: 500,
                        },
                        '& svg': { color: '#7D98B6' },
                      }}
                    >
                      <MenuItem value=''>{`Choose ${field.label}`}</MenuItem>
                      {field.options?.map((option) => (
                        <MenuItem
                          key={`${field.id}-${option.value}`}
                          value={option.value}
                        >
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                </div>
                {showError && (
                  <p className='mt-1 text-xs text-red-500'>{error}</p>
                )}
              </FormControl>
            </div>
          );
        })}
      </div>
    </form>
  );
};
