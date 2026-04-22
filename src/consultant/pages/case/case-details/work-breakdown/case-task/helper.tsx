import {
  enumOptions,
  FieldConfig,
} from '../../../../account-details-sidebar/components/filter/filterType';

const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
  // { option: 'Not-Contains', value: 'not_contains' },
  // { option: 'Is-Empty', value: 'is_empty' },
];

const dateOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
];

export const reqEnumOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
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

export const getAssignGroupsFilterFields = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  statusOptions: { option: string; value: string }[],
  assigneeOptions: { option: string; value: string }[] = [],
  roleOptions: { option: string; value: string }[] = []
): FieldConfig[] => [
  {
    name: 'Task Name',
    value: 'task_name',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap['task_name']?.read && !permissionMap['task_name']?.edit,
  },
  {
    name: 'Assigned To',
    value: 'assigned_to',
    type: 'enum',
    options: assigneeOptions,
    operatorOption: enumOptions,
    hide:
      !permissionMap['assigned_to']?.read &&
      !permissionMap['assigned_to']?.edit,
  },
  {
    name: 'Role To Be Assigned',
    value: 'role_rid',
    type: 'enum',
    options: roleOptions,
    operatorOption: enumOptions,
    hide: !permissionMap['role_rid']?.read && !permissionMap['role_rid']?.edit,
  },
  {
    name: 'Start Date',
    value: 'effective_start_datetime',
    type: 'date',
    operatorOption: dateOptions,
    isFutureDateEnabled: true,
    hide:
      !permissionMap['effective_start_datetime']?.read &&
      !permissionMap['effective_start_datetime']?.edit,
  },
  {
    name: 'Due Date',
    value: 'effective_end_datetime',
    type: 'date',
    operatorOption: dateOptions,
    isFutureDateEnabled: true,
    hide:
      !permissionMap['effective_end_datetime']?.read &&
      !permissionMap['effective_end_datetime']?.edit,
  },
  {
    name: 'Status',
    value: 'task_status_rid',
    type: 'enum',
    options: statusOptions,
    operatorOption: enumOptions,
    hide:
      !permissionMap['status_rid']?.read && !permissionMap['status_rid']?.edit,
  },
];
