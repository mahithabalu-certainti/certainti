import { SelectOption } from '../../../../../../consultant/types';
import { FieldConfig } from '../../../../../../consultant/types/account-filter';

const textfieldOptions: { label: string; value: string }[] = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
];

export const enumOperator: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'In', value: 'in' },
];

export const getTaskTemplateFilterFields = (
  taskTemplateTypesOptions: SelectOption[],
  taskPrioritytTypesTypesOptions: SelectOption[],
  memoizedStatus: SelectOption[],
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  return [
    {
      label: 'Template ID',
      name: 'r_number',
      type: 'text',
      operatorOption: textfieldOptions,
      hide:
        !permissionMap?.['r_number']?.read &&
        !permissionMap?.['r_number']?.edit,
    },
    {
      label: 'Task Name',
      name: 'task_name',
      type: 'text',
      operatorOption: textfieldOptions,
      hide:
        !permissionMap?.['task_name']?.read &&
        !permissionMap?.['task_name']?.edit,
    },
    {
      label: 'Task Type',
      name: 'task_type_rid',
      type: 'enumSelect',
      options: taskTemplateTypesOptions,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['task_type_rid']?.read &&
        !permissionMap?.['task_type_rid']?.edit,
    },
    {
      label: 'Priority',
      name: 'priority_rid',
      type: 'enumSelect',
      options: taskPrioritytTypesTypesOptions,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['priority_rid']?.edit &&
        !permissionMap?.['priority_rid']?.read,
    },
    {
      label: 'Status',
      name: 'status_rid',
      type: 'enumSelect',
      options: memoizedStatus,
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['status_rid']?.edit &&
        !permissionMap?.['status_rid']?.read,
    },
  ];
};
