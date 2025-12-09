import { PROJECT_TYPE } from '../../../../../common-utils';
import { FieldConfig } from '../../../account-details-sidebar/components/filter/filterType';
import { fiscalYears } from '../../../resource-form/form-data';

export const statusOptions: { option: string; value: string }[] = [
  { option: 'Active', value: 'Active' },
  { option: 'In-Active', value: 'Inactive' },
];
export const fiscalYearOptions = fiscalYears.map((year) => ({
  option: year.label,
  value: year.value,
}));
export const projectTypeOptions = PROJECT_TYPE.map((year) => ({
  option: year.label,
  value: year.value,
}));
export const numberOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Less-Than', value: 'less_than' },
  { option: 'Greater-Than', value: 'greater_than' },
  { option: 'Between', value: 'between' },
  { option: 'Is-Empty', value: 'is_empty' },
];
export const effortNumberOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Less-Than', value: 'less_than' },
  { option: 'Greater-Than', value: 'greater_than' },
  { option: 'Between', value: 'between' },
];

export const booleanOptions: { option: string; value: string }[] = [
  { option: 'IsTrue', value: 'isTrue' },
  { option: 'IsFalse', value: 'isFalse' },
  { option: 'Is-Empty', value: 'is_empty' },
];

export const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
  // { option: 'Not-Contains', value: 'not_contains' },
  // { option: 'Is-Empty', value: 'is_empty' },
];
export const nonMadatoryOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
  { option: 'Is-Empty', value: 'is_empty' },
];
export const fiscalOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
];

export const enumOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
  { option: 'Is-Empty', value: 'is_empty' },
];

export const dateOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
  { option: 'Is-Empty', value: 'is_empty' },
];

export const caseProjectTaskFilterFields = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  projectPermissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    name: 'Project Code',
    value: 'project_code',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !projectPermissionMap?.['project_code']?.read &&
      !projectPermissionMap?.['project_code']?.edit,
  },
  {
    name: 'Project Name',
    value: 'project_name',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !projectPermissionMap?.['project_name']?.read &&
      !projectPermissionMap?.['project_name']?.edit,
  },
  {
    name: 'Resource Code',
    value: 'resource_code',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['resource_code']?.read &&
      !permissionMap?.['resource_code']?.edit,
  },
  {
    name: 'Resource Name',
    value: 'resource_name',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !permissionMap?.['resource_name']?.read &&
      !permissionMap?.['resource_name']?.edit,
  },
  {
    name: 'Task Name',
    value: 'task_name',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !permissionMap?.['task_name']?.read &&
      !permissionMap?.['task_name']?.edit,
  },
  {
    name: 'Resource Type',
    value: 'resource_type',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !permissionMap?.['resource_type_name']?.read &&
      !permissionMap?.['resource_type_name']?.edit,
  },
  {
    name: 'Project Resource Role',
    value: 'project_resource_role',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !permissionMap?.['project_resource_role']?.read &&
      !permissionMap?.['project_resource_role']?.edit,
  },
  {
    name: 'Task Type',
    value: 'task_type',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !permissionMap?.['task_type_rid']?.read &&
      !permissionMap?.['task_type_rid']?.edit,
  },
  {
    name: 'Classification Type',
    value: 'classification_type',
    hide:
      !permissionMap?.['task_classification_rid']?.read &&
      !permissionMap?.['task_classification_rid']?.edit,
    type: 'text',
    operatorOption: nonMadatoryOptions,
  },
  {
    name: 'Start Date',
    value: 'start_date',
    type: 'date',
    operatorOption: dateOptions,
    hide:
      !permissionMap?.['start_date']?.read &&
      !permissionMap?.['start_date']?.edit,
  },
  {
    name: 'End Date',
    value: 'end_date',
    type: 'date',
    operatorOption: dateOptions,
    hide:
      !permissionMap?.['end_date']?.read && !permissionMap?.['end_date']?.edit,
  },
  {
    name: 'Cost',
    value: 'cost',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !permissionMap?.['total_cost_pro_task']?.read &&
      !permissionMap?.['total_cost_pro_task']?.edit,
  },
  {
    name: 'Effort (Hours)',
    value: 'effort_hours',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !permissionMap?.['total_cost_pro_task']?.read &&
      !permissionMap?.['total_cost_pro_task']?.edit,
  },
  {
    name: 'Status',
    value: 'status',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !permissionMap?.['status_rid']?.edit &&
      !permissionMap?.['status_rid']?.read,
  },
  {
    name: 'Comments',
    value: 'comments',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !permissionMap?.['comments']?.read && !permissionMap?.['comments']?.edit,
  },
  {
    name: 'Project Task ID',
    value: 'project_task_id',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
  },
  {
    name: 'Sort Options',
    value: 'sort_options',
    type: 'system-sort',
    options: [{ value: 'created_datetime_desc', option: 'Recently Created' }],
  },
];
