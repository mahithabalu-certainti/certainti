import { AccountList, ConvertedAccount } from '../../types';
import { FieldConfig, StatusOptions } from '../../types/account-filter';

export const getAccountFilterFields = (
  countryOptions: string[],
  currencyOptions: string[]
): FieldConfig[] => [
  // { label: 'Parent Account', name: 'parent_account', type: 'text' },
  { label: 'Account ID', name: 'account_number', type: 'text' },
  { label: 'Account Name', name: 'account_name', type: 'text' },
  // { label: 'Record ID', name: 'account_id', type: 'text' },
  { label: 'Industry', name: 'industry', type: 'text' },
  {
    label: 'Country',
    name: 'country',
    type: 'multi-select',
    options: countryOptions,
  },
  {
    label: 'Currency',
    name: 'currency',
    type: 'multi-select',
    options: currencyOptions,
  },
  { label: 'Annual Revenue', name: 'annual_revenue', type: 'number' },
  { label: 'Status', name: 'status', type: 'status', options: StatusOptions },
  // { label: 'Primary Contact', name: 'primary_contact', type: 'text' },
  { label: 'Is Parent Account', name: 'is_parent_account', type: 'boolean' },
];

const colors = [
  { color: '#3348F7', bgColor: '#EBEDFF' },
  { color: '#F16137', bgColor: '#FDE7E1' },
  { color: '#E54787', bgColor: '#FBE3ED' },
  { color: '#2E5AAC', bgColor: '#EBF1F8' },
  { color: '#B62EB9', bgColor: '#F6E2F6' },
];

export function convertAccounts(
  inputAccounts: AccountList[]
): ConvertedAccount[] {
  const result: ConvertedAccount[] = [];

  // Shuffle the color palette to randomize the order
  const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
  let colorIndex = 0;

  // Helper function to get the next unique color
  function getNextColor() {
    const color = shuffledColors[colorIndex % shuffledColors.length];
    colorIndex++;
    return color;
  }

  // Helper function to process each account
  function processAccount(
    account: AccountList,
    parentAccountName: string | null = null
  ): void {
    const { color, bgColor } = getNextColor();

    const convertedAccount: ConvertedAccount = {
      accountId: account.rid,
      accountName: account.account_name,
      industry:
        account?.industry?.industry_name || account?.industry_name_other || '-',
      country: account.country?.country_name || '-',
      parentAccount: parentAccountName,
      totalProjects: account?.total_projects || '-',
      totalProjectHours: account?.total_project_hours || '-',
      totalProjectCost: account?.total_project_cost || '-',
      estimatedHours: account?.qualifying_project_hours_fed || '-',
      qre: account?.qualifying_project_qre_fed || '-',
      estimatedCredits: account?.qualifying_project_rd_credits_fed || '-',
      actualCredits: account?.total_projects_rd_credits || '-',
      financeExecutive: account?.finance_executive || '-',
      financeHead: account?.delivery_head || '-',
      professionalConsultant: account?.technical_consultant || '-',
      accountNumber: account.r_number,
      color,
      bgColor,
    };
    result.push(convertedAccount);

    // Process child accounts if they exist
    if (account.child_accounts && account.child_accounts.length > 0) {
      account.child_accounts.forEach((child) => {
        processAccount(child, account.account_name);
      });
    }
  }

  // Process each top-level account
  inputAccounts.forEach((account) => {
    processAccount(account);
  });

  return result;
}
