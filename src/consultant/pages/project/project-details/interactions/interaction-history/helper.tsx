import { FieldConfig } from '../../../../account-details-sidebar/components/filter/filterType';

const textOptions = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
];

// const nonReqTextOptions = [
//   { option: 'Equals', value: 'equals' },
//   { option: 'Not-Equals', value: 'not_equals' },
//   { option: 'Contains', value: 'contains' },
//   { option: 'Is-Empty', value: 'is_empty' },
// ];

// const enumOptions = [
//   { option: 'Equals', value: 'equals' },
//   { option: 'Not Equals', value: 'not_equals' },
//   { option: 'In', value: 'in' },
// ];

// const dateOptions = [
//   { option: 'Equals', value: 'equals' },
//   { option: 'Before', value: 'before' },
//   { option: 'After', value: 'after' },
//   { option: 'Between', value: 'between' },
// ];

export const getInteractionHistoryFilterFields =
  () // permissionMap: Record<string, { read: boolean; edit: boolean }>
  : FieldConfig[] => {
    return [
      {
        name: 'Action',
        value: 'action',
        type: 'text',
        operatorOption: textOptions,
        // hide:
        //   !permissionMap?.['r_number']?.edit &&
        //   !permissionMap?.['r_number']?.read,
      },
      {
        name: 'Date',
        value: 'date',
        type: 'date',
        // hide:
        //   !permissionMap?.['last_updated_date']?.edit &&
        //   !permissionMap?.['last_updated_date']?.read,
      },
      {
        name: 'Sort Options',
        value: 'sort_options',
        type: 'system-sort',
        options: [{ value: 'createdAt_desc', option: 'Recently Created' }],
      },
    ];
  };
