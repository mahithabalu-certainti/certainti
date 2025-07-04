/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { ModalField } from './types';

interface ModalDialogProps {
  open: boolean;
  title: string;
  fields: ModalField[];
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void;
  loading?: boolean;
  // Additional props to determine which fields to show
  skillTypeIsOthers?: boolean;
  skillSubtypeIsOthers?: boolean;
}

const ModalDialog: React.FC<ModalDialogProps> = ({
  open,
  title,
  fields,
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
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#2A2A2A',
          borderBottom: '1px solid #E5E7EB',
          pb: 2,
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {visibleFields.map((field) => (
            <Box key={field.id}>
              <Typography
                variant='body2'
                sx={{
                  mb: 1,
                  fontWeight: 500,
                  color: '#374151',
                }}
              >
                {field.label}
                {field.required && (
                  <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>
                )}
              </Typography>

              <TextField
                fullWidth
                size='small'
                type={field.type === 'number' ? 'number' : 'text'}
                multiline={field.type === 'textarea'}
                rows={field.type === 'textarea' ? 3 : 1}
                placeholder={field.placeholder}
                value={formData[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
                error={!!errors[field.id]}
                helperText={errors[field.id]}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                    '& fieldset': {
                      borderColor: '#D1D5DB',
                    },
                    '&:hover fieldset': {
                      borderColor: '#9CA3AF',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3B82F6',
                    },
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '14px',
                  },
                }}
              />
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          borderTop: '1px solid #E5E7EB',
          gap: 1,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            color: '#6B7280',
            borderColor: '#D1D5DB',
            '&:hover': {
              borderColor: '#9CA3AF',
              backgroundColor: '#F9FAFB',
            },
          }}
          variant='outlined'
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          variant='contained'
          sx={{
            backgroundColor: '#3B82F6',
            '&:hover': {
              backgroundColor: '#2563EB',
            },
            '&:disabled': {
              backgroundColor: '#9CA3AF',
            },
          }}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalDialog;
