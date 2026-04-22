import { FieldConfig } from '../../../account-details-sidebar/components/filter/filterType';

const dateOptions = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
];

export const numberOptions = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Less-Than', value: 'less_than' },
  { option: 'Greater-Than', value: 'greater_than' },
  { option: 'Between', value: 'between' },
  { option: 'Is-Empty', value: 'is_empty' },
];

export const getQrePercentHistoryFilterFields = (
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  return [
    {
      name: 'Sequence',
      value: 'version',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['version']?.edit && !permissionMap?.['version']?.read,
    },
    // {
    //   name: 'Type',
    //   value: 'type',
    //   type: 'text',
    //   operatorOption: textOptions,
    //   hide: !permissionMap?.['type']?.edit && !permissionMap?.['type']?.read,
    // },
    {
      name: 'QRE Percent Score',
      value: 'qre_percent',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['qre_percent']?.edit &&
        !permissionMap?.['qre_percent']?.read,
    },
    {
      name: 'Date',
      value: 'created_datetime',
      type: 'date',
      operatorOption: dateOptions,
      hide:
        !permissionMap?.['created_datetime']?.edit &&
        !permissionMap?.['created_datetime']?.read,
    },
    {
      name: 'Sort Options',
      value: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'createdAt_desc', option: 'Recently Created' }],
    },
  ];
};
