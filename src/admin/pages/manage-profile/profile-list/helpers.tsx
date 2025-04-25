import { FieldConfig } from '../../../../consultant/types/account-filter';

export const getManageProfileFilterfields = (): FieldConfig[] => [
  { label: 'Profile Name', name: 'profileName', type: 'text' },
];
