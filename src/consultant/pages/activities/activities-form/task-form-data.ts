import { useMemo } from 'react';

import {
  createDateField,
  createSelectField,
  createTextField,
  createTextAreaField,
  getFiscalYears,
} from '../../../../common-utils';
import { FormType, SelectOption } from '../../../types';

const currentDate = new Date();
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
            lengthRequired: {
              key: 'task_name',
              minMatchedValue: /^.{1,}$/,
              maxMatchedValue: /^.{0,2000}$/,
              minErrorMessage: 'Field is required',
              maxErrorMessage: 'Maximum 2000 characters allowed',
            },
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
            maxDate: currentDate,
            disableFutureDates: true,
          }),
          createDateField('effective_end_datetime', 'Effective End Date', {
            required: true,
            maxDate: currentDate,
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
          {
            type: 'custom',
            name: 'tags',
            label: 'Tags',
            required: false,
            width: '32%',
          },
        ],
      },
      {
        sectionName: 'Description',
        fillType: 'full',
        fields: [
          createTextAreaField('description', 'Description', {
            placeholder: 'Add a description...',
            required: false,
            regex: /^[\s\S]{0,2000}$/,
            regexErrorMessage: 'Maximum 2000 characters allowed',
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
