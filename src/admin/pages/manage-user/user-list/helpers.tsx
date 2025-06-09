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

export const getUserFilterFields = (
  userProfiles: FilterSelectOption[]
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
    label: 'Status',
    name: 'status',
    type: 'enumSelect',
    options: StatusOptions,
    operatorOption: enumOperator,
  },
];
