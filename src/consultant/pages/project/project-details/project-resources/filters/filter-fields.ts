import { FieldConfig } from '../../../../account-details-sidebar/components/filter/filterType';
import { fiscalOptions } from '../../../../account-details-sidebar/sidebar-pages/projects/utils';
import { requiredFieldFilterOptionsForText } from '../../project-task/filters/filter-fields';

const requiredFieldFilterOptionsForEnum: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
];

export const projectResourceFilterFields = (
  memoizedProjectResourceCode: { option: string; value: string }[],
  memoizedCountry: { option: string; value: string }[],
  region: { option: string; value: string }[],
  // resourceTypeOptions: { option: string; value: string }[], /* It may use in future, based on client confirmation */
  resourcepermissionMap?: Record<string, { read: boolean; edit: boolean }>,
  memoizedResourceStatus?: { option: string; value: string }[]
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
  // It may use in future, based on client confirmation
  // {
  //   name: 'Resource Type',
  //   value: 'resource_type_rid',
  //   type: 'enum',
  //   required: true,
  //   options: resourceTypeOptions,
  //   filterOptions: requiredFieldFilterOptionsForEnum,
  //   hide:
  //     !resourcepermissionMap?.['resource_type_rid']?.read &&
  //     !resourcepermissionMap?.['resource_type_rid']?.edit,
  // },
  {
    name: 'Project Resource Role',
    value: 'project_resource_role',
    type: 'text',
    hide:
      !resourcepermissionMap?.['project_resource_role']?.read &&
      !resourcepermissionMap?.['project_resource_role']?.edit,
  },
  {
    name: 'Effort Hours',
    value: 'total_hours_pro_res',
    type: 'number',
    hide:
      !resourcepermissionMap?.['total_cost_pro_res']?.read &&
      !resourcepermissionMap?.['total_cost_pro_res']?.edit,
  },
  {
    name: 'Net Resource Cost',
    value: 'net_total_cost_pro_res',
    type: 'number',
    hide:
      !resourcepermissionMap?.['net_total_cost_pro_res']?.read &&
      !resourcepermissionMap?.['net_total_cost_pro_res']?.edit,
  },
  {
    name: 'QRE Percent Final',
    value: 'qre_percent',
    type: 'text',
    hide:
      !resourcepermissionMap?.['rd_percent_final']?.read &&
      !resourcepermissionMap?.['rd_percent_final']?.edit,
  },
  {
    name: 'Status',
    value: 'status_rid',
    type: 'enum',
    options: memoizedResourceStatus,
    operatorOption: fiscalOptions,
    hide:
      !resourcepermissionMap?.['status_action']?.read &&
      !resourcepermissionMap?.['status_action']?.edit,
  },
  {
    name: 'Comments',
    value: 'description',
    type: 'text',
    hide:
      !resourcepermissionMap?.['description']?.read &&
      !resourcepermissionMap?.['description']?.edit,
  },
  // It may use in future, based on client confirmation
  {
    name: 'Project Resource ID',
    value: 'r_number',
    type: 'text',
    required: true,
    filterOptions: requiredFieldFilterOptionsForText,
    hide:
      !resourcepermissionMap?.['r_number']?.read &&
      !resourcepermissionMap?.['r_number']?.edit,
  },
  {
    name: 'Sort Options',
    value: 'sort_options',
    type: 'system-sort',
    options: [{ value: 'created_datetime_desc', option: 'Recently Created' }],
  },
];
