import { AccountList, ConvertedAccount } from '../../types';
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

export function convertAccounts(
  inputAccounts: AccountList[],
  colorCodes: { color: string; bgColor: string }[] = []
): ConvertedAccount[] {
  const result: ConvertedAccount[] = [];

  let colorIndex = 0;

  function getNextColor() {
    const color = colorCodes[colorIndex % colorCodes.length];
    colorIndex++;
    return color;
  }

  function processAccount(
    account: AccountList,
    parentAccountName: string | null = null,
    isTopLevel: boolean = false
  ): void {
    const colorProps = isTopLevel
      ? getNextColor()
      : { color: undefined, bgColor: undefined };

    const convertedAccount: ConvertedAccount = {
      accountId: account.rid,
      accountName: account.account_name,
      industry:
        account?.industry?.industry_name || account?.industry_name_other || '-',
      country: account.country?.country_name || '-',
      parentAccount: parentAccountName,
      totalProjects: account?.total_projects || '-',
      totalProjectHours: account?.total_project_hours || '-',
      totalProjectCost: account?.total_project_cost,
      estimatedHours: account?.qualifying_project_hours_fed || '-',
      qre: account?.qualifying_project_qre_fed,
      estimatedCredits: account?.qualifying_project_rd_credits_fed,
      actualCredits: account?.total_projects_rd_credits,
      financeExecutive: account?.finance_executive || '-',
      financeHead: account?.finance_lead || '-',
      professionalConsultant: account?.professional_services_consultant || '-',
      accountNumber: account.r_number,
      projectsByYear: account.projects_by_fiscal_year || [],
      currency: account?.currency?.currency_symbol || '',
      ...colorProps,
    };

    result.push(convertedAccount);

    if (account.child_accounts && account.child_accounts.length > 0) {
      account.child_accounts.forEach((child) => {
        processAccount(child, account.account_name, false);
      });
    }
  }

  inputAccounts.forEach((account) => {
    processAccount(account, null, true); // mark top-level
  });

  return result;
}
