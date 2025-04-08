import { SelectOption } from '../types';

export const mockDesignationOptions: SelectOption[] = [
  { label: 'Software Engineer', value: 'software_engineer' },
  { label: 'Senior Software Engineer', value: 'senior_software_engineer' },
  { label: 'Team Lead', value: 'team_lead' },
  { label: 'Project Manager', value: 'project_manager' },
  { label: 'Product Manager', value: 'product_manager' },
  { label: 'UX Designer', value: 'ux_designer' },
  { label: 'QA Engineer', value: 'qa_engineer' },
  { label: 'DevOps Engineer', value: 'devops_engineer' },
];

export const mockResourceStatusOptions: SelectOption[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'On Leave', value: 'on_leave' },
  { label: 'Terminated', value: 'terminated' },
  { label: 'Onboarding', value: 'onboarding' },
];

export const mockStatusOptions: SelectOption[] = [
  { label: 'Approved', value: 'approved' },
  { label: 'Pending', value: 'pending' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
];

export const mockCostFrequencyOptions: SelectOption[] = [
  { label: 'Hourly', value: 'hourly' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Annually', value: 'annually' },
  { label: 'Project-based', value: 'project_based' },
];
