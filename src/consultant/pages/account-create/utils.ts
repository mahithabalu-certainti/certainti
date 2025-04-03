/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AccountFormData,
  FieldType,
  NewAccountData,
  SelectOption,
} from '../../types';

export const createTextField = (
  name: string,
  label: string,
  options: {
    required?: boolean;
    regex?: RegExp;
    regexErrorMessage?: string;
    placeholder?: string;
    disabled?: boolean
  } = {}
): FieldType => ({
  type: 'text',
  name,
  label,
  required: options.required ?? false,
  regex: options.regex,
  regexErrorMessage: options.regexErrorMessage,
  placeholder: options.placeholder,
  disabled: options.disabled
});

export const createSelectField = (
  name: string,
  label: string,
  options: SelectOption[],
  disabled?: boolean,
  required = true,
  dependsRequired?: Record<string, string>
): FieldType => ({
  type: 'select',
  name,
  label,
  required,
  options,
  disabled,
  dependsRequired
});

export const createDateField = (
  name: string,
  label: string,
  disabled?: boolean,
  greaterThan?: Record<string, string>,
  required = true
): FieldType => ({
  type: 'date',
  name,
  label,
  required,
  placeholder: 'MM/DD/YYYY',
  disabled,
  greaterThan,
});

export const createTextAreaField = (
  name: string,
  label: string,
  options: {
    required?: boolean;
    regex?: RegExp;
    regexErrorMessage?: string;
  } = {}
): FieldType => ({
  type: 'textarea',
  name,
  label,
  required: options.required ?? false,
  regex: options.regex,
  regexErrorMessage: options.regexErrorMessage,
});

export const createCheckboxField = (
  name: string,
  label: string,
  options: {
    required?: boolean;
    checkboxOptions: SelectOption[];
    defaultValue?: string;
  }
): FieldType => ({
  type: 'checkbox',
  name,
  label,
  required: options.required ?? false,
  options: options.checkboxOptions,
  defaultValue: options.defaultValue,
});

export const createRadioField = (
  name: string,
  label: string,
  options: {
    required?: boolean;
    radioOptions: SelectOption[];
    defaultValue?: string;
    disabled?: boolean;
  }
): FieldType => ({
  type: 'radio',
  name,
  label,
  required: options.required ?? false,
  options: options.radioOptions,
  disabled: options.disabled,
});

export const STATUS_OPTIONS: SelectOption[] = [
  { label: 'Active', value: 'active' },
  { label: 'In-Active', value: 'inactive' },
];

export const DATA_STORAGE_OPTIONS: SelectOption[] = [
  { label: 'Separate DB', value: 'separate_db' },
  { label: 'Store in DB', value: 'store_in_parent' },
];

export const YES_NO_OPTIONS: SelectOption[] = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

// Regex patterns
export const REGEX_PATTERNS = {
  ALPHANUMERIC: /^[A-Za-z0-9-]+$/,
  LETTERS_SPACES: /^[A-Za-z\s]+$/,
  ACCOUNT_NAME: /^[A-Za-z-\s]{7,25}$/,
  LETTERS_5_TO_25: /^[A-Za-z-\s]{5,25}$/,
  LETTERS_3_TO_25: /^[A-Za-z-\s]{3,25}$/,
  EMAIL: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,
  PHONE: /^([0-9]{10})$/,
  WEBSITE: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  DATA_RESIDENCY: /^[A-Za-z0-9\s-]+$/,
  NUMBER_OPTIONAL_DECIMAL: /^([0-9]{1,10}(\.[0-9]{1,2})?)?$/,
  DESCRIPTION: /^.{0,500}$/,
};

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
