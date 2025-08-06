import { FilterSelectOption } from '../../../types/account-filter';
import { FieldConfig } from '../../account-details-sidebar/components/filter/filterType';
import {
  // dateOptions,
  enumOptions,
  fiscalYearOption,
  numberOptions,
  textOptions,
  fiscalOptions,
  nonMadatoryOptions,
} from '../../account-details-sidebar/sidebar-pages/projects/utils';

export const getAllProjectFilterFields = (
  classificationOption: FilterSelectOption[],
  projectTypeOptions: { option: string; value: string }[],
  statusOptions: { option: string; value: string }[],
  projectPermissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  // Text fields

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
    name: 'Name',
    value: 'project_name',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !projectPermissionMap?.['project_name']?.read &&
      !projectPermissionMap?.['project_name']?.edit,
  },
  {
    name: 'Project Type',
    value: 'project_type_rid',
    type: 'enum',
    options: projectTypeOptions,
    operatorOption: fiscalOptions,
    hide:
      !projectPermissionMap?.['project_type_rid']?.read &&
      !projectPermissionMap?.['project_type_rid']?.edit,
  },
  {
    name: 'Account Name',
    value: 'account_name',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !projectPermissionMap?.['account_name']?.read &&
      !projectPermissionMap?.['account_name']?.edit,
  },
  {
    name: 'Fiscal Year',
    value: 'fiscal_year',
    type: 'enum',
    options: fiscalYearOption,
    operatorOption: fiscalOptions,
    hide:
      !projectPermissionMap?.['fiscal_year']?.read &&
      !projectPermissionMap?.['fiscal_year']?.edit,
  },
  {
    name: 'Project Classification',
    value: 'classification_name',
    type: 'enum',
    options: classificationOption.map((item) => ({
      option: item.label,
      value: item.value,
    })),
    operatorOption: enumOptions,
    hide:
      !projectPermissionMap?.['project_classification_rid']?.read &&
      !projectPermissionMap?.['project_classification_rid']?.edit,
  },
  {
    name: 'Customer Group',
    value: 'project_client_group',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !projectPermissionMap?.['project_client_group']?.read &&
      !projectPermissionMap?.['project_client_group']?.edit,
  },
  {
    name: 'Project Group',
    value: 'project_group',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !projectPermissionMap?.['project_group']?.read &&
      !projectPermissionMap?.['project_group']?.edit,
  },
  {
    name: 'Project Effort (Hours)',
    value: 'total_effort',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !projectPermissionMap?.['total_effort']?.read &&
      !projectPermissionMap?.['total_effort']?.edit,
  },
  {
    name: 'Project Cost',
    value: 'total_cost',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !projectPermissionMap?.['total_cost']?.read &&
      !projectPermissionMap?.['total_cost']?.edit,
  },
  {
    name: 'FTE Cost',
    value: 'total_cost_fte',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !projectPermissionMap?.['total_cost_fte']?.read &&
      !projectPermissionMap?.['total_cost_fte']?.edit,
  },
  {
    name: 'SubCon Cost',
    value: 'total_cost_subcon',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !projectPermissionMap?.['total_cost_subcon']?.read &&
      !projectPermissionMap?.['total_cost_subcon']?.edit,
  },
  {
    name: 'Non-Labor Cost',
    value: 'total_cost_nonlabor',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !projectPermissionMap?.['total_cost_nonlabor']?.read &&
      !projectPermissionMap?.['total_cost_nonlabor']?.edit,
  },
  {
    name: 'Assessment Status',
    value: 'assessment_status',
    type: 'enum',
    options: statusOptions,
    operatorOption: enumOptions,
    hide:
      !projectPermissionMap?.['assessment_status']?.read &&
      !projectPermissionMap?.['assessment_status']?.edit,
  },
  {
    name: 'QRE %',
    value: 'qre',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !projectPermissionMap?.['qre']?.read &&
      !projectPermissionMap?.['qre']?.edit,
  },
  {
    name: 'QRE',
    value: 'qre_final',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !projectPermissionMap?.['qre_final']?.read &&
      !projectPermissionMap?.['qre_final']?.edit,
  },
  {
    name: 'Project Point of Contact',
    value: 'project_point_of_contact',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !projectPermissionMap?.['project_point_of_contact']?.read &&
      !projectPermissionMap?.['project_point_of_contact']?.edit,
  },
  {
    name: 'Technical Point of Contact',
    value: 'technical_point_of_contact',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !projectPermissionMap?.['technical_point_of_contact']?.read &&
      !projectPermissionMap?.['technical_point_of_contact']?.edit,
  },
  {
    name: 'Comments',
    value: 'comments',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !projectPermissionMap?.['comments']?.read &&
      !projectPermissionMap?.['comments']?.edit,
  },
  {
    name: 'Last Modified',
    value: 'modified_datetime',
    type: 'date',
    hide:
      !projectPermissionMap?.['modified_datetime']?.read &&
      !projectPermissionMap?.['modified_datetime']?.edit,
  },
  {
    name: 'Project ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
    hide:
      !projectPermissionMap?.['r_number']?.read &&
      !projectPermissionMap?.['r_number']?.edit,
  },
  {
    name: 'Sort Options',
    value: 'sort_options',
    type: 'system-sort',
    options: [{ value: 'created_datetime_desc', option: 'Recently Created' }],
  },
];
