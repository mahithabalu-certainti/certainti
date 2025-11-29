import {
  enumOptions,
  FieldConfig,
} from '../../../../account-details-sidebar/components/filter/filterType';

const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
  // { option: 'Not-Contains', value: 'not_contains' },
  // { option: 'Is-Empty', value: 'is_empty' },
];

const dateOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
];

export const getAssignUserFilterFields = (): FieldConfig[] => [
  {
    name: 'Username',
    value: 'first_name',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Email Address',
    value: 'email',
    type: 'text',
    operatorOption: textOptions,
  },
];

export const getAssignGroupsFilterFields = (
  statusOptions: { option: string; value: string }[]
): FieldConfig[] => [
    {
      name: 'Task Name',
      value: 'task_name',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Assigned To',
      value: 'assigned_to',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Start Date',
      value: 'effective_start_datetime',
      type: 'date',
      operatorOption: dateOptions,
    },
    {
      name: 'End Date',
      value: 'effective_end_datetime',
      type: 'date',
      operatorOption: dateOptions,
    },
    {
      name: 'Status',
      value: 'task_status_rid',
      type: 'enum',
      options: statusOptions,
      operatorOption: enumOptions,
    }]