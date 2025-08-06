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

const requiredDateOptions: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Before', value: 'before' },
  { label: 'After', value: 'after' },
  { label: 'Between', value: 'between' },
];

export const getUserFilterFields = (
  userProfiles: FilterSelectOption[],
  roleOptions: FilterSelectOption[],
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  return [
    {
      label: 'Username',
      name: 'username',
      type: 'text',
      operatorOption: textfieldOptions,
      hide:
        !permissionMap?.['first_name']?.read &&
        !permissionMap?.['first_name']?.edit,
    },
    {
      label: 'Email',
      name: 'email',
      type: 'text',
      operatorOption: textfieldOptions,
      hide: !permissionMap?.['email']?.read && !permissionMap?.['email']?.edit,
    },
    {
      label: 'Profile',
      name: 'profile',
      type: 'enumSelect',
      options: userProfiles,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['profile_rid']?.read &&
        !permissionMap?.['profile_rid']?.edit,
    },
    {
      label: 'Role',
      name: 'role',
      type: 'enumSelect',
      options: roleOptions,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['business_teams']?.read &&
        !permissionMap?.['business_teams']?.edit,
    },
    {
      label: 'Created On',
      name: 'created_datetime',
      type: 'date',
      operatorOption: requiredDateOptions,
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
      label: 'Status',
      name: 'status',
      type: 'enumSelect',
      options: StatusOptions,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['status_rid']?.read &&
        !permissionMap?.['status_rid']?.edit,
    },
    {
      label: 'Sort Options',
      name: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'createdAt_desc', label: 'Recently Created' }],
    },
  ];
};
