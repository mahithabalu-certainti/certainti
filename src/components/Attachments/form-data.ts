import { useMemo } from 'react';
import { FormType, SelectOption } from '../../consultant/types';
import {
  createSelectField,
  createTextAreaField,
  createTextField,
  REGEX_PATTERNS,
} from '../../common-utils';

export const AttachmentFormData = (
  fiscalYears: SelectOption[],
  categoryOptions: SelectOption[],
  docTypeOptions: SelectOption[],
  docTypeLoading?: boolean,
  showCategoryOthersField?: boolean,
  showTypeOthersField?: boolean,
  projectFiscalYear?: number | string
  //   permissionMap?: Record<string, { read: boolean; edit: boolean }>
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Document Info',
        fillType: 'half',
        fields: [
          createSelectField('fiscal_year', 'Fiscal Year', {
            options: fiscalYears,
            placeholder: 'Choose Fiscal Year',
            required: true,
            hide: projectFiscalYear ? true : false,
            isFiscalYear: true,
          }),
          createSelectField('document_category_rid', 'Document Category', {
            options: categoryOptions,
            placeholder: 'Choose Document Category',
            required: true,
            onChange: true,
            resetDependsFields: [
              'document_category_others',
              'document_type_rid',
              'document_type_others',
            ],
          }),
          createTextField(
            'document_category_others',
            'Document Category-others',
            {
              required: true,
              placeholder: 'Enter Document Category-others',
              hide: !showCategoryOthersField,
              errorHandling: [
                {
                  regex: REGEX_PATTERNS.MIN_3,
                  errorMessage:
                    'Document Category-others must be more than 2 characters long',
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
            }
          ),
          createSelectField('document_type_rid', 'Document Type', {
            options: docTypeOptions,
            placeholder: 'Choose Document Type',
            required: true,
            onChange: true,
            isLoading: docTypeLoading,
            resetDependsFields: ['document_type_others'],
          }),
          createTextField('document_type_others', 'Document Type-others', {
            required: true,
            placeholder: 'Enter Document Type-others',
            hide: !showTypeOthersField,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage:
                  'Document Type-others must be more than 2 characters long',
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
          }),
        ],
      },
      {
        sectionName: '',
        fillType: 'full',
        fields: [
          createTextAreaField('comments', 'Comments', {
            required: false,
            regex: REGEX_PATTERNS.MAX_2000,
            regexErrorMessage: 'Max length exceeded.',
            placeholder: 'Enter Comments',
          }),
        ],
      },
    ],
    [
      categoryOptions,
      docTypeLoading,
      fiscalYears,
      showCategoryOthersField,
      showTypeOthersField,
      docTypeOptions,
      projectFiscalYear,
    ]
  );
};
