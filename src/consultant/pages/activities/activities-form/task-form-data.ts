import { useMemo } from 'react';

import {
    createDateField,
    createSelectField,
    createTextAreaField,
    createTextField,
    REGEX_PATTERNS,
} from '../../../../common-utils';
import { FormType, SelectOption } from '../../../types';

export const TaskFormData = (
    statusOptions: SelectOption[],
    priorityOptions: SelectOption[],
    assigneeOptions: SelectOption[],
    checklistOptions: SelectOption[],
    categoryOptions: SelectOption[],
    fiscalYearOptions: SelectOption[],
    isEditView: boolean,
    showFiscalYear: boolean = true
): FormType[] => {
    return useMemo(
        () => [
            {
                sectionName: 'task_information',
                fillType: 'half',
                fields: [
                    createTextField('task_name', 'Task Name', {
                        required: true,
                        placeholder: 'Enter Task Name',
                        width: '32%',
                        errorHandling: [
                            {
                                regex: /^.{2,255}$/,
                                errorMessage: 'Task Name must be between 2 and 255 characters',
                            },
                        ],
                    }),
                    createSelectField('status_rid', 'Status', {
                        options: statusOptions,
                        required: true,
                        width: '32%',
                        placeholder: 'Select Status',
                    }),
                    createSelectField('priority_rid', 'Priority', {
                        options: priorityOptions,
                        required: true,
                        width: '32%',
                        placeholder: 'Select Priority',
                    }),
                    createSelectField('assigned_to', 'Assignee', {
                        options: assigneeOptions,
                        required: false,
                        width: '32%',
                        placeholder: 'Select Assignee',
                    }),
                    createSelectField('fiscal_year', 'Fiscal Year', {
                        options: fiscalYearOptions,
                        required: false,
                        width: '32%',
                        placeholder: 'Select Fiscal Year',
                        hide: !showFiscalYear, // Hide for project and case
                    }),
                    createDateField('effective_start_datetime', 'Start Date', {
                        required: false,
                    }),
                    createDateField('effective_end_datetime', 'End Date', {
                        required: false,
                        disableFutureDates: false,
                        greaterThan: {
                            key: 'effective_start_datetime',
                            errorMessage: 'End Date must be after Start Date',
                        },
                    }),
                    createSelectField('task_category_rid', 'Category', {
                        options: categoryOptions,
                        required: false,
                        width: '32%',
                        placeholder: 'Select Category',
                    }),
                    createSelectField('checklist_template_rid', 'Checklist Template', {
                        options: checklistOptions,
                        required: false,
                        width: '32%',
                        placeholder: 'Select Checklist Template',
                    }),
                ],
            },
            {
                sectionName: 'task_description',
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
            categoryOptions,
            fiscalYearOptions,
            isEditView,
            showFiscalYear,
        ]
    );
};
