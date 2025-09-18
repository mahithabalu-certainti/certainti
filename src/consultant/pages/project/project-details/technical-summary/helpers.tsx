import { FieldConfig } from '../../../account-details-sidebar/components/filter/filterType';

const textOptions = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
];

const nonReqTextOptions = [
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
];

const dateOptions = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
];

export const getTechnicalSummaryFilterFields = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  return [
    {
      name: 'Sequence Number',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['r_number']?.edit &&
        !permissionMap?.['r_number']?.read,
    },
    {
      name: 'Summary Version',
      value: 'version',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['version']?.edit && !permissionMap?.['version']?.read,
    },
    {
      name: 'Created On',
      value: 'created_datetime',
      type: 'date',
      operatorOption: dateOptions,
      hide:
        !permissionMap?.['created_datetime']?.edit &&
        !permissionMap?.['created_datetime']?.read,
    },
    {
      name: 'Updated By',
      value: 'modified_by',
      type: 'text',
      operatorOption: nonReqTextOptions,
      hide:
        !permissionMap?.['modified_by']?.edit &&
        !permissionMap?.['modified_by']?.read,
    },
    {
      name: 'Updated On',
      value: 'modified_datetime',
      type: 'date',
      hide:
        !permissionMap?.['modified_datetime']?.edit &&
        !permissionMap?.['modified_datetime']?.read,
    },
  ];
};
