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

export const caseProjectResourceFilterFields = (): FieldConfig[] => [
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
    name: 'Resource Country',
    value: 'resource_country',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Resource Region',
    value: 'resource_region',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Project Resource Role',
    value: 'project_resource_role',
    type: 'text',
    operatorOption: nonMadatoryOptions,
  },
  {
    name: 'Resource Type',
    value: 'resource_type',
    type: 'text',
    operatorOption: textOptions,
    // options: [
    //   { option: 'FTE', value: 'FTE' },
    //   { option: 'SubCon', value: 'SubCon' },
    //   { option: 'Non-Labor', value: 'Non-Labor' },
    // ],
    // operatorOption: enumOptions,
  },
  {
    name: 'Effort (Hours)',
    value: 'effort_hours',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Net Resource Cost',
    value: 'net_resource_cost',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'QRE Final (%)',
    value: 'qre_final',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Comments',
    value: 'comments',
    type: 'text',
    operatorOption: nonMadatoryOptions,
  },
  {
    name: 'Project Resource ID',
    value: 'project_resource_id',
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
