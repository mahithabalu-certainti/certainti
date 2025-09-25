import {
  FieldConfig,
  FilterSelectOption,
} from '../../../../consultant/types/account-filter';

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

export const getTemplateFilterFields = (
  interactionTypes: FilterSelectOption[],
  interactionLevels: FilterSelectOption[],
  statusOptions: FilterSelectOption[]
): FieldConfig[] => {
  return [
    {
      label: 'Template ID',
      name: 'r_number',
      type: 'text',
      operatorOption: textfieldOptions,
    },
    {
      label: 'Template Name',
      name: 'template_name',
      type: 'text',
      operatorOption: textfieldOptions,
    },
    {
      label: 'Interaction Level',
      name: 'interaction_level_rid',
      type: 'enumSelect',
      options: interactionLevels,
      operatorOption: enumOperator,
    },
    {
      label: 'Interaction Type',
      name: 'interaction_type_rid',
      type: 'enumSelect',
      options: interactionTypes,
      operatorOption: enumOperator,
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
      label: 'Status',
      name: 'status_rid',
      type: 'enumSelect',
      options: statusOptions,
      operatorOption: enumOperator,
    },
    {
      label: 'Sort Options',
      name: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'createdAt_desc', label: 'Recently Created' }],
    },
  ];
};
