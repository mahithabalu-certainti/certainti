import { FieldConfig } from '../../../../consultant/types/account-filter';

const textfieldOptions: { label: string; value: string }[] = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
];

const nonReqTextfieldOptions: { label: string; value: string }[] = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'Is Empty', value: 'is_empty' },
];

export const enumOperator: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'In', value: 'in' },
];

const dateOptions: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Before', value: 'before' },
  { label: 'After', value: 'after' },
  { label: 'Between', value: 'between' },
  { label: 'Is Empty', value: 'is_empty' },
];

const requiredDateOptions: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Before', value: 'before' },
  { label: 'After', value: 'after' },
  { label: 'Between', value: 'between' },
];

export const getEmailTemplateFilterFields = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>,
  statusOptions: { label: string; value: string }[],
  categoryOptions: { label: string; value: string }[]
): FieldConfig[] => {
  return [
    {
      label: 'Template ID',
      name: 'r_number',
      type: 'text',
      operatorOption: textfieldOptions,
      hide:
        !permissionMap?.['r_number']?.read &&
        !permissionMap?.['r_number']?.edit,
    },
    {
      label: 'Template Name',
      name: 'template_name',
      type: 'text',
      operatorOption: textfieldOptions,
      hide:
        !permissionMap?.['email_template_name']?.read &&
        !permissionMap?.['email_template_name']?.edit,
    },
    {
      label: 'Description',
      name: 'description',
      type: 'text',
      operatorOption: textfieldOptions,
      hide:
        !permissionMap?.['description']?.read &&
        !permissionMap?.['description']?.edit,
    },
    {
      label: 'Category',
      name: 'category_rid',
      type: 'enumSelect',
      options: categoryOptions,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['category_rid']?.read &&
        !permissionMap?.['category_rid']?.edit,
    },
    {
      label: 'Created By',
      name: 'created_user_name',
      type: 'text',
      operatorOption: textfieldOptions,
      hide:
        !permissionMap?.['created_by']?.read &&
        !permissionMap?.['created_by']?.edit,
    },
    {
      label: 'Created On',
      name: 'created_datetime',
      type: 'date',
      operatorOption: requiredDateOptions,
      hide:
        !permissionMap?.['created_datetime']?.read &&
        !permissionMap?.['created_datetime']?.edit,
    },
    {
      label: 'Updated By',
      name: 'modified_user_name',
      type: 'text',
      operatorOption: nonReqTextfieldOptions,
      hide:
        !permissionMap?.['modified_by']?.read &&
        !permissionMap?.['modified_by']?.edit,
    },
    {
      label: 'Updated On',
      name: 'modified_datetime',
      type: 'date',
      operatorOption: dateOptions,
      hide:
        !permissionMap?.['modified_datetime']?.read &&
        !permissionMap?.['modified_datetime']?.edit,
    },
    {
      label: 'Status',
      name: 'status_rid',
      type: 'enumSelect',
      options: statusOptions,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['status_rid']?.read &&
        !permissionMap?.['status_rid']?.edit,
    },
    {
      label: 'Sort Options',
      name: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'createdAt_desc', label: 'Recently Created' }],
    },
  ];
};
