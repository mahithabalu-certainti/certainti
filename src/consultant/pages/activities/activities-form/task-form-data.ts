import { useMemo } from 'react';

import {
  createDateField,
  createSelectField,
  createTextField,
  createTextAreaField,
  getFiscalYears,
  REGEX_PATTERNS,
} from '../../../../common-utils';
import { FormType, SelectOption } from '../../../types';

const minYear = 1950;
const currentYear = new Date().getFullYear();
const fiscalYears = getFiscalYears(currentYear - minYear + 1);

export const TaskFormData = (
  statusOptions: SelectOption[],
  priorityOptions: SelectOption[],
  assigneeOptions: SelectOption[],
  checklistOptions: SelectOption[],
  showFiscalYear: boolean = true
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Task Information',
        fillType: 'half',
        fields: [
          createTextField('task_name', 'Task Name', {
            required: true,
            placeholder: 'Enter Task Name',
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage: 'Task Name must be more than 2 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_250,
                errorMessage: 'Task Name must not exceed 250 characters',
              },
            ],
          }),
          createSelectField('status_rid', 'Status', {
            options: statusOptions,
            required: true,
            placeholder: 'Choose Status',
          }),
          createSelectField('priority_rid', 'Priority', {
            options: priorityOptions,
            required: true,
            placeholder: 'Choose Priority',
          }),
          createSelectField('assigned_to', 'Assignee', {
            options: assigneeOptions,
            required: true,
            placeholder: 'Choose Assignee',
          }),
          createDateField('effective_start_datetime', 'Effective Start Date', {
            required: true,
            allowFutureDates: true,
          }),
          createDateField('effective_end_datetime', 'Effective End Date', {
            required: true,
            allowFutureDates: true,
          }),
          createSelectField('fiscal_year', 'Fiscal Year', {
            options: fiscalYears,
            required: true,
            placeholder: 'Choose Fiscal Year',
            isFiscalYear: true,
            hide: !showFiscalYear,
          }),
          createSelectField('checklist_template_rid', 'Checklist Template', {
            options: checklistOptions,
            required: false,
            placeholder: 'Choose Checklist Template',
          }),
        ],
      },
      {
        sectionName: '',
        fillType: 'full',
        fields: [
          createTextAreaField('task_description', 'Description', {
            required: false,
            placeholder: 'Enter Description',
            regex: REGEX_PATTERNS.MAX_2000,
            regexErrorMessage: 'Description must be within 2000 characters',
          }),
        ],
      },
    ],
    [
      statusOptions,
      priorityOptions,
      assigneeOptions,
      checklistOptions,
      showFiscalYear,
    ]
  );
};
