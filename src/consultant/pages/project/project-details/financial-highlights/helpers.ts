import {
  FieldConfig,
  numberOptions,
} from '../../../account-details-sidebar/components/filter/filterType';

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

export const getProjectFinancialResCostFields = (
  countryOptions: { option: string; value: string }[],
  regionOptions: { option: string; value: string }[],
  resourceTypeOptions: { option: string; value: string }[]
): FieldConfig[] => [
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
    name: 'Region',
    value: 'region_rid',
    type: 'enum',
    dependsOn: 'country_rid',
    options: regionOptions,
  },
  {
    name: 'Cost',
    value: 'total_cost_pro_res',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'RD %',
    value: 'rd_percent_final',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Project QRE',
    value: 'qre_final',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'RD Credit',
    value: 'rd_credits_total',
    type: 'number',
    operatorOption: numberOptions,
  },
];
