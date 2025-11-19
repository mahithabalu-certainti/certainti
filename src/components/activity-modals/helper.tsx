import { useMemo } from 'react';
import { FormType } from '../../consultant/types';
import {
  createDateField,
  createSelectField,
  createTextAreaField,
  REGEX_PATTERNS,
} from '../../common-utils';

export const TaskFormData = (): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: '',
        fillType: 'half',
        subSection: true,
        fields: [
          createSelectField('task_type', 'Task Type', {
            options: [],
            placeholder: 'Choose Task Type',
            required: false,
          }),
          createSelectField('related_to', 'Related To', {
            options: [],
            placeholder: 'Choose Related To',
            required: false,
          }),
          createSelectField('status', 'Status', {
            required: false,
            options: [],
            placeholder: 'Choose Status',
          }),
          createSelectField('assigned_to', 'Assigned To', {
            options: [],
            placeholder: 'Choose Assigned To',
            required: false,
          }),
          createDateField('task_due_date', 'Task Due Date', {
            required: false,
            disableFutureDates: true,
          }),
        ],
      },
      {
        sectionName: '',
        fillType: 'full',
        fields: [
          createTextAreaField('task_description', 'Task Description', {
            required: false,
            placeholder: 'Enter Task Description',
            regexErrorMessage:
              'Task Description must be within 2000 characters',
            regex: REGEX_PATTERNS.DESCRIPTION,
          }),
        ],
      },
    ],
    []
  );
};
