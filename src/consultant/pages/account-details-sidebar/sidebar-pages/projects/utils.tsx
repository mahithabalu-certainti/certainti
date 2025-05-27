import { fiscalYears } from '../../../resource-form/form-data';
import { FieldConfig } from '../../components/filter/filterType';

export const statusOptions: { option: string; value: string }[] = [
  { option: 'Active', value: 'Active' },
  { option: 'In-Active', value: 'Inactive' },
];
export const fiscalYearOption = fiscalYears.map((year) => ({
  option: year.label,
  value: year.value,
}));
export const numberOptions: { option: string; value: string }[] = [
  { option: '=', value: 'equals' },
  { option: '≠', value: 'not_equals' },
  { option: '<', value: 'less_than' },
  { option: '>', value: 'greater_than' },
  { option: '↔', value: 'between' },
  { option: '∅', value: 'is_empty' },
];
export const textOptions: { option: string; value: string }[] = [
  { option: '=', value: 'equals' },
  { option: '≠', value: 'not_equals' },
  { option: '∈', value: 'contains' },
  { option: '∉', value: 'not_contains' },
  { option: '∅', value: 'is_empty' },
];

export const enumOptions: { option: string; value: string }[] = [
  { option: '=', value: 'equals' },
  { option: '≠', value: 'not_equals' },
  { option: '⊂', value: 'in' },
  { option: '∅', value: 'is_empty' },
];

export const dateOptions: { option: string; value: string }[] = [
  { option: '=', value: 'equals' },
  { option: '←', value: 'before' },
  { option: '→', value: 'after' },
  { option: '↔', value: 'between' },
  { option: '∅', value: 'is_empty' },
];

export const projectFilterFields: FieldConfig[] = [
  // Text fields
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
    operatorOption: textOptions,
  },
  {
    name: 'Fiscal Year',
    value: 'fiscal_year',
    type: 'enum',
    options: fiscalYearOption,
    operatorOption: enumOptions,
  },
  {
    name: 'Account Name',
    value: 'account_name',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Industry',
    value: 'industry',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Program Name',
    value: 'program_name',
    type: 'text',
    operatorOption: textOptions,
  },
  // Date fields
  {
    name: 'Start Date',
    value: 'project_startdate',
    type: 'date',
    operatorOption: dateOptions,
  },
  {
    name: 'End Date',
    value: 'project_enddate',
    type: 'date',
    operatorOption: dateOptions,
  },
  {
    name: 'Qualified Research Expenditure',
    value: 'qualified_research_expenditure',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'is RD Qualifiled ?',
    value: 'qre',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'QRE %',
    value: 'qre',
    type: 'number',
    operatorOption: numberOptions,
  },
  // Number fields
  {
    name: 'Cost',
    value: 'total_cost',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Effort in HRS',
    value: 'total_effort',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'No of FTE',
    value: 'total_fte',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'FTE Cost',
    value: 'total_fte_cost',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'No of Sub Con',
    value: 'total_sub_con',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Sub-Con Cost',
    value: 'total_sub_con_cost',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Non-Labor Cost',
    value: 'total_non_labor_cost',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Comments',
    value: 'comments',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Country',
    value: 'country',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Currency',
    value: 'currency',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Region',
    value: 'region',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Status',
    value: 'project_status',
    type: 'enum',
    options: statusOptions,
    operatorOption: enumOptions,
  },
  {
    name: 'Project POC',
    value: 'comments',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Financial Consultant',
    value: 'financial_consultant',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Techanical Consultant  ',
    value: 'technical_consultant',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Project ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
  },
];
