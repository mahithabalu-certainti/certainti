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
  caseStatusOptions: { label: string; value: string }[],
  caseTypeOptions: { label: string; value: string }[],
  caseOwnerOptions: { label: string; value: string }[],
  permissionMap: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => {
  return [
    {
      name: 'Case ID',
      value: 'r_number',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['r_number']?.edit &&
        !permissionMap?.['r_number']?.read,
    },
    {
      name: 'Filing Type',
      value: 'filing_type_name',
      type: 'enum',
      options: caseTypeOptions.map((opt) => ({
        option: opt.label,
        value: opt.value,
      })),
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['filing_type_rid']?.edit &&
        !permissionMap?.['filing_type_rid']?.read,
    },
    {
      name: 'Case Name',
      value: 'case_name',
      type: 'text',
      operatorOption: textOptions,
      hide:
        !permissionMap?.['case_name']?.edit &&
        !permissionMap?.['case_name']?.read,
    },
    {
      name: 'Fiscal Year',
      value: 'fiscal_year',
      type: 'enum',
      options: fiscalYears.map((y) => ({ option: y.label, value: y.value })),
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['fiscal_year']?.edit &&
        !permissionMap?.['fiscal_year']?.read,
    },
    {
      name: 'Case Owner',
      value: 'case_owner_name',
      type: 'enum',
      options: caseOwnerOptions.map((opt) => ({
        option: opt.label,
        value: opt.value,
      })),
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['case_owner_rid']?.edit &&
        !permissionMap?.['case_owner_rid']?.read,
    },
    {
      name: 'Total Assigned Project',
      value: 'case_total_projects',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['case_total_projects']?.edit &&
        !permissionMap?.['case_total_projects']?.read,
    },
    {
      name: 'Total Assigned Project Cost',
      value: 'case_total_project_cost',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['case_total_project_cost']?.edit &&
        !permissionMap?.['case_total_project_cost']?.read,
    },
    {
      name: 'Total Qualified Project',
      value: 'case_total_qualified_projects',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['case_total_qualified_projects']?.edit &&
        !permissionMap?.['case_total_qualified_projects']?.read,
    },
    {
      name: 'Total Qualified Project Cost',
      value: 'case_total_qualified_project_cost',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['case_total_qualified_project_cost']?.edit &&
        !permissionMap?.['case_total_qualified_project_cost']?.read,
    },
    {
      name: 'Total QRE',
      value: 'case_total_qre_cost',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['case_total_qre_cost']?.edit &&
        !permissionMap?.['case_total_qre_cost']?.read,
    },
    {
      name: 'Total RD Credits',
      value: 'case_total_rd_cost',
      type: 'number',
      operatorOption: numberOptions,
      hide:
        !permissionMap?.['case_total_rd_cost']?.edit &&
        !permissionMap?.['case_total_rd_cost']?.read,
    },
    {
      name: 'Created On',
      value: 'created_datetime',
      type: 'date',
      operatorOption: requiredDateOptions,
      hide:
        !permissionMap?.['created_datetime']?.edit &&
        !permissionMap?.['created_datetime']?.read,
    },
    {
      name: 'Submitted On',
      value: 'submitted_datetime',
      type: 'date',
      operatorOption: dateOptions,
      hide:
        !permissionMap?.['submitted_datetime']?.edit &&
        !permissionMap?.['submitted_datetime']?.read,
    },
    {
      name: 'Approved On',
      value: 'approved_datetime',
      type: 'date',
      operatorOption: dateOptions,
      hide:
        !permissionMap?.['approved_datetime']?.edit &&
        !permissionMap?.['approved_datetime']?.read,
    },
    {
      name: 'Status',
      value: 'status_rid',
      type: 'enum',
      options: caseStatusOptions.map((opt) => ({
        option: opt.label,
        value: opt.value,
      })),
      operatorOption: enumOperator,
      hide:
        !permissionMap?.['status_rid']?.edit &&
        !permissionMap?.['status_rid']?.read,
    },
    {
      name: 'Sort Options',
      value: 'sort_options',
      type: 'system-sort',
      options: [{ value: 'createdAt_desc', option: 'Recently Created' }],
    },
  ];
};
