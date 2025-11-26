import { SelectOption } from '../../../../consultant/types';
import { FieldConfig } from '../../../../consultant/types/account-filter';

const textfieldOptions: { label: string; value: string }[] = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
];

const nonReqTextfieldOptions: { label: string; value: string }[] = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'Is Empty', value: 'is_empty' },
];

export const enumOperator: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'In', value: 'in' },
];

const dateOptions: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Before', value: 'before' },
  { label: 'After', value: 'after' },
  { label: 'Between', value: 'between' },
  { label: 'Is Empty', value: 'is_empty' },
];

const requiredDateOptions: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Before', value: 'before' },
  { label: 'After', value: 'after' },
  { label: 'Between', value: 'between' },
];

export const getTaskTemplateFilterFields = (
  taskTemplateTypesOptions: SelectOption[],
  taskMilestoneTypesOptions: SelectOption[],
  taskPrioritytTypesTypesOptions: SelectOption[],
  taskCheckListTypesTypesOptions: SelectOption[],
  taskAssigneRoleTypesTypesOptions: SelectOption[],
  memoizedStatus: SelectOption[],
  taskCategoryTypesOptions: SelectOption[],
  taskWeightAgeTypesOptions: SelectOption[],
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  return [
    {
      label: 'Template ID',
      name: 'r_number',
      type: 'text',
      operatorOption: textfieldOptions,
      hide:
        !permissionMap?.['r_number']?.read &&
        !permissionMap?.['r_number']?.edit,
    },
    {
      label: 'Task Name',
      name: 'task_name',
      type: 'text',
      operatorOption: textfieldOptions,
      hide:
        !permissionMap?.['task_name']?.read &&
        !permissionMap?.['task_name']?.edit,
    },
    {
      label: 'Efforts In Days',
      name: 'effort_in_days',
      type: 'number',
      hide:
        !permissionMap?.['effort_in_days']?.read &&
        !permissionMap?.['effort_in_days']?.edit,
      operatorOption: [
        { label: 'Equals', value: 'equals' },
        { label: 'Greater Than', value: 'greater_than' },
        { label: 'Less Than', value: 'less_than' },
        { label: 'Between', value: 'between' },
      ],
    },
    {
      label: 'Task Type',
      name: 'task_type_rid',
      type: 'enumSelect',
      options: taskTemplateTypesOptions,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['task_type_rid']?.read &&
        !permissionMap?.['task_type_rid']?.edit,
    },
    {
      label: 'Milestone Name',
      name: 'milestone_template_rid',
      type: 'enumSelect',
      options: taskMilestoneTypesOptions,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['milestone_type_rid']?.edit &&
        !permissionMap?.['milestone_type_rid']?.read,
    },
    {
      label: 'Assign Role',
      name: 'case_team_member_role_rid',
      type: 'enumSelect',
      options: taskAssigneRoleTypesTypesOptions,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['case_team_member_role_rid']?.edit &&
        !permissionMap?.['case_team_member_role_rid']?.read,
    },
    {
      label: 'Priority',
      name: 'priority_rid',
      type: 'enumSelect',
      options: taskPrioritytTypesTypesOptions,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['priority_rid']?.edit &&
        !permissionMap?.['priority_rid']?.read,
    },
    {
      label: 'Checklist',
      name: 'checklist_template_rid',
      type: 'enumSelect',
      options: taskCheckListTypesTypesOptions,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['checklist']?.edit &&
        !permissionMap?.['checklist']?.read,
    },
    {
      label: 'Task Category',
      name: 'task_category_rid',
      type: 'enumSelect',
      options: taskCategoryTypesOptions,
      operatorOption: enumOperator,
      // hide:
      //   !permissionMap?.['task_category_rid']?.edit &&
      //   !permissionMap?.['task_category_rid']?.read,
    },
    {
      label: 'Weightage',
      name: 'weightage_rid',
      type: 'enumSelect',
      options: taskWeightAgeTypesOptions,
      operatorOption: enumOperator,
      // hide:
      //   !permissionMap?.['weightage_rid']?.edit &&
      //   !permissionMap?.['weightage_rid']?.read,
    },
    {
      label: 'Status',
      name: 'status_rid',
      type: 'enumSelect',
      options: memoizedStatus,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['status_rid']?.edit &&
        !permissionMap?.['status_rid']?.read,
    },
    {
      label: 'Task Description',
      name: 'task_description',
      type: 'text',
      operatorOption: textfieldOptions,
      hide:
        !permissionMap?.['task_description']?.edit &&
        !permissionMap?.['task_description']?.read,
    },

    {
      label: 'Created By',
      name: 'created_by_name',
      type: 'text',
      operatorOption: textfieldOptions,
      hide:
        !permissionMap?.['created_by']?.edit &&
        !permissionMap?.['created_by']?.read,
    },
    {
      label: 'Created On',
      name: 'created_datetime',
      type: 'date',
      operatorOption: requiredDateOptions,
      hide:
        !permissionMap?.['created_datetime']?.edit &&
        !permissionMap?.['created_datetime']?.read,
    },
    {
      label: 'Updated By',
      name: 'modified_by_name',
      type: 'text',
      operatorOption: nonReqTextfieldOptions,
      hide:
        !permissionMap?.['modified_by']?.edit &&
        !permissionMap?.['modified_by']?.read,
    },
    {
      label: 'Updated On',
      name: 'modified_datetime',
      type: 'date',
      operatorOption: dateOptions,
      hide:
        !permissionMap?.['modified_datetime']?.edit &&
        !permissionMap?.['modified_datetime']?.read,
    },
    {
      label: 'Sort Options',
      name: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'createdAt_desc', label: 'Recently Created' }],
    },
  ];
};
