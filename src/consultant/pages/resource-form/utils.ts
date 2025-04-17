import { AccountFormData, NewAccountData, SelectOption } from '../../types';
import { ResourceCostPayload, ResourceCostSkillFormData } from '../../types/resource-cost';
import { ResourceSkillPayload } from '../../types/resource-skill';
import { skillLevel } from '../account-details/sidebar-pages/resources/resource-skill/resource-skill-type';

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

export const transformCostData = (
  formData: Partial<ResourceCostSkillFormData>,
  isEdit: boolean
) => {
  const data: Partial<ResourceCostPayload> = {
    eid: '',
    // account_rid: formData.account_rid,
    resource_type: formData.resource_type,
    resource_rid: formData.resource_ref_id,
    resource_ref_id: formData.resource_ref_id,
    effective_date: formData.financial_start_date,
    end_date: formData.financial_end_date,
    annual_cost: Number(formData.annual),
    semi_annual_cost: Number(formData.semi_annual),
    monthly_cost: Number(formData.monthly),
    weekly_cost: Number(formData.weekly),
    bi_weekly_cost: Number(formData.bi_weekly),
    daily_cost: Number(formData.daily),
    hourly_cost: Number(formData.hourly),
    // fiscal_year: formData?.fiscal_year,
    // currency_rid: formData?.currency_rid,
    // accountNumber: formData?.accountNumber,
    status: formData?.status,
  };

  if (isEdit) {
    data.rid = formData.rid;
  }

  return data;
};

export const transformSkillData = (
  formData: Partial<ResourceCostSkillFormData>,
  isEdit: boolean
) => {
  const data: Partial<ResourceSkillPayload> = {
    eid: '',
    // account_rid: formData.account_rid,
    resource_type: formData.resource_type,
    resource_rid: formData.resource_ref_id,
    resource_ref_id: formData.resource_ref_id,
    // resource_desc: formData.resource_desc,
    start_date: formData.skill_start_date,
    skill_description: formData.skill_name,
    skill_level: formData.skill_level as skillLevel,
    years_of_experience: Number(formData.years_of_experience),
    // fiscal_year: formData.fiscal_year,
    skill_name: formData.skill_name,
    technical_weightage: '',
    // accountNumber: formData.accountNumber,
  };

  if (isEdit) {
    data.rid = formData.rid;
  }

  return data;
};
