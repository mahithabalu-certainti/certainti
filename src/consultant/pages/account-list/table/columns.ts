import { Account, Column } from '../../../types/account';

export const columns: Column<Account>[] = [
  { id: 'accountName', label: 'Account Name', sortable: false },
  { id: 'accountId', label: 'Account ID', sortable: false },
  { id: 'parentAccount', label: 'Parent Account', sortable: false },
  { id: 'accountNumber', label: 'Account Number', sortable: false },
  { id: 'industry', label: 'Industry', sortable: true },
  { id: 'country', label: 'Country', sortable: true },
  { id: 'currency', label: 'Currency', sortable: true },
  { id: 'status', label: 'Status', sortable: false },
  { id: 'primaryContact', label: 'Primary Contact', sortable: false },
];
