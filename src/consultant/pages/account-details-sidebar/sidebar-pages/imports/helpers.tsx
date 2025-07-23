import { SelectOption } from '../../../../types';
import { FieldConfig } from '../../components/filter/filterType';

const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
  // { option: 'Not-Contains', value: 'not_contains' },
  // { option: 'Is-Empty', value: 'is_empty' },
];

const nonReqTextOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
  { option: 'Is-Empty', value: 'is_empty' },
];

const numberOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Less Than', value: 'less_than' },
  { option: 'Greater Than', value: 'greater_than' },
  { option: 'Between', value: 'between' },
  { option: 'Is-Empty', value: 'is_empty' },
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

export const getImportsFilterFields = (
  fiscalYears: SelectOption[],
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  return [
    {
      name: 'Import ID',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['r_number']?.edit &&
        !permissionMap?.['r_number']?.read,
    },
    {
      name: 'File Name',
      value: 'file_name',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['file_name']?.edit &&
        !permissionMap?.['file_name']?.read,
    },
    {
      name: 'Format',
      value: 'format',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['format']?.edit && !permissionMap?.['format']?.read,
    },
    {
      name: 'Size',
      value: 'size',
      type: 'text',
      operatorOption: textOptions,
      hide: !permissionMap?.['size']?.edit && !permissionMap?.['size']?.read,
    },
    {
      name: 'Fiscal Year',
      value: 'fiscal',
      type: 'enum',
      options: fiscalYears.map((y) => ({ option: y.label, value: y.value })),
      operatorOption: enumOptions,
      hide:
        !permissionMap?.['fiscal']?.edit && !permissionMap?.['fiscal']?.read,
    },
    {
      name: 'Entity',
      value: 'entity',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['entity']?.edit && !permissionMap?.['entity']?.read,
    },
    {
      name: 'Total Records',
      value: 'total_records',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['total_records']?.edit &&
        !permissionMap?.['total_records']?.read,
    },
    {
      name: 'Records Loaded Successfully',
      value: 'records_loaded_successfully',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['records_loaded_successfully']?.edit &&
        !permissionMap?.['records_loaded_successfully']?.read,
    },
    {
      name: 'Records with Warning',
      value: 'records_with_warning',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['records_with_warning']?.edit &&
        !permissionMap?.['records_with_warning']?.read,
    },
    {
      name: 'Records Failed to Load',
      value: 'records_failed_to_load',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['records_failed_to_load']?.edit &&
        !permissionMap?.['records_failed_to_load']?.read,
    },
    {
      name: 'Status',
      value: 'status',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['status']?.edit && !permissionMap?.['status']?.read,
    },
    {
      name: 'Status Description',
      value: 'status_description',
      type: 'text',
      operatorOption: nonReqTextOptions,
      // hide:
      //   !permissionMap?.['status_description']?.edit &&
      //   !permissionMap?.['status_description']?.read,
    },
    // {
    //   name: 'Import Type',
    //   value: 'import_type',
    //   type: 'text',
    //   operatorOption: textOptions,
    // },
    {
      name: 'Imported By',
      value: 'imported_by',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['imported_by']?.edit &&
        !permissionMap?.['imported_by']?.read,
    },
    {
      name: 'Imported On',
      value: 'imported_on',
      type: 'date',
      operatorOption: dateOptions,
      hide:
        !permissionMap?.['imported_on']?.edit &&
        !permissionMap?.['imported_on']?.read,
    },
    {
      name: 'Sort Options',
      value: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'imported_on_desc', option: 'Recently Imported' }],
    },
  ];
};
