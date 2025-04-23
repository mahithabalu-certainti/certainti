import { FieldConfig } from '../../../../consultant/types/account-filter';

export const getUserFilterfields = (userProfiles: string[]): FieldConfig[] => [
  { label: 'Username', name: 'username', type: 'text' },
  { label: 'Full name', name: 'full_name', type: 'text' },
  { label: 'Email', name: 'email', type: 'text' },
  { label: 'Profile', name: 'profile', type: 'multi-select', options: userProfiles },
  { label: 'Status', name: 'status', type: 'status', options: ['Active', 'Inactive'] },
];
