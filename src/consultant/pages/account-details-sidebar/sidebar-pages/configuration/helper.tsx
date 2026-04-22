import { FieldConfig } from '../../../account-details-sidebar/components/filter/filterType';

const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
  // { option: 'Not-Contains', value: 'not_contains' },
  // { option: 'Is-Empty', value: 'is_empty' },
];

const numberOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Less Than', value: 'less_than' },
  { option: 'Greater Than', value: 'greater_than' },
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

export const getAssignGroupsFilterFields = (): FieldConfig[] => [
  {
    name: 'Group Name',
    value: 'group_name',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Number of Users',
    value: 'user_count',
    type: 'number',
    operatorOption: numberOptions,
  },
];
