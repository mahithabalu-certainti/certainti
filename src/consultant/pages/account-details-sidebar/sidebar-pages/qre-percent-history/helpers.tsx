import { FieldConfig } from '../../components/filter/filterType';

const textOptions = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
];

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

export const getQrePercentHistoryFilterFields = (): FieldConfig[] => {
  return [
    {
      name: 'Sequence',
      value: 'version',
      type: 'number',
      operatorOption: numberOptions,
    },
    {
      name: 'Type',
      value: 'type',
      type: 'text',
      operatorOption: textOptions,
    },
    {
      name: 'QRE Percent Score',
      value: 'qre_percent',
      type: 'number',
      operatorOption: numberOptions,
    },
    {
      name: 'Date',
      value: 'created_datetime',
      type: 'date',
      operatorOption: dateOptions,
    },
    {
      name: 'Sort Options',
      value: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'createdAt_desc', option: 'Recently Created' }],
    },
  ];
};
