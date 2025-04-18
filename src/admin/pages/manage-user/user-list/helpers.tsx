import { FieldConfig } from '../../../../consultant/types/account-filter';

export const getUserFilterfields = (userProfiles: string[]): FieldConfig[] => [
  { name: 'Username', type: 'text' },
  { name: 'Full name', type: 'text' },
  { name: 'Email', type: 'text' },
  { name: 'Profile', type: 'multi-select', options: userProfiles },
  { name: 'Status', type: 'status', options: ['Active', 'Inactive'] },
];
