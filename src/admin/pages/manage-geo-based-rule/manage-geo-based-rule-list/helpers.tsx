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

const booleanOptions: { label: string; value: string }[] = [
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
];
const nonReqTextfieldOptions: { label: string; value: string }[] = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'Is Empty', value: 'is_empty' },
];
export const getGeoBasedRuleFilterFields = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  statusOptions: { label: string; value: string }[],
  countryOptions: { label: string; value: string }[],
  regionOptions: { label: string; value: string }[]
): FieldConfig[] => {
  return [
    {
      label: 'Jurisdiction Rule ID',
      name: 'r_number',
      type: 'text',
      operatorOption: textfieldOptions,
      hide:
        !permissionMap?.['r_number']?.read &&
        !permissionMap?.['r_number']?.edit,
    },
    {
      label: 'Configuration Name',
      name: 'config_name',
      type: 'text',
      operatorOption: textfieldOptions,
      hide:
        !permissionMap?.['config_name']?.read &&
        !permissionMap?.['config_name']?.edit,
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
      label: 'Start Date',
      name: 'effective_start_date',
      type: 'date',
      operatorOption: requiredDateOptions,
      isFutureDateEnabled: true,
      hide:
        !permissionMap?.['effective_start_date']?.read &&
        !permissionMap?.['effective_start_date']?.edit,
    },
    {
      label: 'End Date',
      name: 'effective_end_date',
      type: 'date',
      operatorOption: dateOptions,
      isFutureDateEnabled: true,
      hide:
        !permissionMap?.['effective_end_date']?.read &&
        !permissionMap?.['effective_end_date']?.edit,
    },

    {
      label: 'Created By',
      name: 'created_user_name',
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
      name: 'modified_user_name',
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
      label: 'Status',
      name: 'status_rid',
      type: 'enumSelect',
      options: statusOptions,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['status_rid']?.read &&
        !permissionMap?.['status_rid']?.edit,
    },
    {
      label: 'Sort Options',
      name: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'createdAt_desc', label: 'Recently Created' }],
    },
  ];
};
