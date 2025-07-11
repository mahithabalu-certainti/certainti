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

export const getManageProfileFilterfields = (
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    label: 'Profile Name',
    name: 'profile_name',
    type: 'text',
    operatorOption: textfieldOptions,
    hide:
      !permissionMap?.['profile_name']?.read &&
      !permissionMap?.['profile_name']?.edit,
  },
  {
    label: 'Profile Description',
    name: 'profile_description',
    type: 'text',
    operatorOption: textfieldOptions,
    hide:
      !permissionMap?.['profile_description']?.read &&
      !permissionMap?.['profile_description']?.edit,
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
    label: 'Created By',
    name: 'created_by',
    type: 'text',
    operatorOption: textfieldOptions,
    hide:
      !permissionMap?.['created_by']?.read &&
      !permissionMap?.['created_by']?.edit,
  },
  {
    label: 'Sort Options',
    name: 'sort_options',
    type: 'system-sort',
    options: [{ value: 'createdAt_desc', label: 'Recently Created' }],
  },
];
