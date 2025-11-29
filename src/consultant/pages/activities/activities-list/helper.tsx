import { FieldConfig } from '../../account-details-sidebar/components/filter/filterType';

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

export const getAllActivityFilterFields = (
  activityStatusOptions: { value: string; label: string }[]
  //   permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    name: 'Activity ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
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
  },
  {
    name: 'Created By',
    value: 'created_by_name',
    type: 'text',
    operatorOption: textOptions,
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
  },
  {
    name: 'Related To',
    value: 'attached_to',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Due Date',
    value: 'due_date',
    type: 'date',
    operatorOption: dateOptions,
  },
];

export const getEmailFilterFields = (
  activityStatusOptions: { value: string; label: string }[]
  //   permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    name: 'Email ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
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
  },
  {
    name: 'Related To',
    value: 'attached_to',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Created By',
    value: 'created_by_name',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Created On',
    value: 'created_datetime',
    type: 'date',
    operatorOption: dateOptions,
  },
  {
    name: 'Email To',
    value: 'to_email',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Email Subject',
    value: 'subject',
    type: 'text',
    operatorOption: textOptions,
  },
];

export const getTaskFilterFields = (
  userListOptions: { value: string; label: string }[],
  activityStatusOptions: { value: string; label: string }[]
  //   permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    name: 'Task ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
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
  },
  {
    name: 'Created By',
    value: 'created_by_name',
    type: 'text',
    operatorOption: textOptions,
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
  },
  {
    name: 'Related To',
    value: 'attached_to',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Due Date',
    value: 'due_date',
    type: 'date',
    operatorOption: dateOptions,
  },
];

export const getMeetingFilterFields = (
  activityStatusOptions: { value: string; label: string }[]
  //   permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    name: 'Meeting ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
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
  },
  {
    name: 'Created On',
    value: 'created_datetime',
    type: 'date',
    operatorOption: dateOptions,
  },
  {
    name: 'Invited By',
    value: 'created_by_name',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Related To',
    value: 'attached_to',
    type: 'text',
    operatorOption: textOptions,
  },
];

export const getCallFilterFields = (
  activityStatusOptions: { value: string; label: string }[]
  //   permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    name: 'Call ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Call Platform',
    value: 'call_platform',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Related To',
    value: 'attached_to',
    type: 'text',
    operatorOption: textOptions,
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
  },
  {
    name: 'Call Start Date',
    value: 'effective_start_datetime',
    type: 'date',
    operatorOption: dateOptions,
  },
  {
    name: 'Call End Date',
    value: 'effective_end_datetime',
    type: 'date',
    operatorOption: dateOptions,
  },
  {
    name: 'Created By',
    value: 'created_by_name',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Created On',
    value: 'created_datetime',
    type: 'date',
    operatorOption: dateOptions,
  },
];
