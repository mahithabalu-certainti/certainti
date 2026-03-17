import { FieldConfig } from '../../../../../account-details-sidebar/components/filter/filterType';

const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
];

const dateOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
];

/**
 * Filter fields for the Version Control tab.
 * These map to the VersionControlItem fields.
 */
export const getVersionControlFilterFields = (): FieldConfig[] => [
  {
    name: 'Document Name',
    value: 'document_name',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Version',
    value: 'dossier_version',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Created By',
    value: 'created_by_name',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Version ID',
    value: 'r_number',
    type: 'text',
    operatorOption: textOptions,
  },
  {
    name: 'Created On',
    value: 'created_datetime',
    type: 'date',
    operatorOption: dateOptions,
  },
];
