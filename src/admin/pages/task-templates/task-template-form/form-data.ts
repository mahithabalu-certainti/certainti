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
  taskTemplateTypesOptions: SelectOption[]
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
          createSelectField('task_type', 'Task Type', {
            options: taskTemplateTypesOptions || [],
            placeholder: 'Choose Task Type',
            required: true,
            // disabled:
            //   isEditView &&
            //   !permissionMap?.['task_type_rid']?.edit &&
            //   permissionMap?.['task_type_rid']?.read,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['task_type_rid']?.edit &&
            //   !permissionMap?.['task_type_rid']?.read,
          }),
          createTextField('efforts', 'Efforts', {
            regex: REGEX_PATTERNS.EFFORTS_NUMBER,
            regexErrorMessage:
              'Only positive numbers allowed, up to 16 digits and 2 decimal places',
            placeholder: 'Enter Efforts',
            required: true,
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
