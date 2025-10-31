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

export const getTaskTemplateFilterFields = (): FieldConfig[] => {
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
      label: 'Task Description',
      name: 'task_description',
      type: 'text',
      operatorOption: textfieldOptions,
    },
    {
      label: 'Task Type',
      name: 'task_type',
      type: 'enumSelect',
      options: [],
      operatorOption: enumOperator,
    },
    {
      label: 'Efforts',
      name: 'efforts',
      type: 'number',
      operatorOption: [
        { label: 'Equals', value: 'equals' },
        { label: 'Greater Than', value: 'greater_than' },
        { label: 'Less Than', value: 'less_than' },
        { label: 'Between', value: 'between' },
      ],
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
