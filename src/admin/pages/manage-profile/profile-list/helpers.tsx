import { FieldConfig } from '../../../../consultant/types/account-filter';

export const getManageProfileFilterfields = (): FieldConfig[] => [
  { label: 'Profile Name', name: 'profileName', type: 'text' },
  { label: 'Created On', name: 'createdOn', type: 'text' },
  { label: 'Created By', name: 'createdBy', type: 'text' },
];
