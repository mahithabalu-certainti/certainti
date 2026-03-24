import { FieldConfig } from '../../../account-details-sidebar/components/filter/filterType';

export const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
];

const requiredForEnum: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
];

const numberOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Less-Than', value: 'less_than' },
  { option: 'Greater-Than', value: 'greater_than' },
  { option: 'Between', value: 'between' },
  { option: 'Is-Empty', value: 'is_empty' },
];

export const getAccountFinancialResCostFields = (
  fiscalYearOptions: { option: string; value: string }[],
  countryOptions: { option: string; value: string }[],
  resourceTypeOptions: { option: string; value: string }[]
): FieldConfig[] => [
  {
    name: 'Project Code',
    value: 'project_code',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Fiscal Year',
    value: 'fiscal_year',
    type: 'enum',
    options: fiscalYearOptions,
    operatorOption: requiredForEnum,
  },
  {
    name: 'Project Name',
    value: 'project_name',
    type: 'text',
  },
  {
    name: 'Project ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
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
    operatorOption: textOptions,
  },
  {
    name: 'Resource Type',
    value: 'resource_type_rid',
    type: 'enum',
    options: resourceTypeOptions,
    operatorOption: requiredForEnum,
  },
  {
    name: 'Country',
    value: 'country_rid',
    type: 'enum',
    onChange: true,
    options: countryOptions,
  },
  {
    name: 'Net Resource Cost',
    value: 'total_cost_pro_res',
    type: 'number',
    operatorOption: numberOptions,
  },
];

export const getAccountFinancialProjectCostFields = (
  fiscalYearOptions: { option: string; value: string }[]
): FieldConfig[] => [
  {
    name: 'Project Code',
    value: 'project_code',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Fiscal Year',
    value: 'fiscal_year',
    type: 'enum',
    options: fiscalYearOptions,
    operatorOption: requiredForEnum,
  },
  {
    name: 'Project Name',
    value: 'project_name',
    type: 'text',
  },
  {
    name: 'Project ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'FTE Cost',
    value: 'total_cost_fte_prj',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Sub Con Cost',
    value: 'total_cost_subcon_prj',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Non Labor Cost',
    value: 'total_cost_nonlabor_prj',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Project Cost',
    value: 'total_cost_prj',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'QRE Percent Final',
    value: 'rd_percent_final',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'QRE Final',
    value: 'qre_final',
    type: 'number',
    operatorOption: numberOptions,
  },
];
