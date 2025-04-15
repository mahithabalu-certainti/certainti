import { FieldType, SelectOption } from '../consultant/types';

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
    anyOneRequired?:boolean,
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
  anyOneRequired:options.anyOneRequired
});

export const createTextAreaField = (
  name: string,
  label: string,
  options: {
    required?: boolean;
    regex?: RegExp;
    regexErrorMessage?: string;
    placeholder?: string;
  } = {}
): FieldType => ({
  type: 'textarea',
  name,
  label,
  required: options.required ?? false,
  regex: options.regex,
  regexErrorMessage: options.regexErrorMessage,
  placeholder: options.placeholder,
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
});

export const createDateField = (
  name: string,
  label: string,
  others: {
    required: boolean;
    disabled?: boolean;
    greaterThan?: Record<string, string>;
  }
): FieldType => ({
  type: 'date',
  name,
  label,
  required: others.required,
  placeholder: 'MM/DD/YYYY',
  disabled: others.disabled,
  greaterThan: others.greaterThan,
});

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
  POSTAL_CODE: /^\d{5}(-\d{4})?$/,
  MAX_AI_INTRACTION: /^[3-5]$/,
  NUMBERS: /^[0-9]+(\.[0-9]{1,2})?$/,
};
