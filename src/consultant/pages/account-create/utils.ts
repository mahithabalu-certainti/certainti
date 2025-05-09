import { AccountFormData, NewAccountData, SelectOption } from '../../types';

export const DATA_STORAGE_OPTIONS: SelectOption[] = [
  { label: 'Separate DB', value: 'separate_db' },
  { label: 'Store in Parent', value: 'store_in_parent' },
];

export const transformFormData = (
  formData: Partial<AccountFormData>,
  isEdit: boolean,
  industry_name?: string,
  account_rid?: string
): Partial<NewAccountData> => {
  const data: Partial<NewAccountData> = {
    account_id: account_rid,
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
    industry_rid: formData.industry_rid,
    industry_name,
    website: formData.website || null,
    project_manager: formData.project_manager,
    annual_revenue: Number((formData.annual_revenue ?? '').toString().replace(/[^\d.]/g, '')),
    data_storage: formData.data_storage,
  };
  if (isEdit) {
    data.account_rid = account_rid;
    data.r_number = account_rid;
  }
  return data;
};
