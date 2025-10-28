import { REGEX_PATTERNS } from '../../../../common-utils';
import {
  EmailTemplateDetails,
  EmailTemplateFormData,
  EmailTemplateFormErrors,
  EmailTemplateFormPayload,
} from '../../../types';

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
  if (!formData.subject.trim()) {
    newErrors.subject = 'Field is required';
    isValid = false;
  }

  //Description
  if (!formData.description.trim()) {
    newErrors.description = 'Field is required';
    isValid = false;
  } else if (!REGEX_PATTERNS.MAX_2000.test(formData.description)) {
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
    subject: formData.subject,
    description: formData.description,
    email_body: formData.emailBody,
  };

  if (isEditView && originalData) {
    return {
      ...payload,
      template_rid: originalData.template_rid,
    };
  }

  return payload;
};
