import { Account, AccountColumn, Column } from '../../../types/account';

export const columns: Column<Account>[] = [
  { id: 'accountName', label: 'Account Name', sortable: false },
  { id: 'accountId', label: 'Account ID', sortable: false },
  { id: 'parentAccount', label: 'Parent Account', sortable: false },
  { id: 'accountNumber', label: 'Account Number', sortable: false },
  { id: 'industry', label: 'Industry', sortable: true },
  { id: 'country', label: 'Country', sortable: true },
  { id: 'currency', label: 'Currency', sortable: true },
  { id: 'status', label: 'Status', sortable: false },
];

export const accountColumns: AccountColumn[] = [
  {
    id: 'account_name',
    sortId: 'account_name',
    label: 'Account Name',
    width: '300px',
    sortable: true,
    sx: {
      position: 'sticky',
      left: '32px',
      background: '#fff',
      zIndex: 10,
      borderRight: '1px solid #CBD6E2',
      borderBottom: '1px solid #CBD6E2 !important',
    }
  },
  {
    id: 'is_parent',
    sortId: 'is_parent',
    label: 'Parent Account',
    width: '200px',
    sortable: true
  },
  {
    id: 'r_number',
    sortId: 'r_number',
    label: 'Account ID',
    width: '180px',
    sortable: true
  },
  {
    id: 'industry',
    sortId: 'industry',
    label: 'Industry',
    width: '200px',
    sortable: true
  },
  {
    id: 'country',
    sortId: 'country',
    label: 'Country',
    width: '150px',
    sortable: true
  },
  {
    id: 'currency',
    sortId: 'currency',
    label: 'Currency',
    width: '100px',
    sortable: true
  },
  {
    id: 'annual_revenue',
    sortId: 'annual_revenue',
    label: 'Annual Revenue',
    width: '160px',
    sortable: true
  },
  {
    id: 'status',
    sortId: 'status',
    label: 'Status',
    width: '100px',
    sortable: true
  },
];