import { useMemo } from 'react';
import { FormType } from '../../../types';
import {
  createSelectField,
  createTextAreaField,
  createTextField,
  REGEX_PATTERNS,
} from '../../../../common-utils';

export const NotesFormData = (
  isEditView: boolean,
  fiscalYears: { label: string; value: string }[],
  userListOptions: { value: string; label: string }[],
  projectFiscalYear?: boolean,
  disableFiscalYear?: boolean,
  isFromGlobalNotes?: boolean,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
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
            hide:
              isEditView &&
              !permissionMap?.['title']?.read &&
              !permissionMap?.['title']?.edit,
            disabled:
              isEditView &&
              permissionMap?.['title']?.read &&
              !permissionMap?.['title']?.edit,
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
          createSelectField('notes_owner', 'Note Owner', {
            options: userListOptions,
            placeholder: 'Choose Note Owner',
            required: true,
            hide:
              isEditView &&
              !permissionMap?.['notes_owner']?.read &&
              !permissionMap?.['notes_owner']?.edit,
            disabled:
              isEditView &&
              permissionMap?.['notes_owner']?.read &&
              !permissionMap?.['notes_owner']?.edit,
          }),
          createTextField('related_to', 'Related Entity', {
            required: false,
            placeholder: 'Enter Related Entity',
            disabled: true,
            hide:
              !isFromGlobalNotes ||
              (isFromGlobalNotes &&
                isEditView &&
                !permissionMap?.['attached_to']?.read &&
                !permissionMap?.['attached_to']?.edit),
          }),
          createTextField('related_to_name', 'Related To Name', {
            required: false,
            placeholder: 'Enter Related To Name',
            disabled: true,
            hide:
              !isFromGlobalNotes ||
              (isFromGlobalNotes &&
                isEditView &&
                !permissionMap?.['attached_to']?.read &&
                !permissionMap?.['attached_to']?.edit),
          }),
          createSelectField('fiscal_year', 'Fiscal Year', {
            options: fiscalYears,
            placeholder: 'Choose Fiscal Year',
            required: true,
            hide:
              disableFiscalYear ||
              projectFiscalYear ||
              (isEditView &&
                !permissionMap?.['fiscal_year']?.read &&
                !permissionMap?.['fiscal_year']?.edit),
            disabled:
              disableFiscalYear ||
              (isEditView &&
                permissionMap?.['fiscal_year']?.read &&
                !permissionMap?.['fiscal_year']?.edit),
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
            hide:
              isEditView &&
              !permissionMap?.['descriptions']?.read &&
              !permissionMap?.['descriptions']?.edit,
            disabled:
              isEditView &&
              permissionMap?.['descriptions']?.read &&
              !permissionMap?.['descriptions']?.edit,
          }),
        ],
      },
    ],
    [
      disableFiscalYear,
      fiscalYears,
      isEditView,
      isFromGlobalNotes,
      permissionMap,
      projectFiscalYear,
      userListOptions,
    ]
  );
};
