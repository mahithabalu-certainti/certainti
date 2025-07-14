import { FieldConfig } from '../../../account-details-sidebar/components/filter/filterType';

const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
  // { option: 'Not-Contains', value: 'not_contains' },
  // { option: 'Is-Empty', value: 'is_empty' },
];

export const attachmentsFilterFields =
  () //   countryOptions: FilterSelectOption[],
  //   industryOptions: FilterSelectOption[]
  : FieldConfig[] => [
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
    },
    {
      name: 'Size',
      value: 'size_in_mb',
      type: 'number',
    },
    {
      name: 'Fiscal Year',
      value: 'fiscal_year',
      type: 'enum',
      options: [],
    },
    {
      name: 'Document Category',
      value: 'document_category',
      type: 'enum',
      options: [],
    },
    {
      name: 'Document Type',
      value: 'document_type',
      type: 'enum',
      options: [],
    },
    {
      name: 'Related Entity',
      value: 'attachment_level',
      type: 'text',
    },
    {
      name: 'Related To ID',
      value: 'attach_to',
      type: 'text',
    },
    {
      name: 'Related To Name',
      value: 'attached_to',
      type: 'text',
    },
    {
      name: 'Attached By',
      value: 'uploaded_by',
      type: 'text',
    },
    {
      name: 'Attached On',
      value: 'created_datetime',
      type: 'date',
    },
    {
      name: 'Attachment ID',
      value: 'r_number',
      type: 'text',
    },
    {
      name: 'Sort Options',
      value: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'created_datetime_desc', option: 'Recently Created' }],
    },
  ];
