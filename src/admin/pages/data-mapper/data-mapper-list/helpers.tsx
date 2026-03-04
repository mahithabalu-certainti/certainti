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

const booleanOptions: { label: string; value: string }[] = [
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
];

export const getDataMapperFilterFields = (
  statusOptions: { label: string; value: string }[],
  countryOptions: { label: string; value: string }[],
  regionOptions: { label: string; value: string }[],
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  return [
    {
      label: 'Form ID',
      name: 'r_number',
      type: 'text',
      operatorOption: textfieldOptions,
      hide:
        !permissionMap?.['r_number']?.read &&
        !permissionMap?.['r_number']?.edit,
    },
    {
      label: 'Form Name',
      name: 'form_name',
      type: 'text',
      operatorOption: textfieldOptions,
      hide:
        !permissionMap?.['form_name']?.read &&
        !permissionMap?.['form_name']?.edit,
    },
    {
      label: 'Is Federal?',
      name: 'is_federal',
      type: 'enumSelect',
      options: booleanOptions,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['is_federal']?.read &&
        !permissionMap?.['is_federal']?.edit,
    },
    {
      label: 'Country',
      name: 'country_rid',
      onChange: true,
      type: 'enumSelect',
      options: countryOptions,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['country_rid']?.read &&
        !permissionMap?.['country_rid']?.edit,
    },
    {
      label: 'Region',
      name: 'state_rid',
      type: 'enumSelect',
      dependsOn: 'country_rid',
      options: regionOptions,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['state_rid']?.read &&
        !permissionMap?.['state_rid']?.edit,
    },
    {
      label: 'Effective From Date',
      name: 'effective_from_date',
      type: 'date',
      operatorOption: requiredDateOptions,
      isFutureDateEnabled: true,
      hide:
        !permissionMap?.['effective_from_date']?.read &&
        !permissionMap?.['effective_from_date']?.edit,
    },
    {
      label: 'Effective To Date',
      name: 'effective_to_date',
      type: 'date',
      operatorOption: requiredDateOptions,
      isFutureDateEnabled: true,
      hide:
        !permissionMap?.['effective_to_date']?.read &&
        !permissionMap?.['effective_to_date']?.edit,
    },
    {
      name: 'status_rid',
      label: 'Status',
      type: 'enumSelect',
      options: statusOptions,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['status_rid']?.read &&
        !permissionMap?.['status_rid']?.edit,
    },
    {
      name: 'document_name',
      label: 'Document Name',
      type: 'text',
      operatorOption: textfieldOptions,
      hide:
        !permissionMap?.['document_name']?.read &&
        !permissionMap?.['document_name']?.edit,
    },
    {
      label: 'Created By',
      name: 'created_by_name',
      type: 'text',
      operatorOption: textfieldOptions,
      hide:
        !permissionMap?.['created_by']?.read &&
        !permissionMap?.['created_by']?.edit,
    },
    {
      label: 'Created On',
      name: 'created_datetime',
      type: 'date',
      operatorOption: requiredDateOptions,
      hide:
        !permissionMap?.['created_datetime']?.read &&
        !permissionMap?.['created_datetime']?.edit,
    },
    {
      label: 'Updated By',
      name: 'modified_by_name',
      type: 'text',
      operatorOption: nonReqTextfieldOptions,
      hide:
        !permissionMap?.['modified_by']?.read &&
        !permissionMap?.['modified_by']?.edit,
    },
    {
      label: 'Updated On',
      name: 'modified_datetime',
      type: 'date',
      operatorOption: dateOptions,
      hide:
        !permissionMap?.['modified_datetime']?.read &&
        !permissionMap?.['modified_datetime']?.edit,
    },
    {
      label: 'Sort Options',
      name: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'createdAt_desc', label: 'Recently Created' }],
    },
  ];
};
