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

export const getProjectDocumentsFilterFields =
  () //   permissionMap: Record<string, { read: boolean; edit: boolean }>
  : FieldConfig[] => [
    {
      name: 'Project ID',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Project Name',
      value: 'project_name',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Document Name',
      value: 'document_name',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Format',
      value: 'format',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Size',
      value: 'size_in_mb',
      type: 'number',
      operatorOption: numberOptions,
    },
    {
      name: 'Document Category',
      value: 'document_category_rid',
      type: 'enum',
      options: [],
      operatorOption: enumOptions,
      onChange: true,
    },
    {
      name: 'Document Type',
      value: 'document_type_rid',
      type: 'enum',
      options: [],
      operatorOption: enumOptions,
      dependsOn: 'document_category_rid',
    },
    {
      name: 'Related Entity',
      value: 'attachment_level',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Related To ID',
      value: 'attach_to',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Related To Name',
      value: 'attached_to',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Attached By',
      value: 'uploaded_by',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Attached On',
      value: 'created_datetime',
      type: 'date',
      operatorOption: dateOptions,
    },
  ];

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

export const getQualifiedProjectsFilterFields = (): FieldConfig[] => [
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
