import { REGEX_PATTERNS } from '../../../../common-utils';

export type EmailFields = 'to' | 'cc' | 'bcc';
export type MeetingFields =
  | 'attendees'
  | 'call_participants'
  | 'caller_id'
  | 'organizer';

export interface ActivityEmailFormData {
  to: string[];
  cc: string[];
  bcc?: string[];
  subject: string;
  emailBody: string;
  attachments: Attachment[];
  rid: string;
  email_rid: string;
  created_on: string;
  created_by: string;
  updated_on: string;
  updated_by: string;
  email_template_rid?: string;
}

export interface ActivityEmailFormErrors {
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  emailBody?: string;
  attachments?: string;
}

export interface Attachment {
  id: string;
  file: File | null;
  name: string;
  size: string;
  url?: string;
  existing?: boolean;
}

export const normalizeQuillValue = (value: string): string => {
  if (!value) return '';

  const cleaned = value
    .replace(/<(.|\n)*?>/g, '') // remove all HTML tags
    .replace(/&nbsp;/g, '') // remove non-breaking spaces
    .trim();

  // If nothing left after cleaning, treat it as empty string
  return cleaned.length === 0 ? '' : value;
};

// Add these to your existing helper file

export const validateActivityEmailForm = (
  formData: ActivityEmailFormData
): { isValid: boolean; errors: ActivityEmailFormErrors } => {
  let isValid = true;
  const newErrors: ActivityEmailFormErrors = {};

  if (!formData.to || formData.to.length === 0) {
    newErrors.to = 'Field is required';
    isValid = false;
  }

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
  }

  if (!normalizeQuillValue(formData.emailBody)) {
    newErrors.emailBody = 'Field is required';
    isValid = false;
  }

  return { isValid, errors: newErrors };
};

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

export const getAutocompleteStyles = (hasError: boolean, isEmpty: boolean) => ({
  height: '25px',
  fontSize: '12px',
  width: '160px',

  '& .MuiOutlinedInput-root': {
    height: '25px !important',
    padding: '0 4px',
    '& fieldset': {
      border: hasError ? '1px solid #ef4444' : '1px solid #CBD6E2',
      borderRadius: '2px',
    },
    '&:hover fieldset': {
      border: hasError ? '1px solid #ef4444' : '1px solid #CBD6E2',
    },
    '&.Mui-focused fieldset': {
      border: '2px solid #60A5FA',
    },
    '&.Mui-focused': {
      boxShadow: 'none',
    },
  },

  '& .MuiInputBase-input': {
    padding: '6px',
    color: isEmpty ? '#7D98B6' : 'black',
    fontSize: '12px',
  },

  '& .MuiSvgIcon-root': {
    color: '#7D98B6',
  },

  '&.Mui-disabled': {
    backgroundColor: '#f3f4f6',
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
