import { FieldConfig } from '../../../account-details-sidebar/components/filter/filterType';

const textOptions = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
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
      name: 'Project Code',
      value: 'project_code',
      type: 'text',
      operatorOption: textOptions,
      // hide:
      //   !permissionMap?.['project_code']?.edit &&
      //   !permissionMap?.['project_code']?.read,
    },
    {
      name: 'Project Name',
      value: 'project_name',
      type: 'text',
      operatorOption: textOptions,
      // hide:
      //   !permissionMap?.['project_name']?.edit &&
      //   !permissionMap?.['project_name']?.read,
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
  ];
};
