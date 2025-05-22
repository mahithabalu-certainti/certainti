import { FieldConfig } from '../../../../consultant/types/account-filter';

export const getManageProfileFilterfields = (): FieldConfig[] => [
  { label: 'Profile Name', name: 'profile_name', type: 'text' },
  { label: 'Created On', name: 'created_datetime', type: 'date' },
  { label: 'Created By', name:'created_by', type: 'text' },
];