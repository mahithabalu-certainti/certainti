/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Popover, TextField, Box, Tooltip } from '@mui/material';
import TextButton from '../button/text-button';
import { ModalField } from './types';
import { ErrorInfoIcon } from '../../assets';

interface ModalDialogProps {
  open: boolean;
  fields: ModalField[];
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void;
  loading?: boolean;
  skillTypeIsOthers?: boolean;
  skillSubtypeIsOthers?: boolean;
}

const ModalDialog: React.FC<ModalDialogProps> = ({
  open,
  fields,
  anchorEl,
  onClose,
  onSubmit,
  loading = false,
  skillTypeIsOthers = false,
  skillSubtypeIsOthers = false,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Determine which fields to show based on the scenario
  const getVisibleFields = () => {
    if (fields.length <= 2) {
      // For skill type/subtype modal, filter based on scenarios
      const skillTypeField = fields.find((f) => f.id === 'skill_type_others');
      const skillSubtypeField = fields.find(
        (f) => f.id === 'skill_subtype_others'
      );

      if (skillTypeField && skillSubtypeField) {
        const visibleFields = [];

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

  const handleChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => ({ ...prev, [fieldId]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

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

  const handleSubmit = () => {
    if (validateForm()) {
      // Only submit data for visible fields
      const submitData: Record<string, any> = {};
      visibleFields.forEach((field) => {
        if (formData[field.id]) {
          submitData[field.id] = formData[field.id];
        }
      });

      onSubmit(submitData);
      setFormData({});
      setErrors({});
    }
  };

  const handleClose = () => {
    setFormData({});
    setErrors({});
    onClose();
  };

  // Reset form when modal opens/closes or scenarios change
  useEffect(() => {
    if (!open) {
      setFormData({});
      setErrors({});
    }
  }, [open, skillTypeIsOthers, skillSubtypeIsOthers]);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
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
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {visibleFields.map((field) => {
            return (
              <div className='!h-[32px] !max-h-[32px] relative'>
                <TextField
                  key={field.id}
                  fullWidth
                  size='small'
                  type={field.type === 'number' ? 'number' : 'text'}
                  multiline={field.type === 'textarea'}
                  rows={field.type === 'textarea' ? 3 : 1}
                  placeholder={`Enter ${field.label}`}
                  value={formData[field.id] || ''}
                  error={!!errors[field.id]}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '32px',
                      borderRadius: '2px',
                      '& fieldset': {
                        borderColor: '#60A5FA',
                      },
                      '&:hover fieldset': {
                        borderColor: '#60A5FA',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#60A5FA',
                      },
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '13px',
                    },
                  }}
                />
                {errors[field.id] && (
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
                      className={`h-[26px] w-6 flex items-center justify-center absolute ${field?.type === 'textarea' ? '-top-[3px] bg-[#FEF2F2] right-[1px] z-40' : 'top-[3px] right-0'} cursor-pointer`}
                    >
                      <ErrorInfoIcon alt='error' className='w-5 h-3.5' />
                    </span>
                  </Tooltip>
                )}
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
            label={'Save'}
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
