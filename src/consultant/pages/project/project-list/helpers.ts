import { FieldConfig } from "../../../types/account-filter";

export const getProjectFilterFields = (): FieldConfig[] => [
  { label: 'Account Number', name: 'account_number', type: 'text' },
  { label: 'Account Name', name: 'account_name', type: 'text' },
  { label: 'Project Number', name: 'project_number', type: 'text' },
  { label: 'Project Ref ID', name: 'project_ref_id', type: 'text' },
  { label: 'Industry', name: 'industry', type: 'text' },
  { label: 'Project Type', name: 'project_type', type: 'enum' },
  { label: 'Project Classification', name: 'project_classification', type: 'text' },
  { label: 'Project Client Group', name: 'project_client_group', type: 'text' },
  { label: 'Project Group', name: 'project_group', type: 'text' },
  { label: 'Status', name: 'status', type: 'enum' }
];