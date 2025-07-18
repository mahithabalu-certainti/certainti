import { FieldConfig } from '../../../../account-details-sidebar/components/filter/filterType';

// const requiredFieldFilterOptionsForText: { option: string; value: string }[] = [
//   { option: 'Equals', value: 'equals' },
//   { option: 'Not Equals', value: 'not_equals' },
//   { option: 'Contains', value: 'contains' },
// ];
const requiredFieldFilterOptionsForEnum: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
];

export const projectResourceFilterFields = (
  memoizedProjectResourceCode: { option: string; value: string }[],
  memoizedCountry: { option: string; value: string }[],
  region: { option: string; value: string }[],
  resourceTypeOptions: { option: string; value: string }[],
  resourcepermissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    name: 'Resource Code',
    value: 'resource_code',
    type: 'enum',
    required: true,
    options: memoizedProjectResourceCode,
    filterOptions: requiredFieldFilterOptionsForEnum,
    hide:
      !resourcepermissionMap?.['resource_code']?.read &&
      !resourcepermissionMap?.['resource_code']?.edit,
  },
  {
    name: 'Resource Name',
    value: 'resource_name',
    type: 'text',
    hide:
      !resourcepermissionMap?.['resource_name']?.read &&
      !resourcepermissionMap?.['resource_name']?.edit,
  },
  {
    name: 'Resource Country',
    value: 'country_rid',
    type: 'enum',
    options: memoizedCountry,
    filterOptions: requiredFieldFilterOptionsForEnum,
    hide:
      !resourcepermissionMap?.['country_rid']?.read &&
      !resourcepermissionMap?.['country_rid']?.edit,
  },
  {
    name: 'Resource Region',
    value: 'region_rid',
    type: 'enum',
    options: region,
    dependsOn: 'country_rid',
    filterOptions: requiredFieldFilterOptionsForEnum,
    hide:
      !resourcepermissionMap?.['region_rid']?.read &&
      !resourcepermissionMap?.['region_rid']?.edit,
  },
  {
    name: 'Resource Type',
    value: 'resource_type_rid',
    type: 'enum',
    required: true,
    options: resourceTypeOptions,
    filterOptions: requiredFieldFilterOptionsForEnum,
    hide:
      !resourcepermissionMap?.['resource_type_rid']?.read &&
      !resourcepermissionMap?.['resource_type_rid']?.edit,
  },

  {
    name: 'Resource Role',
    value: 'resource_role',
    type: 'text',
    hide:
      !resourcepermissionMap?.['resource_role']?.read &&
      !resourcepermissionMap?.['resource_role']?.edit,
  },

  {
    name: 'Effort Hours',
    value: 'total_hours_pro_res',
    type: 'text',
    hide:
      !resourcepermissionMap?.['total_cost_pro_res']?.read &&
      !resourcepermissionMap?.['total_cost_pro_res']?.edit,
  },
  {
    name: 'Cost',
    value: 'total_cost_pro_res',
    type: 'text',
    hide:
      !resourcepermissionMap?.['total_cost_pro_res']?.read &&
      !resourcepermissionMap?.['total_cost_pro_res']?.edit,
  },
  {
    name: 'QRE %',
    value: 'qre_percent',
    type: 'text',
    hide:
      !resourcepermissionMap?.['qre_percent']?.read &&
      !resourcepermissionMap?.['qre_percent']?.edit,
  },
  {
    name: 'QRE',
    value: 'qre_final',
    type: 'text',
    hide:
      !resourcepermissionMap?.['qre_final']?.read &&
      !resourcepermissionMap?.['qre_final']?.edit,
  },
  {
    name: 'Comments',
    value: 'description',
    type: 'text',
    hide:
      !resourcepermissionMap?.['description']?.read &&
      !resourcepermissionMap?.['description']?.edit,
  },
  //   {
  //     name: 'Resource ID',
  //     value: 'r_number',
  //     type: 'text',
  //     required: true,
  //     filterOptions: requiredFieldFilterOptionsForText,
  //     // hide:
  //     //   !resourcepermissionMap?.['r_number']?.read &&
  //     //   !resourcepermissionMap?.['r_number']?.edit,
  //   },
  {
    name: 'Sort Options',
    value: 'sort_options',
    type: 'system-sort',
    options: [{ value: 'created_datetime_desc', option: 'Recently Created' }],
  },
];
