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
      accountName: account.account_name,
      accountId: account.rid,
      parentAccount: parentAccountName,
      accountNumber: account.r_number,
      industry:
        account?.industry?.industry_name || account?.industry_name_other || '-',
      country: account.country?.country_name || '-',
      currency: account.currency?.currency_code || '-',
      status: account.status === 'active' ? 'Active' : 'In Active',
      primaryContact: account.primary_contact_name || '-',
      parentAccountID: account.parent_account_rid,
      annualRevenue: account.annual_revenue,
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
