import { SelectOption } from '../../../../types';
import { FieldConfig } from '../../components/filter/filterType';

const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
  // { option: 'Not-Contains', value: 'not_contains' },
  // { option: 'Is-Empty', value: 'is_empty' },
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
  fiscalYears: SelectOption[]
): FieldConfig[] => {
  return [
    {
      name: 'Import ID',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'File Name',
      value: 'file_name',
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
      value: 'size',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Fiscal Year',
      value: 'fiscal',
      type: 'enum',
      options: fiscalYears.map((y) => ({ option: y.label, value: y.value })),
      operatorOption: enumOptions,
    },
    {
      name: 'Entity',
      value: 'entity',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'Total Records',
      value: 'total_records',
      type: 'number',
      operatorOption: numberOptions,
    },
    {
      name: 'Records Loaded Successfully',
      value: 'records_loaded_successfully',
      type: 'number',
      operatorOption: numberOptions,
    },
    {
      name: 'Records with Warning',
      value: 'records_with_warning',
      type: 'number',
      operatorOption: numberOptions,
    },
    {
      name: 'Records Failed to Load',
      value: 'records_failed_to_load',
      type: 'number',
      operatorOption: numberOptions,
    },
    {
      name: 'Status',
      value: 'status',
      type: 'text',
      operatorOption: textOptions,
    },
    // {
    //   name: 'Status Description',
    //   value: 'status_description',
    //   type: 'text',
    //   operatorOption: textOptions,
    // },
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
    },
    {
      name: 'Imported On',
      value: 'imported_on',
      type: 'date',
      operatorOption: dateOptions,
    },
    {
      name: 'Sort Options',
      value: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'imported_on_desc', option: 'Recently Imported' }],
    },
  ];
};
