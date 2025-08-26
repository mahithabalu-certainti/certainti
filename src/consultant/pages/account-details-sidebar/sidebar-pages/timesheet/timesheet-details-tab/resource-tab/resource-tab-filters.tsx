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
  regions: { option: string; value: string }[]
): FieldConfig[] => {
  // Permission Mangement
  const { permission } = useSelector((state: RootState) => state.permission);
  const timesheetResourceViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.PROJECTS_RESOURCES_VIEW_EDIT
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
      name: 'Effort (Hours)',
      value: 'total_hours_pro_res',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['total_hours_pro_res']?.edit &&
        !permissionMap?.['total_hours_pro_res']?.read,
    },
    {
      name: 'Cost',
      value: 'total_cost_pro_res',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['total_cost_pro_res']?.edit &&
        !permissionMap?.['total_cost_pro_res']?.read,
    },
    {
      name: 'QRE %',
      value: 'qre_percent',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['qre_percent']?.edit &&
        !permissionMap?.['qre_percent']?.read,
    },
    {
      name: 'QRE',
      value: 'qre_final',
      type: 'enum',
      operatorOption: enumOptions,
      hide:
        !permissionMap?.['qre_final']?.edit &&
        !permissionMap?.['qre_final']?.read,
    },
    {
      name: 'Comments',
      value: 'description',
      type: 'text',
      operatorOption: nonReqTextOptions,
      hide:
        !permissionMap?.['description']?.edit &&
        !permissionMap?.['description']?.read,
    },
    {
      name: 'Sort Options',
      value: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'created_datetime_desc', option: 'Recently Created' }],
    },
  ];
};
