import { REGEX_PATTERNS } from '../../../../common-utils';
import {
  EmailTemplateDetails,
  EmailTemplateFormData,
  EmailTemplateFormErrors,
  EmailTemplateFormPayload,
} from '../../../types';

export const COMMON_SELECT_STYLES = {
  height: '32px',
  fontSize: '13px',
  padding: '6px 4px',
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    border: '2px solid #60A5FA',
  },
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused': { boxShadow: 'none' },
  },
  '.MuiSelect-select': {
    padding: '6px 6px',
  },
  '&.Mui-disabled': { backgroundColor: '#f3f4f6' },
  '& .MuiOutlinedInput-notchedOutline': {
    borderRadius: '2px',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    border: '1px solid #CBD6E2',
  },
  '& .MuiSvgIcon-root': {
    color: '#7D98B6',
  },
};

export const COMMON_MENU_PROPS = {
  PaperProps: {
    sx: {
      maxWidth: 300,
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
};

export const normalizeQuillValue = (value: string): string => {
  if (!value) return '';

  const cleaned = value
    .replace(/<(.|\n)*?>/g, '') // remove all HTML tags
    .replace(/&nbsp;/g, '') // remove non-breaking spaces
    .trim();

  // If nothing left after cleaning, treat it as empty string
  return cleaned.length === 0 ? '' : value;
};

export const validateEmailTemplateForm = (
  formData: EmailTemplateFormData
): { isValid: boolean; errors: EmailTemplateFormErrors } => {
  let isValid = true;
  const newErrors: EmailTemplateFormErrors = {};

  //Template Name
  if (!formData.templateName.trim()) {
    newErrors.templateName = 'Field is required';
    isValid = false;
  } else if (!REGEX_PATTERNS.MIN_3.test(formData.templateName)) {
    newErrors.templateName =
      'Template Name must be more than 2 characters long';
    isValid = false;
  } else if (!REGEX_PATTERNS.MAX_64.test(formData.templateName)) {
    newErrors.templateName = 'Template Name must not exceed 64 characters';
    isValid = false;
  } else if (!REGEX_PATTERNS.TEMPLATE_NAME_REGEX.test(formData.templateName)) {
    newErrors.templateName =
      "Template Name must contain only letters, numbers, spaces, apostrophes('), and hyphens(-).";
    isValid = false;
  }

  //Subject
  const subject = formData.subject.trim();

  if (!subject) {
    newErrors.subject = 'Field is required';
    isValid = false;
  } else if (!REGEX_PATTERNS.MIN_3.test(subject)) {
    newErrors.subject = 'Subject must be at least 3 characters long';
    isValid = false;
  } else if (!REGEX_PATTERNS.MAX_125.test(subject)) {
    newErrors.subject = 'Subject must not exceed 125 characters';
    isValid = false;
  } else if (!REGEX_PATTERNS.EMAIL_SUBJECT.test(subject)) {
    newErrors.subject =
      "Subject only letters, numbers, spaces, &, -, ., ', and , are allowed.";
    isValid = false;
  }

  //Description
  if (!REGEX_PATTERNS.MAX_2000.test(formData.description)) {
    newErrors.description = 'Description must be within 2000 characters';
    isValid = false;
  }

  //Email Body
  if (!formData.emailBody.trim()) {
    newErrors.emailBody = 'Field is required';
    isValid = false;
  }

  //Status
  if (!formData.status) {
    newErrors.status = 'Field is required';
    isValid = false;
  }

  //Category
  if (!formData.category) {
    newErrors.category = 'Field is required';
    isValid = false;
  }

  return { isValid, errors: newErrors };
};

export const transformEmailTemplatePayload = (
  formData: EmailTemplateFormData,
  isEditView: boolean = false,
  originalData?: EmailTemplateDetails
): EmailTemplateFormPayload => {
  const payload: EmailTemplateFormPayload = {
    template_name: formData.templateName,
    status_rid: formData.status,
    category_rid: formData.category,
    subject: formData.subject,
    description: formData.description,
    body_html: formData.emailBody,
  };

  if (isEditView && originalData) {
    return {
      ...payload,
      email_template_rid: originalData.email_template_rid,
    };
  }

  return payload;
};

export const getSelectStyles = (hasError: boolean, isEmpty: boolean) => ({
  ...COMMON_SELECT_STYLES,
  '.MuiSelect-select': {
    ...COMMON_SELECT_STYLES['.MuiSelect-select'],
    color: isEmpty ? '#7D98B6' : 'black',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: hasError ? '1px solid #ef4444' : '1px solid #CBD6E2',
    borderRadius: '2px',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    border: hasError ? '1px solid #ef4444' : '1px solid #CBD6E2',
  },
});

export const shouldHideField = (
  fieldName: string,
  isEditView: boolean,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): boolean => {
  if (!permissionMap || !permissionMap[fieldName]) {
    return false;
  }

  const fieldPermissions = permissionMap[fieldName];
  if (isEditView) {
    return !fieldPermissions.read && !fieldPermissions.edit;
  }
  return false;
};

export const shouldDisableField = (
  fieldName: string,
  isEditView: boolean,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): boolean => {
  if (!permissionMap || !permissionMap[fieldName]) {
    return false;
  }

  const fieldPermissions = permissionMap[fieldName];
  if (isEditView) {
    return fieldPermissions.read && !fieldPermissions.edit;
  }
  return false;
};
