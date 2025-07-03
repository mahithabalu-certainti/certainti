import { AccountList } from '../../types';
import { FieldConfig, FilterSelectOption } from '../../types/account-filter';

// const roleOptions: { label: string; value: string }[] = [
//   { label: 'Finance Executive', value: 'finance_executive' },
//   { label: 'Finance Lead', value: 'financial_consultant' },
//   { label: 'Professional Services Consultant', value: 'technical_consultant' },
// ];

export const keyOptions: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'Contains', value: 'contains' },
  { label: 'Is Empty', value: 'is_empty' },
];

const textfieldOptions: { label: string; value: string }[] = [
  { label: 'Contains', value: 'contains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
];

export const industryOperator: { label: string; value: string }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'In', value: 'in' },
];

export const getAccountFilterFields = (
  countryOptions: FilterSelectOption[],
  industryOptions: FilterSelectOption[]
): FieldConfig[] => [
  {
    label: 'Account Name',
    name: 'account_name',
    type: 'text',
    operatorOption: textfieldOptions,
  },
  {
    label: 'Industry',
    name: 'industry',
    type: 'enumSelect',
    options: industryOptions,
    operatorOption: industryOperator,
  },
  {
    label: 'Country',
    name: 'country',
    type: 'enumSelect',
    options: countryOptions,
  },
  { label: 'Total Projects', name: 'total_projects', type: 'number' },
  { label: 'Total Project Hours', name: 'total_project_hours', type: 'number' },
  { label: 'Total Cost', name: 'total_project_cost', type: 'number' },
  {
    label: 'Estimated R&D Hours',
    name: 'qualifying_project_hours_fed',
    type: 'number',
  },
  { label: 'QRE', name: 'qualifying_project_qre_fed', type: 'number' },
  {
    label: 'Estimated R&D Credits',
    name: 'qualifying_project_rd_credits_fed',
    type: 'number',
  },
  {
    label: 'Actual R&D Credits',
    name: 'total_projects_rd_credits',
    type: 'number',
  },
  // {
  //   label: 'Key Contacts',
  //   name: 'key_contact',
  //   type: 'keyContact',
  //   operatorOption: keyOptions,
  //   options: roleOptions,
  // },
  {
    label: 'Finance Executive',
    name: 'finance_executive',
    type: 'text',
    operatorOption: keyOptions,
  },
  {
    label: 'Finance Lead',
    name: 'finance_lead',
    type: 'text',
    operatorOption: keyOptions,
  },
  {
    label: 'Professional Services Consultant',
    name: 'professional_services_consultant',
    type: 'text',
    operatorOption: keyOptions,
  },
  {
    label: 'Account ID',
    name: 'account_number',
    type: 'text',
    operatorOption: textfieldOptions,
  },
  // {
  //   label: 'System Filter',
  //   name: 'system_filter',
  //   type: 'system',
  //   options: [{ label: 'Touched Records', value: 'touched_records' }],
  // },
  {
    label: 'Sort Options',
    name: 'sort_options',
    type: 'system-sort',
    options: [{ value: 'createdAt_desc', label: 'Recently Created' }],
  },
];

export function processAccounts(
  accounts: AccountList[],
  colors: { bgColor: string; color: string }[]
): AccountList[] {
  if (!accounts || !Array.isArray(accounts) || colors.length === 0)
    return accounts;

  return accounts.map((account, index) => {
    const colorIndex = index % colors.length;
    const assignedColor = colors[colorIndex];

    return {
      ...account,
      bgColor: assignedColor.bgColor,
      color: assignedColor.color,
    };
  });
}
