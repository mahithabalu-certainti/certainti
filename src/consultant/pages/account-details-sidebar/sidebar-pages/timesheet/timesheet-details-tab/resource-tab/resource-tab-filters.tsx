/* eslint-disable react-hooks/rules-of-hooks */
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../../store/store';
import { FieldConfig } from '../../../../components/filter/filterType';
import { useMemo } from 'react';
import { AllPermissions } from '../../../../../../../common-service';

const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
];

const nonReqTextOptions: { option: string; value: string }[] = [
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
  { option: 'Is-Empty', value: 'is_empty' },
];

const enumOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
];

export const getTimesheetResourceTabFilterFields = (
  countries: { option: string; value: string }[],
  regions: { option: string; value: string }[],
  resourceTypeOptions: { option: string; value: string }[],
  memoizedStatus: { option: string; value: string }[]
): FieldConfig[] => {
  // Permission Mangement
  const { permission } = useSelector((state: RootState) => state.permission);
  const timesheetResourceViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.ACCOUNT_RESOURCES_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    timesheetResourceViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [timesheetResourceViewEditFields]);
  return [
    {
      name: 'Resource Code',
      value: 'resource_code',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['resource_code']?.edit &&
        !permissionMap?.['resource_code']?.read,
    },
    {
      name: 'Name',
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
      options: resourceTypeOptions,
      filterOptions: enumOptions,
      hide:
        !permissionMap?.['resource_type_rid']?.read &&
        !permissionMap?.['resource_type_rid']?.edit,
    },
    {
      name: 'Org Name',
      value: 'resource_orgname',
      type: 'text',
      hide:
        !permissionMap?.['resource_orgname']?.read &&
        !permissionMap?.['resource_orgname']?.edit,
    },
    {
      name: 'Designation',
      value: 'resource_designation',
      type: 'text',
      hide:
        !permissionMap?.['resource_designation']?.read &&
        !permissionMap?.['resource_designation']?.edit,
    },
    {
      name: 'Role',
      value: 'resource_role',
      type: 'text',
      hide:
        !permissionMap?.['resource_role']?.read &&
        !permissionMap?.['resource_role']?.edit,
    },
    {
      name: 'Resource Country',
      value: 'country_name',
      type: 'enum',
      operatorOption: enumOptions,
      onChange: true,
      options: countries,
      hide:
        !permissionMap?.['country_rid']?.edit &&
        !permissionMap?.['country_rid']?.read,
    },
    {
      name: 'Resource Region',
      value: 'region_name',
      type: 'enum',
      operatorOption: enumOptions,
      options: regions,
      hide:
        !permissionMap?.['region_rid']?.edit &&
        !permissionMap?.['region_rid']?.read,
    },
    {
      name: 'Total Project Hours',
      value: 'total_project_hours',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['total_project_hours']?.edit &&
        !permissionMap?.['total_project_hours']?.read,
    },
    {
      name: 'Estimated R&D Hours',
      value: 'estimated_rd_hours',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['total_cost_pro_res']?.edit &&
        !permissionMap?.['total_cost_pro_res']?.read,
    },
    {
      name: 'Status',
      value: 'status_rid',
      type: 'enum',
      required: true,
      options: memoizedStatus,
      filterOptions: enumOptions,
      hide:
        !permissionMap?.['status_rid']?.read &&
        !permissionMap?.['status_rid']?.edit,
    },
    {
      name: 'Comments',
      value: 'comments',
      type: 'text',
      operatorOption: nonReqTextOptions,
      hide:
        !permissionMap?.['comments']?.edit &&
        !permissionMap?.['comments']?.read,
    },
    {
      name: 'Resource ID',
      value: 'r_number',
      type: 'text',
      filterOptions: textOptions,
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
