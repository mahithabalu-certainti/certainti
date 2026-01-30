import { FieldConfig } from '../../../../consultant/types/account-filter';

const textfieldOptions: { label: string; value: string }[] = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
];

export const enumOperator: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'In', value: 'in' },
];

const dateOptions: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Before', value: 'before' },
  { label: 'After', value: 'after' },
  { label: 'Between', value: 'between' },
  { label: 'Is Empty', value: 'is_empty' },
];

const numberOptions: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'Less Than', value: 'less_than' },
  { label: 'Greater Than', value: 'greater_than' },
  { label: 'Between', value: 'between' },
];

const requiredDateOptions: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Before', value: 'before' },
  { label: 'After', value: 'after' },
  { label: 'Between', value: 'between' },
];

const nonReqTextfieldOptions: { label: string; value: string }[] = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'Is Empty', value: 'is_empty' },
];

export const getDataMapperFilterFields = (
  statusOptions: { label: string; value: string }[],
  countryOptions: { label: string; value: string }[],
  regionOptions: { label: string; value: string }[]
): FieldConfig[] => {
  return [
    {
      label: 'Form ID',
      name: 'r_number',
      type: 'text',
      operatorOption: textfieldOptions,
    },
    {
      label: 'Name',
      name: 'form_name',
      type: 'text',
      operatorOption: textfieldOptions,
    },
    {
      name: 'document_name',
      label: 'Document Name',
      type: 'text',
      operatorOption: textfieldOptions,
    },
    {
      label: 'Format',
      name: 'format',
      type: 'text',
      operatorOption: textfieldOptions,
    },
    {
      label: 'Size',
      name: 'size_in_mb',
      type: 'number',
      operatorOption: numberOptions,
    },
    {
      label: 'Country',
      name: 'country_rid',
      onChange: true,
      type: 'enumSelect',
      options: countryOptions,
      operatorOption: enumOperator,
    },
    {
      label: 'Region',
      name: 'state_rid',
      type: 'enumSelect',
      dependsOn: 'country_rid',
      options: regionOptions,
      operatorOption: enumOperator,
    },
    {
      label: 'Effective From Date',
      name: 'effective_from_date',
      type: 'date',
      operatorOption: requiredDateOptions,
      isFutureDateEnabled: true,
    },
    {
      label: 'Effective To Date',
      name: 'effective_to_date',
      type: 'date',
      operatorOption: requiredDateOptions,
      isFutureDateEnabled: true,
    },
    {
      name: 'status_rid',
      label: 'Status',
      type: 'enumSelect',
      options: statusOptions,
    },
    {
      label: 'Created By',
      name: 'created_by_name',
      type: 'text',
      operatorOption: textfieldOptions,
    },
    {
      label: 'Created On',
      name: 'created_datetime',
      type: 'date',
      operatorOption: requiredDateOptions,
    },
    {
      label: 'Updated By',
      name: 'modified_by_name',
      type: 'text',
      operatorOption: nonReqTextfieldOptions,
    },
    {
      label: 'Updated On',
      name: 'modified_datetime',
      type: 'date',
      operatorOption: dateOptions,
    },
  ];
};
