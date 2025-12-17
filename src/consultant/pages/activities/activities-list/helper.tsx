import { FieldConfig } from '../../account-details-sidebar/components/filter/filterType';

interface PermissionField {
  name: string;
  read?: boolean;
  edit?: boolean;
}

interface PermissionItem {
  name: string;
  fields?: PermissionField[];
}

const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
];

// const nonReqTextfieldOptions: { option: string; value: string }[] = [
//   { option: 'Contains', value: 'contains' },
//   { option: 'Equals', value: 'equals' },
//   { option: 'Not Equals', value: 'not_equals' },
//   { option: 'Is Empty', value: 'is_empty' },
// ];

const enumOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
];

const dateOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
];

// const numberOptions: { option: string; value: string }[] = [
//   { option: 'Equals', value: 'equals' },
//   { option: 'Not Equals', value: 'not_equals' },
//   { option: 'Less Than', value: 'less_than' },
//   { option: 'Greater Than', value: 'greater_than' },
//   { option: 'Between', value: 'between' },
// ];

export const isFieldVisibleInAnyModule = (
  field: string,
  maps: Record<string, { read: boolean; edit: boolean }>[]
): boolean => {
  return maps.some((map) => map[field]?.read || map[field]?.edit);
};

export const getAllActivityFilterFields = (
  activityStatusOptions: { value: string; label: string }[],
  permissionMaps: Record<string, { read: boolean; edit: boolean }>[]
): FieldConfig[] => [
  {
    name: 'Activity ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
    hide: !isFieldVisibleInAnyModule('r_number', permissionMaps),
  },
  {
    name: 'Activity Type',
    value: 'activity_type',
    type: 'enum',
    operatorOption: enumOptions,
    options: [
      { option: 'Email', value: 'Email' },
      { option: 'Task', value: 'Task' },
      { option: 'Meeting', value: 'Meeting' },
      { option: 'Call', value: 'Call' },
    ],
    hide: !isFieldVisibleInAnyModule('activity_type', permissionMaps),
  },
  {
    name: 'Created By',
    value: 'created_by_name',
    type: 'text',
    operatorOption: textOptions,
    hide: !isFieldVisibleInAnyModule('created_by_name', permissionMaps),
  },
  {
    name: 'Status',
    value: 'status_name',
    type: 'enum',
    operatorOption: enumOptions,
    options: activityStatusOptions.map((opt) => ({
      option: opt.label,
      value: opt.value,
    })),
    hide: !isFieldVisibleInAnyModule('status_rid', permissionMaps),
  },
  {
    name: 'Related To',
    value: 'attached_to',
    type: 'text',
    operatorOption: textOptions,
    hide: !isFieldVisibleInAnyModule('attached_to', permissionMaps),
  },
  {
    name: 'Due Date',
    value: 'due_date',
    type: 'date',
    operatorOption: dateOptions,
    hide: !isFieldVisibleInAnyModule('effective_end_datetime', permissionMaps),
  },
];

export const getEmailFilterFields = (
  activityStatusOptions: { value: string; label: string }[],
  userListOptions: { value: string; label: string }[],
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    name: 'Email ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
  },
  {
    name: 'Email Status',
    value: 'status_name',
    type: 'enum',
    operatorOption: enumOptions,
    options: activityStatusOptions.map((opt) => ({
      option: opt.label,
      value: opt.value,
    })),
    hide:
      !permissionMap?.['status_rid']?.edit &&
      !permissionMap?.['status_rid']?.read,
  },
  {
    name: 'Related To',
    value: 'attached_to',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['attached_to']?.edit &&
      !permissionMap?.['attached_to']?.read,
  },
  {
    name: 'Created By',
    value: 'created_by_name',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['created_by_name']?.edit &&
      !permissionMap?.['created_by_name']?.read,
  },
  {
    name: 'Created On',
    value: 'created_datetime',
    type: 'date',
    operatorOption: dateOptions,
    hide:
      !permissionMap?.['created_datetime']?.edit &&
      !permissionMap?.['created_datetime']?.read,
  },
  {
    name: 'Email To',
    value: 'to_email',
    type: 'enum',
    options: userListOptions.map((opt) => ({
      option: opt.label,
      value: opt.value,
    })),
    operatorOption: enumOptions,
    hide:
      !permissionMap?.['to_email']?.edit && !permissionMap?.['to_email']?.read,
  },
  {
    name: 'Email Subject',
    value: 'subject',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['subject']?.edit && !permissionMap?.['subject']?.read,
  },
];

export const getTaskFilterFields = (
  userListOptions: { value: string; label: string }[],
  activityStatusOptions: { value: string; label: string }[],
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    name: 'Task ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
  },
  {
    name: 'Task Name',
    value: 'task_name',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['task_name']?.edit &&
      !permissionMap?.['task_name']?.read,
  },
  {
    name: 'Task Status',
    value: 'status_name',
    type: 'enum',
    operatorOption: enumOptions,
    options: activityStatusOptions.map((opt) => ({
      option: opt.label,
      value: opt.value,
    })),
    hide:
      !permissionMap?.['status_rid']?.edit &&
      !permissionMap?.['status_rid']?.read,
  },
  {
    name: 'Related To',
    value: 'attached_to',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['attached_to']?.edit &&
      !permissionMap?.['attached_to']?.read,
  },
  {
    name: 'Created By',
    value: 'created_by_name',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['created_by_name']?.edit &&
      !permissionMap?.['created_by_name']?.read,
  },
  {
    name: 'Created On',
    value: 'created_datetime',
    type: 'date',
    operatorOption: dateOptions,
    hide:
      !permissionMap?.['created_datetime']?.edit &&
      !permissionMap?.['created_datetime']?.read,
  },
  {
    name: 'Description',
    value: 'description',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['description']?.edit &&
      !permissionMap?.['description']?.read,
  },
  {
    name: 'Due Date',
    value: 'effective_end_datetime',
    type: 'date',
    operatorOption: dateOptions,
    isFutureDateEnabled: true,
    hide:
      !permissionMap?.['effective_end_datetime']?.edit &&
      !permissionMap?.['effective_end_datetime']?.read,
  },
  {
    name: 'Assigned To',
    value: 'assigned_to_name',
    type: 'enum',
    options: userListOptions.map((opt) => ({
      option: opt.label,
      value: opt.value,
    })),
    operatorOption: enumOptions,
    hide:
      !permissionMap?.['assigned_to']?.edit &&
      !permissionMap?.['assigned_to']?.read,
  },
];

export const getMeetingFilterFields = (
  activityStatusOptions: { value: string; label: string }[],
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    name: 'Meeting ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
  },
  {
    name: 'Meeting Status',
    value: 'status_name',
    type: 'enum',
    operatorOption: enumOptions,
    options: activityStatusOptions.map((opt) => ({
      option: opt.label,
      value: opt.value,
    })),
    hide:
      !permissionMap?.['status_rid']?.edit &&
      !permissionMap?.['status_rid']?.read,
  },
  {
    name: 'Created On',
    value: 'created_datetime',
    type: 'date',
    operatorOption: dateOptions,
    hide:
      !permissionMap?.['created_datetime']?.edit &&
      !permissionMap?.['created_datetime']?.read,
  },
  {
    name: 'Invited By',
    value: 'invited_by',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['invited_by']?.edit &&
      !permissionMap?.['invited_by']?.read,
  },
  {
    name: 'Meeting Start Time',
    value: 'effective_start_time',
    type: 'time',
    operatorOption: dateOptions,
    timeFormat: '12h',
    hide:
      !permissionMap?.['effective_start_time']?.edit &&
      !permissionMap?.['effective_start_time']?.read,
  },
  {
    name: 'Meeting End Time',
    value: 'effective_end_datetime',
    type: 'time',
    operatorOption: dateOptions,
    timeFormat: '12h',
    hide:
      !permissionMap?.['effective_start_time']?.edit &&
      !permissionMap?.['effective_start_time']?.read,
  },
  {
    name: 'Related To',
    value: 'attached_to',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['attached_to']?.edit &&
      !permissionMap?.['attached_to']?.read,
  },
];

export const getCallFilterFields = (
  activityStatusOptions: { value: string; label: string }[],
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    name: 'Call ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['r_number']?.edit && !permissionMap?.['r_number']?.read,
  },
  {
    name: 'Call Platform',
    value: 'call_platform',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['call_platform']?.edit &&
      !permissionMap?.['call_platform']?.read,
  },
  {
    name: 'Related To',
    value: 'attached_to',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['attached_to']?.edit &&
      !permissionMap?.['attached_to']?.read,
  },
  {
    name: 'Call Status',
    value: 'status_name',
    type: 'enum',
    operatorOption: enumOptions,
    options: activityStatusOptions.map((opt) => ({
      option: opt.label,
      value: opt.value,
    })),
    hide:
      !permissionMap?.['status_rid']?.edit &&
      !permissionMap?.['status_rid']?.read,
  },
  {
    name: 'Call Start Date',
    value: 'effective_start_datetime',
    type: 'date',
    operatorOption: dateOptions,
    hide:
      !permissionMap?.['effective_start_datetime']?.edit &&
      !permissionMap?.['effective_start_datetime']?.read,
  },
  {
    name: 'Call End Date',
    value: 'effective_end_datetime',
    type: 'date',
    operatorOption: dateOptions,
    hide:
      !permissionMap?.['effective_end_datetime']?.edit &&
      !permissionMap?.['effective_end_datetime']?.read,
  },
  {
    name: 'Created By',
    value: 'created_by_name',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['created_by_name']?.edit &&
      !permissionMap?.['created_by_name']?.read,
  },
  {
    name: 'Created On',
    value: 'created_datetime',
    type: 'date',
    operatorOption: dateOptions,
    hide:
      !permissionMap?.['created_datetime']?.edit &&
      !permissionMap?.['created_datetime']?.read,
  },
];

export const parseToStringArray = (value: unknown): string[] => {
  if (!value) return [];

  // 1) If it's already an array → normalize and flatten
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => parseToStringArray(item)) // recursively unwrap nested structures
      .map(String)
      .filter(Boolean);
  }

  // 2) If it's a string
  if (typeof value === 'string') {
    let trimmed = value.trim();
    if (!trimmed) return [];

    // Keep unwrapping JSON until it stops parsing
    while (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);

        // If parsed is an array → recursively flatten & return
        if (Array.isArray(parsed)) {
          return parsed.flatMap((item) => parseToStringArray(item));
        }

        // If parsed is a string → unwrap deeper
        if (typeof parsed === 'string') {
          trimmed = parsed.trim();
          continue;
        }

        break;
      } catch {
        break;
      }
    }

    // Comma-separated fallback
    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Single non-empty string
    return trimmed ? [trimmed] : [];
  }

  // 3) Anything else (boolean, number, object)
  return [String(value)];
};

export const getPermissionMap = (
  permission: PermissionItem[],
  permissionKey: string
): Record<string, { read: boolean; edit: boolean }> => {
  const fields = permission.find((p) => p.name === permissionKey)?.fields ?? [];

  const map: Record<string, { read: boolean; edit: boolean }> = {};

  fields.forEach((field) => {
    map[field.name] = {
      read: field.read ?? false,
      edit: field.edit ?? false,
    };
  });

  return map;
};
