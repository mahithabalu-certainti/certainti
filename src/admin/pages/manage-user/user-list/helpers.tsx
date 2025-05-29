import {
  FieldConfig,
  StatusOptions,
} from '../../../../consultant/types/account-filter';

const textfieldOptions: { label: string; value: string }[] = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
];

export const getUserFilterfields = (userProfiles: string[]): FieldConfig[] => [
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
    type: 'multi-select',
    options: userProfiles,
  },
  { label: 'Status', name: 'status', type: 'status', options: StatusOptions },
];
