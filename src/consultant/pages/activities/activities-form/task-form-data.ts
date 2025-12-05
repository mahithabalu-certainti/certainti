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
  showFiscalYear: boolean = true,
  permissionMap: Record<string, { read: boolean; edit: boolean }> = {}
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
            disabled: !permissionMap['task_name']?.edit,
            hide:
              !permissionMap['task_name']?.read &&
              !permissionMap['task_name']?.edit,
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
            disabled: !permissionMap['status_rid']?.edit,
            hide:
              !permissionMap['status_rid']?.read &&
              !permissionMap['status_rid']?.edit,
          }),
          createSelectField('priority_rid', 'Priority', {
            options: priorityOptions,
            required: true,
            placeholder: 'Choose Priority',
            disabled: !permissionMap['priority_rid']?.edit,
            hide:
              !permissionMap['priority_rid']?.read &&
              !permissionMap['priority_rid']?.edit,
          }),
          createSelectField('assigned_to', 'Assignee', {
            options: assigneeOptions,
            required: true,
            placeholder: 'Choose Assignee',
            disabled: !permissionMap['assigned_to']?.edit,
            hide:
              !permissionMap['assigned_to']?.read &&
              !permissionMap['assigned_to']?.edit,
          }),
          createDateField('effective_start_datetime', 'Effective Start Date', {
            required: true,
            allowFutureDates: true,
            disabled: !permissionMap['effective_start_datetime']?.edit,
            hide:
              !permissionMap['effective_start_datetime']?.read &&
              !permissionMap['effective_start_datetime']?.edit,
          }),
          createDateField('effective_end_datetime', 'Effective End Date', {
            required: true,
            allowFutureDates: true,
            disabled: !permissionMap['effective_end_datetime']?.edit,
            hide:
              !permissionMap['effective_end_datetime']?.read &&
              !permissionMap['effective_end_datetime']?.edit,
          }),
          createSelectField('fiscal_year', 'Fiscal Year', {
            options: fiscalYears,
            required: true,
            placeholder: 'Choose Fiscal Year',
            isFiscalYear: true,
            disabled: !permissionMap['fiscal_year']?.edit,
            hide:
              !showFiscalYear ||
              (!permissionMap['fiscal_year']?.read &&
                !permissionMap['fiscal_year']?.edit),
          }),
          createSelectField('checklist_template_rid', 'Checklist Template', {
            options: checklistOptions,
            required: false,
            placeholder: 'Choose Checklist Template',
            disabled: !permissionMap['checklists']?.edit,
            hide:
              !permissionMap['checklists']?.read &&
              !permissionMap['checklists']?.edit,
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
            disabled: !permissionMap['description']?.edit,
            hide:
              !permissionMap['description']?.read &&
              !permissionMap['description']?.edit,
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
      permissionMap,
    ]
  );
};
