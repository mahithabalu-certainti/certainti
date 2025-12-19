import { PROJECT_TYPE } from '../../../../../common-utils';
import { FieldConfig } from '../../../account-details-sidebar/components/filter/filterType';
import { fiscalYears } from '../../../resource-form/form-data';
import { requiredFieldFilterOptionsForEnum } from '../case-project-task/utils';

export const statusOptions: { option: string; value: string }[] = [
  { option: 'Active', value: 'Active' },
  { option: 'In-Active', value: 'Inactive' },
];
export const fiscalYearOptions = fiscalYears.map((year) => ({
  option: year.label,
  value: year.value,
}));
export const projectTypeOptions = PROJECT_TYPE.map((year) => ({
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
export const effortNumberOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Less-Than', value: 'less_than' },
  { option: 'Greater-Than', value: 'greater_than' },
  { option: 'Between', value: 'between' },
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
  // { option: 'Not-Contains', value: 'not_contains' },
  // { option: 'Is-Empty', value: 'is_empty' },
];
export const nonMadatoryOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
  { option: 'Is-Empty', value: 'is_empty' },
];
export const fiscalOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
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

export const caseProjectResourceFilterFields = (
  permissionMap?: Record<string, { read: boolean; edit: boolean }>,
  projectPermissionMap?: Record<string, { read: boolean; edit: boolean }>,
  memoizedCountry?: { option: string; value: string }[],
  region?: { option: string; value: string }[],
  memoizedTypeOptions?: { option: string; value: string }[],
  memoizedResourceStatus?: { option: string; value: string }[],
): FieldConfig[] => [
    {
      name: 'Resource Code',
      value: 'resource_code',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['resource_code']?.read &&
        !permissionMap?.['resource_code']?.edit,
    },
    {
      name: 'Resource Name',
      value: 'resource_name',
      type: 'text',
      operatorOption: nonMadatoryOptions,
      hide:
        !permissionMap?.['resource_name']?.read &&
        !permissionMap?.['resource_name']?.edit,
    },
    {
      name: 'Project Code',
      value: 'project_code',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !projectPermissionMap?.['project_code']?.read &&
        !projectPermissionMap?.['project_code']?.edit,
    },
    {
      name: 'Project Name',
      value: 'project_name',
      type: 'text',
      operatorOption: nonMadatoryOptions,
      hide:
        !projectPermissionMap?.['project_name']?.read &&
        !projectPermissionMap?.['project_name']?.edit,
    },
    {
      name: 'Resource Country',
      value: 'country_rid',
      type: 'enum',
      options: memoizedCountry,
      filterOptions: requiredFieldFilterOptionsForEnum,
      hide:
        !permissionMap?.['country_rid']?.read &&
        !permissionMap?.['country_rid']?.edit,
    },
    {
      name: 'Resource Region',
      value: 'region_rid',
      type: 'enum',
      options: region,
      dependsOn: 'country_rid',
      filterOptions: requiredFieldFilterOptionsForEnum,
      hide:
        !permissionMap?.['region_rid']?.read &&
        !permissionMap?.['region_rid']?.edit,
    },
    {
      name: 'Project Resource Role',
      value: 'project_resource_role',
      type: 'text',
      operatorOption: nonMadatoryOptions,
      hide:
        !permissionMap?.['project_resource_role']?.read &&
        !permissionMap?.['project_resource_role']?.edit,
    },
    {
      name: 'Resource Type',
      value: 'resource_type_rid',
      type: 'enum',
      options: memoizedTypeOptions,
      filterOptions: requiredFieldFilterOptionsForEnum,
      hide:
        !permissionMap?.['resource_type_name']?.read &&
        !permissionMap?.['resource_type_name']?.edit,
    },
    {
      name: 'Effort (Hours)',
      value: 'total_hours_pro_res',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['total_hours_pro_res']?.read &&
        !permissionMap?.['total_hours_pro_res']?.edit,
    },
    {
      name: 'Net Resource Cost',
      value: 'net_total_cost_pro_res',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['net_total_cost_pro_res']?.read &&
        !permissionMap?.['net_total_cost_pro_res']?.edit,
    },
    {
      name: 'QRE Final',
      value: 'qre_final',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['qre_final']?.read &&
        !permissionMap?.['qre_final']?.edit,
    },
    {
      name: 'Status',
      value: 'status_rid',
      type: 'enum',
      options: memoizedResourceStatus,
      operatorOption: fiscalOptions,
      hide:
        !permissionMap?.['status_rid']?.edit &&
        !permissionMap?.['status_rid']?.read,
    },
    {
      name: 'Comments',
      value: 'description',
      type: 'text',
      operatorOption: nonMadatoryOptions,
      hide:
        !permissionMap?.['description']?.read &&
        !permissionMap?.['description']?.edit,
    },
    {
      name: 'Project Resource ID',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
    },
  ];
