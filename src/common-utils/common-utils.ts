import dayjs from 'dayjs';
import { UserDetail } from '../admin/types/manage-user';
import { AxiosErrorMsg, CheckError } from '../common-service';
import { AllowedCountry, FieldType, SelectOption } from '../consultant/types';

export const createTextField = (
  name: string,
  label: string,
  options: {
    required?: boolean;
    regex?: RegExp;
    regexErrorMessage?: string;
    placeholder?: string;
    disabled?: boolean;
    onChange?: boolean;
    anyOneRequired?: boolean;
    hide?: boolean;
    lengthRequired?: {
      key: string;
      minMatchedValue: RegExp;
      maxMatchedValue: RegExp;
      minErrorMessage: string;
      maxErrorMessage: string;
    };
  } = {}
): FieldType => ({
  type: 'text',
  name,
  label,
  required: options.required ?? false,
  regex: options.regex,
  regexErrorMessage: options.regexErrorMessage,
  placeholder: options.placeholder,
  disabled: options.disabled,
  onChange: options.onChange,
  anyOneRequired: options.anyOneRequired,
  hide: options.hide,
  lengthRequired: options.lengthRequired,
});

export const createPhoneInputField = (
  name: string,
  label: string,
  options: {
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    onChange?: boolean;
  } = {}
): FieldType => ({
  type: 'phone',
  name,
  label,
  required: options.required ?? false,
  placeholder: options.placeholder,
  disabled: options.disabled,
  onChange: options.onChange,
});

export const createTextAreaField = (
  name: string,
  label: string,
  options: {
    required?: boolean;
    regex?: RegExp;
    regexErrorMessage?: string;
    placeholder?: string;
    disabled?: boolean;
  } = {}
): FieldType => ({
  type: 'textarea',
  name,
  label,
  required: options.required ?? false,
  regex: options.regex,
  regexErrorMessage: options.regexErrorMessage,
  placeholder: options.placeholder,
  disabled: options.disabled,
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

export const createSelectField = (
  name: string,
  label: string,
  others: {
    options: SelectOption[];
    required: boolean;
    placeholder?: string;
    disabled?: boolean;
    dependsRequired?: Record<string, string>;
    onChange?: boolean;
    isLoading?: boolean;
    resetDependsFields?: string[];
  }
): FieldType => ({
  type: 'select',
  name,
  label,
  required: others.required,
  options: others.options,
  disabled: others.disabled,
  placeholder: others.placeholder,
  dependsRequired: others.dependsRequired,
  onChange: others.onChange,
  isLoading: others.isLoading,
  resetDependsFields: others.resetDependsFields,
});

export const createDateField = (
  name: string,
  label: string,
  others: {
    required: boolean;
    disabled?: boolean;
    disableFutureDates?: boolean;
    minDate?: Date;
    maxDate?: Date;
    endDateValue?: boolean;
    startDateLabel?: string;
    endDateLabel?: string;
    greaterThan?: Record<string, string>;
    dateRangeError?: boolean;
    startValue?: boolean;
    errorMessage?: string;
  }
): FieldType => ({
  type: 'date',
  name,
  label,
  required: others.required,
  placeholder: 'MM/DD/YYYY',
  minDate: others.minDate,
  maxDate: others.maxDate,
  disabled: others.disabled,
  disableFutureDates: others.disableFutureDates,
  greaterThan: others.greaterThan,
  dateRangeError: others.dateRangeError,
  startValue: others.startValue,
  endDateValue: others.endDateValue,
  startDateLabel: others.startDateLabel,
  endDateLabel: others.endDateLabel,
  errorMessage: others.errorMessage,
});

export const createFiscalDateField = (
  name: string,
  label: string,
  others: {
    required: boolean;
    disabled?: boolean;
    greaterThan?: Record<string, string>;
    differentThan?: Record<string, string>;
  }
): FieldType => ({
  type: 'fiscalDate',
  name,
  label,
  required: others.required,
  disabled: others.disabled,
  greaterThan: others.greaterThan,
  differentThan: others.differentThan,
});

export const YES_NO_OPTIONS: SelectOption[] = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

// Regex patterns
export const REGEX_PATTERNS = {
  ALPHANUMERIC: /^[A-Za-z0-9-]+$/,
  LETTERS_SPACES: /^[A-Za-z\s]+$/,
  ACCOUNT_NAME: /^[A-Za-z0-9 &'.,-]+$/,
  LETTERS_5_TO_25: /^[A-Za-z\s]{5,25}$/,
  LETTERS_3_TO_25: /^(?!.*\s{2,-'})[A-Za-z\s]{3,25}$/,
  LETTERS_1_TO_100: /^[\s\S]{1,100}$/,
  ALPHANUMERIC_SPEC_5_TO_50: /^[\s\S]{5,50}$/,
  EMAIL:
    /^(?!.*[._%+]{2})[a-zA-Z0-9](?:[a-zA-Z0-9._-]{0,62}[a-zA-Z0-9])?@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^([0-9]{10})$/,
  WEBSITE:
    /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]{1,50}(\.[a-zA-Z]{2,})+(\/[^\s]*)?$/i,
  DATA_RESIDENCY: /^[A-Za-z0-9\s-]+$/,
  NUMBER_OPTIONAL_DECIMAL: /^([0-9]{1,10}(\.[0-9]{1,2})?)?$/,
  DESCRIPTION: /^.{0,500}$/,
  RESOURCE_DESCRIPTION: /^.{0,1000}$/,
  ACCOUNT_DESCRIPTION: /^.{0,500}$/,
  POSTAL_CODE: /^[A-Za-z0-9\s-]{3,9}$/,
  MAX_AI_INTRACTION: /^[3-5]$/,
  NUMBERS: /^[0-9]{1,20}$/,
  NUMBERS_50: /^[0-9]{5,50}$/,
  ANNUAL_REVENUE: /^(\d{1,3}(,\d{3})+|\d{1,2}(,\d{2}){1,2},\d{3}|\d+)(\.\d+)?$/,
  COST_REGEX: /^\d{1,3}(?:,\d{2,3})*(\.\d{1,2})?$|^\d{1,10}(\.\d{1,2})?$/,
  NAME_REGEX: /^[A-Za-z\s'-]+$/,
  STREET_REGEX: /^(?![\W_]+$)(?!\s*$)[\w\W]{3,200}$/,
  CITY_REGEX: /^[A-Za-z\s]{3,100}$/,
  NUMBERS_GREATER_THAN_ZERO: /^[1-9]\d*$/,
  MANAGER_REGEX: /^[A-Za-z0-9\s.'-]*$/,
  MIN_NAME_REGEX: /^.{3,}$/,
  MAX_NAME_REGEX: /^.{0,50}$/,
  MIN_ACCOUNT_NAME_REGEX: /^.{7,}$/,
  MAX_ACCOUNT_NAME_REGEX: /^.{0,25}$/,
  MAX_EMAIL_REGEX: /^.{0,254}$/,
};

/**
 * Resource Form Field Regex Patterns
 *
 * Each pattern is optimized for its specific field requirements with:
 * - Exact character allowances
 * - Proper length validation
 * - Prevention of edge cases
 */

export const RESOURCE_REGEX = {
  // Full Name: Alphanumeric with hyphen/apostrophe, 3-100 chars
  FULL_NAME:
    /^(?=[\s\S]{3,200}$)(?=.*[a-zA-Z])(?!^\d+$)(?!^[^\w\s]+$)(?!^\s+$)[\w\s\-,.!?@#$%^&*()+=;:'"/\\<>{}[\]|~`]+$/,

  // Organization Name: Extended chars for org names, 4-100 chars
  ORG_NAME:
    /^(?=[\s\S]{3,100}$)(?=.*[a-zA-Z])(?!^\d+$)(?!^[^\w\s]+$)(?!^\s+$)[\w\s\-,.!?@#$%^&*()+=;:'"/\\<>{}[\]|~`]+$/,

  // Email: Standard format with length limit
  EMAIL: /^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // Mobile: International phone format, 5-15 digits
  MOBILE: /^\+?[0-9][0-9\- ]{3,14}[0-9]$/,

  // Manager Name: Alphanumeric with titles, 3-100 chars
  MANAGER_NAME: /^(?=(.*[a-zA-Z0-9]){3})[a-zA-Z0-9][a-zA-Z0-9 .'-]{1,99}$/,

  // Designation: Job titles with special chars, 4-100 chars
  ROLE: /^(?=[\s\S]{4,100}$)(?=.*[a-zA-Z])(?!^\d+$)(?!^[^\w\s]+$)(?!^\s+$)[\w\s\-,.!?@#$%^&*()+=;:'"/\\<>{}[\]|~`]+$/,

  DESIGNATION:
    /^(?=[\s\S]{4,100}$)(?=.*[a-zA-Z])(?!^\d+$)(?!^[^\w\s]+$)(?!^\s+$)[\w\s\-,.!?@#$%^&*()+=;:'"/\\<>{}[\]|~`]+$/,

  // Years Experience: Non-negative integers
  YEARS_EXPERIENCE: /^[0-9]{1,2}$/,

  // Description: Multiline text, 0-1000 chars
  DESCRIPTION: /^[\s\S]{0,1000}$/,

  // Status/Type: For enum validation
  ENUM_VALIDATION: /^(Active|Inactive|Full-time|Contract|Mandatory)$/,

  // Country: Standard name validation
  COUNTRY:
    /^(?![\s-])(?!.*[\s-]{2})[A-Za-zÀ-ÖØ-öø-ÿ\s-]{2,49}[A-Za-zÀ-ÖØ-öø-ÿ]$/,

  // Date Validation (format only)
  DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/,
};

export const ALLOWED_COUNTRIES: AllowedCountry[] = [
  'us',
  'ca',
  'gb',
  'ie',
  'se',
  'ro',
  'au',
  'fr',
];

export const fiscalYears = Array.from({ length: 6 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year.toString(), label: `FY-${year}` };
});

export const checkError = (data: CheckError[]) => {
  return data.some((value) => value.isError === true);
};

export const errorHandling = (data: AxiosErrorMsg): string => {
  const errorData = data.response?.data;
  return `<p>${
    errorData?.statusMessage
      ? typeof errorData.statusMessage === 'object'
        ? Object.values(errorData.statusMessage).join(', ')
        : errorData.statusMessage || ''
      : errorData?.message || data.message
  }</p>`;
};

export const formatAddress = (userDatas?: UserDetail) => {
  const addressParts = [
    userDatas?.street,
    userDatas?.city,
    userDatas?.state_name,
    userDatas?.zip_code,
    userDatas?.country_name,
  ].filter(Boolean);
  return addressParts.join(', ');
};

export const getDateTimeFormat = (date?: string) => {
  if (!date) return '';
  return dayjs(date).format('MM-DD-YYYY HH:mm:ss');
};
