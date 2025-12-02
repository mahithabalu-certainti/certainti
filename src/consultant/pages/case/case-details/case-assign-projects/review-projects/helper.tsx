import { FilterSelectOption } from '../../../../../types/account-filter';
import {
  enumOptions,
  FieldConfig,
  numberOptions,
} from '../../../../account-details-sidebar/components/filter/filterType';
import {
  fiscalOptions,
  nonMadatoryOptions,
} from '../../../../account-details-sidebar/sidebar-pages/projects/utils';
import { requiredFieldFilterOptionsForText } from '../../../../project/project-details/project-task/filters/filter-fields';

export const reviewProjectFilterFields = (
  classificationOption: FilterSelectOption[],
  projectTypeOptions: { option: string; value: string }[],
  industryOptions: { option: string; value: string }[],
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
      name: 'Project Type',
      value: 'project_type_name',
      type: 'enum',
      options: projectTypeOptions,
      operatorOption: fiscalOptions,
      hide:
        !projectPermissionMap?.['project_type_rid']?.read &&
        !projectPermissionMap?.['project_type_rid']?.edit,
    },
    {
      name: 'Classification',
      value: 'project_classification_name',
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
      name: 'Project Group',
      value: 'project_group',
      type: 'text',
      operatorOption: nonMadatoryOptions,
      hide:
        !projectPermissionMap?.['project_group']?.read &&
        !projectPermissionMap?.['project_group']?.edit,
    },
    {
      name: 'Industry',
      value: 'industry_name',
      type: 'enum',
      options: industryOptions,
      operatorOption: enumOptions,
      hide:
        !projectPermissionMap?.['industry_rid']?.read &&
        !projectPermissionMap?.['industry_rid']?.edit,
    },
    {
      name: 'Primary Point of Contact',
      value: 'project_point_of_contact',
      type: 'text',
      operatorOption: nonMadatoryOptions,
      hide:
        !projectPermissionMap?.['primary_point_of_contact']?.read &&
        !projectPermissionMap?.['primary_point_of_contact']?.edit,
    },
    {
      name: 'Primary Point of Contact Email',
      value: 'project_point_of_contact_email',
      type: 'text',
      operatorOption: nonMadatoryOptions,
      hide:
        !projectPermissionMap?.['primary_point_of_contact_email']?.read &&
        !projectPermissionMap?.['primary_point_of_contact_email']?.edit,
    },
    {
      name: 'Total FTE Count',
      value: 'total_fte_prj',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !projectPermissionMap?.['total_fte_prj']?.read &&
        !projectPermissionMap?.['total_fte_prj']?.edit,
    },
    {
      name: 'Total Sub Con Count',
      value: 'total_subcon_prj',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !projectPermissionMap?.['total_subcon_prj']?.read &&
        !projectPermissionMap?.['total_subcon_prj']?.edit,
    },
    {
      name: 'Total Non Labor Count',
      value: 'total_nonlabor_prj',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !projectPermissionMap?.['total_nonlabor_prj']?.read &&
        !projectPermissionMap?.['total_nonlabor_prj']?.edit,
    },
    {
      name: 'Total FTE Effort',
      value: 'total_effort_fte_prj',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !projectPermissionMap?.['total_effort_fte_prj']?.read &&
        !projectPermissionMap?.['total_effort_fte_prj']?.edit,
    },
    {
      name: 'Total Sub Con Effort',
      value: 'total_effort_subcon_prj',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !projectPermissionMap?.['total_effort_subcon_prj']?.read &&
        !projectPermissionMap?.['total_effort_subcon_prj']?.edit,
    },
    {
      name: 'Total Effort in Hrs',
      value: 'total_effort_prj',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !projectPermissionMap?.['total_effort_prj']?.read &&
        !projectPermissionMap?.['total_effort_prj']?.edit,
    },
    {
      name: 'Total FTE Cost',
      value: 'total_cost_fte_prj',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !projectPermissionMap?.['total_cost_fte_prj']?.read &&
        !projectPermissionMap?.['total_cost_fte_prj']?.edit,
    },
    {
      name: 'Total Sub Con Cost',
      value: 'total_cost_subcon_prj',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !projectPermissionMap?.['total_cost_subcon_prj']?.read &&
        !projectPermissionMap?.['total_cost_subcon_prj']?.edit,
    },
    {
      name: 'Total Non Labor Cost',
      value: 'total_cost_nonlabor_prj',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !projectPermissionMap?.['total_cost_nonlabor_prj']?.read &&
        !projectPermissionMap?.['total_cost_nonlabor_prj']?.edit,
    },
    {
      name: 'Total Cost',
      value: 'total_cost_prj',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !projectPermissionMap?.['total_cost_prj']?.read &&
        !projectPermissionMap?.['total_cost_prj']?.edit,
    },
    {
      name: 'Number of Project Resource',
      value: 'total_resources_prj',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !projectPermissionMap?.['total_resources_prj']?.read &&
        !projectPermissionMap?.['total_resources_prj']?.edit,
    },
    {
      name: 'Number of Project Task',
      value: 'total_tasks',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !projectPermissionMap?.['total_tasks']?.read &&
        !projectPermissionMap?.['total_tasks']?.edit,
    },
    {
      name: 'Number of Technical Summary Generated',
      value: 'total_technical_summaries',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !projectPermissionMap?.['total_technical_summaries']?.read &&
        !projectPermissionMap?.['total_technical_summaries']?.edit,
    },
  ];
