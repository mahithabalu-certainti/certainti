import React, { useEffect, useState } from 'react';
import { TextField, Box, Tooltip, Popover } from '@mui/material';
import TextButton from '../button/text-button';
import {
  ModalField,
  ModalFormData,
  ModalFormErrors,
  ModalDialogProps,
  ModalFormValue,
} from './types';
import { ErrorInfoIcon } from '../../assets';

const ModalDialog: React.FC<ModalDialogProps> = ({
  open,
  fields,
  anchorEl,
  onClose,
  onSubmit,
  loading = false,
  skillTypeIsOthers = false,
  skillSubtypeIsOthers = false,
  initialValues,
}) => {
  const [formData, setFormData] = useState<ModalFormData>({});
  const [errors, setErrors] = useState<ModalFormErrors>({});

  useEffect(() => {
    if (open) {
      setFormData(initialValues || {});
    }
  }, [open, initialValues]);

  // Determine which fields to show based on the scenario
  const getVisibleFields = (): ModalField[] => {
    if (fields.length <= 2) {
      // For skill type/subtype modal, filter based on scenarios
      const skillTypeField = fields.find((f) => f.id === 'skill_type_others');
      const skillSubtypeField = fields.find(
        (f) => f.id === 'skill_subtype_others'
      );

      if (skillTypeField && skillSubtypeField) {
        const visibleFields: ModalField[] = [];

        // Scenario 1: Both are "others" - show both fields
        if (skillTypeIsOthers && skillSubtypeIsOthers) {
          visibleFields.push(skillTypeField, skillSubtypeField);
        }
        // Scenario 2: Only skill type is "others" - show only skill type field
        else if (skillTypeIsOthers && !skillSubtypeIsOthers) {
          visibleFields.push(skillTypeField);
        }
        // Scenario 3: Only skill subtype is "others" - show only skill subtype field
        else if (!skillTypeIsOthers && skillSubtypeIsOthers) {
          visibleFields.push(skillSubtypeField);
        }

        return visibleFields;
      }
    }

    // For other modals (like classification, industry), show all fields
    return fields;
  };

  const visibleFields = getVisibleFields();

  const handleChange = (fieldId: string, value: ModalFormValue): void => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => ({ ...prev, [fieldId]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ModalFormErrors = {};

    for (const field of visibleFields) {
      const value = formData[field.id];

      if (field.required && (!value || value === '')) {
        newErrors[field.id] = 'This field is required';
        continue;
      }

      if (field.validation && value) {
        for (const validation of field.validation) {
          if (!validation.regex.test(String(value))) {
            newErrors[field.id] = validation.errorMessage;
            break;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (): void => {
    if (validateForm()) {
      // Only submit data for visible fields
      const submitData: ModalFormData = {};
      visibleFields.forEach((field) => {
        if (formData[field.id] !== undefined && formData[field.id] !== '') {
          submitData[field.id] = formData[field.id];
        }
      });

      onSubmit(submitData);
    }
  };

  const handleClose = (): void => {
    setFormData({});
    setErrors({});
    onClose();
  };

  const getInputType = (fieldType: string): string => {
    switch (fieldType) {
      case 'number':
        return 'number';
      case 'email':
        return 'email';
      case 'password':
        return 'password';
      default:
        return 'text';
    }
  };

  const getInputValue = (fieldId: string): string => {
    const value = formData[fieldId];
    return value !== undefined ? String(value) : '';
  };

  // Reset form when modal opens/closes or scenarios change
  useEffect(() => {
    if (!open) {
      setFormData({});
      setErrors({});
    }
  }, [open, skillTypeIsOthers, skillSubtypeIsOthers]);

  if (!open) {
    return null;
  }

  return (
    <Popover
      id='table-popover'
      open={open && Boolean(anchorEl)}
      anchorEl={open ? anchorEl : null}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      disableRestoreFocus
      disableAutoFocus
      disableEnforceFocus
      sx={{ pointerEvents: 'none' }}
      PaperProps={{
        sx: {
          width: 300,
          minWidth: 300,
          marginTop: '1px',
          borderRadius: '2px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E5E7EB',
        },
      }}
    >
      <Box sx={{ p: 2, pointerEvents: 'all !important' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {visibleFields.map((field) => {
            const hasError = !!errors[field.id];
            const isTextarea = field.type === 'textarea';

            return (
              <div key={field.id}>
                <Box
                  component='label'
                  htmlFor={`modal-field-${field.id}`}
                  sx={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#374151',
                    mb: 0.5,
                  }}
                >
                  {field.label}
                  {field.required && (
                    <span style={{ color: '#EF4444', marginLeft: '4px' }}>
                      *
                    </span>
                  )}
                </Box>
                <div
                  className={`${isTextarea ? '!h-auto' : '!h-[32px]'} !max-h-[${isTextarea ? 'auto' : '32px'}] relative`}
                >
                  <TextField
                    id={`modal-field-${field.id}`}
                    fullWidth
                    size='small'
                    type={getInputType(field.type)}
                    multiline={isTextarea}
                    rows={isTextarea ? 3 : 1}
                    placeholder={field.placeholder || `Enter ${field.label}`}
                    value={getInputValue(field.id)}
                    error={hasError}
                    onChange={(e) => {
                      const value =
                        field.type === 'number'
                          ? e.target.value === ''
                            ? ''
                            : Number(e.target.value)
                          : e.target.value;
                      handleChange(field.id, value);
                    }}
                    disabled={loading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: isTextarea ? 'auto' : '32px',
                        borderRadius: '2px',
                        '& fieldset': {
                          borderColor: hasError ? '#ef4444' : '#60A5FA',
                        },
                        '&:hover fieldset': {
                          borderColor: hasError ? '#ef4444' : '#60A5FA',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: hasError ? '#ef4444' : '#60A5FA',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: errors[field.id]
                            ? '1px solid #ef4444'
                            : '1px solid #60A5FA',
                        },
                        ...(hasError && {
                          backgroundColor: '#FEF2F2',
                        }),
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '13px',
                      },
                    }}
                  />
                  {hasError && (
                    <Tooltip
                      title={errors[field.id]}
                      arrow
                      placement='top'
                      slotProps={{
                        tooltip: {
                          sx: {
                            backgroundColor: '#FEF2F2',
                            mr: 1,
                          },
                        },
                      }}
                    >
                      <span
                        className={`h-[26px] w-6 flex items-center justify-center absolute ${
                          isTextarea
                            ? '-top-[3px] bg-[#FEF2F2] right-[1px] z-40'
                            : 'top-[3px] right-0'
                        } cursor-pointer`}
                      >
                        <ErrorInfoIcon alt='error' className='w-5 h-3.5' />
                      </span>
                    </Tooltip>
                  )}
                </div>
              </div>
            );
          })}
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            pt: 2,
            gap: 1,
          }}
        >
          <TextButton
            label='Cancel'
            onClick={handleClose}
            disabled={loading}
            sx={{
              minWidth: '75px',
              maxWidth: '75px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
          <TextButton
            label='Save'
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              minWidth: '64px',
              maxWidth: '64px',
              fontSize: '13px',
              fontWeight: 400,
            }}
          />
        </Box>
      </Box>
    </Popover>
  );
};

export default ModalDialog;
