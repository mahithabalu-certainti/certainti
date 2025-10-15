import { useMemo } from 'react';
import {
  FormFiscalDateType,
  FormType,
  SelectOption,
} from '../../../../../types';
import {
  createAutoCompleteField,
  createDateField,
  createSelectField,
  createTextAreaField,
  createTextField,
  PROJECT_TASK_REGEX,
} from '../../../../../../common-utils';

// 1. Extract date constants
const DATE_CONFIG = {
  FISCAL_YEARS_RANGE: 6,
  MIN_YEARS_BACK: 6,
} as const;

// 2. Extract fiscal years calculation
const getFiscalYears = (range: number) => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: range }, (_, i) => {
    const year = currentYear - i;
    return { label: `FY-${year}`, value: String(year) };
  });
};

export const fiscalYears = getFiscalYears(DATE_CONFIG.FISCAL_YEARS_RANGE);

export const ProjectTaskFormData = (
  memoizedProjectResourceCode: SelectOption[],
  memoizedProjectResourceType: SelectOption[],
  memoizedProjectResourceClassification: SelectOption[],
  isEditView?: boolean,
  fiscalDate?: FormFiscalDateType,
  permissionMapTaskForm?: Record<string, { read: boolean; edit: boolean }>
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Basic Information',
        fillType: 'half',
        hide:
          isEditView &&
          !permissionMapTaskForm?.['resource_code']?.read &&
          !permissionMapTaskForm?.['resource_code']?.edit,
        fields: [
          createAutoCompleteField(
            'project_resource_rid',
            'Project Resource Code',
            {
              options: memoizedProjectResourceCode,
              required: true,
              onChange: true,
              showCreateBtn: true,
              placeholder: 'Choose Project Resource Code',
              disabled:
                isEditView &&
                permissionMapTaskForm?.['resource_code']?.read &&
                !permissionMapTaskForm?.['resource_code']?.edit,
              hide:
                isEditView &&
                !permissionMapTaskForm?.['resource_code']?.read &&
                !permissionMapTaskForm?.['resource_code']?.edit,
            }
          ),
          createTextField('task_name', 'Task Name', {
            required: false,
            placeholder: 'Enter Task Name',
            hide:
              isEditView &&
              !permissionMapTaskForm?.['task_name']?.read &&
              !permissionMapTaskForm?.['task_name']?.edit,
            disabled:
              isEditView &&
              permissionMapTaskForm?.['task_name']?.read &&
              !permissionMapTaskForm?.['task_name']?.edit,
          }),
          createSelectField('task_type_rid', 'Task Type', {
            required: false,
            width: '140px',
            placeholder: 'Choose Task Type',
            options: memoizedProjectResourceType,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['task_type_rid']?.read &&
              !permissionMapTaskForm?.['task_type_rid']?.edit,
            disabled:
              isEditView &&
              permissionMapTaskForm?.['task_type_rid']?.read &&
              !permissionMapTaskForm?.['task_type_rid']?.edit,
          }),
          createSelectField('task_classification_rid', 'Classification Type', {
            required: false,
            width: '140px',
            placeholder: 'Choose Classification Type',
            options: memoizedProjectResourceClassification,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['task_classification_rid']?.read &&
              !permissionMapTaskForm?.['task_classification_rid']?.edit,
            disabled:
              isEditView &&
              permissionMapTaskForm?.['task_classification_rid']?.read &&
              !permissionMapTaskForm?.['task_classification_rid']?.edit,
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
            regexErrorMessage: 'Maximum 2000 characters allowed',
            regex: PROJECT_TASK_REGEX.DESCRIPTION,
            // disabled:
            //   isEditView &&
            //   permissionMapTaskForm?.['comments']?.read &&
            //   !permissionMapTaskForm?.['comments']?.edit,
            // hide:
            //   isEditView &&
            //   !permissionMapTaskForm?.['comments']?.read &&
            //   !permissionMapTaskForm?.['comments']?.edit,
          }),
        ],
      },
      {
        sectionName: 'Task Details',
        fillType: 'half',
        fields: [
          createDateField('start_date', 'Start Date', {
            required: true,
            minDate: fiscalDate?.startMin,
            maxDate: fiscalDate?.startMax,
            disableFutureDates: true,
            clearDate: 'project_resource_rid',
            disabled:
              isEditView &&
              permissionMapTaskForm?.['start_date']?.read &&
              !permissionMapTaskForm?.['start_date']?.edit,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['start_date']?.read &&
              !permissionMapTaskForm?.['start_date']?.edit,
          }),
          createDateField('end_date', 'End Date', {
            required: true,
            minDate: fiscalDate?.startMin,
            maxDate: fiscalDate?.endMax,
            clearDate: 'project_resource_rid',
            disabled:
              isEditView &&
              permissionMapTaskForm?.['end_date']?.read &&
              !permissionMapTaskForm?.['end_date']?.edit,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['end_date']?.read &&
              !permissionMapTaskForm?.['end_date']?.edit,
          }),
          createTextField('total_cost_pro_task', 'Cost', {
            required: false,
            regex: PROJECT_TASK_REGEX.COST_REGEX,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            placeholder: 'Enter Cost',
            formatCostValue: true,
            disabled:
              isEditView &&
              permissionMapTaskForm?.['total_cost_pro_task']?.read &&
              !permissionMapTaskForm?.['total_cost_pro_task']?.edit,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['total_cost_pro_task']?.read &&
              !permissionMapTaskForm?.['total_cost_pro_task']?.edit,
          }),
          createTextField('total_hours_pro_task', 'Effort', {
            required: false,
            regex: PROJECT_TASK_REGEX.EFFORT,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            placeholder: 'Enter Effort',
            formatCostValue: true,
            disabled:
              isEditView &&
              permissionMapTaskForm?.['total_hours_pro_task']?.read &&
              !permissionMapTaskForm?.['total_hours_pro_task']?.edit,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['total_hours_pro_task']?.read &&
              !permissionMapTaskForm?.['total_hours_pro_task']?.edit,
          }),
        ],
      },
      {
        sectionName: 'Comments',
        fillType: 'full',
        fields: [
          createTextAreaField('comments', 'Comments', {
            required: false,
            placeholder: 'Enter Comments',
            regexErrorMessage: 'Maximum 2000 characters allowed',
            regex: PROJECT_TASK_REGEX.DESCRIPTION,
            disabled:
              isEditView &&
              permissionMapTaskForm?.['comments']?.read &&
              !permissionMapTaskForm?.['comments']?.edit,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['comments']?.read &&
              !permissionMapTaskForm?.['comments']?.edit,
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
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['rid']?.read &&
              !permissionMapTaskForm?.['rid']?.edit,
          }),
          createTextField('created_datetime', 'Created On', {
            required: false,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['created_datetime']?.read &&
              !permissionMapTaskForm?.['created_datetime']?.edit,
          }),
          createTextField('created_by', 'Created By', {
            required: false,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['created_by']?.read &&
              !permissionMapTaskForm?.['created_by']?.edit,
          }),
          createTextField('r_number', 'Project Task ID', {
            required: false,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['r_number']?.read &&
              !permissionMapTaskForm?.['r_number']?.edit,
          }),
          createTextField('modified_datetime', 'Updated On', {
            required: false,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['modified_datetime']?.read &&
              !permissionMapTaskForm?.['modified_datetime']?.edit,
          }),
          createTextField('modified_by', 'Updated By', {
            required: false,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMapTaskForm?.['modified_by']?.read &&
              !permissionMapTaskForm?.['modified_by']?.edit,
          }),
        ],
      },
    ],
    [
      fiscalDate?.endMax,
      fiscalDate?.startMax,
      fiscalDate?.startMin,
      isEditView,
      memoizedProjectResourceCode,
      permissionMapTaskForm,
      memoizedProjectResourceType,
      memoizedProjectResourceClassification,
    ]
  );
};
