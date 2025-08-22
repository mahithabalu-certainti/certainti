import { FieldConfig } from '../../../components/filter/filterType';

const enumOptions = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
];

export const getInteractionHistoryFilterFields = (
  interactionStatus: { option: string; value: string }[] // permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  return [
    {
      name: 'Action',
      value: 'status_rid',
      type: 'enum',
      options: interactionStatus,
      operatorOption: enumOptions,
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
  ];
};
