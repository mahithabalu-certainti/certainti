import { useMemo } from 'react';
import { FormType, SelectOption } from '../../../../consultant/types';
import {
  createMultiSelectField,
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
  taskConnecterTypesOptions: SelectOption[],
  taskTemplate: SelectOption[],
  taskWeightAgeTypesOptions: SelectOption[],
  taskCategoryTypesOptions: SelectOption[],
  taskType: boolean,
  linkedType: boolean,
  permissionMap: Record<string, { read: boolean; edit: boolean }>
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
            disabled:
              isEditView &&
              !permissionMap?.['task_name']?.edit &&
              permissionMap?.['task_name']?.read,
            hide:
              isEditView &&
              !permissionMap?.['task_name']?.edit &&
              !permissionMap?.['task_name']?.read,
            errorHandling: [
              {
                regex: REGEX_PATTERNS.MIN_3,
                errorMessage: 'Task Name must be at least 2 characters long',
              },
              {
                regex: REGEX_PATTERNS.MAX_150,
                errorMessage: 'Max length exceeded',
              },
            ],
          }),
          createSelectField('task_type_rid', 'Task Type', {
            options: taskTemplateTypesOptions || [],
            placeholder: 'Choose Task Type',
            required: true,
            onChange: true,
            disabled: isEditView,
            hide:
              isEditView &&
              !permissionMap?.['task_type_rid']?.edit &&
              !permissionMap?.['task_type_rid']?.read,
          }),
          createSelectField('milestone_template_rid', 'Milestone Type', {
            options: taskMilestoneTypesOptions || [],
            placeholder: 'Choose Milestone Type',
            required: true,
            // hide: taskType,
            disabled:
              isEditView &&
              !permissionMap?.['milestone_type_rid']?.edit &&
              permissionMap?.['milestone_type_rid']?.read,
            hide:
              taskType ||
              (!permissionMap?.['milestone_type_rid']?.read &&
                !permissionMap?.['milestone_type_rid']?.edit),
          }),
          createSelectField('case_team_member_role_rid', 'Assign Role', {
            options: taskAssignRoleTypesTypesOptions || [],
            placeholder: 'Choose Assign Role',
            required: true,
            disabled:
              isEditView &&
              !permissionMap?.['case_team_member_role_rid']?.edit &&
              permissionMap?.['case_team_member_role_rid']?.read,
            hide:
              taskType ||
              (!permissionMap?.['case_team_member_role_rid']?.read &&
                !permissionMap?.['case_team_member_role_rid']?.edit),
          }),
          createTextField('effort_in_days', 'Efforts In Days', {
            regex: REGEX_PATTERNS.ALLOW_ONE_TO_99,
            regexErrorMessage:
              'Only positive numbers allowed, from 1 to 99 are allowed. ',
            placeholder: 'Enter Efforts In Days',
            required: true,
            onChange: true,
            formatCostValue: true,
            disabled:
              isEditView &&
              permissionMap?.['effort_in_days']?.read &&
              !permissionMap?.['effort_in_days']?.edit,
            hide:
              taskType ||
              (!permissionMap?.['effort_in_days']?.read &&
                !permissionMap?.['effort_in_days']?.edit),
          }),

          createSelectField('priority_rid', 'Priority', {
            options: taskPrioritytTypesTypesOptions || [],
            placeholder: 'Choose Priority',
            required: false,
            disabled:
              isEditView &&
              !permissionMap?.['priority_rid']?.edit &&
              permissionMap?.['priority_rid']?.read,
            hide:
              isEditView &&
              !permissionMap?.['priority_rid']?.edit &&
              !permissionMap?.['priority_rid']?.read,
          }),
          createSelectField('checklist_template_rid', 'Checklist', {
            options: taskCheckListTypesTypesOptions || [],
            placeholder: 'Choose Checklist',
            required: false,
            disabled:
              isEditView &&
              !permissionMap?.['checklist']?.edit &&
              permissionMap?.['checklist']?.read,
            hide:
              isEditView &&
              !permissionMap?.['checklist']?.edit &&
              !permissionMap?.['checklist']?.read,
          }),
          createSelectField('task_category_rid', 'Task Category', {
            required: true,
            options: taskCategoryTypesOptions || [],
            placeholder: 'Choose Task Category',
            hide: taskType,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['task_category_rid']?.read &&
            //   !permissionMap?.['task_category_rid']?.edit,
            // disabled:
            //   isEditView &&
            //   permissionMap?.['task_category_rid']?.read &&
            //   !permissionMap?.['task_category_rid']?.edit,
          }),
          createSelectField('weightage_rid', 'Task Weightage ', {
            options: taskWeightAgeTypesOptions || [],
            placeholder: 'Choose Task Weightage',
            required: true,
            hide: taskType,
            // disabled:
            //   isEditView &&
            //   !permissionMap?.['weightage_rid']?.edit &&
            //   permissionMap?.['weightage_rid']?.read,
            // hide:
            //   isEditView &&
            //   !permissionMap?.['weightage_rid']?.edit &&
            //   !permissionMap?.['weightage_rid']?.read,
          }),
          createSelectField('status_rid', 'Status', {
            required: true,
            options: statusOptions,
            placeholder: 'Choose Status',
            hide:
              isEditView &&
              !permissionMap?.['status_rid']?.read &&
              !permissionMap?.['status_rid']?.edit,
            disabled:
              isEditView &&
              permissionMap?.['status_rid']?.read &&
              !permissionMap?.['status_rid']?.edit,
          }),
        ],
      },
      {
        sectionName: 'emptyName',
        fillType: 'half',
        gridMode: 'first-one-rest-two',
        fields: [
          createSelectField('relationship_connector_rid', 'Linked Type', {
            options: taskConnecterTypesOptions || [],
            placeholder: 'Choose Linked Type',
            required: false,
            onChange: true,
          }),
          createMultiSelectField('target_rid', 'Linked Task Type', {
            options: taskTemplate || [],
            placeholder: 'Choose Linked Task Type ',
            required: linkedType,
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
            disabled:
              isEditView &&
              !permissionMap?.['task_description']?.edit &&
              permissionMap?.['task_description']?.read,
            hide:
              isEditView &&
              !permissionMap?.['task_description']?.edit &&
              !permissionMap?.['task_description']?.read,
          }),
        ],
      },
      {
        sectionName: 'Audit Information',
        fillType: 'half',
        hide: !isEditView,
        fields: [
          createTextField('record_id', 'Template ID', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['rid']?.edit &&
              !permissionMap?.['rid']?.read,
          }),
          createTextField('created_on', 'Created On', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['created_datetime']?.edit &&
              !permissionMap?.['created_datetime']?.read,
          }),
          createTextField('created_by', 'Created By', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['created_by']?.edit &&
              !permissionMap?.['created_by']?.read,
          }),
          createTextField('template_id', 'Template ID', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['r_number']?.edit &&
              !permissionMap?.['r_number']?.read,
          }),
          createTextField('updated_on', 'Updated On', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['modified_datetime']?.edit &&
              !permissionMap?.['modified_datetime']?.read,
          }),
          createTextField('updated_by', 'Updated By', {
            required: false,
            disabled: true,
            hide:
              isEditView &&
              !permissionMap?.['modified_by']?.edit &&
              !permissionMap?.['modified_by']?.read,
          }),
        ],
      },
    ],
    [
      isEditView,
      permissionMap,
      statusOptions,
      taskAssignRoleTypesTypesOptions,
      taskCheckListTypesTypesOptions,
      taskConnecterTypesOptions,
      taskMilestoneTypesOptions,
      taskPrioritytTypesTypesOptions,
      taskTemplate,
      taskTemplateTypesOptions,
      taskType,
    ]
  );
};
