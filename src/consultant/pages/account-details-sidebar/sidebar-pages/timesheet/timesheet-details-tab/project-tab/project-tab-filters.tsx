/* eslint-disable react-hooks/rules-of-hooks */
import { useMemo } from 'react';
import { SelectOption } from '../../../../../../types';
import { FieldConfig } from '../../../../components/filter/filterType';
import { AllPermissions } from '../../../../../../../common-service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../../../store/store';

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
  { option: 'Is-Empty', value: 'is_empty' },
];

const dateOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
];

export const getTimesheetProjectTabFilterFields = (
  fiscalYears: SelectOption[],
  resourceTypeOptions: { option: string; value: string }[],
  memoizedStatus: { option: string; value: string }[]
): FieldConfig[] => {
  const { permission } = useSelector((state: RootState) => state.permission);
  const timesheet_Project_ViewEditFields = useMemo(
    () =>
      permission?.find(
        (item) => item.name === AllPermissions.PROJECTS_VIEW_EDIT
      )?.fields ?? [],
    [permission]
  );
  const permissionMap = useMemo(() => {
    const map: Record<string, { read: boolean; edit: boolean }> = {};
    timesheet_Project_ViewEditFields.forEach((item) => {
      map[item.name] = { read: item.read ?? false, edit: item.edit ?? false };
    });
    return map;
  }, [timesheet_Project_ViewEditFields]);
  return [
    {
      name: 'Project Code',
      value: 'project_code',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['project_code']?.edit &&
        !permissionMap?.['project_code']?.read,
    },
    {
      name: 'Project Name',
      value: 'project_name',
      type: 'text',
      operatorOption: nonReqTextOptions,
      hide:
        !permissionMap?.['project_name']?.edit &&
        !permissionMap?.['project_name']?.read,
    },
    {
      name: 'Project Type',
      value: 'project_type_name',
      type: 'enum',
      operatorOption: enumOptions,
      options: resourceTypeOptions,
      hide:
        !permissionMap?.['project_type_rid']?.edit &&
        !permissionMap?.['project_type_rid']?.read,
    },
    {
      name: 'Fiscal Year',
      value: 'fiscal_year',
      type: 'enum',
      options: fiscalYears.map((y) => ({ option: y.label, value: y.value })),
      operatorOption: enumOptions,
      hide:
        !permissionMap?.['fiscal_year']?.edit &&
        !permissionMap?.['fiscal_year']?.read,
    },
    {
      name: 'Project Classification',
      value: 'classification_name',
      type: 'text',
      operatorOption: nonReqTextOptions,
      hide:
        !permissionMap?.['project_classification_rid']?.edit &&
        !permissionMap?.['project_classification_rid']?.read,
    },
    {
      name: 'Customer Group',
      value: 'project_client_group',
      type: 'text',
      operatorOption: nonReqTextOptions,
      hide:
        !permissionMap?.['project_client_group']?.edit &&
        !permissionMap?.['project_client_group']?.read,
    },
    {
      name: 'Project Group',
      value: 'project_group',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['project_group']?.edit &&
        !permissionMap?.['project_group']?.read,
    },
    {
      name: 'Project Effort (Hours)',
      value: 'total_effort',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['total_effort']?.edit &&
        !permissionMap?.['total_effort']?.read,
    },
    {
      name: 'Project Cost',
      value: 'total_cost',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['total_cost']?.edit &&
        !permissionMap?.['total_cost']?.read,
    },
    {
      name: 'FTE Cost',
      value: 'total_cost_fte',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['total_cost_fte']?.edit &&
        !permissionMap?.['total_cost_fte']?.read,
    },
    {
      name: 'SubCon Cost',
      value: 'total_cost_subcon',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['total_cost_subcon']?.edit &&
        !permissionMap?.['total_cost_subcon']?.read,
    },
    {
      name: 'Non-Labor Cost',
      value: 'total_cost_nonlabor',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['total_cost_nonlabor']?.edit &&
        !permissionMap?.['total_cost_nonlabor']?.read,
    },
    {
      name: 'Assessment Status',
      value: 'assessment_status',
      type: 'enum',
      options: memoizedStatus,
      operatorOption: enumOptions,
      hide:
        !permissionMap?.['assessment_status']?.edit &&
        !permissionMap?.['assessment_status']?.read,
    },
    {
      name: 'QRE Percent Final',
      value: 'rd_percent_final',
      type: 'number',
      operatorOption: numberOptions,
      hide: !permissionMap?.['qre']?.edit && !permissionMap?.['qre']?.read,
    },
    {
      name: 'QRE Final',
      value: 'qre_final',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['qre_final']?.edit &&
        !permissionMap?.['qre_final']?.read,
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
      name: 'Last Modified',
      value: 'modified_datetime',
      type: 'date',
      operatorOption: dateOptions,
      hide:
        !permissionMap?.['modified_datetime']?.read &&
        !permissionMap?.['modified_datetime']?.edit,
    },
    {
      name: 'Project ID',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['r_number']?.edit &&
        !permissionMap?.['r_number']?.read,
    },
    {
      name: 'Sort Options',
      value: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'created_datetime_desc', option: 'Recently Created' }],
    },
  ];
};
