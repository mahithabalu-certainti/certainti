import { getFiscalYears } from '../../../../../common-utils';
import { FieldConfig } from '../../components/filter/filterType';

const textOptions: { option: string; value: string }[] = [
  { option: 'Contains', value: 'contains' },
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
];

// const nonReqTextfieldOptions: { option: string; value: string }[] = [
//   { option: 'Contains', value: 'contains' },
//   { option: 'Equals', value: 'equals' },
//   { option: 'Not Equals', value: 'not_equals' },
//   { option: 'Is Empty', value: 'is_empty' },
// ];

const numberOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'Less Than', value: 'less_than' },
  { option: 'Greater Than', value: 'greater_than' },
  { option: 'Between', value: 'between' },
];

const enumOperator: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Not Equals', value: 'not_equals' },
  { option: 'In', value: 'in' },
];

const dateOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
  { option: 'Is Empty', value: 'is_empty' },
];

const requiredDateOptions: { option: string; value: string }[] = [
  { option: 'Equals', value: 'equals' },
  { option: 'Before', value: 'before' },
  { option: 'After', value: 'after' },
  { option: 'Between', value: 'between' },
];

const minYear = 1950;
const currentYear = new Date().getFullYear();
const fiscalYears = getFiscalYears(currentYear - minYear + 1);

export const getCaseFilterFields = (
  caseStatusOptions: { option: string; value: string }[],
  caseTypeOptions: { label: string; value: string }[],
  caseOwnerOptions: { label: string; value: string }[]
  //   permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  return [
    {
      name: 'Case ID',
      value: 'case_number',
      type: 'text',
      operatorOption: textOptions,
      //   hide:
      //     !permissionMap?.['case_number']?.edit &&
      //     !permissionMap?.['case_number']?.read,
    },
    {
      name: 'Case Name',
      value: 'case_name',
      type: 'text',
      operatorOption: textOptions,
      //   hide:
      //     !permissionMap?.['case_name']?.edit &&
      //     !permissionMap?.['case_name']?.read,
    },
    {
      name: 'Fiscal Year',
      value: 'fiscal_year',
      type: 'enum',
      options: fiscalYears.map((y) => ({ option: y.label, value: y.value })),
      operatorOption: enumOperator,
      //   hide:
      //     !permissionMap?.['fiscal_year']?.edit &&
      //     !permissionMap?.['fiscal_year']?.read,
    },
    {
      name: 'Case Type',
      value: 'case_type_rid',
      type: 'enum',
      options: caseTypeOptions.map((opt) => ({
        option: opt.label,
        value: opt.value,
      })),
      operatorOption: enumOperator,
      //   hide:
      //     !permissionMap?.['case_type_rid']?.edit &&
      //     !permissionMap?.['case_type_rid']?.read,
    },
    {
      name: 'Case Owner',
      value: 'case_owner_rid',
      type: 'enum',
      options: caseOwnerOptions.map((opt) => ({
        option: opt.label,
        value: opt.value,
      })),
      operatorOption: enumOperator,
      //   hide:
      //     !permissionMap?.['case_owner_rid']?.edit &&
      //     !permissionMap?.['case_owner_rid']?.read,
    },
    {
      name: 'Status',
      value: 'status_rid',
      type: 'enum',
      options: caseStatusOptions,
      operatorOption: enumOperator,
      //   hide:
      //     !permissionMap?.['status_rid']?.edit &&
      //     !permissionMap?.['status_rid']?.read,
    },
    {
      name: 'Start Date',
      value: 'start_date',
      type: 'date',
      operatorOption: dateOptions,
      //   hide:
      //     !permissionMap?.['start_date']?.edit &&
      //     !permissionMap?.['start_date']?.read,
    },
    {
      name: 'End Date',
      value: 'end_date',
      type: 'date',
      operatorOption: dateOptions,
      //   hide:
      //     !permissionMap?.['end_date']?.edit &&
      //     !permissionMap?.['end_date']?.read,
    },
    {
      name: 'Project QRE Cost',
      value: 'project_qre_cost',
      type: 'number',
      operatorOption: numberOptions,
      //   hide:
      //     !permissionMap?.['project_qre_cost']?.edit &&
      //     !permissionMap?.['project_qre_cost']?.read,
    },
    {
      name: 'Project QRE Approved',
      value: 'project_qre_approved',
      type: 'number',
      operatorOption: numberOptions,
      //   hide:
      //     !permissionMap?.['project_qre_approved']?.edit &&
      //     !permissionMap?.['project_qre_approved']?.read,
    },
    {
      name: 'Annual Gross Receipts',
      value: 'annual_gross_receipts',
      type: 'number',
      operatorOption: numberOptions,
      //   hide:
      //     !permissionMap?.['annual_gross_receipts']?.edit &&
      //     !permissionMap?.['annual_gross_receipts']?.read,
    },
    {
      name: 'Created By',
      value: 'created_user_name',
      type: 'text',
      operatorOption: textOptions,
      //   hide:
      //     !permissionMap?.['created_by']?.edit &&
      //     !permissionMap?.['created_by']?.read,
    },
    {
      name: 'Created Date',
      value: 'created_datetime',
      type: 'date',
      operatorOption: requiredDateOptions,
      //   hide:
      //     !permissionMap?.['created_datetime']?.edit &&
      //     !permissionMap?.['created_datetime']?.read,
    },
    {
      name: 'Last Updated By',
      value: 'updated_user_name',
      type: 'text',
      operatorOption: textOptions,
      //   hide:
      //     !permissionMap?.['modified_by']?.edit &&
      //     !permissionMap?.['modified_by']?.read,
    },
    {
      name: 'Last Updated Date',
      value: 'modified_datetime',
      type: 'date',
      operatorOption: dateOptions,
      //   hide:
      //     !permissionMap?.['modified_datetime']?.edit &&
      //     !permissionMap?.['modified_datetime']?.read,
    },
    {
      name: 'Sort Options',
      value: 'sort_options',
      type: 'system-sort',
      options: [
        { value: 'createdAt_desc', option: 'Recently Created' },
        { value: 'modifiedAt_desc', option: 'Recently Updated' },
      ],
    },
  ];
};
