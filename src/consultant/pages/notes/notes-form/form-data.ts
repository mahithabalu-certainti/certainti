import { useMemo } from 'react';
import { FormType } from '../../../types';
import {
  createSelectField,
  createTextAreaField,
  createTextField,
  REGEX_PATTERNS,
} from '../../../../common-utils';

export const NotesFormData = (
  fiscalYears: { label: string; value: string }[],
  projectFiscalYear?: boolean,
  disableFiscalYear?: boolean,
  isFromGlobalNotes?: boolean
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        fields: [
          createTextField('title', 'Title', {
            required: true,
            placeholder: 'Enter Title',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage: 'Title must be at least 3 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_64,
                errorMessage: 'Title must not exceed 64 characters',
              },
              {
                regex: REGEX_PATTERNS.TEMPLATE_NAME_REGEX,
                errorMessage:
                  "Title must contain only letters, numbers, spaces, apostrophes('), and hyphens(-).",
              },
            ],
          }),
          createTextField('notes_owner', 'Note Owner', {
            required: true,
            placeholder: 'Enter Note Owner',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage: 'Note Owner must be at least 3 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_64,
                errorMessage: 'Note Owner must not exceed 64 characters',
              },
              {
                regex: REGEX_PATTERNS.NAME_REGEX,
                errorMessage:
                  "Note Owner must contain only letters, space( ), apostrophes(') and hyphens(-).",
              },
            ],
          }),
          createTextField('related_to', 'Related Entity', {
            required: false,
            placeholder: 'Enter Related Entity',
            disabled: true,
            hide: !isFromGlobalNotes,
          }),
          createTextField('related_to_name', 'Related To Name', {
            required: false,
            placeholder: 'Enter Related To Name',
            disabled: true,
            hide: !isFromGlobalNotes,
          }),
          createSelectField('fiscal_year', 'Fiscal Year', {
            options: fiscalYears,
            placeholder: 'Choose Fiscal Year',
            required: true,
            hide: disableFiscalYear || projectFiscalYear ? true : false,
            disabled: disableFiscalYear,
            isFiscalYear: true,
          }),
        ],
      },
      {
        sectionName: '',
        fillType: 'full',
        fields: [
          createTextAreaField('descriptions', 'Note Description', {
            required: false,
            placeholder: 'Enter Note Description',
            regex: REGEX_PATTERNS.MAX_2000,
            regexErrorMessage:
              'Note Description must not exceed 2000 characters.',
          }),
        ],
      },
    ],
    [disableFiscalYear, fiscalYears, isFromGlobalNotes, projectFiscalYear]
  );
};
