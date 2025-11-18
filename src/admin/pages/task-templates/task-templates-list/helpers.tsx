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
  memoizedStatus: SelectOption[]
): FieldConfig[] => {
  return [
    {
      label: 'Template ID',
      name: 'r_number',
      type: 'text',
      operatorOption: textfieldOptions,
    },
    {
      label: 'Task Name',
      name: 'task_name',
      type: 'text',
      operatorOption: textfieldOptions,
    },
    {
      label: 'Efforts In Days',
      name: 'effort_in_days',
      type: 'number',
      operatorOption: [
        { label: 'Equals', value: 'equals' },
        { label: 'Greater Than', value: 'greater_than' },
        { label: 'Less Than', value: 'less_than' },
        { label: 'Between', value: 'between' },
      ],
    },
    {
      label: 'Reminder Interval',
      name: 'reminder_interval',
      type: 'number',
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
    },
    {
      label: 'Milestone Name',
      name: 'milestone_template_rid',
      type: 'enumSelect',
      options: taskMilestoneTypesOptions,
      operatorOption: enumOperator,
    },
    {
      label: 'Assinge Role',
      name: 'case_team_member_role_rid',
      type: 'enumSelect',
      options: taskAssigneRoleTypesTypesOptions,
      operatorOption: enumOperator,
    },
    {
      label: 'Priority',
      name: 'priority_rid',
      type: 'enumSelect',
      options: taskPrioritytTypesTypesOptions,
      operatorOption: enumOperator,
    },
    {
      label: 'Checklist',
      name: 'checklist_template_rid',
      type: 'enumSelect',
      options: taskCheckListTypesTypesOptions,
      operatorOption: enumOperator,
    },
    {
      label: 'Status',
      name: 'status_rid',
      type: 'enumSelect',
      options: memoizedStatus,
      operatorOption: enumOperator,
    },
    {
      label: 'Task Description',
      name: 'task_description',
      type: 'text',
      operatorOption: textfieldOptions,
    },

    {
      label: 'Created By',
      name: 'created_user_name',
      type: 'text',
      operatorOption: textfieldOptions,
    },
    {
      label: 'Created On',
      name: 'created_datetime',
      type: 'date',
      operatorOption: requiredDateOptions,
    },
    {
      label: 'Updated By',
      name: 'modified_user_name',
      type: 'text',
      operatorOption: nonReqTextfieldOptions,
    },
    {
      label: 'Updated On',
      name: 'modified_datetime',
      type: 'date',
      operatorOption: dateOptions,
    },
    {
      label: 'Sort Options',
      name: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'createdAt_desc', label: 'Recently Created' }],
    },
  ];
};
