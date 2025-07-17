import { FieldConfig } from '../../../../consultant/types/account-filter';

const textfieldOptions: { label: string; value: string }[] = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
];

export const getManageProfileFilterFields = (): FieldConfig[] => [
  {
    label: 'Group Name',
    name: 'group_name',
    type: 'text',
    operatorOption: textfieldOptions,
  },
  {
    label: 'Available User',
    name: 'user_count',
    type: 'text',
    operatorOption: textfieldOptions,
  },
];
