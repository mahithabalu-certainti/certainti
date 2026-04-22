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
  allGroupTypes: SelectOption[],
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    label: 'Group Name',
    name: 'group_name',
    type: 'text',
    operatorOption: textfieldOptions,
    hide:
      !permissionMap?.['group_name']?.read &&
      !permissionMap?.['group_name']?.edit,
  },
  {
    label: 'Group Type',
    name: 'group_type',
    type: 'enumSelect',
    operatorOption: groupTypeOperator,
    options: allGroupTypes,
    hide:
      !permissionMap?.['group_type_rid']?.read &&
      !permissionMap?.['group_type_rid']?.edit,
  },
  {
    label: 'Is Consultant Firm',
    name: 'is_consultant_only_group',
    type: 'boolean',
    hide:
      !permissionMap?.['is_consultant_only_group']?.read &&
      !permissionMap?.['is_consultant_only_group']?.edit,
  },
  {
    label: 'Users Count',
    name: 'user_count',
    type: 'number',
    hide:
      !permissionMap?.['user_count']?.read &&
      !permissionMap?.['user_count']?.edit,
  },
  {
    label: 'Created On',
    name: 'created_datetime',
    type: 'date',
    operatorOption: dateOptions,
    hide:
      !permissionMap?.['created_datetime']?.read &&
      !permissionMap?.['created_datetime']?.edit,
  },
  {
    label: 'Updated On',
    name: 'modified_datetime',
    type: 'date',
    operatorOption: dateOptions,
    hide:
      !permissionMap?.['modified_datetime']?.read &&
      !permissionMap?.['modified_datetime']?.edit,
  },
  {
    label: 'Sort Options',
    name: 'sort_options',
    type: 'system-sort',
    options: [{ value: 'createdAt_desc', label: 'Recently Created' }],
  },
];
