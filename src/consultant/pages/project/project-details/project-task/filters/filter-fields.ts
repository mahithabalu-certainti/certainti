import { FormFiscalDateType } from '../../../../../types';
import { FieldConfig } from '../../../../account-details-sidebar/components/filter/filterType';
import {
  fiscalOptions,
  numberOptions,
} from '../../../../account-details-sidebar/sidebar-pages/projects/utils';
export const requiredFieldFilterOptionsForText: {
  option: string;
  value: string;
}[] = [
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
  memoizedProjectResourceType: { option: string; value: string }[],
  memoizedProjectResourceClassification: { option: string; value: string }[],
  permissionMapTaskTableColumn?: Record<
    string,
    { read: boolean; edit: boolean }
  >,
  fiscalDatesArg?: FormFiscalDateType,
  memoizedResourceStatus?: { option: string; value: string }[]
): FieldConfig[] => [
  {
    name: 'Resource Code',
    value: 'resource_code',
    type: 'enum',
    required: true,
    options: memoizedProjectTaskResourceCode,
    filterOptions: requiredFieldFilterOptionsForEnum,
    hide:
      !permissionMapTaskTableColumn?.['resource_code']?.read &&
      !permissionMapTaskTableColumn?.['resource_code']?.edit,
  },
  {
    name: 'Resource Name',
    value: 'resource_name',
    type: 'text',
    hide:
      !permissionMapTaskTableColumn?.['resource_name']?.read &&
      !permissionMapTaskTableColumn?.['resource_name']?.edit,
  },
  {
    name: 'Task Name',
    value: 'task_name',
    type: 'text',
    // hide:
    //   !permissionMapTaskTableColumn?.['resource_name']?.read &&
    //   !permissionMapTaskTableColumn?.['resource_name']?.edit,
  },

  {
    name: 'Resource Type',
    value: 'resource_type_rid',
    type: 'enum',
    required: true,
    options: resourceTypeOptions,
    filterOptions: requiredFieldFilterOptionsForEnum,
    hide:
      !permissionMapTaskTableColumn?.['resource_type_name']?.read &&
      !permissionMapTaskTableColumn?.['resource_type_name']?.edit,
  },
  {
    name: 'Task Type',
    value: 'task_type_rid',
    type: 'enum',
    required: true,
    options: memoizedProjectResourceType,
    filterOptions: requiredFieldFilterOptionsForEnum,
    hide:
      !permissionMapTaskTableColumn?.['resource_type_name']?.read &&
      !permissionMapTaskTableColumn?.['resource_type_name']?.edit,
  },
  {
    name: 'Classification Type',
    value: 'task_classification',
    type: 'enum',
    required: true,
    options: memoizedProjectResourceClassification,
    filterOptions: requiredFieldFilterOptionsForEnum,
    hide:
      !permissionMapTaskTableColumn?.['resource_type_name']?.read &&
      !permissionMapTaskTableColumn?.['resource_type_name']?.edit,
  },

  {
    name: 'Project Resource Role',
    value: 'project_resource_role',
    type: 'text',
    hide:
      !permissionMapTaskTableColumn?.['project_resource_role']?.read &&
      !permissionMapTaskTableColumn?.['project_resource_role']?.edit,
  },
  {
    name: 'Start Date',
    value: 'start_date',
    type: 'date',
    minDate: fiscalDatesArg?.startMin,
    maxDate: fiscalDatesArg?.startMax,
    hide:
      !permissionMapTaskTableColumn?.['start_date']?.read &&
      !permissionMapTaskTableColumn?.['start_date']?.edit,
  },
  {
    name: 'End Date',
    value: 'end_date',
    type: 'date',
    minDate: fiscalDatesArg?.startMin,
    maxDate: fiscalDatesArg?.endMax,
    hide:
      !permissionMapTaskTableColumn?.['end_date']?.read &&
      !permissionMapTaskTableColumn?.['end_date']?.edit,
  },
  {
    name: 'Cost',
    value: 'total_cost_pro_task',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !permissionMapTaskTableColumn?.['total_cost_pro_task']?.read &&
      !permissionMapTaskTableColumn?.['total_cost_pro_task']?.edit,
  },
  {
    name: 'Effort Hours',
    value: 'total_hours_pro_task',
    type: 'number',
    operatorOption: numberOptions,
    hide:
      !permissionMapTaskTableColumn?.['total_hours_pro_task']?.read &&
      !permissionMapTaskTableColumn?.['total_hours_pro_task']?.edit,
  },
  {
    name: 'Status',
    value: 'status_rid',
    type: 'enum',
    options: memoizedResourceStatus,
    operatorOption: fiscalOptions,
    hide:
      !permissionMapTaskTableColumn?.['status_action']?.read &&
      !permissionMapTaskTableColumn?.['status_action']?.edit,
  },
  {
    name: 'Comments',
    value: 'comments',
    type: 'text',
    hide:
      !permissionMapTaskTableColumn?.['comments']?.read &&
      !permissionMapTaskTableColumn?.['comments']?.edit,
  },

  {
    name: 'Project Task ID',
    value: 'r_number',
    type: 'text',
    required: true,
    filterOptions: requiredFieldFilterOptionsForText,
    hide:
      !permissionMapTaskTableColumn?.['r_number']?.read &&
      !permissionMapTaskTableColumn?.['r_number']?.edit,
  },
  {
    name: 'Sort Options',
    value: 'sort_options',
    type: 'system-sort',
    options: [{ value: 'created_datetime_desc', option: 'Recently Created' }],
  },
];
