import { FieldConfig } from '../../../../consultant/types/account-filter';

const textfieldOptions: { label: string; value: string }[] = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
];

const dateOptions: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Before', value: 'before' },
  { label: 'After', value: 'after' },
  { label: 'Between', value: 'between' },
  { label: 'Is Empty', value: 'is_empty' },
];

export const getManageProfileFilterfields = (): FieldConfig[] => [
  {
    label: 'Profile Name',
    name: 'profile_name',
    type: 'text',
    operatorOption: textfieldOptions,
  },
  {
    label: 'Profile Description',
    name: 'profile_description',
    type: 'text',
    operatorOption: textfieldOptions,
  },
  {
    label: 'Created On',
    name: 'created_datetime',
    type: 'date',
    operatorOption: dateOptions,
  },
  {
    label: 'Created By',
    name: 'created_by',
    type: 'text',
    operatorOption: textfieldOptions,
  },
];
