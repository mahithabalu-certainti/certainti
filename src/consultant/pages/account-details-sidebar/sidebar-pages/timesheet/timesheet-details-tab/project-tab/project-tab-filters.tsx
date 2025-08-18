// import { SelectOption } from '../../../../types';
// import { FieldConfig } from '../../components/filter/filterType';

import { SelectOption } from "../../../../../../types";
import { FieldConfig } from "../../../../components/filter/filterType";

const textOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not-Equals', value: 'not_equals' },
  { option: 'Contains', value: 'contains' },
];

// const nonReqTextOptions: { option: string; value: string }[] = [
//   { option: 'Equals', value: 'equals' },
//   { option: 'Not-Equals', value: 'not_equals' },
//   { option: 'Contains', value: 'contains' },
//   { option: 'Is-Empty', value: 'is_empty' },
// ];

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

// const dateOptions: { option: string; value: string }[] = [
//   { option: 'Equals', value: 'equals' },
//   { option: 'Before', value: 'before' },
//   { option: 'After', value: 'after' },
//   { option: 'Between', value: 'between' },
// ];

export const getTimesheetProjectTabFilterFields = (

  fiscalYears: SelectOption[],
  // permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  return [
    {
      name: 'Project Code',
      value: 'project_code',
      type: 'text',
      operatorOption: textOptions,
      // hide:
      //   !permissionMap?.['project_code']?.edit &&
      //   !permissionMap?.['project_code']?.read,
    },
    {
      name: 'Project Name',
      value: 'project_name',
      type: 'text',
      operatorOption: textOptions,
      // hide:
      //   !permissionMap?.['project_name']?.edit &&
      //   !permissionMap?.['project_name']?.read,
    },
    {
      name: 'Project Type',
      value: 'project_type_name',
      type: 'text',
      operatorOption: textOptions,
      // hide:
      //   !permissionMap?.['format']?.edit && !permissionMap?.['format']?.read,
    },
    {
      name: 'Account Name',
      value: 'account_name',
      type: 'text',
      operatorOption: textOptions,
      // hide: !permissionMap?.['size']?.edit && !permissionMap?.['size']?.read,
    },
    {
      name: 'Fiscal Year',
      value: 'Fiscal Year',
      type: 'enum',
      options: fiscalYears.map((y) => ({ option: y.label, value: y.value })),
      operatorOption: enumOptions,
      // hide:
      //   !permissionMap?.['fiscal']?.edit && !permissionMap?.['fiscal']?.read,
    },
    {
      name: 'Classification Name',
      value: 'classification_name',
      type: 'text',
      operatorOption: textOptions,
      // hide:
      //   !permissionMap?.['total_records']?.edit &&
      //   !permissionMap?.['total_records']?.read,
    },
    {
      name: 'Customer Group',
      value: 'project_client_group',
      type: 'text',
      operatorOption: textOptions,
      // hide:
      //   !permissionMap?.['records_loaded_successfully']?.edit &&
      //   !permissionMap?.['records_loaded_successfully']?.read,
    },
    {
      name: 'Project Group',
      value: 'project_group',
      type: 'text',
      operatorOption: textOptions,
      // hide:
      //   !permissionMap?.['records_with_warning']?.edit &&
      //   !permissionMap?.['records_with_warning']?.read,
    },
    {
      name: 'Project Effort (Hours)',
      value: 'total_effort',
      type: 'number',
      operatorOption: numberOptions,
      // hide:
      //   !permissionMap?.['records_failed_to_load']?.edit &&
      //   !permissionMap?.['records_failed_to_load']?.read,
    },
    {
      name: 'Project Cost',
      value: 'total_cost',
      type: 'number',
      operatorOption: numberOptions,
      // hide:
      //   !permissionMap?.['status']?.edit && !permissionMap?.['status']?.read,
    },
    {
      name: 'FTE Cost',
      value: 'total_cost_fte',
      type: 'number',
      operatorOption: numberOptions,
      // hide:
      //   !permissionMap?.['status_description']?.edit &&
      //   !permissionMap?.['status_description']?.read,
    },
    {
      name: 'SubCon Cost',
      value: 'total_cost_subcon',
      type: 'number',
      operatorOption: numberOptions,
      // hide:
      //   !permissionMap?.['imported_by']?.edit &&
      //   !permissionMap?.['imported_by']?.read,
    },
    {
      name: 'Non-Labor Cost',
      value: 'total_cost_nonlabor',
      type: 'number',
      operatorOption: numberOptions,
      // hide:
      //   !permissionMap?.['imported_on']?.edit &&
      //   !permissionMap?.['imported_on']?.read,
    },
    {
      name: 'Assessment Status',
      value: 'assessment_status',
      type: 'enum',
      options: [{ option: 'Assessed', value: 'Assessed' }],
      operatorOption: enumOptions,
      // hide:
      //   !permissionMap?.['imported_on']?.edit &&
      //   !permissionMap?.['imported_on']?.read,
    },
    {
      name: 'QRE %',
      value: 'qre_final',
      type: 'number',
      operatorOption: numberOptions,
      // hide:
      //   !permissionMap?.['imported_on']?.edit &&
      //   !permissionMap?.['imported_on']?.read,
    },
    {
      name: 'QRE',
      value: 'qre',
      type: 'enum',
      operatorOption: enumOptions,
      // hide:
      //   !permissionMap?.['imported_on']?.edit &&
      //   !permissionMap?.['imported_on']?.read,
    },{
      name: 'Project Point of Contact',
      value: 'project_point_of_contact',
      type: 'enum',
      operatorOption: enumOptions,
      // hide:
      //   !permissionMap?.['imported_on']?.edit &&
      //   !permissionMap?.['imported_on']?.read,
    },{
      name: 'Technical Point of Contact',
      value: 'technical_point_of_contact',
      type: 'enum',
      operatorOption: enumOptions,
      // hide:
      //   !permissionMap?.['imported_on']?.edit &&
      //   !permissionMap?.['imported_on']?.read,
    },
    {
      name: 'Comments',
      value: 'comments',
      type: 'text',
      operatorOption: textOptions,
      // hide:
      //   !permissionMap?.['imported_on']?.edit &&
      //   !permissionMap?.['imported_on']?.read,
    },
    {
      name: 'Project ID',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
      // hide:
      //   !permissionMap?.['imported_on']?.edit &&
      //   !permissionMap?.['imported_on']?.read,
    },
  ];
};
