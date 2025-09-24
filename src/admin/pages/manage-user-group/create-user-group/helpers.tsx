import { fiscalYears } from '../../../../common-utils';
import {
  FieldConfig,
  FilterSelectOption,
} from '../../../../consultant/types/account-filter';

const textfieldOptions: { label: string; value: string }[] = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
];

const enumOperator: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not-Equals', value: 'not_equals' },
  { label: 'In', value: 'in' },
];

export const nonMadatoryOptions: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not-Equals', value: 'not_equals' },
  { label: 'Contains', value: 'contains' },
  { label: 'Is-Empty', value: 'is_empty' },
];

export const numberOptions: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not-Equals', value: 'not_equals' },
  { label: 'Less-Than', value: 'less_than' },
  { label: 'Greater-Than', value: 'greater_than' },
  { label: 'Between', value: 'between' },
  { label: 'Is-Empty', value: 'is_empty' },
];

const fiscalYearOption = fiscalYears.map((year) => ({
  label: year.label,
  value: year.value,
}));

export const getUserGroupFilterFields = (
  roleOptions: FilterSelectOption[]
): FieldConfig[] => [
  {
    label: 'Username',
    name: 'first_name',
    type: 'text',
    operatorOption: textfieldOptions,
  },
  {
    label: 'Email Address',
    name: 'email',
    type: 'text',
    operatorOption: textfieldOptions,
  },
  {
    label: 'Role Name',
    name: 'role_rid',
    type: 'enumSelect',
    options: roleOptions,
    operatorOption: enumOperator,
  },
  {
    label: 'Organisation Name',
    name: 'organization_name',
    type: 'text',
    operatorOption: textfieldOptions,
  },
];

export const getProjectFilterFields = (
  classificationOption: FilterSelectOption[],
  projectTypeOptions: { label: string; value: string }[],
  statusOptions: { label: string; value: string }[],
  projectPermissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    label: 'Project Code',
    name: 'project_code',
    type: 'text',
    operatorOption: textfieldOptions,
    hide:
      !projectPermissionMap?.['project_code']?.read &&
      !projectPermissionMap?.['project_code']?.edit,
  },
  {
    label: 'Name',
    name: 'project_name',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !projectPermissionMap?.['project_name']?.read &&
      !projectPermissionMap?.['project_name']?.edit,
  },
  {
    label: 'Project Type',
    name: 'project_type_rid',
    type: 'enumSelect',
    options: projectTypeOptions,
    operatorOption: enumOperator,
    hide:
      !projectPermissionMap?.['project_type_rid']?.read &&
      !projectPermissionMap?.['project_type_rid']?.edit,
  },
  {
    label: 'Fiscal Year',
    name: 'fiscal_year',
    type: 'enumSelect',
    options: fiscalYearOption,
    operatorOption: enumOperator,
    hide:
      !projectPermissionMap?.['fiscal_year']?.read &&
      !projectPermissionMap?.['fiscal_year']?.edit,
  },
  {
    label: 'Project Classification',
    name: 'classification_name',
    type: 'enumSelect',
    options: classificationOption,
    operatorOption: enumOperator,
    hide:
      !projectPermissionMap?.['project_classification_rid']?.read &&
      !projectPermissionMap?.['project_classification_rid']?.edit,
  },
  {
    label: 'Customer Group',
    name: 'project_client_group',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !projectPermissionMap?.['project_client_group']?.read &&
      !projectPermissionMap?.['project_client_group']?.edit,
  },
  {
    label: 'Project Group',
    name: 'project_group',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !projectPermissionMap?.['project_group']?.read &&
      !projectPermissionMap?.['project_group']?.edit,
  },
  {
    label: 'Project Effort (Hours)',
    name: 'total_effort',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !projectPermissionMap?.['total_effort']?.read &&
      !projectPermissionMap?.['total_effort']?.edit,
  },
  {
    label: 'Project Cost',
    name: 'total_cost',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !projectPermissionMap?.['total_cost']?.read &&
      !projectPermissionMap?.['total_cost']?.edit,
  },
  {
    label: 'FTE Cost',
    name: 'total_cost_fte',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !projectPermissionMap?.['total_cost_fte']?.read &&
      !projectPermissionMap?.['total_cost_fte']?.edit,
  },
  {
    label: 'SubCon Cost',
    name: 'total_cost_subcon',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !projectPermissionMap?.['total_cost_subcon']?.read &&
      !projectPermissionMap?.['total_cost_subcon']?.edit,
  },
  {
    label: 'Non-Labor Cost',
    name: 'total_cost_nonlabor',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !projectPermissionMap?.['total_cost_nonlabor']?.read &&
      !projectPermissionMap?.['total_cost_nonlabor']?.edit,
  },
  {
    label: 'Assessment Status',
    name: 'assessment_status',
    type: 'enumSelect',
    options: statusOptions,
    operatorOption: enumOperator,
    hide:
      !projectPermissionMap?.['assessment_status']?.read &&
      !projectPermissionMap?.['assessment_status']?.edit,
  },
  {
    label: 'QRE %',
    name: 'rd_percent_potential_ai',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !projectPermissionMap?.['qre']?.read &&
      !projectPermissionMap?.['qre']?.edit,
  },
  {
    label: 'QRE',
    name: 'qre_final',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !projectPermissionMap?.['qre_final']?.read &&
      !projectPermissionMap?.['qre_final']?.edit,
  },
  {
    label: 'Project Point of Contact',
    name: 'project_point_of_contact',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !projectPermissionMap?.['project_point_of_contact']?.read &&
      !projectPermissionMap?.['project_point_of_contact']?.edit,
  },
  {
    label: 'Technical Point of Contact',
    name: 'technical_point_of_contact',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !projectPermissionMap?.['technical_point_of_contact']?.read &&
      !projectPermissionMap?.['technical_point_of_contact']?.edit,
  },
  {
    label: 'Comments',
    name: 'comments',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !projectPermissionMap?.['comments']?.read &&
      !projectPermissionMap?.['comments']?.edit,
  },
  {
    label: 'Last Modified',
    name: 'modified_datetime',
    type: 'date',
    hide:
      !projectPermissionMap?.['modified_datetime']?.read &&
      !projectPermissionMap?.['modified_datetime']?.edit,
  },
  {
    label: 'Project ID',
    name: 'r_number',
    type: 'text',
    operatorOption: textfieldOptions,
    hide:
      !projectPermissionMap?.['r_number']?.read &&
      !projectPermissionMap?.['r_number']?.edit,
  },
];
