import { PROJECT_TYPE } from '../../../../../common-utils';
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
export const projectTypeOption = PROJECT_TYPE.map((year) => ({
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

export const booleanOptions: { option: string; value: string }[] = [
  { option: 'IsTrue', value: 'isTrue' },
  { option: 'IsFalse', value: 'isFalse' },
  { option: 'Is-Empty', value: 'is_empty' },
];

export const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
  { option: 'Not-Contains', value: 'not_contains' },
  { option: 'Is-Empty', value: 'is_empty' },
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

export const projectFilterFields: FieldConfig[] = [
  {
    name: 'Account Name',
    value: 'account_name',
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
    name: 'Customer Group',
    value: 'project_client_group',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Project Group',
    value: 'project_group',
    type: 'text',
    operatorOption: textOptions,
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
    operatorOption: textOptions,
  },
  {
    name: 'Project Type',
    value: 'project_type',
    type: 'enum',
    options: projectTypeOption,
    operatorOption: enumOptions,
  },
  {
    name: 'Project Classification',
    value: 'classification_name',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Project Effort (Hours)',
    value: 'total_effort',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Project Cost',
    value: 'total_cost',
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
    name: 'SubCon Cost',
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
    name: 'Assessment Status',
    value: 'assessment_status',
    type: 'enum',
    options: statusOptions,
    operatorOption: enumOptions,
  },
  {
    name: 'QRE %',
    value: 'qre',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Qualified Research Expenditure',
    value: 'qualified_research_expenditure',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Project Point of Contact',
    value: 'project_point_of_contact',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Technical Point of Contact',
    value: 'technical_point_of_contact',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Comments',
    value: 'comments',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'last Modified',
    value: 'modified_datetime',
    type: 'date',
  },
  {
    name: 'Project ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
  },
  // Text fields
  // {
  //   name: 'Project Code',
  //   value: 'project_code',
  //   type: 'text',
  //   operatorOption: textOptions,
  // },
  // {
  //   name: 'Project Name',
  //   value: 'project_name',
  //   type: 'text',
  //   operatorOption: textOptions,
  // },
  // {
  //   name: 'Fiscal Year',
  //   value: 'fiscal_year',
  //   type: 'enum',
  //   options: fiscalYearOption,
  //   operatorOption: enumOptions,
  // },
  // {
  //   name: 'Account Name',
  //   value: 'account_name',
  //   type: 'text',
  //   operatorOption: textOptions,
  // },
  // {
  //   name: 'Industry',
  //   value: 'industry',
  //   type: 'text',
  //   operatorOption: textOptions,
  // },
  // {
  //   name: 'Program Name',
  //   value: 'program_name',
  //   type: 'text',
  //   operatorOption: textOptions,
  // },
  // // Date fields
  // {
  //   name: 'Start Date',
  //   value: 'project_startdate',
  //   type: 'date',
  //   operatorOption: dateOptions,
  // },
  // {
  //   name: 'End Date',
  //   value: 'project_enddate',
  //   type: 'date',
  //   operatorOption: dateOptions,
  // },
  // {
  //   name: 'Qualified Research Expenditure',
  //   value: 'qualified_research_expenditure',
  //   type: 'number',
  //   operatorOption: numberOptions,
  // },
  // {
  //   name: 'is RD Qualifiled ?',
  //   value: 'is_rd_qualified',
  //   type: 'select',
  //   options: booleanOptions,
  // },
  // {
  //   name: 'QRE %',
  //   value: 'qre',
  //   type: 'number',
  //   operatorOption: numberOptions,
  // },
  // // Number fields
  // {
  //   name: 'Cost',
  //   value: 'total_cost',
  //   type: 'number',
  //   operatorOption: numberOptions,
  // },
  // {
  //   name: 'Effort in HRS',
  //   value: 'total_effort',
  //   type: 'number',
  //   operatorOption: numberOptions,
  // },
  // {
  //   name: 'No of FTE',
  //   value: 'total_fte',
  //   type: 'number',
  //   operatorOption: numberOptions,
  // },
  // {
  //   name: 'FTE Cost',
  //   value: 'total_fte_cost',
  //   type: 'number',
  //   operatorOption: numberOptions,
  // },
  // {
  //   name: 'No of Sub Con',
  //   value: 'total_sub_con',
  //   type: 'number',
  //   operatorOption: numberOptions,
  // },
  // {
  //   name: 'Sub-Con Cost',
  //   value: 'total_sub_con_cost',
  //   type: 'number',
  //   operatorOption: numberOptions,
  // },
  // {
  //   name: 'Non-Labor Cost',
  //   value: 'total_non_labor_cost',
  //   type: 'number',
  //   operatorOption: numberOptions,
  // },
  // {
  //   name: 'Comments',
  //   value: 'comments',
  //   type: 'text',
  //   operatorOption: textOptions,
  // },
  // {
  //   name: 'Country',
  //   value: 'country',
  //   type: 'text',
  //   operatorOption: textOptions,
  // },
  // {
  //   name: 'Currency',
  //   value: 'currency',
  //   type: 'text',
  //   operatorOption: textOptions,
  // },
  // {
  //   name: 'Region',
  //   value: 'region',
  //   type: 'text',
  //   operatorOption: textOptions,
  // },
  // {
  //   name: 'Status',
  //   value: 'project_status',
  //   type: 'enum',
  //   options: statusOptions,
  //   operatorOption: enumOptions,
  // },
  // {
  //   name: 'Project POC',
  //   value: 'comments',
  //   type: 'text',
  //   operatorOption: textOptions,
  // },
  // {
  //   name: 'Financial Consultant',
  //   value: 'financial_consultant',
  //   type: 'text',
  //   operatorOption: textOptions,
  // },
  // {
  //   name: 'Techanical Consultant  ',
  //   value: 'technical_consultant',
  //   type: 'text',
  //   operatorOption: textOptions,
  // },
  // {
  //   name: 'Project ID',
  //   value: 'r_number',
  //   type: 'text',
  //   operatorOption: textOptions,
  // },
];
