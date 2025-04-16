import { AccountFormData, NewAccountData, SelectOption } from '../../types';

export const transformFormData = (
  formData: Partial<AccountFormData>,
  isEdit: boolean
): Partial<NewAccountData> => {
  const data: Partial<NewAccountData> = {
    account_id: formData.rid,
    account_name: formData.account_name,
    account_description: formData.account_description || null,
    status: formData.status,
    is_parent: formData.is_parent === 'yes',
    parent_account_rid: formData.parent_account_rid || null,
    account_currency_rid: formData.currency_rid,
    account_country_rid: formData.country_rid,
    account_country_region_rid: formData.region,
    max_ai_interactions: Number(formData.max_ai_interactions),
    autosend_interaction: formData.autosend_interaction === 'yes',
    auto_access_rd: formData.auto_access_rd === 'yes',
    fiscal_start_date: formData.fiscal_start_date,
    fiscal_end_date: formData.fiscal_end_date,
    blended_rate_fte: formData.blended_rate_fte || null,
    blended_rate_subcon: formData.blended_rate_subcon || null,
    primary_contact_name: formData.primary_contact_name,
    primary_contact_email: formData.primary_contact_email,
    primary_contact_number: formData.primary_contact_number,
    finance_poc_name: formData.finance_poc_name,
    finance_poc_email: formData.finance_poc_email,
    finance_poc_number: formData.finanace_poc_number,
    industry: formData.industry,
    website: formData.website || null,
    project_manager: formData.project_manager,
    annual_revenue: Number(formData.annual_revenue),
    data_storage: formData.data_storage,
  };
  if (isEdit) {
    data.account_rid = formData.rid;
    data.r_number = formData.rid;
  }
  return data;
};

export const statusOption: SelectOption[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

export const resourceTypeOption: SelectOption[] = [
  { label: 'Full Time', value: 'FullTime' },
  { label: 'Contract', value: 'Contract' },
];

export const frequencyOption: SelectOption[] = [
  { label: 'Annual', value: 'annual' },
  { label: 'Semi Annual', value: 'semi_annual' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Bi-Weekly', value: 'bi_weekly' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Daily', value: 'daily' },
  { label: 'Hourly', value: 'hourly' },
];
