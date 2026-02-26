import { FilterSelectOption } from '../../../../../types/account-filter';
import {
  enumOptions,
  FieldConfig,
  numberOptions,
  textOptions,
} from '../../../../account-details-sidebar/components/filter/filterType';
import {
  fiscalOptions,
  nonMadatoryOptions,
  qualifiedEnumOptions,
  qualifiedOptions,
} from '../../../../account-details-sidebar/sidebar-pages/projects/utils';
import { requiredFieldFilterOptionsForText } from '../../../../project/project-details/project-task/filters/filter-fields';

export const selectProjectFilterFields = (
  classificationOption: FilterSelectOption[],
  projectTypeOptions: { option: string; value: string }[],
  statusOptions: { option: string; value: string }[],
  projectPermissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    name: 'Project Code',
    value: 'project_code',
    type: 'text',
    operatorOption: requiredFieldFilterOptionsForText,
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
    name: 'Qualified Status',
    value: 'is_qualified',
    type: 'enum',
    options: qualifiedOptions,
    operatorOption: qualifiedEnumOptions,
    hide:
      !projectPermissionMap?.['is_qualified']?.read &&
      !projectPermissionMap?.['is_qualified']?.edit,
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
    name: 'QRE Percent Final',
    value: 'rd_percent_final',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !projectPermissionMap?.['qre']?.read &&
      !projectPermissionMap?.['qre']?.edit,
  },
  {
    name: 'QRE Final',
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
      !projectPermissionMap?.['key_contacts']?.read &&
      !projectPermissionMap?.['key_contacts']?.edit,
  },
  {
    name: 'Technical Point of Contact',
    value: 'project_technical_point_of_contact',
    type: 'text',
    operatorOption: nonMadatoryOptions,
    hide:
      !projectPermissionMap?.['key_contacts']?.read &&
      !projectPermissionMap?.['key_contacts']?.edit,
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
];
