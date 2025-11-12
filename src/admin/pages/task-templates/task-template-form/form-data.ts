import { useMemo } from 'react';
import { FormType, SelectOption } from '../../../../consultant/types';
import {
  createSelectField,
  createTextAreaField,
  createTextField,
  REGEX_PATTERNS,
} from '../../../../common-utils';

export const TaskTemplateFormFieldsData = (
  isEditView: boolean,
  taskTemplateTypesOptions: SelectOption[],
  taskMilestoneTypesOptions: SelectOption[],
  taskPrioritytTypesTypesOptions: SelectOption[],
  taskCheckListTypesTypesOptions: SelectOption[],
  taskAssignRoleTypesTypesOptions: SelectOption[],
  statusOptions: SelectOption[],
  taskType: boolean
  // permissionMap: Record<string, { read: boolean; edit: boolean }>,
): FormType[] => {
  return useMemo(
    () => [
      {
        sectionName: 'Task Template Information',
        fillType: 'half',
        fields: [
          createTextField('task_name', 'Task Name', {
            required: true,
            placeholder: 'Enter Task Name',
            // disabled:
            //   isEditView &&
            //   !permissionMap?.['task_name']?.edit &&
            //   permissionMap?.['task_name']?.read,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['task_name']?.edit &&
            //   !permissionMap?.['task_name']?.read,
          }),
          createSelectField('task_type_rid', 'Task Type', {
            options: taskTemplateTypesOptions || [],
            placeholder: 'Choose Task Type',
            required: true,
            onChange: true,
            // disabled:
            //   isEditView &&
            //   !permissionMap?.['task_type_rid']?.edit &&
            //   permissionMap?.['task_type_rid']?.read,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['task_type_rid']?.edit &&
            //   !permissionMap?.['task_type_rid']?.read,
          }),
          createSelectField('milestone_template_rid', 'Milestone Type', {
            options: taskMilestoneTypesOptions || [],
            placeholder: 'Choose Milestone Type',
            required: true,
            hide: taskType,
            // disabled:
            //   isEditView &&
            //   !permissionMap?.['task_type_rid']?.edit &&
            //   permissionMap?.['task_type_rid']?.read,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['task_type_rid']?.edit &&
            //   !permissionMap?.['task_type_rid']?.read,
          }),
          createSelectField('case_team_member_role_rid', 'Assing Role', {
            options: taskAssignRoleTypesTypesOptions || [],
            placeholder: 'Choose Assing Role',
            required: false,
            hide: taskType,
            // disabled:
            //   isEditView &&
            //   !permissionMap?.['task_type_rid']?.edit &&
            //   permissionMap?.['task_type_rid']?.read,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['task_type_rid']?.edit &&
            //   !permissionMap?.['task_type_rid']?.read,
          }),
          createTextField('effort_in_days', 'Efforts In Days', {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            // regexErrorMessage:
            //   'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            placeholder: 'Enter Efforts In Days',
            required: true,
            onChange: true,
            formatCostValue: true,
            hide: taskType,
            // disabled:
            //   isEditView &&
            //   permissionMap?.['efforts']?.read &&
            //   !permissionMap?.['efforts']?.edit,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['efforts']?.read &&
            //   !permissionMap?.['efforts']?.edit,
          }),
          createTextField('reminder_interval', 'Reminder Interval', {
            // regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            // regexErrorMessage:
            //   'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            placeholder: 'Enter Reminder Interval',
            required: false,
            onChange: true,
            formatCostValue: true,
            // disabled:
            //   isEditView &&
            //   permissionMap?.['efforts']?.read &&
            //   !permissionMap?.['efforts']?.edit,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['efforts']?.read &&
            //   !permissionMap?.['efforts']?.edit,
          }),
          createSelectField('priority_rid', 'Priority', {
            options: taskPrioritytTypesTypesOptions || [],
            placeholder: 'Choose Priority Type',
            required: false,
            // disabled:
            //   isEditView &&
            //   !permissionMap?.['task_type_rid']?.edit &&
            //   permissionMap?.['task_type_rid']?.read,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['task_type_rid']?.edit &&
            //   !permissionMap?.['task_type_rid']?.read,
          }),
          createSelectField('checklist_template_rid', 'Checklist', {
            options: taskCheckListTypesTypesOptions || [],
            placeholder: 'Choose Checklist Type',
            required: false,
            // disabled:
            //   isEditView &&
            //   !permissionMap?.['task_type_rid']?.edit &&
            //   permissionMap?.['task_type_rid']?.read,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['task_type_rid']?.edit &&
            //   !permissionMap?.['task_type_rid']?.read,
          }),
          createSelectField('status_rid', 'Status', {
            required: false,
            options: statusOptions,
            placeholder: 'Choose Status',
            // hide:
            //   isEditView &&
            //   !permissionMap?.['status_rid']?.read &&
            //   !permissionMap?.['status_rid']?.edit,
            // disabled:
            //   isEditView &&
            //   permissionMap?.['status_rid']?.read &&
            //   !permissionMap?.['status_rid']?.edit,
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
            regexErrorMessage: 'Description must be within 2000 characters',
            regex: REGEX_PATTERNS.DESCRIPTION,
            // disabled:
            //   isEditView &&
            //   !permissionMap?.['task_description']?.edit &&
            //   permissionMap?.['task_description']?.read,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['task_description']?.edit &&
            //   !permissionMap?.['task_description']?.read,
          }),
        ],
      },
      {
        sectionName: 'Audit Information',
        fillType: 'half',
        hide: !isEditView,
        fields: [
          createTextField('record_id', 'Record ID', {
            required: false,
            disabled: true,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['rid']?.edit &&
            //   !permissionMap?.['rid']?.read,
          }),
          createTextField('created_on', 'Created On', {
            required: false,
            disabled: true,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['created_datetime']?.edit &&
            //   !permissionMap?.['created_datetime']?.read,
          }),
          createTextField('created_by', 'Created By', {
            required: false,
            disabled: true,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['created_by']?.edit &&
            //   !permissionMap?.['created_by']?.read,
          }),
          createTextField('template_id', 'Template ID', {
            required: false,
            disabled: true,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['r_number']?.edit &&
            //   !permissionMap?.['r_number']?.read,
          }),
          createTextField('updated_on', 'Updated On', {
            required: false,
            disabled: true,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['modified_datetime']?.edit &&
            //   !permissionMap?.['modified_datetime']?.read,
          }),
          createTextField('updated_by', 'Updated By', {
            required: false,
            disabled: true,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['modified_by']?.edit &&
            //   !permissionMap?.['modified_by']?.read,
          }),
        ],
      },
    ],
    [isEditView, taskTemplateTypesOptions]
  );
};
