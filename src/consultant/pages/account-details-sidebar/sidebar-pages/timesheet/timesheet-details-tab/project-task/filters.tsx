import { FieldConfig } from '../../../../components/filter/filterType';
import { numberOptions } from '../../../projects/utils';

const requiredFieldFilterOptionsForText: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
];
const requiredFieldFilterOptionsForEnum: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
];

export const projectTaskFilterFields = (
  memoizedProjectTaskResourceCode: { option: string; value: string }[],
  resourceTypeOptions: { option: string; value: string }[],
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  console.log('permissionMap', permissionMap);
  return [
    {
      name: 'Resource Code',
      value: 'resource_code',
      type: 'enum',
      required: true,
      options: memoizedProjectTaskResourceCode,
      filterOptions: requiredFieldFilterOptionsForEnum,
      // hide:
      //   !permissionMap?.['resource_code']?.read &&
      //   !permissionMap?.['resource_code']?.edit,
    },
    {
      name: 'Resource Name',
      value: 'resource_name',
      type: 'text',
      // hide:
      //   !permissionMap?.['resource_name']?.read &&
      //   !permissionMap?.['resource_name']?.edit,
    },

    {
      name: 'Resource Type',
      value: 'resource_type_rid',
      type: 'enum',
      required: true,
      options: resourceTypeOptions,
      filterOptions: requiredFieldFilterOptionsForEnum,
      // hide:
      //   !permissionMap?.['resource_type_name']?.read &&
      //   !permissionMap?.['resource_type_name']?.edit,
    },

    {
      name: 'Resource Role',
      value: 'resource_role',
      type: 'text',
      // hide:
      //   !permissionMap?.['resource_role']?.read &&
      //   !permissionMap?.['resource_role']?.edit,
    },
    {
      name: 'Task Date',
      value: 'start_date',
      type: 'date',
      // hide:
      //   !permissionMap?.['start_date']?.read &&
      //   !permissionMap?.['start_date']?.edit,
    },

    {
      name: 'Cost',
      value: 'total_cost_pro_task',
      type: 'number',
      operatorOption: numberOptions,
      // hide:
      //   !permissionMap?.['total_cost_pro_task']?.read &&
      //   !permissionMap?.['total_cost_pro_task']?.edit,
    },
    {
      name: 'Effort Hours',
      value: 'total_hours_pro_task',
      type: 'number',
      operatorOption: numberOptions,
      // hide:
      //   !permissionMap?.['total_hours_pro_task']?.read &&
      //   !permissionMap?.['total_hours_pro_task']?.edit,
    },
    {
      name: 'Comments',
      value: 'comments',
      type: 'text',
      // hide:
      //   !permissionMap?.['comments']?.read && !permissionMap?.['comments']?.edit,
    },

    {
      name: 'Resource ID',
      value: 'r_number',
      type: 'text',
      required: true,
      filterOptions: requiredFieldFilterOptionsForText,
      // hide:
      //   !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
    },
    {
      name: 'Sort Options',
      value: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'created_datetime_desc', option: 'Recently Created' }],
    },
  ];
};
