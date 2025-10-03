import { useMemo } from 'react';
import { FormType } from '../../../types';
import {
  createTextAreaField,
  createTextField,
  REGEX_PATTERNS,
} from '../../../../common-utils';

export const NotesFormData = (isEditView: boolean): FormType[] => {
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
          createTextField('note_owner', 'Note Owner', {
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
        ],
      },
      {
        sectionName: 'Note Description',
        fillType: 'full',
        fields: [
          createTextAreaField('note_description', 'Note Description', {
            required: true,
            placeholder: 'Enter Note Description',
            regex: REGEX_PATTERNS.MAX_2000,
            regexErrorMessage: 'Max length exceeded.',
          }),
        ],
      },
      {
        sectionName: 'Audit Information',
        fillType: 'half',
        hide: !isEditView,
        fields: [
          createTextField('rid', 'Record ID', {
            required: false,
            disabled: true,
            hide: !isEditView,
          }),
          createTextField('created_on', 'Created On', {
            required: false,
            disabled: true,
            hide: !isEditView,
          }),
          createTextField('created_by', 'Created By', {
            required: false,
            disabled: true,
            hide: !isEditView,
          }),
          createTextField('r_number', 'Note ID', {
            required: false,
            disabled: true,
            hide: !isEditView,
          }),
          createTextField('updated_on', 'Updated On', {
            required: false,
            disabled: true,
            hide: !isEditView,
          }),
          createTextField('updated_by', 'Updated By', {
            required: false,
            disabled: true,
            hide: !isEditView,
          }),
        ],
      },
    ],
    [isEditView]
  );
};
