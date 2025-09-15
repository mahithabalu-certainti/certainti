import { FilterSelectOption } from '../../../../types/account-filter';
import { FieldConfig } from '../../../account-details-sidebar/components/filter/filterType';
import { fiscalOptions, fiscalYearOption } from '../projects/utils';

const textOptions = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
];

const enumOptions = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
];

const dateOptions = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
];

const nonMadatoryOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
  { option: 'Is-Empty', value: 'is_empty' },
];

const numberOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Less-Than', value: 'less_than' },
  { option: 'Greater-Than', value: 'greater_than' },
  { option: 'Between', value: 'between' },
  { option: 'Is-Empty', value: 'is_empty' },
];

export const getInteractionFilterFields = (
  interactionTypes: { option: string; value: string }[],
  interactionStatus: { option: string; value: string }[],
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  return [
    {
      name: 'Interaction ID',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['r_number']?.edit &&
        !permissionMap?.['r_number']?.read,
    },
    {
      name: 'Project Count',
      value: 'project_count',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['project_count']?.edit &&
        !permissionMap?.['project_count']?.read,
    },
    {
      name: 'Type',
      value: 'interaction_type_rid',
      type: 'enum',
      options: interactionTypes,
      operatorOption: enumOptions,
      hide:
        !permissionMap?.['interaction_type_name']?.edit &&
        !permissionMap?.['interaction_type_name']?.read,
    },
    {
      name: 'Created By',
      value: 'created_user_name',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['created_by']?.edit &&
        !permissionMap?.['created_by']?.read,
    },
    {
      name: 'Last Updated By',
      value: 'updated_user_name',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['modified_by']?.edit &&
        !permissionMap?.['modified_by']?.read,
    },
    {
      name: 'Created Date',
      value: 'created_datetime',
      type: 'date',
      operatorOption: dateOptions,
      hide:
        !permissionMap?.['created_datetime']?.edit &&
        !permissionMap?.['created_datetime']?.read,
    },
    {
      name: 'Last Updated Date',
      value: 'modified_datetime',
      type: 'date',
      hide:
        !permissionMap?.['modified_datetime']?.edit &&
        !permissionMap?.['modified_datetime']?.read,
    },
  ];
};

export const projectFilterFields = (
  classificationOption: FilterSelectOption[],
  projectTypeOptions: { option: string; value: string }[],
  statusOptions: { option: string; value: string }[],
  projectPermissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
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

export const getInteractionStatusColor = (status?: string): string => {
  switch (status) {
    case 'Draft':
      return 'text-gray-500';
    case 'Created':
      return 'text-blue-500';
    case 'Sent':
      return 'text-purple-500';
    case 'Response Draft':
      return 'text-orange-500';
    case 'Response Received':
      return 'text-green-600';
    case 'On Hold':
      return 'text-yellow-500';
    case 'Cancelled':
      return 'text-red-600';
    case 'Completed':
      return 'text-green-700';
    case 'Question Updated':
      return 'text-indigo-500';
    default:
      return 'text-gray-700';
  }
};
