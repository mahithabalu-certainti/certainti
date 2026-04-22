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
  industryOptions: FilterSelectOption[],
  permissionMap?: Record<string, { read: boolean; edit: boolean }>
): FieldConfig[] => [
  {
    label: 'Account Name',
    name: 'account_name',
    type: 'text',
    operatorOption: textfieldOptions,
    hide:
      !permissionMap?.['account_name']?.read &&
      !permissionMap?.['account_name']?.edit,
  },
  {
    label: 'Industry',
    name: 'industry',
    type: 'enumSelect',
    options: industryOptions,
    operatorOption: industryOperator,
    hide:
      !permissionMap?.['industry_rid']?.read &&
      !permissionMap?.['industry_rid']?.edit,
  },
  {
    label: 'Country',
    name: 'country',
    type: 'enumSelect',
    options: countryOptions,
    hide:
      !permissionMap?.['country_rid']?.read &&
      !permissionMap?.['country_rid']?.edit,
  },
  {
    label: 'Total Projects',
    name: 'total_projects',
    type: 'number',
    hide:
      !permissionMap?.['total_projects']?.read &&
      !permissionMap?.['total_projects']?.edit,
  },
  {
    label: 'Total Project Hours',
    name: 'total_project_hours',
    type: 'number',
    hide:
      !permissionMap?.['total_project_hours']?.read &&
      !permissionMap?.['total_project_hours']?.edit,
  },
  {
    label: 'Total Cost',
    name: 'total_project_cost',
    type: 'number',
    hide:
      !permissionMap?.['total_project_cost']?.read &&
      !permissionMap?.['total_project_cost']?.edit,
  },
  {
    label: 'Estimated R&D Hours',
    name: 'qualifying_project_hours_fed',
    type: 'number',
    hide:
      !permissionMap?.['qualifying_project_hours_fed']?.read &&
      !permissionMap?.['qualifying_project_hours_fed']?.edit,
  },
  {
    label: 'QRE',
    name: 'qualifying_project_qre_fed',
    type: 'number',
    hide:
      !permissionMap?.['qualifying_project_qre_fed']?.read &&
      !permissionMap?.['qualifying_project_qre_fed']?.edit,
  },
  {
    label: 'Estimated R&D Credits',
    name: 'qualifying_project_rd_credits_fed',
    type: 'number',
    hide:
      !permissionMap?.['qualifying_project_rd_credits_fed']?.read &&
      !permissionMap?.['qualifying_project_rd_credits_fed']?.edit,
  },
  {
    label: 'Actual R&D Credits',
    name: 'total_projects_rd_credits',
    type: 'number',
    hide:
      !permissionMap?.['total_projects_rd_credits']?.read &&
      !permissionMap?.['total_projects_rd_credits']?.edit,
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
    hide:
      !permissionMap?.['finance_executive']?.read &&
      !permissionMap?.['finance_executive']?.edit,
  },
  {
    label: 'Finance Lead',
    name: 'finance_lead',
    type: 'text',
    operatorOption: keyOptions,
    hide:
      !permissionMap?.['finance_lead']?.read &&
      !permissionMap?.['finance_lead']?.edit,
  },
  {
    label: 'Professional Services Consultant',
    name: 'professional_services_consultant',
    type: 'text',
    operatorOption: keyOptions,
    hide:
      !permissionMap?.['professional_services_consultant']?.read &&
      !permissionMap?.['professional_services_consultant']?.edit,
  },
  {
    label: 'Account ID',
    name: 'account_number',
    type: 'text',
    operatorOption: textfieldOptions,
    hide:
      !permissionMap?.['r_number']?.read && !permissionMap?.['r_number']?.edit,
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
