export interface FormType {
  sectionName: string;
  fillType: 'half' | 'full';
  fields: FormTypeFields[];
}

export interface FormTypeFields {
  type: InputType;
  name: string;
  label: string;
  required: boolean;
  value?: string;
  options?: selectOptions[];
  error?: string;
  placeholder?: string;
  regex?: string | RegExp;
  regexErrorMessage?: string;
  disabled?: boolean;
  greaterThan?: Record<string, string>;
  dependsRequired?: Record<string, string>;
  onChange?: boolean;
  isLoading?: boolean;
}

export interface selectOptions {
  label: string;
  value: string;
}

export type InputType =
  | 'text'
  | 'select'
  | 'autocomplete'
  | 'textarea'
  | 'checkbox'
  | 'date'
  | 'radio'
  | 'phone';

export interface SelectOption {
  label: string;
  value: string;
}

export interface FieldType {
  type: InputType;
  name: string;
  label: string;
  required: boolean;

  options?: SelectOption[];
  regex?: RegExp;
  regexErrorMessage?: string;
  placeholder?: string;

  disabled?: boolean;
  defaultValue?: string;
  greaterThan?: Record<string, string>;
  dependsRequired?: Record<string, string>;
  onChange?: boolean;
  isLoading?: boolean;
}

export type AllowedCountry = 'us' | 'ca' | 'gb' | 'ie' | 'se' | 'ro' | 'au' | 'fr';
