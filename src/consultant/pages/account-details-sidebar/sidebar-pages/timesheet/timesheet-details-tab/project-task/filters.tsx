/* eslint-disable react-hooks/rules-of-hooks */
import { useSelector } from 'react-redux';
import { FieldConfig } from '../../../../components/filter/filterType';
import { numberOptions } from '../../../projects/utils';
import { useMemo } from 'react';
import { RootState } from '../../../../../../../store/store';
import { AllPermissions } from '../../../../../../../common-service';

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
  resourceTypeOptions: { option: string; value: string }[]
): FieldConfig[] => {
  // Permission Mangement
  const { permission } = useSelector((state: RootState) => state.permission);
  const projectTaskViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.PROJECTS_TASK_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    projectTaskViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [projectTaskViewEditFields]);
  return [
    {
      name: 'Resource Code',
      value: 'resource_code',
      type: 'text',
      required: true,
      filterOptions: requiredFieldFilterOptionsForText,
      hide:
        !permissionMap?.['resource_code']?.read &&
        !permissionMap?.['resource_code']?.edit,
    },
    {
      name: 'Resource Name',
      value: 'resource_name',
      type: 'text',
      hide:
        !permissionMap?.['resource_name']?.read &&
        !permissionMap?.['resource_name']?.edit,
    },
    {
      name: 'Resource Type',
      value: 'resource_type_rid',
      type: 'enum',
      required: true,
      options: resourceTypeOptions,
      filterOptions: requiredFieldFilterOptionsForEnum,
      hide:
        !permissionMap?.['resource_type_name']?.read &&
        !permissionMap?.['resource_type_name']?.edit,
    },

    {
      name: 'Resource Role',
      value: 'resource_role',
      type: 'text',
      hide:
        !permissionMap?.['resource_role']?.read &&
        !permissionMap?.['resource_role']?.edit,
    },
    {
      name: 'Start Date',
      value: 'start_date',
      type: 'date',
      hide:
        !permissionMap?.['start_date']?.read &&
        !permissionMap?.['start_date']?.edit,
    },
    {
      name: 'End Date',
      value: 'end_date',
      type: 'date',
      hide:
        !permissionMap?.['end_date']?.read &&
        !permissionMap?.['end_date']?.edit,
    },
    {
      name: 'Cost',
      value: 'total_cost_pro_task',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['total_cost_pro_task']?.read &&
        !permissionMap?.['total_cost_pro_task']?.edit,
    },
    {
      name: 'Effort Hours',
      value: 'total_hours_pro_task',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['total_hours_pro_task']?.read &&
        !permissionMap?.['total_hours_pro_task']?.edit,
    },
    {
      name: 'Comments',
      value: 'comments',
      type: 'text',
      hide:
        !permissionMap?.['comments']?.read &&
        !permissionMap?.['comments']?.edit,
    },

    {
      name: 'Project Task ID',
      value: 'r_number',
      type: 'text',
      required: true,
      filterOptions: requiredFieldFilterOptionsForText,
      hide:
        !permissionMap?.['r_number']?.read &&
        !permissionMap?.['r_number']?.edit,
    },
    {
      name: 'Sort Options',
      value: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'created_datetime_desc', option: 'Recently Created' }],
    },
  ];
};
