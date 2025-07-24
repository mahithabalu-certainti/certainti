import { SelectOption } from '../../../../consultant/types';
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
];

export const groupTypeOperator: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'In', value: 'in' },
];

export const getManageUserGroupFilterFields = (
  allGroupTypes: SelectOption[]
): FieldConfig[] => [
  {
    label: 'Group Name',
    name: 'group_name',
    type: 'text',
    operatorOption: textfieldOptions,
  },
  {
    label: 'Group Type',
    name: 'group_type',
    type: 'enumSelect',
    operatorOption: groupTypeOperator,
    options: allGroupTypes,
  },
  {
    label: 'Is Consultant Firm',
    name: 'is_consultant_only_group',
    type: 'boolean',
  },
  {
    label: 'Users Count',
    name: 'user_count',
    type: 'number',
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
    label: 'Sort Options',
    name: 'sort_options',
    type: 'system-sort',
    options: [{ value: 'createdAt_desc', label: 'Recently Created' }],
  },
];
