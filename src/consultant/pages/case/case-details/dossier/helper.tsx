import { FieldConfig } from '../../../account-details-sidebar/components/filter/filterType';

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

// const enumOptions: { option: string; value: string }[] = [
//   { option: 'Equals', value: 'equals' },
//   { option: 'Not Equals', value: 'not_equals' },
//   { option: 'In', value: 'in' },
// ];

// const dateOptions: { option: string; value: string }[] = [
//   { option: 'Equals', value: 'equals' },
//   { option: 'Before', value: 'before' },
//   { option: 'After', value: 'after' },
//   { option: 'Between', value: 'between' },
// ];

const numberOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Less Than', value: 'less_than' },
  { option: 'Greater Than', value: 'greater_than' },
  { option: 'Between', value: 'between' },
];

export const getProjectDocumentsFilterFields =
  () //   permissionMap: Record<string, { read: boolean; edit: boolean }>
  : FieldConfig[] => [
    {
      name: 'Project Number',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Project Ref Id',
      value: 'project_ref_id',
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
      name: 'Document Number',
      value: 'document_number',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Document Type',
      value: 'document_type',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Document Name',
      value: 'document_name',
      type: 'text',
      operatorOption: textOptions,
    },
  ];

export const getProjectSummaryFilterFields = (): FieldConfig[] => [
  {
    name: 'Project Number',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Project Ref Id',
    value: 'project_ref_id',
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
    name: 'FTE Cost',
    value: 'fte_cost',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Sub Con Cost',
    value: 'sub_con_cost',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Non Labour Cost',
    value: 'non_labour_cost',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Project Cost',
    value: 'project_cost',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'RD %',
    value: 'rd_percentage',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Project QRE',
    value: 'project_qre',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'RD Credit',
    value: 'rd_credit',
    type: 'number',
    operatorOption: numberOptions,
  },
];

export const getResourceSummaryFilterFields = (): FieldConfig[] => [
  {
    name: 'Project Number',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Project Ref Id',
    value: 'project_ref_id',
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
    name: 'Resource Ref Id',
    value: 'resource_ref_id',
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
    value: 'resource_type',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Country / Region',
    value: 'country_region',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Cost',
    value: 'cost',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'RD %',
    value: 'rd_percentage',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'QRE',
    value: 'qre',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'RD Credit',
    value: 'rd_credit',
    type: 'number',
    operatorOption: numberOptions,
  },
];
