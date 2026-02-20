import { FieldOptionType } from '../../../../../components/Attachments/helpers';
import { FieldConfig } from '../../../account-details-sidebar/components/filter/filterType';

const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
];

const nonReqTextfieldOptions: { option: string; value: string }[] = [
  { option: 'Contains', value: 'contains' },
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Is Empty', value: 'is_empty' },
];

const enumOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
];

const dateOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
];

const numberOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Less Than', value: 'less_than' },
  { option: 'Greater Than', value: 'greater_than' },
  { option: 'Between', value: 'between' },
];

export const getProjectDocumentsFilterFields = (
  fieldOptions?: FieldOptionType,
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  const { docCategories = [], docTypes = [] } = fieldOptions || {};
  return [
    {
      name: 'Project Code',
      value: 'project_code',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['project_code']?.read &&
        !permissionMap?.['project_code']?.edit,
    },
    {
      name: 'Project Name',
      value: 'project_name',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['project_name']?.read &&
        !permissionMap?.['project_name']?.edit,
    },
    {
      name: 'Document Name',
      value: 'document_name',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['document_name']?.read &&
        !permissionMap?.['document_name']?.edit,
    },
    {
      name: 'Format',
      value: 'format',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['format']?.read && !permissionMap?.['format']?.edit,
    },
    {
      name: 'Size',
      value: 'size_in_mb',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['size_in_mb']?.read &&
        !permissionMap?.['size_in_mb']?.edit,
    },
    {
      name: 'Document Category',
      value: 'document_category_rid',
      type: 'enum',
      options: docCategories.map((c) => ({ option: c.label, value: c.value })),
      operatorOption: enumOptions,
      onChange: true,
      hide:
        !permissionMap?.['document_category_rid']?.read &&
        !permissionMap?.['document_category_rid']?.edit,
    },
    {
      name: 'Document Type',
      value: 'document_type_rid',
      type: 'enum',
      options: docTypes.map((t) => ({ option: t.label, value: t.value })),
      operatorOption: enumOptions,
      dependsOn: 'document_category_rid',
      hide:
        !permissionMap?.['document_type_rid']?.read &&
        !permissionMap?.['document_type_rid']?.edit,
    },
    {
      name: 'Related Entity',
      value: 'attachment_level',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['attachment_level']?.read &&
        !permissionMap?.['attachment_level']?.edit,
    },
    {
      name: 'Related To ID',
      value: 'attach_to',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['attach_to']?.read &&
        !permissionMap?.['attach_to']?.edit,
    },
    {
      name: 'Related To Name',
      value: 'attached_to',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['attached_to']?.read &&
        !permissionMap?.['attached_to']?.edit,
    },
    {
      name: 'Attached By',
      value: 'uploaded_by',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['uploaded_by']?.read &&
        !permissionMap?.['uploaded_by']?.edit,
    },
    {
      name: 'Attached On',
      value: 'created_datetime',
      type: 'date',
      operatorOption: dateOptions,
      hide:
        !permissionMap?.['created_datetime']?.read &&
        !permissionMap?.['created_datetime']?.edit,
    },
    {
      name: 'Attachment ID',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['r_number']?.read &&
        !permissionMap?.['r_number']?.edit,
    },
  ];
};
export const getProjectSummaryFilterFields = (): FieldConfig[] => [
  {
    name: 'Project Code',
    value: 'project_code',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Name',
    value: 'project_name',
    type: 'text',
    operatorOption: nonReqTextfieldOptions,
  },
  {
    name: 'Project Type',
    value: 'project_type_rid',
    type: 'enum',
    options: [],
    operatorOption: enumOptions,
  },

  {
    name: 'Project Classification',
    value: 'classification_name',
    type: 'enum',
    options: [],
    operatorOption: enumOptions,
  },
  {
    name: 'Customer Group',
    value: 'project_client_group',
    type: 'text',
    operatorOption: nonReqTextfieldOptions,
  },
  {
    name: 'Project Group',
    value: 'project_group',
    type: 'text',
    operatorOption: nonReqTextfieldOptions,
  },
  {
    name: 'Project Effort (Hours)',
    value: 'total_effort',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Project Cost',
    value: 'total_cost',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'FTE Cost',
    value: 'total_cost_fte',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'SubCon Cost',
    value: 'total_cost_subcon',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Non-Labor Cost',
    value: 'total_cost_nonlabor',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Assessment Status',
    value: 'assessment_status',
    type: 'enum',
    options: [],
    operatorOption: enumOptions,
  },
  {
    name: 'QRE Percent Final',
    value: 'rd_percent_final',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'QRE Final',
    value: 'qre_final',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Project Point of Contact',
    value: 'project_point_of_contact',
    type: 'text',
    operatorOption: nonReqTextfieldOptions,
  },
  {
    name: 'Technical Point of Contact',
    value: 'technical_point_of_contact',
    type: 'text',
    operatorOption: nonReqTextfieldOptions,
  },
  {
    name: 'Comments',
    value: 'comments',
    type: 'text',
    operatorOption: nonReqTextfieldOptions,
  },
  {
    name: 'Last Modified',
    value: 'modified_datetime',
    type: 'date',
  },
  {
    name: 'Project ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
  },
];

export const getQualifiedProjectsFilterFields = (
  classificationOption: { option: string; value: string }[],
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
    operatorOption: nonReqTextfieldOptions,
    hide:
      !projectPermissionMap?.['project_name']?.read &&
      !projectPermissionMap?.['project_name']?.edit,
  },
  {
    name: 'Project Type',
    value: 'project_type_rid',
    type: 'enum',
    options: projectTypeOptions,
    operatorOption: enumOptions,
    hide:
      !projectPermissionMap?.['project_type_rid']?.read &&
      !projectPermissionMap?.['project_type_rid']?.edit,
  },

  {
    name: 'Project Classification',
    value: 'classification_name',
    type: 'enum',
    options: classificationOption,
    operatorOption: enumOptions,
    hide:
      !projectPermissionMap?.['project_classification_rid']?.read &&
      !projectPermissionMap?.['project_classification_rid']?.edit,
  },
  {
    name: 'Customer Group',
    value: 'project_client_group',
    type: 'text',
    operatorOption: nonReqTextfieldOptions,
    hide:
      !projectPermissionMap?.['project_client_group']?.read &&
      !projectPermissionMap?.['project_client_group']?.edit,
  },
  {
    name: 'Project Group',
    value: 'project_group',
    type: 'text',
    operatorOption: nonReqTextfieldOptions,
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
      !projectPermissionMap?.['rd_percent_final']?.read &&
      !projectPermissionMap?.['rd_percent_final']?.edit,
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
    operatorOption: nonReqTextfieldOptions,
    hide:
      !projectPermissionMap?.['key_contacts']?.read &&
      !projectPermissionMap?.['key_contacts']?.edit,
  },
  {
    name: 'Technical Point of Contact',
    value: 'project_technical_point_of_contact',
    type: 'text',
    operatorOption: nonReqTextfieldOptions,
    hide:
      !projectPermissionMap?.['key_contacts']?.read &&
      !projectPermissionMap?.['key_contacts']?.edit,
  },
  {
    name: 'Comments',
    value: 'comments',
    type: 'text',
    operatorOption: nonReqTextfieldOptions,
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

export const getResourceSummaryFilterFields = (): FieldConfig[] => [
  {
    name: 'Resource Code',
    value: 'resource_code',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Resource Name',
    value: 'resource_name',
    type: 'text',
    operatorOption: nonReqTextfieldOptions,
  },
  {
    name: 'Project Code',
    value: 'project_code',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Project Name',
    value: 'project_name',
    type: 'text',
    operatorOption: nonReqTextfieldOptions,
  },
  {
    name: 'Resource Country',
    value: 'country_rid',
    type: 'enum',
    options: [],
    filterOptions: enumOptions,
  },
  {
    name: 'Resource Region',
    value: 'region_rid',
    type: 'enum',
    options: [],
    dependsOn: 'country_rid',
    filterOptions: enumOptions,
  },
  {
    name: 'Project Resource Role',
    value: 'project_resource_role',
    type: 'text',
    operatorOption: nonReqTextfieldOptions,
  },
  {
    name: 'Resource Type',
    value: 'resource_type_rid',
    type: 'enum',
    options: [],
    filterOptions: enumOptions,
  },
  {
    name: 'Effort (Hours)',
    value: 'total_hours_pro_res',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Net Resource Cost',
    value: 'net_total_cost_pro_res',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'QRE Final',
    value: 'qre_final',
    type: 'number',
    operatorOption: numberOptions,
  },
  {
    name: 'Status',
    value: 'status_rid',
    type: 'enum',
    options: [],
    operatorOption: enumOptions,
  },
  {
    name: 'Comments',
    value: 'description',
    type: 'text',
    operatorOption: nonReqTextfieldOptions,
  },
  {
    name: 'Project Resource ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
  },
];
