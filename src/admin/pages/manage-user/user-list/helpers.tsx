import {
  FieldConfig,
  FilterSelectOption,
  StatusOptions,
} from '../../../../consultant/types/account-filter';

const textfieldOptions: { label: string; value: string }[] = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
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

export const getUserFilterFields = (
  userProfiles: FilterSelectOption[],
  roleOptions: FilterSelectOption[]
): FieldConfig[] => [
  {
    label: 'Username',
    name: 'username',
    type: 'text',
    operatorOption: textfieldOptions,
  },
  {
    label: 'Email',
    name: 'email',
    type: 'text',
    operatorOption: textfieldOptions,
  },
  {
    label: 'Profile',
    name: 'profile',
    type: 'enumSelect',
    options: userProfiles,
    operatorOption: enumOperator,
  },
  {
    label: 'Role',
    name: 'role',
    type: 'enumSelect',
    options: roleOptions,
    operatorOption: enumOperator,
  },
  {
    label: 'Created On',
    name: 'created_datetime',
    type: 'date',
    operatorOption: dateOptions,
  },
  {
    label: 'Updated On',
    name: 'modified_datetime',
    type: 'date',
    operatorOption: dateOptions,
  },
  {
    label: 'Status',
    name: 'status',
    type: 'enumSelect',
    options: StatusOptions,
    operatorOption: enumOperator,
  },
  {
    label: 'Sort Options',
    name: 'sort_options',
    type: 'system-sort',
    options: [{ value: 'createdAt_desc', label: 'Recently Created' }],
  },
];
