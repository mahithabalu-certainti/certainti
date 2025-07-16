import { REGEX_PATTERNS } from '../../common-utils';
import { FieldConfig } from '../../consultant/pages/account-details-sidebar/components/filter/filterType';
import { FormField, SelectOption } from '../../consultant/types';

export interface FieldOptionType {
  fiscalYears: SelectOption[];
  docCategories: SelectOption[];
  docTypes: SelectOption[];
}

const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
  // { option: 'Not-Contains', value: 'not_contains' },
  // { option: 'Is-Empty', value: 'is_empty' },
];

export const getFormFields = (
  fiscalYears: SelectOption[],
  memoizedDocumentCategories: SelectOption[],
  memoizedDocumentTypes: SelectOption[]
): FormField[] => [
  {
    id: 'fiscal_year',
    label: 'Fiscal Year',
    type: 'select',
    required: true,
    placeholder: 'Select Fiscal Year',
    options: fiscalYears,
  },
  {
    id: 'document_category_rid',
    label: 'Document Category',
    type: 'select',
    required: true,
    placeholder: 'Enter Document Category',
    options: memoizedDocumentCategories,
    resetDependsFields: ['document_category_other'],
  },
  {
    id: 'document_category_other',
    label: 'Document Category-other',
    type: 'text',
    hide: true,
    required: true,
    placeholder: 'Enter Document Category-other',
    validation: [
      {
        regex: REGEX_PATTERNS.MIN_3,
        errorMessage:
          'Document Category-other must be more than 2 characters long',
      },
      {
        regex: REGEX_PATTERNS.MAX_255,
        errorMessage: 'Max length exceeded',
      },
      {
        regex: REGEX_PATTERNS.ALLOWED_CHARS_EXTENDED_NAME_REGEX,
        errorMessage:
          "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), and commas (,).",
      },
    ],
  },
  {
    id: 'document_type_rid',
    label: 'Document Type',
    type: 'select',
    required: true,
    placeholder: 'Enter Document Type',
    options: memoizedDocumentTypes,
    resetDependsFields: ['document_type_others'],
  },
  {
    id: 'document_type_others',
    label: 'Document Type-other',
    type: 'text',
    hide: true,
    required: true,
    placeholder: 'Enter Document Type-other',
    validation: [
      {
        regex: REGEX_PATTERNS.MIN_3,
        errorMessage: 'Document Type-other must be more than 2 characters long',
      },
      {
        regex: REGEX_PATTERNS.MAX_255,
        errorMessage: 'Max length exceeded',
      },
      {
        regex: REGEX_PATTERNS.ALLOWED_CHARS_EXTENDED_NAME_REGEX,
        errorMessage:
          "Only allows letters, numbers, spaces, hyphens (-), ampersands (&), periods (.), apostrophes ('), and commas (,).",
      },
    ],
  },
  {
    id: 'comments',
    label: 'Comments',
    type: 'textarea',
    rows: 3,
    fullWidth: true,
    validation: [
      {
        regex: REGEX_PATTERNS.MAX_2000,
        errorMessage: 'Max length exceeded.',
      },
    ],
  },
];

export const getAttachmentsFilterFields = (
  fieldOptions?: FieldOptionType
): FieldConfig[] => {
  const {
    fiscalYears = [],
    docCategories = [],
    docTypes = [],
  } = fieldOptions || {};

  return [
    {
      name: 'Document Name',
      value: 'document_name',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Format',
      value: 'format',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Size',
      value: 'size_in_mb',
      type: 'number',
      operatorOption: textOptions,
    },
    {
      name: 'Fiscal Year',
      value: 'fiscal_year',
      type: 'enum',
      options: fiscalYears.map((y) => ({ option: y.label, value: y.value })),
      operatorOption: textOptions,
    },
    {
      name: 'Document Category',
      value: 'document_category',
      type: 'enum',
      options: docCategories.map((c) => ({ option: c.label, value: c.value })),
      operatorOption: textOptions,
    },
    {
      name: 'Document Type',
      value: 'document_type',
      type: 'enum',
      options: docTypes.map((t) => ({ option: t.label, value: t.value })),
      operatorOption: textOptions,
    },
    {
      name: 'Related Entity',
      value: 'attachment_level',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Related To ID',
      value: 'attach_to',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Related To Name',
      value: 'attached_to',
      type: 'text',
    },
    {
      name: 'Attached By',
      value: 'uploaded_by',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Attached On',
      value: 'created_datetime',
      type: 'date',
    },
    {
      name: 'Attachment ID',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Sort Options',
      value: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'created_datetime_desc', option: 'Recently Created' }],
    },
  ];
};

export const validateField = (
  fieldId: string,
  value: string | string[],
  formFields: FormField[]
): string | null => {
  const field = formFields.find((f) => f.id === fieldId);
  if (!field) return null;

  if (
    !field.required &&
    (!value || (Array.isArray(value) && value.length === 0))
  ) {
    return null;
  }

  if (
    field.required &&
    (!value || (Array.isArray(value) && value.length === 0))
  ) {
    return 'This field is required';
  }

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

export const shouldShowField = (
  field: FormField,
  formData: { [key: string]: string | null },
  formFields: FormField[]
): boolean => {
  if (field.id === 'document_category_other') {
    const categoryField = formFields.find(
      (f) => f.id === 'document_category_rid'
    );
    const selectedOption = categoryField?.options?.find(
      (opt) => opt.value === formData.document_category_rid
    );
    return selectedOption?.label.toLowerCase() === 'others';
  }
  if (field.id === 'document_type_others') {
    const typeField = formFields.find((f) => f.id === 'document_type_rid');
    const selectedOption = typeField?.options?.find(
      (opt) => opt.value === formData.document_type_rid
    );
    return selectedOption?.label.toLowerCase() === 'others';
  }

  return !field.hide;
};
