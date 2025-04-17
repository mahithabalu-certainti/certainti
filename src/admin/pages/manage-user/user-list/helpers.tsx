import { FieldConfig } from '../../../../consultant/types/account-filter';

export const userFilterfields: FieldConfig[] = [
  { name: 'Full name', type: 'text' },
  { name: 'Email', type: 'text' },
  { name: 'Profile', type: 'text' },
  { name: 'Status', type: 'status', options: ['Active', 'Inactive'] },
];
