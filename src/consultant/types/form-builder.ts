export interface FormType {
  sectionName: string;
  fillType: 'half' | 'full';
  fields: FormTypeFields[];
  hide?: boolean;
}

export interface FormTypeFields {
  type: InputType;
  name: string;
  label: string;
  required: boolean;
  value?: string;
  minDate?: Date;
  maxDate?: Date;
  options?: SelectOption[];
  error?: string;
  placeholder?: string;
  regex?: string | RegExp;
  regexErrorMessage?: string;
  disabled?: boolean;
  greaterThan?: Record<string, string>;
  differentThan?: Record<string, string>;
  dependsRequired?: Record<string, string>;
  resetDependsFields?: string[];
  lengthRequired?: {
    key: string;
    minMatchedValue: RegExp;
    maxMatchedValue: RegExp;
    minErrorMessage: string;
    maxErrorMessage: string;
  };
  onChange?: boolean;
  anyOneRequired?: boolean;
  hide?: boolean;
  isLoading?: boolean;
}

// export interface SelectOptions {
//   label: string;
//   value: string;
// }

export type InputType =
  | 'text'
  | 'select'
  | 'autocomplete'
  | 'textarea'
  | 'checkbox'
  | 'date'
  | 'radio'
  | 'phone'
  | 'fiscalDate';

export interface SelectOption {
  label: string;
  value: string;
}

export interface FieldType {
  type: InputType;
  name: string;
  label: string;
  required: boolean;
  minDate?: Date;
  maxDate?: Date;
  options?: SelectOption[];
  regex?: RegExp;
  regexErrorMessage?: string;
  placeholder?: string;

  disabled?: boolean;
  defaultValue?: string;
  greaterThan?: Record<string, string>;
  differentThan?: Record<string, string>;
  dependsRequired?: Record<string, string>;
  resetDependsFields?: string[];
  hide?: boolean;
  lengthRequired?: {
    key: string;
    minMatchedValue: RegExp;
    maxMatchedValue: RegExp;
    minErrorMessage: string;
    maxErrorMessage: string;
  };
  onChange?: boolean;
  anyOneRequired?: boolean; // financial information error handling
  isLoading?: boolean;
}

export type AllowedCountry =
  | 'us'
  | 'ca'
  | 'gb'
  | 'ie'
  | 'se'
  | 'ro'
  | 'au'
  | 'fr';
