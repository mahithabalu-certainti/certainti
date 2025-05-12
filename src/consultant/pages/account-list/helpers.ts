import { AccountList, ConvertedAccount } from '../../types';
import { FieldConfig } from '../../types/account-filter';

export const getAccountFilterfields = (countryOptions: string[], currencyOptions: string[]): FieldConfig[] => [
  { label: 'Parent Account', name: 'parent_account', type: 'text' },
  { label: 'Account Number', name: 'account_number', type: 'text' },
  { label: 'Account Name', name: 'account_name', type: 'text' },
  // { label: 'Record ID', name: 'account_id', type: 'text' },
  { label: 'Industry', name: 'industry', type: 'text' },
  { label: 'Country', name: 'country', type: 'multi-select', options: countryOptions },
  { label: 'Currency', name: 'currency', type: 'multi-select', options: currencyOptions },
  { label: 'Annual Revenue', name: 'annual_revenue', type: 'number' },
  { label: 'Status', name: 'status', type: 'status', options: ['Active', 'Inactive'] },
  { label: 'Primary Contact', name: 'primary_contact', type: 'text' },
  { label: 'Is Parent Account', name: 'is_parent_account', type: 'boolean' },
];

export function convertAccounts(
  inputAccounts: AccountList[]
): ConvertedAccount[] {
  const result: ConvertedAccount[] = [];

  // Helper function to process each account
  function processAccount(
    account: AccountList,
    parentAccountName: string | null = null
  ): void {
    const convertedAccount: ConvertedAccount = {
      accountName: account.account_name,
      accountId: account.rid,
      parentAccount: parentAccountName,
      accountNumber: account.r_number,
      industry: account.industry,
      country: account.country?.country_name || 'N/A',
      currency: account.currency?.currency_code || 'N/A',
      status: account.status === 'active' ? 'Active' : 'In Active',
      primaryContact: account.primary_contact_name || 'N/A',
      parentAccountID: account.parent_account_rid,
      annualRevenue: account.annual_revenue,
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
