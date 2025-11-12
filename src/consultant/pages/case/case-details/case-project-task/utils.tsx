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

export const caseProjectTaskFilterFields = (): FieldConfig[] => [
  {
    name: 'Project Code',
    value: 'project_code',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Project Name',
    value: 'project_name',
    type: 'text',
    operatorOption: nonMadatoryOptions,
  },
  {
    name: 'Resource Code',
    value: 'resource_code',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Resource Name',
    value: 'resource_name',
    type: 'text',
    operatorOption: nonMadatoryOptions,
  },
  {
    name: 'Task Name',
    value: 'task_name',
    type: 'text',
    operatorOption: nonMadatoryOptions,
  },
  {
    name: 'Resource Type',
    value: 'resource_type',
    type: 'text',
    operatorOption: nonMadatoryOptions,
  },
  {
    name: 'Project Resource Role',
    value: 'project_resource_role',
    type: 'text',
    operatorOption: nonMadatoryOptions,
  },
  {
    name: 'Task Type',
    value: 'task_type',
    type: 'text',
    operatorOption: nonMadatoryOptions,
  },
  {
    name: 'Classification Type',
    value: 'classification_type',

    type: 'text',
    operatorOption: nonMadatoryOptions,
  },
  {
    name: 'Start Date',
    value: 'start_date',
    type: 'date',
    operatorOption: dateOptions,
  },
  {
    name: 'End Date',
    value: 'end_date',
    type: 'date',
    operatorOption: dateOptions,
  },
  {
    name: 'Cost',
    value: 'cost',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Effort (Hours)',
    value: 'effort_hours',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Status',
    value: 'status',
    type: 'text',
    operatorOption: nonMadatoryOptions,
  },
  {
    name: 'Comments',
    value: 'comments',
    type: 'text',
    operatorOption: nonMadatoryOptions,
  },
  {
    name: 'Project Task ID',
    value: 'project_task_id',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Sort Options',
    value: 'sort_options',
    type: 'system-sort',
    options: [{ value: 'created_datetime_desc', option: 'Recently Created' }],
  },
];
