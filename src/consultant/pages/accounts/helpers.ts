import { AccountList, ConvertedAccount } from '../../types';

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
      country: account.country?.country_name || 'Unknown',
      currency: account.currency?.currency_code || 'Unknown',
      status: account.status === 'active' ? 'Active' : 'In Active',
      primaryContact: account.primary_contact_name || 'Unknown',
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
